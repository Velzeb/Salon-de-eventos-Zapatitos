import apiClient from './apiClient';

export const uploadService = {
  uploadImagen: async (file: File, folder: string = 'catalogo'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<{ url: string }>(`/upload/imagen?folder=${folder}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.url;
  },
};
