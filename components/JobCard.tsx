'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import JobEnrichmentBadge from './JobEnrichmentBadge';
import Link from 'next/link';

type Job = {
  id: string;
  title: string;
  company: string;
  url: string | null;
  status: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';
  notes: string | null;
  created_at: string;
  raw_description?: string | null;
  extracted_description?: string | null;
};

export default function JobCard({ job }: { job: Job }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enriched, setEnriched] = useState(job.extracted_description);
  const router = useRouter();
  const supabase = createClient();

  const updateStatus = async (newStatus: Job['status']) => {
    setIsUpdating(true);
    try {
      await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', job.id);
      router.refresh();
    } catch (error) {
      console.error('Failed to update job status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteJob = async () => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      await supabase.from('jobs').delete().eq('id', job.id);
      router.refresh();
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const handleEnrich = async () => {
    if (!job.raw_description) {
      alert('This job does not have a description to enrich. Please add a job description first.');
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
        setEnriched(JSON.stringify(data.data));
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

  return (
    <div className="group bg-white border border-slate-200 rounded-xl p-5 hover:shadow-soft hover:border-blue-200 transition-all duration-300">
      <div>
        <Link href={`/dashboard/jobs/${job.id}`} className="block">
          <h4 className="font-semibold text-slate-900 text-base group-hover:text-blue-600 transition-colors hover:underline">
            {job.title}
          </h4>
        </Link>
        <p className="text-sm text-slate-600 mt-1">{job.company}</p>

        {/* AI Enrichment Badge */}
        <JobEnrichmentBadge job={{ ...job, extracted_description: enriched }} />

        {/* Enrich Button - Show if not enriched OR allow re-enrichment */}
        {!enriched && (
          job.raw_description ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEnrich();
              }}
              disabled={enriching}
              className="mt-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enriching ? '✨ Analyzing...' : '✨ Enrich with AI'}
            </button>
          ) : (
            <div className="mt-2 text-xs text-slate-500 italic">
              Add a job description to enable AI enrichment
            </div>
          )
        )}

        {/* Re-enrich Button for already enriched jobs */}
        {enriched && job.raw_description && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEnrich();
            }}
            disabled={enriching}
            className="mt-2 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enriching ? '✨ Re-analyzing...' : '🔄 Re-enrich with AI'}
          </button>
        )}

        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline mt-2 font-medium"
          >
            View posting
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        {/* Expand/Collapse Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-xs text-slate-500 hover:text-slate-700 font-medium block"
        >
          {isExpanded ? '▲ Show less' : '▼ Show more'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 animate-fade-in">
          {job.notes && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-700 mb-1">Notes:</p>
              <p className="text-sm text-slate-600">{job.notes}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Move to:</p>
            <div className="flex flex-wrap gap-2">
              {(['saved', 'applied', 'interviewing', 'offer', 'rejected'] as const).map(
                (status) =>
                  status !== job.status && (
                    <button
                      key={status}
                      onClick={() => updateStatus(status)}
                      disabled={isUpdating}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {status}
                    </button>
                  )
              )}
            </div>
          </div>

          <button
            onClick={deleteJob}
            className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete job
          </button>
        </div>
      )}
    </div>
  );
}
