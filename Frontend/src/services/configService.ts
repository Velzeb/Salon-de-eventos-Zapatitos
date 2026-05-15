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

  // Método auxiliar para obtener múltiples claves comunes
  getLandingConfig: async () => {
    const keys = ['hero_title', 'hero_subtitle', 'hero_image', 'contact_email', 'promo_banner', 'qr_pago_base64', 'contact_phone', 'contact_address', 'social_instagram', 'social_facebook'];
    const results = await Promise.all(
      keys.map(async (k) => ({ clave: k, valor: await configService.getConfig(k).catch(() => '') }))
    );
    return results;
  }
};
