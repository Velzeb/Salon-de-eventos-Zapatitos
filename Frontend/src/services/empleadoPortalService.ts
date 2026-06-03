import apiClient from './apiClient';
import type { EventoOperativo } from './operativoService';

export interface EmpleadoPerfil {
  id: number;
  nombreCompleto: string;
  puesto?: string;
  email: string;
  estado: string;
  fotoPerfilUrl?: string;
}

export interface EmpleadoEvento {
  id: number;
  clientesNombres: string[];
  paqueteNombre: string;
  cumpleaneros: string[];
  fechaEvento: string;
  estado: string;
  saldoPendiente: number;
  horaInicio: string;
  horaFin: string;
  tareasTotales: number;
  tareasCompletadas: number;
  invitadosTotales: number;
  invitadosIngresados: number;
  asignadoAMi: boolean;
  misTareasPendientes: number;
}

export interface EmpleadoJornada {
  perfil: EmpleadoPerfil;
  hoy: EmpleadoEvento[];
  proximos: EmpleadoEvento[];
  tareasPendientes: number;
  eventosEnCurso: number;
}

export const empleadoPortalService = {
  getMe: async (): Promise<EmpleadoPerfil> => {
    const response = await apiClient.get<EmpleadoPerfil>('/empleado/me');
    return response.data;
  },

  getJornada: async (): Promise<EmpleadoJornada> => {
    const response = await apiClient.get<EmpleadoJornada>('/empleado/jornada');
    return response.data;
  },

  getEventos: async (): Promise<EmpleadoEvento[]> => {
    const response = await apiClient.get<EmpleadoEvento[]>('/empleado/eventos');
    return response.data;
  },

  getEvento: async (id: number): Promise<EventoOperativo> => {
    const response = await apiClient.get<EventoOperativo>(`/empleado/eventos/${id}`);
    return response.data;
  },

  completarTarea: async (id: number): Promise<void> => {
    await apiClient.patch(`/empleado/tareas/${id}/completar`);
  },

  completarActividad: async (id: number, completada: boolean): Promise<void> => {
    await apiClient.patch(`/empleado/actividades/${id}/completar`, { completada });
  },

  registrarIngreso: async (codigoQr: string): Promise<string> => {
    const response = await apiClient.post<{ mensaje: string }>('/empleado/invitados/registrar-ingreso', { codigoQr });
    return response.data.mensaje;
  },

  addConsumo: async (command: { eventoId: number; servicioId: number; cantidad: number }): Promise<number> => {
    const response = await apiClient.post<number>('/empleado/consumo-extra', command);
    return response.data;
  },

  getHistorial: async (): Promise<EmpleadoHistorial[]> => {
    const response = await apiClient.get<EmpleadoHistorial[]>('/empleado/historial');
    return response.data;
  }
};

export interface EmpleadoHistorial {
  eventoId: number;
  paqueteNombre: string;
  fechaEvento: string;
  rolEnEvento?: string;
  estadoEvento: string;
  montoAPagar: number;
  esPagado: boolean;
  pagoNominaId?: number;
  fechaPago?: string;
  comprobanteUrl?: string;
  periodoPago?: string;
}
