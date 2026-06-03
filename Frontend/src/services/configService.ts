import apiClient from './apiClient';

export interface ConfigEntry {
  clave: string;
  valor: string;
}

export const configService = {
  getConfig: async (clave: string): Promise<string> => {
    const response = await apiClient.get<{ valor: string }>(`/config/${clave}`);
    return response.data.valor;
  },

  updateConfig: async (clave: string, valor: string): Promise<void> => {
    await apiClient.post('/config', { clave, valor });
  },

  bulkUpdate: async (items: ConfigEntry[]): Promise<void> => {
    await apiClient.post('/config/bulk', { items });
  },

  getLandingConfig: async () => {
    const response = await apiClient.get<ConfigEntry[]>('/config/landing');
    return response.data;
  }
};
