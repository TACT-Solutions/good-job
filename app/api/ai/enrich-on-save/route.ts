import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enrichJobDescription, extractCompanyInfo, validateCompanyIntelligence } from '@/lib/ai';
import {
  scrapeCompanyWebsite,
  generateActionableInsights,
  findCompanyContacts,
  enrichCompanyIntelligenceWithClaude,
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

    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId' },
        { status: 400 }
      );
    }

    // Fetch job from database
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // VALIDATION: Prevent URLs and job board platform names from being processed
    const invalidCompanyPatterns = [
      '.com', '.net', '.org', '.io', '.co',
      'linkedin', 'indeed', 'glassdoor', 'ziprecruiter',
      'monster', 'careerbuilder', 'dice', 'simplyhired',
      'http://', 'https://', 'www.',
    ];

    const companyLower = job.company.toLowerCase().trim();
    const isInvalidCompany = invalidCompanyPatterns.some(pattern =>
      companyLower.includes(pattern)
    );

    if (isInvalidCompany) {
      console.error('[Auto-Enrichment] Invalid company name detected:', job.company);
      console.error('[Auto-Enrichment] Skipping enrichment - appears to be URL or platform name');
      return NextResponse.json(
        {
          success: false,
          error: `Invalid company name: "${job.company}" appears to be a URL or job board platform name.`,
          insights: {
            seniority: 'unknown',
            remote: 'unknown',
            topSkills: [],
            summary: 'Please update the company name to the actual employer before enriching.',
          },
        },
        { status: 400 }
      );
    }

    // Extract emails from job description
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailsInDescription = (job.raw_description || '').match(emailRegex) || [];

    // Parallel AI calls with 10-second timeout (increased for additional enrichment)
    const enrichmentPromise = Promise.race([
      Promise.all([
        enrichJobDescription(job.raw_description || ''),
        extractCompanyInfo(job.company, job.raw_description || ''),
        scrapeCompanyWebsite(job.company),
      ]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI timeout')), 10000)
      ),
    ]);

    const [jobInfo, companyInfo, companyData] = await enrichmentPromise;

    // VALIDATION: Check if company intelligence has "Unknown" values
    const validation = validateCompanyIntelligence({
      industry: companyInfo.industry,
      size: companyInfo.size,
      department: companyInfo.department,
    });

    // FALLBACK: If validation fails, use Claude for enhanced research
    let enhancedCompanyInfo = companyInfo;
    if (!validation.isValid) {
      console.log('[Auto-Enrichment] Validation failed for fields:', validation.missingFields);
      console.log('[Auto-Enrichment] Attempting Claude fallback for enhanced intelligence...');

      try {
        const claudeIntelligence = await enrichCompanyIntelligenceWithClaude(
          job.company,
          job.title,
          job.raw_description || ''
        );

        // Merge Claude results with original, replacing "Unknown" values
        enhancedCompanyInfo = {
          ...companyInfo,
          industry: validation.missingFields.includes('industry') ? claudeIntelligence.industry : companyInfo.industry,
          size: validation.missingFields.includes('size') ? claudeIntelligence.size : companyInfo.size,
          department: validation.missingFields.includes('department') ? claudeIntelligence.department : companyInfo.department,
        };

        console.log('[Auto-Enrichment] Claude fallback successful:', {
          industry: enhancedCompanyInfo.industry,
          size: enhancedCompanyInfo.size,
          department: enhancedCompanyInfo.department,
        });
      } catch (claudeError) {
        console.error('[Auto-Enrichment] Claude fallback failed:', claudeError);
        // Keep original values if Claude fails
      }
    }

    // Generate actionable insights and contact intelligence
    const [actionableInsights, contactStrategies, contactIntelligence] = await Promise.all([
      generateActionableInsights(
        job.company,
        job.title,
        companyData,
        job.raw_description || ''
      ),
      findCompanyContacts(
        job.company,
        enhancedCompanyInfo.department || 'Unknown',
        job.title
      ),
      getContactIntelligence(
        job.company,
        job.title,
        enhancedCompanyInfo.department || 'Unknown',
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

    // Combine all insights (using enhanced company info with fallback)
    const extractedData = {
      summary: jobInfo.summary,
      skills: jobInfo.skills,
      responsibilities: jobInfo.responsibilities,
      seniority: jobInfo.seniority,
      remote: jobInfo.remote,
      industry: enhancedCompanyInfo.industry,
      companySize: enhancedCompanyInfo.size,
      hiringManager: enhancedCompanyInfo.hiringManager,
      department: enhancedCompanyInfo.department,

      // Company research
      companyWebsite: companyData.websiteUrl,
      companyAbout: companyData.aboutText,
      companyNews: companyData.recentNews,
      companyTechStack: companyData.techStack,
      companyValues: companyData.companyValues,
      companyTeamSize: companyData.teamSize,
      companyFounded: companyData.foundingYear,
      companyHQ: companyData.headquarters,

      // Actionable insights
      whyThisMatters: actionableInsights.whyThisMatters,
      talkingPoints: actionableInsights.talkingPoints,
      nextSteps: actionableInsights.nextSteps,
      emailSubjectLines: actionableInsights.emailSubjectLines,
      interviewQuestions: actionableInsights.interviewQuestions,

      // Contact discovery
      suggestedRoles: contactStrategies.suggestedRoles,
      searchStrategies: contactStrategies.searchStrategies,
      linkedInSearchUrl: contactStrategies.linkedInSearchUrl,

      // Contact intelligence
      hiringManagerName: contactIntelligence.hiringManager.name,
      hiringManagerTitle: contactIntelligence.hiringManager.title,
      hiringManagerEmails: contactIntelligence.hiringManager.emails,
      hiringManagerLinkedIn: contactIntelligence.hiringManager.linkedin,
      hiringManagerReasoning: contactIntelligence.hiringManager.reasoning,
      hiringManagerConfidence: contactIntelligence.hiringManagerConfidence,
      teamContacts: contactIntelligence.teamContacts,
      emailPatterns: contactIntelligence.emailPatterns,
      totalContactsFound: contactIntelligence.totalContactsFound,
    };

    // Update job with enrichment
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        extracted_description: JSON.stringify(extractedData),
        seniority_level: jobInfo.seniority,
        ai_enriched_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // AUTO-SAVE DISCOVERED CONTACTS TO DATABASE
    console.log('[Auto-Enrichment] Saving discovered contacts...');
    let totalContactsSaved = 0;

    // Save hiring manager - ALWAYS save if we have a title (even without name)
    if (contactIntelligence.hiringManager.title) {
      const primaryEmail = contactIntelligence.hiringManager.emails?.find(e => e.confidence === 'confirmed' || e.confidence === 'high');
      const hasEmailSuggestions = contactIntelligence.hiringManager.emails?.length > 0;

      const contactData = {
        user_id: user.id,
        job_id: jobId,
        name: contactIntelligence.hiringManager.name || `Hiring Manager (${contactIntelligence.hiringManager.title})`,
        title: contactIntelligence.hiringManager.title,
        email: primaryEmail?.email || null,
        source: 'AI Discovery',
        notes: `${contactIntelligence.hiringManager.reasoning || 'Likely hiring manager for this role'}${hasEmailSuggestions ? `\n\nEmail suggestions:\n${contactIntelligence.hiringManager.emails.map(e => `- ${e.email} (${e.confidence} confidence)`).join('\n')}` : ''}`,
      };

      const { error: hmError } = await supabase.from('contacts').upsert(contactData, {
        onConflict: primaryEmail?.email ? 'user_id,job_id,email' : 'user_id,job_id,name',
        ignoreDuplicates: false,
      });

      if (hmError) {
        console.error('[Auto-Enrichment] Failed to save hiring manager:', hmError);
      } else {
        totalContactsSaved++;
        console.log('[Auto-Enrichment] Saved hiring manager:', contactIntelligence.hiringManager.name || contactIntelligence.hiringManager.title);
      }
    }

    // Save other team contacts
    for (const contact of contactIntelligence.teamContacts?.slice(0, 5) || []) { // Limit to top 5
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
          console.error('[Auto-Enrichment] Failed to save contact:', contact.name, contactError);
        } else {
          totalContactsSaved++;
        }
      }
    }

    console.log('[Auto-Enrichment] Saved', totalContactsSaved - 1, 'team contacts'); // -1 for hiring manager

    // Save emails found in job description
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
        totalContactsSaved++;
      }
    }

    console.log(`[Auto-Enrichment] Successfully enriched job and saved ${totalContactsSaved} contacts total`);

    // Return insights for popup display WITH contact count
    return NextResponse.json({
      success: true,
      insights: {
        seniority: jobInfo.seniority,
        remote: jobInfo.remote,
        topSkills: jobInfo.skills.slice(0, 3),
        summary: jobInfo.summary,
        contactsFound: totalContactsSaved, // NEW: Tell user how many contacts were saved
      },
    });
  } catch (error) {
    console.error('Enrichment error:', error);
    // Return safe defaults instead of failing
    return NextResponse.json({
      success: false,
      insights: {
        seniority: 'unknown',
        remote: 'unknown',
        topSkills: [],
        summary: 'Analysis unavailable',
      },
    });
  }
}
