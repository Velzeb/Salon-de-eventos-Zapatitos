import apiClient from './apiClient';

export interface TareaOperativa {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: string;
  asignadoA?: string;
  articuloId?: number;
  eventoItemId?: number;
  tipoTarea: 'Servicio' | 'Inventario' | 'Manual' | string;
  cantidadRequerida: number;
  stockActual: number;
  stockDescontado: boolean;
}

export interface ConsumoExtra {
  id: number;
  servicio: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  fecha: string;
}

export interface StaffOperativo {
  id: number;
  nombre: string;
  rol: string;
  esPagado: boolean;
  fotoPerfilUrl?: string;
}

export interface ItemOperativo {
  id: number;
  nombre: string;
  cantidad: number;
  esIncluidoEnPaquete: boolean;
  tipo: string;
  requiereTemporizador: boolean;
  duracionMinutos: number;
  imagenUrl?: string;
}

export interface EventoOperativo {
  eventoId: number;
  paqueteNombre: string;
  fechaEvento: string;
  horaInicio: string;
  horaFin: string;
  saldoPendiente: number;
  precioTotal: number;
  estado: string;
  notasAdmin?: string;
  tareas: TareaOperativa[];
  consumos: ConsumoExtra[];
  staff: StaffOperativo[];
  items: ItemOperativo[];
  pagos: PagoOperativoDto[];
  clientes: string[];
  protagonistas: { nombre: string; edadCumplir: number }[];
  invitacionToken?: string;

  // === FASE 5 ===
  tematica?: string;
  notasDecoracion?: string;
  cronograma: ActividadCronogramaDto[];
  invitados: InvitadoDto[];

  // === FASE 8 (Post-Fiesta) ===
  linkGaleriaFotos?: string;
  consentimientoMarketing: boolean;
  fechaEntregaFotos?: string;
  fechaProximoContacto?: string;
  galeriaMultimedia: MultimediaEvento[];
}

export interface MultimediaEvento {
  id: number;
  url: string;
  nombreArchivo: string;
  tipoArchivo: string;
  fechaSubida: string;
}

export interface InvitadoDto {
  id: number;
  nombre: string;
  codigoQr: string;
  ingreso: boolean;
  fechaIngreso?: string;
}

export interface ActividadCronogramaDto {
  id: number;
  nombre: string;
  descripcion?: string;
  horaInicio: string;
  horaFin: string;
  orden: number;
  completada: boolean;
  horaInicioReal?: string;
  horaFinReal?: string;
}

export interface PagoOperativoDto {
  id: number;
  monto: number;
  estado: string;
  fechaPago: string;
  comprobanteUrl?: string;
  referencia?: string;
}

export interface AddConsumoCommand {
  eventoId: number;
  servicioId: number;
  empleadoId: number;
  cantidad: number;
  precioUnitarioMomento: number;
}

export interface UpdateBriefingCommand {
  eventoId: number;
  tematica?: string;
  notasDecoracion?: string;
}

export interface UpdateCronogramaCommand {
  eventoId: number;
  actividades: Partial<ActividadCronogramaDto>[];
}

export interface CreateTareaCommand {
  eventoId: number;
  nombreTarea: string;
  descripcion?: string;
  articuloInventarioId?: number;
  cantidadRequerida: number;
}

export interface UpdateTareaCommand {
  tareaId: number;
  nombreTarea: string;
  descripcion?: string;
  articuloInventarioId?: number;
  cantidadRequerida: number;
}

export const operativoService = {
  getEventoOperativo: async (id: number): Promise<EventoOperativo> => {
    const response = await apiClient.get<EventoOperativo>(`/operativo/${id}`);
    return response.data;
  },

  completeTarea: async (id: number): Promise<void> => {
    await apiClient.patch(`/operativo/tareas/${id}/completar`);
  },

  createTarea: async (command: CreateTareaCommand): Promise<number> => {
    const response = await apiClient.post<number>('/operativo/tareas', command);
    return response.data;
  },

  updateTarea: async (command: UpdateTareaCommand): Promise<void> => {
    await apiClient.put(`/operativo/tareas/${command.tareaId}`, {
      nombreTarea: command.nombreTarea,
      descripcion: command.descripcion,
      articuloInventarioId: command.articuloInventarioId,
      cantidadRequerida: command.cantidadRequerida
    });
  },

  deleteTarea: async (tareaId: number): Promise<void> => {
    await apiClient.delete(`/operativo/tareas/${tareaId}`);
  },

  addConsumo: async (command: AddConsumoCommand): Promise<number> => {
    const response = await apiClient.post<number>('/operativo/consumo-extra', command);
    return response.data;
  },

  updateNotas: async (eventoId: number, notas: string): Promise<void> => {
    await apiClient.patch(`/operativo/${eventoId}/notas`, { notas });
  },

  getMetodosPago: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/finanzas/metodos-pago');
    return response.data;
  },

  registerPago: async (command: { eventoId: number, monto: number, metodoPagoId?: number, referencia?: string }): Promise<number> => {
    const response = await apiClient.post<number>('/finanzas/pagos', command);
    return response.data;
  },
  
  assignStaff: async (command: { eventoId: number, empleadoId: number, rol: string }): Promise<number> => {
    const response = await apiClient.post<number>('/operativo/assign-staff', command);
    return response.data;
  },

  assignTarea: async (command: { tareaId: number, empleadoId: number }): Promise<void> => {
    await apiClient.post('/operativo/assign-tarea', command);
  },

  // === FASE 5 ===
  updateBriefing: async (command: UpdateBriefingCommand): Promise<void> => {
    await apiClient.put('/operativo/briefing', command);
  },

  updateCronograma: async (command: UpdateCronogramaCommand): Promise<void> => {
    await apiClient.put('/operativo/cronograma', command);
  },

  addInvitados: async (eventoId: number, nombres: string[]): Promise<void> => {
    await apiClient.post('/operativo/invitados', { eventoId, nombres });
  },

  registrarIngreso: async (codigoQr: string): Promise<string> => {
    const response = await apiClient.post<{ mensaje: string }>('/operativo/invitados/registrar-ingreso', { codigoQr });
    return response.data.mensaje;
  },

  finalizarEvento: async (id: number): Promise<void> => {
    await apiClient.post(`/operativo/${id}/finalizar`);
  },

  updatePostEvento: async (command: { eventoId: number, linkGaleriaFotos?: string, consentimientoMarketing?: boolean, fechaProximoContacto?: string, cerrarDefinitivamente?: boolean }): Promise<void> => {
    await apiClient.post('/operativo/post-evento', command);
  },

  uploadMultimedia: async (eventoId: number, files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    const response = await apiClient.post<string[]>(`/operativo/${eventoId}/multimedia`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deleteMultimedia: async (eventoId: number, multimediaId: number): Promise<void> => {
    await apiClient.delete(`/operativo/${eventoId}/multimedia/${multimediaId}`);
  }
};
