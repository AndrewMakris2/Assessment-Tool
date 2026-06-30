const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export { API };

export function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function authFetch(url, token, options = {}) {
  return fetch(`${API}${url}`, {
    ...options,
    headers: { ...authHeaders(token), ...options.headers },
  });
}
