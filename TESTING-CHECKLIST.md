# GoodJob - Testing Checklist for Vercel Dev Branch

**Last Updated**: 2025-12-02
**Branch**: main → Deploy to Vercel Dev
**Recent Changes**: Multi-model AI optimization, email extraction, build fixes

---

## 🎯 Pre-Deployment Checklist

### 1. Environment Variables (Vercel Dashboard)

Make sure these are set in Vercel's environment variables:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Groq AI (Required for enrichment)
GROQ_API_KEY=your-groq-api-key-here

# Optional (for future features)
ANTHROPIC_API_KEY=your-anthropic-key-here
```

### 2. Deployment Settings

- ✅ Build command: `npm run build`
- ✅ Output directory: `.next`
- ✅ Install command: `npm install`
- ✅ Node version: 18.x or higher

---

## 🧪 Testing Priorities

### Priority 1: Core Functionality ⚡

#### Authentication
- [ ] Sign up new account
- [ ] Sign in with existing account
- [ ] Sign out
- [ ] Verify session persistence across pages

#### Job Management
- [ ] Add job manually
- [ ] Edit job details
- [ ] Delete job
- [ ] Change job status (Saved → Applied → Interviewing, etc.)
- [ ] View job details

---

### Priority 2: AI Enrichment (NEW - Multi-Model) 🤖

#### Job Enrichment Endpoint: `/api/ai/enrich-on-save`

Test with a real job description:

**Expected AI Models Used:**
1. **llama-3.1-8b-instant** - Job description parsing
2. **llama-3.1-8b-instant** - Company info extraction
3. **llama-4-scout-17b-16e-instruct** - Company website research
4. **llama-4-maverick-17b-128e-instruct** - Actionable insights generation
5. **llama-3.1-8b-instant** - Contact finding strategies
6. **llama-4-scout-17b-16e-instruct** - Contact discovery
7. **llama-4-maverick-17b-128e-instruct** - Email pattern generation
8. **llama-4-maverick-17b-128e-instruct** - Hiring manager identification

**Test Cases:**

- [ ] **Manual Job Entry**
  - Add job with description
  - Click "Enrich with AI"
  - Verify enrichment completes in ~1-2 seconds
  - Check extracted data:
    - [ ] Summary (2-3 sentences)
    - [ ] Skills array (3-10 items)
    - [ ] Responsibilities array
    - [ ] Seniority level (entry/mid/senior/lead/executive)
    - [ ] Remote status (remote/hybrid/onsite/unknown)
    - [ ] Company info (industry, size, department)

- [ ] **Auto-Enrichment on Save**
  - Save job via Chrome extension
  - Verify auto-enrichment triggers
  - Check console logs for AI model calls

- [ ] **Email Extraction** (NEW)
  - Add job with email in description (e.g., "Contact: hiring@company.com")
  - Verify email is extracted
  - Check Contacts table for auto-saved email
  - Verify source is marked as "Job Posting"

- [ ] **Contact Auto-Save** (NEW)
  - Enrich a job
  - Check Contacts table for:
    - [ ] Hiring manager (if identified)
    - [ ] Team contacts (up to 5)
    - [ ] Email patterns and suggestions
  - Verify contact notes include reasoning

---

### Priority 3: Contact Discovery 📧

#### Email Pattern Generation

- [ ] Generate email for contact
- [ ] Verify multiple email patterns suggested:
  - firstname.lastname@domain.com
  - firstnamelastname@domain.com
  - f.lastname@domain.com
  - etc.
- [ ] Check confidence levels (high/medium/low)
- [ ] Verify reasoning is provided

#### Hiring Manager Identification

- [ ] View enriched job
- [ ] Check hiring manager section
- [ ] Verify:
  - [ ] Manager title is logical for role
  - [ ] Email suggestions are provided
  - [ ] Reasoning explains the selection

---

### Priority 4: Chrome Extension 🧩

#### Installation
- [ ] Load unpacked extension in Chrome
- [ ] Verify extension icon appears
- [ ] Update popup.js with Vercel dev URL (lines 1-2)

#### Job Extraction - Test on Multiple Sites

**LinkedIn:**
- [ ] Open a LinkedIn job posting
- [ ] Click extension
- [ ] Verify fields extracted:
  - [ ] Job title
  - [ ] Company name
  - [ ] Location
  - [ ] Description
  - [ ] Salary (if available)
  - [ ] Job type (remote/hybrid/onsite)
- [ ] Save job
- [ ] Check for duplicate warning if job exists
- [ ] Verify job appears in dashboard

**Indeed:**
- [ ] Extract job from Indeed
- [ ] Verify all fields populated
- [ ] Test auto-enrichment

**Glassdoor:**
- [ ] Extract job from Glassdoor
- [ ] Verify extraction quality

**Generic Site:**
- [ ] Try a job board not in the 11+ supported list
- [ ] Verify fallback extraction works

#### Email Extraction in Extension
- [ ] Find job posting with email in description
- [ ] Save via extension
- [ ] Check dashboard for auto-saved contact with email

---

### Priority 5: Performance & Cost ⚡💰

#### AI Cost Monitoring

**Track these metrics:**
- [ ] Enrichment latency (should be 1-3 seconds)
- [ ] Groq API usage in dashboard
- [ ] Verify multi-model calls (check Groq logs)
- [ ] Confirm cost per enrichment (~$0.0032)

**Expected API Calls per Enrichment:**
- 2-3 calls with llama-3.1-8b-instant (fast extraction)
- 2-3 calls with llama-4-scout (research)
- 3-4 calls with llama-4-maverick (complex reasoning)

#### Build Performance
- [ ] Build completes without errors
- [ ] No static generation warnings
- [ ] All pages render correctly

---

## 🐛 Known Issues to Watch For

### From ENHANCEMENTS.md:

1. **Chrome Extension**
   - Edge cases on some job boards may need refinement
   - Test coverage for all 11+ boards could be improved
   - Some niche ATS platforms not yet supported

2. **Environment Variables**
   - Auth pages now use fallback values (fixed in this deployment)
   - Should work fine with proper Vercel env vars

---

## 📊 Success Criteria

### Must Pass (Critical):
- ✅ User can sign up and log in
- ✅ Jobs can be added and enriched
- ✅ AI enrichment completes successfully
- ✅ No console errors on core pages
- ✅ Build deploys without warnings

### Should Pass (Important):
- ✅ Email extraction works
- ✅ Contact auto-save works
- ✅ Chrome extension extracts from LinkedIn
- ✅ Multi-model AI calls complete in <3 seconds
- ✅ Cost per enrichment is ~$0.0032

### Nice to Have (Enhancement):
- ✅ All 11+ job boards extract correctly
- ✅ Email patterns are accurate
- ✅ Hiring manager suggestions are relevant

---

## 🔍 How to Test Each Feature

### Testing Job Enrichment:

1. **Go to Dashboard** → Jobs
2. **Add New Job** with this sample:
   ```
   Title: Senior Software Engineer
   Company: Acme Corp
   Description: We're looking for a senior engineer with 5+ years of experience in React, Node.js, and TypeScript. You'll lead our frontend team and work on our SaaS platform. Salary: $120k-$160k. Remote-friendly. Contact: hiring@acmecorp.com
   ```
3. **Click "Enrich with AI"**
4. **Wait 1-2 seconds**
5. **Verify Results:**
   - Skills should include: React, Node.js, TypeScript
   - Seniority: senior
   - Remote: hybrid or remote
   - Check Contacts tab for hiring@acmecorp.com

### Testing Chrome Extension:

1. **Open**: https://www.linkedin.com/jobs/view/[any-job-id]
2. **Click Extension Icon**
3. **Verify auto-fill works**
4. **Select status** (e.g., "Saved")
5. **Click "Save Job"**
6. **Check dashboard** - job should appear

### Testing Multi-Model AI:

1. **Open browser console** (F12)
2. **Filter by "AI"** to see logs
3. **Enrich a job**
4. **Look for log entries** showing:
   - `[AI] Starting job description enrichment...`
   - `[AI] Got response from Groq: true`
   - `[Scraper] Starting company website research...`
   - `[ContactDiscovery] Finding hiring manager...`
5. **Check Groq Dashboard** for API calls

---

## 📝 Test Results Template

Use this to track your test results:

```markdown
## Test Run: [Date]

