import apiClient from './apiClient';
import { jwtDecode } from 'jwt-decode';

interface LoginApiResponse {
  token: string;
}

interface JwtPayload {
  role?: string | string[];
  unique_name?: string;
  name?: string;
  [key: string]: unknown;
}

export const authService = {
  login: async (email: string, password: string): Promise<string> => {
    // El backend devuelve { Token: "ey..." } como objeto JSON
    const response = await apiClient.post<LoginApiResponse>('/auth/login', {
      email,
      password
    });
    // Soporte para { Token: ... } o { token: ... } (insensible a mayúsculas)
    const token = response.data.token ?? (response.data as any).Token;
    if (!token) throw new Error('El servidor no devolvió un token.');
    localStorage.setItem('auth_token', token);
    return token;
  },

  register: async (payload: { username: string; email: string; password: string; nombreCompleto: string; telefono?: string; }): Promise<number> => {
    const response = await apiClient.post<number>('/auth/register', payload);
    return response.data;
  },

  logout: (redirectTo: string = '/login') => {
    localStorage.removeItem('auth_token');
    window.location.href = redirectTo;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  },

  getRoles: (): string[] => {
    const token = localStorage.getItem('auth_token');
    if (!token) return [];
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const role = decoded.role || (decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string | string[] | undefined);
      if (!role) return [];
      return Array.isArray(role) ? role : [role];
    } catch {
      return [];
    }
  },

  getUserName: () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return '';
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const name = decoded.unique_name || decoded.name || (decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] as string | undefined);
      return name || '';
    } catch {
      return '';
    }
  },

  getUserId: (): number | null => {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const sub = decoded.sub || (decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] as string | undefined);
      return sub ? parseInt(sub as string, 10) : null;
    } catch {
      return null;
    }
  },

  hasRole: (roles: string[]) => {
    const userRoles = authService.getRoles();
    return roles.some(r => userRoles.includes(r));
  }
};
