'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getAssignedStudents, getMessages, sendMessage, type AssignedStudent } from '../actions';

interface Message {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string | null;
  content: string;
  createdAt: Date;
  isRead: boolean;
  isFromTeacher: boolean;
}

export default function TeacherMessagesPage() {
  const [students, setStudents] = useState<AssignedStudent[]>([]);
  const [selected, setSelected] = useState<AssignedStudent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  // Vista móvil: 'list' muestra conversaciones, 'chat' muestra el chat abierto
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Ordenar estudiantes por último mensaje (más reciente arriba)
  const sortedStudents = [...students].sort((a, b) => {
    if (!a.lastMessageAt && !b.lastMessageAt) return 0;
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
  });

  useEffect(() => {
    getAssignedStudents()
      .then(setStudents)
      .finally(() => setLoading(false));
  }, []);

  const loadMessages = useCallback(async (student: AssignedStudent) => {
    setLoadingMessages(true);
    const msgs = await getMessages(student.id, student.courseId).catch(() => [] as Message[]);
    setMessages(msgs);
    setLoadingMessages(false);
  }, []);

  useEffect(() => {
    if (!selected) return;
    setMessages([]);
    loadMessages(selected);
  }, [selected, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime: escucha mensajes nuevos del estudiante seleccionado
  useEffect(() => {
    if (!selected) return;
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      channel = supabase
        .channel(`teacher-messages-${data.user.id}-${selected.id}-${selected.courseId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'teacher_messages',
          filter: `teacher_id=eq.${data.user.id}`,
        }, (payload) => {
          const raw = payload.new as Record<string, unknown>;
          if (raw.student_id !== selected.id || raw.course_id !== selected.courseId) return;

          setMessages(prev => {
            if (prev.some(m => m.id === raw.id)) return prev;
            const withoutOptimistic = (raw.is_from_teacher as boolean)
              ? prev.filter(m => !(m.id.startsWith('temp-') && m.content === (raw.content as string) && m.isFromTeacher))
              : prev;
            return [...withoutOptimistic, {
              id: raw.id as string,
              studentId: raw.student_id as string,
              studentName: selected.name,
              studentAvatar: selected.avatarUrl,
              content: raw.content as string,
              createdAt: new Date(raw.created_at as string),
              isRead: raw.is_read as boolean,
              isFromTeacher: raw.is_from_teacher as boolean,
            }];
          });

          // Actualizar lista de estudiantes: subir al tope y actualizar preview
          setStudents(prev => prev.map(s =>
            s.id === selected.id && s.courseId === selected.courseId
              ? {
                  ...s,
                  lastMessage: raw.content as string,
                  lastMessageFromTeacher: raw.is_from_teacher as boolean,
                  lastMessageAt: new Date(raw.created_at as string),
                }
              : s
          ));
        })
        .subscribe();
    });

    return () => {
      if (channel) createClient().removeChannel(channel);
    };
  }, [selected]);

  const handleSelectStudent = (student: AssignedStudent) => {
    setSelected(student);
    setMobileView('chat');
  };

  const handleBack = () => {
    setMobileView('list');
  };

  const handleSend = async () => {
    if (!selected || !messageText.trim() || sending) return;
    const content = messageText.trim();
    const tempId = `temp-${Date.now()}`;

    setMessages(prev => [...prev, {
      id: tempId,
      studentId: selected.id,
      studentName: selected.name,
      studentAvatar: selected.avatarUrl,
      content,
      createdAt: new Date(),
      isRead: false,
      isFromTeacher: true,
    }]);
    setMessageText('');
    setSending(true);

    try {
      const fd = new FormData();
      fd.append('studentId', selected.id);
      fd.append('courseId', selected.courseId);
      fd.append('content', content);
      await sendMessage(fd);
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setMessageText(content);
      alert('Error al enviar el mensaje');
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

  return (
    <div className="max-w-6xl mx-auto">
      {/* Título sólo visible en desktop */}
      <h1 className="hidden md:block text-2xl font-bold text-gray-900 mb-6">Mensajeria</h1>

      {/*
        Contenedor principal: en mobile ocupa todo el espacio disponible,
        en desktop es un panel fijo de 600px dividido en dos columnas.
      */}
      <div className="bg-white rounded-none md:rounded-xl shadow-sm overflow-hidden border-0 md:border md:border-gray-100">
        <div
          className="relative overflow-hidden flex md:flex-row"
          style={{ height: 'calc(100svh - 12rem)' }}
        >

          {/* ── PANEL IZQUIERDO: lista de conversaciones ── */}
          <div
            className={[
              // Mobile: panel absoluto que desliza
              'absolute inset-0 z-10 bg-white flex flex-col',
              'transition-transform duration-300 ease-in-out',
              mobileView === 'chat' ? '-translate-x-full' : 'translate-x-0',
              // Desktop: posición relativa en el flex, ancho fijo
              'md:relative md:inset-auto md:translate-x-0 md:z-auto',
              'md:w-[300px] md:shrink-0 md:border-r md:border-gray-100',
            ].join(' ')}
          >
            <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
              <h2 className="font-semibold text-gray-900 text-sm">Estudiantes asignados</h2>
              <p className="text-xs text-gray-500 mt-0.5">{students.length} activos</p>
            </div>

            {students.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400 p-6 text-center">
                <MessageSquare className="w-8 h-8 opacity-40" />
                <p className="text-sm">No tienes estudiantes asignados aun</p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
                {sortedStudents.map(student => (
                  <button
                    key={`${student.id}-${student.courseId}`}
                    onClick={() => handleSelectStudent(student)}
                    className={[
                      'w-full p-4 text-left hover:bg-gray-50 transition-colors',
                      selected?.id === student.id && selected?.courseId === student.courseId
                        ? 'bg-teal-50 border-l-4 border-teal-500'
                        : '',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-base shrink-0">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">{student.name}</p>
                        {student.lastMessage ? (
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {student.lastMessageFromTeacher ? 'Tu: ' : ''}{student.lastMessage}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-300 truncate italic mt-0.5">Sin mensajes aun</p>
                        )}
                      </div>
                      {student.lastMessageAt && (
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(student.lastMessageAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── PANEL DERECHO: chat ── */}
          <div
            className={[
              // Mobile: panel absoluto que desliza desde la derecha
              'absolute inset-0 bg-white flex flex-col',
              'transition-transform duration-300 ease-in-out',
              mobileView === 'chat' ? 'translate-x-0' : 'translate-x-full',
              // Desktop: posición relativa, ocupa el resto del espacio
              'md:relative md:inset-auto md:translate-x-0 md:flex-1',
            ].join(' ')}
          >
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Selecciona un estudiante para chatear</p>
                </div>
              </div>
            ) : (
              <>
                {/* Header fijo: botón volver (solo mobile) + nombre del estudiante */}
                <div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center gap-3 shrink-0 shadow-sm">
                  <button
                    onClick={handleBack}
                    className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors -ml-1"
                    aria-label="Volver"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {selected.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{selected.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {selected.courseTitle}
                      {selected.currentLessonTitle && <span> — {selected.currentLessonTitle}</span>}
                    </p>
                  </div>
                </div>

                {/* Área de mensajes: única parte con scroll */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {loadingMessages && messages.length === 0 ? (
                    <div className="flex justify-center pt-8">
                      <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                      <MessageSquare className="w-8 h-8 opacity-30" />
                      <p className="text-sm">Aun no hay mensajes. Escribe al estudiante.</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.isFromTeacher ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          msg.isFromTeacher
                            ? 'bg-teal-500 text-white rounded-tr-sm'
                            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                        }`}>
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${msg.isFromTeacher ? 'text-teal-100' : 'text-gray-400'}`}>
                            {new Date(msg.createdAt).toLocaleString('es-VE', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input fijo al fondo */}
                <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
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
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
