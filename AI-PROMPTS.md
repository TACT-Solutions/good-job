# GoodJob - AI Prompts & Model Usage

**Complete reference for all AI calls, models used, and research prompts**

Last Updated: December 2, 2025

---

## 📊 Overview

GoodJob uses **6 different AI models** strategically across **10 different API calls** to enrich job data, discover contacts, and generate insights.

**Total API Calls per Enrichment**: 8-10 calls
**Average Latency**: 1-3 seconds
**Cost per Enrichment**: $0.0032

---

## 🤖 Models Used

| Model | Use Cases | Speed | Cost |
|-------|-----------|-------|------|
| `llama-3.1-8b-instant` | Simple extraction, parsing | ⚡ Fastest | 💰 Cheapest |
| `llama-3.3-70b-versatile` | Email writing, templates | 🚀 Fast | 💰💰 Medium |
| `llama-4-scout-17b-16e-instruct` | Company research, discovery | 📊 Medium | 💰💰 Medium |
| `llama-4-maverick-17b-128e-instruct` | Complex reasoning, insights | 🧠 Slower | 💰💰💰 Higher |

---

## 🔬 API Call #1: Job Description Enrichment

**File**: `lib/ai.ts` → `enrichJobDescription()`
**Model**: `llama-3.1-8b-instant`
**Purpose**: Extract structured data from job description

### System Prompt
```
You are a job description analysis AI. Extract key information from job postings.

Return JSON with:
- summary: 2-3 sentence overview
- skills: Array of required skills/technologies (3-10 items)
- responsibilities: Array of key duties (3-7 items)
- seniority: "entry", "mid", "senior", "lead", or "executive"
- remote: "remote", "hybrid", "onsite", or "unknown"

Return ONLY valid JSON, no markdown formatting.
```

### User Prompt Template
```
Job Description:
{raw_description}

Extract the key information and return as JSON.
```

### Example Output
```json
{
  "summary": "Senior frontend engineer role focusing on React and TypeScript development for a SaaS platform.",
  "skills": ["React", "TypeScript", "Node.js", "GraphQL", "AWS"],
  "responsibilities": [
    "Build and maintain React components",
    "Lead frontend architecture decisions",
    "Mentor junior developers"
  ],
  "seniority": "senior",
  "remote": "hybrid"
}
```

---

## 🔬 API Call #2: Company Info Extraction

**File**: `lib/ai.ts` → `extractCompanyInfo()`
**Model**: `llama-3.1-8b-instant`
**Purpose**: Extract company details from job description

### System Prompt
```
You are a company information extraction AI. Analyze job postings to extract company details.

Return JSON with:
- industry: Company's industry/sector
- size: "startup", "small", "medium", "large", or "enterprise"
- department: Department hiring (e.g., "Engineering", "Sales")
- hiringManager: Likely hiring manager title (e.g., "Engineering Manager")

Return ONLY valid JSON.
```

### User Prompt Template
```
Company: {companyName}
Job Description:
{description}

Extract company information and return as JSON.
```

### Example Output
```json
{
  "industry": "SaaS / Cloud Computing",
  "size": "medium",
  "department": "Engineering",
  "hiringManager": "Engineering Manager"
}
```

---

## 🔬 API Call #3: Company Website Research

