import apiClient from './apiClient';

export interface Articulo {
  id: number;
  nombre: string;
  descripcion?: string;
  stockActual: number;
  stockMinimo: number;
  controlarStock: boolean;
  unidadMedida?: string;
  precioCosto: number;
  proveedorNombre?: string;
  proveedorId?: number;
}

export interface CreateArticuloCommand {
  nombre: string;
  descripcion?: string;
  stockActual: number;
  stockMinimo: number;
  controlarStock: boolean;
  unidadMedida?: string;
  precioCosto: number;
  proveedorId?: number;
}

export const inventarioService = {
  getArticulos: async (): Promise<Articulo[]> => {
    const response = await apiClient.get<Articulo[]>('/inventario');
    return response.data;
  },

  createArticulo: async (command: CreateArticuloCommand): Promise<number> => {
    const response = await apiClient.post<number>('/inventario', command);
    return response.data;
  },

  updateArticulo: async (id: number, command: CreateArticuloCommand): Promise<void> => {
    await apiClient.put(`/inventario/${id}`, { ...command, id });
  },

  deleteArticulo: async (id: number): Promise<void> => {
    await apiClient.delete(`/inventario/${id}`);
  },

  adjustStock: async (articuloId: number, delta: number): Promise<number> => {
    const response = await apiClient.patch<number>(`/inventario/${articuloId}/stock`, delta);
    return response.data;
  }
};
