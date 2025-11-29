'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Job = {
  id: string;
  title: string;
  company: string;
  url: string | null;
  status: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';
  notes: string | null;
  created_at: string;
};

export default function JobCard({ job }: { job: Job }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      <div className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <h4 className="font-semibold text-gray-900 text-sm">{job.title}</h4>
        <p className="text-xs text-gray-600 mt-1">{job.company}</p>
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline mt-2 inline-block"
            onClick={(e) => e.stopPropagation()}
          >
            View posting
          </a>
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          {job.notes && (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-1">Notes:</p>
              <p className="text-xs text-gray-600">{job.notes}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Move to:</p>
            <div className="flex flex-wrap gap-1">
              {(['saved', 'applied', 'interviewing', 'offer', 'rejected'] as const).map(
                (status) =>
                  status !== job.status && (
                    <button
                      key={status}
                      onClick={() => updateStatus(status)}
                      disabled={isUpdating}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
                    >
                      {status}
                    </button>
                  )
              )}
            </div>
          </div>

          <button
            onClick={deleteJob}
            className="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            Delete job
          </button>
        </div>
      )}
    </div>
  );
}
