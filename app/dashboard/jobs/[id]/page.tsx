import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import JobDetailView from '@/components/JobDetailView';

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch job with all details
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !job) {
    redirect('/dashboard/jobs');
  }

  // Fetch related contacts
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('job_id', id)
    .eq('user_id', user.id);

  // Fetch related reminders
  const { data: reminders } = await supabase
    .from('reminders')
    .select('*')
    .eq('job_id', id)
    .eq('user_id', user.id)
    .order('date', { ascending: true });

  return (
    <JobDetailView
      job={job}
      contacts={contacts || []}
      reminders={reminders || []}
    />
  );
}
