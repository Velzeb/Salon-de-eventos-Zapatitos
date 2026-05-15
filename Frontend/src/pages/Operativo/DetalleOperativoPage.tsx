import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  CheckCircle2, 
  RefreshCw, 
  Clock,
  Zap,
  Users,
  Save,
  MapPin,
  Copy,
  QrCode,
  Plus,
  Trash2,
  Edit3,
  Printer,
  AlertTriangle
} from 'lucide-react';
import HojaServicioPrint from './components/HojaServicioPrint';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { eventosService } from '../../services/eventosService';
import React from 'react';
import { operativoService, type EventoOperativo } from '../../services/operativoService';
import { paquetesService } from '../../services/paquetesService';
import { empleadosService, type Empleado } from '../../services/empleadosService';
import { toast } from 'sonner';

const DetalleOperativoPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<EventoOperativo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'mision' | 'briefing' | 'cronograma' | 'invitados' | 'staff' | 'finanzas' | 'postfiesta'>('mision');
  
  const [notas, setNotas] = useState('');
  const [savingNotas, setSavingNotas] = useState(false);
  const [updatingEstado, setUpdatingEstado] = useState(false);
  const [verifyingPago, setVerifyingPago] = useState<number | null>(null);
  const [metodosPago, setMetodosPago] = useState<any[]>([]);
  const [registeringPago, setRegisteringPago] = useState(false);
  const [pagoManual, setPagoManual] = useState({
    monto: 0,
    metodoPagoId: undefined as number | undefined,
    referencia: ''
  });
  const [allEmpleados, setAllEmpleados] = useState<Empleado[]>([]);
  const [assigningStaff, setAssigningStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ empleadoId: 0, rol: 'Apoyo' });
  
  // Timers State
  const [runningTimers, setRunningTimers] = useState<Record<number, { startTime: number, duration: number, isActive: boolean }>>({});
  
  // FASE 5 STATES
  const [briefing, setBriefing] = useState({
    tematica: '',
    colorManteleria: '',
    saborPastel: '',
    notasDecoracion: '',
    alergias: ''
  });
  const [savingBriefing, setSavingBriefing] = useState(false);
  
  const [newInvitadoNombre, setNewInvitadoNombre] = useState('');
  const [addingInvitado, setAddingInvitado] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [finalizingEvento, setFinalizingEvento] = useState(false);
  
  // FASE 8 STATES
  const [postFiesta, setPostFiesta] = useState({
    linkGaleriaFotos: '',
    consentimientoMarketing: false,
    fechaProximoContacto: ''
  });
  const [savingPostEvento, setSavingPostEvento] = useState(false);
  const [uploadingMultimedia, setUploadingMultimedia] = useState(false);

  const handleUploadMultimedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || !e.target.files?.length) return;
    setUploadingMultimedia(true);
    try {
      const files = Array.from(e.target.files);
      await operativoService.uploadMultimedia(parseInt(id), files);
      toast.success('Archivos subidos correctamente');
      await loadData();
    } catch (err) {
      toast.error('Error al subir archivos');
    } finally {
      setUploadingMultimedia(false);
    }
  };

  const handleDeleteMultimedia = async (multimediaId: number) => {
    if (!id || !window.confirm('¿Estás seguro de eliminar este archivo?')) return;
    try {
      await operativoService.deleteMultimedia(parseInt(id), multimediaId);
      toast.success('Archivo eliminado');
      await loadData();
    } catch (err) {
      toast.error('Error al eliminar archivo');
    }
  };

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [operativoData, _, metodosData, empleadosData] = await Promise.all([
        operativoService.getEventoOperativo(parseInt(id)),
        paquetesService.getServicios(),
        operativoService.getMetodosPago(),
        empleadosService.getEmpleados()
      ]);
      setData(operativoData);
      setNotas(operativoData.notasAdmin || '');
      setBriefing({
        tematica: operativoData.tematica || '',
        colorManteleria: operativoData.colorManteleria || '',
        saborPastel: operativoData.saborPastel || '',
        notasDecoracion: operativoData.notasDecoracion || '',
        alergias: operativoData.alergias || ''
      });
      setMetodosPago(metodosData);
      setAllEmpleados(empleadosData.filter(e => e.estado === 'Activo'));
      setPostFiesta({
        linkGaleriaFotos: operativoData.linkGaleriaFotos || '',
        consentimientoMarketing: operativoData.consentimientoMarketing || false,
        fechaProximoContacto: operativoData.fechaProximoContacto ? operativoData.fechaProximoContacto.split('T')[0] : ''
      });
    } catch (err: any) {
      console.error('Error al cargar detalle operativo', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBriefing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingBriefing(true);
    try {
      await operativoService.updateBriefing({
        eventoId: parseInt(id),
        ...briefing
      });
      toast.success('Detalles de briefing actualizados');
      await loadData();
    } catch (err) {
      toast.error('Error al guardar briefing');
    } finally {
      setSavingBriefing(false);
    }
  };

  const handleAddInvitado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newInvitadoNombre.trim()) return;
    setAddingInvitado(true);
    try {
      await operativoService.addInvitados(parseInt(id), [newInvitadoNombre.trim()]);
      toast.success('Invitado añadido');
      setNewInvitadoNombre('');
      await loadData();
    } catch (err) {
      toast.error('Error al añadir invitado');
    } finally {
      setAddingInvitado(false);
    }
  };

  const handleManualCheckIn = async (_invitadoId: number, codigoQr: string) => {
    try {
      const msg = await operativoService.registrarIngreso(codigoQr);
      toast.success(msg);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.Errors?.[0] || 'Error en check-in');
    }
  };

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (isScanning) {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
      scanner.render(
        async (decodedText) => {
          try {
            const msg = await operativoService.registrarIngreso(decodedText);
            toast.success(msg);
            setIsScanning(false);
            await loadData();
          } catch (err: any) {
            toast.error(err.response?.data?.Errors?.[0] || 'QR inválido o ya usado');
          }
        },
        () => { /* ignore errors */ }
      );
    }
    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error("Error clearing scanner", e));
      }
    };
  }, [isScanning]);

  useEffect(() => {
    loadData();
  }, [id]);

  const handleCompleteTarea = async (tareaId: number) => {
    try {
      await operativoService.completeTarea(tareaId);
      toast.success('Tarea completada e inventario actualizado');
      await loadData();
    } catch (err) {
      toast.error('Error al actualizar tarea');
    }
  };

  const handleFinalizarEvento = async () => {
    if (!id || !data) return;
    if (data.saldoPendiente > 0) {
      if (!confirm(`El evento tiene un saldo pendiente de $${data.saldoPendiente}. ¿Deseas finalizarlo de todas formas?`)) return;
    } else {
      if (!confirm('¿Estás seguro de finalizar el evento? Esto cerrará todas las operaciones.')) return;
    }
    
    setFinalizingEvento(true);
    try {
      await operativoService.finalizarEvento(parseInt(id));
      toast.success('Evento finalizado correctamente');
      await loadData();
    } catch (err) {
      toast.error('Error al finalizar evento');
    } finally {
      setFinalizingEvento(false);
    }
  };

  const handleAutoCronograma = async () => {
    if (!id || !data) return;
    const confirmAuto = confirm('Se generará un cronograma estándar basado en la duración del evento. Se borrará el actual. ¿Continuar?');
    if (!confirmAuto) return;

    // Lógica local para generar actividades
    const startParts = data.horaInicio.split(':');
    let currentHour = parseInt(startParts[0]);
    let currentMin = parseInt(startParts[1]);

    const addTime = (h: number, m: number, addMin: number) => {
      let total = h * 60 + m + addMin;
      return `${Math.floor(total/60).toString().padStart(2,'0')}:${(total%60).toString().padStart(2,'0')}`;
    };

    const actividades = [
      { nombre: 'Recepción de Invitados', duracion: 30 },
      { nombre: 'Sesión de Juegos Libres', duracion: 45 },
      { nombre: 'Show / Animación Principal', duracion: 60 },
      { nombre: 'Comida de Niños', duracion: 30 },
      { nombre: 'Pastel y Mañanitas', duracion: 20 },
      { nombre: 'Piñata y Dulces', duracion: 25 },
      { nombre: 'Despedida y Entrega de Bolsitas', duracion: 30 }
    ].map((act, i) => {
      const hIni = addTime(currentHour, currentMin, 0);
      const hFin = addTime(currentHour, currentMin, act.duracion);
      const parts = hFin.split(':');
      currentHour = parseInt(parts[0]);
      currentMin = parseInt(parts[1]);
      return {
        nombre: act.nombre,
        horaInicio: hIni,
        horaFin: hFin,
        orden: i + 1,
        completada: false
      };
    });

    try {
      await operativoService.updateCronograma({
        eventoId: parseInt(id),
        actividades
      });
      toast.success('Cronograma automatizado generado');
      await loadData();
    } catch (err) {
      toast.error('Error al generar cronograma');
    }
  };

  const handleSaveNotas = async () => {
    if (!id) return;
    setSavingNotas(true);
    try {
      await operativoService.updateNotas(parseInt(id), notas);
      toast.success('Notas actualizadas');
    } catch (err) {
      toast.error('Error al guardar notas');
    } finally {
      setSavingNotas(false);
    }
  };

  const handleAceptarReserva = async () => {
    if (!id) return;
    setUpdatingEstado(true);
    try {
      await eventosService.updateEstado(parseInt(id), 'Confirmado');
      toast.success('Reserva confirmada');
      await loadData();
    } catch (err) {
      toast.error('Error al aceptar reserva');
    } finally {
      setUpdatingEstado(false);
    }
  };

  const handleVerificarPago = async (pagoId: number) => {
    if (!id) return;
    setVerifyingPago(pagoId);
    try {
      await eventosService.verificarPago(parseInt(id), pagoId);
      toast.success('Pago verificado');
      await loadData();
    } catch (err) {
      toast.error('Error al verificar pago');
    } finally {
      setVerifyingPago(null);
    }
  };

  const handleRegisterPagoManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || pagoManual.monto <= 0) return;
    setRegisteringPago(true);
    try {
      await operativoService.registerPago({
        eventoId: parseInt(id),
        monto: pagoManual.monto,
        metodoPagoId: pagoManual.metodoPagoId,
        referencia: pagoManual.referencia
      });
      toast.success('Pago registrado');
      setPagoManual({ monto: 0, metodoPagoId: undefined, referencia: '' });
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.[0] || 'Error al registrar el pago');
    } finally {
      setRegisteringPago(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newStaff.empleadoId) return;
    setAssigningStaff(true);
    try {
      await operativoService.assignStaff({
        eventoId: parseInt(id),
        empleadoId: newStaff.empleadoId,
        rol: newStaff.rol
      });
      toast.success('Personal asignado');
      setNewStaff({ empleadoId: 0, rol: 'Apoyo' });
      await loadData();
    } catch (err) {
      toast.error('Error al asignar personal');
    } finally {
      setAssigningStaff(false);
    }
  };

  const handleAssignTarea = async (tareaId: number, empleadoId: number) => {
    try {
      await operativoService.assignTarea({ tareaId, empleadoId });
      toast.success('Tarea asignada');
      await loadData();
    } catch (err) {
      toast.error('Error al asignar tarea');
    }
  };

  const handleSavePostEvento = async (cerrarDefinitivamente = false) => {
    if (!id) return;
    setSavingPostEvento(true);
    try {
      await operativoService.updatePostEvento({
        eventoId: parseInt(id),
        ...postFiesta,
        cerrarDefinitivamente
      });
      toast.success(cerrarDefinitivamente ? 'Evento archivado definitivamente' : 'Datos post-fiesta guardados');
      await loadData();
    } catch (err) {
      toast.error('Error al guardar datos post-fiesta');
    } finally {
      setSavingPostEvento(false);
    }
  };

  const handleShareFotos = () => {
    if (!data?.linkGaleriaFotos) return;
    const msg = `¡Hola! Aquí tienes el enlace a las fotos de la fiesta en Zapatitos: ${data.linkGaleriaFotos}. ¡Esperamos que las disfruten!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleShareReviewRequest = () => {
    const msg = `¡Hola! Nos encantó tenerte en Zapatitos. ¿Podrías ayudarnos con una reseña en Google? Significaría mucho para nosotros: https://g.page/r/zapatitos-salon/review`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const toggleTimer = (itemId: number, durationMinutes: number) => {
    setRunningTimers(prev => {
      const current = prev[itemId];
      if (current?.isActive) return { ...prev, [itemId]: { ...current, isActive: false } };
      return { 
        ...prev, 
        [itemId]: { startTime: Date.now(), duration: durationMinutes * 60 * 1000, isActive: true } 
      };
    });
  };

  if (loading || !data) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <RefreshCw className="animate-spin text-slate-300" size={32} />
      </div>
    );
  }

  const progreso = data.tareas.length > 0 ? (data.tareas.filter(t => t.estado === 'Completada').length / data.tareas.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/operativo')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <ChevronLeft size={20} />
            </button>
            <div className="h-6 w-[1px] bg-slate-200 mx-1" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-slate-900">{data.paqueteNombre}</h1>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${data.estado.toLowerCase() === 'confirmado' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {data.estado}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Evento #{data.eventoId} • {new Date(data.fechaEvento).toLocaleDateString()}</p>
            </div>
          </div>
            <div className="flex items-center gap-3">
            {data.estado.toLowerCase() === 'provisional' && (
              <button onClick={handleAceptarReserva} disabled={updatingEstado} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all">
                {updatingEstado ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                Confirmar Reserva
              </button>
            )}
            {data.estado.toLowerCase() !== 'completado' && data.estado.toLowerCase() !== 'provisional' && (
              <button onClick={handleFinalizarEvento} disabled={finalizingEvento} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-200">
                {finalizingEvento ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                Finalizar Evento
              </button>
            )}
            <button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all">
              <Printer size={16} />
              Imprimir Hoja
            </button>
            <button onClick={() => navigate(`/admin/reservas/nueva`, { state: { editEventoId: data.eventoId } })} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all">
              Editar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-8">
        
        {/* SIDEBAR */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Detalles del Evento</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-500"><Clock size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Horario</p>
                  <p className="text-sm font-semibold text-slate-900">{data.horaInicio} - {data.horaFin}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-500"><MapPin size={18} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Lugar</p>
                  <p className="text-sm font-semibold text-slate-900">Salón Principal</p>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-xs font-medium text-slate-500">Progreso Operativo</span>
                 <span className="text-xs font-bold text-slate-900">{Math.round(progreso)}%</span>
               </div>
               <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                 <motion.div initial={{ width: 0 }} animate={{ width: `${progreso}%` }} className="h-full bg-blue-600 rounded-full" />
               </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contactos Clave</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users size={12} /> Responsables</p>
                 {data.clientes.map((c, i) => <p key={i} className="text-sm font-semibold text-slate-800">{c}</p>)}
              </div>
              <div className="space-y-3">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap size={12} className="text-amber-500" /> Cumpleañeros</p>
                 <div className="grid gap-2">
                   {data.protagonistas.map((p, i) => (
                     <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800">{p.nombre}</span>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Cumple {p.edadCumplir}</span>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-6 shadow-lg">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Portal del Cliente</h3>
             <p className="text-xs text-slate-400 mb-4 leading-relaxed">Gestión de invitación y pagos para el cliente.</p>
             {data.invitacionToken ? (
               <button 
                 onClick={() => {
                   navigator.clipboard.writeText(`${window.location.origin}/invitacion/${data.invitacionToken}`);
                   toast.success('Link copiado');
                 }}
                 className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
               >
                 <Copy size={14} /> Copiar Enlace
               </button>
             ) : (
               <div className="py-2.5 bg-slate-800 text-slate-500 text-[10px] font-bold text-center rounded-lg">No disponible</div>
             )}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="flex items-center border-b border-slate-200 overflow-x-auto no-scrollbar">
            {[
              { id: 'mision', label: 'Operación' },
              { id: 'briefing', label: 'Briefing' },
              { id: 'cronograma', label: 'Cronograma' },
              { id: 'invitados', label: 'Invitados' },
              { id: 'staff', label: 'Personal' },
              { id: 'finanzas', label: 'Finanzas' },
              { id: 'postfiesta', label: 'Post-Fiesta' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 -mb-[2px] ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-[600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {activeTab === 'mision' && (
                  <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                       <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                          <h3 className="text-sm font-bold text-slate-700">Servicios Temporizados</h3>
                       </div>
                       <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {data.items.filter(i => i.tipo === 'Servicio').map(item => {
                            const timer = runningTimers[item.id];
                            return (
                              <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                 <div>
                                    <p className="text-sm font-bold text-slate-800">{item.nombre}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">2 Horas</p>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    {timer?.isActive && <div className="text-xl font-mono font-black text-blue-600 animate-pulse">{Math.max(0, Math.floor((timer.startTime + timer.duration - Date.now()) / 60000))}m</div>}
                                    <button onClick={() => toggleTimer(item.id, 120)} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${timer?.isActive ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{timer?.isActive ? 'Detener' : 'Iniciar'}</button>
                                 </div>
                              </div>
                            );
                          })}
                       </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                       <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50"><h3 className="text-sm font-bold text-slate-700">Checklist Operativo</h3></div>
                       <div className="divide-y divide-slate-100">
                          {data.tareas.map(tarea => (
                            <div key={tarea.id} className="p-4 flex items-center gap-4 hover:bg-slate-50">
                               <button disabled={tarea.estado === 'Completada'} onClick={() => handleCompleteTarea(tarea.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${tarea.estado === 'Completada' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent'}`}><CheckCircle2 size={14} /></button>
                               <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className={`text-sm font-medium ${tarea.estado === 'Completada' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{tarea.nombre}</p>
                                    {tarea.articuloId && (
                                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded flex items-center gap-1 ${tarea.stockDescontado ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {tarea.stockDescontado ? 'Stock Descontado' : `Requiere ${tarea.cantidadRequerida} unidades`}
                                        {!tarea.stockDescontado && (
                                          <div className="flex items-center gap-1 text-rose-600 ml-1 bg-rose-50 px-1 rounded">
                                            <AlertTriangle size={10} />
                                            <span>Verificar Stock</span>
                                          </div>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  {tarea.asignadoA ? <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{tarea.asignadoA}</p> : (
                                    <select className="text-[10px] border border-slate-200 rounded px-1 mt-1 outline-none" onChange={(e) => handleAssignTarea(tarea.id, parseInt(e.target.value))}>
                                      <option value="">Asignar...</option>
                                      {allEmpleados.map(e => <option key={e.id} value={e.id}>{e.nombreCompleto}</option>)}
                                    </select>
                                  )}
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                       <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                          <h3 className="text-sm font-bold text-slate-700">Reporte del Evento</h3>
                          <button onClick={handleSaveNotas} disabled={savingNotas} className="text-blue-600 text-xs font-bold flex items-center gap-1">{savingNotas ? <RefreshCw className="animate-spin" size={12} /> : <Save size={12} />}Guardar</button>
                       </div>
                       <div className="p-6"><textarea className="w-full h-40 bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 outline-none" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas del evento..." /></div>
                    </div>
                  </div>
                )}

                {activeTab === 'briefing' && (
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-700">Personalización</h3>
                      <button onClick={handleSaveBriefing} disabled={savingBriefing} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">{savingBriefing ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}Guardar</button>
                    </div>
                    <form className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSaveBriefing}>
                      <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Temática</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none" value={briefing.tematica} onChange={e => setBriefing({...briefing, tematica: e.target.value})} /></div>
                      <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Mantelería</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none" value={briefing.colorManteleria} onChange={e => setBriefing({...briefing, colorManteleria: e.target.value})} /></div>
                      <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Pastel</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none" value={briefing.saborPastel} onChange={e => setBriefing({...briefing, saborPastel: e.target.value})} /></div>
                      <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Alergias</label><input type="text" className="w-full bg-slate-50 border border-rose-100 rounded-lg px-4 py-2 text-sm outline-none" value={briefing.alergias} onChange={e => setBriefing({...briefing, alergias: e.target.value})} /></div>
                      <div className="col-span-2 space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Decoración</label><textarea className="w-full h-32 bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm outline-none" value={briefing.notasDecoracion} onChange={e => setBriefing({...briefing, notasDecoracion: e.target.value})} /></div>
                    </form>
                  </div>
                )}

                {activeTab === 'cronograma' && (
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                       <h3 className="text-sm font-bold text-slate-700">Agenda</h3>
                       <div className="flex gap-2">
                        <button onClick={handleAutoCronograma} className="text-emerald-600 text-xs font-bold flex items-center gap-1 hover:bg-emerald-50 px-2 py-1 rounded"><Zap size={14} /> Auto-generar</button>
                        <button className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded"><Plus size={14} /> Añadir</button>
                       </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                       {data.cronograma.map(act => (
                         <div key={act.id} className="p-4 flex items-center gap-6 hover:bg-slate-50">
                            <div className="text-center w-16"><p className="text-xs font-black text-blue-600">{act.horaInicio}</p><p className="text-[10px] font-bold text-slate-400">{act.horaFin}</p></div>
                            <div className="flex-1"><p className="text-sm font-bold text-slate-800">{act.nombre}</p><p className="text-xs text-slate-500">{act.descripcion}</p></div>
                            <div className="flex items-center gap-2"><button className="p-1 text-slate-400"><Edit3 size={14} /></button><button className="p-1 text-slate-400"><Trash2 size={14} /></button></div>
                         </div>
                       ))}
                       {data.cronograma.length === 0 && <div className="p-12 text-center text-slate-400 italic text-sm">Cronograma no definido.</div>}
                    </div>
                  </div>
                )}

                {activeTab === 'invitados' && (
                  <div className="space-y-6">
                    {isScanning && (
                      <div className="bg-slate-900 rounded-xl p-6 mb-6">
                         <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-white flex items-center gap-2"><QrCode size={18} className="text-blue-400" /> Escáner</h3><button onClick={() => setIsScanning(false)} className="text-slate-400 text-xs font-bold underline">Cerrar</button></div>
                         <div id="reader" className="mx-auto max-w-sm rounded-lg overflow-hidden" />
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                          <h3 className="text-sm font-bold text-slate-700 mb-4">Registro Rápido</h3>
                          <form className="flex gap-3" onSubmit={handleAddInvitado}><input type="text" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none" placeholder="Nombre..." value={newInvitadoNombre} onChange={e => setNewInvitadoNombre(e.target.value)} /><button type="submit" disabled={addingInvitado} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold">{addingInvitado ? <RefreshCw className="animate-spin" size={16} /> : 'Añadir'}</button></form>
                       </div>
                       <div className="bg-blue-600 rounded-xl p-6 shadow-lg text-white flex items-center justify-between">
                          <div><p className="text-[10px] font-bold text-blue-100 uppercase mb-1">Total Invitados</p><p className="text-3xl font-black">{data.invitados.length} <span className="text-sm font-medium text-blue-200">/ {data.invitados.filter(i => i.ingreso).length} en salón</span></p></div>
                          {!isScanning && <button onClick={() => setIsScanning(true)} className="bg-white text-blue-600 p-3 rounded-xl hover:scale-105 transition-all"><QrCode size={24} /></button>}
                       </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                       <table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b border-slate-100"><tr><th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Invitado</th><th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Estado</th><th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Acción</th></tr></thead><tbody className="divide-y divide-slate-100">
                          {data.invitados.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-slate-100 rounded text-slate-500 cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Ver QR" onClick={() => window.open(`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${inv.codigoQr}`, '_blank')}>
                                    <QrCode size={14} />
                                  </div>
                                  <span className="font-semibold text-slate-800">{inv.nombre}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <span className={`px-2 py-1 text-[10px] font-black uppercase rounded ${inv.ingreso ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                    {inv.ingreso ? 'Dentro' : 'Ausente'}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 {!inv.ingreso ? (
                                   <button onClick={() => handleManualCheckIn(inv.id, inv.codigoQr)} className="text-blue-600 hover:underline font-bold">Check-in</button>
                                 ) : (
                                   <span className="text-[10px] text-slate-400">{inv.fechaIngreso ? new Date(inv.fechaIngreso).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--'}</span>
                                 )}
                              </td>
                            </tr>
                          ))}
                       </tbody></table>
                    </div>
                  </div>
                )}

                {activeTab === 'staff' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                       <h3 className="text-sm font-bold text-slate-700 mb-4">Asignar Personal</h3>
                       <form className="flex gap-4" onSubmit={handleAssignStaff}>
                          <select className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newStaff.empleadoId} onChange={e => setNewStaff({...newStaff, empleadoId: parseInt(e.target.value)})}>
                             <option value="">Empleado...</option>
                             {allEmpleados.map(e => <option key={e.id} value={e.id}>{e.nombreCompleto}</option>)}
                          </select>
                          <input type="text" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Rol..." value={newStaff.rol} onChange={e => setNewStaff({...newStaff, rol: e.target.value})} />
                          <button type="submit" disabled={assigningStaff} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold">{assigningStaff ? <RefreshCw className="animate-spin" size={16} /> : 'Asignar'}</button>
                       </form>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                       <table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b border-slate-100"><tr><th className="px-6 py-3 font-bold text-slate-500 uppercase">Nombre</th><th className="px-6 py-3 font-bold text-slate-500 uppercase">Rol</th><th className="px-6 py-3 font-bold text-slate-500 uppercase">Estado</th></tr></thead><tbody className="divide-y divide-slate-100">
                          {data.staff.map(member => (
                            <tr key={member.id} className="hover:bg-slate-50"><td className="px-6 py-4 font-semibold text-slate-800">{member.nombre}</td><td className="px-6 py-4 text-slate-600">{member.rol}</td><td className="px-6 py-4"><span className={`px-2 py-1 text-[10px] font-bold rounded ${member.esPagado ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{member.esPagado ? 'Liquidado' : 'Asignado'}</span></td></tr>
                          ))}
                       </tbody></table>
                    </div>
                  </div>
                )}

                {activeTab === 'finanzas' && (
                  <div className="space-y-6">
                    {/* Tarjetas de Resumen Financiero */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap size={40} className="text-slate-900" />
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total de Venta</p>
                          <p className="text-3xl font-black text-slate-900">${data.precioTotal.toLocaleString()}</p>
                          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-400">
                             <CheckCircle2 size={10} /> Incluye extras y consumos
                          </div>
                       </div>
                       <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CheckCircle2 size={40} className="text-emerald-600" />
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-emerald-600">Monto Recaudado</p>
                          <p className="text-3xl font-black text-emerald-600">${(data.precioTotal - data.saldoPendiente).toLocaleString()}</p>
                          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                             <RefreshCw size={10} /> {Math.round(((data.precioTotal - data.saldoPendiente) / data.precioTotal) * 100)}% Completado
                          </div>
                       </div>
                       <div className={`p-6 rounded-2xl shadow-sm relative overflow-hidden group border transition-all ${data.saldoPendiente > 0 ? 'bg-white border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <AlertTriangle size={40} className={data.saldoPendiente > 0 ? 'text-rose-600' : 'text-emerald-600'} />
                          </div>
                          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${data.saldoPendiente > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                            {data.saldoPendiente > 0 ? 'Saldo por Cobrar' : 'Estado de Cuenta'}
                          </p>
                          <p className={`text-3xl font-black ${data.saldoPendiente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {data.saldoPendiente > 0 ? `$${data.saldoPendiente.toLocaleString()}` : 'LIQUIDADO'}
                          </p>
                          <div className={`mt-2 flex items-center gap-1 text-[10px] font-bold ${data.saldoPendiente > 0 ? 'text-rose-400' : 'text-emerald-500'}`}>
                             {data.saldoPendiente > 0 ? 'Requiere gestión inmediata' : '¡Excelente! Todo pagado'}
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                       {/* Formulario de Registro */}
                       <div className="lg:col-span-4 space-y-6">
                          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                               <Plus size={14} className="text-blue-600" /> Registrar Nuevo Pago
                             </h3>
                             <form className="space-y-4" onSubmit={handleRegisterPagoManual}>
                                <div className="space-y-1">
                                   <label className="text-[10px] font-bold text-slate-500 uppercase">Monto a Ingresar</label>
                                   <div className="relative">
                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                      <input 
                                         type="number" 
                                         className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-all" 
                                         placeholder="0.00"
                                         value={pagoManual.monto || ''} 
                                         onChange={e => setPagoManual({...pagoManual, monto: parseFloat(e.target.value)})} 
                                         required 
                                      />
                                   </div>
                                </div>
                                <div className="space-y-1">
                                   <label className="text-[10px] font-bold text-slate-500 uppercase">Método de Pago</label>
                                   <select 
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 transition-all" 
                                      value={pagoManual.metodoPagoId || ""} 
                                      onChange={e => setPagoManual({...pagoManual, metodoPagoId: e.target.value ? parseInt(e.target.value) : undefined})}
                                      required
                                   >
                                      <option value="">Seleccionar método...</option>
                                      {metodosPago.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                   </select>
                                </div>
                                <div className="space-y-1">
                                   <label className="text-[10px] font-bold text-slate-500 uppercase">Referencia / Nota</label>
                                   <input 
                                      type="text" 
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 transition-all" 
                                      placeholder="Ej: Transferencia #1234"
                                      value={pagoManual.referencia}
                                      onChange={e => setPagoManual({...pagoManual, referencia: e.target.value})}
                                   />
                                </div>
                                <button 
                                   type="submit" 
                                   disabled={registeringPago || data.saldoPendiente <= 0} 
                                   className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-slate-200 mt-2"
                                >
                                   {registeringPago ? <RefreshCw className="animate-spin mx-auto" size={18} /> : 'Confirmar y Registrar'}
                                </button>
                             </form>
                          </div>
                       </div>

                       {/* Historial de Transacciones */}
                       <div className="lg:col-span-8">
                          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historial de Transacciones</h3>
                                <span className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-1 rounded-full text-slate-500">
                                   {data.pagos.length} Movimientos
                                </span>
                             </div>
                             <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                   <thead className="bg-slate-50/50 border-b border-slate-100">
                                      <tr>
                                         <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">Detalle</th>
                                         <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">Monto</th>
                                         <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase text-center">Estado</th>
                                         <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase text-right">Acción</th>
                                      </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-100">
                                      {data.pagos.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                          <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800">{p.referencia || 'Pago de Evento'}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(p.fechaPago).toLocaleDateString('es-ES', { day:'2-digit', month:'long', year:'numeric' })}</p>
                                          </td>
                                          <td className="px-6 py-4">
                                            <span className="text-sm font-black text-slate-900">${p.monto.toLocaleString()}</span>
                                          </td>
                                          <td className="px-6 py-4 text-center">
                                             <span className={`px-2 py-1 text-[9px] font-black uppercase rounded-full ${
                                               p.estado.toLowerCase() === 'confirmado' ? 'bg-emerald-100 text-emerald-700' : 
                                               p.estado.toLowerCase() === 'pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                             }`}>
                                                {p.estado}
                                             </span>
                                          </td>
                                          <td className="px-6 py-4 text-right">
                                             {p.estado.toLowerCase() === 'pendiente' && (
                                               <button 
                                                 onClick={() => handleVerificarPago(p.id)} 
                                                 disabled={verifyingPago === p.id} 
                                                 className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                 title="Confirmar recepción de fondos"
                                               >
                                                 {verifyingPago === p.id ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={18} />}
                                               </button>
                                             )}
                                          </td>
                                        </tr>
                                      ))}
                                      {data.pagos.length === 0 && (
                                        <tr>
                                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic text-sm">No se han registrado pagos para este evento.</td>
                                        </tr>
                                      )}
                                   </tbody>
                                </table>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'postfiesta' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                       <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                               <Users size={18} />
                             </div>
                             <h3 className="text-sm font-bold text-slate-700">Fidelización y Marketing</h3>
                          </div>
                          <button onClick={() => handleSavePostEvento(false)} disabled={savingPostEvento} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-100 transition-all">
                            {savingPostEvento ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                            Guardar Preferencias
                          </button>
                       </div>
                       <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Link de Galería Externa (Drive/iCloud)</label>
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-all" 
                                    placeholder="https://..." 
                                    value={postFiesta.linkGaleriaFotos} 
                                    onChange={e => setPostFiesta({...postFiesta, linkGaleriaFotos: e.target.value})} 
                                  />
                                  {postFiesta.linkGaleriaFotos && (
                                    <button onClick={handleShareFotos} className="bg-emerald-500 text-white px-4 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100">
                                      <Zap size={18} />
                                    </button>
                                  )}
                                </div>
                             </div>
                             <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 flex items-center justify-between group">
                                <div className="flex-1 pr-4">
                                   <p className="text-xs font-bold text-blue-900 mb-1">Solicitar Reseña en Google</p>
                                   <p className="text-[10px] text-blue-600 leading-relaxed font-medium">Envía el link directo de satisfacción para potenciar el SEO de Zapatitos.</p>
                                </div>
                                <button onClick={handleShareReviewRequest} className="bg-white text-blue-600 p-3 rounded-xl border border-blue-200 hover:scale-105 transition-all shadow-sm">
                                  <Plus size={18} />
                                </button>
                             </div>
                          </div>

                          <div className="space-y-6">
                             <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200 group hover:border-emerald-200 transition-all">
                                <div>
                                   <p className="text-xs font-bold text-slate-900 mb-1">Consentimiento de Marketing</p>
                                   <p className="text-[10px] text-slate-500 font-medium">Autorizado para publicaciones en Instagram/TikTok</p>
                                </div>
                                <button 
                                   onClick={() => setPostFiesta({...postFiesta, consentimientoMarketing: !postFiesta.consentimientoMarketing})}
                                   className={`w-12 h-6 rounded-full transition-all relative ${postFiesta.consentimientoMarketing ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${postFiesta.consentimientoMarketing ? 'left-7' : 'left-1'}`} />
                                </button>
                             </div>

                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                  <Clock size={12} className="text-blue-500" /> Próximo Contacto Estratégico
                                </label>
                                <input 
                                   type="date" 
                                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-all" 
                                   value={postFiesta.fechaProximoContacto} 
                                   onChange={e => setPostFiesta({...postFiesta, fechaProximoContacto: e.target.value})} 
                                />
                                <p className="text-[9px] text-slate-400 font-medium px-1">Sugerido: 11 meses después de esta fecha.</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-100">
                                <Zap size={18} />
                              </div>
                              <div>
                                 <h3 className="text-sm font-bold text-slate-800">Galería de Recuerdos</h3>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cloudflare R2 Storage</p>
                              </div>
                           </div>
                           <label className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-slate-200">
                              {uploadingMultimedia ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} />}
                              {uploadingMultimedia ? 'Procesando...' : 'Añadir Multimedia'}
                              <input type="file" multiple className="hidden" onChange={handleUploadMultimedia} disabled={uploadingMultimedia} accept="image/*,video/*" />
                           </label>
                        </div>
                        <div className="p-6">
                           {data.galeriaMultimedia && data.galeriaMultimedia.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                 {data.galeriaMultimedia.map(item => (
                                    <div key={item.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm hover:shadow-md transition-all">
                                       {item.tipoArchivo === 'Video' ? (
                                         <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                            <Zap size={24} className="text-white opacity-50" />
                                            <video src={item.url} className="absolute inset-0 w-full h-full object-cover opacity-60" muted />
                                         </div>
                                       ) : (
                                         <img src={item.url} alt={item.nombreArchivo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                       )}
                                       
                                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                          <div className="flex justify-end">
                                             <button 
                                                onClick={() => handleDeleteMultimedia(item.id)}
                                                className="p-2 bg-rose-500/90 text-white rounded-lg hover:bg-rose-600 transition-colors shadow-lg"
                                             >
                                                <Trash2 size={14} />
                                             </button>
                                          </div>
                                          <div className="flex justify-between items-end">
                                             <a href={item.url} target="_blank" rel="noreferrer" className="p-2 bg-white/20 backdrop-blur-md text-white rounded-lg hover:bg-white/30 transition-colors">
                                                <Copy size={14} />
                                             </a>
                                             <span className="text-[10px] font-bold text-white/80 bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                                {item.tipoArchivo}
                                             </span>
                                          </div>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           ) : (
                              <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                                 <p className="text-sm text-slate-400 font-medium">No hay fotos ni videos nativos aún.</p>
                                 <p className="text-[10px] text-slate-400">Sube contenido para que el cliente lo vea en su portal.</p>
                              </div>
                           )}
                        </div>
                    </div>

                    {/* ACCIÓN FINAL DE CIERRE */}
                    <div className="bg-emerald-600 rounded-3xl p-8 shadow-xl shadow-emerald-100 flex flex-col md:flex-row items-center justify-between gap-6">
                       <div className="text-center md:text-left">
                          <h3 className="text-2xl font-black text-white mb-2 italic">¿Misión Cumplida?</h3>
                          <p className="text-emerald-100 text-sm max-w-md font-medium leading-relaxed">
                             Al finalizar el evento, el balance se cerrará definitivamente y se activarán los recordatorios de marketing. Asegúrate de que todos los cobros estén registrados.
                          </p>
                       </div>
                       <button 
                          onClick={handleFinalizarEvento}
                          disabled={finalizingEvento || data.estado.toLowerCase() === 'completado'}
                          className="bg-white text-emerald-700 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-emerald-50 transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-3 disabled:bg-emerald-400 disabled:text-emerald-200"
                       >
                          {finalizingEvento ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                          Finalizar y Cerrar Evento
                       </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* VIEW ONLY FOR PRINTING */}
      <HojaServicioPrint data={data} />
    </div>
  );
};

export default DetalleOperativoPage;
