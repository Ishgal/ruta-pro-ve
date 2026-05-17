'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Send, MessageSquare, Lock, Star, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  getTeacherMessages,
  sendMessageToTeacher,
  markTeacherMessagesRead,
  getActiveMentor,
  getAvailableTeachersForCurrentCourse,
  assignMentor,
  getPendingRating,
  submitTeacherRating,
  type ConversationMessage,
  type MentorInfo,
  type AvailableTeacher,
  type PendingRating,
} from '../actions';

export default function StudentMessagesPage() {
  const [mentor, setMentor] = useState<MentorInfo | null>(null);
  const [availableTeachers, setAvailableTeachers] = useState<AvailableTeacher[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [pendingRating, setPendingRating] = useState<PendingRating | null>(null);
  const [selectedStars, setSelectedStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOro, setIsOro] = useState(true);
  const [noCourse, setNoCourse] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    try {
      const activeMentor = await getActiveMentor();
      setMentor(activeMentor);

      if (activeMentor) {
        const msgs = await getTeacherMessages(activeMentor.courseId).catch(() => [] as ConversationMessage[]);
        setMessages(msgs);
      } else {
        const pending = await getPendingRating();
        if (pending) {
          setPendingRating(pending);
        } else {
          const teachers = await getAvailableTeachersForCurrentCourse();
          setAvailableTeachers(teachers);
        }
      }
    } catch (err) {
      const e = err as Error;
      if (e.message?.includes('plan Oro')) setIsOro(false);
      else if (e.message?.includes('curso activo')) setNoCourse(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!mentor) return;

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;

      channel = supabase
        .channel(`messages-${data.user.id}-${mentor.courseId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'teacher_messages',
            filter: `student_id=eq.${data.user.id}`,
          },
          (payload) => {
            const raw = payload.new as Record<string, unknown>;
            if (raw.course_id !== mentor.courseId) return;

            setMessages(prev => {
              if (prev.some(m => m.id === raw.id)) return prev;
              return [...prev, {
                id: raw.id as string,
                teacherId: raw.teacher_id as string,
                teacherName: mentor.name,
                teacherAvatar: mentor.avatarUrl,
                content: raw.content as string,
                createdAt: new Date(raw.created_at as string),
                isRead: raw.is_read as boolean,
                isFromTeacher: raw.is_from_teacher as boolean,
              }];
            });
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [mentor]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (mentor && messages.some(m => m.isFromTeacher && !m.isRead)) {
      markTeacherMessagesRead(mentor.id, mentor.courseId).catch(() => {});
    }
  }, [messages, mentor]);

  const handleSubmitRating = async () => {
    if (!pendingRating || selectedStars === 0) return;
    setSubmittingRating(true);
    try {
      await submitTeacherRating(pendingRating.teacherId, pendingRating.courseId, selectedStars);
      setPendingRating(null);
      setSelectedStars(0);
      const teachers = await getAvailableTeachersForCurrentCourse().catch(() => [] as AvailableTeacher[]);
      setAvailableTeachers(teachers);
    } catch {
      alert('Error al enviar la calificación. Intenta de nuevo.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleAssign = async (teacherId: string) => {
    setAssigning(teacherId);
    try {
      await assignMentor(teacherId);
      await loadData();
    } catch (err) {
      alert((err as Error).message ?? 'Error al asignar el docente');
    } finally {
      setAssigning(null);
    }
  };

  const handleSend = async () => {
    if (!mentor || !messageText.trim()) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('teacherId', mentor.id);
      fd.append('courseId', mentor.courseId);
      fd.append('content', messageText.trim());
      await sendMessageToTeacher(fd);
      setMessageText('');
      const fetched = await getTeacherMessages(mentor.courseId);
      setMessages(fetched);
    } catch {
      alert('Error al enviar el mensaje. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isOro) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <Lock className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Funcion exclusiva Plan Oro</h2>
        <p className="text-gray-500 max-w-sm">
          La mentoria con docentes esta disponible para estudiantes con plan Oro.
          Actualiza tu plan para desbloquear esta funcion.
        </p>
        <a
          href="/dashboard/plans"
          className="mt-2 px-6 py-3 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-colors"
        >
          Ver planes
        </a>
      </div>
    );
  }

  if (noCourse) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <MessageSquare className="w-12 h-12 text-gray-300" />
        <h2 className="text-lg font-bold text-gray-700">Sin curso activo</h2>
        <p className="text-gray-500 max-w-sm">
          Inicia un curso para poder seleccionar un docente mentor.
        </p>
      </div>
    );
  }

  if (pendingRating) {
    const ratingLabels = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];
    return (
      <div className="p-6 md:p-8 max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-2xl">
          {pendingRating.teacherName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Califica a tu docente</h2>
          <p className="text-sm text-gray-500 mt-1">
            Completaste <span className="font-medium text-gray-700">{pendingRating.courseTitle}</span> con{' '}
            <span className="font-medium text-gray-700">{pendingRating.teacherName}</span>.
            Antes de continuar, califícalo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setSelectedStars(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-10 h-10 transition-colors ${
                  star <= (hoveredStar || selectedStars)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        {(hoveredStar || selectedStars) > 0 && (
          <p className="text-sm font-medium text-amber-500 -mt-3">
            {ratingLabels[hoveredStar || selectedStars]}
          </p>
        )}

        <button
          onClick={handleSubmitRating}
          disabled={selectedStars === 0 || submittingRating}
          className="w-full max-w-xs py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold transition-colors disabled:opacity-40"
        >
          {submittingRating
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            : 'Enviar calificación'
          }
        </button>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Mensajes</h1>
        <p className="text-sm text-gray-500 mb-6">
          Elige el docente que te acompanara en tu curso actual.
        </p>

        {availableTeachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-white rounded-2xl border border-gray-100">
            <Users className="w-10 h-10 text-gray-300" />
            <p className="text-gray-500 font-medium">No hay docentes disponibles para tu curso actual</p>
            <p className="text-sm text-gray-400">Todos los docentes tienen el cupo completo. Intenta mas tarde.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {availableTeachers.map(teacher => (
              <div
                key={teacher.id}
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 px-5 py-4"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {teacher.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{teacher.name}</p>
                  {teacher.specialty.length > 0 && (
                    <p className="text-xs text-gray-500 truncate">{teacher.specialty.join(', ')}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {teacher.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {teacher.studentsLimit - teacher.activeStudents} cupos disponibles
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleAssign(teacher.id)}
                  disabled={assigning === teacher.id}
                  className="shrink-0 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {assigning === teacher.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Seleccionar'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
        <p className="text-xs text-gray-400 mt-0.5">Curso: {mentor.courseTitle}</p>
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {mentor.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{mentor.name}</p>
            <p className="text-xs text-gray-500">{mentor.specialty.join(', ') || 'Docente'}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <MessageSquare className="w-10 h-10 opacity-40" />
              <p className="text-sm">Aun no hay mensajes. Escribe al docente para empezar.</p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.isFromTeacher ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.isFromTeacher
                      ? 'bg-gray-100 text-gray-800 rounded-tl-sm'
                      : 'bg-teal-500 text-white rounded-tr-sm'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${msg.isFromTeacher ? 'text-gray-400' : 'text-teal-100'}`}>
                    {new Date(msg.createdAt).toLocaleString('es-VE', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex gap-2 items-end">
            <textarea
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Escribe un mensaje..."
              rows={2}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 bg-white placeholder:text-gray-400 resize-none focus:outline-none focus:border-teal-500 transition-colors"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
            />
            <button
              onClick={handleSend}
              disabled={!messageText.trim() || sending}
              className="p-2.5 rounded-xl bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-40 transition-colors shrink-0"
            >
              {sending
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Send className="w-5 h-5" />
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
