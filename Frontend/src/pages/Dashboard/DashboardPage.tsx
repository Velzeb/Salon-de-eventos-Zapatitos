import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { 
  Users, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Package,
  RefreshCw,
  Activity,
  TrendingDown,
  LayoutDashboard,
  Target
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { dashboardService } from '../../services/dashboardService';
import type { DashboardStats } from '../../services/dashboardService';

type Periodo = 'Semana' | 'Mes' | 'Año';

import { Skeleton } from '../../components/common/Skeleton';



const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const DashboardPage = () => {
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>('Semana');

  useEffect(() => {
    loadStats(periodo);
  }, [periodo]);

  const loadStats = async (p: Periodo = periodo) => {
    setLoading(true);
    try {
      const data = await dashboardService.getStats(p);
      setStatsData(data);
    } catch (err: any) {
      console.error('Error al cargar estadísticas', err);
      toast.error('Ocurrió un error al intentar cargar el panel de métricas y estadísticas.');
    } finally {
      setLoading(false);
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-8 pb-12 font-sans">
      <div className="bg-slate-900 p-10 rounded-2xl shadow-xl flex justify-between items-center border border-slate-800">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 rounded-lg opacity-20" />
          <Skeleton className="h-4 w-64 rounded-md opacity-20" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl opacity-20" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Skeleton className="h-[400px] lg:col-span-8 w-full rounded-2xl" />
        <Skeleton className="h-[400px] lg:col-span-4 w-full rounded-2xl" />
      </div>
    </div>
  );

  if (loading || !statsData) return renderSkeleton();

  const calcTrend = (current: number, previous: number): { text: string; positive: boolean } => {
    if (previous === 0) return { text: current > 0 ? 'Nuevo' : 'Sin datos', positive: current > 0 };
    const pct = ((current - previous) / previous) * 100;
    return { text: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, positive: pct >= 0 };
  };

  const trendEventos = calcTrend(statsData.eventosEsteMes, statsData.eventosMesAnterior);
  const trendIngresos = calcTrend(statsData.ingresosTotales, statsData.ingresosMesAnterior);
  const trendClientes = calcTrend(statsData.clientesNuevos, statsData.clientesMesAnterior);

  const stats = [
    { 
      label: 'Eventos del Mes', 
      value: statsData.eventosEsteMes.toString(), 
      change: trendEventos.text, 
      positive: trendEventos.positive,
      icon: CalendarIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      badgeColor: trendEventos.positive ? 'text-blue-700 bg-blue-100' : 'text-rose-700 bg-rose-100'
    },
    { 
      label: 'Ingresos Totales', 
      value: `$${statsData.ingresosTotales.toLocaleString()}`, 
      change: trendIngresos.text, 
      positive: trendIngresos.positive,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      badgeColor: trendIngresos.positive ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
    },
    { 
      label: 'Clientes Nuevos', 
      value: statsData.clientesNuevos.toString(), 
      change: trendClientes.text, 
      positive: trendClientes.positive,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      badgeColor: trendClientes.positive ? 'text-indigo-700 bg-indigo-100' : 'text-rose-700 bg-rose-100'
    },
    { 
      label: 'Alerta de Stock', 
      value: statsData.stockCritico.toString(), 
      change: statsData.stockCritico > 0 ? 'Revisar' : 'Al día', 
      positive: statsData.stockCritico === 0,
      icon: Package,
      color: statsData.stockCritico > 0 ? 'text-rose-600' : 'text-emerald-600',
      bg: statsData.stockCritico > 0 ? 'bg-rose-50' : 'bg-emerald-50',
      badgeColor: statsData.stockCritico > 0 ? 'text-rose-700 bg-rose-100' : 'text-emerald-700 bg-emerald-100'
    },
  ];

  return (
    <div className="space-y-10 pb-12 font-sans">
      {/* HEADER SECTION - ENTERPRISE DARK */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-10 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
            <LayoutDashboard size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight uppercase">
              Dashboard Operativo
            </h1>
            <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-widest mt-1">
              Inteligencia de Negocio y Control de Gestión
            </p>
          </div>
        </div>

        <button 
          onClick={() => loadStats(periodo)}
          className="flex items-center justify-center w-12 h-12 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all border border-white/5 active:scale-95"
          title="Actualizar datos"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight px-2.5 py-1 rounded-md ${stat.badgeColor}`}>
                {stat.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {stat.change}
              </div>
            </div>
            
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* MAIN AREA CHART */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Target size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Rendimiento Comercial</h3>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                {periodo === 'Semana' ? 'Análisis de Ingresos — Últimos 7 días' : periodo === 'Mes' ? 'Análisis de Ingresos — Este Mes' : 'Análisis de Ingresos — Este Año'}
              </p>
              </div>
            </div>
            
            <div className="flex items-center bg-slate-50 p-1 rounded-lg border border-slate-200">
              {(['Semana', 'Mes', 'Año'] as Periodo[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setPeriodo(opt)}
                  className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                    opt === periodo
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statsData.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  dx={-15}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '1rem', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '16px'
                  }} 
                  itemStyle={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}
                  labelStyle={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ingresos" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorIngresos)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECONDARY BAR CHART */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Actividad</h3>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Eventos por Día</p>
            </div>
          </div>
          
          <div className="flex-1 h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData.chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  dy={15}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '0.75rem', 
                    border: '1px solid #e2e8f0', 
                    padding: '8px 12px' 
                  }}
                  itemStyle={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}
                />
                <Bar dataKey="eventos" radius={[6, 6, 0, 0]} maxBarSize={32}>
                  {statsData.chartData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

