# Email Integration Architecture
## Expanding GoodJob's AI Capabilities (Not Adapting)

**Philosophy**: Email integration is a NEW LAYER that sits on top of existing AI enrichment, not a replacement.

---

## Current AI Stack (100% UNCHANGED)

### Existing Features That Stay Exactly As-Is:

#### 1. Manual Job Enrichment
**File**: `app/api/enrichment/route.ts`
- User clicks "✨ Enrich with AI"
- Runs full AI analysis:
  - Company research (Claude Haiku)
  - Job description parsing (Groq)
  - Contact discovery (Groq)
  - Hiring manager identification (Groq)
  - Email pattern generation (Groq)
  - Actionable insights (Groq)

**Status**: ✅ Keep 100% - this is your core value prop

---

#### 2. Chrome Extension Auto-Scraping
**File**: `chrome-extension/content.js`
- Scrapes job details from LinkedIn, Indeed, etc.
- Saves job to database
- **Optional**: Auto-enriches on save

**Status**: ✅ Keep 100% - this brings jobs into the system

---

#### 3. On-Save Enrichment
**File**: `app/api/ai/enrich-on-save/route.ts`
- Automatically enriches jobs when saved via extension
- Extracts emails from job descriptions
- Saves discovered contacts

**Status**: ✅ Keep 100% - this is passive enrichment

---

#### 4. AI Models (Hybrid Strategy)
**Files**:
- `lib/web-scraper.ts` (Claude for company research)
- `lib/ai.ts` (Groq for job parsing)
- `lib/contact-discovery.ts` (Groq for contacts)

**Models in use:**
- Claude 3.5 Haiku: Company research
- Llama 3.1 8B: Job parsing, company extraction
- Llama 4 Scout: Contact discovery
- Llama 4 Maverick: Complex reasoning

**Status**: ✅ Keep 100% - this is your cost advantage

---

## NEW Layer: Email Integration

### How Email ADDS to Existing System (Not Replaces)

```
┌─────────────────────────────────────────────────────┐
│                  EXISTING SYSTEM                     │
│  (Manual enrichment + Chrome extension scraping)    │
│                                                      │
│  User clicks "Enrich" → Full AI analysis            │
│  OR                                                  │
│  Extension scrapes job → Auto-enrichment            │
│                                                      │
│  ✅ Company research                                 │
│  ✅ Contact discovery                                │
│  ✅ Email generation                                 │
│  ✅ Actionable insights                              │
└─────────────────────────────────────────────────────┘
                          ↓
                  KEEPS WORKING
                          ↓
┌─────────────────────────────────────────────────────┐
│               NEW LAYER: EMAIL SYNC                  │
│                                                      │
│  Email arrives → AI analyzes → Auto-triggers:       │
│                                                      │
│  1. Job creation (if new company detected)          │
│  2. Status update (if rejection/interview/offer)    │
│  3. Contact extraction (save sender)                │
│  4. THEN calls existing enrichment API!              │
│                                                      │
│  Result: Email → Job → Full AI Enrichment           │
└─────────────────────────────────────────────────────┘
```

---

## Email Integration Flow (Adds, Doesn't Replace)

### Scenario 1: Application Confirmation Email Arrives

**What Happens:**

```
1. Email Sync (NEW)
   ├─ Email received: "Thank you for applying to Stripe"
   ├─ AI analyzes email (NEW AI function)
   └─ Detects: Application confirmation, Company=Stripe, Title=Software Engineer

2. Auto Job Creation (NEW)
   ├─ Check if job exists for Stripe
   ├─ If NOT: Create new job in database
   └─ Extract recruiter contact from email signature

3. EXISTING Enrichment Triggered (UNCHANGED)
   ├─ Call /api/enrichment with jobId
   ├─ Company research (Claude - existing)
   ├─ Contact discovery (Groq - existing)
   ├─ Email patterns (Groq - existing)
   └─ Actionable insights (Groq - existing)

4. Result
   ├─ Job created from email ✅ (NEW)
   ├─ Recruiter saved as contact ✅ (NEW)
   ├─ Email linked to job ✅ (NEW)
   └─ Full AI enrichment completed ✅ (EXISTING SYSTEM)
```

