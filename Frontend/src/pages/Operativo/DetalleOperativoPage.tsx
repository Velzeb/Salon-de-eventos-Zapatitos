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
  AlertTriangle,
  Globe,
  MoreVertical,
  Info,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import HojaServicioPrint from './components/HojaServicioPrint';
import ChecklistLogistica from './components/ChecklistLogistica';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { eventosService } from '../../services/eventosService';
import React from 'react';
import { operativoService, type EventoOperativo } from '../../services/operativoService';
import { paquetesService } from '../../services/paquetesService';
import { empleadosService, type Empleado } from '../../services/empleadosService';
import { toast } from 'sonner';
import ContratoPrint from './components/ContratoPrint';
import { getEstadoEventoBadgeClasses, getEstadoEventoLabel, normalizeEstadoEvento } from '../../utils/estadoEvento';

type OperativoTab = 'resumen' | 'briefing' | 'logistica' | 'cronograma' | 'invitados' | 'staff' | 'finanzas' | 'postfiesta';

const estadoTextoGuia: Record<string, string> = {
  provisional: 'Acción requerida: revisa el pago inicial y confirma o rechaza la reserva.',
  confirmado: 'Reserva confirmada: completa la preparación, revisa los servicios y asigna personal.',
  encurso: 'Fiesta en curso: registra ingresos, sigue la agenda y atiende los servicios programados.',
  finalizado: 'Fiesta finalizada: registra pagos pendientes, fotos y datos de cierre.',
  terminado: 'Evento archivado: esta fiesta queda solo para consulta.',
  cancelado: 'Reserva cancelada: revisa pagos o notas internas si hace falta.'
};

const getTituloFiesta = (data: EventoOperativo) =>
  data.protagonistas.map(p => p.nombre).filter(Boolean).join(' & ') || data.clientes.join(' & ') || `Fiesta #${data.eventoId}`;

const getModalidadFiesta = (data: EventoOperativo) => {
  const paquete = data.paqueteNombre?.trim();
  const sinPaquete = !paquete || paquete.toLowerCase() === 'sin paquete';
  const extras = data.items.some(item => !item.esIncluidoEnPaquete);
  if (sinPaquete) return extras ? 'Solo salón + servicios extra' : 'Solo salón';
  return extras ? `Paquete: ${paquete} + servicios extra` : `Paquete: ${paquete}`;
};

const getDuracionActividad = (horaInicio: string, horaFin: string) => {
  const [inicioHora, inicioMinuto] = horaInicio.split(':').map(Number);
  const [finHora, finMinuto] = horaFin.split(':').map(Number);
  const inicio = (inicioHora * 60) + inicioMinuto;
  const fin = (finHora * 60) + finMinuto;
  const minutos = Math.max(0, fin - inicio);
  if (!minutos) return 'Sin duración';
  return `${minutos} min`;
};

const normalizeTimeForApi = (time: string) => {
  const [hours = '00', minutes = '00', seconds = '00'] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
};

