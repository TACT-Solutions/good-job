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
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-600 mt-2 text-lg">Welcome back! Here&apos;s your job search overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <div className="group relative bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 border border-slate-100 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-slate-100 rounded-bl-full opacity-50 -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Total Jobs</div>
            <div className="text-4xl font-bold text-slate-900">{stats.total}</div>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 border border-blue-100 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-bl-full opacity-50 -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">Saved</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">{stats.saved}</div>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-amber-50 to-white p-6 rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 border border-amber-100 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-100 rounded-bl-full opacity-50 -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Applied</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">{stats.applied}</div>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 border border-purple-100 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100 rounded-bl-full opacity-50 -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-3">Interviewing</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">{stats.interviewing}</div>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 border border-emerald-100 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100 rounded-bl-full opacity-50 -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">Offers</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">{stats.offer}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Recent Applications</h2>
          <Link
            href="/jobs"
            className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
          >
            View all
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        {jobs && jobs.length > 0 ? (
          <div className="space-y-3">
            {jobs.slice(0, 5).map((job, index) => (
              <div
                key={job.id}
                className="group relative border-l-4 border-blue-500 pl-6 py-4 bg-gradient-to-r from-slate-50/50 to-transparent hover:from-slate-50 rounded-r-xl transition-all duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{job.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{job.company}</p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                    job.status === 'saved' ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200' :
                    job.status === 'applied' ? 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border border-amber-200' :
                    job.status === 'interviewing' ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border border-purple-200' :
                    job.status === 'offer' ? 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200' :
                    'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border border-slate-200'
                  }`}>
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-slate-500 mb-6 text-lg">No jobs tracked yet</p>
            <Link
              href="/jobs"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
            >
              Add your first job
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
