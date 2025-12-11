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

/**
 * Enhanced company intelligence using Claude with web research capabilities
 * Used as fallback when initial extraction returns "Unknown" values
 */
export async function enrichCompanyIntelligenceWithClaude(
  companyName: string,
  jobTitle: string,
  jobDescription: string
): Promise<{
  industry: string;
  size: string;
  department: string;
}> {
  try {
    console.log('[Scraper] Using Claude for enhanced company intelligence research:', companyName);

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1500,
      temperature: 0.1, // Lower temperature for more factual responses
      messages: [
        {
          role: 'user',
          content: `You are a company intelligence analyst with access to comprehensive company data.

COMPANY TO RESEARCH: ${companyName}

JOB CONTEXT:
Title: ${jobTitle}
Description (excerpt): ${jobDescription.substring(0, 1500)}

TASK: Provide detailed, accurate company intelligence using your knowledge base.

CRITICAL INSTRUCTIONS:
1. INDUSTRY - Be HIGHLY SPECIFIC about what vertical/sector this company operates in:
   * For known companies, use your training data (e.g., "SkimTurf" → "Sports Technology & Social Networking")
   * Look for domain-specific keywords: "legal research" → Legal Tech, "patient data" → HealthTech, "turf management" → Sports Tech
   * NEVER return generic answers like "Technology" or "Software"
   * Examples of good answers: "Sports Technology & Social Networking", "Legal Technology SaaS", "Healthcare Analytics", "Fintech Payment Processing", "EdTech Learning Platforms"

2. SIZE - Use ALL available information to determine actual company size (DO NOT default to "medium"):
   * STARTUP (1-50): "launched X years ago", "fast-growing", "early stage", "seed/Series A/B", "small team", "wearing multiple hats", "recent award", "founded 20XX"
   * SMALL (51-200): "growing team", "Series C", "expanding", "regional presence"
   * MEDIUM (201-1000): "established", "multiple offices", "national presence"
   * LARGE (1001-10000): "global team", "international", "publicly traded", "industry leader"
   * ENTERPRISE (10000+): "Fortune 500", "tens of thousands", "worldwide", "multiple divisions"
   * If you recognize the company, use your knowledge of actual size
   * CRITICAL: "fast-growing" + "launched X years ago" + "recent award" = STARTUP, not medium
   * Options: "startup" (1-50), "small" (51-200), "medium" (201-1000), "large" (1001-10000), "enterprise" (10000+)

3. DEPARTMENT - Identify the SPECIFIC department/team hiring (NOT generic "General"):
   * Engineering specifics: "Frontend Engineering", "Backend Engineering", "Mobile Development", "DevOps", "Data Engineering", "ML/AI Engineering"
   * Product specifics: "Product Management", "Product Design", "UX Research", "Product Strategy"
   * Other departments: "Growth Marketing", "Customer Success", "Sales Operations", "Business Intelligence"
   * Infer from job title and responsibilities - be precise

QUALITY REQUIREMENTS:
- Do NOT return generic placeholders like "Technology", "General", or "medium" without strong evidence
- Use your knowledge of real companies whenever possible
- Make educated inferences from job description details (tech stack, responsibilities, scale mentions)
- If truly unable to determine something, make the best possible inference from available context

Return ONLY valid JSON:
{
  "industry": "specific industry/vertical",
  "size": "startup|small|medium|large|enterprise",
  "department": "specific department name"
}`,
        },
      ],
    });

    const result = message.content[0].type === 'text' ? message.content[0].text : '';
    if (!result) throw new Error('No response from Claude');

    let cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Extract only the JSON object - find first { and last }
    const firstBrace = cleanedResult.indexOf('{');
    const lastBrace = cleanedResult.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanedResult = cleanedResult.substring(firstBrace, lastBrace + 1);
    }

    const data = JSON.parse(cleanedResult);

    console.log('[Scraper] Claude enhanced intelligence:', {
      company: companyName,
      industry: data.industry,
      size: data.size,
      department: data.department,
    });

    return {
      industry: data.industry || 'Technology',
      size: data.size || 'medium',
      department: data.department || 'General',
    };
  } catch (error) {
    console.error('[Scraper] Claude intelligence enhancement error:', error);
    // Last resort fallback - make smart inferences from job title
    let department = 'General';
    let industry = 'Technology';

    const titleLower = jobTitle.toLowerCase();
    const descLower = jobDescription.toLowerCase();

    // Infer department from title
    if (titleLower.includes('engineer') || titleLower.includes('developer')) {
      if (titleLower.includes('frontend') || titleLower.includes('front-end')) department = 'Frontend Engineering';
      else if (titleLower.includes('backend') || titleLower.includes('back-end')) department = 'Backend Engineering';
      else if (titleLower.includes('mobile') || titleLower.includes('ios') || titleLower.includes('android')) department = 'Mobile Engineering';
      else if (titleLower.includes('devops') || titleLower.includes('infrastructure')) department = 'DevOps';
      else if (titleLower.includes('data')) department = 'Data Engineering';
      else if (titleLower.includes('ml') || titleLower.includes('ai') || titleLower.includes('machine learning')) department = 'ML/AI Engineering';
      else department = 'Engineering';
    } else if (titleLower.includes('product')) {
      if (titleLower.includes('design')) department = 'Product Design';
      else department = 'Product Management';
    } else if (titleLower.includes('market')) department = 'Marketing';
    else if (titleLower.includes('sales')) department = 'Sales';
    else if (titleLower.includes('customer success') || titleLower.includes('support')) department = 'Customer Success';

    // Infer industry from company name or description
    const companyLower = companyName.toLowerCase();
    if (companyLower.includes('health') || descLower.includes('patient') || descLower.includes('medical')) industry = 'Healthcare Technology';
    else if (companyLower.includes('finance') || companyLower.includes('fintech') || descLower.includes('payment')) industry = 'Financial Technology';
    else if (companyLower.includes('edu') || descLower.includes('learning') || descLower.includes('student')) industry = 'Education Technology';
    else if (companyLower.includes('legal') || descLower.includes('law') || descLower.includes('attorney')) industry = 'Legal Technology';
    else if (companyLower.includes('sport') || descLower.includes('athlete') || descLower.includes('turf') || descLower.includes('game')) industry = 'Sports Technology';

    return {
      industry,
      size: 'medium',
      department,
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