**Key Point**: Email integration **calls** existing enrichment, doesn't replace it!

---

### Scenario 2: User Manually Adds Job (No Change)

**What Happens:**

```
1. User manually creates job
   ├─ Via web app form
   └─ Via Chrome extension scraping

2. EXISTING Enrichment (UNCHANGED)
   ├─ User clicks "✨ Enrich with AI"
   ├─ Full AI analysis runs
   └─ Contact discovery, insights, etc.

3. Result
   ├─ Works exactly as before ✅
   └─ No email integration involved ✅
```

---

### Scenario 3: Interview Request Email Arrives

**What Happens:**

```
1. Email Sync (NEW)
   ├─ Email received: "Schedule interview for Software Engineer role"
   ├─ AI analyzes email
   └─ Detects: Interview request, Stripe, interview date

2. Auto Job Linking (NEW)
   ├─ Find existing job for Stripe (created earlier via email or manually)
   └─ Link this email to that job

3. Auto Status Update (NEW)
   ├─ Update job status: 'applied' → 'interviewing'
   └─ Create reminder for interview date

4. EXISTING Enrichment (STILL AVAILABLE)
   ├─ User can click "🔄 Re-enrich"
   ├─ Gets latest company news
   └─ Updates contact info

5. Result
   ├─ Email linked to job ✅ (NEW)
   ├─ Status auto-updated ✅ (NEW)
   ├─ Reminder created ✅ (NEW)
   └─ Full enrichment still accessible ✅ (EXISTING)
```

---

## AI Functions: Existing vs New

### EXISTING AI Functions (100% Unchanged)

| Function | File | Purpose | Model | Cost |
|----------|------|---------|-------|------|
| `enrichJobDescription()` | lib/ai.ts | Parse job details | Llama 3.1 8B | $0.0001 |
| `extractCompanyInfo()` | lib/ai.ts | Get company metadata | Llama 3.1 8B | $0.0001 |
| `scrapeCompanyWebsite()` | lib/web-scraper.ts | Company research | Claude Haiku | $0.0005 |
| `generateActionableInsights()` | lib/web-scraper.ts | Talking points, etc. | Llama 4 Maverick | $0.0009 |
| `findCompanyContacts()` | lib/web-scraper.ts | Contact strategies | Llama 3.1 8B | $0.0001 |
| `getContactIntelligence()` | lib/contact-discovery.ts | Hiring manager ID | Llama 4 Maverick | $0.0009 |
| `discoverCompanyContacts()` | lib/contact-discovery.ts | Team contacts | Llama 4 Scout | $0.0004 |
| `generateEmailGuess()` | lib/contact-discovery.ts | Email patterns | Llama 4 Maverick | $0.0005 |
| `findHiringManager()` | lib/contact-discovery.ts | Hiring manager | Llama 4 Maverick | $0.0006 |

**Total existing enrichment cost**: ~$0.0035 per job

**Status**: ✅ ALL FUNCTIONS STAY - Zero changes!

---

### NEW AI Functions (For Email Only)

| Function | File | Purpose | Model | Cost |
|----------|------|---------|-------|------|
| `analyzeEmailContent()` | lib/email-analyzer.ts | Classify email type | Llama 3.1 8B | $0.00005 |
| `extractEmailMetadata()` | lib/email-analyzer.ts | Get company/title | Llama 3.1 8B | $0.00003 |
| `linkEmailToJob()` | lib/email-job-matcher.ts | Match email→job | No AI (SQL) | $0 |
| `generateEmailReply()` | lib/email-generator.ts | Smart replies | Llama 3.3 70B | $0.0015 |

**Total email analysis cost**: ~$0.00005 per email

**Key**: Email AI functions are **separate** and **additional** to existing enrichment

---

## Database: Existing vs New Tables

### EXISTING Tables (100% Unchanged)

