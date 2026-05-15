import apiClient from './apiClient';

export interface ClienteEvento {
  id: number;
  fechaEvento: string;
  estado: string;
  paquete: string;
  precioTotal: number;
  saldoPendiente: number;
  nombreCumpleanero: string;
}

export interface EventoItemCliente {
  nombre: string;
  cantidad: number;
  esExtra: boolean;
  precio: number;
}

export interface PagoCliente {
  id: number;
  monto: number;
  estado: string;
  fechaPago: string;
  referencia?: string;
  comprobanteUrl?: string;
}

export interface MultimediaEvento {
  id: number;
  url: string;
  nombreArchivo: string;
  tipoArchivo: string;
  fechaSubida: string;
}

export interface EventoClienteDetail {
  id: number;
  nombreCumpleaneros: string;
  paquete: string;
  fechaEvento: string;
  horaInicio: string;
  horaFin: string;
  nombreNegocio: string;
  direccion: string;
  estado: string;
  precioTotal: number;
  saldoPendiente: number;
  invitacionToken?: string;
  yaCalificado: boolean;
  consentimientoMarketing: boolean;
  tematica?: string;
  colorManteleria?: string;
  saborPastel?: string;
  notasDecoracion?: string;
  alergias?: string;
  items: EventoItemCliente[];
  fotosUrls: string[];
  galeriaMultimedia: MultimediaEvento[];
  pagos: PagoCliente[];
}

export interface AddFeedbackCommand {
  eventoId: number;
  calificacion: number;
  comentario?: string;
}

export interface PerfilCliente {
  id: number;
  nombreCompleto: string;
  telefono?: string;
  direccion?: string;
  email: string;
  ninos: NinoPerfil[];
}

export interface NinoPerfil {
  id: number;
  nombre: string;
  fechaNacimiento: string;
  edad: number;
}

export const clientePortalService = {
  getMisEventos: async (): Promise<ClienteEvento[]> => {
    const response = await apiClient.get<ClienteEvento[]>('/clientes/mis-eventos');
    return response.data;
  },

  getEventoDetail: async (id: number): Promise<EventoClienteDetail> => {
    const response = await apiClient.get<EventoClienteDetail>(`/clientes/mis-eventos/${id}`);
    return response.data;
  },

  addFeedback: async (command: AddFeedbackCommand): Promise<number> => {
    const response = await apiClient.post<number>('/clientes/feedback', command);
    return response.data;
  },

  addPagoQR: async (eventoId: number, montoAbonado: number, comprobanteBase64: string): Promise<number> => {
    const response = await apiClient.post<number>(`/clientes/mis-eventos/${eventoId}/pagos-qr`, {
      eventoId,
      montoAbonado,
      comprobanteBase64
    });
    return response.data;
  },

  getPerfil: async (): Promise<PerfilCliente> => {
    const response = await apiClient.get<PerfilCliente>('/clientes/perfil');
    return response.data;
  },

  updatePerfil: async (data: { nombreCompleto: string; telefono?: string; direccion?: string }): Promise<void> => {
    await apiClient.put('/clientes/perfil', data);
  }
};
