import { useEffect, useState } from 'react';
import { 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Search,
  FileText,
  ExternalLink,
  TrendingUp,
  Clock
} from 'lucide-react';
import { empleadoPortalService, type EmpleadoHistorial } from '../../services/empleadoPortalService';

const MiHistorialPagosPage = () => {
  const [historial, setHistorial] = useState<EmpleadoHistorial[]>([]);
  const [filteredHistorial, setFilteredHistorial] = useState<EmpleadoHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pagados' | 'pendientes'>('todos');

  useEffect(() => {
    loadHistorial();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [historial, searchTerm, filterStatus]);

  const loadHistorial = async () => {
    setLoading(true);
    try {
      const data = await empleadoPortalService.getHistorial();
      setHistorial(data);
    } catch (err) {
      console.error('Error al cargar historial de pagos', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...historial];

    // Search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(h => 
        h.paqueteNombre.toLowerCase().includes(term) ||
        h.eventoId.toString().includes(term) ||
        (h.rolEnEvento && h.rolEnEvento.toLowerCase().includes(term)) ||
        (h.periodoPago && h.periodoPago.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (filterStatus === 'pagados') {
      result = result.filter(h => h.esPagado);
    } else if (filterStatus === 'pendientes') {
      result = result.filter(h => !h.esPagado);
    }

    setFilteredHistorial(result);
  };

  // Stats calculation
  const totalCobrado = historial.filter(h => h.esPagado).reduce((sum, item) => sum + item.montoAPagar, 0);
  const totalPendiente = historial.filter(h => !h.esPagado).reduce((sum, item) => sum + item.montoAPagar, 0);
  const totalEventos = historial.length;
  const eventosPagados = historial.filter(h => h.esPagado).length;

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-500 font-black text-lg uppercase tracking-widest animate-pulse">Cargando tu historial de pagos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="space-y-2 z-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Mi Historial de Pagos</h1>
          <p className="text-indigo-200/80 text-sm max-w-xl">Consulta los eventos en los que has trabajado, los honorarios correspondientes y el estado de tus liquidaciones.</p>
        </div>
        <button 
          onClick={loadHistorial}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 shadow-md shadow-indigo-900/20 z-10 self-start md:self-center"
        >
          <RefreshCw size={18} /> Actualizar
        </button>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Cobrado</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">${totalCobrado.toLocaleString()}</h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{eventosPagados} eventos liquidados</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center animate-pulse">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Por Cobrar</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">${totalPendiente.toLocaleString()}</h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{totalEventos - eventosPagados} eventos pendientes</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Participaciones</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalEventos} eventos</h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Total de eventos asignados</p>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          {(['todos', 'pagados', 'pendientes'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`flex-1 md:flex-none px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all
                ${filterStatus === status 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por paquete o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs font-medium pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-700"
          />
        </div>
      </div>

      {/* DETAILED LIST OF TRANSACTIONS */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {filteredHistorial.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-5">Evento</th>
                  <th className="p-5">Rol Desempeñado</th>
                  <th className="p-5">Fecha Evento</th>
                  <th className="p-5">Monto de Pago</th>
                  <th className="p-5">Estado</th>
                  <th className="p-5 text-center">Detalle Liquidación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {filteredHistorial.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-5">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-800">{h.paqueteNombre}</span>
                        <div className="text-xs text-slate-400 font-semibold">ID Evento: #{h.eventoId}</div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                        {h.rolEnEvento || 'Colaborador'}
                      </span>
                    </td>
                    <td className="p-5 text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>{new Date(h.fechaEvento).toLocaleDateString('es-ES')}</span>
                      </div>
                    </td>
                    <td className="p-5 text-indigo-600 font-extrabold text-base">
                      ${h.montoAPagar.toLocaleString()}
                    </td>
                    <td className="p-5">
                      {h.esPagado ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
                          <CheckCircle2 size={13} /> Pagado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold">
                          <AlertCircle size={13} /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="p-5">
                      {h.esPagado ? (
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <span className="text-[11px] font-semibold text-slate-400">
                            Pagado el {h.fechaPago ? new Date(h.fechaPago).toLocaleDateString('es-ES') : ''}
                          </span>
                          
                          {h.comprobanteUrl ? (
                            <a 
                              href={h.comprobanteUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                            >
                              <FileText size={12} /> Ver Comprobante
                              <ExternalLink size={10} />
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Comprobante no adjunto</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-xs text-slate-400 italic">
                          A liquidar en próximo corte
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
              <Search size={28} />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-extrabold text-slate-800">Sin resultados</h2>
              <p className="text-slate-500 text-xs mt-1">No encontramos registros que coincidan con los filtros aplicados.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiHistorialPagosPage;