```sql
-- Core tables stay exactly as-is
jobs (
  id, user_id, title, company, url,
  raw_description, extracted_description,
  status, resume_used, notes,
  created_at, updated_at, ai_enriched_at
)

contacts (
  id, user_id, job_id,
  name, email, title, source,
  created_at
)

reminders (
  id, user_id, job_id,
  date, message, completed,
  created_at
)

linkedin_connections (
  id, user_id,
  name, company, title,
  created_at
)
```

**Status**: ✅ No schema changes to existing tables!

---

### NEW Tables (For Email Integration)

```sql
-- OAuth connections
oauth_connections (
  id, user_id, provider, email_address,
  access_token, refresh_token, expires_at,
  scope, created_at, updated_at
)

-- Email storage
emails (
  id, user_id, provider_email_id,
  thread_id, subject, sender_email, sender_name,
  recipient_emails, cc_emails,
  body_text, body_html, received_at,

  -- Linking (NEW: links to existing jobs/contacts tables)
  job_id,        -- FK to jobs.id (EXISTING TABLE)
  contact_id,    -- FK to contacts.id (EXISTING TABLE)

  -- AI analysis
  is_job_related, detected_company, detected_job_title,
  email_type, confidence_score, analyzed_at
)
```

**Key**: New `emails` table **links to** existing `jobs` and `contacts` tables

---

## API Routes: Existing vs New

### EXISTING Routes (100% Unchanged)

```
POST /api/enrichment
  ├─ Existing manual enrichment
  ├─ Called when user clicks "Enrich"
  └─ Also called by email triggers

POST /api/ai/enrich-on-save
  ├─ Existing auto-enrichment on save
  ├─ Called by Chrome extension
  └─ Stays unchanged

POST /api/contacts
  ├─ Manual contact creation
  └─ Stays unchanged
```

**Status**: ✅ All existing routes stay exactly as-is!

---

### NEW Routes (For Email Integration)

```
GET  /api/auth/outlook/authorize
  ├─ NEW: OAuth flow start
  └─ Redirects to Microsoft login

GET  /api/auth/outlook/callback
  ├─ NEW: OAuth callback
  └─ Stores tokens, redirects to dashboard

POST /api/email/sync
  ├─ NEW: Fetch latest emails
  ├─ Analyze with AI
  └─ Link to jobs/contacts

POST /api/email/process
  ├─ NEW: Auto-actions on emails
  ├─ Create jobs if needed
  ├─ THEN calls existing /api/enrichment!
  └─ Update statuses

GET  /api/cron/sync-emails
  ├─ NEW: Auto-sync every 15 min
  └─ Calls /api/email/sync for all users
```

**Key**: New email routes **call** existing enrichment routes!

---

## UI: Existing vs New Components

### EXISTING UI (100% Unchanged)

```
Dashboard
  ├─ Job pipeline (Kanban board) ✅
  ├─ Job cards with "Enrich" button ✅
  └─ Job detail view with AI insights ✅

Job Detail View
  ├─ Company research section ✅
  ├─ Contact intelligence ✅
  ├─ Hiring manager info ✅
  ├─ Email patterns ✅
  ├─ Actionable insights ✅
  ├─ Interview questions ✅
  └─ "Enrich" / "Re-enrich" buttons ✅

Contacts Page
  ├─ List of discovered contacts ✅
  ├─ Email addresses ✅
  └─ Manual contact creation ✅
```

**Status**: ✅ All existing UI stays exactly the same!

---

### NEW UI (For Email Integration)

```
Settings Page
  └─ NEW: "Email Integration" section
      ├─ "Connect Outlook" button
      ├─ "Connect Gmail" button (future)
      └─ Connection status display

Job Detail View (NEW SECTION ADDED)
  └─ Email History Tab (NEW)
      ├─ List of related emails
      ├─ Email type badges
      ├─ View full email button
      └─ "Reply with AI" button

Dashboard (NEW INDICATOR)
  └─ Job cards now show:
      ├─ Email count badge (NEW)
      └─ "Last email: 2 days ago" (NEW)

Notifications (NEW)
  └─ Toast notifications:
      ├─ "New job from email: Stripe" (NEW)
      ├─ "Interview request detected" (NEW)
      └─ "Status updated: Rejected" (NEW)
```

