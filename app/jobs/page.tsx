import { createClient } from '@/lib/supabase/server';
import JobPipeline from '@/components/JobPipeline';
import AddJobButton from '@/components/AddJobButton';

export default async function JobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
          <p className="text-gray-600 mt-1">Track and manage your job search pipeline</p>
        </div>
        <AddJobButton />
      </div>

      <JobPipeline jobs={jobs || []} />
    </div>
  );
}
