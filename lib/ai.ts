import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build',
});

export async function enrichJobDescription(jobDescription: string) {
  try {
    console.log('[AI] Starting job description enrichment...');
    console.log('[AI] API Key present:', !!process.env.GROQ_API_KEY);
    console.log('[AI] Description length:', jobDescription?.length || 0);

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a job description analyzer. Extract key information and return a JSON object with:
          - summary: A brief 2-3 sentence summary of the role
          - skills: Array of required skills
          - responsibilities: Array of key responsibilities
          - seniority: One of "entry", "mid", "senior", "lead", "executive"
          - remote: One of "remote", "hybrid", "onsite", "unknown"

          Return ONLY valid JSON, no other text.`,
        },
        {
          role: 'user',
          content: `Analyze this job description:\n\n${jobDescription}`,
        },
      ],
      model: 'llama-3.1-8b-instant', // Fast & cheap for simple extraction
      temperature: 0.3,
      max_tokens: 1000,
    });

    const result = completion.choices[0]?.message?.content;
    console.log('[AI] Got response from Groq:', !!result);

    if (!result) throw new Error('No response from AI');

    // Strip markdown code blocks if present (```json ... ```)
    const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(cleanedResult);
    console.log('[AI] Successfully parsed JSON response');
    return parsed;
  } catch (error) {
    console.error('[AI] Enrichment error details:', {
      error: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      summary: 'Failed to analyze job description',
      skills: [],
      responsibilities: [],
      seniority: 'unknown',
      remote: 'unknown',
    };
  }
}

export async function generateEmailTemplate(
  jobTitle: string,
  company: string,
  contactName?: string
) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a professional email writer. Create concise, professional cold outreach emails for job seekers.',
        },
        {
          role: 'user',
          content: `Write a professional cold email for a ${jobTitle} position at ${company}. ${
            contactName ? `Address it to ${contactName}.` : 'Use a generic greeting.'
          } Keep it under 150 words. Be genuine and express interest without being desperate.`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || 'Failed to generate email';
  } catch (error) {
    console.error('Email generation error:', error);
    return 'Failed to generate email template';
  }
}

export async function extractCompanyInfo(companyName: string, jobDescription: string) {
  try {
    console.log('[AI] Starting company info extraction...');

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a job description analyzer with deep knowledge of companies and industries.

CRITICAL: Extract company-specific information from the job description AND use your knowledge of the company.

Extract and return JSON with:
- industry: What SPECIFIC industry/vertical does this company operate in? BE PRECISE:
  * If it's a known company (e.g., "Thomson Reuters" → "Legal Technology & Enterprise Information")
  * Look for product names, services, domain mentions in the description
  * Tech stack hints (e.g., "legal research tools" = Legal Tech, "patient care" = Healthcare)
  * NEVER use generic "Technology" - be specific (e.g., "SaaS", "Fintech", "EdTech", "HealthTech", "AI/ML", "Sports Technology")

- size: Estimate company size using ALL available context - BE ACCURATE, not just "medium":
  * STARTUP indicators (1-50): "launched X years ago", "fast-growing", "early stage", "seed funded", "Series A/B", "small team", "wearing multiple hats", "recent award/recognition", "founded in 20XX"
  * SMALL indicators (51-200): "growing team", "Series C", "expanding operations", "regional presence"
  * MEDIUM indicators (201-1000): "established company", "multiple offices", "national presence", "mature product"
  * LARGE indicators (1001-10000): "global team", "international offices", "publicly traded", "industry leader"
  * ENTERPRISE indicators (10000+): "Fortune 500", "tens of thousands", "worldwide operations", "multiple divisions"
  * If you recognize the company name, use your knowledge of their actual size
  * DEFAULT: If truly unclear, prefer "startup" or "small" over "medium" for companies with recent founding dates or "fast-growing" mentions

- hiringManager: Who would likely hire for this role? Be SPECIFIC:
  * Senior roles → "VP of Engineering", "Director of Product", "Head of Marketing"
  * Mid-level → "Engineering Manager", "Product Manager", "Marketing Manager"
  * Entry/junior → "Team Lead", "Senior Engineer", "Department Manager"
  * Match to the department and seniority level

- department: Which SPECIFIC department/team is hiring? Examples:
  * Engineering types: "Frontend Engineering", "Backend Engineering", "Mobile Engineering", "DevOps", "Data Engineering", "ML/AI"
  * Product types: "Product Management", "Product Design", "UX Research"
  * Other: "Growth Marketing", "Sales Operations", "Customer Success", "Legal Technology"
  * NEVER use generic "General" - infer from job title and responsibilities

IMPORTANT:
- Use your knowledge of well-known companies (e.g., if company is "SkimTurf", research what they do)
- Extract company details from product descriptions, mission statements, tech stack
- Be SPECIFIC - avoid generic answers like "Technology", "medium", "General"
- If the company name is recognizable, use your training data knowledge
- Make intelligent inferences from context clues in the job description

Return ONLY valid JSON.`,
        },
        {
          role: 'user',
          content: `Company: ${companyName}\n\nJob Description:\n${jobDescription}`,
        },
      ],
      model: 'llama-3.1-8b-instant', // Fast & cheap for extraction
      temperature: 0.2,
      max_tokens: 300,
    });

    const result = completion.choices[0]?.message?.content;
    console.log('[AI] Got company info response:', !!result);

    if (!result) throw new Error('No response');

    // Strip markdown code blocks if present (```json ... ```)
    const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(cleanedResult);
    console.log('[AI] Successfully parsed company info JSON');
    return parsed;
  } catch (error) {
    console.error('[AI] Company info extraction error:', {
      error: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
    });
    return {
      industry: 'Unknown',
      size: 'Unknown',
      hiringManager: 'Hiring Manager',
      department: 'Unknown',
    };
  }
}

/**
 * Validate company intelligence data and return validation results
 * Returns true if data is complete, false if critical fields are missing or "Unknown"
 */
export function validateCompanyIntelligence(companyInfo: {
  industry: string;
  size: string;
  department: string;
}): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  // Generic/placeholder values that should trigger fallback
  const genericIndustries = ['unknown', 'technology', 'tech', 'general', 'other', 'n/a', 'not specified'];
  const genericDepartments = ['unknown', 'general', 'other', 'n/a', 'not specified'];

  // Check for "Unknown", empty values, OR generic placeholders
  const industryLower = companyInfo.industry?.toLowerCase().trim() || '';
  if (!industryLower || genericIndustries.includes(industryLower)) {
    missingFields.push('industry');
  }

  if (!companyInfo.size || companyInfo.size.toLowerCase() === 'unknown' || companyInfo.size.trim() === '') {
    missingFields.push('size');
  }

  const departmentLower = companyInfo.department?.toLowerCase().trim() || '';
  if (!departmentLower || genericDepartments.includes(departmentLower)) {
    missingFields.push('department');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}
