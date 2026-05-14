// app/teacher-dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare } from 'lucide-react';
import { getAllRecentMessages, markAllMessagesAsRead, getAssignedStudentsForDashboard, type StudentForDashboard } from './actions';
import ProgressChart from '@/components/teacher/ProgressChart';
import StudentList from '@/components/teacher/StudentList';

interface Message {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string | null;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [students, setStudents] = useState<StudentForDashboard[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    try {
      const fetchedMessages = await getAllRecentMessages();
      setMessages(fetchedMessages);
      const unread = fetchedMessages.filter((m) => !m.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [fetchedStudents] = await Promise.all([
          getAssignedStudentsForDashboard(),
          loadMessages(),
        ]);
        setStudents(fetchedStudents);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [loadMessages]);

  // Realtime: escucha mensajes nuevos para el widget de inicio
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || cancelled) return;

      const channelName = `teacher-home-messages-${data.user.id}`;
      const existing = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
      if (existing) supabase.removeChannel(existing);
      if (cancelled) return;

      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'teacher_messages',
            filter: `teacher_id=eq.${data.user.id}`,
          },
          () => { loadMessages(); }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, loadMessages]);

  const handleOpenMessages = async () => {
    await markAllMessagesAsRead();
    router.push('/teacher-dashboard/messages');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-12 gap-6">
        
        {/* Progress Section - Gráfico real */}
        <section className="col-span-12 lg:col-span-8">
          <ProgressChart />
        </section>

        {/* Messages Section */}
        <section className="col-span-12 lg:col-span-4 bg-white rounded-xl p-6 flex flex-col h-full border border-gray-100 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Mensajes Recientes</h3>
            <button
              onClick={handleOpenMessages}
              className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-2"
            >
              Ver todos
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
          
          <div className="space-y-3 overflow-y-auto max-h-96 pr-2">
            {messages.slice(0, 5).map((message) => (
              <div
                key={message.id}
                onClick={handleOpenMessages}
                className={`bg-gray-50 p-3 rounded-lg flex gap-3 transition-all hover:scale-[1.02] cursor-pointer border border-gray-100 ${
                  !message.isRead ? 'border-l-4 border-l-teal-500' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                  {message.studentName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{message.studentName}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{message.content}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!message.isRead && <div className="w-2 h-2 bg-teal-500 rounded-full mt-2" />}
              </div>
            ))}
            
            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay mensajes aún</p>
                <p className="text-xs mt-1">Envía un mensaje a tus estudiantes</p>
              </div>
            )}
          </div>

          <button
            onClick={handleOpenMessages}
            className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold transition-all hover:bg-blue-700 active:scale-95 flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" /> Nuevo Mensaje
          </button>
        </section>

        {/* Student List Section */}
        <section className="col-span-12">
          <StudentList students={students} onMessageClick={() => router.push('/teacher-dashboard/messages')} />
        </section>
      </div>
    </main>
  );
}