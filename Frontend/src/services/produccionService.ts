import apiClient from './apiClient';

export interface Ingrediente {
    id: number;
    articuloInventarioId: number;
    articuloNombre: string;
    cantidadRequerida: number;
    unidadMedida: string | null;
}

export interface ProductoProduccion {
    id: number;
    nombre: string;
    descripcion: string | null;
    cantidadProducida: number;
    unidadMedida: string | null;
    estado: string;
    imagenUrl?: string;
    ingredientes: Ingrediente[];
}

export interface IngredienteCommand {
    articuloInventarioId: number;
    cantidadRequerida: number;
    unidadMedida: string | null;
}

export interface CreateProductoProduccionCommand {
    nombre: string;
    descripcion: string | null;
    cantidadProducida: number;
    unidadMedida: string | null;
    imagenUrl?: string;
    ingredientes: IngredienteCommand[];
}

export interface UpdateProductoProduccionCommand extends CreateProductoProduccionCommand {
    id: number;
}

export const produccionService = {
    getProductos: async (): Promise<ProductoProduccion[]> => {
        const response = await apiClient.get<ProductoProduccion[]>('/produccion');
        return response.data;
    },

    createProducto: async (command: CreateProductoProduccionCommand): Promise<number> => {
        const response = await apiClient.post<number>('/produccion', command);
        return response.data;
    },

    updateProducto: async (id: number, command: UpdateProductoProduccionCommand): Promise<void> => {
        await apiClient.put(`/produccion/${id}`, command);
    },

    deleteProducto: async (id: number): Promise<void> => {
        await apiClient.delete(`/produccion/${id}`);
    }
};
