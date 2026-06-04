import apiClient from './apiClient';

export interface ChatbotConfig {
  habilitado: boolean;
  nombreAsistente: string;
  mensajeBienvenida: string;
  personalidad: string;
  misionEmpresa: string;
  visionEmpresa: string;
  tono: string;
  restricciones: string;
  instruccionesSistema: string;
  modeloProveedor: string;
  modeloNombre: string;
  temperatura: number;
  maxTokens: number;
  mostrarEnLanding: boolean;
  mostrarEnPortalCliente: boolean;
  permitirConsultarEventosCliente: boolean;
  permitirConsultarDisponibilidad: boolean;
  permitirConsultarPaquetes: boolean;
  permitirCrearLeadOReserva: boolean;
  mensajeFallback: string;
  escalarAWhatsApp: boolean;
  whatsappEscalamiento?: string;
  colorPrimario: string;
  posicionWidget: 'bottom-right' | 'bottom-left';
}

export interface ChatbotPublicSettings {
  habilitado: boolean;
  nombreAsistente: string;
  mensajeBienvenida: string;
  mostrarEnLanding: boolean;
  mostrarEnPortalCliente: boolean;
  escalarAWhatsApp: boolean;
  whatsappEscalamiento?: string;
  colorPrimario: string;
  posicionWidget: 'bottom-right' | 'bottom-left';
}

export interface ChatbotMessageResponse {
  conversationId: number;
  reply: string;
  escalateToWhatsApp: boolean;
  whatsapp?: string;
  suggestedActions: ChatbotSuggestedAction[];
}

export interface ChatbotSuggestedAction {
  label: string;
  path: string;
}

export const chatbotService = {
  getAdminConfig: async (): Promise<ChatbotConfig> => {
    const response = await apiClient.get<ChatbotConfig>('/chatbot/config/admin');
    return response.data;
  },

  updateConfig: async (config: ChatbotConfig): Promise<void> => {
    await apiClient.put('/chatbot/config', config);
  },

  getPublicSettings: async (): Promise<ChatbotPublicSettings> => {
    const response = await apiClient.get<ChatbotPublicSettings>('/chatbot/public-settings');
    return response.data;
  },

  sendMessage: async (message: string, conversationId?: number | null): Promise<ChatbotMessageResponse> => {
    const response = await apiClient.post<ChatbotMessageResponse>('/chatbot/message', {
      conversationId,
      message,
      currentPath: window.location.pathname
    });
    return response.data;
  }
};
