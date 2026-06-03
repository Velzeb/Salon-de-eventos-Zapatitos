import apiClient from './apiClient';

export interface Evento {
  id: number;
  clientesNombres: string[];
  paqueteNombre: string;
  cumpleaneros: string[];
  fechaEvento: string;
  estado: string;
  precioTotal: number;
  saldoPendiente: number;
  horaInicio: string;
  horaFin: string;
  tareasTotales: number;
  tareasCompletadas: number;
  staffAsignadoCount: number;
  origen: string;
}

export interface EventoItemDto {
  articuloId?: number;
  servicioId?: number;
  nombre: string;
  cantidad: number;
  notas?: string;
  esIncluidoEnPaquete: boolean;
  precioUnitario: number;
}

export interface CreateEventoCommand {
  clienteIds: number[];
  paqueteId?: number | null;
  cumpleaneros: Array<{ ninoId: number; nombre?: string; edad: number }>;
  fechaEvento: string;
  horaInicio: string;
  horaFin: string;
  cantidadNinosEstimada: number;
  pagoInicial: number;
  precioTotal: number;
  comprobantePago?: string;
  origen?: number;
  tematica?: string;
  notasAdmin?: string;
  items: EventoItemDto[];
}

export const eventosService = {
  getEventos: async (): Promise<Evento[]> => {
    const response = await apiClient.get<Evento[]>('/eventos');
    return response.data;
  },

  getCalendarEvents: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/eventos/calendario');
    return response.data;
  },

  createEvento: async (command: CreateEventoCommand): Promise<number> => {
    const response = await apiClient.post<number>('/eventos', command);
    return response.data;
  },

  updateEstado: async (eventoId: number, estado: string): Promise<void> => {
    await apiClient.patch(`/eventos/${eventoId}/estado`, { estado });
  },

  verificarPago: async (eventoId: number, pagoId: number): Promise<void> => {
    await apiClient.patch(`/eventos/${eventoId}/verificar-pago/${pagoId}`);
  }
};
