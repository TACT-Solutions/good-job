import { createClient } from '@/lib/supabase/server';
import AddReminderButton from '@/components/AddReminderButton';
import ReminderList from '@/components/ReminderList';

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: reminders } = await supabase
    .from('reminders')
    .select('*, jobs(title, company)')
    .eq('user_id', user!.id)
    .order('date', { ascending: true });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks & Reminders</h1>
          <p className="text-gray-600 mt-1">Stay on top of your job search</p>
        </div>
        <AddReminderButton />
      </div>

      <ReminderList reminders={reminders || []} />
    </div>
  );
}
