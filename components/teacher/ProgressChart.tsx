// components/teacher/ProgressChart.tsx
'use client';

import { useEffect, useState } from 'react';
import { getProgressOverTime, getWeeklyProgress, ProgressPeriodData } from '@/app/teacher-dashboard/actions';
import { BarChart2, TrendingUp, Calendar } from 'lucide-react';

type ChartType = 'monthly' | 'weekly';

export default function ProgressChart() {
  const [chartType, setChartType] = useState<ChartType>('monthly');
  const [data, setData] = useState<ProgressPeriodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxProgress, setMaxProgress] = useState(100);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let chartData: ProgressPeriodData[];
        if (chartType === 'monthly') {
          chartData = await getProgressOverTime();
        } else {
          chartData = await getWeeklyProgress();
        }
        setData(chartData);
        
        // Calcular el máximo para escalar el gráfico
        const max = Math.max(...chartData.map(d => d.averageProgress), 10);
        setMaxProgress(Math.ceil(max / 10) * 10);
      } catch (error) {
        console.error('Error loading chart data:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [chartType]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <BarChart2 className="w-12 h-12 mb-3 opacity-50" />
          <p>No hay suficientes datos para mostrar el gráfico</p>
          <p className="text-sm mt-1">Los datos de progreso aparecerán aquí cuando los estudiantes comiencen los cursos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Evolución del Progreso
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Promedio de progreso de tus estudiantes
          </p>
        </div>
        
        {/* Selector de tipo de gráfico */}
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setChartType('monthly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              chartType === 'monthly'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Mensual
          </button>
          <button
            onClick={() => setChartType('weekly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              chartType === 'weekly'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Semanal
          </button>
        </div>
      </div>

      {/* Gráfico de barras */}
      <div className="relative h-80 w-full">
        {/* Líneas de cuadrícula */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 25, 50, 75, 100].map((line) => (
            <div key={line} className="relative">
              <div className="border-t border-gray-200" style={{ top: `${100 - line}%` }} />
              <span className="absolute -left-8 text-xs text-gray-400" style={{ top: `${100 - line - 2}%` }}>
                {line}%
              </span>
            </div>
          ))}
        </div>

        {/* Barras */}
        <div className="absolute inset-0 flex items-end justify-around pt-6 pb-6">
          {data.map((item, index) => {
            const height = (item.averageProgress / maxProgress) * 100;
            const barColor = item.averageProgress >= 70 ? 'bg-green-500' : 
                            item.averageProgress >= 40 ? 'bg-blue-500' : 
                            'bg-yellow-500';
            
            return (
              <div key={index} className="flex flex-col items-center group w-full max-w-20">
                <div className="relative w-full flex justify-center">
                  <div 
                    className={`w-12 rounded-t-lg transition-all duration-500 ease-out ${barColor} hover:opacity-80 cursor-pointer`}
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {item.averageProgress}% ({item.studentsCount} estudiantes)
                    </div>
                  </div>
                </div>
                <span className="mt-3 text-xs font-medium text-gray-600 rotate-45 sm:rotate-0 origin-top-left sm:origin-center">
                  {item.period}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {data[data.length - 1]?.averageProgress || 0}%
            </p>
            <p className="text-xs text-gray-500">Progreso actual</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {data[0]?.averageProgress && data[data.length - 1]?.averageProgress
                ? `${(data[data.length - 1].averageProgress - data[0].averageProgress) > 0 ? '+' : ''}${Math.round(data[data.length - 1].averageProgress - data[0].averageProgress)}%`
                : '0%'}
            </p>
            <p className="text-xs text-gray-500">vs período anterior</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {data.reduce((acc, d) => acc + d.studentsCount, 0) / data.length || 0}
            </p>
            <p className="text-xs text-gray-500">Promedio estudiantes activos</p>
          </div>
        </div>
      </div>
    </div>
  );
}