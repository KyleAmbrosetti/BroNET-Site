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
    body: JSON.stringify(data),
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

  // Coverage
  getCoverageStatus: () => apiFetch('/coverage/status'),

  checkCoverage: (address: string) => apiFetch('/coverage/check', {
    method: 'POST',
    body: JSON.stringify({ address }),
  }),

  getCoverageHistory: () => apiFetch('/coverage/history'),

  // Admin: NBN Dataset
  getNbnDataset: () => apiFetch('/admin/nbn-dataset'),

  uploadNbnDataset: (data: any[], replace: boolean) => apiFetch('/admin/nbn-dataset/upload', {
    method: 'POST',
    body: JSON.stringify({ data, replace }),
  }),

  deleteNbnDataset: () => apiFetch('/admin/nbn-dataset', {
    method: 'DELETE',
  }),

  // Modem Enquiries
  createModemEnquiry: (data: any) => apiFetch('/modems/enquiry', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getModemEnquiries: () => apiFetch('/modems/enquiry'),

  getAllModemEnquiries: () => apiFetch('/admin/modems/enquiry'),

  updateModemEnquiryStatus: (id: string, status: string) => apiFetch(`/admin/modems/enquiry/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
};
