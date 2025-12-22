type ApiResponse<T = any> = {
  data?: T;
  error?: string;
};

async function apiFetch<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include', // Important for session cookies
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.message || 'Request failed' };
    }

    return { data };
  } catch (error: any) {
    return { error: error.message || 'Network error' };
  }
}

export const api = {
  // Auth
  signup: (data: any) => apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      passwordHash: btoa(data.password),
    }),
  }),

  login: (email: string, password: string) => apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),

  logout: () => apiFetch('/auth/logout', { method: 'POST' }),

  getMe: () => apiFetch('/auth/me'),

  updateProfile: (data: any) => apiFetch('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  // Tickets
  getTickets: () => apiFetch('/tickets'),

  createTicket: (data: any) => apiFetch('/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Incidents
  getIncidents: () => apiFetch('/incidents'),

  createIncident: (data: any) => apiFetch('/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  resolveIncident: (id: string) => apiFetch(`/incidents/${id}/resolve`, {
    method: 'PATCH',
  }),

  // Contact Messages
  getMessages: () => apiFetch('/messages'),

  createMessage: (data: any) => apiFetch('/messages', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Usage
  getUsage: () => apiFetch('/usage'),
};
