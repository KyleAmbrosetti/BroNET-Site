import * as crypto from 'crypto';

interface SuperloopConfig {
  clientId: string;
  privateKey: string;
  baseUrl: string;
  authUrl: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// Location Search Types
export interface LocationSearchRequest {
  sourceType: 'nbn' | 'uniti';
  streetNumber?: string;
  streetName: string;
  streetType?: string;
  streetTypeSuffix?: string;
  suburb: string;
  state: string;
  countryCode?: string;
  postcode?: string;
}

export interface LocationSearchResult {
  id: string;
  description: string;
}

// Fee and Charge Types
export interface MoneyAmount {
  amount: string;
  currency: string;
  symbol: string;
}

export interface Fee {
  name: string;
  oneTimeCharge: MoneyAmount;
  monthlyRecurringCharge: MoneyAmount;
}

// Generation 2 NTD Types (September 2025 Updates)
export interface GenerationTwoNtd {
  name: string;
  ntdType: string;
  ntdVersion: string;
  ntdPlanTypes: string[];
  fees: Fee[];
}

export interface PlanOption {
  name: string;
  type: string;
  speedDown: number;
  speedUp: number;
  ntdOptions: string[];
}

// Infrastructure Types
export interface Infrastructure {
  id: string;
  ntdType?: string;
  ntdVersion?: string;
  plans?: string;
  remainingDownstreamBandwidth?: number;
  remainingUpstreamBandwidth?: number;
  ports?: InfrastructurePort[];
  installationOptions?: InstallationOption[];
}

export interface InfrastructurePort {
  id: number;
  status: string;
  serviceStatus?: string;
}

export interface InstallationOption {
  option: string;
  recommended: boolean;
  fees: Fee[];
  hardwareShortfall?: string;
}

// Service Qualification Types
export interface QualificationResult {
  qualificationSearchId: string;
  remoteQualificationSearchId: string;
  locationId: string;
  locId: string;
  technologyType: string;
  serviceClass: number;
  maxDownload: number;
  maxUpload: number;
  available: boolean;
  region: string;
  poi?: string;
  poiName?: string;
  hasActivePOTS?: boolean;
  serviceType?: string;
  potsInterconnectMatch?: boolean;
  generationTwoNtds?: GenerationTwoNtd[];
  firstOrAdditionalNtdPlans?: PlanOption[];
  generationOneNtdPlans?: PlanOption[];
  generationTwoNtdPlans?: PlanOption[];
  infrastructures?: Infrastructure[];
  infrastructureInstallationOptions?: InstallationOption[];
  plans?: QualificationPlan[];
}

export interface QualificationPlan {
  name: string;
  type: string;
  speedDown: number;
  speedUp: number;
  term: number;
  fee: {
    attributes: Record<string, any>;
    oneTimeCharge: MoneyAmount;
    monthlyRecurringCharge: MoneyAmount;
  };
}

// Order Types
export interface OrderRequest {
  sourceType: string;
  customerReference?: string;
  quoteName?: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  remoteQualificationSearchId: string;
  qualificationSearchId: string;
  remoteOrderId: string;
  locationId: string;
  planName: string;
  term: number;
  trafficClass: string;
  productType?: string;
  restorationSla: string;
  potsServiceOwner?: boolean;
  potsWaiver?: boolean;
  infrastructureId?: string;
  portId?: number;
  requireVLAN: boolean;
  vlanId?: number;
  ntdInstallation: string;
  ntdName?: string;
  ntdPhoneNumber?: string;
  ntdSameAddressDelivery?: boolean;
  ntdBusinessName?: string;
  ntdAddressLine1?: string;
  ntdAddressLine2?: string;
  ntdSuburb?: string;
  ntdPostcode?: string;
  ntdState?: string;
  ntdAuthorityToLeave?: boolean;
  ntdDeliveryInstructions?: string;
  aggregationMethod: string;
  avcIdForTransfer?: string;
  transferType?: 'SERVICE_TRANSFER' | 'CONNECT_OUTSTANDING';
  ntdOption?: string;
}

export interface OrderResponse {
  id: number;
  orderType: string;
  status: string;
  serviceClass: string;
  technologyType: string;
  trafficClass: string;
  installationType?: string;
  customerRef?: string;
  locId: string;
  avcId?: string;
  avcIdForTransfer?: string;
  vlanId?: number;
  poi?: string;
  poiName?: string;
  region?: string;
  eSla?: string;
  bandwidthProfile: {
    speedDown: number;
    speedUp: number;
    planName: string;
    cvcInclusion?: number;
  };
  infrastructure?: {
    id: string;
    portId?: string;
    productId?: string;
  };
  address?: {
    buildingLevel?: string;
    unitNumber?: string;
    buildingName?: string;
    streetNumber?: string;
    street?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    formattedAddress?: string;
  };
  fee?: {
    attributes: Record<string, any>;
    oneTimeCharge: MoneyAmount;
    monthlyRecurringCharge: MoneyAmount;
  };
  additionalFees?: Array<{
    addOnTypeName: string;
    fee: {
      attributes: Record<string, any>;
      oneTimeCharge: MoneyAmount;
      monthlyRecurringCharge: MoneyAmount;
    };
  }>;
  appointments?: Appointment[];
}

export interface Appointment {
  id: number;
  nbnAppointmentId?: string;
  slotType?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
}

// Service Types
export interface ServiceInfo {
  id: number;
  customerRef: string;
  nbnServiceActivatedOn?: string;
  technologyType: string;
  trafficClass: string;
  locId: string;
  avcId: string;
  vlanId?: number;
  poi?: string;
  poiName?: string;
  region?: string;
  eSla?: string;
  bandwidthProfile: {
    speedDown: number;
    speedUp: number;
    planName: string;
    cvcInclusion?: number;
  };
  infrastructure?: {
    id: string;
    ntdType?: string;
    ntdVersion?: string;
  };
}

// Plan Change Types
export interface PlanChangeOption {
  sourceType: string;
  accessTechnology: string;
  plan: string;
  term: string;
  downSpeed: { speed: number; unit: string };
  upSpeed: { speed: number; unit: string };
  requiresAdditionalNtd?: boolean;
  requiresAdditionalNtdReason?: string;
  ntdOptions?: NtdUpgradeOption[];
  planFee?: {
    attributes: Record<string, any>;
    oneTimeCharge: MoneyAmount;
    monthlyRecurringCharge: MoneyAmount;
  };
}

export interface NtdUpgradeOption {
  name: string;
  ntdType: string;
  ntdVersion: string;
  fees: Fee[];
}

export interface PlanChangeRequest {
  serviceId: number;
  planName: string;
  term: number;
  ntdOption?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

// Appointment Types
export interface AppointmentSlot {
  id: string;
  slotType: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface AppointmentRequest {
  orderId: number;
  dateFrom: string;
}

// AVC Service Qualification Types
export interface AvcQualificationResult {
  avcId: string;
  locId: string;
  technologyType: string;
  serviceClass: number;
  trafficClass: string;
  currentPlan: string;
  currentSpeedDown: number;
  currentSpeedUp: number;
  transferable: boolean;
  transferBlockReason?: string;
}

export class SuperloopClient {
  private config: SuperloopConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    const useSandbox = process.env.SUPERLOOP_USE_SANDBOX === 'true';
    
