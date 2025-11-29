import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build',
});

export async function enrichJobDescription(jobDescription: string) {
  try {
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
    if (!result) throw new Error('No response from AI');

    return JSON.parse(result);
  } catch (error) {
    console.error('AI enrichment error:', error);
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
    if (!result) throw new Error('No response');

    return JSON.parse(result);
  } catch (error) {
    console.error('Company info extraction error:', error);
    return {
      industry: 'Unknown',
      size: 'Unknown',
      hiringManager: 'Hiring Manager',
      department: 'Unknown',
    };
  }
}
