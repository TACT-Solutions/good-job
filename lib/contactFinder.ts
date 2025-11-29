import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

export type EmailPattern = {
  pattern: string;
  example: string;
  confidence: number;
};

export type ContactSuggestion = {
  name: string;
  title: string;
  email: string;
  confidence: number;
  source: 'pattern' | 'hunter' | 'apollo';
};

export async function generateEmailPatterns(
  firstName: string,
  lastName: string,
  domain: string
): Promise<EmailPattern[]> {
  const fn = firstName.toLowerCase();
  const ln = lastName.toLowerCase();
  const fi = fn.charAt(0);
  const li = ln.charAt(0);

  const patterns = [
    { pattern: `${fn}.${ln}@${domain}`, confidence: 0.85 },
    { pattern: `${fn}${ln}@${domain}`, confidence: 0.75 },
    { pattern: `${fi}${ln}@${domain}`, confidence: 0.70 },
    { pattern: `${fn}@${domain}`, confidence: 0.60 },
    { pattern: `${fi}.${ln}@${domain}`, confidence: 0.65 },
    { pattern: `${ln}.${fn}@${domain}`, confidence: 0.50 },
    { pattern: `${fn}_${ln}@${domain}`, confidence: 0.45 },
    { pattern: `${fi}${li}@${domain}`, confidence: 0.40 },
  ];

  return patterns.map((p) => ({
    pattern: p.pattern,
    example: p.pattern,
    confidence: p.confidence,
  }));
}

export async function validateEmailDomain(domain: string): Promise<boolean> {
  try {
    const mxRecords = await resolveMx(domain);
    return mxRecords && mxRecords.length > 0;
  } catch {
    return false;
  }
}

export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

export async function suggestHiringContacts(
  companyName: string,
  jobTitle: string,
  department: string
): Promise<{ title: string; description: string }[]> {
  const suggestions = [];

  if (department.toLowerCase().includes('engineer') || jobTitle.toLowerCase().includes('engineer')) {
    suggestions.push({
      title: 'Engineering Manager',
      description: 'Direct manager for engineering roles',
    });
    suggestions.push({
      title: 'VP of Engineering',
      description: 'Head of engineering department',
    });
    suggestions.push({
      title: 'CTO',
      description: 'Chief Technology Officer',
    });
  } else if (department.toLowerCase().includes('product') || jobTitle.toLowerCase().includes('product')) {
    suggestions.push({
      title: 'Product Manager',
      description: 'Product team lead',
    });
    suggestions.push({
      title: 'VP of Product',
      description: 'Head of product',
    });
    suggestions.push({
      title: 'CPO',
      description: 'Chief Product Officer',
    });
  } else if (department.toLowerCase().includes('design') || jobTitle.toLowerCase().includes('design')) {
    suggestions.push({
      title: 'Design Manager',
      description: 'Design team lead',
    });
    suggestions.push({
      title: 'Head of Design',
      description: 'Design department head',
    });
  } else if (department.toLowerCase().includes('marketing') || jobTitle.toLowerCase().includes('marketing')) {
    suggestions.push({
      title: 'Marketing Manager',
      description: 'Marketing team lead',
    });
    suggestions.push({
      title: 'VP of Marketing',
      description: 'Head of marketing',
    });
    suggestions.push({
      title: 'CMO',
      description: 'Chief Marketing Officer',
    });
  } else if (department.toLowerCase().includes('sales') || jobTitle.toLowerCase().includes('sales')) {
    suggestions.push({
      title: 'Sales Manager',
      description: 'Sales team lead',
    });
    suggestions.push({
      title: 'VP of Sales',
      description: 'Head of sales',
    });
  }

  suggestions.push({
    title: 'Recruiter',
    description: 'Talent acquisition specialist',
  });

  suggestions.push({
    title: 'People Operations',
    description: 'HR/recruiting team',
  });

  return suggestions;
}

export async function findContactsForJob(
  companyDomain: string,
  jobTitle: string,
  department: string,
  linkedInConnections?: Array<{ name: string; company: string; title: string }>
): Promise<ContactSuggestion[]> {
  const contacts: ContactSuggestion[] = [];

  const hiringRoles = await suggestHiringContacts('', jobTitle, department);

  if (linkedInConnections && linkedInConnections.length > 0) {
    const companyConnections = linkedInConnections.filter(
      (c) => c.company.toLowerCase().includes(companyDomain.split('.')[0].toLowerCase())
    );

    for (const connection of companyConnections) {
      const [firstName, ...lastNameParts] = connection.name.split(' ');
      const lastName = lastNameParts.join(' ');

      if (firstName && lastName) {
        const patterns = await generateEmailPatterns(firstName, lastName, companyDomain);
        contacts.push({
          name: connection.name,
          title: connection.title || 'Connection',
          email: patterns[0].pattern,
          confidence: 0.8,
          source: 'pattern',
        });
      }
    }
  }

  return contacts.slice(0, 5);
}
