import apiClient from './apiClient';

export interface Nino {
  id: number;
  clienteId: number;
  nombre: string;
  fechaNacimiento?: string;
}

export interface CreateNinoCommand {
  nombre: string;
  fechaNacimiento?: string;
  clienteIds: number[];
}

export const ninosService = {
  getNinosByCliente: async (clienteId: number): Promise<Nino[]> => {
    const response = await apiClient.get(`/clientes/${clienteId}/ninos`);
    return response.data;
  },

  createNino: async (command: CreateNinoCommand): Promise<number> => {
    const response = await apiClient.post('/ninos', command);
    return response.data;
  }
};
