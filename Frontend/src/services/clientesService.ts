import apiClient from './apiClient';

export interface Cliente {
  id: number;
  nombreCompleto: string;
  telefono: string;
  direccion: string;
}

export interface CreateClienteCommand {
  nombreCompleto: string;
  telefono: string;
  direccion: string;
}

export const clientesService = {
  getClientes: async (): Promise<Cliente[]> => {
    const response = await apiClient.get('/clientes');
    return response.data;
  },

  createCliente: async (command: CreateClienteCommand): Promise<number> => {
    const response = await apiClient.post('/clientes', command);
    return response.data;
  }
};
