'use client';

import { useState } from 'react';
import type { Database } from '@/lib/supabase';

type Job = Database['public']['Tables']['jobs']['Row'];

const statusColors = {
  saved: 'bg-blue-100 text-blue-700',
  applied: 'bg-yellow-100 text-yellow-700',
  interviewing: 'bg-purple-100 text-purple-700',
  offer: 'bg-green-100 text-green-700',
  rejected: 'bg-gray-100 text-gray-700',
};

export default function JobsList({ initialJobs }: { initialJobs: Job[] }) {
  const [filter, setFilter] = useState<string>('all');

  const filteredJobs = filter === 'all'
    ? initialJobs
    : initialJobs.filter(job => job.status === filter);

  return (
    <div>
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
          }`}
        >
          All ({initialJobs.length})
        </button>
        <button
          onClick={() => setFilter('saved')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'saved' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
          }`}
        >
          Saved
        </button>
        <button
          onClick={() => setFilter('applied')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'applied' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
          }`}
        >
          Applied
        </button>
        <button
          onClick={() => setFilter('interviewing')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'interviewing' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
          }`}
        >
          Interviewing
        </button>
        <button
          onClick={() => setFilter('offer')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'offer' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
          }`}
        >
          Offers
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {filteredJobs.length > 0 ? (
          <div className="divide-y">
            {filteredJobs.map((job) => (
              <div key={job.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-gray-600 mt-1">{job.company}</p>
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block"
                      >
                        View Job Posting →
                      </a>
                    )}
                    {job.notes && (
                      <p className="text-sm text-gray-500 mt-2">{job.notes}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No jobs found
          </div>
        )}
      </div>
    </div>
  );
}