**Tester**: [Your Name]
**Environment**: Vercel Dev Branch
**Deployment URL**: https://goodjob-[hash].vercel.app

### Core Functionality
- [ ] Auth: PASS / FAIL (Notes: ___)
- [ ] Jobs CRUD: PASS / FAIL (Notes: ___)

### AI Enrichment
- [ ] Job parsing: PASS / FAIL (Latency: ___s)
- [ ] Email extraction: PASS / FAIL (Found: ___ emails)
- [ ] Contact auto-save: PASS / FAIL (Saved: ___ contacts)

### Chrome Extension
- [ ] LinkedIn: PASS / FAIL
- [ ] Indeed: PASS / FAIL
- [ ] Generic site: PASS / FAIL

### Performance
- [ ] Build time: ___s
- [ ] Enrichment latency: ___s
- [ ] Groq API calls: ___ per enrichment
- [ ] Estimated cost: $___

### Issues Found
1. [Description of issue]
2. [Description of issue]

### Overall Status: ✅ PASS / ❌ FAIL
```

---

## 🚀 Post-Testing Actions

### If All Tests Pass:
1. Merge to production branch
2. Update ENHANCEMENTS.md with test results
3. Monitor Groq usage for 24 hours
4. Check error logs in Vercel

### If Tests Fail:
1. Document failures in GitHub Issues
2. Fix critical issues
3. Re-test
4. Update this checklist with findings

---

## 📞 Support

**Groq API Dashboard**: https://console.groq.com
**Supabase Dashboard**: https://supabase.com/dashboard
**Vercel Dashboard**: https://vercel.com/dashboard

**Cost Analysis**: See [COST-ANALYSIS.md](COST-ANALYSIS.md)
**Enhancement Log**: See [ENHANCEMENTS.md](ENHANCEMENTS.md)

---

**Status**: Ready for Vercel Dev Branch Testing
**Build**: ✅ Passing
**Last Commit**: Fix build issues with environment variables