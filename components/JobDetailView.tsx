'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type Job = {
  id: string;
  title: string;
  company: string;
  url: string | null;
  location: string | null;
  salary_range: string | null;
  job_type: string | null;
  seniority_level: string | null;
  posted_date: string | null;
  source: string | null;
  status: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';
  notes: string | null;
  raw_description: string | null;
  extracted_description: string | null;
  resume_used: string | null;
  created_at: string;
  updated_at: string;
  ai_enriched_at: string | null;
};

type Contact = {
  id: string;
  name: string;
  email: string | null;
  title: string | null;
  source: string;
};

type Reminder = {
  id: string;
  date: string;
  message: string;
  completed: boolean;
};

export default function JobDetailView({
  job,
  contacts,
  reminders,
}: {
  job: Job;
  contacts: Contact[];
  reminders: Reminder[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [notes, setNotes] = useState(job.notes || '');

  // Parse AI enrichment data
  let enrichedData: any = null;
  if (job.extracted_description) {
    try {
      enrichedData = JSON.parse(job.extracted_description);
    } catch {}
  }

  const updateStatus = async (newStatus: Job['status']) => {
    setIsUpdating(true);
    try {
      await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', job.id);
      router.refresh();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const saveNotes = async () => {
    try {
      await supabase
        .from('jobs')
        .update({ notes })
        .eq('id', job.id);
      alert('Notes saved!');
      router.refresh();
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('Failed to save notes');
    }
  };

  const handleEnrich = async () => {
    if (!job.raw_description) {
      alert('No job description available to enrich');
      return;
    }

    setEnriching(true);
    try {
      const response = await fetch('/api/enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          description: job.raw_description,
          company: job.company,
          title: job.title
        })
      });
      const data = await response.json();
      if (data.success) {
        router.refresh();
      } else {
        console.error('Enrichment API error:', data);
        alert(`AI enrichment failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Enrichment failed:', error);
      alert('AI enrichment failed. Please try again.');
    } finally {
      setEnriching(false);
    }
  };

  const deleteJob = async () => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      await supabase.from('jobs').delete().eq('id', job.id);
      router.push('/dashboard/jobs');
    } catch (error) {
      console.error('Failed to delete job:', error);
      alert('Failed to delete job');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/jobs"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Jobs
        </Link>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{job.title}</h1>
            <h2 className="text-xl text-slate-600 mb-4">{job.company}</h2>

            {/* Status Badge */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                job.status === 'saved' ? 'bg-blue-100 text-blue-700' :
                job.status === 'applied' ? 'bg-amber-100 text-amber-700' :
                job.status === 'interviewing' ? 'bg-purple-100 text-purple-700' :
                job.status === 'offer' ? 'bg-emerald-100 text-emerald-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {job.status}
              </span>

              {job.ai_enriched_at && (
                <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full text-xs font-semibold flex items-center gap-1">
                  ✨ AI Enriched
                </span>
              )}
            </div>

            {/* Job Details Grid */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              {job.location && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Location</span>
                  <p className="text-slate-900 font-medium">{job.location}</p>
                </div>
              )}
              {job.salary_range && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Salary</span>
                  <p className="text-slate-900 font-medium">{job.salary_range}</p>
                </div>
              )}
              {job.job_type && job.job_type !== 'unknown' && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Work Type</span>
                  <p className="text-slate-900 font-medium capitalize">{job.job_type}</p>
                </div>
              )}
              {job.seniority_level && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Seniority</span>
                  <p className="text-slate-900 font-medium capitalize">{job.seniority_level}</p>
                </div>
              )}
              {job.source && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Source</span>
                  <p className="text-slate-900 font-medium">{job.source}</p>
                </div>
              )}
              {job.posted_date && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Posted</span>
                  <p className="text-slate-900 font-medium">
                    {new Date(job.posted_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm flex items-center gap-2"
              >
                View Posting
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            {!job.ai_enriched_at && job.raw_description && (
              <button
                onClick={handleEnrich}
                disabled={enriching}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg font-semibold text-sm disabled:opacity-50"
              >
                {enriching ? '✨ Analyzing...' : '✨ Enrich with AI'}
              </button>
            )}
            <button
              onClick={deleteJob}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-semibold text-sm"
            >
              Delete Job
            </button>
          </div>
        </div>

        {/* Status Update Buttons */}
        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Update Status:</h3>
          <div className="flex flex-wrap gap-2">
            {(['saved', 'applied', 'interviewing', 'offer', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => updateStatus(status)}
                disabled={status === job.status || isUpdating}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  status === job.status
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                } disabled:opacity-50`}
              >
                {status === job.status && '✓ '}{status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Enrichment Data */}
          {enrichedData && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                ✨ AI Insights
              </h3>

              {enrichedData.summary && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Summary</h4>
                  <p className="text-slate-600">{enrichedData.summary}</p>
                </div>
              )}

              {enrichedData.skills && enrichedData.skills.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {enrichedData.skills.map((skill: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {enrichedData.responsibilities && enrichedData.responsibilities.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Key Responsibilities</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    {enrichedData.responsibilities.map((resp: string, idx: number) => (
                      <li key={idx}>{resp}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-4">
                {enrichedData.industry && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Industry</span>
                    <p className="text-slate-900 font-medium">{enrichedData.industry}</p>
                  </div>
                )}
                {enrichedData.companySize && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Company Size</span>
                    <p className="text-slate-900 font-medium capitalize">{enrichedData.companySize}</p>
                  </div>
                )}
                {enrichedData.department && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Department</span>
                    <p className="text-slate-900 font-medium">{enrichedData.department}</p>
                  </div>
                )}
                {enrichedData.hiringManager && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Likely Hiring Manager</span>
                    <p className="text-slate-900 font-medium">{enrichedData.hiringManager}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actionable Insights - Why This Matters */}
          {enrichedData?.whyThisMatters && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                🎯 Why This Matters
              </h3>
              <p className="text-slate-700 leading-relaxed">{enrichedData.whyThisMatters}</p>
            </div>
          )}

          {/* Company Research */}
          {enrichedData?.companyAbout && (
            <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                🏢 Company Research
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">About</h4>
                  <p className="text-slate-600">{enrichedData.companyAbout}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {enrichedData.companyTeamSize && (
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase">Team Size</span>
                      <p className="text-slate-900 font-medium">{enrichedData.companyTeamSize}</p>
                    </div>
                  )}
                  {enrichedData.companyFounded && (
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase">Founded</span>
                      <p className="text-slate-900 font-medium">{enrichedData.companyFounded}</p>
                    </div>
                  )}
                  {enrichedData.companyHQ && (
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase">HQ</span>
                      <p className="text-slate-900 font-medium">{enrichedData.companyHQ}</p>
                    </div>
                  )}
                </div>

                {enrichedData.companyNews && enrichedData.companyNews.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Recent News & Updates</h4>
                    <ul className="space-y-2">
                      {enrichedData.companyNews.map((news: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-600">
                          <span className="text-emerald-500 mt-1">•</span>
                          <span>{news}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {enrichedData.companyTechStack && enrichedData.companyTechStack.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Tech Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {enrichedData.companyTechStack.map((tech: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {enrichedData.companyValues && enrichedData.companyValues.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Company Values</h4>
                    <div className="flex flex-wrap gap-2">
                      {enrichedData.companyValues.map((value: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {enrichedData.companyWebsite && (
                  <a
                    href={enrichedData.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Visit Company Website
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Next Steps - Action Plan */}
          {enrichedData?.nextSteps && enrichedData.nextSteps.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                📋 Action Plan
              </h3>
              <div className="space-y-3">
                {enrichedData.nextSteps.map((step: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <p className="text-slate-700 flex-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Talking Points */}
          {enrichedData?.talkingPoints && enrichedData.talkingPoints.length > 0 && (
            <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                💬 Talking Points for Outreach
              </h3>
              <ul className="space-y-3">
                {enrichedData.talkingPoints.map((point: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span className="text-slate-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Email Subject Lines */}
          {enrichedData?.emailSubjectLines && enrichedData.emailSubjectLines.length > 0 && (
            <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                ✉️ Email Subject Line Ideas
              </h3>
              <div className="space-y-2">
                {enrichedData.emailSubjectLines.map((subject: string, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-slate-700 font-medium">{subject}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interview Questions */}
          {enrichedData?.interviewQuestions && enrichedData.interviewQuestions.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                ❓ Smart Interview Questions
              </h3>
              <div className="space-y-3">
                {enrichedData.interviewQuestions.map((question: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold text-lg">Q{idx + 1}:</span>
                    <p className="text-slate-700 flex-1">{question}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hiring Manager Intelligence */}
          {enrichedData?.hiringManagerTitle && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                👤 Hiring Manager
              </h3>

              {enrichedData.hiringManagerName ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-lg text-slate-900">{enrichedData.hiringManagerName}</p>
                      <p className="text-sm text-slate-600">{enrichedData.hiringManagerTitle}</p>
                    </div>
                    {enrichedData.hiringManagerLinkedIn && (
                      <a
                        href={enrichedData.hiringManagerLinkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        LinkedIn
                      </a>
                    )}
                  </div>

                  {enrichedData.hiringManagerEmails && enrichedData.hiringManagerEmails.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Email Suggestions</h4>
                      <div className="space-y-2">
                        {enrichedData.hiringManagerEmails.map((emailData: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200">
                            <div className="flex-1">
                              <a href={`mailto:${emailData.email}`} className="text-blue-600 hover:underline font-medium">
                                {emailData.email}
                              </a>
                              <p className="text-xs text-slate-500 mt-1">Pattern: {emailData.pattern}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              emailData.confidence === 'confirmed' ? 'bg-green-100 text-green-700' :
                              emailData.confidence === 'high' ? 'bg-blue-100 text-blue-700' :
                              emailData.confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {emailData.confidence}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {enrichedData.hiringManagerReasoning && (
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <p className="text-sm text-slate-600">{enrichedData.hiringManagerReasoning}</p>
                    </div>
                  )}

                  {enrichedData.emailPatterns && enrichedData.emailPatterns.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Email Patterns at this Company</h4>
                      <div className="space-y-1">
                        {enrichedData.emailPatterns.map((pattern: any, idx: number) => (
                          <div key={idx} className="text-sm text-slate-600">
                            <span className="font-mono bg-slate-100 px-2 py-1 rounded">{pattern.pattern}</span>
                            <span className="text-xs text-slate-500 ml-2">({pattern.confidence}% confidence)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-slate-900">Likely Hiring Manager:</p>
                  <p className="text-slate-700 mt-1">{enrichedData.hiringManagerTitle}</p>
                  {enrichedData.hiringManagerReasoning && (
                    <p className="text-sm text-slate-600 mt-2">{enrichedData.hiringManagerReasoning}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Team Contacts */}
          {enrichedData?.teamContacts && enrichedData.teamContacts.length > 0 && (
            <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                👥 Team Contacts ({enrichedData.totalContactsFound || enrichedData.teamContacts.length})
              </h3>
              <div className="space-y-3">
                {enrichedData.teamContacts.map((contact: any, idx: number) => (
                  <div key={idx} className="border-b border-slate-100 pb-3 last:border-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{contact.name}</p>
                        <p className="text-sm text-slate-600">{contact.title}</p>
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:underline block mt-1">
                            {contact.email}
                          </a>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Source: {contact.source}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        contact.confidence === 'confirmed' ? 'bg-green-100 text-green-700' :
                        contact.confidence === 'high' ? 'bg-blue-100 text-blue-700' :
                        contact.confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {contact.confidence}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Discovery */}
          {enrichedData?.suggestedRoles && enrichedData.suggestedRoles.length > 0 && (
            <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                🔍 Contact Search Tools
              </h3>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Target Roles</h4>
                <div className="flex flex-wrap gap-2">
                  {enrichedData.suggestedRoles.map((role: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {enrichedData.searchStrategies && enrichedData.searchStrategies.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Search Strategies</h4>
                  <ul className="space-y-2">
                    {enrichedData.searchStrategies.map((strategy: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-600 text-sm">
                        <span className="text-blue-500">▸</span>
                        <span>{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {enrichedData.linkedInSearchUrl && (
                <a
                  href={enrichedData.linkedInSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
                >
                  Search on LinkedIn
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          )}

          {/* Job Description */}
          {job.raw_description && (
            <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Job Description</h3>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 whitespace-pre-wrap">{job.raw_description}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Add your notes about this job..."
            />
            <button
              onClick={saveNotes}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
            >
              Save Notes
            </button>
          </div>
        </div>

        {/* Right Column (1/3) - Sidebar */}
        <div className="space-y-6">
          {/* Contacts */}
          <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Contacts ({contacts.length})</h3>
            {contacts.length > 0 ? (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="border-b border-slate-100 pb-3 last:border-0">
                    <p className="font-semibold text-slate-900">{contact.name}</p>
                    {contact.title && <p className="text-sm text-slate-600">{contact.title}</p>}
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:underline">
                        {contact.email}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No contacts added yet</p>
            )}
            <Link
              href="/dashboard/contacts"
              className="mt-4 block text-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-semibold text-sm"
            >
              + Add Contact
            </Link>
          </div>

          {/* Reminders */}
          <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Reminders ({reminders.length})</h3>
            {reminders.length > 0 ? (
              <div className="space-y-3">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={`border-l-4 pl-3 py-2 ${
                      reminder.completed ? 'border-green-500 bg-green-50' : 'border-amber-500 bg-amber-50'
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-900">{reminder.message}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(reminder.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No reminders set</p>
            )}
            <Link
              href="/dashboard/tasks"
              className="mt-4 block text-center px-4 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 font-semibold text-sm"
            >
              + Add Reminder
            </Link>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Activity</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-blue-600">📅</span>
                <div>
                  <p className="font-medium text-slate-900">Job Saved</p>
                  <p className="text-xs text-slate-500">
                    {new Date(job.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {job.ai_enriched_at && (
                <div className="flex items-start gap-2">
                  <span className="text-purple-600">✨</span>
                  <div>
                    <p className="font-medium text-slate-900">AI Enriched</p>
                    <p className="text-xs text-slate-500">
                      {new Date(job.ai_enriched_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              {job.updated_at !== job.created_at && (
                <div className="flex items-start gap-2">
                  <span className="text-slate-600">🔄</span>
                  <div>
                    <p className="font-medium text-slate-900">Last Updated</p>
                    <p className="text-xs text-slate-500">
                      {new Date(job.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