**File**: `lib/web-scraper.ts` → `scrapeCompanyWebsite()`
**Model**: `llama-4-scout-17b-16e-instruct`
**Purpose**: Research company details (simulated - doesn't actually scrape)

### System Prompt
```
You are a company research AI with access to public company information.

For the given company, return JSON with:
- websiteUrl: Company website URL
- aboutText: 2-3 sentences about the company
- foundingYear: Year founded (or null)
- headquarters: City, State/Country
- teamSize: Employee count estimate
- techStack: Array of technologies used
- companyValues: Array of core values
- recentNews: Array of recent updates/news (3-5 items)

Return ONLY valid JSON.
```

### User Prompt Template
```
Company: {companyName}

Research this company and provide comprehensive information.
```

### Example Output
```json
{
  "websiteUrl": "https://acmecorp.com",
  "aboutText": "Acme Corp is a leading SaaS platform that helps businesses manage their workflows. Founded in 2018, they serve over 10,000 customers worldwide.",
  "foundingYear": "2018",
  "headquarters": "San Francisco, CA",
  "teamSize": "250-500",
  "techStack": ["React", "Node.js", "PostgreSQL", "AWS", "TypeScript"],
  "companyValues": ["Innovation", "Customer Success", "Transparency"],
  "recentNews": [
    "Raised $50M Series C in March 2024",
    "Launched AI-powered analytics feature",
    "Expanded to European market"
  ]
}
```

---

## 🔬 API Call #4: Actionable Insights Generation

**File**: `lib/web-scraper.ts` → `generateActionableInsights()`
**Model**: `llama-4-maverick-17b-128e-instruct`
**Purpose**: Generate strategic advice and talking points

### System Prompt
```
You are a career strategy AI that helps job seekers stand out.

Given a job and company info, return JSON with:
- whyThisMatters: Why this opportunity is significant (2-3 sentences)
- talkingPoints: Array of 3-5 points to mention in outreach/interviews
- nextSteps: Array of 3-5 action steps (ordered by priority)
- emailSubjectLines: Array of 3 compelling email subject lines
- interviewQuestions: Array of 3-5 smart questions to ask

Make advice specific to this role and company. Be actionable and strategic.
Return ONLY valid JSON.
```

### User Prompt Template
```
Company: {companyName}
Role: {jobTitle}

Company Info:
{companyData}

Job Description:
{description}

Generate actionable insights for a job seeker.
```

### Example Output
```json
{
  "whyThisMatters": "This role offers the chance to shape the frontend architecture at a rapidly growing SaaS company that recently raised $50M. You'd be joining at an inflection point where your technical leadership could significantly impact product direction.",
  "talkingPoints": [
    "Experience scaling React applications to handle 10k+ concurrent users",
    "Track record of mentoring junior developers and establishing best practices",
    "Familiarity with AWS deployment and CI/CD pipelines",
    "Strong opinions on component architecture and state management"
  ],
  "nextSteps": [
    "Review Acme's product demo and identify 2-3 UI improvement opportunities",
    "Research the engineering team on LinkedIn to find mutual connections",
    "Prepare a technical case study from your portfolio showing relevant React work",
    "Draft outreach email to Engineering Manager highlighting relevant experience",
    "Set up Google Alert for Acme Corp news to stay informed"
  ],
  "emailSubjectLines": [
    "Senior React Developer excited about Acme's frontend architecture",
    "10+ years React experience - let's discuss your Senior Engineer role",
    "Scaling React apps at enterprise level - interested in Acme opportunity"
  ],
  "interviewQuestions": [
    "How does the frontend team balance shipping features vs. technical debt?",
    "What's the biggest frontend architecture challenge you're facing currently?",
    "How does Acme approach frontend testing and quality assurance?",
    "What does the code review and deployment process look like?",
    "How does the engineering team collaborate with product and design?"
  ]
}
```

---

## 🔬 API Call #5: Contact Finding Strategies

**File**: `lib/web-scraper.ts` → `findCompanyContacts()`
**Model**: `llama-3.1-8b-instant`
**Purpose**: Suggest contact search strategies

### System Prompt
```
You are a contact discovery strategist. Help job seekers find the right people to reach out to.

Return JSON with:
- suggestedRoles: Array of 3-5 job titles to search for
- searchStrategies: Array of 3-5 tactical search tips
- linkedInSearchUrl: LinkedIn search URL for finding relevant contacts

Return ONLY valid JSON.
```

### User Prompt Template
```
Company: {companyName}
Department: {department}
Target Role: {jobTitle}

Suggest strategies for finding contacts at this company.
```

### Example Output
```json
{
  "suggestedRoles": [
    "Engineering Manager",
    "Director of Engineering",
    "VP Engineering",
    "Senior Software Engineer",
    "Technical Recruiter"
  ],
  "searchStrategies": [
    "Search LinkedIn for 'Engineering Manager at Acme Corp'",
    "Check company website's 'Team' or 'About' page",
    "Look for Acme engineers who recently posted on LinkedIn",
    "Find employees who attended same schools or previous companies",
    "Check if anyone in your network has connections at Acme"
  ],
  "linkedInSearchUrl": "https://www.linkedin.com/search/results/people/?currentCompany=acme-corp&keywords=engineering%20manager"
}
```

---

## 🔬 API Call #6: Company Contact Discovery

**File**: `lib/contact-discovery.ts` → `discoverCompanyContacts()`
**Model**: `llama-4-scout-17b-16e-instruct`
**Purpose**: Find publicly available contacts

### System Prompt
```
You are a contact research assistant with access to publicly available professional data.

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
Return ONLY valid JSON.
```

### User Prompt Template
```
Company: {companyName}
Department: {department}
Looking for roles: {targetRoles.join(', ')}

Find publicly known contacts and detect email patterns.
```

### Example Output
```json
{
  "contacts": [
    {
      "name": "Sarah Johnson",
      "title": "Engineering Manager",
      "email": "sarah.johnson@acmecorp.com",
      "confidence": "high",
      "source": "Company website team page",
      "linkedin": "https://linkedin.com/in/sarahjohnson"
    },
    {
      "name": "Mike Chen",
      "title": "VP of Engineering",
      "email": null,
      "confidence": "medium",
      "source": "LinkedIn profile",
      "linkedin": "https://linkedin.com/in/mikechen"
    }
  ],
  "emailPatterns": [
    {
      "pattern": "firstname.lastname@acmecorp.com",
      "example": "sarah.johnson@acmecorp.com",
      "confidence": 85
    },
    {
      "pattern": "firstinitial.lastname@acmecorp.com",
      "example": "s.johnson@acmecorp.com",
      "confidence": 40
    }
  ]
}
```

---

## 🔬 API Call #7: Email Pattern Generation

**File**: `lib/contact-discovery.ts` → `generateEmailGuess()`
**Model**: `llama-4-maverick-17b-128e-instruct`
**Purpose**: Generate likely email addresses

### System Prompt
```
You are an email pattern expert. Based on known email patterns at a company, generate the most likely email addresses for a person.

Return JSON with:
- suggestedEmails: Array of email suggestions (ordered by confidence):
  * email: The suggested email address
  * pattern: Pattern used (e.g., "firstname.lastname@domain")
  * confidence: "high", "medium", or "low"
  * reasoning: Why this email is likely (reference the patterns)

Generate 2-4 most likely options based on common patterns.
Return ONLY valid JSON.
```

### User Prompt Template
```
Person: {personName}
Title: {personTitle}
Company: {companyName}
Company Domain: {domain}

Known Email Patterns at this company:
{emailPatterns.map(p => `- ${p.pattern} (confidence: ${p.confidence}%) - Example: ${p.example}`).join('\n')}

Generate the most likely email addresses for this person.
```

### Example Output
```json
{
  "suggestedEmails": [
    {
      "email": "sarah.johnson@acmecorp.com",
      "pattern": "firstname.lastname@domain",
      "confidence": "high",
      "reasoning": "Matches confirmed pattern with 85% confidence (sarah.johnson@acmecorp.com)"
    },
    {
      "email": "s.johnson@acmecorp.com",
      "pattern": "firstinitial.lastname@domain",
      "confidence": "medium",
      "reasoning": "Alternative pattern seen with 40% confidence"
    },
    {
      "email": "sjohnson@acmecorp.com",
      "pattern": "firstinitiallastname@domain",
      "confidence": "low",
      "reasoning": "Common corporate pattern, not confirmed at this company"
    }
  ]
}
```

---

## 🔬 API Call #8: Hiring Manager Identification

**File**: `lib/contact-discovery.ts` → `findHiringManager()`
**Model**: `llama-4-maverick-17b-128e-instruct`
**Purpose**: Identify the likely hiring manager

### System Prompt
```
You are a hiring manager identification expert. Based on the job and company, identify the most likely hiring manager.

Return JSON with:
- name: Hiring manager's name if publicly known (or null)
- title: Most likely hiring manager title (e.g., "Director of Engineering")
- emails: Array of potential emails:
  * email: Email address
  * confidence: "confirmed", "high", "medium", or "low"
  * pattern: Pattern used
- linkedin: LinkedIn profile URL if known (or null)
- reasoning: Explanation of why this person/role is likely the hiring manager

Return ONLY valid JSON.
```

### User Prompt Template
```
Company: {companyName}
Job Title: {jobTitle}
Department: {department}

Who is most likely the hiring manager for this role?
```

### Example Output
```json
{
  "name": "Sarah Johnson",
  "title": "Engineering Manager",
  "emails": [
    {
      "email": "sarah.johnson@acmecorp.com",
      "confidence": "high",
      "pattern": "firstname.lastname@acmecorp.com"
    },
    {
      "email": "s.johnson@acmecorp.com",
      "confidence": "medium",
      "pattern": "firstinitial.lastname@acmecorp.com"
    }
  ],
  "linkedin": "https://linkedin.com/in/sarahjohnson",
  "reasoning": "For a Senior Software Engineer role in the Engineering department, Sarah Johnson (Engineering Manager) is the most likely hiring manager based on her LinkedIn profile showing she manages the frontend team at Acme Corp."
}
```

---

## 🔬 API Call #9: Email Template Generation

**File**: `lib/ai.ts` → `generateEmailTemplate()`
**Model**: `llama-3.3-70b-versatile`
**Purpose**: Generate personalized outreach emails

### System Prompt
```
You are a professional email writing assistant specializing in job search outreach.

Write a concise, professional cold outreach email (150-200 words).

Guidelines:
- Start with a brief, compelling intro about why you're reaching out
- Mention 1-2 specific things about the company or role that excite you
- Highlight 1-2 relevant qualifications
- Include a clear call to action (request for call/meeting)
- Keep tone professional but warm
- Avoid being overly formal or salesy

Return JSON with:
- subject: Email subject line (compelling but professional)
- body: Full email body (ready to send)
- tone: "formal", "conversational", or "enthusiastic"

Return ONLY valid JSON.
```

### User Prompt Template
```
To: {hiringManagerName}
Company: {companyName}
Role: {jobTitle}

Company Info:
{companyInfo}

My Background:
{userBackground}

Generate a cold outreach email.
```

### Example Output
```json
{
  "subject": "Senior React Engineer with 8 years experience - excited about Acme's frontend role",
  "body": "Hi Sarah,\n\nI came across the Senior Software Engineer opening at Acme Corp and was immediately drawn to your recent $50M raise and focus on frontend architecture innovation.\n\nI've spent the last 8 years building and scaling React applications at enterprise SaaS companies. Most recently, I led a frontend team of 6 engineers at TechCo, where we reduced page load times by 40% and implemented a component library used across 12 products.\n\nI'm particularly excited about Acme's approach to AI-powered analytics and would love to discuss how my experience with real-time data visualization could contribute to your team.\n\nWould you have 15 minutes this week or next for a quick call to discuss the role and how I might add value to Acme's engineering team?\n\nBest regards,\n[Your Name]",
  "tone": "conversational"
}
```

---

## 🔬 API Call #10: Email Extraction (Regex)

**File**: `app/api/ai/enrich-on-save/route.ts`
**Model**: None (Regex-based)
**Purpose**: Extract emails directly from job description

### Implementation
```javascript
const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const emailsInDescription = (job.raw_description || '').match(emailRegex) || [];
```

### Example Input
```
Job Description:
We're hiring! Contact our recruiter at hiring@acmecorp.com or
reach out to our Engineering Manager at sarah.johnson@acmecorp.com
```

### Example Output
```javascript
[
  "hiring@acmecorp.com",
  "sarah.johnson@acmecorp.com"
]
```

---

## 📊 API Call Flow

### Complete Enrichment Sequence

```
User clicks "Enrich with AI"
    ↓
[1] enrichJobDescription() → Extract job info (llama-3.1-8b)
[2] extractCompanyInfo() → Get company details (llama-3.1-8b)
[3] scrapeCompanyWebsite() → Research company (llama-4-scout)
    ↓ (Parallel)
[4] generateActionableInsights() → Strategic advice (llama-4-maverick)
[5] findCompanyContacts() → Contact strategies (llama-3.1-8b)
[6] discoverCompanyContacts() → Find contacts (llama-4-scout)
    ↓
[7] generateEmailGuess() → Email patterns (llama-4-maverick)
[8] findHiringManager() → Identify hiring manager (llama-4-maverick)
    ↓
[9] Email Extraction (Regex) → Extract emails from description
    ↓
Auto-save contacts to database
    ↓
Return insights to user
```

---

## 💰 Cost Breakdown

| API Call | Model | Tokens (avg) | Cost | Frequency |
|----------|-------|--------------|------|-----------|
| Job Description | llama-3.1-8b | 500 | $0.0001 | 1× |
| Company Info | llama-3.1-8b | 300 | $0.00006 | 1× |
| Website Research | llama-4-scout | 800 | $0.0008 | 1× |
| Insights | llama-4-maverick | 1200 | $0.0018 | 1× |
| Contact Strategies | llama-3.1-8b | 400 | $0.00008 | 1× |
| Contact Discovery | llama-4-scout | 600 | $0.0006 | 1× |
| Email Patterns | llama-4-maverick | 500 | $0.00075 | 1× |
| Hiring Manager | llama-4-maverick | 600 | $0.0009 | 1× |
| **TOTAL** | - | **~5,000** | **$0.0032** | **per job** |

---

## 🎯 Optimization Notes

### Why Multiple Models?

1. **llama-3.1-8b-instant** - Fast extraction tasks where accuracy is high
2. **llama-4-scout** - Research tasks requiring broader knowledge
3. **llama-4-maverick** - Complex reasoning where quality matters most
4. **llama-3.3-70b** - Email writing requiring natural language quality

### Cost vs Quality Tradeoffs

- **Extraction** (calls 1-2): Speed > Quality → llama-3.1-8b
- **Research** (calls 3, 6): Balance → llama-4-scout
- **Strategy** (calls 4, 7-8): Quality > Speed → llama-4-maverick
- **Writing** (call 9): Quality + Natural → llama-3.3-70b

---

## 📝 Testing Prompts

To test each AI call individually, use these examples:

### Test Job Description
```
We're seeking a Senior Software Engineer to join our growing team. You'll work with React, TypeScript, and Node.js to build scalable web applications. 5+ years experience required. $120k-$160k salary. Remote-friendly (hybrid). Contact: hiring@acmecorp.com

Responsibilities:
- Lead frontend architecture decisions
- Build and maintain React components
- Mentor junior developers
- Collaborate with design and product teams

Requirements:
- 5+ years React experience
- Strong TypeScript skills
- Experience with Node.js and REST APIs
- AWS or cloud platform experience
```

### Test Company Name
```
Acme Corporation
```

---

**For detailed implementation, see:**
- [lib/ai.ts](lib/ai.ts) - Core AI functions
- [lib/web-scraper.ts](lib/web-scraper.ts) - Research & insights
- [lib/contact-discovery.ts](lib/contact-discovery.ts) - Contact intelligence
- [app/api/ai/enrich-on-save/route.ts](app/api/ai/enrich-on-save/route.ts) - Main enrichment endpoint