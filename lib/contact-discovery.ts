/**
 * Contact Discovery System
 * Similar to HubSpot/Apollo - finds contacts and infers email patterns
 */

import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build',
});

interface DiscoveredContact {
  name: string;
  title: string;
  email: string | null;
  confidence: 'confirmed' | 'high' | 'medium' | 'low';
  source: string;
  linkedin?: string;
}

interface EmailPattern {
  pattern: string; // e.g., "firstname.lastname@company.com"
  example: string;
  confidence: number;
}

/**
 * Discover publicly available contacts at a company
 */
export async function discoverCompanyContacts(
  companyName: string,
  department: string,
  targetRoles: string[]
): Promise<{
  contacts: DiscoveredContact[];
  emailPatterns: EmailPattern[];
}> {
  try {
    console.log('[ContactDiscovery] Searching for contacts at:', companyName);

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a contact research assistant with access to publicly available professional data.

          For the given company and roles, return JSON with:
          - contacts: Array of publicly known contacts with:
            * name: Full name
            * title: Job title
            * email: Email if publicly known (or null)
            * confidence: "confirmed" if email is public, "high/medium/low" for inferred
            * source: Where this info is from (LinkedIn, company website, etc.)
            * linkedin: LinkedIn profile URL if available
          - emailPatterns: Array of detected email patterns:
            * pattern: Description of pattern (e.g., "firstname.lastname@company.com")
            * example: Example email using this pattern
            * confidence: 0-100 score based on how many confirmed emails match

          Only include real, publicly available information. For inferred emails, explain the pattern.
          Return ONLY valid JSON.`,
        },
        {
          role: 'user',
          content: `Company: ${companyName}
Department: ${department}
Looking for roles: ${targetRoles.join(', ')}

Find publicly known contacts and detect email patterns.`,
        },
      ],
      model: 'meta-llama/llama-4-scout-17b-16e-instruct', // Best value for contact research
      temperature: 0.2,
      max_tokens: 2000,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) throw new Error('No response from AI');

    let cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Extract only the JSON object - find first { and last }
    const firstBrace = cleanedResult.indexOf('{');
    const lastBrace = cleanedResult.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanedResult = cleanedResult.substring(firstBrace, lastBrace + 1);
    }

    const data = JSON.parse(cleanedResult);

    console.log('[ContactDiscovery] Found', data.contacts?.length || 0, 'contacts');
    return data;
  } catch (error) {
    console.error('[ContactDiscovery] Error:', error);
    return {
      contacts: [],
      emailPatterns: [],
    };
  }
}

/**
 * Generate best-guess email for a specific person based on patterns
 */
export async function generateEmailGuess(
  personName: string,
  personTitle: string,
  companyName: string,
  companyDomain: string | null,
  emailPatterns: EmailPattern[]
): Promise<{
  suggestedEmails: Array<{
    email: string;
    pattern: string;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
  }>;
}> {
  try {
    console.log('[ContactDiscovery] Generating email guesses for:', personName);

    // If we have no domain, try to infer it
    let domain = companyDomain;
    if (!domain) {
      domain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an email pattern expert. Based on known email patterns at a company, generate the most likely email addresses for a person.

          Return JSON with:
          - suggestedEmails: Array of email suggestions (ordered by confidence):
            * email: The suggested email address
            * pattern: Pattern used (e.g., "firstname.lastname@domain")
            * confidence: "high", "medium", or "low"
            * reasoning: Why this email is likely (reference the patterns)

          Generate 2-4 most likely options based on common patterns.
          Return ONLY valid JSON.`,
        },
        {
          role: 'user',
          content: `Person: ${personName}
Title: ${personTitle}
Company: ${companyName}
Company Domain: ${domain}

Known Email Patterns at this company:
${emailPatterns.length > 0
  ? emailPatterns.map(p => `- ${p.pattern} (confidence: ${p.confidence}%) - Example: ${p.example}`).join('\n')
  : 'No confirmed patterns - use common corporate email patterns'}

Generate the most likely email addresses for this person.`,
        },
      ],
      model: 'meta-llama/llama-4-maverick-17b-128e-instruct', // Smart reasoning for email patterns
      temperature: 0.3,
      max_tokens: 1000,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) throw new Error('No response from AI');

    const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(cleanedResult);

    console.log('[ContactDiscovery] Generated', data.suggestedEmails?.length || 0, 'email suggestions');
    return data;
  } catch (error) {
    console.error('[ContactDiscovery] Email generation error:', error);

    // Fallback: generate basic patterns
    const firstName = personName.split(' ')[0]?.toLowerCase() || '';
    const lastName = personName.split(' ').slice(-1)[0]?.toLowerCase() || '';
    const domain = companyDomain || companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';

    return {
      suggestedEmails: [
        {
          email: `${firstName}.${lastName}@${domain}`,
          pattern: 'firstname.lastname@domain',
          confidence: 'medium',
          reasoning: 'Standard corporate email pattern',
        },
        {
          email: `${firstName}${lastName}@${domain}`,
          pattern: 'firstnamelastname@domain',
          confidence: 'low',
          reasoning: 'Alternative corporate pattern',
        },
      ],
    };
  }
}

