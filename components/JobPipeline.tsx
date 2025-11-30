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
  { key: 'saved', label: 'Saved', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'applied', label: 'Applied', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'interviewing', label: 'Interviewing', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
  { key: 'offer', label: 'Offer', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { key: 'rejected', label: 'Rejected', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
] as const;

export default function JobPipeline({ jobs }: { jobs: Job[] }) {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  if (viewMode === 'list') {
    return (
      <div className="animate-fade-in">
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setViewMode('kanban')}
            className="px-4 py-2 text-sm bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-medium shadow-sm transition-all"
          >
            Switch to Kanban
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-soft border border-slate-100 divide-y divide-slate-100">
          {jobs.map((job) => (
            <div key={job.id} className="p-4">
              <JobCard job={job} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setViewMode('list')}
          className="px-4 py-2 text-sm bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-medium shadow-sm transition-all"
        >
          Switch to List
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {STATUSES.map((status) => {
          const statusJobs = jobs.filter((job) => job.status === status.key);
          return (
            <div key={status.key} className="bg-white rounded-2xl shadow-soft border border-slate-100 p-5 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">{status.label}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${status.badge}`}>
                  {statusJobs.length}
                </span>
              </div>
              <div className="space-y-3 flex-1 overflow-auto">
                {statusJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
                {statusJobs.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">No jobs</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
