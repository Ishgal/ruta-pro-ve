// app/teacher-dashboard/messages/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getMessages, sendMessage } from '../actions';
import { Send, MessageSquare } from 'lucide-react';

// Tipos
interface Student {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface Message {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string | null;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

export default function MessagesPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Paso 1: Obtener estudiantes con plan ORO
      const { data: oroStudents } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, plan')
        .eq('role', 'estudiante')
        .eq('plan', 'oro');

      if (!oroStudents || oroStudents.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // Paso 2: Obtener cursos del docente
      const { data: teacherCourses } = await supabase
        .from('teacher_assignments')
        .select('course_id')
        .eq('teacher_id', user.id)
        .eq('is_active', true);

      if (!teacherCourses || teacherCourses.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const courseIds = teacherCourses.map(c => c.course_id);

      // Paso 3: Verificar qué estudiantes ORO están en esos cursos
      const { data: progressData } = await supabase
        .from('user_course_progress')
        .select('user_id')
        .in('course_id', courseIds)
        .in('user_id', oroStudents.map(s => s.id));

      if (!progressData) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // Paso 4: Filtrar estudiantes que tienen progreso en los cursos
      const studentIdsWithProgress = new Set(progressData.map(p => p.user_id));
      const filteredStudents = oroStudents.filter(s => studentIdsWithProgress.has(s.id));

      // Paso 5: Formatear estudiantes
      const studentsList: Student[] = filteredStudents.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        avatarUrl: student.avatar_url,
      }));

      setStudents(studentsList);

      // Cargar mensajes
      const fetchedMessages = await getMessages();
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      const fetchedMessages = await getMessages();
      setMessages(fetchedMessages);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSendMessage = async () => {
    if (!selectedStudent || !messageText.trim()) return;
    
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('studentId', selectedStudent.id);
      formData.append('content', messageText.trim());
      await sendMessage(formData);
      
      const fetchedMessages = await getMessages();
      setMessages(fetchedMessages);
      setMessageText('');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const getConversation = (studentId: string) => {
    return messages.filter(m => m.studentId === studentId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mensajería</h1>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 h-150">
          {/* Lista de estudiantes */}
          <div className="border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Estudiantes</h2>
              <p className="text-sm text-gray-500 mt-1">
                {students.length} estudiantes con plan Oro
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {students.map((student) => {
                const conversation = getConversation(student.id);
                const unreadCount = conversation.filter(m => !m.isRead).length;
                const lastMessage = conversation[0];
                
                return (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedStudent?.id === student.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-linear-to-r from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {student.name}
                        </p>
                        {lastMessage && (
                          <p className="text-sm text-gray-500 truncate">
                            {lastMessage.content}
                          </p>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Área de chat */}
          <div className="col-span-2 flex flex-col h-full">
            {selectedStudent ? (
              <>
                {/* Header del chat */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-linear-to-r from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold">
                      {selectedStudent.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedStudent.name}</p>
                      <p className="text-sm text-gray-500">{selectedStudent.email}</p>
                    </div>
                  </div>
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {getConversation(selectedStudent.id).map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isRead ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.isRead
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.isRead ? 'text-gray-400' : 'text-blue-200'
                        }`}>
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input de mensaje */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Escribe tu mensaje..."
                      className="flex-1 border rounded-lg p-2 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sending}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 h-fit"
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Selecciona un estudiante para empezar a chatear</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}