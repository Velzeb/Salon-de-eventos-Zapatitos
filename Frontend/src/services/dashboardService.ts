import apiClient from './apiClient';

export interface DashboardStats {
  ingresosTotalesProyectados: number;
  ingresosRecaudados: number;
  saldoPendienteTotal: number;
  totalReservasProvisionales: number;
  totalReservasConfirmadas: number;
  tasaConversion: number;
  ticketPromedio: number;
  eventosEsteMes: number;
  diasLibresProximos30Dias: number;
  proximosEventosCriticos: {
    id: number;
    paquete: string;
    cliente: string;
    fecha: string;
    saldoPendiente: number;
    estado: string;
  }[];
  articulosBajoStock: number;
  
  // Campos requeridos por la UI antigua pero que el backend actualizó o no envía
  eventosMesAnterior: number;
  ingresosTotales: number; // Mapear a ingresosTotalesProyectados en la página
  ingresosMesAnterior: number;
  clientesNuevos: number;
  clientesMesAnterior: number;
  stockCritico: number; // Mapear a articulosBajoStock
  chartData: { name: string; ingresos: number; eventos: number }[];
}

export const dashboardService = {
  getStats: async (periodo?: string): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats', { params: { periodo } });
    return response.data;
  }
};
