import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getAllRecentMessages } from '@/app/teacher-dashboard/actions';

export interface RealtimeMessage {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string | null;
  content: string;
  createdAt: Date;
  isRead: boolean;
  isFromTeacher: boolean;
}

interface UseRealtimeMessagesProps {
  onNewMessage?: (message: RealtimeMessage) => void;
  onMessageRead?: (messageId: string) => void;
  // pollingInterval kept for backwards-compat but ignored — Realtime is used instead
  pollingInterval?: number;
}

export function useRealtimeMessages({
  onNewMessage,
  onMessageRead,
}: UseRealtimeMessagesProps = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const onNewMessageRef = useRef(onNewMessage);
  const onMessageReadRef = useRef(onMessageRead);

  // Keep refs current without restarting the subscription
  onNewMessageRef.current = onNewMessage;
  onMessageReadRef.current = onMessageRead;

  useEffect(() => {
    const supabase = createClient();
    let channelRef: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      // 1. Seed knownIds from current messages so existing messages don't trigger onNewMessage
      const initial = await getAllRecentMessages();
      if (cancelled) return;
      knownIdsRef.current = new Set(initial.map(m => m.id));

      // 2. Remove any stale channel with the same name before subscribing (StrictMode safety)
      const channelName = `teacher-messages:${user.id}`;
      const stale = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
      if (stale) await supabase.removeChannel(stale);
      if (cancelled) return;

      // 3. Subscribe to INSERT events on teacher_messages for this teacher
      channelRef = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'teacher_messages',
          },
          async (payload) => {
            const row = payload.new as {
              id: string;
              teacher_id: string;
              student_id: string;
              is_from_teacher: boolean | null;
              is_read: boolean | null;
            };

            // Only process messages sent TO this teacher (from students)
            if (row.teacher_id !== user.id) return;
            if (row.is_from_teacher !== false) return; // only student→teacher messages are "new" notifications
            if (knownIdsRef.current.has(row.id)) return;

            knownIdsRef.current.add(row.id);

            // Fetch full message list to get student name/avatar (single call per event)
            try {
              const messages = await getAllRecentMessages();
              const newMsg = messages.find(m => m.id === row.id);
              if (newMsg && !newMsg.isRead) {
                onNewMessageRef.current?.(newMsg);
              }
            } catch {
              // If server action fails, skip notification — don't crash
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'teacher_messages',
          },
          (payload) => {
            const row = payload.new as { id: string; teacher_id: string; is_read: boolean | null };
            if (row.teacher_id !== user.id) return;
            if (row.is_read === true) {
              onMessageReadRef.current?.(row.id);
            }
          }
        )
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED');
        });
    };

    setup();

    return () => {
      cancelled = true;
      if (channelRef) {
        supabase.removeChannel(channelRef);
      }
    };
  // Run once on mount — callbacks are accessed via refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isConnected };
}
