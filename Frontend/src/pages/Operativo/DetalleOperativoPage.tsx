import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, RefreshCw, AlertTriangle, CheckCircle2, XCircle,
  Info, ListChecks, Play, Users, DollarSign, Folder, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventosService } from '../../services/eventosService';
import { operativoService, type EventoOperativo, type ActividadCronogramaDto, type TareaOperativa } from '../../services/operativoService';
import { empleadosService, type Empleado } from '../../services/empleadosService';
import { finanzasService } from '../../services/finanzasService';
import { toast } from 'sonner';

import ResumenTab from './components/ResumenTab';
import PreparacionTab from './components/PreparacionTab';
import DuranteFiestaTab from './components/DuranteFiestaTab';
import PagosTab from './components/PagosTab';
import CierreTab from './components/CierreTab';
import HojaServicioPrint from './components/HojaServicioPrint';
import ContratoPrint from './components/ContratoPrint';

const DetalleOperativoPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<EventoOperativo | null>(null);
  const [loading, setLoading] = useState(true);
  const [allEmpleados, setAllEmpleados] = useState<Empleado[]>([]);
  const [metodosPago, setMetodosPago] = useState<any[]>([]);

  // Tab navigation states
  const [activeTab, setActiveTab] = useState('resumen');
  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const hasInitializedTab = useRef(false);
  const contratoRef = useRef<HTMLDivElement>(null);

  // State flags
  const [updatingEstado, setUpdatingEstado] = useState(false);
  const [runningTimers, setRunningTimers] = useState<Record<number, { startTime: number; duration: number; isActive: boolean }>>({});
  const [postFiesta, setPostFiesta] = useState({ linkGaleriaFotos: '', consentimientoMarketing: false, fechaProximoContacto: '' });
  const [isSavingPostFiesta, setIsSavingPostFiesta] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Tab-specific states
  const [notas, setNotas] = useState('');
  const [savingNotas, setSavingNotas] = useState(false);

  const [preferencias, setPreferencias] = useState({ tematica: '', notasDecoracion: '' });
  const [savingPreferencias, setSavingPreferencias] = useState(false);

  const [savingCronograma, setSavingCronograma] = useState(false);

  const [registeringPago, setRegisteringPago] = useState(false);
  const [verifyingPago, setVerifyingPago] = useState<number | null>(null);
  const [pagoManual, setPagoManual] = useState<{ monto: number; metodoPagoId?: number; referencia: string }>({
    monto: 0,
    metodoPagoId: undefined,
    referencia: ''
  });

  const [newStaff, setNewStaff] = useState({ empleadoId: 0, rol: 'Apoyo' });
  const [assigningStaff, setAssigningStaff] = useState(false);

  const [printMode, setPrintMode] = useState<'hoja' | 'contrato' | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [operativoData, empleadosData, metodosData] = await Promise.all([
        operativoService.getEventoOperativo(parseInt(id)),
        empleadosService.getEmpleados(),
        operativoService.getMetodosPago()
      ]);
      setData(operativoData);
      setAllEmpleados(empleadosData);
      setMetodosPago(metodosData);
      setNotas(operativoData.notasAdmin || '');
      setPreferencias({
        tematica: operativoData.tematica || '',
        notasDecoracion: operativoData.notasDecoracion || ''
      });
      setPostFiesta({ 
        linkGaleriaFotos: operativoData.linkGaleriaFotos || '', 
        consentimientoMarketing: operativoData.consentimientoMarketing || false, 
        fechaProximoContacto: operativoData.fechaProximoContacto || '' 
      });

      if (!hasInitializedTab.current) {
        const estado = operativoData.estado.toLowerCase();
        if (estado === 'provisional') {
          setActiveTab('resumen');
        } else if (estado === 'confirmado') {
          setActiveTab('preparacion');
        } else if (estado === 'encurso') {
          setActiveTab('durantefiesta');
        } else if (estado === 'finalizado' || estado === 'terminado') {
          setActiveTab('cierre');
        }
        hasInitializedTab.current = true;
      }
    } catch (error) {
      toast.error('Error al cargar la información del evento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleStateChange = async (newState: string) => {
    if (!data) return;
    setUpdatingEstado(true);
    try {
      await eventosService.updateEstado(data.eventoId, newState);
      toast.success(`Evento movido a: ${newState}`);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.Errors?.[0] || 'Error al cambiar estado');
    } finally {
      setUpdatingEstado(false);
    }
  };

  const handleCancelEvento = async () => {
    if (!data || !window.confirm('¿Seguro que deseas cancelar este evento?')) return;
    setUpdatingEstado(true);
    try {
      await eventosService.updateEstado(data.eventoId, 'Cancelado');
      toast.success('Evento cancelado exitosamente');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.Errors?.[0] || 'Error al cancelar');
    } finally {
      setUpdatingEstado(false);
    }
  };

  const handleSaveNotas = async () => {
    if (!data) return;
    setSavingNotas(true);
    try {
      await operativoService.updateNotas(data.eventoId, notas);
      toast.success('Notas operativas guardadas');
      await loadData();
    } catch {
      toast.error('Error al guardar notas');
    } finally {
      setSavingNotas(false);
    }
  };

  const handleSavePreferencias = async () => {
    if (!data) return;
    setSavingPreferencias(true);
    try {
      await operativoService.updateBriefing({
        eventoId: data.eventoId,
        tematica: preferencias.tematica,
        notasDecoracion: preferencias.notasDecoracion
      });
      toast.success('Notas de montaje guardadas');
      await loadData();
    } catch {
      toast.error('Error al guardar notas de montaje');
    } finally {
      setSavingPreferencias(false);
    }
  };

  const handleSaveCronograma = async (actividades: Partial<ActividadCronogramaDto>[], msg?: string) => {
    if (!data) return;
    setSavingCronograma(true);
    try {
      await operativoService.updateCronograma({
        eventoId: data.eventoId,
        actividades
      });
      toast.success(msg || 'Cronograma actualizado');
      await loadData();
    } catch {
      toast.error('Error al guardar cronograma');
    } finally {
      setSavingCronograma(false);
    }
  };

  const handleAutoCronograma = async () => {
    if (!data) return;
    setSavingCronograma(true);
    try {
      const [hIni, mIni] = data.horaInicio.split(':').map(Number);
      const [hFin, mFin] = data.horaFin.split(':').map(Number);
      
      const startMinutes = hIni * 60 + mIni;
      const endMinutes = hFin * 60 + mFin;
      const totalDuration = endMinutes - startMinutes;
      
      if (totalDuration <= 0) {
        toast.error('La hora de inicio debe ser anterior a la hora de fin');
        return;
      }
      
      const activitiesDef = [
        { nombre: 'Recepción', descripcion: 'Recibimiento de invitados y entrega de regalos', porcentaje: 0.15 },
        { nombre: 'Juegos', descripcion: 'Dinámicas, inflables y juegos organizados', porcentaje: 0.30 },
        { nombre: 'Comida', descripcion: 'Servicio de alimentos para niños y adultos', porcentaje: 0.20 },
        { nombre: 'Piñata', descripcion: 'Canto de piñata y recolección de dulces', porcentaje: 0.15 },
        { nombre: 'Pastel', descripcion: 'Las mañanitas, soplada de vela y reparto de pastel', porcentaje: 0.20 },
      ];
      
      let currentStart = startMinutes;
      const actividades = activitiesDef.map((def, idx) => {
        const duration = Math.round(totalDuration * def.porcentaje);
        const currentEnd = idx === activitiesDef.length - 1 ? endMinutes : currentStart + duration;
        
        const formatTime = (min: number) => {
          const h = Math.floor(min / 60) % 24;
          const m = min % 60;
          return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        };
        
        const act = {
          nombre: def.nombre,
          descripcion: def.descripcion,
          horaInicio: formatTime(currentStart),
          horaFin: formatTime(currentEnd),
          orden: idx + 1,
          completada: false
        };
        
        currentStart = currentEnd;
        return act;
      });
      
      await operativoService.updateCronograma({
        eventoId: data.eventoId,
        actividades
      });
      
      toast.success('Cronograma auto-generado proporcionalmente');
      await loadData();
    } catch (error) {
      toast.error('Error al auto-generar cronograma');
    } finally {
      setSavingCronograma(false);
    }
  };

  const handleRegisterPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || pagoManual.monto <= 0) return;
    setRegisteringPago(true);
    try {
      await operativoService.registerPago({
        eventoId: data.eventoId,
        monto: pagoManual.monto,
        metodoPagoId: pagoManual.metodoPagoId,
        referencia: pagoManual.referencia
      });
      toast.success('Pago registrado correctamente');
      setPagoManual({ monto: 0, metodoPagoId: undefined, referencia: '' });
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.Errors?.[0] || 'Error al registrar el pago');
    } finally {
      setRegisteringPago(false);
    }
  };

  const handleVerificarPago = async (pagoId: number) => {
    setVerifyingPago(pagoId);
    try {
      await operativoService.verifyPago(pagoId);
      toast.success('Pago verificado exitosamente');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.Errors?.[0] || 'Error al verificar el pago');
    } finally {
      setVerifyingPago(null);
    }
  };

  const handleUploadMultimedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!data || !files?.length) return;
    setIsUploading(true);
    try {
      await operativoService.uploadMultimedia(data.eventoId, Array.from(files));
      toast.success('Archivos subidos exitosamente');
      await loadData();
    } catch {
      toast.error('Error al subir archivos');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMultimedia = async (id: number) => {
    if (!data || !window.confirm('¿Seguro que deseas eliminar esta evidencia?')) return;
    try {
      await operativoService.deleteMultimedia(data.eventoId, id);
      toast.success('Evidencia eliminada');
      await loadData();
    } catch {
      toast.error('Error al eliminar evidencia');
    }
  };

  const handlePrintHoja = () => {
    setPrintMode('hoja');
    setTimeout(() => {
      window.print();
      setPrintMode(null);
    }, 150);
  };

  const handlePrintContrato = () => {
    setPrintMode('contrato');
    setTimeout(() => {
      window.print();
      setPrintMode(null);
    }, 150);
  };

  const formatMoney = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const getRiesgosOperativos = () => {
    if (!data) return [];
    const riesgos = [];
    const faltanInsumos = data.tareas.some(t => t.articuloId && t.cantidadRequerida > t.stockActual && !t.stockDescontado);
    if (faltanInsumos) {
      riesgos.push("Falta de stock para insumos requeridos en el evento.");
    }
    if (data.staff.length === 0) {
      riesgos.push("No se ha asignado personal de apoyo/staff para este evento.");
    }
    const fechaEvento = new Date(data.fechaEvento);
    const diasParaEvento = Math.ceil((fechaEvento.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (data.saldoPendiente > 0 && diasParaEvento <= 7) {
      riesgos.push(`Saldo pendiente de ${formatMoney(data.saldoPendiente)} a menos de ${diasParaEvento} días del evento.`);
    }
    return riesgos;
  };

  const renderNominaTab = () => {
    if (!data) return null;
    return (
      <div className="space-y-6 font-sans">
        {/* Asignación de Personal */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Users size={18} className="text-indigo-500" /> Control de Equipo y Nómina
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Gestiona las asignaciones de personal y realiza los pagos por evento correspondientes.
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 border border-slate-200 rounded px-2.5 py-1 text-slate-500">
              {data.staff.length} Asignado{data.staff.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="p-6">
            {/* Formulario de Asignación */}
            <form 
              className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200" 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newStaff.empleadoId) return;
                setAssigningStaff(true);
                try {
                  await operativoService.assignStaff({ 
                    eventoId: data.eventoId, 
                    empleadoId: newStaff.empleadoId, 
                    rol: newStaff.rol 
                  });
                  setNewStaff({ empleadoId: 0, rol: 'Apoyo' });
                  toast.success('Miembro de staff asignado');
                  await loadData();
                } catch (err: any) {
                  toast.error(err.response?.data?.Errors?.[0] || 'Error al asignar staff');
                } finally {
                  setAssigningStaff(false);
                }
              }}
            >
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Empleado</label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                  value={newStaff.empleadoId}
                  onChange={e => setNewStaff({ ...newStaff, empleadoId: parseInt(e.target.value) })}
                >
                  <option value={0}>Seleccionar empleado...</option>
                  {allEmpleados.map(e => (
                    <option key={e.id} value={e.id}>{e.nombreCompleto}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Rol Específico</label>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                  placeholder="Ej: Animador, Apoyo, Fotógrafo"
                  value={newStaff.rol}
                  onChange={e => setNewStaff({ ...newStaff, rol: e.target.value })}
                />
              </div>
              <div className="sm:self-end">
                <button 
                  type="submit" 
                  disabled={assigningStaff || !newStaff.empleadoId} 
                  className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 h-[38px]"
                >
                  {assigningStaff ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} />} Asignar Staff
                </button>
              </div>
            </form>

            {/* Lista de Personal con Nómina */}
            {data.staff.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.staff.map(member => (
                  <div 
                    key={member.id} 
                    className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                      member.esPagado ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200 bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {member.fotoPerfilUrl ? (
                        <img src={member.fotoPerfilUrl} alt={member.nombre} className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0 border border-indigo-100">
                          {member.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{member.nombre}</p>
                        <p className="text-xs text-slate-500 truncate">{member.rol}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monto por Evento</p>
                        <p className="text-sm font-bold text-slate-800">{formatMoney(member.pagoPorEvento || 0)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${
                        member.esPagado ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {member.esPagado ? 'Nómina Pagada' : 'Pago Pendiente'}
                      </span>

                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (!window.confirm(`¿Seguro que deseas desasignar a ${member.nombre}?`)) return;
                            try {
                              await operativoService.removeStaff(member.id);
                              toast.success('Personal desasignado correctamente');
                              await loadData();
                            } catch (err: any) {
                              toast.error(err.response?.data?.Errors?.[0] || 'Error al desasignar staff');
                            }
                          }}
                          disabled={member.esPagado}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            member.esPagado 
                              ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                              : 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300'
                          }`}
                        >
                          Desasignar
                        </button>
                        <button
                          onClick={async () => {
                            if (!member.empleadoId) return;
                            if (!window.confirm(`¿Confirmas que deseas pagar la nómina de ${member.nombre} por este evento?`)) return;
                            try {
                              await finanzasService.pagarNomina(member.empleadoId, undefined, [data.eventoId]);
                              toast.success('Nómina pagada exitosamente');
                              await loadData();
                            } catch (err: any) {
                              toast.error(err.response?.data?.Errors?.[0] || 'Error al pagar nómina');
                            }
                          }}
                          disabled={member.esPagado || !member.empleadoId}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                            member.esPagado 
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          Pagar Nómina
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                <Users size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">No hay personal asignado</p>
                <p className="text-xs text-slate-400 mt-1">Usa el formulario superior para formar el equipo de trabajo.</p>
              </div>
            )}
          </div>
        </section>

        {/* Distribución de Tareas del Staff */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <ListChecks size={18} className="text-indigo-500" /> Distribución de Tareas del Staff
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Asigna y desasigna rápidamente las tareas del evento a cada miembro del staff.
            </p>
          </div>

          <div className="p-6">
            {data.staff.filter(s => s.empleadoId).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.staff.filter(s => s.empleadoId).map(member => {
                  const memberTareas = data.tareas.filter(t => t.asignadoA === member.nombre);
                  const availableTareas = data.tareas.filter(t => t.asignadoA !== member.nombre);

                  const normalizeTipo = (tarea: TareaOperativa) => {
                    const tipo = tarea.tipoTarea?.toLowerCase();
                    if (tipo === 'entrega') return 'entrega';
                    if (tipo === 'servicio') return 'servicio';
                    if (tipo === 'inventario' || tarea.articuloId) return 'inventario';
                    return 'manual';
                  };

                  const getBadgeColor = (tipo: string) => {
                    switch (tipo) {
                      case 'inventario': return 'bg-amber-50 text-amber-700 border-amber-200';
                      case 'servicio': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
                      case 'entrega': return 'bg-rose-50 text-rose-700 border-rose-200';
                      default: return 'bg-slate-50 text-slate-700 border-slate-200';
                    }
                  };

                  const getBadgeLabel = (tipo: string) => {
                    switch (tipo) {
                      case 'inventario': return 'Insumo';
                      case 'servicio': return 'Servicio';
                      case 'entrega': return 'Entrega';
                      default: return 'Manual';
                    }
                  };

                  return (
                    <div key={member.id} className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col justify-between">
                      <div>
                        {/* Member Info */}
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
                          {member.fotoPerfilUrl ? (
                            <img src={member.fotoPerfilUrl} alt={member.nombre} className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0 border border-indigo-100">
                              {member.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{member.nombre}</h4>
                            <p className="text-xs text-slate-500 font-medium">{member.rol}</p>
                          </div>
                        </div>

                        {/* Assigned Tasks List */}
                        <div className="space-y-2 mb-6">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tareas Asignadas ({memberTareas.length})</p>
                          {memberTareas.length > 0 ? (
                            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                              {memberTareas.map(t => {
                                const completada = t.estado.toLowerCase() === 'completada';
                                const tipo = normalizeTipo(t);
                                return (
                                  <div key={t.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2.5 hover:border-slate-300 transition-all">
                                    <div className="min-w-0 flex-1 pr-2">
                                      <p className={`text-xs font-semibold truncate ${completada ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                        {t.nombre}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${getBadgeColor(tipo)}`}>
                                          {getBadgeLabel(tipo)}
                                        </span>
                                        <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                          completada ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                        }`}>
                                          {completada ? 'Completa' : 'Pendiente'}
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          await operativoService.assignTarea({ tareaId: t.id, empleadoId: 0 });
                                          toast.success('Tarea desasignada');
                                          await loadData();
                                        } catch {
                                          toast.error('Error al desasignar la tarea');
                                        }
                                      }}
                                      className="text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded transition-colors"
                                      title="Desasignar tarea"
                                    >
                                      <XCircle size={14} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic py-2">Sin tareas asignadas</p>
                          )}
                        </div>
                      </div>

                      {/* Quick Task Assigner Dropdown */}
                      <div className="pt-4 border-t border-slate-200/60">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Asignar Nueva Tarea</label>
                        <select
                          className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                          value=""
                          onChange={async (e) => {
                            const val = e.target.value;
                            if (!val) return;
                            try {
                              await operativoService.assignTarea({ tareaId: parseInt(val), empleadoId: member.empleadoId! });
                              toast.success('Tarea asignada exitosamente');
                              await loadData();
                            } catch {
                              toast.error('Error al asignar la tarea');
                            }
                          }}
                        >
                          <option value="">Seleccionar tarea del evento...</option>
                          {['inventario', 'servicio', 'entrega', 'manual'].map(tipo => {
                            const filtered = availableTareas.filter(t => normalizeTipo(t) === tipo);
                            if (filtered.length === 0) return null;
                            return (
                              <optgroup key={tipo} label={tipo === 'inventario' ? 'Insumos de Inventario' : tipo === 'servicio' ? 'Preparación de Servicios' : tipo === 'entrega' ? 'Entregas (En Vivo)' : 'Tareas Manuales'}>
                                {filtered.map(t => (
                                  <option key={t.id} value={t.id}>
                                    {t.nombre} {t.asignadoA ? `(Asignado a: ${t.asignadoA})` : ''}
                                  </option>
                                ))}
                              </optgroup>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                <Users size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">No hay personal de staff asignado</p>
                <p className="text-xs text-slate-400 mt-1">Primero asigna miembros de staff para poder distribuirles tareas.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  };

  const renderFaseControlButtons = () => {
    if (isCancelado || !data) return null;
    
    const estado = data.estado;
    const canGoBack = estado !== 'Provisional' && !isTerminado && !(data.origen === 'Interno' && estado === 'Confirmado');
    const canGoForward = !isTerminado;
    
    let nextState = '';
    let nextLabel = '';
    let prevState = '';
    let prevLabel = '';
    
    if (estado === 'Provisional') {
      nextState = 'Confirmado';
      nextLabel = 'Aprobar y Confirmar';
    } else if (estado === 'Confirmado') {
      nextState = 'EnCurso';
      nextLabel = 'Iniciar Fiesta';
      prevState = 'Provisional';
      prevLabel = 'Regresar a Revisión';
    } else if (estado === 'EnCurso') {
      nextState = 'Finalizado';
      nextLabel = 'Terminar Fiesta';
      prevState = 'Confirmado';
      prevLabel = 'Regresar a Preparación';
    } else if (estado === 'Finalizado') {
      nextState = 'Terminado';
      nextLabel = 'Archivar Evento';
      prevState = 'EnCurso';
      prevLabel = 'Regresar a En Vivo';
    }
    
    return (
      <div className="flex items-center gap-2">
        {canGoBack && (
          <button
            onClick={() => handleStateChange(prevState)}
            disabled={updatingEstado}
            className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
          >
            ← {prevLabel}
          </button>
        )}
        {canGoForward && (
          <button
            onClick={() => {
              if (estado === 'Finalizado' && data.saldoPendiente > 0) {
                toast.error('No se puede archivar un evento con saldo pendiente.');
                return;
              }
              handleStateChange(nextState);
            }}
            disabled={updatingEstado || (estado === 'Finalizado' && data.saldoPendiente > 0)}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-sm ${
              estado === 'Finalizado' && data.saldoPendiente > 0
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : estado === 'Confirmado'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : estado === 'EnCurso'
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {updatingEstado ? 'Procesando...' : nextLabel} →
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center text-slate-400">
          <RefreshCw className="animate-spin mb-4 text-indigo-500" size={32} />
          <p className="font-medium">Cargando Centro de Mando...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans text-center px-4">
        <div>
          <AlertTriangle className="mx-auto text-rose-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Evento no encontrado</h2>
          <button onClick={() => navigate('/admin/operativo')} className="text-indigo-600 hover:underline">Volver al listado</button>
        </div>
      </div>
    );
  }

  const isTerminado = data.estado.toLowerCase() === 'terminado';
  const isCancelado = data.estado.toLowerCase() === 'cancelado';
  const title = data.protagonistas.length > 0 ? data.protagonistas.map(p => p.nombre).join(' & ') : 'Evento Principal';

  const steps = data.origen === 'Interno'
    ? [
        { id: 'Confirmado', label: 'Preparación' },
        { id: 'EnCurso', label: 'En Vivo' },
        { id: 'Finalizado', label: 'Cierre' }
      ]
    : [
        { id: 'Provisional', label: 'Revisión' },
        { id: 'Confirmado', label: 'Preparación' },
        { id: 'EnCurso', label: 'En Vivo' },
        { id: 'Finalizado', label: 'Cierre' }
      ];

  const currentStepIndex = steps.findIndex(s => s.id.toLowerCase() === data.estado.toLowerCase());

  const prepTareas = data.tareas.filter(t => t.tipoTarea?.toLowerCase() !== 'entrega');
  const totalTareas = prepTareas.length;
  const tareasCompletadas = prepTareas.filter(t => t.estado.toLowerCase() === 'completada' || t.estado.toLowerCase() === 'completado').length;
  const progresoPrep = totalTareas > 0 ? (tareasCompletadas / totalTareas) * 100 : 0;

  const tienePendientesDePago = data.pagos.some(p => p.estado === 'Pendiente');
  const staffCount = data.staff.length;

  const operationTabs = [
    { id: 'resumen', label: 'Resumen', icon: Info },
    { 
      id: 'preparacion', 
      label: 'Preparación', 
      icon: ListChecks,
      badge: totalTareas > 0 ? `${Math.round(progresoPrep)}%` : undefined,
      badgeColor: progresoPrep === 100 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
    },
    { 
      id: 'durantefiesta', 
      label: 'En Vivo', 
      icon: Play,
      badge: Object.values(runningTimers).some(t => t.isActive) ? 'En Vivo' : undefined,
      badgeColor: 'bg-rose-500 text-white animate-pulse'
    },
    { id: 'cierre', label: 'Cierre', icon: Folder }
  ];

  const renderTabContent = () => {
    if (activeTab === 'resumen') {
      return (
        <ResumenTab
          data={data}
          progreso={progresoPrep}
          riesgosOperativos={getRiesgosOperativos()}
          notas={notas}
          savingNotas={savingNotas}
          onNotasChange={setNotas}
          onSaveNotas={handleSaveNotas}
          onSetTab={setActiveTab}
        />
      );
    }
    if (activeTab === 'preparacion') {
      return (
        <PreparacionTab
          data={data}
          allEmpleados={allEmpleados}
          preferencias={preferencias}
          savingPreferencias={savingPreferencias}
          onPreferenciasChange={setPreferencias}
          onSavePreferencias={handleSavePreferencias}
          onComplete={async (tareaId) => {
            await operativoService.completeTarea(tareaId);
            loadData();
          }}
          onAssign={async (tareaId, empleadoId) => {
            await operativoService.assignTarea({ tareaId, empleadoId });
            loadData();
          }}
          onReload={loadData}
          eventoId={data.eventoId}
          onSetTab={setActiveTab}
        />
      );
    }
    if (activeTab === 'durantefiesta') {
      return (
        <DuranteFiestaTab
          data={data}
          runningTimers={runningTimers}
          savingCronograma={savingCronograma}
          onToggleTimer={(itemId, durationMinutes) => {
            setRunningTimers(prev => {
              const curr = prev[itemId];
              if (curr?.isActive) return { ...prev, [itemId]: { ...curr, isActive: false } };
              return { ...prev, [itemId]: { startTime: Date.now(), duration: durationMinutes * 60 * 1000, isActive: true } };
            });
          }}
          onSaveCronograma={handleSaveCronograma}
          onAutoCronograma={handleAutoCronograma}
          onReload={loadData}
          eventoId={data.eventoId}
        />
      );
    }
    // Removed inline tabs for administration, moved to Drawers
    if (activeTab === 'cierre') {
      return (
        <CierreTab
          data={data}
          postFiesta={postFiesta}
          savingPostEvento={isSavingPostFiesta}
          uploadingMultimedia={isUploading}
          finalizingEvento={updatingEstado}
          onPostFiestaChange={setPostFiesta}
          onSavePostEvento={async () => {
            setIsSavingPostFiesta(true);
            try {
              await operativoService.updatePostEvento({ eventoId: data.eventoId, ...postFiesta });
              toast.success('Datos post-fiesta guardados');
              loadData();
            } finally { setIsSavingPostFiesta(false); }
          }}
          onUploadMultimedia={handleUploadMultimedia}
          onDeleteMultimedia={handleDeleteMultimedia}
          onFinalizar={() => handleStateChange('Terminado')}
          onPrintHoja={handlePrintHoja}
          onPrintContrato={handlePrintContrato}
        />
      );
    }
    return null;
  };

  return (
    <>
      <div className="font-sans max-w-7xl mx-auto no-print">
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate('/admin/operativo')}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
          >
            <ChevronLeft size={16} /> Volver
          </button>
          <div className="flex items-center gap-4">
            {!isCancelado && !isTerminado && currentStepIndex <= 1 && (
              <button onClick={handleCancelEvento} className="text-xs font-bold text-rose-500 hover:text-rose-700 px-4 py-2">
                Cancelar Evento
              </button>
            )}
            
            {renderFaseControlButtons()}

            <button onClick={loadData} disabled={loading} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors shadow-sm">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Horizontal Header */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 mb-8">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8">
            {/* Info */}
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{data.paqueteNombre || 'Sin Paquete'}</span>
                <span className="text-sm font-medium text-slate-500">{new Date(data.fechaEvento).toLocaleDateString()} • {data.horaInicio} a {data.horaFin}</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  data.origen === 'Interno' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  Origen: {data.origen}
                </span>
              </div>
            </div>

            {/* Finances */}
            <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Costo Total</p>
                <p className="text-lg font-bold text-slate-800">{formatMoney(data.precioTotal)}</p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${data.saldoPendiente > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>Saldo Pendiente</p>
                <p className={`text-lg font-black ${data.saldoPendiente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatMoney(data.saldoPendiente)}</p>
              </div>
            </div>
          </div>

          {/* Horizontal Stepper */}
          {!isCancelado && !isTerminado && (
            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-500" 
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }} 
                  />
                </div>
                
                {steps.map((step, idx) => {
                  const isPast = currentStepIndex > idx;
                  const isCurrent = currentStepIndex === idx;
                  return (
                    <div key={step.id} className="relative flex flex-col items-center gap-2 bg-white px-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-[3px] text-xs font-black z-10 bg-white transition-colors duration-500 ${
                        isPast ? 'border-indigo-500 text-indigo-500' : 
                        isCurrent ? 'border-indigo-600 text-white bg-indigo-600 ring-4 ring-indigo-50' : 
                        'border-slate-200 text-slate-400'
                      }`}>
                        {isPast ? <CheckCircle2 size={16} strokeWidth={4} /> : idx + 1}
                      </div>
                      <span className={`text-[10px] uppercase tracking-widest font-bold absolute top-10 whitespace-nowrap ${isCurrent ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Read-Only Status Banner */}
        {(isCancelado || isTerminado) && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between ${
            isCancelado ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800'
          }`}>
            <div className="flex items-center gap-3">
              {isCancelado ? <XCircle size={20} className="text-rose-500" /> : <CheckCircle2 size={20} className="text-emerald-500" />}
              <div>
                <p className="text-sm font-bold">Evento {isCancelado ? 'Cancelado' : 'Archivado y Terminado'}</p>
                <p className="text-xs opacity-90">Este panel está en modo de solo lectura.</p>
              </div>
            </div>
            {!isCancelado && isTerminado && (
              <button 
                onClick={() => handleStateChange('Finalizado')} 
                className="text-xs font-bold bg-white text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm"
              >
                Desarchivar Evento
              </button>
            )}
          </div>
        )}

        {/* Navigation Tabs and Admin Drawer Buttons */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-1">
            {operationTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tab.badgeColor}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsStaffOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-sm"
            >
              <Users size={16} className="text-slate-500" />
              <span>Equipo y Nómina</span>
              {staffCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {staffCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsPaymentsOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-sm"
            >
              <DollarSign size={16} className="text-slate-500" />
              <span>Finanzas y Pagos</span>
              {tienePendientesDePago && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">
                  Pendiente
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="pb-20">
          {renderTabContent()}
        </main>
      </div>

      {/* Drawers Area */}
      <AnimatePresence>
        {isStaffOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStaffOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 pointer-events-auto cursor-pointer"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-full max-w-3xl bg-slate-50 shadow-2xl z-50 flex flex-col pointer-events-auto border-l border-slate-200"
            >
              {/* Header */}
              <div className="px-6 py-5 bg-white border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Users size={20} className="text-indigo-500" /> Equipo y Nómina
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Gestiona las asignaciones de personal y realiza los pagos.</p>
                </div>
                <button
                  onClick={() => setIsStaffOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {renderNominaTab()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPaymentsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentsOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 pointer-events-auto cursor-pointer"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-full max-w-3xl bg-slate-50 shadow-2xl z-50 flex flex-col pointer-events-auto border-l border-slate-200"
            >
              {/* Header */}
              <div className="px-6 py-5 bg-white border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <DollarSign size={20} className="text-indigo-500" /> Finanzas y Pagos
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Registra nuevos abonos, verifica comprobantes e historial.</p>
                </div>
                <button
                  onClick={() => setIsPaymentsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <PagosTab
                  data={data}
                  metodosPago={metodosPago}
                  registeringPago={registeringPago}
                  verifyingPago={verifyingPago}
                  pagoManual={pagoManual}
                  onPagoManualChange={setPagoManual}
                  onRegisterPago={handleRegisterPago}
                  onVerificarPago={handleVerificarPago}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PRINT-ONLY AREA */}
      {printMode === 'hoja' && (
        <div className="print-only">
          <HojaServicioPrint data={data} />
        </div>
      )}
      {printMode === 'contrato' && (
        <div className="print-only">
          <ContratoPrint ref={contratoRef} evento={data} />
        </div>
      )}
    </>
  );
};

export default DetalleOperativoPage;

