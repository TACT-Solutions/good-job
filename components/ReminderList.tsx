'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase';

type Reminder = Database['public']['Tables']['reminders']['Row'] & {
  jobs?: {
    title: string;
    company: string;
  } | null;
};

export default function ReminderList({ reminders: initialReminders }: { reminders: any[] }) {
  const [reminders, setReminders] = useState(initialReminders);
  const router = useRouter();
  const supabase = createClient();

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ completed: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, completed: !currentStatus } : r))
      );
      router.refresh();
    } catch (error) {
      console.error('Failed to toggle reminder:', error);
      alert('Failed to update reminder');
    }
  };

  const deleteReminder = async (id: string) => {
    if (!confirm('Delete this reminder?')) return;

    try {
      const { error } = await supabase.from('reminders').delete().eq('id', id);

      if (error) throw error;

      setReminders((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      alert('Failed to delete reminder');
    }
  };

  const upcomingReminders = reminders.filter((r) => !r.completed);
  const completedReminders = reminders.filter((r) => r.completed);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Upcoming</h2>
        {upcomingReminders.length > 0 ? (
          <div className="space-y-3">
            {upcomingReminders.map((reminder: any) => (
              <div
                key={reminder.id}
                className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => toggleComplete(reminder.id, reminder.completed)}
                    className="mt-1 h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{reminder.message}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(reminder.date).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                    {reminder.jobs && (
                      <p className="text-sm text-blue-600 mt-1">
                        {reminder.jobs.title} at {reminder.jobs.company}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteReminder(reminder.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No upcoming reminders</p>
        )}
      </div>

      {completedReminders.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Completed</h2>
          <div className="space-y-3">
            {completedReminders.map((reminder: any) => (
              <div
                key={reminder.id}
                className="flex items-start justify-between p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60"
              >
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => toggleComplete(reminder.id, reminder.completed)}
                    className="mt-1 h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 line-through">{reminder.message}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(reminder.date).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                    {reminder.jobs && (
                      <p className="text-sm text-gray-600 mt-1">
                        {reminder.jobs.title} at {reminder.jobs.company}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteReminder(reminder.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
