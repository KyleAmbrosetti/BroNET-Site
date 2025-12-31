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

  getAllTickets: () => apiFetch('/admin/tickets'),

  getAdminTicket: (id: string) => apiFetch(`/admin/tickets/${id}`),

  addAdminTicketReply: (id: string, message: string) => apiFetch(`/admin/tickets/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),

  updateAdminTicketStatus: (id: string, status: string) => apiFetch(`/admin/tickets/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  getAllContactMessages: () => apiFetch('/admin/messages'),

  updateModemEnquiryStatus: (id: string, status: string) => apiFetch(`/admin/modems/enquiry/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  // Chat
  getChatConfigStatus: () => apiFetch('/chat/config-status'),

  exportChatToTicket: (conversationId: number, subject: string) => apiFetch('/chat/export-ticket', {
    method: 'POST',
    body: JSON.stringify({ conversationId, subject }),
  }),

  // User Management
  changePlan: (planId: string) => apiFetch('/user/plan', {
    method: 'POST',
    body: JSON.stringify({ planId }),
  }),

  updateAddress: (serviceAddress: string) => apiFetch('/user/address', {
    method: 'PUT',
    body: JSON.stringify({ serviceAddress }),
  }),

  changePassword: (oldPassword: string, newPassword: string) => apiFetch('/user/password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword }),
  }),

  getBillingHistory: () => apiFetch('/billing'),

  // Stripe
  getStripeProducts: () => apiFetch('/stripe/products'),
  
  getStripeConfig: () => apiFetch('/stripe/config'),
  
  createCheckoutSession: (priceId: string, planName: string, orderDetails?: {
    planId?: string;
    serviceAddress?: string;
    locId?: string;
    csaId?: string;
    sqReference?: string;
    avcId?: string;
    technology?: string;
    downloadSpeed?: number;
    uploadSpeed?: number;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    preferredDate?: string;
    routerOption?: string;
    promoCode?: string;
  }) => apiFetch('/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify({ priceId, planName, ...orderDetails }),
  }),
  
  createBillingPortal: () => apiFetch('/stripe/portal', {
    method: 'POST',
  }),

  // Address suggestions
  getAddressSuggestions: (query: string) => apiFetch(`/coverage/suggest?q=${encodeURIComponent(query)}`),

  // Orders
  getOrders: () => apiFetch('/orders'),
  
  getOrder: (orderId: string) => apiFetch(`/orders/${orderId}`),
  
  createOrder: (data: any) => apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  qualifyOrder: (address: string, locId?: string) => apiFetch('/orders/qualify', {
    method: 'POST',
    body: JSON.stringify({ address, locId }),
  }),
  
  updateOrderStatus: (orderId: string, status: string) => apiFetch(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  
  activateOrder: (orderId: string) => apiFetch(`/orders/${orderId}/activate`, {
    method: 'POST',
  }),

  // Admin Orders
  getAdminOrders: () => apiFetch('/admin/orders'),
  
  getAdminOrder: (id: string) => apiFetch(`/admin/orders/${id}`),
  
  updateAdminOrderStatus: (id: string, status: string, message?: string) => apiFetch(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, message }),
  }),
  
  updateAdminOrderAvcId: (id: string, avcId: string) => apiFetch(`/admin/orders/${id}/avc`, {
    method: 'PATCH',
    body: JSON.stringify({ avcId }),
  }),
  
  deleteAdminOrder: (id: string) => apiFetch(`/admin/orders/${id}`, {
    method: 'DELETE',
  }),

  exportAdminOrders: (orderIds?: string[]) => {
    const params = orderIds && orderIds.length > 0 ? `?ids=${orderIds.join(',')}` : '';
    return `/api/admin/orders/export${params}`;
  },

  bulkUpdateOrderStatus: (orderIds: string[], status: string, message?: string) => apiFetch('/admin/orders/bulk-status', {
    method: 'POST',
    body: JSON.stringify({ orderIds, status, message }),
  }),

  // Admin User Management
  getAdminUsers: () => apiFetch('/admin/users'),

  disableAdminUser: (id: string) => apiFetch(`/admin/users/${id}/disable`, {
    method: 'PATCH',
  }),

  enableAdminUser: (id: string) => apiFetch(`/admin/users/${id}/enable`, {
    method: 'PATCH',
  }),

  resetAdminUserPassword: (id: string) => apiFetch(`/admin/users/${id}/reset-password`, {
    method: 'POST',
  }),

  // Admin Analytics
  getAdminAnalytics: () => apiFetch('/admin/analytics'),

  // Plans
  getPlans: () => apiFetch('/plans'),

  getAdminPlans: () => apiFetch('/admin/plans'),

  createAdminPlan: (data: any) => apiFetch('/admin/plans', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateAdminPlan: (id: string, data: any) => apiFetch(`/admin/plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  deleteAdminPlan: (id: string) => apiFetch(`/admin/plans/${id}`, {
    method: 'DELETE',
  }),
};
