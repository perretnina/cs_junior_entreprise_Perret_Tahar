
export const API_URL = 'http://localhost:3000';

export async function apiRequest(
  path: string,
  options: RequestInit = {},
) {
  const token = sessionStorage.getItem('accessToken');

  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      typeof error?.message === 'string'
        ? error.message
        : `Erreur HTTP ${response.status}`,
    );
  }

  return response.json();
}
