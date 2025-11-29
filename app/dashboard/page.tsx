import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  const stats = {
    total: jobs?.length || 0,
    saved: jobs?.filter((j) => j.status === 'saved').length || 0,
    applied: jobs?.filter((j) => j.status === 'applied').length || 0,
    interviewing: jobs?.filter((j) => j.status === 'interviewing').length || 0,
    offer: jobs?.filter((j) => j.status === 'offer').length || 0,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here&apos;s your job search overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500 mb-1">Total Jobs</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500 mb-1">Saved</div>
          <div className="text-3xl font-bold text-blue-600">{stats.saved}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500 mb-1">Applied</div>
          <div className="text-3xl font-bold text-yellow-600">{stats.applied}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500 mb-1">Interviewing</div>
          <div className="text-3xl font-bold text-purple-600">{stats.interviewing}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500 mb-1">Offers</div>
          <div className="text-3xl font-bold text-green-600">{stats.offer}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Applications</h2>
          <Link
            href="/jobs"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View all
          </Link>
        </div>
        {jobs && jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.slice(0, 5).map((job) => (
              <div
                key={job.id}
                className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-600">{job.company}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    job.status === 'saved' ? 'bg-blue-100 text-blue-700' :
                    job.status === 'applied' ? 'bg-yellow-100 text-yellow-700' :
                    job.status === 'interviewing' ? 'bg-purple-100 text-purple-700' :
                    job.status === 'offer' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No jobs tracked yet</p>
            <Link
              href="/jobs"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add your first job
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
