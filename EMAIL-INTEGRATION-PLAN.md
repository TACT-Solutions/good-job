# Email Integration Implementation Plan

**Goal**: Connect Outlook/Gmail to GoodJob CRM for automated job tracking via email analysis

**Status**: Planning Phase
**Timeline**: 3-4 weeks to MVP
**Reusing**: Scout Scheduling OAuth infrastructure

---

## Phase 1: OAuth & Email Connection (Week 1)

### 1.1 Port OAuth from Scout Scheduling

**Files to Port:**
- OAuth authorization flow
- Callback handler
- Token storage & refresh logic
- Microsoft Graph API client

**New Files in GoodJob:**
```
app/api/auth/outlook/
  ├── authorize.ts        # Redirect to Microsoft OAuth
  ├── callback.ts         # Handle OAuth callback
  └── disconnect.ts       # Remove email connection

lib/
  ├── microsoft-graph.ts  # Graph API client (from Scout)
  └── token-encryption.ts # Encrypt/decrypt tokens
```

**Database Migration:**
```sql
-- New table for OAuth tokens
CREATE TABLE oauth_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  provider TEXT NOT NULL, -- 'outlook', 'gmail'
  email_address TEXT NOT NULL,
  access_token TEXT NOT NULL, -- Encrypted
  refresh_token TEXT NOT NULL, -- Encrypted
  expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own connections" ON oauth_connections
  USING (auth.uid() = user_id);
```

**Environment Variables:**
```env
# From Scout Scheduling
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_REDIRECT_URI=https://goodjob.app/api/auth/outlook/callback

# For token encryption
ENCRYPTION_KEY=generate-32-byte-key
```

**UI Changes:**
```
Settings Page:
┌────────────────────────────────────┐
│ Email Integration                  │
│                                    │
│ Connect your email to automatically│
│ track job applications             │
│                                    │
│ [📧 Connect Outlook]               │
│ [📧 Connect Gmail] (coming soon)   │
└────────────────────────────────────┘
```

---

## Phase 2: Email Storage & Sync (Week 1-2)

### 2.1 Email Storage Schema

```sql
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Email metadata
  provider_email_id TEXT NOT NULL, -- Graph API message ID
  thread_id TEXT, -- Conversation thread ID
  subject TEXT,
  sender_email TEXT,
  sender_name TEXT,
  recipient_emails TEXT[], -- Array of TO addresses
  cc_emails TEXT[],

  -- Content
  body_text TEXT, -- Plain text body
  body_html TEXT, -- HTML body

  -- Timestamps
  received_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  -- Linking
  job_id UUID REFERENCES jobs(id), -- Auto-linked job
  contact_id UUID REFERENCES contacts(id), -- Auto-linked contact

  -- AI Analysis
  is_job_related BOOLEAN DEFAULT false,
  detected_company TEXT,
  detected_job_title TEXT,
  email_type TEXT, -- 'application_confirmation', 'rejection', 'interview_request', etc.
  confidence_score FLOAT, -- 0.0 to 1.0

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,

  UNIQUE(user_id, provider_email_id)
);

-- Index for fast lookups
CREATE INDEX idx_emails_user_id ON emails(user_id);
CREATE INDEX idx_emails_job_id ON emails(job_id);
CREATE INDEX idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX idx_emails_sender ON emails(sender_email);

-- RLS
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own emails" ON emails
  USING (auth.uid() = user_id);
```

### 2.2 Email Sync API

**File: `app/api/email/sync.ts`**

