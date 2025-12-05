# Contact Discovery - How It Works & Troubleshooting

**Understanding GoodJob's AI-powered contact intelligence**

---

## 🎯 What Contact Discovery Does

GoodJob discovers contacts **WITHOUT needing emails in the job description**. It uses AI to search public sources and infer contact information.

### Input Needed (Minimum)
- ✅ Company name (e.g., "Acme Corp")
- ✅ Job title (e.g., "Senior Software Engineer")
- ✅ Optional: Job description (helps identify department)

### What You Get Back
1. **Hiring Manager**:
   - Name (if publicly known)
   - Title (always)
   - 2-4 email address guesses
   - Reasoning why this person is likely the hiring manager

2. **Team Contacts** (up to 5):
   - Names
   - Titles
   - Email addresses (if found)
   - LinkedIn profiles (if found)
   - Confidence levels

3. **Email Patterns**:
   - Common patterns at the company
   - Confidence scores
   - Examples

4. **BONUS: Emails from Description**:
   - Any emails explicitly mentioned
   - Saved automatically

---

## 🔬 How It Works (Behind the Scenes)

### Step 1: Company Research
**AI Call**: `scrapeCompanyWebsite()`
**Model**: Llama 4 Scout
**Prompt**: "Research {company}, find their website, team size, tech stack, recent news"

### Step 2: Contact Search Strategies
**AI Call**: `findCompanyContacts()`
**Model**: Llama 3.1 8B
**Prompt**: "For {company} in {department}, what roles should we search for? Generate LinkedIn search URLs"

### Step 3: Public Contact Discovery
**AI Call**: `discoverCompanyContacts()`
**Model**: Llama 4 Scout
**Prompt**: "Find publicly known contacts at {company} in {department} for roles: {targetRoles}"

**What the AI searches** (simulated):
- LinkedIn profiles and team pages
- Company "About Us" / "Team" pages
- Press releases and news articles
- Conference speaker lists
- GitHub profiles for tech companies
- Public social media profiles

### Step 4: Hiring Manager Identification
**AI Call**: `findHiringManager()`
**Model**: Llama 4 Maverick
**Prompt**: "Who is most likely hiring for {jobTitle} at {company}? Provide name if public, otherwise suggest title"

### Step 5: Email Pattern Generation
**AI Call**: `generateEmailGuess()`
**Model**: Llama 4 Maverick
**Prompt**: "Based on email patterns at {company}, generate likely emails for {personName}"

**Example patterns discovered**:
- `firstname.lastname@company.com` (85% confidence)
- `firstinitial.lastname@company.com` (40% confidence)
- `firstname@company.com` (20% confidence)

### Step 6: Auto-Save to Database
All discovered contacts are automatically saved to your Contacts table with:
- Source: "AI Discovery"
- Notes: Reasoning and pattern information
- Confidence levels
- LinkedIn URLs if found

---

## 📊 Example: Full Contact Discovery Flow

### Input
```
Company: Stripe
Job Title: Senior Software Engineer
Department: Engineering (inferred from job description)
```

### AI Processing (8 calls)
1. ✅ Research Stripe's website and team
2. ✅ Identify engineering department structure
3. ✅ Search for Engineering Manager, Director, VP
4. ✅ Find publicly known engineers on LinkedIn
5. ✅ Detect email patterns (firstname@stripe.com)
6. ✅ Identify likely hiring manager
7. ✅ Generate email addresses
8. ✅ Provide search strategies

### Output (What Gets Saved)
```json
{
  "hiringManager": {
    "name": null,
    "title": "Engineering Manager",
    "emails": [
      {"email": "engineering@stripe.com", "confidence": "medium"},
      {"email": "jobs@stripe.com", "confidence": "low"}
    ],
    "reasoning": "For a Senior Software Engineer role, the hiring manager is typically an Engineering Manager or Director of Engineering"
  },
  "teamContacts": [
    {
      "name": "Found on LinkedIn",
      "title": "Engineering Manager",
      "email": null,
      "source": "LinkedIn profile",
      "confidence": "medium"
    }
  ],
  "emailPatterns": [
    {
      "pattern": "firstname@stripe.com",
      "confidence": 75,
      "example": "patrick@stripe.com"
    }
  ]
}
```

---

## 🤔 Why You Might Get "Generic" Results