    this.config = {
      clientId: process.env.SUPERLOOP_CLIENT_ID || 'slc-360-vip',
      privateKey: process.env.SUPERLOOP_PRIVATE_KEY || '',
      baseUrl: useSandbox 
        ? 'https://360-api-sandbox.superloop.com/api'
        : 'https://360-api.superloop.com/api',
      authUrl: useSandbox
        ? 'https://sso-sandbox.superloop.com/auth/realms/superloop/protocol/openid-connect/token'
        : 'https://sso.superloop.com/auth/realms/superloop/protocol/openid-connect/token'
    };
  }

  private generateJwtAssertion(): string {
    const now = Math.floor(Date.now() / 1000);
    
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const payload = {
      iss: this.config.clientId,
      sub: this.config.clientId,
      aud: this.config.authUrl,
      iat: now,
      exp: now + 300,
      jti: crypto.randomUUID()
    };

    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signatureInput = `${base64Header}.${base64Payload}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    const signature = sign.sign(this.config.privateKey, 'base64url');

    return `${signatureInput}.${signature}`;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const jwtAssertion = this.generateJwtAssertion();

    const response = await fetch(this.config.authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: jwtAssertion
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Superloop auth failed: ${error}`);
    }

    const data: TokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
    
    return this.accessToken;
  }

