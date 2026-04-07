const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE || 'auto').toLowerCase();

const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        ...options
    });

    let data = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        const error = new Error(data?.error || 'Erreur API');
        error.status = response.status;
        throw error;
    }

    return data;
};

export const authApi = {
    isBackendEnabled: AUTH_MODE !== 'local',
    isStrictBackend: AUTH_MODE !== 'local',

    getMe: () => fetchJson(`${API_BASE_URL}/auth/me`, { method: 'GET' }),
    login: (payload) => fetchJson(`${API_BASE_URL}/auth/login`, { method: 'POST', body: JSON.stringify(payload) }),
    register: (payload) => fetchJson(`${API_BASE_URL}/auth/register`, { method: 'POST', body: JSON.stringify(payload) }),
    logout: () => fetchJson(`${API_BASE_URL}/auth/logout`, { method: 'POST' }),
    forgotPassword: (payload) => fetchJson(`${API_BASE_URL}/auth/forgot-password`, { method: 'POST', body: JSON.stringify(payload) }),
    resetPassword: (payload) => fetchJson(`${API_BASE_URL}/auth/reset-password`, { method: 'POST', body: JSON.stringify(payload) })
};
