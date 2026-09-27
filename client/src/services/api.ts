const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE = configuredApiUrl
  ? `${configuredApiUrl.replace(/\/$/, '')}/api/v1`
  : import.meta.env.PROD
    ? 'https://verimeasure.onrender.com/api/v1'
    : '/api/v1';

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

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Network response was not ok' }));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }

  return res.json();
}
