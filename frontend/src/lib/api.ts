const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      cache: 'no-store',
    });

    // A stored token that the API rejects (expired, user suspended/deleted) is useless:
    // clear the session and go to login. Login/register 401s are just wrong credentials.
    if (res.status === 401 && token && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('cp_user');
        if (window.location.pathname !== '/login') window.location.href = '/login';
      }
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}
