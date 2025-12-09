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

    if (!jobId || !company) {
      console.error('[Enrichment] Missing required fields:', { jobId: !!jobId, company: !!company });
      return NextResponse.json(
        { error: 'Missing required fields: jobId and company are required' },
        { status: 400 }
      );
    }

    // VALIDATION: Prevent URLs and job board platform names from being processed
    const invalidCompanyPatterns = [
      '.com', '.net', '.org', '.io', '.co',
      'linkedin', 'indeed', 'glassdoor', 'ziprecruiter',
      'monster', 'careerbuilder', 'dice', 'simplyhired',
      'http://', 'https://', 'www.',
    ];

    const companyLower = company.toLowerCase().trim();
    const isInvalidCompany = invalidCompanyPatterns.some(pattern =>
      companyLower.includes(pattern)
    );

    if (isInvalidCompany) {
      console.error('[Enrichment] Invalid company name detected:', company);
      console.error('[Enrichment] This appears to be a URL or job board platform name');
      return NextResponse.json(
        {
          error: `Invalid company name: "${company}" appears to be a URL or job board platform name. Please provide the actual employer name from the job posting.`,
          suggestion: 'Check the job posting for the actual company/employer name (usually in the company field or header)'
        },
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
    console.log('[Enrichment] Mode:', description ? 'Full enrichment' : 'Minimal enrichment (no description)');

    // Extract emails from job description (if available)
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailsInDescription = description ? (description.match(emailRegex) || []) : [];
    if (emailsInDescription.length > 0) {
      console.log('[Enrichment] Found emails in description:', emailsInDescription);
    }

    // Run enrichment tasks in parallel
    // If no description, skip description-based enrichment and use minimal data
    let jobInfo, companyInfo, companyData;

    if (description) {
      // Full enrichment with description
      [jobInfo, companyInfo, companyData] = await Promise.all([
        enrichJobDescription(description),
        extractCompanyInfo(company, description),
        scrapeCompanyWebsite(company),
      ]);
    } else {
      // Minimal enrichment without description - just company research
      companyData = await scrapeCompanyWebsite(company);
      jobInfo = {
        summary: `AI enrichment for ${jobTitle} at ${company}. Add a job description for detailed insights.`,
        skills: [],
        responsibilities: [],
        seniority: 'unknown',
        remote: 'unknown',
      };
      companyInfo = {
        industry: 'Unknown',
        size: companyData.teamSize || 'Unknown',
        hiringManager: `Hiring Manager for ${jobTitle}`,
        department: 'Unknown',
      };
    }

    // VALIDATION: Check if company intelligence has "Unknown" values
    const validation = validateCompanyIntelligence({
      industry: companyInfo.industry,
      size: companyInfo.size,
      department: companyInfo.department,
    });

    // FALLBACK: If validation fails, use Claude for enhanced research
    let enhancedCompanyInfo = companyInfo;
    if (!validation.isValid && description) {
      console.log('[Enrichment] Validation failed for fields:', validation.missingFields);
      console.log('[Enrichment] Attempting Claude fallback for enhanced intelligence...');

      try {
        const claudeIntelligence = await enrichCompanyIntelligenceWithClaude(
          company,
          jobTitle,
          description
        );

        // Merge Claude results with original, replacing "Unknown" values
        enhancedCompanyInfo = {
          ...companyInfo,
          industry: validation.missingFields.includes('industry') ? claudeIntelligence.industry : companyInfo.industry,
          size: validation.missingFields.includes('size') ? claudeIntelligence.size : companyInfo.size,
          department: validation.missingFields.includes('department') ? claudeIntelligence.department : companyInfo.department,
        };

        console.log('[Enrichment] Claude fallback successful:', {
          industry: enhancedCompanyInfo.industry,
          size: enhancedCompanyInfo.size,
          department: enhancedCompanyInfo.department,
        });
      } catch (claudeError) {
        console.error('[Enrichment] Claude fallback failed:', claudeError);
        // Keep original values if Claude fails
      }
    }

    // Generate actionable insights and discover contacts
    const [actionableInsights, contactStrategies, contactIntelligence] = await Promise.all([
      description ? generateActionableInsights(
        company,
        jobTitle,
        companyData,
        description
      ) : Promise.resolve({
        whyThisMatters: `Learn more about ${company} and connect with the team for the ${jobTitle} role.`,
        talkingPoints: [],
        nextSteps: ['Add a job description for personalized action steps', 'Research the company website', 'Connect with team members on LinkedIn'],
        emailSubjectLines: [],
        interviewQuestions: [],
      }),
      findCompanyContacts(
        company,
        enhancedCompanyInfo.department || 'Unknown',
        jobTitle
      ),
      getContactIntelligence(
        company,
        jobTitle,
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

    const extractedData = {
      // Original enrichment data (using enhanced company info with fallback)
      summary: jobInfo.summary,
      skills: jobInfo.skills,
      responsibilities: jobInfo.responsibilities,
      seniority: jobInfo.seniority,
      remote: jobInfo.remote,
      industry: enhancedCompanyInfo.industry,
      companySize: enhancedCompanyInfo.size,
      hiringManager: enhancedCompanyInfo.hiringManager,
      department: enhancedCompanyInfo.department,

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
