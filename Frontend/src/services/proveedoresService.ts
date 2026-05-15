import apiClient from './apiClient';

export interface Proveedor {
  id: number;
  nombre: string;
  contactoNombre?: string;
  telefono?: string;
  email?: string;
  tipo: number;
}

export interface CreateProveedorCommand {
  nombre: string;
  contactoNombre?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  tipo: number;
}

export const proveedoresService = {
  getProveedores: async (): Promise<Proveedor[]> => {
    const response = await apiClient.get<Proveedor[]>('/proveedores');
    return response.data;
  },

  createProveedor: async (command: CreateProveedorCommand): Promise<number> => {
    const response = await apiClient.post<number>('/proveedores', command);
    return response.data;
  },

  updateProveedor: async (id: number, command: CreateProveedorCommand): Promise<void> => {
    await apiClient.put(`/proveedores/${id}`, { ...command, id });
  },

  deleteProveedor: async (id: number): Promise<void> => {
    await apiClient.delete(`/proveedores/${id}`);
  }
};
