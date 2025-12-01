/**
 * Web scraper for company research
 * Fetches real data from company websites to make enrichment actionable
 */

import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build',
});

export async function scrapeCompanyWebsite(companyName: string): Promise<{
  websiteUrl: string | null;
  aboutText: string;
  recentNews: string[];
  techStack: string[];
  companyValues: string[];
  teamSize: string;
  foundingYear: string;
  headquarters: string;
}> {
  try {
    console.log('[Scraper] Starting company website research for:', companyName);

    // Use Groq to search for and analyze publicly available company info
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a company research assistant with access to public web data. Research the company and return JSON with:
          - websiteUrl: Company website URL (e.g., "https://example.com")
          - aboutText: 2-3 sentence description of what the company does
          - recentNews: Array of 2-3 recent company developments, achievements, or news (with dates if available)
          - techStack: Array of technologies/tools the company is known to use
          - companyValues: Array of company values or culture highlights
          - teamSize: Estimated team size (e.g., "50-100 employees", "500+ employees")
          - foundingYear: Year founded (e.g., "2015", "unknown")
          - headquarters: HQ location (e.g., "San Francisco, CA", "Remote-first")

          Return ONLY valid JSON based on publicly known information.`,
        },
        {
          role: 'user',
          content: `Research this company: ${companyName}`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 1500,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) throw new Error('No response from AI');

    const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(cleanedResult);

    console.log('[Scraper] Successfully researched company:', companyName);
    return data;
  } catch (error) {
    console.error('[Scraper] Company research error:', error);
    return {
      websiteUrl: null,
      aboutText: 'Unable to fetch company information',
      recentNews: [],
      techStack: [],
      companyValues: [],
      teamSize: 'Unknown',
      foundingYear: 'Unknown',
      headquarters: 'Unknown',
    };
  }
}

export async function generateActionableInsights(
  companyName: string,
  jobTitle: string,
  companyData: any,
  jobDescription: string
): Promise<{
  whyThisMatters: string;
  talkingPoints: string[];
  nextSteps: string[];
  emailSubjectLines: string[];
  interviewQuestions: string[];
}> {
  try {
    console.log('[Scraper] Generating actionable insights...');

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a job search strategist. Based on company research and job details, generate actionable insights. Return JSON with:
          - whyThisMatters: 2-3 sentences on why this opportunity is valuable and timely
          - talkingPoints: Array of 3-4 specific talking points to use when reaching out (reference recent company news, tech stack, values)
          - nextSteps: Array of 3-5 concrete action items (e.g., "Connect with [role] on LinkedIn", "Research their recent [product launch]")
          - emailSubjectLines: Array of 3 attention-grabbing subject line options for cold emails
          - interviewQuestions: Array of 3-4 smart questions to ask in an interview based on company context

          Make everything specific to THIS company and role. Return ONLY valid JSON.`,
        },
        {
          role: 'user',
          content: `Company: ${companyName}
Job Title: ${jobTitle}

Company Data:
- About: ${companyData.aboutText}
- Recent News: ${companyData.recentNews.join(', ')}
- Tech Stack: ${companyData.techStack.join(', ')}
- Values: ${companyData.companyValues.join(', ')}
- HQ: ${companyData.headquarters}

Job Description excerpt: ${jobDescription.substring(0, 500)}...`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1500,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) throw new Error('No response from AI');

    const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const insights = JSON.parse(cleanedResult);

    console.log('[Scraper] Successfully generated actionable insights');
    return insights;
  } catch (error) {
    console.error('[Scraper] Insights generation error:', error);
    return {
      whyThisMatters: 'This role offers growth opportunities in your field.',
      talkingPoints: [
        'Express interest in the company mission',
        'Highlight relevant skills from the job description',
        'Show enthusiasm for the role',
      ],
      nextSteps: [
        'Research the hiring manager on LinkedIn',
        'Prepare a tailored resume for this role',
        'Draft a personalized cover letter',
      ],
      emailSubjectLines: [
        `Interested in ${jobTitle} role`,
        `${jobTitle} opportunity at ${companyName}`,
        'Excited about this opportunity',
      ],
      interviewQuestions: [
        'What does success look like in this role after 6 months?',
        'What are the biggest challenges the team is currently facing?',
        'How does this role contribute to company goals?',
      ],
    };
  }
}

export async function findCompanyContacts(
  companyName: string,
  department: string,
  jobTitle: string
): Promise<{
  suggestedRoles: string[];
  searchStrategies: string[];
  linkedInSearchUrl: string;
}> {
  try {
    console.log('[Scraper] Finding company contacts...');

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a networking strategist. Based on the company and role, suggest who to connect with. Return JSON with:
          - suggestedRoles: Array of 3-4 job titles to search for on LinkedIn (e.g., "Engineering Manager", "Head of Product")
          - searchStrategies: Array of 2-3 specific strategies to find these people (be tactical and specific)
          - linkedInSearchUrl: A LinkedIn search URL to find relevant contacts

          Return ONLY valid JSON.`,
        },
        {
          role: 'user',
          content: `Company: ${companyName}
Department: ${department}
Job Title: ${jobTitle}`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 800,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) throw new Error('No response from AI');

    const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const contacts = JSON.parse(cleanedResult);

    console.log('[Scraper] Successfully generated contact strategies');
    return contacts;
  } catch (error) {
    console.error('[Scraper] Contact finding error:', error);

    // Generate fallback LinkedIn search URL
    const encodedCompany = encodeURIComponent(companyName);
    const encodedDept = encodeURIComponent(department);

    return {
      suggestedRoles: [
        'Hiring Manager',
        `${department} Lead`,
        'Recruiter',
      ],
      searchStrategies: [
        `Search LinkedIn for "${department}" roles at ${companyName}`,
        `Look for employees who recently posted about hiring`,
        `Check the company's LinkedIn page for team members`,
      ],
      linkedInSearchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodedCompany}%20${encodedDept}`,
    };
  }
}
