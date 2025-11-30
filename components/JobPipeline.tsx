'use client';

import { useState } from 'react';
import JobCard from './JobCard';

type Job = {
  id: string;
  title: string;
  company: string;
  url: string | null;
  status: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';
  notes: string | null;
  created_at: string;
};

const STATUSES = [
  { key: 'saved', label: 'Saved', color: 'bg-blue-100 text-blue-700' },
  { key: 'applied', label: 'Applied', color: 'bg-yellow-100 text-yellow-700' },
  { key: 'interviewing', label: 'Interviewing', color: 'bg-purple-100 text-purple-700' },
  { key: 'offer', label: 'Offer', color: 'bg-green-100 text-green-700' },
  { key: 'rejected', label: 'Rejected', color: 'bg-gray-100 text-gray-700' },
] as const;

export default function JobPipeline({ jobs }: { jobs: Job[] }) {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  if (viewMode === 'list') {
    return (
      <div>
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setViewMode('kanban')}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Switch to Kanban
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setViewMode('list')}
          className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
        >
          Switch to List
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {STATUSES.map((status) => {
          const statusJobs = jobs.filter((job) => job.status === status.key);
          return (
            <div key={status.key} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{status.label}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>
                  {statusJobs.length}
                </span>
              </div>
              <div className="space-y-3">
                {statusJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
                {statusJobs.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">No jobs</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
