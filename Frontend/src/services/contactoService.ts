import apiClient from './apiClient';

export interface CreateMensajeCommand {
  nombre: string;
  email: string;
  asunto: string;
  mensaje: string;
}

export const contactoService = {
  createMensaje: async (command: CreateMensajeCommand) => {
    const response = await apiClient.post<number>('/contacto', command);
    return response.data;
  }
};
