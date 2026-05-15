import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Calendar, Clock, Package, Users, Baby,
  CreditCard, RefreshCw,
  ExternalLink, Copy, FileText, Send, Download, Edit3,
  Plus, ChevronRight
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface EventoDetailAdmin {
  id: number;
  estado: string;
  fechaEvento: string;
  horaInicio: string;
  horaFin: string;
  paquete: string;
  paqueteId: number;
  precioTotal: number;
  saldoPendiente: number;
  cantidadNinosEstimada: number;
  origen: string;
  clientes: string[];
  cumpleaneros: { ninoId: number; nombre: string; edadCumplir: number }[];
  items: { nombre: string; cantidad: number; precioUnitario: number; esIncluidoEnPaquete: boolean }[];
  pagos: { id: number; monto: number; estado: string; fechaPago: string; comprobanteUrl?: string; referencia?: string }[];
  invitacionToken?: string;
}

const estadoColors: Record<string, string> = {
  provisional: 'bg-amber-50 text-amber-600 border-amber-100',
  confirmado: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  completado: 'bg-blue-50 text-blue-600 border-blue-100',
  cancelado: 'bg-rose-50 text-rose-600 border-rose-100',
};

const ReservaDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<EventoDetailAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyingPago, setVerifyingPago] = useState<number | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await apiClient.get<EventoDetailAdmin>(`/eventos/${id}/detalle-admin`);
      setData(response.data);
    } catch (err) {
      console.error('Error al cargar detalle', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleVerificarPago = async (pagoId: number, aceptar: boolean) => {
    if (!id) return;
    setVerifyingPago(pagoId);
    try {
      await apiClient.patch(`/eventos/${id}/verificar-pago/${pagoId}?aceptar=${aceptar}`);
      await loadData();
    } finally {
      setVerifyingPago(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Sincronizando Expediente...</p>
      </div>
    );
  }

  if (!data) return <div className="p-12 text-slate-500 text-center">Reserva no encontrada.</div>;

  const estadoClass = estadoColors[data.estado.toLowerCase()] || 'bg-slate-50 text-slate-600 border-slate-200';
  const pagado = data.precioTotal - data.saldoPendiente;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* TOP COMMAND BAR */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/admin/reservas')}
              className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-90"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Expediente <span className="text-primary">#{data.id}</span></h1>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${estadoClass}`}>
                  {data.estado}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Gestión Administrativa y Financiera</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-slate-900/10 active:scale-95">
              <Edit3 size={16} /> Editar Reserva
            </button>
            <button onClick={loadData} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 pt-10 grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: DATOS CONTRACTUALES */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* SECCIÓN 1: CABECERA DE CONTRATO */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/10 transition-colors" />
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paquete Seleccionado</span>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">{data.paquete}</h2>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <Calendar size={18} className="text-primary" />
                    <span className="text-sm font-bold text-slate-700">{new Date(data.fechaEvento).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <Clock size={18} className="text-primary" />
                    <span className="text-sm font-bold text-slate-700">{data.horaInicio} — {data.horaFin}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado de Cuenta</span>
                  <CreditCard size={20} className="text-slate-300" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldo Pendiente</span>
                    <span className={`text-3xl font-black tracking-tighter ${data.saldoPendiente > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      ${data.saldoPendiente.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(pagado / data.precioTotal) * 100}%` }}
                      className="h-full bg-emerald-500"
                    />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 text-right uppercase tracking-widest">{Math.round((pagado / data.precioTotal) * 100)}% de la inversión total recaudada</p>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: PARTES INTERESADAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Users size={20} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Titulares del Contrato</h3>
              </div>
              <div className="space-y-3">
                {data.clientes.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xs font-black text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">{c[0]}</div>
                      <p className="text-sm font-bold text-slate-700">{c}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center">
                  <Baby size={20} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Protagonistas</h3>
              </div>
              <div className="space-y-3">
                {data.cumpleaneros.map((c, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-black text-xs">{c.nombre[0]}</div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{c.nombre}</p>
                      <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Cumple {c.edadCumplir} años</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: DESGLOSE FINANCIERO */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <Package size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Estructura de Costos</h3>
              </div>
              <button className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline flex items-center gap-2">
                <Plus size={14} /> Añadir Servicio
              </button>
            </div>
            
            <div className="divide-y divide-slate-100">
              {data.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-5 group">
                  <div className="flex items-center gap-5">
                    <div className={`w-3 h-3 rounded-full ${item.esIncluidoEnPaquete ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-indigo-400'}`} />
                    <div>
                      <p className="text-sm font-black text-slate-800">{item.nombre}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {item.esIncluidoEnPaquete ? 'Parte del Paquete Core' : 'Servicio Adicional (Extra)'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-400">x{item.cantidad} • ${item.precioUnitario.toLocaleString()}</p>
                    <p className="text-sm font-black text-slate-900">${(item.precioUnitario * item.cantidad).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col items-end space-y-2">
              <div className="flex justify-between w-full md:w-64">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subtotal</span>
                <span className="text-sm font-black text-slate-800">${data.precioTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between w-full md:w-64 pt-2">
                <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">Total Contrato</span>
                <span className="text-2xl font-black text-primary tracking-tighter">${data.precioTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: FLUJO DE DINERO */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* ACCIONES RÁPIDAS */}
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-6 shadow-2xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Documentación</h3>
            <div className="grid gap-3">
              {[
                { label: 'Generar Contrato PDF', icon: FileText },
                { label: 'Enviar Recordatorio Pago', icon: Send },
                { label: 'Descargar Comprobante', icon: Download },
              ].map((action, i) => (
                <button 
                  key={i}
                  className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <action.icon size={16} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{action.label}</span>
                  </div>
                  <ChevronRight size={14} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {/* HISTORIAL DE TRANSACCIONES */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Transacciones</h3>
              <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {data.pagos.length} Movimientos
              </div>
            </div>

            {data.pagos.length === 0 ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto">
                  <CreditCard size={24} />
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">No hay registros de pago</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.pagos.map((pago) => (
                  <div key={pago.id} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4 hover:border-primary/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-lg font-black text-slate-900">${pago.monto.toLocaleString()}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {new Date(pago.fechaPago).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} • {new Date(pago.fechaPago).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                        pago.estado.toLowerCase() === 'verificado' ? 'bg-emerald-100 text-emerald-700' :
                        pago.estado.toLowerCase() === 'rechazado' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {pago.estado}
                      </span>
                    </div>

                    {pago.comprobanteUrl && (
                      <a 
                        href={pago.comprobanteUrl.startsWith('data:') ? pago.comprobanteUrl : '#'} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:underline bg-white p-2 rounded-lg border border-slate-100"
                      >
                        <ExternalLink size={12} /> Ver Comprobante
                      </a>
                    )}

                    {pago.estado.toLowerCase() === 'pendiente' && (
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          onClick={() => handleVerificarPago(pago.id, true)}
                          disabled={verifyingPago === pago.id}
                          className="py-3 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                        >
                          {verifyingPago === pago.id ? '...' : 'Aprobar'}
                        </button>
                        <button
                          onClick={() => handleVerificarPago(pago.id, false)}
                          disabled={verifyingPago === pago.id}
                          className="py-3 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all disabled:opacity-50 shadow-lg shadow-rose-500/20"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HERRAMIENTAS DE MARKETING / COMUNICACIÓN */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 space-y-6">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <ExternalLink size={20} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Portal del Cliente</h3>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Este enlace permite al cliente visualizar su invitación, estado de cuenta y descargar sus fotos del evento.
              </p>
              {data.invitacionToken && (
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/invitacion/${data.invitacionToken}`;
                    navigator.clipboard.writeText(url);
                    toast.success('¡Enlace copiado!');
                  }}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-white hover:border-primary transition-all group"
                >
                  <Copy size={16} className="text-slate-400 group-hover:text-primary" /> Copiar Link de Acceso
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservaDetailPage;