/**
 * Find hiring manager specifically for a role
 */
export async function findHiringManager(
  companyName: string,
  jobTitle: string,
  department: string
): Promise<{
  name: string | null;
  title: string;
  emails: Array<{
    email: string;
    confidence: 'confirmed' | 'high' | 'medium' | 'low';
    pattern: string;
  }>;
  linkedin: string | null;
  reasoning: string;
}> {
  try {
    console.log('[ContactDiscovery] Finding hiring manager for:', jobTitle, 'at', companyName);

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a hiring manager identification expert. Based on the job and company, identify the most likely hiring manager.

          Return JSON with:
          - name: Hiring manager's name if publicly known (or null)
          - title: Most likely hiring manager title (e.g., "Director of Engineering")
          - emails: Array of potential emails:
            * email: Email address
            * confidence: "confirmed", "high", "medium", or "low"
            * pattern: Pattern used
          - linkedin: LinkedIn profile URL if known (or null)
          - reasoning: Explanation of why this person/role is likely the hiring manager

          Return ONLY valid JSON.`,
        },
        {
          role: 'user',
          content: `Company: ${companyName}
Job Title: ${jobTitle}
Department: ${department}

Who is most likely the hiring manager for this role?`,
        },
      ],
      model: 'meta-llama/llama-4-maverick-17b-128e-instruct', // Critical accuracy for hiring manager
      temperature: 0.2,
      max_tokens: 1000,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) throw new Error('No response from AI');

    const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(cleanedResult);

    console.log('[ContactDiscovery] Found hiring manager:', data.name || data.title);
    return data;
  } catch (error) {
    console.error('[ContactDiscovery] Hiring manager search error:', error);

    // Fallback based on job title
    const managerTitle = department ? `${department} Manager` : 'Hiring Manager';

    return {
      name: null,
      title: managerTitle,
      emails: [],
      linkedin: null,
      reasoning: `For a ${jobTitle} role, the hiring manager is typically a ${managerTitle}`,
    };
  }
}

/**
 * Comprehensive contact intelligence for a job
 */
export async function getContactIntelligence(
  companyName: string,
  jobTitle: string,
  department: string,
  companyDomain: string | null
) {
  console.log('[ContactDiscovery] Starting comprehensive contact intelligence...');

  // Run discovery in parallel
  const [companyContacts, hiringManager] = await Promise.all([
    discoverCompanyContacts(companyName, department, [
      'Recruiter',
      `${department} Manager`,
      'Director',
      'VP',
    ]),
    findHiringManager(companyName, jobTitle, department),
  ]);

  // SMART MATCHING: If we found team contacts that match the department, use them as hiring manager
  const departmentLower = department.toLowerCase();
  const matchingContact = companyContacts.contacts.find(contact => {
    const titleLower = contact.title.toLowerCase();
    // Check if contact's title matches the department
    return (
      titleLower.includes(departmentLower) ||
      // Special cases
      (departmentLower.includes('engineer') && titleLower.includes('engineer')) ||
      (departmentLower.includes('product') && titleLower.includes('product')) ||
      (departmentLower.includes('marketing') && titleLower.includes('marketing')) ||
      (departmentLower.includes('sales') && titleLower.includes('sales')) ||
      (departmentLower.includes('customer success') && titleLower.includes('customer')) ||
      (departmentLower.includes('data') && titleLower.includes('data'))
    );
  });

  // If we found a matching contact, use them instead of the generic hiring manager
  let finalHiringManager = hiringManager;
  if (matchingContact) {
    console.log('[ContactDiscovery] Found matching team contact for hiring manager:', matchingContact.name);
    finalHiringManager = {
      name: matchingContact.name,
      title: matchingContact.title,
      emails: matchingContact.email ? [{
        email: matchingContact.email,
        confidence: matchingContact.confidence,
        pattern: 'from team contacts'
      }] : [],
      linkedin: matchingContact.linkedin || null,
      reasoning: `${matchingContact.name} is the ${matchingContact.title} at ${companyName}, making them the most likely hiring manager for this ${department} role.`
    };
  }

  // If hiring manager has a name but no emails, generate them
  if (finalHiringManager.name && finalHiringManager.emails.length === 0) {
    const emailGuesses = await generateEmailGuess(
      finalHiringManager.name,
      finalHiringManager.title,
      companyName,
      companyDomain,
      companyContacts.emailPatterns
    );

    finalHiringManager.emails = emailGuesses.suggestedEmails;
  }

  console.log('[ContactDiscovery] Contact intelligence complete');

  return {
    hiringManager: finalHiringManager,
    teamContacts: companyContacts.contacts,
    emailPatterns: companyContacts.emailPatterns,
    totalContactsFound: companyContacts.contacts.length,
  };
}
