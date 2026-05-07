// components/teacher/StudentList.tsx
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare, Users, Search, Filter, ChevronDown, X } from 'lucide-react';

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

type ProgressLevel = 'all' | 'inicial' | 'intermedio' | 'avanzado';
type ProgressRange = 'all' | '0-30' | '31-60' | '61-100';

export default function StudentList({ students, onMessageClick }: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [progressLevel, setProgressLevel] = useState<ProgressLevel>('all');
  const [progressRange, setProgressRange] = useState<ProgressRange>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filtrar estudiantes
  const filteredStudents = useMemo(() => {
    let filtered = [...students];

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por nivel de progreso
    if (progressLevel !== 'all') {
      filtered = filtered.filter(student => {
        const level = student.level === 'completed' ? 'avanzado' : 
                     student.level === 'in_progress' ? 'intermedio' : 'inicial';
        return level === progressLevel;
      });
    }

    // Filtro por rango de progreso
    if (progressRange !== 'all') {
      filtered = filtered.filter(student => {
        const progress = student.progress;
        switch (progressRange) {
          case '0-30':
            return progress >= 0 && progress <= 30;
          case '31-60':
            return progress >= 31 && progress <= 60;
          case '61-100':
            return progress >= 61 && progress <= 100;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [students, searchTerm, progressLevel, progressRange]);

  // Estadísticas de filtros
  const stats = {
    total: students.length,
    filtered: filteredStudents.length,
    inicial: students.filter(s => s.level === 'not_started' || s.progress < 30).length,
    intermedio: students.filter(s => s.level === 'in_progress' || (s.progress >= 31 && s.progress <= 60)).length,
    avanzado: students.filter(s => s.level === 'completed' || s.progress > 60).length,
  };

  const clearFilters = () => {
    setSearchTerm('');
    setProgressLevel('all');
    setProgressRange('all');
  };

  const hasActiveFilters = searchTerm !== '' || progressLevel !== 'all' || progressRange !== 'all';

  if (!students || students.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay estudiantes asignados
        </h3>
        <p className="text-gray-500">
          Los estudiantes con plan Oro aparecerán aquí cuando se asignen a tus cursos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Lista de Estudiantes
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredStudents.length} de {students.length} estudiantes)
            </span>
          </h2>
          <div className="flex gap-3 mt-2">
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              Inicial: {stats.inicial}
            </span>
            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
              Intermedio: {stats.intermedio}
            </span>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
              Avanzado: {stats.avanzado}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Barra de búsqueda */}
          <div className="flex-1 sm:flex-initial bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-500" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o email..." 
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-gray-900 placeholder:text-gray-400 w-full"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          
          {/* Botón de filtros */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`bg-gray-100 px-4 py-2 rounded-lg text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors flex items-center gap-2 ${
              hasActiveFilters ? 'bg-blue-100 text-blue-700' : ''
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {[progressLevel !== 'all', progressRange !== 'all'].filter(Boolean).length}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Filtro por nivel */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">
                Nivel de progreso
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setProgressLevel('all')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    progressLevel === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setProgressLevel('inicial')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    progressLevel === 'inicial'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Inicial
                </button>
                <button
                  onClick={() => setProgressLevel('intermedio')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    progressLevel === 'intermedio'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Intermedio
                </button>
                <button
                  onClick={() => setProgressLevel('avanzado')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    progressLevel === 'avanzado'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Avanzado
                </button>
              </div>
            </div>

            {/* Filtro por rango */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">
                Rango de progreso (%)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setProgressRange('all')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    progressRange === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setProgressRange('0-30')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    progressRange === '0-30'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  0-30%
                </button>
                <button
                  onClick={() => setProgressRange('31-60')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    progressRange === '31-60'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  31-60%
                </button>
                <button
                  onClick={() => setProgressRange('61-100')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    progressRange === '61-100'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  61-100%
                </button>
              </div>
            </div>
          </div>

          {/* Botón limpiar filtros */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Limpiar todos los filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lista de estudiantes */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No se encontraron estudiantes con los filtros actuales</p>
          <button
            onClick={clearFilters}
            className="mt-3 text-blue-600 text-sm hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map((student) => {
            const progressColor = student.progress >= 70 ? 'text-green-600' :
                                 student.progress >= 40 ? 'text-blue-600' :
                                 'text-yellow-600';
            const progressBgColor = student.progress >= 70 ? 'bg-green-500' :
                                   student.progress >= 40 ? 'bg-blue-500' :
                                   'bg-yellow-500';
            
            return (
              <Link
                key={student.id}
                href={`/teacher-dashboard/students/${student.id}`}
                className="block bg-white rounded-lg p-6 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 group border border-gray-100"
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
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onMessageClick(student);
                      }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <MessageSquare className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-gray-900">{student.name}</h4>
                <p className={`text-sm mb-4 ${progressColor}`}>
                  {student.level === 'completed' ? 'Avanzado' : student.level === 'in_progress' ? 'Intermedio' : 'Inicial'}
                </p>
                <div className="w-full space-y-2 mb-6">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
                    <span>Progreso</span>
                    <span className={progressColor}>{student.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${progressBgColor}`}
                      style={{ width: `${student.progress}%` }}
                    />
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    onMessageClick(student);
                  }}
                  className="w-full py-2 rounded-full border border-blue-600 text-blue-600 font-bold text-xs hover:bg-blue-50 transition-colors"
                >
                  Enviar Mensaje
                </button>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}