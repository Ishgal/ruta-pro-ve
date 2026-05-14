'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare, Users, Search, Filter, ChevronDown, X } from 'lucide-react';

export interface Student {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  progress: number;
  levelName: string;
  courseId: string;
  courseTitle: string;
}

interface StudentListProps {
  students: Student[];
  onMessageClick: (student: Student) => void;
}

type ProgressRange = 'all' | '0-30' | '31-60' | '61-100';

export default function StudentList({ students, onMessageClick }: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [progressRange, setProgressRange] = useState<ProgressRange>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Niveles únicos presentes en los estudiantes asignados
  const uniqueLevels = useMemo(() => {
    const levels = [...new Set(students.map(s => s.levelName))];
    return levels.sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    let filtered = [...students];

    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(s => s.levelName === selectedLevel);
    }

    if (progressRange !== 'all') {
      filtered = filtered.filter(s => {
        switch (progressRange) {
          case '0-30': return s.progress <= 30;
          case '31-60': return s.progress >= 31 && s.progress <= 60;
          case '61-100': return s.progress >= 61;
          default: return true;
        }
      });
    }

    return filtered;
  }, [students, searchTerm, selectedLevel, progressRange]);

  // Conteo por nivel real
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of students) {
      counts[s.levelName] = (counts[s.levelName] ?? 0) + 1;
    }
    return counts;
  }, [students]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedLevel('all');
    setProgressRange('all');
  };

  const hasActiveFilters = searchTerm !== '' || selectedLevel !== 'all' || progressRange !== 'all';

  if (!students || students.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay estudiantes asignados</h3>
        <p className="text-gray-500">
          Los estudiantes aparecerán aquí cuando se les asigne un mentor en sus cursos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Lista de Estudiantes
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredStudents.length} de {students.length} estudiantes)
            </span>
          </h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {uniqueLevels.map(level => (
              <button
                key={level}
                onClick={() => setSelectedLevel(selectedLevel === level ? 'all' : level)}
                className={`text-xs px-2 py-1 rounded-full transition-colors ${
                  selectedLevel === level
                    ? 'bg-teal-500 text-white'
                    : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                }`}
              >
                {level}: {levelCounts[level]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-gray-900 placeholder:text-gray-400 w-full"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg text-gray-700 font-bold text-sm transition-colors flex items-center gap-2 ${
              hasActiveFilters ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="bg-teal-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {[selectedLevel !== 'all', progressRange !== 'all'].filter(Boolean).length}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Nivel del curso</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedLevel('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedLevel === 'all'
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Todos
                </button>
                {uniqueLevels.map(level => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedLevel === level
                        ? 'bg-teal-500 text-white shadow-sm'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Progreso en el curso (%)</label>
              <div className="flex gap-2">
                {(['all', '0-30', '31-60', '61-100'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setProgressRange(range)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      progressRange === range
                        ? 'bg-teal-500 text-white shadow-sm'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {range === 'all' ? 'Todos' : `${range}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
              <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                <X className="w-3 h-3" />
                Limpiar todos los filtros
              </button>
            </div>
          )}
        </div>
      )}

      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No se encontraron estudiantes con los filtros actuales</p>
          <button onClick={clearFilters} className="mt-3 text-teal-600 text-sm hover:underline">
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map(student => {
            const progressColor = student.progress >= 70 ? 'text-green-600' :
                                  student.progress >= 40 ? 'text-teal-600' : 'text-yellow-600';
            const progressBg = student.progress >= 70 ? 'bg-green-500' :
                               student.progress >= 40 ? 'bg-teal-500' : 'bg-yellow-500';

            return (
              <Link
                key={student.id}
                href={`/teacher-dashboard/students/${student.id}`}
                className="block bg-white rounded-lg p-6 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 group border border-gray-100"
              >
                <div className="w-20 h-20 rounded-full border-4 border-teal-200 mb-4 overflow-hidden relative bg-gray-100 flex items-center justify-center">
                  {student.avatarUrl ? (
                    <Image src={student.avatarUrl} alt={student.name} width={80} height={80} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-gray-500">{student.name.charAt(0)}</span>
                  )}
                  <div className="absolute inset-0 bg-teal-600/0 group-hover:bg-teal-600/20 transition-colors flex items-center justify-center rounded-full">
                    <button
                      onClick={e => { e.preventDefault(); onMessageClick(student); }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <MessageSquare className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                </div>

                <h4 className="text-lg font-bold text-gray-900 leading-tight">{student.name}</h4>
                <p className={`text-sm mb-1 font-medium ${progressColor}`}>{student.levelName}</p>
                <p className="text-xs text-gray-400 mb-4 truncate w-full">{student.courseTitle}</p>

                <div className="w-full space-y-2 mb-6">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
                    <span>Progreso</span>
                    <span className={progressColor}>{student.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${progressBg}`} style={{ width: `${student.progress}%` }} />
                  </div>
                </div>

                <button
                  onClick={e => { e.preventDefault(); onMessageClick(student); }}
                  className="w-full py-2 rounded-full border border-teal-500 text-teal-600 font-bold text-xs hover:bg-teal-50 transition-colors"
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
