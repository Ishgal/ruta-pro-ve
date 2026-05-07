'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RefreshCw, TrendingUp, Users, BookOpen, DollarSign, Plus } from 'lucide-react';

// ---------- Tipos de datos (igual que antes) ----------
type KPIs = {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  newUsersLast30Days: number;
  totalPublishedCourses: number;
  totalRevenue: number;
  userGrowthPercent: number;
  revenueGrowthPercent: number;
  serverUsage: number;
  bandwidthUsage: number;
};

type ChartData = {
  dailyActivity: { date: string; count: number }[];
  topCourses: { name: string; completions: number; instructor: string; students: number; status: string }[];
  topTeachers: { name: string; specialty: string; students: number; coursesCount: number; rating: number }[];
};

type RecentUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
};

type RecentPayment = {
  id: string;
  userName: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
};

type RecentLessonCompletion = {
  userName: string;
  courseTitle: string;
  lessonTitle: string;
  completedAt: string;
};

type RecentData = {
  recentUsers: RecentUser[];
  recentPayments: RecentPayment[];
  recentLessonCompletions: RecentLessonCompletion[];
};

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [recentData, setRecentData] = useState<RecentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllData = async () => {
    try {
      setError(null);
      const [statsRes, chartsRes, recentRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/dashboard/charts'),
        fetch('/api/admin/dashboard/recent')
      ]);
      if (!statsRes.ok || !chartsRes.ok || !recentRes.ok) throw new Error('Error al cargar datos');

      const statsData: KPIs = await statsRes.json();
      const chartsData: ChartData = await chartsRes.json();
      const recentDataRaw: RecentData = await recentRes.json();

      setKpis(statsData);
      setChartData(chartsData);
      setRecentData(recentDataRaw);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = () => {
    setRefreshing(true);
    fetchAllData();
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState onRetry={refreshData} error={error} />;

  const formatMoney = (amount: number) => `$${amount.toFixed(2)}`;

  // Preparamos los valores para los colores del gráfico
  const counts = chartData?.dailyActivity?.map(d => d.count) || [];
  const sortedUnique = [...new Set(counts)].sort((a,b) => b - a);
  const max1 = sortedUnique[0] ?? 0;
  const max2 = sortedUnique[1] ?? 0;

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 pb-32">
      {/* Tarjetas KPI (sin cambios) */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-teal-500 text-white rounded-xl p-8 flex flex-col justify-between relative overflow-hidden shadow-xl">
          <div className="z-10">
            <p className="font-headline font-bold text-white/90 mb-2 uppercase tracking-widest text-xs">
              Total Estudiantes
            </p>
            <h2 className="text-5xl font-black font-headline mb-4 text-white">
              {kpis?.totalStudents?.toLocaleString() || 0}
            </h2>
            <div className="flex items-center gap-2 text-white/80">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-bold">
                {kpis?.userGrowthPercent?.toFixed(1)}% este mes
              </span>
            </div>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
            <Users className="w-40 h-40 text-white" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 flex flex-col justify-between shadow-lg border border-gray-100">
          <div className="flex justify-between items-start">
            <div className="bg-blue-100 p-3 rounded-2xl">
              <BookOpen className="w-6 h-6 text-blue-700" />
            </div>
            <span className="text-teal-600 font-bold text-sm">+{kpis?.totalPublishedCourses || 0}</span>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Cursos Activos</p>
            <h3 className="text-2xl font-bold text-gray-800">{kpis?.totalPublishedCourses || 0}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 flex flex-col justify-between shadow-lg border border-gray-100">
          <div className="flex justify-between items-start">
            <div className="bg-green-100 p-3 rounded-2xl">
              <DollarSign className="w-6 h-6 text-green-700" />
            </div>
            <span className="text-teal-600 font-bold text-sm">+{kpis?.revenueGrowthPercent?.toFixed(0)}%</span>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Ingresos del mes</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatMoney(kpis?.totalRevenue || 0)}</h3>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Gráfico de actividad diaria con nueva asignación de colores */}
          <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Actividad de la Plataforma</h3>
                <p className="text-gray-500 text-sm">Usuarios registrados por día (últimos 7 días)</p>
              </div>
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="bg-gray-100 rounded-full text-xs font-bold px-4 py-2 flex items-center gap-1 hover:bg-gray-200 text-gray-700"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData?.dailyActivity || []} barCategoryGap="12%">
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#374151' }} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ backgroundColor: '#1f2937', color: '#f3f4f6', borderRadius: '0.5rem', fontSize: '12px', border: 'none' }}
                  labelStyle={{ color: '#9ca3af', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {chartData?.dailyActivity?.map((entry, index) => {
                    const value = entry.count;
                    let fillColor = '#cbd5e1'; // gris por defecto
                    if (value === max1) fillColor = '#3b82f6'; // azul
                    else if (value === max2) fillColor = '#14b8a6'; // verde turquesa
                    return <Cell key={`cell-${index}`} fill={fillColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-500 uppercase">
              {chartData?.dailyActivity?.map(d => (
                <span key={d.date}>{d.date}</span>
              ))}
            </div>
          </div>

          {/* Resto de la página (sin cambios) */}
          <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-100">
            <div className="p-6 flex justify-between items-center bg-gray-50 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Cursos Populares</h3>
              <a href="/admin/courses" className="text-sm font-bold text-blue-600 hover:underline">
                Ver todos
              </a>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-gray-600 text-xs uppercase font-bold">Curso</th>
                  <th className="px-6 py-4 text-gray-600 text-xs uppercase font-bold">Instructor</th>
                  <th className="px-6 py-4 text-gray-600 text-xs uppercase font-bold">Estudiantes</th>
                  <th className="px-6 py-4 text-gray-600 text-xs uppercase font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {chartData?.topCourses?.map((course, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-blue-700" />
                        </div>
                        <span className="font-semibold text-sm text-gray-800">{course.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{course.instructor}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">{course.students.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${course.status === 'Trending' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
                        {course.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
            <h3 className="font-bold mb-6 text-gray-800">Top Profesores</h3>
            <div className="space-y-6">
              {chartData?.topTeachers?.map((teacher, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold border border-gray-100">
                    {teacher.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-800">{teacher.name}</p>
                    <p className="text-xs text-gray-500 italic">{teacher.specialty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-teal-600">{teacher.rating}/5.0</p>
                    <p className="text-[10px] text-gray-400">{teacher.coursesCount} cursos</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
            <h3 className="font-bold mb-4 text-sm uppercase tracking-widest text-gray-500">Estado del Sistema</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-700">Uso de Servidor</span>
                <span className="text-xs font-bold text-gray-800">{kpis?.serverUsage || 0}%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${kpis?.serverUsage || 0}%` }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-700">Ancho de Banda</span>
                <span className="text-xs font-bold text-gray-800">{kpis?.bandwidthUsage || 0}%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500" style={{ width: `${kpis?.bandwidthUsage || 0}%` }}></div>
              </div>
            </div>
          </div>

          {recentData && recentData.recentUsers.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
              <h3 className="font-bold mb-4 text-gray-800">Últimos usuarios</h3>
              <div className="space-y-3">
                {recentData.recentUsers.slice(0, 3).map(user => (
                  <div key={user.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{user.name || user.email}</span>
                    <span className="text-gray-400 text-xs">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => window.location.href = '/admin/courses/new'}
        className="fixed bottom-8 right-8 w-16 h-16 bg-orange-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
      >
        <Plus className="w-8 h-8" strokeWidth={2} />
        <span className="absolute right-20 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Nuevo Curso
        </span>
      </button>
    </main>
  );
}

// DashboardSkeleton y ErrorState sin cambios
function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="md:col-span-2 h-40 bg-gray-200 rounded-xl"></div>
        <div className="h-40 bg-gray-200 rounded-xl"></div>
        <div className="h-40 bg-gray-200 rounded-xl"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="h-80 bg-gray-200 rounded-lg"></div>
          <div className="h-80 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="space-y-8">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="h-48 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ onRetry, error }: { onRetry: () => void; error: string }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 text-center">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8">
        <p className="text-red-700 font-bold">Error al cargar el dashboard</p>
        <p className="text-sm text-red-600 mt-2">{error}</p>
        <button onClick={onRetry} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-full">
          Reintentar
        </button>
      </div>
    </div>
  );
}