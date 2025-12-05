/**
 * Web scraper for company research
 * Uses Claude for web-connected research and Groq for other tasks
 */

import Groq from 'groq-sdk';
import Anthropic from '@anthropic-ai/sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build',
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy-key-for-build',
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
    console.log('[Scraper] Using Claude Haiku for better company knowledge');

    // Use Claude Haiku for company research - better knowledge of major companies
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Fast, cheap, excellent knowledge
      max_tokens: 2500, // Increased for detailed responses with specific examples
      temperature: 0.3, // Slightly higher for more comprehensive answers
      messages: [
        {
          role: 'user',
          content: `Research this company and provide the MOST comprehensive information available: ${companyName}

You are a company research assistant. Use your full training data knowledge to provide detailed information. Return ONLY valid JSON with:
- websiteUrl: Company website URL (e.g., "https://thomsonreuters.com") - REQUIRED
- aboutText: 2-3 sentences covering what they do AND any major recent developments (acquisitions, AI launches, etc.) - REQUIRED, be specific
- recentNews: Array of 2-3 SPECIFIC recent developments with details (e.g., "Acquired Casetext for $650M in June 2023 to expand AI legal research capabilities") - Use your training data, be detailed
- techStack: Array of technologies/tools they use (for tech companies) - Be specific about their tech
- companyValues: Array of actual company values or culture highlights from their public materials
- teamSize: Total global employee count estimate (e.g., "50-100", "500+", "10,000+", "70,000+") - Use highest known number across all divisions, NOT just one office
- foundingYear: Historical founding year with context if company has long history (e.g., "1851 (Reuters founded)", "2008 (Thomson Reuters merger)") - Include full context
- headquarters: Primary global HQ location (e.g., "Toronto, Canada") - REQUIRED

CRITICAL REQUIREMENTS:
- For Fortune 500 companies (Thomson Reuters, Microsoft, etc.), provide SPECIFIC, DETAILED information
- Include major acquisitions especially in AI/tech (e.g., Thomson Reuters acquired Casetext 2023)
- Use complete historical context (Reuters 1851 history + Thomson merger 2008 = Thomson Reuters)
- Employee counts should reflect GLOBAL workforce, not underestimate
- Recent news must be SPECIFIC with details, dates, dollar amounts if known
- Return ONLY the JSON object, no markdown, no other text.`,
        },
      ],
    });

    const result = message.content[0].type === 'text' ? message.content[0].text : '';
    if (!result) throw new Error('No response from Claude');

    console.log('[Scraper] Raw Claude response length:', result.length);
    const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(cleanedResult);

    console.log('[Scraper] Successfully researched company with Claude:', companyName);
    console.log('[Scraper] Company data preview:', {
      teamSize: data.teamSize,
      foundingYear: data.foundingYear,
      newsCount: data.recentNews?.length || 0,
      hasSpecificNews: data.recentNews?.some((n: string) => n.includes('Casetext') || n.includes('acquired') || n.includes('$'))
    });
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
      model: 'meta-llama/llama-4-maverick-17b-128e-instruct', // Smart reasoning for insights
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
          content: `You are a networking strategist for job seekers. Suggest WHO to contact and HOW to find them. Return JSON with:
          - suggestedRoles: Array of 3-4 SPECIFIC job titles to search for (e.g., "Director of Customer Success", "VP of Legal Technology", NOT generic like "Manager")
          - searchStrategies: Array of 2-3 SPECIFIC, ACTIONABLE strategies (e.g., "Search for Thomson Reuters employees who post about AI" NOT "Company-wide search")
          - linkedInSearchUrl: A LinkedIn people search URL with the company name and relevant keywords

          Be TACTICAL and SPECIFIC. No generic advice like "departmental search" or "alumni search".
          Return ONLY valid JSON with STRING values in searchStrategies array.`,
        },
        {
          role: 'user',
          content: `Company: ${companyName}
Department: ${department}
Job Title: ${jobTitle}

Generate specific, actionable networking strategies for this exact role at this company.`,
        },
      ],
      model: 'llama-3.1-8b-instant', // Fast for simple contact strategies
      temperature: 0.5,
      max_tokens: 800,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) throw new Error('No response from AI');

    const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const contacts = JSON.parse(cleanedResult);

    // Normalize searchStrategies - sometimes AI returns objects instead of strings
    if (contacts.searchStrategies && Array.isArray(contacts.searchStrategies)) {
      contacts.searchStrategies = contacts.searchStrategies.map((item: any) => {
        // If it's an object with a 'strategy' field, extract the string
        if (typeof item === 'object' && item.strategy) {
          return item.strategy;
        }
        // If it's already a string, return as-is
        return typeof item === 'string' ? item : String(item);
      });
    }

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
