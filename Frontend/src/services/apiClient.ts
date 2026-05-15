import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5131/api';

const apiClient = axios.create({
  baseURL: apiBaseUrl, // URL base del backend .NET
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token a cada petición
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para manejar errores globales
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    
    // Solo redirigir si el error es 401 y NO es una petición de login
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('auth_token');
      const isClientPath = window.location.pathname.startsWith('/cliente');
      window.location.href = isClientPath ? '/cliente/login' : '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
