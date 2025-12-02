import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enrichJobDescription, extractCompanyInfo } from '@/lib/ai';
import {
  scrapeCompanyWebsite,
  generateActionableInsights,
  findCompanyContacts,
} from '@/lib/web-scraper';
import { getContactIntelligence } from '@/lib/contact-discovery';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('[Enrichment] Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[Enrichment] Request body:', {
      hasJobId: !!body.jobId,
      hasDescription: !!body.description,
      hasCompany: !!body.company,
      hasTitle: !!body.title
    });

    const { jobId, description, company, title } = body;

    if (!jobId || !description) {
      console.error('[Enrichment] Missing required fields:', { jobId: !!jobId, description: !!description });
      return NextResponse.json(
        { error: 'Missing required fields: jobId and description are required' },
        { status: 400 }
      );
    }

    // Fetch job title if not provided
    let jobTitle = title;
    if (!jobTitle) {
      const { data: job } = await supabase
        .from('jobs')
        .select('title')
        .eq('id', jobId)
        .single();
      jobTitle = job?.title || 'Position';
    }

    console.log('[Enrichment] Starting enhanced enrichment for:', company);

    // Extract emails from job description
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailsInDescription = description.match(emailRegex) || [];
    console.log('[Enrichment] Found emails in description:', emailsInDescription);

    // Run all enrichment tasks in parallel for speed
    const [jobInfo, companyInfo, companyData] = await Promise.all([
      enrichJobDescription(description),
      extractCompanyInfo(company, description),
      scrapeCompanyWebsite(company),
    ]);

    // Generate actionable insights and discover contacts
    const [actionableInsights, contactStrategies, contactIntelligence] = await Promise.all([
      generateActionableInsights(
        company,
        jobTitle,
        companyData,
        description
      ),
      findCompanyContacts(
        company,
        companyInfo.department || 'Unknown',
        jobTitle
      ),
      getContactIntelligence(
        company,
        jobTitle,
        companyInfo.department || 'Unknown',
        companyData.websiteUrl ? (
          (() => {
            try {
              return new URL(companyData.websiteUrl).hostname;
            } catch {
              return null;
            }
          })()
        ) : null
      ),
    ]);

    const extractedData = {
      // Original enrichment data
      summary: jobInfo.summary,
      skills: jobInfo.skills,
      responsibilities: jobInfo.responsibilities,
      seniority: jobInfo.seniority,
      remote: jobInfo.remote,
      industry: companyInfo.industry,
      companySize: companyInfo.size,
      hiringManager: companyInfo.hiringManager,
      department: companyInfo.department,

      // NEW: Company research data
      companyWebsite: companyData.websiteUrl,
      companyAbout: companyData.aboutText,
      companyNews: companyData.recentNews,
      companyTechStack: companyData.techStack,
      companyValues: companyData.companyValues,
      companyTeamSize: companyData.teamSize,
      companyFounded: companyData.foundingYear,
      companyHQ: companyData.headquarters,

      // NEW: Actionable insights
      whyThisMatters: actionableInsights.whyThisMatters,
      talkingPoints: actionableInsights.talkingPoints,
      nextSteps: actionableInsights.nextSteps,
      emailSubjectLines: actionableInsights.emailSubjectLines,
      interviewQuestions: actionableInsights.interviewQuestions,

      // NEW: Contact discovery
      suggestedRoles: contactStrategies.suggestedRoles,
      searchStrategies: contactStrategies.searchStrategies,
      linkedInSearchUrl: contactStrategies.linkedInSearchUrl,

      // NEW: Contact intelligence
      hiringManagerName: contactIntelligence.hiringManager.name,
      hiringManagerTitle: contactIntelligence.hiringManager.title,
      hiringManagerEmails: contactIntelligence.hiringManager.emails,
      hiringManagerLinkedIn: contactIntelligence.hiringManager.linkedin,
      hiringManagerReasoning: contactIntelligence.hiringManager.reasoning,
      teamContacts: contactIntelligence.teamContacts,
      emailPatterns: contactIntelligence.emailPatterns,
      totalContactsFound: contactIntelligence.totalContactsFound,
    };

    const { error } = await supabase
      .from('jobs')
      .update({
        extracted_description: JSON.stringify(extractedData),
        ai_enriched_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('user_id', user.id);

    if (error) throw error;

    // AUTO-SAVE DISCOVERED CONTACTS TO DATABASE
    console.log('[Enrichment] Saving discovered contacts...');

    // Save hiring manager if we have a name
    if (contactIntelligence.hiringManager.name) {
      const primaryEmail = contactIntelligence.hiringManager.emails.find(e => e.confidence === 'confirmed' || e.confidence === 'high');

      const contactData = {
        user_id: user.id,
        job_id: jobId,
        name: contactIntelligence.hiringManager.name,
        title: contactIntelligence.hiringManager.title,
        email: primaryEmail?.email || null,
        source: contactIntelligence.hiringManager.linkedin || 'AI Discovery',
        notes: `${contactIntelligence.hiringManager.reasoning}\n\nEmail suggestions:\n${contactIntelligence.hiringManager.emails.map(e => `- ${e.email} (${e.confidence} confidence)`).join('\n')}`,
      };

      const { error: hmError } = await supabase.from('contacts').upsert(contactData, {
        onConflict: primaryEmail?.email ? 'user_id,job_id,email' : 'user_id,job_id,name',
        ignoreDuplicates: false,
      });

      if (hmError) {
        console.error('[Enrichment] Failed to save hiring manager:', hmError);
      } else {
        console.log('[Enrichment] Saved hiring manager:', contactIntelligence.hiringManager.name);
      }
    }

    // Save other team contacts
    let savedCount = 0;
    for (const contact of contactIntelligence.teamContacts.slice(0, 5)) { // Limit to top 5
      if (contact.email || contact.name) {
        const contactData = {
          user_id: user.id,
          job_id: jobId,
          name: contact.name,
          title: contact.title,
          email: contact.email || null,
          source: contact.source || 'AI Discovery',
          notes: contact.linkedin ? `LinkedIn: ${contact.linkedin}` : null,
        };

        const { error: contactError } = await supabase.from('contacts').upsert(contactData, {
          onConflict: contact.email ? 'user_id,job_id,email' : 'user_id,job_id,name',
          ignoreDuplicates: true,
        });

        if (contactError) {
          console.error('[Enrichment] Failed to save contact:', contact.name, contactError);
        } else {
          savedCount++;
        }
      }
    }

    console.log('[Enrichment] Saved', savedCount, 'team contacts');

    // Save emails found in job description
    let emailCount = 0;
    for (const email of emailsInDescription) {
      const { error: emailError } = await supabase.from('contacts').upsert({
        user_id: user.id,
        job_id: jobId,
        name: `Contact (${email.split('@')[0]})`,
        email: email,
        source: 'Job Posting',
        notes: 'Email found in job description',
      }, {
        onConflict: 'user_id,job_id,email',
        ignoreDuplicates: true,
      });

      if (!emailError) {
        emailCount++;
      }
    }

    if (emailCount > 0) {
      console.log('[Enrichment] Saved', emailCount, 'emails from job description');
    }

    console.log('[Enrichment] Successfully enriched job with actionable data and saved contacts');
    return NextResponse.json({ success: true, data: extractedData });
  } catch (error) {
    console.error('[Enrichment] Fatal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[Enrichment] Error details:', { message: errorMessage, stack: errorStack });
    return NextResponse.json(
      { error: `Failed to enrich job data: ${errorMessage}` },
      { status: 500 }
    );
  }
}