```typescript
/**
 * Syncs latest emails from connected email providers
 * Can be called manually or via cron job
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLatestEmails } from '@/lib/microsoft-graph';
import { analyzeEmailContent } from '@/lib/email-analyzer';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get OAuth connection
    const { data: connection } = await supabase
      .from('oauth_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'outlook')
      .single();

    if (!connection) {
      return NextResponse.json({ error: 'No email connection found' }, { status: 404 });
    }

    // Get last sync timestamp
    const { data: lastEmail } = await supabase
      .from('emails')
      .select('received_at')
      .eq('user_id', user.id)
      .order('received_at', { ascending: false })
      .limit(1)
      .single();

    const since = lastEmail?.received_at || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Fetch new emails from Microsoft Graph
    const newEmails = await getLatestEmails(connection, since);

    console.log(`[EmailSync] Found ${newEmails.length} new emails for ${user.email}`);

    // Process each email
    let saved = 0;
    for (const email of newEmails) {
      // Analyze with AI
      const analysis = await analyzeEmailContent(email);

      // Save to database
      const { error } = await supabase.from('emails').insert({
        user_id: user.id,
        provider_email_id: email.id,
        thread_id: email.conversationId,
        subject: email.subject,
        sender_email: email.from.emailAddress.address,
        sender_name: email.from.emailAddress.name,
        recipient_emails: email.toRecipients.map((r: any) => r.emailAddress.address),
        cc_emails: email.ccRecipients?.map((r: any) => r.emailAddress.address) || [],
        body_text: email.bodyPreview,
        body_html: email.body.content,
        received_at: email.receivedDateTime,

        // AI analysis
        is_job_related: analysis.isJobRelated,
        detected_company: analysis.company,
        detected_job_title: analysis.jobTitle,
        email_type: analysis.type,
        confidence_score: analysis.confidence,
        analyzed_at: new Date().toISOString(),
      });

      if (!error) saved++;
    }

    console.log(`[EmailSync] Saved ${saved}/${newEmails.length} emails`);

    return NextResponse.json({
      success: true,
      emailsProcessed: newEmails.length,
      emailsSaved: saved
    });
  } catch (error) {
    console.error('[EmailSync] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Sync failed'
    }, { status: 500 });
  }
}
```

### 2.3 Cron Job for Auto-Sync

**File: `app/api/cron/sync-emails/route.ts`**

```typescript
/**
 * Vercel Cron: Runs every 15 minutes
 * Syncs emails for all users with connected accounts
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Create Supabase admin client (bypass RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get all users with OAuth connections
    const { data: connections } = await supabase
      .from('oauth_connections')
      .select('user_id, email_address')
      .eq('provider', 'outlook');

    console.log(`[Cron] Syncing emails for ${connections?.length || 0} users`);

    let successCount = 0;
    for (const conn of connections || []) {
      try {
        // Call sync endpoint for each user
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`,
            'x-user-id': conn.user_id, // Pass user context
          },
        });

        if (response.ok) successCount++;
      } catch (error) {
        console.error(`[Cron] Failed to sync for user ${conn.user_id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      usersProcessed: connections?.length || 0,
      successfulSyncs: successCount
    });
  } catch (error) {
    console.error('[Cron] Email sync error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
```

**Vercel cron config (`vercel.json`):**
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-emails",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

---

## Phase 3: AI Email Analysis (Week 2)

### 3.1 Email Analyzer

**File: `lib/email-analyzer.ts`**

```typescript
/**
 * AI-powered email analysis for job search
 * Detects job-related emails and extracts metadata
 */

import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build',
});

interface EmailAnalysis {
  isJobRelated: boolean;
  company: string | null;
  jobTitle: string | null;
  type: 'application_confirmation' | 'rejection' | 'interview_request' | 'offer' | 'follow_up' | 'other';
  confidence: number; // 0.0 to 1.0
  extractedData: {
    recruiterName?: string;
    recruiterEmail?: string;
    interviewDate?: string;
    salary?: string;
    nextSteps?: string[];
  };
  suggestedAction: 'create_job' | 'update_status' | 'add_contact' | 'set_reminder' | 'none';
}

export async function analyzeEmailContent(email: {
  subject: string;
  sender: { name: string; email: string };
  bodyText: string;
}): Promise<EmailAnalysis> {
  try {
    console.log('[EmailAnalyzer] Analyzing:', email.subject);

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an email analyzer for job search tracking. Analyze emails to determine if they're job-related and extract key information.

Return JSON with:
- isJobRelated: boolean (true if about a job application, interview, offer, or rejection)
- company: string | null (company name if mentioned)
- jobTitle: string | null (job title if mentioned)
- type: one of 'application_confirmation', 'rejection', 'interview_request', 'offer', 'follow_up', 'other'
- confidence: number 0.0-1.0 (how confident you are this is job-related)
- extractedData: object with:
  - recruiterName: string (if mentioned)
  - recruiterEmail: string (if mentioned)
  - interviewDate: ISO date string (if mentioned)
  - salary: string (if mentioned)
  - nextSteps: array of action items
- suggestedAction: 'create_job' | 'update_status' | 'add_contact' | 'set_reminder' | 'none'

Examples of job-related emails:
- "Thank you for your application to [Company]"
- "We'd like to schedule an interview"
- "Unfortunately, we've decided to move forward with other candidates"
- "Congratulations! We'd like to extend an offer"

Return ONLY valid JSON.`,
        },
        {
          role: 'user',
          content: `Analyze this email:

Subject: ${email.subject}
From: ${email.sender.name} <${email.sender.email}>

Body:
${email.bodyText.substring(0, 1000)}...`,
        },
      ],
      model: 'llama-3.1-8b-instant', // Fast for classification
      temperature: 0.2,
      max_tokens: 800,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) throw new Error('No response from AI');

    const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(cleanedResult);

    console.log('[EmailAnalyzer] Result:', {
      isJobRelated: analysis.isJobRelated,
      type: analysis.type,
      company: analysis.company,
      confidence: analysis.confidence
    });

    return analysis;
  } catch (error) {
    console.error('[EmailAnalyzer] Error:', error);

    // Fallback: heuristic-based detection
    const subject = email.subject.toLowerCase();
    const body = email.bodyText.toLowerCase();

    const jobKeywords = [
      'application', 'interview', 'position', 'role', 'candidate',
      'resume', 'cv', 'hiring', 'recruiter', 'offer', 'job',
      'screening', 'assessment', 'onsite', 'phone screen'
    ];

    const isJobRelated = jobKeywords.some(keyword =>
      subject.includes(keyword) || body.includes(keyword)
    );

    return {
      isJobRelated,
      company: null,
      jobTitle: null,
      type: 'other',
      confidence: isJobRelated ? 0.6 : 0.3,
      extractedData: {},
      suggestedAction: 'none',
    };
  }
}
```

### 3.2 Auto-Linking Emails to Jobs

**File: `lib/email-job-matcher.ts`**

```typescript
/**
 * Links emails to existing jobs based on company/sender
 */

