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

  const error = new Error(
    errData.message || 'Login gagal'
  ) as Error & { status?: number };

  error.status = response.status;

  throw error;
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

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.message || 'Login gagal'
    ) as Error & { status?: number };

    error.status = response.status;

    throw error;
  }

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
    body: JSON.stringify({
      name,
      email,
      password,
      password_confirmation: password
    })
  });

  const data = await response.json();

  if (!response.ok) {
    if (data.errors) {
      const firstError = Object.values(data.errors)[0] as string[];
      throw new Error(firstError[0]);
    }

    throw new Error(data.message || 'Gagal mendaftar');
  }

  return data;
},

  forgotPassword: async (email: string) => {
  const response = await fetch(`${API_URL}/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ email })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Gagal mengirim link reset password');
  }

  return data;
},

resetPassword: async (
  token: string,
  email: string,
  password: string,
  passwordConfirmation: string
) => {
  const response = await fetch(`${API_URL}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      token,
      email,
      password,
      password_confirmation: passwordConfirmation
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Gagal mereset password');
  }

  return data;
},

verifyOtp: async (email: string, otp: string) => {
  const response = await fetch(`${API_URL}/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      email,
      otp,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Verifikasi OTP gagal');
  }

  authService.setToken(data.token);

  return data.user;
},

resendOtp: async (email: string) => {
  const response = await fetch(`${API_URL}/resend-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      email,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Gagal mengirim ulang OTP');
  }

  return data;
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