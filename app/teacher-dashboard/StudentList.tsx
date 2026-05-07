// app/teacher-dashboard/StudentList.tsx
'use client';

import Image from 'next/image';
import { MessageSquare, Users, Search, Filter } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  progress: number;
  level: string;
  plan: string;
}

interface StudentListProps {
  students: Student[];
  onMessageClick: (student: Student) => void;
}

export default function StudentList({ students, onMessageClick }: StudentListProps) {
  if (!students || students.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No se encontraron estudiantes</p>
        <p className="text-sm text-gray-400 mt-1">
          Los estudiantes con plan Oro aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Lista de Estudiantes
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({students.length} estudiantes con plan Oro)
          </span>
        </h2>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-initial bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Buscar alumno..." 
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <button className="bg-gray-100 px-4 py-2 rounded-lg text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {students.map((student) => (
          <div 
            key={student.id}
            className="bg-white rounded-lg p-6 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-100"
            onClick={() => onMessageClick(student)}
          >
            <div className="w-20 h-20 rounded-full border-4 border-teal-200 mb-4 overflow-hidden relative bg-gray-100 flex items-center justify-center">
              {student.avatarUrl ? (
                <Image 
                  src={student.avatarUrl} 
                  alt={student.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-500">
                  {student.name.charAt(0)}
                </span>
              )}
              <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/20 transition-colors flex items-center justify-center rounded-full">
                <MessageSquare className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
              </div>
            </div>
            <h4 className="text-lg font-bold text-gray-900">{student.name}</h4>
            <p className="text-sm text-gray-500 mb-4">
              {student.level === 'completed' ? 'Avanzado' : student.level === 'in_progress' ? 'Intermedio' : 'Inicial'}
            </p>
            <div className="w-full space-y-2 mb-6">
              <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
                <span>Progreso</span>
                <span>{student.progress}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 rounded-full transition-all"
                  style={{ width: `${student.progress}%` }}
                />
              </div>
            </div>
            <button className="w-full py-2 rounded-full border border-blue-600 text-blue-600 font-bold text-xs hover:bg-blue-50 transition-colors">
              Enviar Mensaje
            </button>
          </div>
        ))}
      </div>
    </>
  );
}