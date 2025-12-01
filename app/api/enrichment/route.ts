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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId, description, company, title } = await request.json();

    if (!jobId || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
        companyData.websiteUrl ? new URL(companyData.websiteUrl).hostname : null
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

      await supabase.from('contacts').upsert({
        user_id: user.id,
        job_id: jobId,
        name: contactIntelligence.hiringManager.name,
        title: contactIntelligence.hiringManager.title,
        email: primaryEmail?.email || null,
        source: contactIntelligence.hiringManager.linkedin || 'AI Discovery',
        notes: `${contactIntelligence.hiringManager.reasoning}\n\nEmail suggestions:\n${contactIntelligence.hiringManager.emails.map(e => `- ${e.email} (${e.confidence} confidence)`).join('\n')}`,
      }, {
        onConflict: 'user_id,job_id,email',
        ignoreDuplicates: false,
      });
    }

    // Save other team contacts
    for (const contact of contactIntelligence.teamContacts.slice(0, 5)) { // Limit to top 5
      if (contact.email || contact.name) {
        await supabase.from('contacts').upsert({
          user_id: user.id,
          job_id: jobId,
          name: contact.name,
          title: contact.title,
          email: contact.email,
          source: contact.source,
          notes: contact.linkedin ? `LinkedIn: ${contact.linkedin}` : null,
        }, {
          onConflict: 'user_id,job_id,email',
          ignoreDuplicates: true,
        });
      }
    }

    console.log('[Enrichment] Successfully enriched job with actionable data and saved contacts');
    return NextResponse.json({ success: true, data: extractedData });
  } catch (error) {
    console.error('Enrichment error:', error);
    return NextResponse.json(
      { error: 'Failed to enrich job data' },
      { status: 500 }
    );
  }
}