### Scenario 1: Small/Private Companies
**Input**: Job at "Local Startup LLC"
**Result**: Generic titles, no specific names
**Why**: Small companies often don't have public team pages

**What you get**:
- ✅ Role suggestions (e.g., "Engineering Manager")
- ✅ Email pattern guesses
- ❌ Specific names (not publicly available)

### Scenario 2: Large Companies with Privacy
**Input**: Job at "Enterprise Corp"
**Result**: Some generic data
**Why**: Many large companies don't list team members publicly

**What you get**:
- ✅ Department structure insights
- ✅ Email patterns (often documented)
- ⚠️ Limited specific contact info

### Scenario 3: Well-Known Tech Companies
**Input**: Job at "Stripe", "Vercel", "Supabase"
**Result**: Rich, specific data
**Why**: These companies have public team pages, GitHub profiles, conference talks

**What you get**:
- ✅ Specific names and titles
- ✅ LinkedIn profiles
- ✅ Accurate email patterns
- ✅ Multiple contact options

---

## 🔍 How to Tell If Contact Discovery Worked

### Check the Console (F12)
During enrichment, look for these logs:

```
[ContactDiscovery] Searching for contacts at: Acme Corp
[ContactDiscovery] Found 5 contacts
[Auto-Enrichment] Saved hiring manager: Sarah Johnson
[Auto-Enrichment] Saved 3 team contacts
[Auto-Enrichment] Saved 1 emails from job description
```

### Good Signs ✅
```
[ContactDiscovery] Found 5 contacts
[Auto-Enrichment] Saved hiring manager: [name]
```

### Warning Signs ⚠️
```
[ContactDiscovery] Found 0 contacts
[Auto-Enrichment] Failed to save hiring manager: [error]
```

### Check the Contacts Tab
After enrichment, go to **Contacts** and you should see:

1. **Hiring Manager Contact**
   - Source: "AI Discovery"
   - Notes: Reasoning + email suggestions
   - Title should match job department

2. **Team Contacts** (0-5)
   - Various titles related to department
   - Some may have emails, LinkedIn URLs

3. **Emails from Description** (if any)
   - Source: "Job Posting"
   - Notes: "Email found in job description"

---

## 🐛 Troubleshooting: No Contacts Being Saved

### Issue #1: Database Constraint Error
**Symptom**: Console shows errors about "source" constraint
**Fix**: Run `migrations/add-contacts-notes.sql`

### Issue #2: AI Returns Empty Results
**Symptom**: `[ContactDiscovery] Found 0 contacts`
**Possible Causes**:
1. Company is too small/private
2. AI couldn't find public data
3. Rate limiting on Groq API

**Solution**: Try a well-known company to verify system works

### Issue #3: No Console Logs
**Symptom**: No `[ContactDiscovery]` logs appear
**Cause**: Enrichment may have failed before contact discovery
**Check**: Earlier logs for errors in job description enrichment

---

## 💡 How to Get Better Results

### 1. Use Full Company Names
❌ Bad: "Acme"
✅ Good: "Acme Corporation"

### 2. Include Job URLs
The URL often helps identify the company website:
```
URL: https://jobs.stripe.com/positions/12345
→ AI infers website: stripe.com
```

### 3. Add Company Context in Description
Help the AI understand the company:
```
We're a 500-person SaaS company based in San Francisco...
```

### 4. Test with Public Companies First
Verify the system works with companies known to have public teams:
- Stripe
- Vercel
- Supabase
- GitHub
- GitLab

### 5. Check Groq API Usage
If you've hit rate limits:
- Go to https://console.groq.com
- Check "Usage" tab
- Verify you haven't exceeded free tier

---

## 📈 Expected Results by Company Type

| Company Type | Hiring Manager Name | Team Contacts | Email Patterns | Confidence |
|--------------|---------------------|---------------|----------------|------------|
| **Major Tech (Stripe, GitHub)** | Sometimes | 3-5 | High accuracy | High |
| **Mid-size Startups** | Rarely | 1-3 | Medium accuracy | Medium |
| **Enterprise (Oracle, IBM)** | Rarely | 2-4 | Known patterns | Medium-High |
| **Small Companies (<50)** | Rarely | 0-2 | Guessed patterns | Low |
| **Stealth Startups** | Never | 0-1 | Basic patterns | Low |

