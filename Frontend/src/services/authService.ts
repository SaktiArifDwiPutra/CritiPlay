const API_URL = 'http://127.0.0.1:8000/api';

export const authService = {
  getToken: () => localStorage.getItem('critiplay_token'),
  setToken: (token: string) => localStorage.setItem('critiplay_token', token),
  removeToken: () => localStorage.removeItem('critiplay_token'),

  getProfile: async () => {
    const token = authService.getToken();
    if (!token) return null;
    
    const response = await fetch(`${API_URL}/profile`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Gagal mengambil profil');
    return response.json();
  },

  updateProfile: async (formData: FormData) => {
    const token = authService.getToken();
    const response = await fetch(`${API_URL}/profile`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || 'Gagal memperbarui profil');
    }
    return response.json();
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const errData = await response.json();
      // Tangkap pesan error asli dari Laravel
      throw new Error(errData.message || 'Login gagal');
    }
    
    const data = await response.json();
    authService.setToken(data.token);
    return data.user;
  },

  register: async (name: string, email: string, password: string) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });
    
    if (!response.ok) {
      const errData = await response.json();
      // Laravel biasanya menaruh detail error validasi di object "errors"
      if (errData.errors) {
        const firstError = Object.values(errData.errors)[0] as string[];
        throw new Error(firstError[0]); // Tampilkan error pertama (misal: "The password must be at least 6 characters")
      }
      throw new Error(errData.message || 'Gagal mendaftar');
    }
    
    const data = await response.json();
    authService.setToken(data.token);
    return data.user;
  },

  logout: async () => {
    const token = authService.getToken();
    if (token) {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: { 
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
    }
    authService.removeToken();
  }
};