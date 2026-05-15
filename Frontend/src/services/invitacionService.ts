import apiClient from './apiClient';

export interface InvitacionPublica {
  nombreCumpleanero: string;
  edad?: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  paquete: string;
  configJson?: string;
  direccion: string;
  nombreNegocio: string;
}

export const invitacionService = {
  getInvitacionByToken: async (token: string): Promise<InvitacionPublica> => {
    // Nota: Usamos apiClient pero este endpoint debe ser público en el backend
    const response = await apiClient.get<InvitacionPublica>(`/invitaciones/${token}`);
    return response.data;
  }
};