**Key**: Email UI is **additive** - doesn't replace existing views!

---

## Complete User Workflows

### Workflow 1: Manual Job (Current - Unchanged)

```
1. User manually adds job
   ├─ Via web form
   └─ OR Chrome extension scrapes job

2. Click "✨ Enrich with AI"

3. EXISTING AI enrichment runs
   ├─ Company research (Claude)
   ├─ Contact discovery (Groq)
   ├─ Email patterns (Groq)
   └─ Insights (Groq)

4. Results displayed in UI
   ├─ Company info
   ├─ Contacts with emails
   ├─ Hiring manager
   └─ Next steps

✅ Works exactly as it does today
```

---

### Workflow 2: Email-Driven Job (NEW)

```
1. Email arrives: "Thanks for applying to Stripe"

2. Email sync (NEW)
   ├─ AI analyzes email
   └─ Detects: Application confirmation

3. Auto job creation (NEW)
   ├─ Create job: Stripe, Software Engineer
   └─ Save recruiter as contact

4. EXISTING enrichment triggered
   ├─ Same AI functions as manual flow
   ├─ Company research (Claude)
   ├─ Contact discovery (Groq)
   └─ Insights (Groq)

5. User sees notification (NEW)
   ├─ "New job created from email: Stripe"
   └─ Click to view fully enriched job

✅ Email adds automation, enrichment stays the same
```

---

### Workflow 3: Status Update Email (NEW)

```
1. Email arrives: "Interview scheduled for Tuesday"

2. Email sync (NEW)
   ├─ AI analyzes email
   └─ Detects: Interview request

3. Auto-linking (NEW)
   ├─ Find existing job for this company
   └─ Link email to that job

4. Auto-actions (NEW)
   ├─ Update status: 'applied' → 'interviewing'
   ├─ Create reminder for Tuesday
   └─ Save email to job history

5. User can still:
   ├─ Click "🔄 Re-enrich" (EXISTING)
   ├─ View company research (EXISTING)
   └─ See updated hiring manager info (EXISTING)

✅ Email triggers updates, enrichment available on demand
```

---

## Cost Breakdown: Existing + New

### EXISTING Costs (Per Job)

```
Manual/Extension Job Enrichment:
- Company research (Claude): $0.0005
- Job parsing (Groq): $0.0001
- Company extraction (Groq): $0.0001
- Contact discovery (Groq): $0.0004
- Hiring manager (Groq): $0.0006
- Email patterns (Groq): $0.0005
- Insights (Groq): $0.0009
- Contact intelligence (Groq): $0.0009

Total per job: $0.0035
```

**At 10,000 users:**
- 25 enrichments/user/month
- 250,000 enrichments × $0.0035 = **$875/month**

---

### NEW Costs (Email Only)

```
Email Processing (Per Email):
- Email classification (Groq): $0.00005
- Metadata extraction (Groq): $0.00003

Total per email: $0.00008

PLUS if email creates new job:
- Existing enrichment: $0.0035 (same as manual)
```

**At 10,000 users:**
- 100 emails/user/month = 1,000,000 emails
- 1M × $0.00008 = **$80/month** (email analysis only)
- Plus enrichment for new jobs: ~$200/month
- **Total NEW cost: $280/month**

**Combined total at 10,000 users:**
- Existing enrichment: $875/month
- NEW email processing: $280/month
- **Total: $1,155/month**

**Revenue at 10,000 users: $44,200/month**
**Profit: $43,045/month (97.4% margin)**

✅ Email adds minimal cost, massive value!

---

## Summary: What Changes vs What Stays

### ✅ STAYS EXACTLY THE SAME (100%)

1. All existing AI enrichment functions
2. All existing API routes
3. All existing UI components
4. All existing database tables (jobs, contacts, reminders)
5. All existing workflows (manual add, extension scrape)
6. Chrome extension functionality
7. Contact discovery system
8. Email pattern generation
9. Company research (Claude)
10. Actionable insights

**Result**: Current users see ZERO changes unless they connect email