const formatTimerRemaining = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const DetalleOperativoPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<EventoOperativo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OperativoTab>('resumen');
  
  const [notas, setNotas] = useState('');
  const [savingNotas, setSavingNotas] = useState(false);
  const [updatingEstado, setUpdatingEstado] = useState(false);
  const [verifyingPago, setVerifyingPago] = useState<number | null>(null);
  const [showSecondaryActions, setShowSecondaryActions] = useState(false);
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
  const [, setTimerTick] = useState(0);
  
  // FASE 5 STATES
  const [preferencias, setPreferencias] = useState({
    tematica: '',
    notasDecoracion: ''
  });
  const [savingPreferencias, setSavingPreferencias] = useState(false);
  
  const [newInvitadoNombre, setNewInvitadoNombre] = useState('');
  const [addingInvitado, setAddingInvitado] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [finalizingEvento, setFinalizingEvento] = useState(false);
  const [printMode, setPrintMode] = useState<'hoja' | 'contrato'>('hoja');
  const [showManualActivity, setShowManualActivity] = useState(false);
  const [savingCronograma, setSavingCronograma] = useState(false);
  const [newActividad, setNewActividad] = useState({
    nombre: '',
    descripcion: '',
    horaInicio: '',
    horaFin: ''
  });

  const handlePrintHoja = () => {
    setPrintMode('hoja');
    setTimeout(() => window.print(), 100);
  };

  const handlePrintContrato = () => {
    setPrintMode('contrato');
    setTimeout(() => window.print(), 100);
  };
  
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
      setPreferencias({
        tematica: operativoData.tematica || '',
        notasDecoracion: operativoData.notasDecoracion || ''
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

  const handleSavePreferencias = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!id) return;
    setSavingPreferencias(true);
    try {
      await operativoService.updateBriefing({
        eventoId: parseInt(id),
        ...preferencias
      });
      toast.success('Notas de montaje actualizadas');
    } catch (error) {
      toast.error('Error al guardar notas de montaje');
    } finally {
      setSavingPreferencias(false);
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

  useEffect(() => {
    if (data) {
      const estado = data.estado.toLowerCase();
      let defaultTab = 'resumen';
      if (estado === 'provisional') defaultTab = 'resumen';
      else if (estado === 'confirmado') defaultTab = 'briefing';
      else if (estado === 'encurso') defaultTab = 'cronograma';
      else if (estado === 'finalizado') defaultTab = 'postfiesta';
      else if (estado === 'terminado') defaultTab = 'postfiesta';
      
      setActiveTab(defaultTab as any);
    }
  }, [data?.estado]);

  useEffect(() => {
    const hasActiveTimer = Object.values(runningTimers).some(timer => timer.isActive);
    if (!hasActiveTimer) return;

    const interval = window.setInterval(() => {
      setTimerTick(tick => tick + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [runningTimers]);

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
      toast.error(`No se puede archivar: Hay un saldo pendiente de $${data.saldoPendiente.toLocaleString()}`);
      setActiveTab('finanzas');
      return;
    }

    if (!confirm('¿Seguro que quieres cerrar y archivar esta fiesta? Revisa antes pagos, fotos y notas pendientes.')) return;
    
    setFinalizingEvento(true);
    try {
      await operativoService.updatePostEvento({
        eventoId: parseInt(id),
        ...postFiesta,
        cerrarDefinitivamente: true
      });
      toast.success('Fiesta archivada con éxito');
      navigate('/admin/operativo');
    } catch (err) {
      toast.error('Error al archivar la fiesta');
    } finally {
      setFinalizingEvento(false);
    }
  };

  const handleAutoCronograma = async () => {
    if (!id || !data) return;
    const confirmAuto = confirm('Se generará una agenda estándar basada en la duración de la fiesta. Se borrará la agenda actual. ¿Continuar?');
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
        horaInicio: normalizeTimeForApi(hIni),
        horaFin: normalizeTimeForApi(hFin),
        orden: i + 1,
        completada: false
      };
    });

    setSavingCronograma(true);
    try {
      await operativoService.updateCronograma({
        eventoId: parseInt(id),
        actividades
      });
      toast.success('Agenda automática generada');
      await loadData();
    } catch (err) {
      toast.error('Error al generar la agenda');
    } finally {
      setSavingCronograma(false);
    }
  };

  const saveCronograma = async (
    actividades: Array<{
      id?: number;
      nombre: string;
      descripcion?: string;
      horaInicio: string;
      horaFin: string;
      orden: number;
      completada: boolean;
    }>,
    successMessage = 'Agenda actualizada'
  ) => {
    if (!id) return;
    setSavingCronograma(true);
    try {
      await operativoService.updateCronograma({
        eventoId: parseInt(id),
        actividades: actividades.map((act, index) => ({
          ...act,
          orden: index + 1,
          horaInicio: normalizeTimeForApi(act.horaInicio),
          horaFin: normalizeTimeForApi(act.horaFin)
        }))
      });
      toast.success(successMessage);
      await loadData();
    } catch (err) {
      toast.error('Error al actualizar la agenda');
    } finally {
      setSavingCronograma(false);
    }
  };

  const handleToggleActividadCompletada = async (actividadId: number) => {
    if (!id || !data) return;

    const actividades = [...data.cronograma].sort((a, b) => a.orden - b.orden).map(act => ({
      id: act.id,
      nombre: act.nombre,
      descripcion: act.descripcion,
      horaInicio: act.horaInicio,
      horaFin: act.horaFin,
      orden: act.orden,
      completada: act.id === actividadId ? !act.completada : act.completada
    }));

    await saveCronograma(actividades);
  };

  const handleAddActividadManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !newActividad.nombre.trim() || !newActividad.horaInicio || !newActividad.horaFin) {
      toast.error('Completa nombre, hora de inicio y hora de fin');
      return;
    }

    const actividades = [
      ...[...data.cronograma].sort((a, b) => a.orden - b.orden).map(act => ({
        id: act.id,
        nombre: act.nombre,
        descripcion: act.descripcion,
        horaInicio: act.horaInicio,
        horaFin: act.horaFin,
        orden: act.orden,
        completada: act.completada
      })),
      {
        nombre: newActividad.nombre.trim(),
        descripcion: newActividad.descripcion.trim() || undefined,
        horaInicio: newActividad.horaInicio,
        horaFin: newActividad.horaFin,
        orden: data.cronograma.length + 1,
        completada: false
      }
    ].sort((a, b) => normalizeTimeForApi(a.horaInicio).localeCompare(normalizeTimeForApi(b.horaInicio)));

    await saveCronograma(actividades, 'Actividad agregada');
    setNewActividad({ nombre: '', descripcion: '', horaInicio: '', horaFin: '' });
    setShowManualActivity(false);
  };

  const handleMoveActividad = async (actividadId: number, direction: 'up' | 'down') => {
    if (!data) return;
    const actividades = [...data.cronograma].sort((a, b) => a.orden - b.orden).map(act => ({
      id: act.id,
      nombre: act.nombre,
      descripcion: act.descripcion,
      horaInicio: act.horaInicio,
      horaFin: act.horaFin,
      orden: act.orden,
      completada: act.completada
    }));
    const index = actividades.findIndex(act => act.id === actividadId);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= actividades.length) return;
    [actividades[index], actividades[targetIndex]] = [actividades[targetIndex], actividades[index]];
    await saveCronograma(actividades, 'Orden actualizado');
  };

  const handleDeleteActividad = async (actividadId: number) => {
    if (!data) return;
    if (!window.confirm('¿Eliminar esta actividad de la agenda?')) return;
    const actividades = data.cronograma
      .filter(act => act.id !== actividadId)
      .sort((a, b) => a.orden - b.orden)
      .map(act => ({
        id: act.id,
        nombre: act.nombre,
        descripcion: act.descripcion,
        horaInicio: act.horaInicio,
        horaFin: act.horaFin,
        orden: act.orden,
        completada: act.completada
      }));
    await saveCronograma(actividades, 'Actividad eliminada');
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

  const handleUpdateEstado = async (nuevoEstado: string) => {
    if (!id) return;
    
    // resumenes preventivas
    if (nuevoEstado === 'EnCurso' && progreso < 50) {
      if (!confirm('La preparación está por debajo del 50%. ¿Seguro que quieres iniciar la fiesta?')) return;
    }

    if (nuevoEstado === 'Finalizado' && (data?.invitados.filter(i => i.ingreso).length || 0) === 0) {
       if (!confirm('No se han registrado ingresos de invitados. ¿Desea terminar la fiesta de todos modos?')) return;
    }

    setUpdatingEstado(true);
    try {
      await eventosService.updateEstado(parseInt(id), nuevoEstado);
      toast.success(`Estado actualizado a: ${nuevoEstado}`);
      await loadData();
    } catch (err) {
      toast.error('Error al actualizar el estado operativo');
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

  // REMOVED BROKEN REDECLARATION
  const handleSavePostEvento = async (cerrarDefinitivamente = false) => {
    if (!id) return;
    setSavingPostEvento(true);
    try {
      await operativoService.updatePostEvento({
        eventoId: parseInt(id),
        ...postFiesta,
        cerrarDefinitivamente
      });
      toast.success(cerrarDefinitivamente ? 'Fiesta archivada definitivamente' : 'Datos de cierre guardados');
      await loadData();
    } catch (err) {
      toast.error('Error al guardar datos de cierre');
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
  const estadoNormalizado = normalizeEstadoEvento(data.estado);
  const estadoActual = estadoNormalizado;
  const tituloFiesta = getTituloFiesta(data);
  const modalidadFiesta = getModalidadFiesta(data);
  const clientePrincipal = data.clientes.length > 0 ? data.clientes.join(' & ') : 'Cliente no registrado';
  const fechaFiesta = new Date(data.fechaEvento).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const faltantesInventario = data.tareas.filter(t => t.articuloId && t.cantidadRequerida > t.stockActual && !t.stockDescontado);
  const responsablesTareas = Array.from(new Set(data.tareas.map(t => t.asignadoA).filter(Boolean))) as string[];
  const tareasSinResponsable = data.tareas.some(t => !t.asignadoA);
  const serviciosConTiempo = data.items.filter(i => i.tipo === 'Servicio' && i.requiereTemporizador);
  const serviciosActivos = serviciosConTiempo.filter(item => runningTimers[item.id]?.isActive).length;
  const invitadosEnSalon = data.invitados.filter(i => i.ingreso).length;
  const actividadesOrdenadas = [...data.cronograma].sort((a, b) => a.orden - b.orden);
  const actividadesCompletadas = actividadesOrdenadas.filter(act => act.completada).length;
  const progresoAgenda = actividadesOrdenadas.length > 0 ? Math.round((actividadesCompletadas / actividadesOrdenadas.length) * 100) : 0;
  const siguienteActividad = actividadesOrdenadas.find(act => !act.completada);
  const riesgosOperativos = [
    ...(faltantesInventario.length > 0 ? [`${faltantesInventario.length} insumo${faltantesInventario.length > 1 ? 's' : ''} con stock insuficiente`] : []),
    ...(data.saldoPendiente > 0 ? [`Saldo pendiente: $${data.saldoPendiente.toLocaleString()}`] : []),
    ...(progreso < 100 ? [`Preparación al ${Math.round(progreso)}%`] : []),
    ...(tareasSinResponsable ? ['Hay tareas sin responsable'] : [])
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <button onClick={() => navigate('/admin/operativo')} className="mt-1 w-9 h-9 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors border border-slate-200 shrink-0">
              <ChevronLeft size={16} />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-950 tracking-tight truncate">{tituloFiesta}</h1>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getEstadoEventoBadgeClasses(estadoNormalizado)}`}>
                  {getEstadoEventoLabel(estadoNormalizado)}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {fechaFiesta} · {data.horaInicio} - {data.horaFin} · {clientePrincipal}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{modalidadFiesta}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* ACCIONES SECUNDARIAS EN DROPDOWN */}
            <div className="relative">
              <button 
                onClick={() => setShowSecondaryActions(!showSecondaryActions)}
                className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 transition-all border border-slate-200"
              >
                <MoreVertical size={18} />
              </button>

              <AnimatePresence>
                {showSecondaryActions && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSecondaryActions(false)} />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-2"
                    >
                      <p className="px-4 py-2 text-xs font-bold text-slate-400  border-b border-slate-50 mb-1">Utilidades</p>
                      
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/invitacion/${data.invitacionToken}`);
                          toast.success('Enlace para el cliente copiado');
                          setShowSecondaryActions(false);
                        }}
                        className="w-full px-4 py-2.5 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-3 transition-colors"
                      >
                        <Globe size={14} className="text-blue-500" /> Enlace para el cliente
                      </button>

                      <button onClick={() => { handlePrintHoja(); setShowSecondaryActions(false); }} className="w-full px-4 py-2.5 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-3 transition-colors">
                        <Printer size={14} className="text-slate-400" /> Imprimir hoja de servicio
                      </button>

                      <button onClick={() => { handlePrintContrato(); setShowSecondaryActions(false); }} className="w-full px-4 py-2.5 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-3 transition-colors">
                        <Printer size={14} className="text-slate-400" /> Imprimir contrato
                      </button>

                      <div className="h-[1px] bg-slate-50 my-1" />

                      <button 
                        onClick={() => { navigate(`/admin/reservas/nueva`, { state: { editEventoId: data.eventoId } }); setShowSecondaryActions(false); }}
                        className="w-full px-4 py-2.5 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-3 transition-colors"
                      >
                        <Edit3 size={14} className="text-amber-500" /> Editar datos de reserva
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden md:block" />

            {/* BOTÓN DE ACCIÓN PRINCIPAL (ESTADO) */}
            <div className="flex items-center gap-2">
              {data.estado.toLowerCase() === 'provisional' && (
                <div className="flex gap-2">
                  <button onClick={() => handleUpdateEstado('Cancelado')} disabled={updatingEstado} className="px-5 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold uppercase tracking-wider border border-rose-100 hover:bg-rose-100 transition-all">Rechazar</button>
                  <button onClick={() => handleUpdateEstado('Confirmado')} disabled={updatingEstado} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold uppercase tracking-wider shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2">
                    {updatingEstado ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Confirmar reserva
                  </button>
                </div>
              )}

              {data.estado.toLowerCase() === 'confirmado' && (
                <button onClick={() => handleUpdateEstado('EnCurso')} disabled={updatingEstado} className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-xs font-semibold uppercase tracking-wider shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-3">
                  {updatingEstado ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />} Iniciar fiesta
                </button>
              )}

              {data.estado.toLowerCase() === 'encurso' && (
                <button onClick={() => handleUpdateEstado('Finalizado')} disabled={updatingEstado} className="px-8 py-3 bg-rose-600 text-white rounded-xl text-xs font-semibold uppercase tracking-wider shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all flex items-center gap-3">
                  {updatingEstado ? <RefreshCw className="animate-spin" size={16} /> : <Clock size={16} />} Finalizar fiesta
                </button>
              )}

              {data.estado.toLowerCase() === 'finalizado' && (
                <button onClick={() => setActiveTab('postfiesta')} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold">Cerrar evento</button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="bg-blue-600 py-2">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-3 text-white">
          <Info size={14} className="opacity-80" />
          <p className="text-xs font-bold ">{estadoTextoGuia[estadoActual] || 'Revisa los datos principales y las tareas pendientes de esta fiesta.'}</p>
        </div>
      </div>


      {/* QUICK INFO BAR - CLEANER CARDS */}
      <div className="bg-white border-b border-slate-100 py-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-8">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100"><Clock size={18} /></div>
              <div>
                <p className="text-xs text-slate-400 font-bold  mb-0.5">Horario</p>
                <p className="text-xs font-bold text-slate-800">{data.horaInicio} — {data.horaFin}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100"><MapPin size={18} /></div>
              <div>
                <p className="text-xs text-slate-400 font-bold  mb-0.5">Ubicación</p>
                <p className="text-xs font-bold text-slate-800">Salón Principal</p>
              </div>
            </div>

            <div className="h-8 w-[1px] bg-slate-100 hidden md:block" />

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100"><Users size={18} /></div>
              <div>
                <p className="text-xs text-slate-400 font-bold  mb-0.5">Cumpleañeros</p>
                <div className="flex items-center gap-2">
                  {data.protagonistas.map((p, i) => (
                    <span key={i} className="text-xs font-bold text-slate-800">
                      {p.nombre} ({p.edadCumplir} años){i < data.protagonistas.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-8 border-l border-slate-100 pl-8">
             <div className="text-right">
                <p className="text-xs text-slate-400 font-bold  mb-1">Preparación</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-900">{Math.round(progreso)}%</span>
                  <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progreso}%` }} className={`h-full rounded-full ${progreso === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} />
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <div className="flex items-center overflow-x-auto gap-2 pb-1">
            {[
              { id: 'resumen', label: 'Resumen' },
              { id: 'briefing', label: 'Preparación' },
              { id: 'cronograma', label: 'Durante la fiesta' },
              { id: 'finanzas', label: 'Pagos' },
              { id: 'postfiesta', label: 'Cierre' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`h-10 px-4 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
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
                {activeTab === 'resumen' && (
                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5">
                    <div className="space-y-5">
                      <section className="bg-white border border-slate-200 rounded-xl p-5">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">{tituloFiesta}</h3>
                            <p className="text-sm text-slate-500 mt-1">
                              {fechaFiesta} · {data.horaInicio} - {data.horaFin} · {modalidadFiesta}
                            </p>
                          </div>
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            data.saldoPendiente > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {data.saldoPendiente > 0 ? `$${data.saldoPendiente.toLocaleString()} pendiente` : 'Liquidado'}
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { label: 'Preparación', value: `${Math.round(progreso)}%`, tab: 'briefing' },
                            { label: 'Responsables', value: responsablesTareas.length, tab: 'briefing' },
                            { label: 'Ingresos', value: `${data.invitados.filter(i => i.ingreso).length}/${data.invitados.length}`, tab: 'cronograma' },
                            { label: 'Agenda', value: data.cronograma.length, tab: 'cronograma' }
                          ].map(item => (
                            <button
                              key={item.label}
                              onClick={() => setActiveTab(item.tab as any)}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:bg-white transition-colors"
                            >
                              <p className="text-xs text-slate-500 font-semibold">{item.label}</p>
                              <p className="text-lg font-bold text-slate-900">{item.value}</p>
                            </button>
                          ))}
                        </div>
                      </section>

                      <section className="bg-white border border-slate-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-slate-800">Notas internas</h3>
                          <button onClick={handleSaveNotas} disabled={savingNotas} className="text-blue-600 text-xs font-bold flex items-center gap-1">
                            {savingNotas ? <RefreshCw className="animate-spin" size={12} /> : <Save size={12} />} Guardar
                          </button>
                        </div>
                        <textarea
                          className="w-full h-40 bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 outline-none focus:border-blue-500 resize-none"
                          value={notas}
                          onChange={e => setNotas(e.target.value)}
                          placeholder="Notas operativas, pendientes o incidencias."
                        />
                      </section>
                    </div>

                    <aside className="space-y-5">
                      <section className="bg-white border border-slate-200 rounded-xl p-5">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Siguiente acción</p>
                        {data.estado.toLowerCase() === 'provisional' && (
                          <div className="space-y-3">
                            <h3 className="font-bold text-slate-900">Validar reserva</h3>
                            <div className="flex gap-2">
                              <button onClick={() => handleUpdateEstado('Cancelado')} className="flex-1 py-2.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold">Rechazar</button>
                              <button onClick={() => handleUpdateEstado('Confirmado')} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-bold">Confirmar</button>
                            </div>
                          </div>
                        )}
                        {data.estado.toLowerCase() === 'confirmado' && (
                          <button onClick={() => setActiveTab('briefing')} className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold">Completar preparación</button>
                        )}
                        {data.estado.toLowerCase() === 'encurso' && (
                          <button onClick={() => setActiveTab('cronograma')} className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold">Registrar ingresos</button>
                        )}
                        {['finalizado', 'terminado'].includes(data.estado.toLowerCase()) && (
                          <button onClick={() => setActiveTab('postfiesta')} className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold">Cerrar evento</button>
                        )}
                      </section>

                      <section className="bg-white border border-slate-200 rounded-xl p-5">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Alertas para revisar</p>
                        {riesgosOperativos.length > 0 ? (
                          <div className="space-y-2">
                            {riesgosOperativos.map(riesgo => (
                              <div key={riesgo} className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 border border-amber-100">
                                {riesgo}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 border border-emerald-100">
                            Sin alertas importantes.
                          </div>
                        )}
                      </section>

                      <section className="bg-white border border-slate-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-slate-800">Datos de la fiesta</h3>
                          <button onClick={() => setActiveTab('briefing')} className="text-xs font-bold text-blue-600">Ver</button>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold">Temática</p>
                        <p className="font-bold text-slate-900">{data.tematica || 'No definida'}</p>
                        <p className="text-xs text-slate-500 font-semibold mt-4">Servicios</p>
                        <p className="text-sm text-slate-700 mt-1">{data.items.length} ítems contratados</p>
                      </section>
                    </aside>
                  </div>
                )}

                {activeTab === 'logistica' && (
                  <div className="grid grid-cols-1 gap-6">
                    {/* AUDITORÍA DE INSUMOS CRÍTICOS */}
                    {data.tareas.some(t => t.articuloId && t.cantidadRequerida > t.stockActual && !t.stockDescontado) && (
                      <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-rose-50 border-2 border-rose-200 p-8 rounded-2xl shadow-xl shadow-rose-100/50"
                      >
                        <div className="flex items-center gap-6 mb-6">
                          <div className="w-14 h-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                            <AlertTriangle size={28} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-rose-900 uppercase italic">¡Atención: Faltan Suministros!</h3>
                            <p className="text-rose-700 font-bold text-xs  mt-1">Se detectaron faltantes para este evento</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {data.tareas
                            .filter(t => t.articuloId && t.cantidadRequerida > t.stockActual && !t.stockDescontado)
                            .map(t => (
                              <div key={t.id} className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-rose-200 flex justify-between items-center">
                                <div>
                                  <p className="font-bold text-slate-800 text-sm">{t.nombre}</p>
                                  <p className="text-xs text-rose-600 font-bold uppercase">Faltan {t.cantidadRequerida - t.stockActual} unidades</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-slate-400 font-bold uppercase">Stock Actual</p>
                                  <p className="text-lg font-bold text-slate-600">{t.stockActual}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Servicios con tiempo movidos a la agenda */}

                    {/* CHECKLIST DE PREPARACIÓN - CON CRUD */}
                    <ChecklistLogistica 
                      tareas={data.tareas} 
                      allEmpleados={allEmpleados}
                      onComplete={handleCompleteTarea}
                      onAssign={handleAssignTarea}
                      onCreate={async (cmd) => { if(!id) return; await operativoService.createTarea({ ...cmd, eventoId: parseInt(id) }); await loadData(); }}
                      onUpdate={async (cmd) => { await operativoService.updateTarea(cmd); await loadData(); }}
                      onDelete={async (tareaId) => { if(!window.confirm('¿Eliminar tarea?')) return; await operativoService.deleteTarea(tareaId); await loadData(); }}
                    />

                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                       <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                          <h3 className="text-sm font-bold text-slate-700">Notas internas</h3>
                          <button onClick={handleSaveNotas} disabled={savingNotas} className="text-blue-600 text-xs font-bold flex items-center gap-1">{savingNotas ? <RefreshCw className="animate-spin" size={12} /> : <Save size={12} />}Guardar</button>
                       </div>
                       <div className="p-6"><textarea className="w-full h-40 bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 outline-none" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas del evento..." /></div>
                    </div>
                  </div>
                )}

                {activeTab === 'briefing' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5">
                      <section className="bg-white border border-slate-200 rounded-xl p-5">
                        <h3 className="text-base font-bold text-slate-900 mb-5">Datos de la fiesta</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Temática</p>
                            <p className="text-lg font-bold text-slate-900 mt-1">{data.tematica || 'No definida'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cumpleañeros</p>
                            <div className="mt-2 space-y-1">
                              {data.protagonistas.map((p, i) => (
                                <p key={i} className="text-sm font-semibold text-slate-800">{p.nombre} · {p.edadCumplir} años</p>
                              ))}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Servicios y productos contratados</p>
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                          {data.items.length > 0 ? data.items.map(item => (
                            <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-4">
                              <div>
                                <p className="text-sm font-bold text-slate-800">{item.nombre}</p>
                                <p className="text-xs text-slate-500">{item.tipo}{item.esIncluidoEnPaquete ? ' incluido' : ' adicional'}</p>
                              </div>
                              <span className="text-sm font-bold text-slate-700">x{item.cantidad}</span>
                            </div>
                          )) : (
                            <div className="px-4 py-8 text-center text-sm text-slate-400">Sin servicios o productos adicionales.</div>
                          )}
                        </div>
                      </section>

                      <section className="bg-white border border-slate-200 rounded-xl p-5">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <h3 className="text-sm font-bold text-slate-900">Notas de montaje</h3>
                          <button onClick={handleSavePreferencias} disabled={savingPreferencias} className="text-blue-600 text-xs font-bold flex items-center gap-1">
                            {savingPreferencias ? <RefreshCw className="animate-spin" size={12} /> : <Save size={12} />} Guardar
                          </button>
                        </div>
                        <textarea
                          className="w-full h-64 bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 resize-none"
                          value={preferencias.notasDecoracion}
                          onChange={e => setPreferencias({ ...preferencias, notasDecoracion: e.target.value })}
                          placeholder="Montaje, colores, ubicación de mesa, globos, piñata o detalles confirmados."
                        />
                      </section>
                    </div>

                    {faltantesInventario.length > 0 && (
                      <div className="bg-rose-50 border border-rose-200 p-5 rounded-xl">
                        <h3 className="text-base font-bold text-rose-900">Faltan insumos</h3>
                        <p className="text-sm text-rose-700 font-semibold mt-1">Revisa estos productos antes de iniciar la fiesta.</p>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {faltantesInventario.map(t => (
                            <div key={t.id} className="bg-white p-4 rounded-xl border border-rose-100 flex justify-between items-center">
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{t.nombre}</p>
                                <p className="text-xs text-rose-600 font-bold">Faltan {t.cantidadRequerida - t.stockActual} unidades</p>
                              </div>
                              <p className="text-xs font-bold text-slate-500">Stock: {t.stockActual}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <ChecklistLogistica 
                      tareas={data.tareas} 
                      allEmpleados={allEmpleados}
                      onComplete={handleCompleteTarea}
                      onAssign={handleAssignTarea}
                      onCreate={async (cmd) => { if(!id) return; await operativoService.createTarea({ ...cmd, eventoId: parseInt(id) }); await loadData(); }}
                      onUpdate={async (cmd) => { await operativoService.updateTarea(cmd); await loadData(); }}
                      onDelete={async (tareaId) => { if(!window.confirm('¿Eliminar tarea?')) return; await operativoService.deleteTarea(tareaId); await loadData(); }}
                    />

                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Users size={16} className="text-blue-500" /> Personal asignado en tareas
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">Este resumen se llena automáticamente con los responsables elegidos en las tareas de preparación.</p>
                        </div>
                        <span className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-500">
                          {responsablesTareas.length} responsable{responsablesTareas.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      {responsablesTareas.length > 0 ? (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {responsablesTareas.map(nombre => (
                            <div key={nombre} className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                              <div className="w-6 h-6 bg-white text-blue-600 rounded-full flex items-center justify-center text-xs font-bold border border-blue-100">
                                {nombre.charAt(0)}
                              </div>
                              <span className="text-sm font-semibold text-blue-800">{nombre}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                          Aún no hay responsables asignados a las tareas.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'cronograma' && (
                  <div className="space-y-6">
                    <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                      <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900">Control durante la fiesta</h2>
                          <p className="text-sm text-slate-500 mt-1">Vista de mando para saber qué está corriendo, qué sigue y cuántos invitados ya ingresaron.</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold text-slate-500">Servicios activos</p>
                            <p className="text-xl font-bold text-slate-900">{serviciosActivos}/{serviciosConTiempo.length}</p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold text-slate-500">Agenda lista</p>
                            <p className="text-xl font-bold text-slate-900">{progresoAgenda}%</p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold text-slate-500">En salón</p>
                            <p className="text-xl font-bold text-slate-900">{invitadosEnSalon}/{data.invitados.length}</p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold text-slate-500">Siguiente</p>
                            <p className="text-sm font-bold text-slate-900 truncate">{siguienteActividad?.nombre || 'Sin agenda'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 grid grid-cols-1 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-5">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Zap size={16} className="text-blue-500" /> Servicios con tiempo
                              </h3>
                              <p className="text-xs text-slate-500 mt-1">Controla servicios que tienen duración definida, como cabina, show o animación.</p>
                            </div>
                            <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-lg border border-blue-100">
                              {serviciosConTiempo.length}
                            </span>
                          </div>

                          {serviciosConTiempo.length > 0 ? (
                            <div className="space-y-3">
                              {serviciosConTiempo.map(item => {
                                const timer = runningTimers[item.id];
                                const isActive = Boolean(timer?.isActive);
                                const remaining = timer ? Math.max(0, timer.startTime + timer.duration - Date.now()) : item.duracionMinutos * 60 * 1000;
                                const progress = timer ? Math.min(100, Math.max(0, ((timer.duration - remaining) / timer.duration) * 100)) : 0;
                                return (
                                  <div key={item.id} className={`rounded-xl border p-4 transition-colors ${isActive ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-white'}`}>
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                          {item.imagenUrl ? (
                                            item.imagenUrl.match(/\.(mp4|webm|ogg|mov)$/i) || item.imagenUrl.includes('/videos/') ? (
                                              <video src={item.imagenUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                                            ) : (
                                              <img src={item.imagenUrl} alt={item.nombre} className="w-full h-full object-cover" />
                                            )
                                          ) : (
                                            <Clock size={18} />
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-sm font-bold text-slate-900 truncate">{item.nombre}</p>
                                          <p className="text-xs text-slate-500">{item.duracionMinutos} minutos programados</p>
                                        </div>
                                      </div>
                                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border shrink-0 ${isActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                        {isActive ? 'En marcha' : 'Pendiente'}
                                      </span>
                                    </div>

                                    <div className="mt-4">
                                      <div className="flex items-center justify-between text-xs font-bold">
                                        <span className={isActive ? 'text-blue-700' : 'text-slate-500'}>{formatTimerRemaining(remaining)}</span>
                                        <span className="text-slate-400">{Math.round(progress)}%</span>
                                      </div>
                                      <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${isActive ? 'bg-blue-600' : 'bg-slate-300'}`} style={{ width: `${progress}%` }} />
                                      </div>
                                    </div>

                                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                      <p className="text-xs text-slate-500">{isActive ? 'Servicio en desarrollo. Detén el contador cuando termine.' : 'Inicia el contador cuando el servicio comience.'}</p>
                                      <button
                                        onClick={() => toggleTimer(item.id, item.duracionMinutos)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                      >
                                        {isActive ? 'Detener' : 'Iniciar'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-400">
                              No hay servicios con tiempo configurado para esta fiesta.
                            </div>
                          )}
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                          <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-bold text-slate-800">Agenda de la fiesta</h3>
                              <p className="text-xs text-slate-500 mt-1">Orden de actividades para coordinar al equipo durante el evento.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setShowManualActivity(prev => !prev)}
                                className="self-start md:self-center bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold flex items-center gap-1 hover:bg-blue-100 px-3 py-2 rounded-lg"
                              >
                                <Plus size={14} /> Agregar actividad
                              </button>
                              <button
                                onClick={handleAutoCronograma}
                                disabled={savingCronograma}
                                className="self-start md:self-center bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold flex items-center gap-1 hover:bg-emerald-100 px-3 py-2 rounded-lg disabled:opacity-60"
                              >
                                {savingCronograma ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />} Auto-generar agenda
                              </button>
                            </div>
                          </div>

                          <AnimatePresence>
                            {showManualActivity && (
                              <motion.form
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-b border-slate-100 bg-blue-50/30"
                                onSubmit={handleAddActividadManual}
                              >
                                <div className="p-4 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_110px_110px] gap-3">
                                  <input
                                    type="text"
                                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-300"
                                    placeholder="Actividad, por ejemplo: Pastel y fotos"
                                    value={newActividad.nombre}
                                    onChange={e => setNewActividad({ ...newActividad, nombre: e.target.value })}
                                  />
                                  <input
                                    type="time"
                                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-300"
                                    value={newActividad.horaInicio}
                                    onChange={e => setNewActividad({ ...newActividad, horaInicio: e.target.value })}
                                  />
                                  <input
                                    type="time"
                                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-300"
                                    value={newActividad.horaFin}
                                    onChange={e => setNewActividad({ ...newActividad, horaFin: e.target.value })}
                                  />
                                  <input
                                    type="text"
                                    className="md:col-span-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none focus:border-blue-300"
                                    placeholder="Notas opcionales para el equipo"
                                    value={newActividad.descripcion}
                                    onChange={e => setNewActividad({ ...newActividad, descripcion: e.target.value })}
                                  />
                                  <button
                                    type="submit"
                                    disabled={savingCronograma}
                                    className="bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-60"
                                  >
                                    {savingCronograma ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Guardar
                                  </button>
                                </div>
                              </motion.form>
                            )}
                          </AnimatePresence>

                          {actividadesOrdenadas.length > 0 ? (
                            <>
                              <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
                                <div className="flex items-center justify-between text-xs font-bold">
                                  <span className="text-slate-600">{actividadesCompletadas} de {actividadesOrdenadas.length} actividades completadas</span>
                                  <span className="text-slate-400">{progresoAgenda}%</span>
                                </div>
                                <div className="mt-2 h-2 bg-white rounded-full overflow-hidden border border-slate-100">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progresoAgenda}%` }} />
                                </div>
                                {siguienteActividad && (
                                  <div className="mt-4 rounded-lg bg-white border border-slate-200 px-4 py-3">
                                    <p className="text-xs font-bold text-slate-400">Siguiente actividad</p>
                                    <p className="text-sm font-bold text-slate-900 mt-0.5">{siguienteActividad.horaInicio} · {siguienteActividad.nombre}</p>
                                  </div>
                                )}
                              </div>

                              <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
                                {actividadesOrdenadas.map((act, index) => (
                                  <div key={act.id} className={`p-4 flex items-start gap-4 ${act.completada ? 'bg-slate-50/60' : 'hover:bg-slate-50'}`}>
                                    <button
                                      onClick={() => handleToggleActividadCompletada(act.id)}
                                      disabled={savingCronograma}
                                      className={`mt-0.5 w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                                        act.completada ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent hover:border-blue-500 hover:text-blue-500'
                                      }`}
                                      title={act.completada ? 'Marcar como pendiente' : 'Marcar como completada'}
                                    >
                                      <CheckCircle2 size={18} strokeWidth={3} />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold text-blue-600">{act.horaInicio} - {act.horaFin}</span>
                                        <span className="text-xs font-bold text-slate-400">{getDuracionActividad(act.horaInicio, act.horaFin)}</span>
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded border ${
                                          act.completada ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                                        }`}>
                                          {act.completada ? 'Completada' : 'Pendiente'}
                                        </span>
                                      </div>
                                      <p className={`mt-1 text-sm font-bold ${act.completada ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                        {index + 1}. {act.nombre}
                                      </p>
                                      {act.descripcion && <p className="text-xs text-slate-500 mt-1">{act.descripcion}</p>}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleMoveActividad(act.id, 'up')}
                                        disabled={savingCronograma || index === 0}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                                        title="Subir actividad"
                                      >
                                        <ArrowUp size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleMoveActividad(act.id, 'down')}
                                        disabled={savingCronograma || index === actividadesOrdenadas.length - 1}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                                        title="Bajar actividad"
                                      >
                                        <ArrowDown size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteActividad(act.id)}
                                        disabled={savingCronograma}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                                        title="Eliminar actividad"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="p-8">
                              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                                <Clock size={28} className="mx-auto text-slate-300" />
                                <h4 className="mt-3 text-sm font-bold text-slate-800">Aún no hay agenda para esta fiesta</h4>
                                <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">Genera un cronograma base con recepción, juegos, show, comida, pastel y despedida. Luego podrás marcar cada actividad como completada.</p>
                                <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
                                  <button
                                    onClick={handleAutoCronograma}
                                    disabled={savingCronograma}
                                    className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                                  >
                                    {savingCronograma ? 'Generando...' : 'Generar agenda sugerida'}
                                  </button>
                                  <button
                                    onClick={() => setShowManualActivity(true)}
                                    className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-50"
                                  >
                                    Crear actividad manual
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </section>

                    {isScanning && (
                      <div className="bg-slate-900 rounded-xl p-6">
                         <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-white flex items-center gap-2"><QrCode size={18} className="text-blue-400" /> Escáner de ingreso</h3><button onClick={() => setIsScanning(false)} className="text-slate-400 text-xs font-bold underline">Cerrar</button></div>
                         <div id="reader" className="mx-auto max-w-sm rounded-lg overflow-hidden" />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                          <h3 className="text-sm font-bold text-slate-700 mb-4">Registrar invitado</h3>
                          <form className="flex gap-3" onSubmit={handleAddInvitado}><input type="text" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none" placeholder="Nombre..." value={newInvitadoNombre} onChange={e => setNewInvitadoNombre(e.target.value)} /><button type="submit" disabled={addingInvitado} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold">{addingInvitado ? <RefreshCw className="animate-spin" size={16} /> : 'Añadir'}</button></form>
                       </div>
                       <div className="bg-blue-600 rounded-xl p-6 shadow-lg text-white flex items-center justify-between">
                          <div><p className="text-xs font-bold text-blue-100 uppercase mb-1">Invitados</p><p className="text-3xl font-bold">{data.invitados.length} <span className="text-sm font-medium text-blue-200">/ {data.invitados.filter(i => i.ingreso).length} en salón</span></p></div>
                          {!isScanning && <button onClick={() => setIsScanning(true)} className="bg-white text-blue-600 p-3 rounded-xl hover:scale-105 transition-all"><QrCode size={24} /></button>}
                       </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                       <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30">
                          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                             <Users size={16} className="text-blue-500" /> Control de invitados
                          </h3>
                       </div>
                       <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                             <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                   <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invitado</th>
                                   <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                                   <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ingreso</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-50">
                                {data.invitados.map(inv => (
                                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-8 py-6">
                                      <div className="flex items-center gap-4">
                                        <button 
                                          onClick={() => window.open(`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${inv.codigoQr}`, '_blank')}
                                          className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                                        >
                                          <QrCode size={18} />
                                        </button>
                                        <p className="font-bold text-slate-800 tracking-tight">{inv.nombre}</p>
                                      </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                       <span className={`px-4 py-1.5 text-xs font-bold rounded-full border ${
                                          inv.ingreso ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                       }`}>
                                          {inv.ingreso ? 'En salón' : 'Por llegar'}
                                       </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                       {!inv.ingreso ? (
                                         <button 
                                           onClick={() => handleManualCheckIn(inv.id, inv.codigoQr)} 
                                           className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
                                         >
                                           Registrar ingreso
                                         </button>
                                       ) : (
                                         <div className="flex flex-col items-end">
                                            <span className="text-xs font-bold text-slate-800 ">{inv.fechaIngreso ? new Date(inv.fechaIngreso).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--'}</span>
                                            <span className="text-xs font-bold text-slate-400 mt-0.5 text-right">Ingreso registrado</span>
                                         </div>
                                       )}
                                    </td>
                                  </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
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
                          <div><p className="text-xs font-bold text-blue-100 uppercase mb-1">Total Invitados</p><p className="text-3xl font-bold">{data.invitados.length} <span className="text-sm font-medium text-blue-200">/ {data.invitados.filter(i => i.ingreso).length} en salón</span></p></div>
                          {!isScanning && <button onClick={() => setIsScanning(true)} className="bg-white text-blue-600 p-3 rounded-xl hover:scale-105 transition-all"><QrCode size={24} /></button>}
                       </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                       <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                          <h3 className="text-xs font-bold text-slate-400  flex items-center gap-2">
                             <Users size={16} className="text-blue-500" /> Control de Invitados
                          </h3>
                          <div className="flex h-2 w-2 relative">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </div>
                       </div>
                       <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                             <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                   <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invitado</th>
                                   <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Estatus</th>
                                   <th className="px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acción de Ingreso</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-50">
                                {data.invitados.map(inv => (
                                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-8 py-6">
                                      <div className="flex items-center gap-4">
                                        <button 
                                          onClick={() => window.open(`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${inv.codigoQr}`, '_blank')}
                                          className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                                        >
                                          <QrCode size={18} />
                                        </button>
                                        <p className="font-bold text-slate-800 tracking-tight">{inv.nombre}</p>
                                      </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                       <span className={`px-4 py-1.5 text-xs font-bold  rounded-full border ${
                                          inv.ingreso ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                       }`}>
                                          {inv.ingreso ? 'En Salón' : 'Por Llegar'}
                                       </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                       {!inv.ingreso ? (
                                         <button 
                                           onClick={() => handleManualCheckIn(inv.id, inv.codigoQr)} 
                                           className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
                                         >
                                           Registrar ingreso
                                         </button>
                                       ) : (
                                         <div className="flex flex-col items-end">
                                            <span className="text-xs font-bold text-slate-800 ">{inv.fechaIngreso ? new Date(inv.fechaIngreso).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--'}</span>
                                            <span className="text-xs font-bold text-slate-400  mt-0.5 text-right">Ingreso Registrado</span>
                                         </div>
                                       )}
                                    </td>
                                  </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
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
                       <table className="w-full text-left text-sm">
                         <thead className="bg-slate-50 border-b border-slate-100">
                           <tr>
                             <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Colaborador</th>
                             <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
                             <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                          {data.staff.map(member => (
                            <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {member.fotoPerfilUrl ? (
                                    <img src={member.fotoPerfilUrl} alt={member.nombre} className="w-8 h-8 rounded-lg object-cover border border-slate-100" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-100">
                                      {member.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                  )}
                                  <span className="font-semibold text-slate-800">{member.nombre}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-600 font-medium">{member.rol}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded ${member.esPagado ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                  {member.esPagado ? 'Liquidado' : 'Asignado'}
                                </span>
                              </td>
                            </tr>
                          ))}
                         </tbody>
                       </table>
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
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total de Venta</h4>
                          <p className="text-3xl font-bold text-slate-900">${data.precioTotal.toLocaleString()}</p>
                          <div className="mt-2 flex items-center gap-1 text-xs font-bold text-slate-400">
                             <CheckCircle2 size={10} /> Incluye extras y consumos
                          </div>
                       </div>
                       <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CheckCircle2 size={40} className="text-emerald-600" />
                          </div>
                          <p className="text-xs font-bold text-slate-400  mb-1 text-emerald-600">Monto Recaudado</p>
                          <p className="text-3xl font-bold text-emerald-600">${(data.precioTotal - data.saldoPendiente).toLocaleString()}</p>
                          <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-500">
                             <RefreshCw size={10} /> {Math.round(((data.precioTotal - data.saldoPendiente) / data.precioTotal) * 100)}% Completado
                          </div>
                       </div>
                       <div className={`p-6 rounded-2xl shadow-sm relative overflow-hidden group border transition-all ${data.saldoPendiente > 0 ? 'bg-white border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <AlertTriangle size={40} className={data.saldoPendiente > 0 ? 'text-rose-600' : 'text-emerald-600'} />
                          </div>
                          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${data.saldoPendiente > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                            {data.saldoPendiente > 0 ? 'Saldo por Cobrar' : 'Estado de Cuenta'}
                          </p>
                          <p className={`text-3xl font-bold ${data.saldoPendiente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {data.saldoPendiente > 0 ? `$${data.saldoPendiente.toLocaleString()}` : 'LIQUIDADO'}
                          </p>
                          <div className={`mt-2 flex items-center gap-1 text-xs font-bold ${data.saldoPendiente > 0 ? 'text-rose-400' : 'text-emerald-500'}`}>
                             {data.saldoPendiente > 0 ? 'Requiere gestión inmediata' : '¡Excelente! Todo pagado'}
                          </div>
                       </div>
                    </div>

                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Formulario de Registro */}
                        <div className="lg:col-span-4 space-y-6">
                           <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                              <div className="mb-6 flex items-start gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                  <Plus size={18} />
                                </div>
                                <div>
                                  <h3 className="text-sm font-bold text-slate-900">Registrar pago parcial</h3>
                                  <p className="text-xs font-semibold text-slate-400">Cada abono queda en el historial de esta fiesta.</p>
                                </div>
                              </div>
                              <form className="space-y-4" onSubmit={handleRegisterPagoManual}>
                                <div className="space-y-1">
                                   <label className="text-xs font-bold text-slate-500 uppercase">Monto a Ingresar</label>
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
                                   <label className="text-xs font-bold text-slate-500 uppercase">Método de Pago</label>
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
                                   <label className="text-xs font-bold text-slate-500 uppercase">Referencia / Nota</label>
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
                              {data.saldoPendiente <= 0 && (
                                <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                                  Esta fiesta ya no tiene saldo pendiente.
                                </p>
                              )}
                           </div>
                        </div>

                        {/* Historial de Transacciones */}
                        <div className="lg:col-span-8">
                           <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div>
                                  <h3 className="text-sm font-bold text-slate-900">Historial de pagos de la fiesta</h3>
                                  <p className="text-xs font-semibold text-slate-400">Pagos parciales, comprobantes, estados y saldo restante.</p>
                                </div>
                                <span className="text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded-full text-slate-500">
                                   {data.pagos.length} Movimientos
                                </span>
                              </div>
                              <div className="p-5">
                                {data.pagos.length > 0 ? (
                                  <div className="space-y-3">
                                    {data.pagos
                                      .slice()
                                      .sort((a, b) => new Date(a.fechaPago).getTime() - new Date(b.fechaPago).getTime())
                                      .map((p, index, pagosOrdenados) => {
                                        const pagadoHastaAqui = pagosOrdenados
                                          .slice(0, index + 1)
                                          .filter(item => item.estado.toLowerCase() === 'verificado' || item.estado.toLowerCase() === 'finalizado')
                                          .reduce((sum, item) => sum + item.monto, 0);
                                        const saldoDespues = Math.max(data.precioTotal - pagadoHastaAqui, 0);
                                        const estado = p.estado.toLowerCase();

                                        return (
                                          <div key={p.id} className="rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-slate-50">
                                            <div className="grid gap-4 lg:grid-cols-[48px_minmax(0,1fr)_130px_130px_90px] lg:items-center">
                                              <div className={`flex h-12 w-12 items-center justify-center rounded-xl font-black ${
                                                estado === 'pendiente' ? 'bg-amber-50 text-amber-600' :
                                                estado === 'rechazado' ? 'bg-rose-50 text-rose-600' :
                                                'bg-emerald-50 text-emerald-600'
                                              }`}>
                                                #{index + 1}
                                              </div>
                                              <div className="min-w-0">
                                                <p className="font-bold text-slate-900">{p.referencia || 'Pago de evento'}</p>
                                                <p className="mt-1 text-xs font-semibold text-slate-400">
                                                  {new Date(p.fechaPago).toLocaleDateString('es-ES', { day:'2-digit', month:'long', year:'numeric' })}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Abono</p>
                                                <p className="text-base font-black text-slate-900">${p.monto.toLocaleString()}</p>
                                              </div>
                                              <div>
                                                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Saldo después</p>
                                                <p className={`text-base font-black ${saldoDespues > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                  ${saldoDespues.toLocaleString()}
                                                </p>
                                              </div>
                                              <div className="flex items-center justify-end gap-2">
                                                <span className={`px-2 py-1 text-xs font-bold uppercase rounded-full ${
                                                  estado === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                                                  estado === 'rechazado' ? 'bg-rose-100 text-rose-700' :
                                                  'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                  {p.estado}
                                                </span>
                                                {estado === 'pendiente' && (
                                                  <button
                                                    onClick={() => handleVerificarPago(p.id)}
                                                    disabled={verifyingPago === p.id}
                                                    className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50"
                                                    title="Confirmar recepción de fondos"
                                                  >
                                                    {verifyingPago === p.id ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={18} />}
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                            {p.comprobanteUrl && (
                                              <a href={p.comprobanteUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-bold text-blue-600 hover:underline">
                                                Ver comprobante
                                              </a>
                                            )}
                                          </div>
                                        );
                                      })}
                                  </div>
                                ) : (
                                  <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm italic text-slate-400">
                                    No se han registrado pagos para este evento.
                                  </div>
                                )}
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
                             <div className="flex items-center gap-3">
                                <button 
                                  onClick={handlePrintContrato}
                                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all shadow-sm"
                                >
                                  <Printer size={16} />
                                  Contrato
                                </button>
                                <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold text-xs ">
                                  {data.estado}
                                </div>
                             </div>
                             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                               <Users size={18} />
                             </div>
                          <h3 className="text-sm font-bold text-slate-700">Fotos, seguimiento y reseña</h3>
                          </div>
                          <button onClick={() => handleSavePostEvento(false)} disabled={savingPostEvento} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-100 transition-all">
                            {savingPostEvento ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                            Guardar datos
                          </button>
                       </div>
                       <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 ">Enlace de galería externa (Drive/iCloud)</label>
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
                                   <p className="text-xs font-bold text-blue-900 mb-1">Solicitar reseña en Google</p>
                                   <p className="text-xs text-blue-600 leading-relaxed font-medium">Envía un mensaje simple para pedir una reseña después de la fiesta.</p>
                                </div>
                                <button onClick={handleShareReviewRequest} className="bg-white text-blue-600 p-3 rounded-xl border border-blue-200 hover:scale-105 transition-all shadow-sm">
                                  <Plus size={18} />
                                </button>
                             </div>
                          </div>

                          <div className="space-y-6">
                             <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200 group hover:border-emerald-200 transition-all">
                                <div>
                                   <p className="text-xs font-bold text-slate-900 mb-1">Permiso para publicar fotos</p>
                                   <p className="text-xs text-slate-500 font-medium">Autorizado para publicaciones en Instagram/TikTok</p>
                                </div>
                                <button 
                                   onClick={() => setPostFiesta({...postFiesta, consentimientoMarketing: !postFiesta.consentimientoMarketing})}
                                   className={`w-12 h-6 rounded-full transition-all relative ${postFiesta.consentimientoMarketing ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${postFiesta.consentimientoMarketing ? 'left-7' : 'left-1'}`} />
                                </button>
                             </div>

                             <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500  flex items-center gap-2">
                                  <Clock size={12} className="text-blue-500" /> Próximo recordatorio
                                </label>
                                <input 
                                   type="date" 
                                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-all" 
                                   value={postFiesta.fechaProximoContacto} 
                                   onChange={e => setPostFiesta({...postFiesta, fechaProximoContacto: e.target.value})} 
                                />
                                <p className="text-xs text-slate-400 font-medium px-1">Sugerido: 11 meses después de esta fecha.</p>
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
                                 <h3 className="text-sm font-bold text-slate-800">Galería de la fiesta</h3>
                                 <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Fotos y videos</p>
                              </div>
                           </div>
                           <label className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-slate-200">
                              {uploadingMultimedia ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} />}
                              {uploadingMultimedia ? 'Procesando...' : 'Añadir fotos o videos'}
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
                                             <span className="text-xs font-bold text-white/80 bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
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
                                 <p className="text-xs text-slate-400">Sube contenido para que el cliente lo vea en su portal.</p>
                              </div>
                           )}
                        </div>
                    </div>

                    {/* ACCIÓN FINAL DE CIERRE */}
                    <div className="bg-slate-900 rounded-2xl p-10 shadow-2xl shadow-blue-900/20 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
                       <div className="text-center md:text-left relative z-10">
                          <h3 className="text-3xl font-bold text-white mb-3 tracking-tighter italic uppercase">Cierre de la fiesta</h3>
                          <p className="text-slate-400 text-xs max-w-md font-bold  leading-relaxed">
                             Al cerrar, la fiesta quedará archivada. Verifica que no queden pagos, fotos o notas pendientes.
                          </p>
                       </div>
                       <button 
                          onClick={handleFinalizarEvento}
                          disabled={finalizingEvento || data.estado.toLowerCase() !== 'finalizado'}
                          className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-bold  text-xs hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/40 flex items-center gap-4 disabled:bg-slate-800 disabled:text-slate-600 relative z-10"
                       >
                          {finalizingEvento ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                          Cerrar y archivar
                       </button>
                       {data.estado.toLowerCase() !== 'finalizado' && data.estado.toLowerCase() !== 'terminado' && (
                          <p className="absolute bottom-4 left-10 text-xs text-slate-500 font-bold ">
                            La fiesta debe estar finalizada para archivarla.
                          </p>
                       )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
      {/* COMPONENTES DE IMPRESIÓN (OCULTOS) */}
      <div className="hidden print:block">
        {printMode === 'hoja' && <HojaServicioPrint data={data} />}
        {printMode === 'contrato' && <ContratoPrint evento={data} />}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            background: white !important;
            padding: 0 !important;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}} />
    </div>
  );
};

export default DetalleOperativoPage;