import { createClient } from '@/lib/supabase/server';

export async function linkEmailToJob(
  userId: string,
  email: {
    sender_email: string;
    detected_company: string | null;
    detected_job_title: string | null;
  }
): Promise<string | null> {
  const supabase = await createClient();

  try {
    // Strategy 1: Match by contact email
    const { data: contact } = await supabase
      .from('contacts')
      .select('job_id')
      .eq('user_id', userId)
      .eq('email', email.sender_email)
      .not('job_id', 'is', null)
      .single();

    if (contact?.job_id) {
      console.log('[EmailMatcher] Matched via contact email:', email.sender_email);
      return contact.job_id;
    }

    // Strategy 2: Match by company name
    if (email.detected_company) {
      const { data: job } = await supabase
        .from('jobs')
        .select('id')
        .eq('user_id', userId)
        .ilike('company', `%${email.detected_company}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (job?.id) {
        console.log('[EmailMatcher] Matched via company:', email.detected_company);
        return job.id;
      }
    }

    // Strategy 3: Match by job title + company
    if (email.detected_company && email.detected_job_title) {
      const { data: job } = await supabase
        .from('jobs')
        .select('id')
        .eq('user_id', userId)
        .ilike('company', `%${email.detected_company}%`)
        .ilike('title', `%${email.detected_job_title}%`)
        .single();

      if (job?.id) {
        console.log('[EmailMatcher] Matched via company + title');
        return job.id;
      }
    }

    console.log('[EmailMatcher] No match found');
    return null;
  } catch (error) {
    console.error('[EmailMatcher] Error:', error);
    return null;
  }
}
```

---

## Phase 4: Automated Actions (Week 3)

### 4.1 Email Triggers

**File: `lib/email-triggers.ts`**

```typescript
/**
 * Automated actions based on email analysis
 */

import { createClient } from '@/lib/supabase/server';
import { scrapeCompanyWebsite } from '@/lib/web-scraper';
import { getContactIntelligence } from '@/lib/contact-discovery';

export async function handleApplicationConfirmation(
  userId: string,
  email: {
    id: string;
    detected_company: string;
    detected_job_title: string;
    sender_email: string;
    sender_name: string;
  }
) {
  const supabase = await createClient();

  console.log('[EmailTrigger] Application confirmation detected:', email.detected_company);

  // 1. Check if job already exists
  const { data: existingJob } = await supabase
    .from('jobs')
    .select('id')
    .eq('user_id', userId)
    .ilike('company', `%${email.detected_company}%`)
    .single();

  if (existingJob) {
    // Update status to 'applied'
    await supabase
      .from('jobs')
      .update({
        status: 'applied',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingJob.id);

    // Link email to job
    await supabase
      .from('emails')
      .update({ job_id: existingJob.id })
      .eq('id', email.id);

    console.log('[EmailTrigger] Updated existing job to "applied"');
    return;
  }

  // 2. Create new job
  const { data: newJob } = await supabase
    .from('jobs')
    .insert({
      user_id: userId,
      company: email.detected_company,
      title: email.detected_job_title || 'Position',
      status: 'applied',
    })
    .select()
    .single();

  if (!newJob) {
    console.error('[EmailTrigger] Failed to create job');
    return;
  }

  console.log('[EmailTrigger] Created new job:', newJob.id);

  // 3. Link email to new job
  await supabase
    .from('emails')
    .update({ job_id: newJob.id })
    .eq('id', email.id);

  // 4. Save recruiter as contact
  await supabase.from('contacts').insert({
    user_id: userId,
    job_id: newJob.id,
    name: email.sender_name,
    email: email.sender_email,
    title: 'Recruiter',
    source: 'Email',
  });

  // 5. Trigger AI enrichment (async - don't wait)
  fetch('/api/enrichment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobId: newJob.id,
      company: email.detected_company,
      title: email.detected_job_title,
    }),
  }).catch(err => console.error('[EmailTrigger] Enrichment failed:', err));

  console.log('[EmailTrigger] Job created and enrichment triggered');
}

export async function handleRejection(
  userId: string,
  emailId: string,
  jobId: string | null
) {
  if (!jobId) return;

  const supabase = await createClient();

  console.log('[EmailTrigger] Rejection detected for job:', jobId);

  // Update job status to 'rejected'
  await supabase
    .from('jobs')
    .update({
      status: 'rejected',
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);

  console.log('[EmailTrigger] Updated job status to "rejected"');
}

export async function handleInterviewRequest(
  userId: string,
  email: {
    id: string;
    job_id: string | null;
    extractedData: {
      interviewDate?: string;
    };
  }
) {
  if (!email.job_id) return;

  const supabase = await createClient();

  console.log('[EmailTrigger] Interview request detected for job:', email.job_id);

  // Update job status to 'interviewing'
  await supabase
    .from('jobs')
    .update({
      status: 'interviewing',
      updated_at: new Date().toISOString()
    })
    .eq('id', email.job_id);

  // Create reminder if date is provided
  if (email.extractedData.interviewDate) {
    await supabase.from('reminders').insert({
      user_id: userId,
      job_id: email.job_id,
      date: email.extractedData.interviewDate,
      message: 'Interview scheduled',
    });

    console.log('[EmailTrigger] Created interview reminder');
  }

  console.log('[EmailTrigger] Updated job status to "interviewing"');
}
```

### 4.2 Email Processing Pipeline

**File: `app/api/email/process/route.ts`**

```typescript
/**
 * Post-sync processing: Links emails to jobs and triggers actions
 * Called after email sync completes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { linkEmailToJob } from '@/lib/email-job-matcher';
import {
  handleApplicationConfirmation,
  handleRejection,
  handleInterviewRequest,
} from '@/lib/email-triggers';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all unprocessed job-related emails
    const { data: emails } = await supabase
      .from('emails')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_job_related', true)
      .is('job_id', null) // Not yet linked
      .order('received_at', { ascending: true })
      .limit(50);

    console.log(`[EmailProcessor] Processing ${emails?.length || 0} emails`);

    let processed = 0;
    for (const email of emails || []) {
      // 1. Try to link to existing job
      const jobId = await linkEmailToJob(user.id, {
        sender_email: email.sender_email,
        detected_company: email.detected_company,
        detected_job_title: email.detected_job_title,
      });

      if (jobId) {
        await supabase
          .from('emails')
          .update({ job_id: jobId })
          .eq('id', email.id);
      }

      // 2. Trigger automated actions
      switch (email.email_type) {
        case 'application_confirmation':
          await handleApplicationConfirmation(user.id, {
            id: email.id,
            detected_company: email.detected_company,
            detected_job_title: email.detected_job_title,
            sender_email: email.sender_email,
            sender_name: email.sender_name,
          });
          break;

        case 'rejection':
          await handleRejection(user.id, email.id, jobId);
          break;

        case 'interview_request':
          await handleInterviewRequest(user.id, {
            id: email.id,
            job_id: jobId,
            extractedData: email.extractedData || {},
          });
          break;

        case 'offer':
          if (jobId) {
            await supabase
              .from('jobs')
              .update({ status: 'offer' })
              .eq('id', jobId);
          }
          break;
      }

      processed++;
    }

    return NextResponse.json({
      success: true,
      emailsProcessed: processed
    });
  } catch (error) {
    console.error('[EmailProcessor] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Processing failed'
    }, { status: 500 });
  }
}
```

---

## Phase 5: UI Integration (Week 3-4)

### 5.1 Email Connection UI

**File: `app/settings/page.tsx` (add section)**

```tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function EmailSettings() {
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnectOutlook = async () => {
    setConnecting(true);
    window.location.href = '/api/auth/outlook/authorize';
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect email? Past emails will be preserved.')) return;

    const response = await fetch('/api/auth/outlook/disconnect', {
      method: 'POST',
    });

    if (response.ok) {
      setIsConnected(false);
      alert('Email disconnected successfully');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Email Integration</h2>

      <p className="text-slate-600 mb-4">
        Connect your email to automatically track job applications, interview requests, and responses.
      </p>

      {!isConnected ? (
        <div className="space-y-3">
          <button
            onClick={handleConnectOutlook}
            disabled={connecting}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 18c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2s-.9 2-2 2H9c-1.1 0-2-.9-2-2zm-4-6c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2s-.9 2-2 2H5c-1.1 0-2-.9-2-2zm0-6c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2s-.9 2-2 2H5c-1.1 0-2-.9-2-2z"/>
            </svg>
            {connecting ? 'Connecting...' : 'Connect Outlook'}
          </button>

          <button
            disabled
            className="flex items-center gap-2 px-4 py-3 bg-slate-200 text-slate-500 rounded-lg cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            Connect Gmail (Coming Soon)
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-green-900">Email Connected</p>
              <p className="text-sm text-green-700">Syncing every 15 minutes</p>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
          >
            Disconnect Email
          </button>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">What gets tracked?</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>✓ Application confirmations</li>
          <li>✓ Interview requests and scheduling</li>
          <li>✓ Rejection notifications</li>
          <li>✓ Offer letters</li>
          <li>✓ Recruiter communications</li>
        </ul>
      </div>
    </div>
  );
}
```

### 5.2 Email Timeline in Job Detail

**File: `components/JobDetailView.tsx` (add section)**

```tsx
// Add to existing JobDetailView component

{/* Email Timeline Section */}
{emails && emails.length > 0 && (
  <div className="mt-6">
    <h3 className="text-lg font-semibold mb-4">Email History</h3>

    <div className="space-y-3">
      {emails.map((email: any) => (
        <div key={email.id} className="border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {email.email_type === 'application_confirmation' && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Confirmation</span>
                )}
                {email.email_type === 'rejection' && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Rejection</span>
                )}
                {email.email_type === 'interview_request' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Interview</span>
                )}
                {email.email_type === 'offer' && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">Offer</span>
                )}

                <span className="text-xs text-slate-500">
                  {new Date(email.received_at).toLocaleDateString()}
                </span>
              </div>

              <p className="font-medium">{email.subject}</p>
              <p className="text-sm text-slate-600">From: {email.sender_name} &lt;{email.sender_email}&gt;</p>

              {email.body_text && (
                <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                  {email.body_text}
                </p>
              )}
            </div>

            <button className="text-blue-600 hover:text-blue-700 text-sm">
              View Full Email
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

---

## Cost Analysis

### Email Storage Costs

**Supabase Free Tier:**
- 500MB database storage
- Average email: ~5KB (text only)
- **Capacity**: ~100,000 emails

**With 1,000 active users:**
- Avg 100 emails/user/month = 100K emails/month
- Storage: ~500MB
- **Conclusion**: Free tier sufficient for first 1,000 users

**Supabase Pro ($25/month):**
- 8GB database storage
- **Capacity**: ~1.6 million emails
- Sufficient for 10,000+ users

### AI Analysis Costs

**Per email analyzed:**
```
Email classification: Llama 3.1 8B Instant
- Input: 500 tokens @ $0.05/1M = $0.000025
- Output: 300 tokens @ $0.08/1M = $0.000024
Total: $0.000049 per email (~$0.00005)
```

**At 1,000 users:**
- 100 emails/user/month = 100,000 emails/month
- 100,000 × $0.00005 = **$5/month for email analysis**

**Total AI costs with email:**
- Existing enrichment: $80/month
- Email analysis: $5/month
- **Total: $85/month** (still extremely cheap!)

---

## Security & Privacy

### 1. Token Encryption

```typescript
// lib/token-encryption.ts

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32-byte key
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### 2. Email Permissions (Microsoft OAuth Scopes)

```typescript
const REQUIRED_SCOPES = [
  'offline_access',        // Refresh token
  'Mail.Read',            // Read emails
  'User.Read',            // Get user profile
];

// DO NOT request:
// - Mail.Send (not needed)
// - Mail.ReadWrite (only need read)
// - Contacts.Read (not needed)
```

### 3. Data Retention Policy

```sql
-- Auto-delete old emails after 90 days
CREATE OR REPLACE FUNCTION delete_old_emails()
RETURNS void AS $$
BEGIN
  DELETE FROM emails
  WHERE received_at < NOW() - INTERVAL '90 days'
    AND job_id IS NULL; -- Keep job-linked emails
END;
$$ LANGUAGE plpgsql;

-- Run monthly
-- Add to Vercel cron
```

---

## Testing Plan

### Phase 1: OAuth Testing
1. Test OAuth authorization flow
2. Verify token storage (encrypted)
3. Test token refresh
4. Test disconnect flow

### Phase 2: Email Sync Testing
1. Manual sync with 10 test emails
2. Verify email storage
3. Test duplicate detection
4. Test incremental sync

### Phase 3: AI Analysis Testing
1. Test with real application confirmation emails
2. Test with rejection emails
3. Test with interview requests
4. Measure accuracy (aim for >85%)

### Phase 4: Integration Testing
1. Full workflow: Email → Analysis → Job Creation → Enrichment
2. Test auto-status updates
3. Test contact extraction
4. Test reminder creation

---

## Success Metrics

### Technical Metrics
- OAuth success rate: >95%
- Email sync latency: <30 seconds
- AI classification accuracy: >85%
- Auto-linking accuracy: >75%

### User Metrics
- Email connection rate: >40% of active users
- Jobs created via email: >30% of total jobs
- Status updates via email: >50% of status changes
- User-reported accuracy: >80% satisfaction

---

## Rollout Plan

### Week 1: Internal Testing
- Test with your own Outlook account
- Process 100+ real emails
- Fix bugs and edge cases

### Week 2: Beta Testing
- Invite 10-20 beta users
- Collect feedback
- Monitor error rates

### Week 3: Soft Launch
- Enable for all Founder members
- Add banner: "NEW: Connect your email"
- Monitor server load

### Week 4: Full Launch
- Enable for all users
- Blog post announcement
- Update onboarding flow

---

## Future Enhancements (Post-MVP)

### Phase 6: Advanced Features
1. **Email Templates**
   - AI-generated follow-up emails
   - Interview thank-you notes
   - Salary negotiation templates

2. **Smart Notifications**
   - "No response in 7 days - send follow-up?"
   - "Interview in 24 hours - prepare!"
   - "3 rejections this week - review your resume?"

3. **Email Sentiment Analysis**
   - Positive/negative tone detection
   - Urgency detection
   - Interest level scoring

4. **Calendar Integration**
   - Auto-add interviews to calendar
   - Detect scheduling conflicts
   - Send availability suggestions

5. **Multi-Provider Support**
   - Gmail OAuth
   - Yahoo Mail
   - iCloud Mail

---

## Conclusion

This is **100% achievable** by reusing Scout Scheduling's OAuth infrastructure and adapting it for job search.

**Key Advantages:**
1. You already built the hard part (OAuth, token management)
2. GoodJob's AI system is perfect for email analysis
3. Database structure supports email linking
4. Cost remains extremely low ($5/month for 1,000 users)

**Timeline:** 3-4 weeks to production-ready MVP

**Next Steps:**
1. Port OAuth code from Scout Scheduling
2. Create database tables
3. Build email sync endpoint
4. Test with your own account
5. Launch to beta users

Ready to start implementation?