import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim() || 'https://verimeasure.onrender.com';
const normalizedApiUrl = configuredApiUrl.replace(/\/$/, '');
const API_BASE = normalizedApiUrl.endsWith('/api/v1')
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api/v1`;

export function getToken(): string | null {
  return localStorage.getItem('vm_token');
}

export function setToken(token: string) {
  localStorage.setItem('vm_token', token);
}

export function clearToken() {
  localStorage.removeItem('vm_token');
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let data = options.body;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      data = options.body;
    }
  }

  try {
    const response = await axios({
      baseURL: API_BASE,
      url: endpoint,
      method: options.method || 'GET',
      headers,
      data
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || error.message || 'Network response was not ok';
      throw new Error(message);
    }

    throw error;
  }
}
