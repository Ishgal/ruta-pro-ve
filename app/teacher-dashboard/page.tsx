// app/teacher-dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  MessageSquare, 
  Send,
  X
} from 'lucide-react';
import { getMessages, sendMessage, markAllMessagesAsRead } from './actions';
import ProgressChart from '@/components/teacher/ProgressChart';
import StudentList from '@/components/teacher/StudentList';

// Tipos
interface Student {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  progress: number;
  level: string;
  plan: string;
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

interface ProgressItem {
  user_id: string;
  progress_percent: number;
  status: string;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const supabase = createClient();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    try {
      const fetchedMessages = await getMessages();
      setMessages(fetchedMessages);
      const unread = fetchedMessages.filter((m) => !m.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Obtener información del usuario desde la API route
        const meResponse = await fetch('/api/auth/me');
        if (!meResponse.ok) {
          router.push('/login');
          return;
        }
        
        const userData = await meResponse.json();
        
        if (userData.role !== 'docente') {
          router.push('/dashboard');
          return;
        }

        // Obtener estudiantes con plan ORO
        const { data: oroStudents } = await supabase
          .from('users')
          .select('id, name, email, avatar_url, plan')
          .eq('role', 'estudiante')
          .eq('plan', 'oro');

        if (!oroStudents || oroStudents.length === 0) {
          setStudents([]);
          setLoading(false);
          await loadMessages();
          return;
        }

        // Obtener cursos del docente
        const { data: teacherCourses } = await supabase
          .from('teacher_assignments')
          .select('course_id')
          .eq('teacher_id', userData.id)
          .eq('is_active', true);

        if (!teacherCourses || teacherCourses.length === 0) {
          setStudents([]);
          setLoading(false);
          await loadMessages();
          return;
        }

        const courseIds = teacherCourses.map(c => c.course_id);

        // Obtener progreso de los estudiantes
        const { data: progressData } = await supabase
          .from('user_course_progress')
          .select('user_id, progress_percent, status')
          .in('course_id', courseIds)
          .in('user_id', oroStudents.map(s => s.id));

        // Calcular el mejor progreso por estudiante
        const studentProgressMap = new Map<string, { progress: number; status: string }>();
        
        (progressData as ProgressItem[] | null)?.forEach((progress) => {
          const current = studentProgressMap.get(progress.user_id);
          const progressPercent = progress.progress_percent || 0;
          
          if (!current || progressPercent > current.progress) {
            studentProgressMap.set(progress.user_id, {
              progress: progressPercent,
              status: progress.status || 'not_started'
            });
          }
        });

        // Construir la lista final de estudiantes
        const studentsList: Student[] = oroStudents.map(student => {
          const progress = studentProgressMap.get(student.id) || { progress: 0, status: 'not_started' };
          return {
            id: student.id,
            name: student.name,
            email: student.email,
            avatarUrl: student.avatar_url,
            progress: progress.progress,
            level: progress.status,
            plan: student.plan
          };
        });

        setStudents(studentsList);
        await loadMessages();

      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  }, [supabase, router]);

  const handleSendMessage = async () => {
    if (!selectedStudent || !messageText.trim()) return;
    
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('studentId', selectedStudent.id);
      formData.append('content', messageText.trim());
      await sendMessage(formData);
      await loadMessages();
      setMessageText('');
      setShowMessageModal(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleOpenMessageModal = async (student?: Student) => {
    if (student) setSelectedStudent(student);
    setShowMessageModal(true);
    await markAllMessagesAsRead();
    await loadMessages();
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
              onClick={() => handleOpenMessageModal()} 
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
                onClick={() => {
                  const student = students.find(s => s.id === message.studentId);
                  if (student) handleOpenMessageModal(student);
                }} 
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
            onClick={() => handleOpenMessageModal()} 
            className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold transition-all hover:bg-blue-700 active:scale-95 flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" /> Nuevo Mensaje
          </button>
        </section>

        {/* Student List Section */}
        <section className="col-span-12">
          <StudentList students={students} onMessageClick={handleOpenMessageModal} />
        </section>
      </div>

      {/* Modal para enviar mensaje */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedStudent ? `Mensaje para ${selectedStudent.name}` : 'Nuevo Mensaje'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Solo estudiantes con plan Oro</p>
              </div>
              <button 
                onClick={() => { 
                  setShowMessageModal(false); 
                  setSelectedStudent(null); 
                  setMessageText(''); 
                }} 
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {!selectedStudent && students.length > 0 && (
              <div className="p-4 border-b border-gray-100">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Seleccionar estudiante
                </label>
                <select 
                  onChange={(e) => { 
                    const student = students.find(s => s.id === e.target.value); 
                    setSelectedStudent(student || null); 
                  }} 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">Seleccionar...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {selectedStudent && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{selectedStudent.name}</p>
                    <p className="text-xs text-gray-500 truncate">{selectedStudent.email}</p>
                  </div>
                </div>
                
                <textarea 
                  value={messageText} 
                  onChange={(e) => setMessageText(e.target.value)} 
                  placeholder="Escribe tu mensaje aquí..." 
                  rows={4} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                />
                
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => { 
                      setShowMessageModal(false); 
                      setSelectedStudent(null); 
                      setMessageText(''); 
                    }} 
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSendMessage} 
                    disabled={!messageText.trim() || sending} 
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Enviar
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}