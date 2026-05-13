'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Send, MessageSquare, Lock } from 'lucide-react';
import { getTeacherMessages, sendMessageToTeacher, markTeacherMessagesRead, getAssignedTeacher, type ConversationMessage } from '../actions';

interface Teacher {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  specialty: string[];
}

export default function StudentMessagesPage() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOro, setIsOro] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    try {
      const [fetchedTeacher, fetchedMessages] = await Promise.all([
        getAssignedTeacher(),
        getTeacherMessages().catch(err => {
          if (err.message?.includes('plan Oro')) {
            setIsOro(false);
          }
          return [] as ConversationMessage[];
        }),
      ]);
      setTeacher(fetchedTeacher as Teacher | null);
      setMessages(fetchedMessages);
    } catch (err) {
      const e = err as Error;
      if (e.message?.includes('plan Oro')) setIsOro(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      const fetched = await getTeacherMessages().catch(() => [] as ConversationMessage[]);
      setMessages(fetched);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (teacher && messages.some(m => m.isFromTeacher && !m.isRead)) {
      markTeacherMessagesRead(teacher.id).catch(() => {});
    }
  }, [messages, teacher]);

  const handleSend = async () => {
    if (!teacher || !messageText.trim()) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('teacherId', teacher.id);
      fd.append('content', messageText.trim());
      await sendMessageToTeacher(fd);
      setMessageText('');
      const fetched = await getTeacherMessages();
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
        <div className="w-8 h-8 border-4 border-[#1B4F8C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isOro) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <Lock className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-black text-gray-900">Funcion exclusiva Plan Oro</h2>
        <p className="text-gray-500 max-w-sm">
          La mensajeria con tu docente esta disponible para estudiantes con plan Oro.
          Actualiza tu plan para desbloquear esta funcion.
        </p>
        <a
          href="/dashboard/plans"
          className="mt-2 px-6 py-3 rounded-xl bg-[#1B4F8C] text-white font-semibold hover:bg-[#163e6e] transition-colors"
        >
          Ver planes
        </a>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <MessageSquare className="w-12 h-12 text-gray-300" />
        <h2 className="text-lg font-bold text-gray-700">Aun no tienes docente asignado</h2>
        <p className="text-gray-500 max-w-sm">
          Un docente sera asignado a tu ruta pronto. Vuelve a revisar en unos dias.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      <h1 className="text-2xl font-black text-gray-900 mb-4">Mensajes</h1>

      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        {/* Header del docente */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B4F8C] to-[#00B5B5] flex items-center justify-center text-white font-bold text-sm shrink-0">
            {teacher.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{teacher.name}</p>
            <p className="text-xs text-gray-500">{teacher.specialty.join(', ') || 'Docente'}</p>
          </div>
        </div>

        {/* Hilo de mensajes */}
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
                      : 'bg-[#1B4F8C] text-white rounded-tr-sm'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${msg.isFromTeacher ? 'text-gray-400' : 'text-blue-200'}`}>
                    {new Date(msg.createdAt).toLocaleString('es-VE', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex gap-2 items-end">
            <textarea
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Escribe un mensaje..."
              rows={2}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#1B4F8C] transition-colors"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
            />
            <button
              onClick={handleSend}
              disabled={!messageText.trim() || sending}
              className="p-2.5 rounded-xl bg-[#1B4F8C] text-white hover:bg-[#163e6e] disabled:opacity-40 transition-colors shrink-0"
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
