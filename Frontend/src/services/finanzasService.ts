import apiClient from './apiClient';

export interface Pago {
  id: number;
  eventoId: number;
  monto: number;
  estado: string;
  metodoPago?: string;
  fechaPago: string;
  referencia?: string;
  comprobanteUrl?: string;
}

export interface Gasto {
  id: number;
  categoria: string;
  monto: number;
  descripcion: string;
  fecha: string;
}

export interface CategoriaFinanciera {
  id: number;
  nombre: string;
  tipo: string;
}

export interface MetodoPago {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface CuentaPendiente {
  eventoId: number;
  fechaEvento: string;
  saldoPendiente: number;
  paquete: string;
  clientes: string[];
}

export interface NominaEmpleado {
  empleadoId: number;
  nombreEmpleado: string;
  pagoPorEvento: number;
  eventosPendientes: number;
  totalAPagar: number;
  detalles: {
    eventoId: number;
    fecha: string;
    paquete: string;
  }[];
}

export interface RentabilidadReporte {
  totalIngresos: number;
  totalEgresos: number;
  utilidadNeta: number;
}

export interface RegisterPagoCommand {
  eventoId: number;
  metodoPagoId?: number;
  monto: number;
  referencia?: string;
}

export interface AddGastoCommand {
  categoriaId: number;
  monto: number;
  descripcion: string;
}

export const finanzasService = {
  getPagos: async (): Promise<Pago[]> => {
    const response = await apiClient.get<Pago[]>('/finanzas/pagos');
    return response.data;
  },

  getGastos: async (): Promise<Gasto[]> => {
    const response = await apiClient.get<Gasto[]>('/finanzas/gastos');
    return response.data;
  },

  getCategorias: async (): Promise<CategoriaFinanciera[]> => {
    const response = await apiClient.get<CategoriaFinanciera[]>('/finanzas/categorias');
    return response.data;
  },

  getMetodosPago: async (): Promise<MetodoPago[]> => {
    const response = await apiClient.get<MetodoPago[]>('/finanzas/metodos-pago');
    return response.data;
  },

  getCuentasPendientes: async (): Promise<CuentaPendiente[]> => {
    const response = await apiClient.get<CuentaPendiente[]>('/finanzas/cuentas-pendientes');
    return response.data;
  },

  registerPago: async (command: RegisterPagoCommand): Promise<number> => {
    const response = await apiClient.post<number>('/finanzas/pagos', command);
    return response.data;
  },

  verifyPago: async (pagoId: number, isAccepted: boolean): Promise<void> => {
    await apiClient.post(`/finanzas/pagos/${pagoId}/verify`, { isAccepted });
  },

  addGasto: async (command: AddGastoCommand): Promise<number> => {
    const response = await apiClient.post<number>('/finanzas/gastos', command);
    return response.data;
  },

  getNominasPendientes: async (): Promise<NominaEmpleado[]> => {
    const response = await apiClient.get<NominaEmpleado[]>('/finanzas/nominas/pendientes');
    return response.data;
  },

  pagarNomina: async (
    empleadoId: number, 
    comprobanteUrl?: string, 
    eventosIds?: number[], 
    periodo?: string
  ): Promise<number> => {
    const response = await apiClient.post<number>('/finanzas/nominas/pagar', { 
      empleadoId, 
      comprobanteUrl, 
      eventosIds, 
      periodo 
    });
    return response.data;
  },

  getEmpleadoNominas: async (empleadoId: number): Promise<any[]> => {
    const response = await apiClient.get<any[]>(`/finanzas/nominas/historial/${empleadoId}`);
    return response.data;
  },

  getReporteRentabilidad: async (): Promise<RentabilidadReporte> => {
    const response = await apiClient.get<RentabilidadReporte>('/finanzas/reporte-rentabilidad');
    return response.data;
  }
};