  private async apiRequest<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<T> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Authorization': `Bearer ${token}`,
        'X-API-VERSION': '8',
        'Host': new URL(this.config.baseUrl).host
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (response.status === 201) {
      const location = response.headers.get('Location');
      if (location) {
        return await this.pollForResult<T>(location);
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Superloop API error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  private async pollForResult<T>(location: string, maxAttempts: number = 30): Promise<T> {
    const token = await this.getAccessToken();
    
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`${this.config.baseUrl}${location}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-VERSION': '8'
        }
      });

      if (response.status === 200) {
        return response.json();
      }

      if (response.status === 202) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      const error = await response.json().catch(() => ({}));
      throw new Error(`Superloop polling error: ${JSON.stringify(error)}`);
    }

    throw new Error('Superloop API timeout - operation did not complete');
  }

  // Parse a simple address string into structured components
  private parseAddress(address: string): LocationSearchRequest {
    const parts = address.split(',').map(p => p.trim());
    
    // Extract state and postcode from last part
    const lastPart = parts[parts.length - 1] || '';
    const statePostcodeMatch = lastPart.match(/([A-Z]{2,3})\s*(\d{4})?/i);
    const state = statePostcodeMatch?.[1]?.toUpperCase() || 'NSW';
    const postcode = statePostcodeMatch?.[2];
    
    // Extract suburb (second to last part usually)
    const suburb = parts.length > 1 ? parts[parts.length - 2] || parts[0] : parts[0];
    
    // Parse street address from first part
    const streetPart = parts[0] || '';
    const streetMatch = streetPart.match(/^(\d+[A-Za-z]?)\s+(.+?)(?:\s+(ST|STREET|RD|ROAD|AVE|AVENUE|DR|DRIVE|CT|COURT|PL|PLACE|WAY|CL|CLOSE|CR|CRESCENT|TCE|TERRACE|HWY|HIGHWAY|BVD|BOULEVARD|LN|LANE|CIR|CIRCLE))?$/i);
    
    return {
      sourceType: 'nbn',
      streetNumber: streetMatch?.[1] || '',
      streetName: streetMatch?.[2] || streetPart,
      streetType: streetMatch?.[3]?.toUpperCase(),
      suburb: suburb.replace(/\s*[A-Z]{2,3}\s*\d{4}$/i, '').trim(),
      state,
      postcode,
      countryCode: 'AU'
    };
  }

  // Location search with simple address string (legacy compatibility)
  async searchLocation(address: string): Promise<LocationSearchResult[]> {
    const parsed = this.parseAddress(address);
    return this.searchLocationStructured(parsed);
  }

  // Location search with structured address (recommended)
  async searchLocationStructured(request: LocationSearchRequest): Promise<LocationSearchResult[]> {
    return this.apiRequest<LocationSearchResult[]>(
      'POST',
      '/connect/location-searches/request',
      request
    );
  }

  // Service qualification with full response including Gen 2 NTD data
  async qualifyLocation(locationId: string): Promise<QualificationResult> {
    return this.apiRequest<QualificationResult>(
      'POST',
      '/connect/qualification-searches/request',
      { sourceType: 'nbn', locationId }
    );
  }

  // Create order with full support for new fields
  async createOrder(order: Partial<OrderRequest> & {
    sourceType: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    qualificationSearchId: string;
    locationId: string;
    planName: string;
    term: number;
    trafficClass: string;
    restorationSla: string;
    aggregationMethod: string;
  }): Promise<OrderResponse> {
    const fullOrder: OrderRequest = {
      sourceType: order.sourceType,
      customerReference: order.customerReference,
      quoteName: order.quoteName,
      contactName: order.contactName,
      contactPhone: order.contactPhone.replace(/\s/g, ''),
      contactEmail: order.contactEmail,
      remoteQualificationSearchId: order.remoteQualificationSearchId || order.qualificationSearchId,
      qualificationSearchId: order.qualificationSearchId,
      remoteOrderId: order.remoteOrderId || `BRO-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      locationId: order.locationId,
      planName: order.planName,
      term: order.term,
      trafficClass: order.trafficClass,
      productType: order.productType || 'Access Only',
      restorationSla: order.restorationSla,
      potsServiceOwner: order.potsServiceOwner,
      potsWaiver: order.potsWaiver,
      infrastructureId: order.infrastructureId,
      portId: order.portId,
      requireVLAN: order.requireVLAN ?? false,
      vlanId: order.vlanId,
      ntdInstallation: order.ntdInstallation || 'nbn-tech',
      ntdName: order.ntdName,
      ntdPhoneNumber: order.ntdPhoneNumber,
      ntdSameAddressDelivery: order.ntdSameAddressDelivery,
      ntdBusinessName: order.ntdBusinessName,
      ntdAddressLine1: order.ntdAddressLine1,
      ntdAddressLine2: order.ntdAddressLine2,
      ntdSuburb: order.ntdSuburb,
      ntdPostcode: order.ntdPostcode,
      ntdState: order.ntdState,
      ntdAuthorityToLeave: order.ntdAuthorityToLeave,
      ntdDeliveryInstructions: order.ntdDeliveryInstructions,
      aggregationMethod: order.aggregationMethod,
      avcIdForTransfer: order.avcIdForTransfer,
      transferType: order.transferType,
      ntdOption: order.ntdOption,
    };

    return this.apiRequest<OrderResponse>(
      'POST',
      '/connect/orders/create',
      fullOrder
    );
  }

  async getOrder(orderId: number): Promise<OrderResponse> {
    return this.apiRequest<OrderResponse>(
      'GET',
      `/connect/orders/${orderId}`
    );
  }

  async listOrders(status?: string): Promise<OrderResponse[]> {
    const endpoint = status ? `/connect/orders?status=${status}` : '/connect/orders';
    return this.apiRequest<OrderResponse[]>('GET', endpoint);
  }

  async getService(serviceId: number): Promise<ServiceInfo> {
    return this.apiRequest<ServiceInfo>(
      'GET',
      `/connect/services/${serviceId}`
    );
  }

  async listServices(): Promise<ServiceInfo[]> {
    return this.apiRequest<ServiceInfo[]>('GET', '/connect/services');
  }

  // Appointment management
  async requestAppointmentSlots(orderId: number, dateFrom: string): Promise<AppointmentSlot[]> {
    return this.apiRequest<AppointmentSlot[]>(
      'POST',
      '/connect/orders/appointment-requests/request',
      { orderId, dateFrom }
    );
  }

  async bookAppointment(appointmentRequestId: number, slotId: string): Promise<Appointment> {
    return this.apiRequest<Appointment>(
      'POST',
      '/connect/orders/appointments/request',
      { appointmentRequestId, slotId }
    );
  }

  async cancelAppointment(orderId: number, reason?: string): Promise<void> {
    await this.apiRequest<void>(
      'POST',
      '/connect/orders/appointments/cancel',
      { orderId, reason }
    );
  }

  // Service management
  async cancelService(serviceId: number, reason?: string): Promise<void> {
    await this.apiRequest<void>(
      'POST',
      '/connect/services/cancellations/request',
      { serviceId, reason }
    );
  }

  // Get plan change options (includes Gen 2 NTD upgrade info for high-speed plans)
  async getPlanChangeOptions(serviceId: number): Promise<{ plans: PlanChangeOption[] }> {
    return this.apiRequest<{ plans: PlanChangeOption[] }>(
      'GET',
      `/connect/services/${serviceId}/plan-change-options`
    );
  }

  // Request plan change with optional NTD upgrade for high-speed plans
  async changePlan(request: PlanChangeRequest): Promise<any> {
    return this.apiRequest<any>(
      'POST',
      '/connect/services/plan-changes/request',
      request
    );
  }

  // Legacy changePlan signature for backwards compatibility
  async changePlanSimple(serviceId: number, planName: string, term: number = 1): Promise<any> {
    return this.changePlan({ serviceId, planName, term });
  }

  // AVC Service Qualification (for transfer orders)
  async qualifyAvc(avcId: string): Promise<AvcQualificationResult> {
    return this.apiRequest<AvcQualificationResult>(
      'POST',
      '/connect/avc-qualification-searches/request',
      { avcId }
    );
  }

  // Service modulation (pause/resume)
  async modulateService(serviceId: number, action: 'pause' | 'resume'): Promise<void> {
    await this.apiRequest<void>(
      'POST',
      `/connect/services/${serviceId}/modulation`,
      { action }
    );
  }

  // Cancel an order
  async cancelOrder(orderId: number, reason?: string): Promise<void> {
    await this.apiRequest<void>(
      'POST',
      `/connect/orders/${orderId}/cancel`,
      { reason }
    );
  }

  isConfigured(): boolean {
    return !!(this.config.privateKey && process.env.SUPERLOOP_CLIENT_ID);
  }
}

let superloopClient: SuperloopClient | null = null;

export function getSuperloopClient(): SuperloopClient {
  if (!superloopClient) {
    superloopClient = new SuperloopClient();
  }
  return superloopClient;
}
