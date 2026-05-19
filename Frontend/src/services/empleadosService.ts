import apiClient from './apiClient';

export interface Empleado {
  id: number;
  nombreCompleto: string;
  puesto?: string;
  email: string;
  username: string;
  rol: string;
  estado: string;
  fotoPerfilUrl?: string;
}

export interface CreateEmpleadoCommand {
  username: string;
  email: string;
  password: string;
  nombreCompleto: string;
  rol: 'Administrador' | 'Empleado';
  puesto?: string;
  fotoPerfilUrl?: string;
}

export const empleadosService = {
  getEmpleados: async (): Promise<Empleado[]> => {
    const response = await apiClient.get<Empleado[]>('/empleados');
    return response.data;
  },

  createEmpleado: async (command: CreateEmpleadoCommand): Promise<number> => {
    const response = await apiClient.post<number>('/empleados', command);
    return response.data;
  },

  updateEmpleado: async (id: number, command: Omit<CreateEmpleadoCommand, 'username' | 'email' | 'password'> & { empleadoId: number, activo: boolean, fotoPerfilUrl?: string }): Promise<boolean> => {
    const response = await apiClient.put<boolean>(`/empleados/${id}`, command);
    return response.data;
  },

  deleteEmpleado: async (id: number): Promise<boolean> => {
    const response = await apiClient.delete<boolean>(`/empleados/${id}`);
    return response.data;
  }
};
