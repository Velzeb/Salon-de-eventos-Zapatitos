import apiClient from './apiClient';

export interface ChartItem {
  name: string;
  ingresos: number;
  eventos: number;
}

export interface DashboardStats {
  eventosEsteMes: number;
  ingresosTotales: number;
  clientesNuevos: number;
  stockCritico: number;
  eventosMesAnterior: number;
  ingresosMesAnterior: number;
  clientesMesAnterior: number;
  chartData: ChartItem[];
}

export const dashboardService = {
  getStats: async (periodo: 'Semana' | 'Mes' | 'Año' = 'Semana'): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats', {
      params: { periodo }
    });
    return response.data;
  }
};
