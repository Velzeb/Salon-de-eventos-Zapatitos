import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { clientesService } from '../../../services/clientesService';
import type { Cliente } from '../../../services/clientesService';
import { paquetesService } from '../../../services/paquetesService';
import type { Paquete, Servicio } from '../../../services/paquetesService';
import { ninosService } from '../../../services/ninosService';
import type { Nino } from '../../../services/ninosService';
import { eventosService, type CreateEventoCommand } from '../../../services/eventosService';
import { disponibilidadService } from '../../../services/disponibilidadService';
import type { AvailableSlot } from '../../../services/disponibilidadService';
import { inventarioService, type Articulo } from '../../../services/inventarioService';
import type { EventoItemDto } from '../../../services/eventosService';

export interface CumpleaneroEntry {
  ninoId: string;
  edad: string;
}

export const useReservaForm = (isOpen: boolean, initialDate: Date | null | undefined, onSuccess: () => void, onClose: () => void) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [availableNinos, setAvailableNinos] = useState<Nino[]>([]);
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [formData, setFormData] = useState({
    clienteIds: [] as number[],
    items: [] as EventoItemDto[],
    paqueteId: '',
    cumpleaneros: [{ ninoId: '', edad: '' }] as CumpleaneroEntry[],
    fechaEvento: '',
    horaInicio: '',
    horaFin: '',
    cantidadNinosEstimada: '20',
    notasAdmin: '',
    tematica: '',
    pagoInicial: 0,
    precioFinal: 0,
    isManualPrice: false
  });

  const [recommendedPrice, setRecommendedPrice] = useState(0);

  // 1. Carga inicial de datos (Una sola vez)
  useEffect(() => {
    if (isOpen) {
      loadData();
      if (initialDate && !isNaN(initialDate.getTime())) {
        const dateStr = initialDate.toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, fechaEvento: dateStr }));
      }
    }
  }, [isOpen]); 

  // 2. Sincronizar Niños cuando cambian los Clientes (Comparación por valor para evitar loops)
  const clienteIdsKey = formData.clienteIds.join(',');
  useEffect(() => {
    if (formData.clienteIds.length > 0) {
      loadNinos();
    } else {
      setAvailableNinos([]);
    }
  }, [clienteIdsKey]); 

  // 3. Lógica central de Paquete: Cargar items y Calcular precio (Consolidado)
  useEffect(() => {
    const pkg = paquetes.find(p => p.id.toString() === formData.paqueteId);
    
    // Preparar nuevos items
    let newItems = [...formData.items];
    const currentIncluded = formData.items.filter(i => i.esIncluidoEnPaquete);
    
    if (pkg) {
      // Artículos incluidos
      const pkgArticulos: EventoItemDto[] = pkg.articulos.map(art => ({
        articuloId: art.articuloId,
        nombre: art.nombreArticulo,
        cantidad: art.cantidad,
        notas: '',
        esIncluidoEnPaquete: true,
        precioUnitario: 0
      }));

      // Servicios incluidos (NUEVO: Usando la nueva estructura PaqueteServicio)
      const pkgServicios: EventoItemDto[] = pkg.servicios.map(srv => ({
        servicioId: srv.id,
        nombre: srv.nombre,
        cantidad: srv.cantidad,
        notas: '',
        esIncluidoEnPaquete: true,
        precioUnitario: 0
      }));

      const packageItems = [...pkgArticulos, ...pkgServicios];

      // Solo actualizar si el paquete real de items es distinto al actual del estado
      const pkgItemsSign = JSON.stringify(packageItems);
      const currentPkgSign = JSON.stringify(currentIncluded);
      
      if (pkgItemsSign !== currentPkgSign) {
        newItems = [...formData.items.filter(i => !i.esIncluidoEnPaquete), ...packageItems];
      }
    } else if (currentIncluded.length > 0) {
      newItems = formData.items.filter(i => !i.esIncluidoEnPaquete);
    }

    // Calcular Precio Recomendado
    let total = pkg ? pkg.precioBase : 0;
    newItems.filter(i => !i.esIncluidoEnPaquete).forEach(item => {
      total += (item.precioUnitario * item.cantidad);
    });

    if (total !== recommendedPrice) {
      setRecommendedPrice(total);
    }

    // Evitar actualizaciones de estado si nada ha cambiado realmente
    const shouldUpdateItems = JSON.stringify(newItems) !== JSON.stringify(formData.items);
    const shouldUpdatePrice = !formData.isManualPrice && formData.precioFinal !== total;

    if (shouldUpdateItems || shouldUpdatePrice) {
      setFormData(prev => ({
        ...prev,
        items: newItems,
        precioFinal: prev.isManualPrice ? prev.precioFinal : total
      }));
    }
  }, [formData.paqueteId, paquetes, formData.isManualPrice, formData.items]);

  // 4. Cargar turnos cuando cambia la fecha
  useEffect(() => {
    if (formData.fechaEvento) {
      fetchSlots();
    }
  }, [formData.fechaEvento]);

  const loadData = async () => {
    try {
      const [cData, pData, sData, aData] = await Promise.all([
        clientesService.getClientes(),
        paquetesService.getPaquetes(),
        paquetesService.getServicios(),
        inventarioService.getArticulos()
      ]);
      setClientes(cData);
      setPaquetes(pData);
      setServicios(sData);
      setArticulos(aData);
    } catch (err) {
      console.error('Error loading modal data', err);
    }
  };

  const reloadPaquetes = async () => {
    try {
      const pData = await paquetesService.getPaquetes();
      setPaquetes(pData);
    } catch (err) {
      console.error('Error loading paquetes', err);
    }
  };

  const loadNinos = async () => {
    try {
      const allNinos: Nino[] = [];
      const idsSeen = new Set<number>();
      for (const cid of formData.clienteIds) {
        const ninos = await ninosService.getNinosByCliente(cid);
        ninos.forEach(n => {
          if (!idsSeen.has(n.id)) {
            allNinos.push(n);
            idsSeen.add(n.id);
          }
        });
      }
      setAvailableNinos(allNinos);
    } catch (err) {
      console.error('Error loading ninos', err);
    }
  };

  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const slots = await disponibilidadService.getAvailableSlots(formData.fechaEvento);
      setAvailableSlots(slots);
    } catch (e) {
      console.error('Error fetching slots', e);
    } finally {
      setLoadingSlots(false);
    }
  };

  const calculateAge = (birthDateStr: string, eventDateStr: string) => {
    if (!birthDateStr || !eventDateStr) return '';
    const birthDate = new Date(birthDateStr);
    const eventDate = new Date(eventDateStr);
    // Para fiestas, la "edad a cumplir" suele ser simplemente la diferencia de años
    const age = eventDate.getFullYear() - birthDate.getFullYear();
    return Math.max(0, age).toString();
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (formData.clienteIds.length === 0) newErrors.clienteIds = 'Debe seleccionar al menos un cliente.';
    if (formData.cumpleaneros.some(c => !c.ninoId)) newErrors.cumpleaneros = 'Debe seleccionar a los cumpleañeros.';
    if (!formData.fechaEvento) newErrors.fechaEvento = 'Debe seleccionar la fecha del evento.';
    if (!formData.horaInicio || !formData.horaFin) newErrors.horario = 'Debe seleccionar un turno disponible.';
    if (formData.pagoInicial > formData.precioFinal) newErrors.pagoInicial = 'El abono no puede ser mayor al precio final.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Por favor, revisa los errores en el formulario');
      return;
    }
    setLoading(true);

    try {
      const command: CreateEventoCommand = {
        clienteIds: formData.clienteIds,
        paqueteId: formData.paqueteId ? parseInt(formData.paqueteId) : null,
        cumpleaneros: formData.cumpleaneros
          .filter(c => c.ninoId && c.edad)
          .map(c => ({
            ninoId: parseInt(c.ninoId),
            edad: parseInt(c.edad)
          })),
        fechaEvento: formData.fechaEvento, // Enviar como string "YYYY-MM-DD" para evitar desvíos de zona horaria
        horaInicio: (formData.horaInicio || '00:00') + ':00',
        horaFin: (formData.horaFin || '00:00') + ':00',
        cantidadNinosEstimada: parseInt(formData.cantidadNinosEstimada) || 0,
        pagoInicial: formData.pagoInicial || 0,
        precioTotal: formData.precioFinal || 0,
        tematica: formData.tematica || undefined,
        items: formData.items
      };

      console.log('Sending CreateEventoCommand:', command);
      await eventosService.createEvento(command);
      toast.success('Reserva creada con éxito');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating reserva', err);
      toast.error('Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    clientes,
    setClientes,
    availableNinos,
    loadNinos,
    paquetes,
    servicios,
    articulos,
    reloadPaquetes,
    reloadServicios: loadData,
    loading,
    errors,
    setErrors,
    availableSlots,
    loadingSlots,
    recommendedPrice,
    handleSubmit,
    calculateAge
  };
};