---

### ✨ NEW ADDITIONS

1. OAuth connection flow
2. Email sync system
3. Email analysis AI functions
4. Auto job creation from emails
5. Auto status updates from emails
6. Email history view in UI
7. Email-to-job linking
8. Smart notifications
9. 2 new database tables (oauth_connections, emails)
10. 4 new API routes (auth, sync, process, cron)

**Result**: Email users get automation ON TOP OF existing features

---

## Development Strategy

### Phase 1: Core Email Sync (No Enrichment Integration Yet)

```
Week 1:
├─ Port OAuth from Scout Scheduling
├─ Create database tables
├─ Build email sync endpoint
└─ Test: Emails saved to database ✅

Week 2:
├─ Add AI email classification
├─ Build email-to-job linking
├─ Create email history UI
└─ Test: Emails display in UI ✅

Status: Email integration works, but doesn't trigger enrichment yet
```

---

### Phase 2: Connect Email to Existing Enrichment

```
Week 3:
├─ Add enrichment trigger to email processor
├─ Email creates job → Calls /api/enrichment (EXISTING)
├─ Test: Email → Job → Full AI enrichment ✅
└─ No changes to enrichment code needed!

Week 4:
├─ Add status auto-updates
├─ Add smart notifications
├─ Polish UI
└─ Test: Full workflow end-to-end ✅

Status: Email fully integrated with existing AI system
```

---

## Key Architectural Principles

### 1. Separation of Concerns

```
Email Layer (NEW)
  ├─ Handles email sync
  ├─ Classifies emails
  └─ Creates/links jobs
      ↓
Enrichment Layer (EXISTING)
  ├─ Receives job ID
  ├─ Runs full AI analysis
  └─ Returns enriched data
```

**Email doesn't know about enrichment internals**
**Enrichment doesn't know about email source**

---

### 2. API Reuse

```typescript
// Email processor (NEW)
async function handleApplicationConfirmation(email) {
  // 1. Create job
  const job = await createJob({
    company: email.detected_company,
    title: email.detected_job_title,
    status: 'applied'
  });

  // 2. CALL EXISTING ENRICHMENT API
  await fetch('/api/enrichment', {
    method: 'POST',
    body: JSON.stringify({
      jobId: job.id,
      company: job.company,
      title: job.title
    })
  });

  // Enrichment runs exactly as if user clicked "Enrich" button
}
```

**Zero changes to existing enrichment code!**

---

### 3. Backward Compatibility

```typescript
// EXISTING enrichment route (no changes needed)
export async function POST(request: NextRequest) {
  const { jobId, description, company, title } = await request.json();

  // Works for:
  // 1. Manual enrichment (user clicks button)
  // 2. Extension enrichment (scrapes job)
  // 3. Email enrichment (email creates job) ← NEW SOURCE, SAME CODE

  // ... existing enrichment logic unchanged
}
```

**Email is just another trigger, same enrichment!**

---

## Final Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    GOODJOB PLATFORM                      │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   EXISTING          EXISTING            NEW
   Manual Entry    Extension Scrape   Email Sync
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                    Job Created
                          │
                          ↓
        ┌─────────────────────────────────────┐
        │   EXISTING ENRICHMENT SYSTEM         │
        │   (ZERO CHANGES)                     │
        │                                      │
        │   ✓ Company Research (Claude)        │
        │   ✓ Contact Discovery (Groq)         │
        │   ✓ Email Patterns (Groq)            │
        │   ✓ Insights (Groq)                  │
        └─────────────────────────────────────┘
                          │
                          ↓
                 Enriched Job Data
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   EXISTING          EXISTING            NEW
   Job Detail View   Contact List    Email History
```

---

## Conclusion

**Email integration expands GoodJob, not adapts it.**

✅ All existing AI functions stay 100% unchanged
✅ All existing workflows continue working
✅ Existing users see zero breaking changes
✅ Email is an additional input source
✅ Email triggers existing enrichment system
✅ Cost increases by only 32% ($280 for emails)
✅ Value increases by 300%+ (automation)

**This is the right architecture.**