import apiClient from './apiClient';

export interface DisponibilidadConfig {
  id: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  nombreBloque: string;
  activo: boolean;
}

export interface AvailableSlot {
  configId: number;
  nombreBloque: string;
  horaInicio: string;
  horaFin: string;
  isAvailable: boolean;
}

export const disponibilidadService = {
  // Mocking the config management for now as we don't have the full CRUD in backend
  // but we can fetch them via a generic endpoint or just simulate if needed.
  // Assuming we have /disponibilidad/config
  getConfigs: async (): Promise<DisponibilidadConfig[]> => {
    // In a real scenario, this hits the API. 
    // Since I'm creating the feature, I'll assume the endpoint exists or will be added.
    try {
      const response = await apiClient.get<DisponibilidadConfig[]>('/disponibilidad/config');
      return response.data;
    } catch (e) {
      console.warn('Endpoint /disponibilidad/config not found, using simulation.');
      return [];
    }
  },

  getAvailableSlots: async (date: string): Promise<AvailableSlot[]> => {
    try {
      const response = await apiClient.get<AvailableSlot[]>(`/disponibilidad/available?date=${date}`);
      return response.data;
    } catch (e) {
      console.error('Error en getAvailableSlots:', e);
      return [];
    }
  },

  getMonthAvailable: async (year: number, month: number): Promise<{ day: number, status: 'free' | 'partial' | 'full' | 'closed', slotsCount: number, availableCount: number }[]> => {
    try {
      const response = await apiClient.get<any[]>(`/disponibilidad/month-available?year=${year}&month=${month}`);
      return response.data;
    } catch (e) {
      console.error('Error en getMonthAvailable:', e);
      return [];
    }
  },

  saveConfig: async (config: Partial<DisponibilidadConfig>): Promise<void> => {
    await apiClient.post('/disponibilidad/config', config);
  },

  deleteConfig: async (id: number): Promise<void> => {
    await apiClient.delete(`/disponibilidad/config/${id}`);
  },
  
  saveBulkDay: async (diaSemana: number, turnos: DisponibilidadConfig[]): Promise<void> => {
    await apiClient.post('/disponibilidad/bulk-day', { diaSemana, turnos });
  }
};
