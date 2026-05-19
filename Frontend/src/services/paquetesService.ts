import apiClient from './apiClient';

export interface Servicio {
  id: number;
  nombre: string;
  descripcion?: string;
  costoBase: number;
  precioProveedor: number;
  esExtra: boolean;
  tipo: number;
  cantidadMinima: number;
  articuloInventarioId?: number;
  productoProduccionId?: number;
  proveedorId?: number;
  articuloNombre?: string;
  productoNombre?: string;
  proveedorNombre?: string;
  requiereTemporizador: boolean;
  duracionMinutos: number;
  imagenUrl?: string;
}

export interface PaqueteArticulo {
  articuloId: number;
  nombreArticulo: string;
  cantidad: number;
  unidadMedida?: string;
}

export interface PaqueteServicio {
  id: number;
  nombre: string;
  costoBase: number;
  esExtra: boolean;
  cantidad: number;
}

export interface Paquete {
  id: number;
  nombre: string;
  descripcion?: string;
  precioBase: number;
  descuento: number;
  capacidadNinos: number;
  duracionHoras: number;
  servicios: PaqueteServicio[];
  articulos: PaqueteArticulo[];
  imagenUrl?: string;
}

export interface CreatePaqueteCommand {
  nombre: string;
  descripcion?: string;
  precioBase: number;
  descuento: number;
  servicios: { servicioId: number; cantidad: number }[];
  imagenUrl?: string;
}

export interface CreateServicioCommand {
  nombre: string;
  descripcion?: string;
  costoBase: number;
  precioProveedor: number;
  esExtra: boolean;
  tipo: number;
  cantidadMinima: number;
  articuloInventarioId?: number;
  productoProduccionId?: number;
  proveedorId?: number;
  requiereTemporizador: boolean;
  duracionMinutos: number;
  imagenUrl?: string;
}

export const paquetesService = {
  getPaquetes: async (): Promise<Paquete[]> => {
    const response = await apiClient.get<Paquete[]>('/paquetes');
    return response.data;
  },

  getServicios: async (): Promise<Servicio[]> => {
    const response = await apiClient.get<Servicio[]>('/servicios');
    return response.data;
  },

  getServiciosAdicionales: async (): Promise<Servicio[]> => {
    const response = await apiClient.get<Servicio[]>('/paquetes/servicios-adicionales');
    return response.data;
  },

  createPaquete: async (command: CreatePaqueteCommand): Promise<number> => {
    const response = await apiClient.post<number>('/paquetes', command);
    return response.data;
  },

  createServicio: async (command: CreateServicioCommand): Promise<number> => {
    const response = await apiClient.post<number>('/servicios', command);
    return response.data;
  },

  updateServicio: async (id: number, command: CreateServicioCommand): Promise<void> => {
    await apiClient.put(`/servicios/${id}`, { ...command, id });
  },

  deleteServicio: async (id: number): Promise<void> => {
    await apiClient.delete(`/servicios/${id}`);
  }
};