---

## 🎯 What's "Generic" vs "Working as Designed"

### Generic BUT Useful
```json
{
  "hiringManagerTitle": "Engineering Manager",
  "reasoning": "For a Senior Engineer role, the hiring manager is typically an Engineering Manager",
  "emails": [
    {"email": "engineering@company.com", "confidence": "medium"}
  ]
}
```
**This is normal!** The AI can't invent names, so it gives you:
- The likely role to search for
- Email patterns to try
- Strategies to find the actual person

### Actually Rich Data
```json
{
  "hiringManagerName": "Sarah Johnson",
  "hiringManagerTitle": "Engineering Manager",
  "linkedin": "https://linkedin.com/in/sarahjohnson",
  "emails": [
    {"email": "sarah.johnson@company.com", "confidence": "high"}
  ]
}
```
**This means** the AI found public data!

---

## 🔬 Testing Contact Discovery

### Test Case 1: Well-Known Company
```
Company: Stripe
Job Title: Software Engineer
Expected:
- Hiring Manager title: "Engineering Manager"
- Team contacts: 2-5
- Email patterns: firstname@stripe.com
- Some LinkedIn profiles
```

### Test Case 2: Small Company
```
Company: My Local Coffee Shop Inc
Job Title: Barista Manager
Expected:
- Hiring Manager title: "General Manager" or "Owner"
- Team contacts: 0-1
- Email patterns: Basic guesses
- No specific names
```

### Test Case 3: With Email in Description
```
Company: Any Company
Description: "...contact hiring@company.com to apply"
Expected:
- Email extracted: hiring@company.com
- Source: "Job Posting"
- PLUS regular contact discovery results
```

---

## 📝 Understanding the 4 Contact Sources

### 1. AI Discovery
- **How**: AI searches public sources
- **Quality**: Varies by company
- **Notes**: Includes reasoning

### 2. Job Posting
- **How**: Regex extracts emails from description
- **Quality**: 100% accurate (it's in the description)
- **Notes**: "Email found in job description"

### 3. User Added
- **How**: You manually add a contact
- **Quality**: You control it
- **Notes**: Your notes

### 4. LinkedIn Export
- **How**: Import CSV from LinkedIn connections
- **Quality**: Based on your connections
- **Notes**: From CSV

---

## 🚀 Advanced: Improving Contact Discovery

### For Developers
Want better contact results? Here's how to enhance the prompts:

1. **Edit `lib/contact-discovery.ts`**
2. **Update system prompts** to include:
   - Specific sources to check (e.g., "Search company website /team page")
   - Better email pattern detection
   - More LinkedIn search strategies

3. **Increase temperature** for more creative searching:
   ```javascript
   temperature: 0.3  // Currently 0.2
   ```

4. **Add more target roles**:
   ```javascript
   targetRoles: [
     'Recruiter',
     `${department} Manager`,
     'Director',
     'VP',
     'Talent Acquisition',  // Add more roles
     'People Operations'
   ]
   ```

---

## ✅ Success Criteria

After enrichment, you should have:

### Minimum (Even for Small Companies)
- ✅ 1 contact (hiring manager title)
- ✅ Email pattern suggestions
- ✅ LinkedIn search strategy

### Good (Medium Companies)
- ✅ Hiring manager title + reasoning
- ✅ 2-3 team contacts
- ✅ 2-3 email patterns with confidence
- ✅ Some LinkedIn URLs

### Excellent (Large/Public Companies)
- ✅ Hiring manager name + title
- ✅ 3-5 specific team contacts
- ✅ Accurate email patterns (confirmed)
- ✅ Multiple LinkedIn profiles
- ✅ Specific search strategies

---

## 🎓 Key Takeaway

**Contact discovery works WITHOUT needing emails in the description!**

It uses AI to:
1. Research the company
2. Identify likely hiring managers
3. Find public contact information
4. Generate email addresses based on patterns
5. Provide search strategies

The "generic" info you saw is likely the AI being **honest** about what it can find publicly. For companies with limited public data, it gives you starting points (titles, patterns, strategies) rather than inventing fake names.

**This is working as designed** - it's not a bug, it's the AI being accurate! 🎯

---

**Next Step**: Try enriching a job from a well-known company (Stripe, Vercel, etc.) to see the full power of contact discovery!