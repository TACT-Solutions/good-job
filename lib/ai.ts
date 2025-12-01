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
      model: 'llama-3.3-70b-versatile',
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
          content: `Extract company information and return JSON with:
          - industry: The company's industry
          - size: Estimated company size (startup, small, medium, large, enterprise)
          - hiringManager: Likely job title of the hiring manager (e.g., "Engineering Manager", "VP of Product")
          - department: The department hiring (e.g., "Engineering", "Marketing")

          Return ONLY valid JSON.`,
        },
        {
          role: 'user',
          content: `Company: ${companyName}\n\nJob Description:\n${jobDescription}`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
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
