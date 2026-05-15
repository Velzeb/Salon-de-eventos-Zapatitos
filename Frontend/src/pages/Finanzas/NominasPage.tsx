import { useEffect, useState } from 'react';
import { 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { finanzasService, type NominaEmpleado } from '../../services/finanzasService';

const NominasPage = () => {
  const [nominas, setNominas] = useState<NominaEmpleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadNominas();
  }, []);

  const loadNominas = async () => {
    setLoading(true);
    try {
      const data = await finanzasService.getNominasPendientes();
      setNominas(data);
    } catch (err) {
      console.error('Error al cargar nóminas', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePagar = async (empleadoId: number) => {
    if (!window.confirm('¿Confirmas el pago de esta nómina? Se registrará como un egreso en caja.')) return;
    
    setProcessingId(empleadoId);
    try {
      await finanzasService.pagarNomina(empleadoId);
      await loadNominas();
    } catch (err) {
      console.error('Error al procesar pago', err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="animate-spin text-primary" size={48} />
        <p className="text-slate-500 font-black text-lg uppercase tracking-widest animate-pulse">Calculando pagos pendientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800">Control de Nóminas</h1>
          <p className="text-slate-500 text-sm">Gestiona los pagos pendientes del staff por eventos realizados.</p>
        </div>
        <button 
          onClick={loadNominas}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-lg font-medium text-sm text-slate-700 transition-colors hover:bg-slate-50"
        >
          <RefreshCw size={18} /> Recalcular
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nominas.length > 0 ? (
          nominas.map((n) => (
            <div 
              key={n.empleadoId} 
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                      {n.nombreEmpleado.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-800 text-base">{n.nombreEmpleado}</h3>
                      <p className="text-xs font-medium text-slate-500">Base: ${n.pagoPorEvento} / evento</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
                    <AlertCircle size={14} />
                    {n.eventosPendientes} eventos
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">A Liquidar</span>
                  <span className="text-xl font-bold text-indigo-600">${n.totalAPagar.toLocaleString()}</span>
                </div>
                
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Eventos Pendientes</label>
                  <div className="space-y-2">
                    {n.detalles.map((d, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700">
                        <Calendar size={16} className="text-slate-400" />
                        <span className="flex-1">{d.paquete}</span>
                        <span className="text-slate-500 text-xs">{d.fecha}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <button 
                  className={`
                    w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-colors
                    ${processingId === n.empleadoId ? 'bg-indigo-400 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}
                  `}
                  onClick={() => handlePagar(n.empleadoId)}
                  disabled={processingId === n.empleadoId}
                >
                  {processingId === n.empleadoId ? (
                    <RefreshCw className="animate-spin" size={18} />
                  ) : (
                    <>
                      <DollarSign size={18} />
                      Procesar Pago
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 flex flex-col items-center justify-center space-y-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={32} />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-800">¡Todo al día!</h2>
              <p className="text-slate-500 text-sm mt-1">No hay pagos pendientes para el staff en este momento.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NominasPage;
