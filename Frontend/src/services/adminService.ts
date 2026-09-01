import { authService } from './authService';

const API_URL = 'http://127.0.0.1:8000/api/admin';

export const adminService = {
  getAllUsers: async () => {
    const token = authService.getToken();
    const response = await fetch(`${API_URL}/users`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.message || 'Gagal mengambil data admin (Server Error)');
    }
    
    return response.json();
  }
};