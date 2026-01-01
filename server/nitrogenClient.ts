import crypto from 'crypto';

interface NitrogenConfig {
  apiKey: string;
  apiSecret: string;
  tenantId: string;
  baseUrl: string;
  webhookSecret?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface LocationSearchResult {
  id: string;
  address: string;
  gnafId?: string;
  state: string;
  postcode: string;
  suburb: string;
  locId?: string;
}

interface Infrastructure {
  infrastructureId: string;
  type: string;
  status: string;
  ports?: {
    portId: number;
    status: string;
    hasActiveService: boolean;
    avcId?: string;
  }[];
  infrastructureUpgradeOptions?: string[];
  productsRequiringInfrastructureUpgrade?: string[];
}

interface ServiceQualificationResult {
  id: string;
  locationId: string;
  locId: string;
  address: string;
  postcode: string;
  suburb: string;
  state: string;
  serviceClass: string;
  technologyType: string;
  maxDownload: number;
  maxUpload: number;
  available: boolean;
  alternativeTechnology?: string;
  infrastructures: Infrastructure[];
  availableProducts: string[];
  installationTypes?: string[];
  expiresAt: Date;
  potsPresent?: boolean;
}

interface ProductOffer {
  id: string;
  name: string;
  downloadSpeed: number;
  uploadSpeed: number;
  components: {
    type: string;
    required: boolean;
    defaultOption: string;
    availableOptions: string[];
  }[];
}

interface OrderCreateParams {
  sourceType: 'NBN';
  customerReference: string;
  qualificationSearchId: string;
  locationId: string;
  term?: number;
  trafficClass?: string;
  productType?: string;
  productOffer: {
    id: string;
    components?: {
      type: string;
      option: string;
    }[];
  };
  infrastructureId?: string;
  portId?: number;
  infrastructureUpgradeType?: string | null;
  transferType?: 'SERVICE_TRANSFER' | 'CONNECT_OUTSTANDING' | null;
  avcId?: string | null;
  ntdInstallation?: 'no-action' | 'tech' | 'dispatch';
  dispatchOptions?: {
    sameAddressAsLocation?: boolean;
    contactName: string;
    contactPhone: string;
    authorityToLeave?: boolean;
    deliveryInstructions?: string;
    address?: {
      line1: string;
      line2?: string;
      suburb: string;
      state: string;
      postcode: string;
    };
  };
  serviceConfiguration?: {
    dslStabilityProfile?: 'standard' | 'stable';
    layer3Options?: {
      authMethod?: 'ipoe' | 'pppoe';
      applyShapingRestriction?: boolean;
      unblockPorts?: boolean;
    };
  };
  bookedAppointmentId?: string;
  potsServiceOwner?: boolean;
  potsWaiver?: boolean;
}

interface OrderResponse {
  id: string;
  status: string;
  subStatus: string;
  customerReference: string;
  locationId: string;
  serviceId?: string;
  avcId?: string;
  createdAt: string;
  updatedAt: string;
}

interface AppointmentSlot {
  id: string;
  startTime: string;
  endTime: string;
  demandType: string;
}

interface AppointmentResponse {
  id: string;
  status: string;
  startTime: string;
  endTime: string;
  demandType: string;
}

export class NitrogenClient {
  private config: NitrogenConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.config = {
      apiKey: process.env.NITROGEN_API_KEY || '',
      apiSecret: process.env.NITROGEN_API_SECRET || '',
      tenantId: process.env.NITROGEN_TENANT_ID || '',
      baseUrl: process.env.NITROGEN_USE_SANDBOX === 'true'
        ? 'https://api-sandbox.nitrogen.aussiebroadband.com.au/v1'
        : 'https://api.nitrogen.aussiebroadband.com.au/v1',
      webhookSecret: process.env.NITROGEN_WEBHOOK_SECRET,
    };
  }

  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.apiSecret && this.config.tenantId);
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch(`${this.config.baseUrl}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.config.apiKey,
        api_secret: this.config.apiSecret,
        tenant_id: this.config.tenantId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Nitrogen auth failed: ${error}`);
    }

    const data: TokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;

    return this.accessToken;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<T> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Tenant-ID': this.config.tenantId,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.message || errorJson.error || errorText;
      } catch {}
      throw new Error(`Nitrogen API error (${response.status}): ${errorDetail}`);
    }

    return response.json();
  }

  async searchLocation(address: string): Promise<LocationSearchResult[]> {
    const results = await this.request<{ locations: LocationSearchResult[] }>(
      'GET',
      `/locations/search?q=${encodeURIComponent(address)}`
    );
    return results.locations || [];
  }

  async getLocation(locationId: string): Promise<LocationSearchResult> {
    return this.request<LocationSearchResult>('GET', `/locations/${locationId}`);
  }

  async performServiceQualification(
    locationId: string,
    sqType: 'STANDARD' | 'NFAS' = 'STANDARD',
    avcId?: string
  ): Promise<ServiceQualificationResult> {
    const body: any = {
      locationId,
      sqType,
    };

    if (avcId) {
      body.avcId = avcId;
    }

    const result = await this.request<ServiceQualificationResult>(
      'POST',
      '/service-qualifications',
      body
    );

    result.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    return result;
  }

  async getProductCatalog(): Promise<ProductOffer[]> {
    const result = await this.request<{ products: ProductOffer[] }>(
      'GET',
      '/product-catalog'
    );
    return result.products || [];
  }

  async getProductOffer(productOfferId: string): Promise<ProductOffer> {
    return this.request<ProductOffer>('GET', `/product-catalog/${productOfferId}`);
  }

  async createOrder(params: OrderCreateParams): Promise<OrderResponse> {
    const payload = {
      sourceType: params.sourceType || 'NBN',
      customerReference: params.customerReference,
      qualificationSearchId: params.qualificationSearchId,
      locationId: params.locationId,
      term: params.term || 1,
      trafficClass: params.trafficClass || 'tc4',
      productType: params.productType || 'Access Only',
      productOffer: params.productOffer,
      infrastructureId: params.infrastructureId,
      portId: params.portId,
      infrastructureUpgradeType: params.infrastructureUpgradeType,
      transferType: params.transferType,
      avcId: params.avcId,
      ntdInstallation: params.ntdInstallation || 'no-action',
      dispatchOptions: params.dispatchOptions,
      serviceConfiguration: params.serviceConfiguration || {
        dslStabilityProfile: 'standard',
        layer3Options: {
          authMethod: 'ipoe',
          applyShapingRestriction: false,
          unblockPorts: false,
        },
      },
      bookedAppointmentId: params.bookedAppointmentId,
      potsServiceOwner: params.potsServiceOwner,
      potsWaiver: params.potsWaiver,
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key as keyof typeof payload] === undefined) {
        delete payload[key as keyof typeof payload];
      }
    });

    return this.request<OrderResponse>('POST', '/orders', payload);
  }

  async getOrder(orderId: string): Promise<OrderResponse> {
    return this.request<OrderResponse>('GET', `/orders/${orderId}`);
  }

  async cancelOrder(orderId: string, reason?: string): Promise<OrderResponse> {
    return this.request<OrderResponse>('POST', `/orders/${orderId}/cancel`, { reason });
  }

  async getAvailableAppointments(
    locationId: string,
    demandType: string,
    fromDate?: string,
    toDate?: string
  ): Promise<AppointmentSlot[]> {
    let url = `/appointments/available?locationId=${locationId}&demandType=${demandType}`;
    if (fromDate) url += `&fromDate=${fromDate}`;
    if (toDate) url += `&toDate=${toDate}`;

    const result = await this.request<{ slots: AppointmentSlot[] }>('GET', url);
    return result.slots || [];
  }

  async reserveAppointment(slotId: string): Promise<AppointmentResponse> {
    return this.request<AppointmentResponse>('POST', '/appointments/reserve', { slotId });
  }

  async getAppointment(appointmentId: string): Promise<AppointmentResponse> {
    return this.request<AppointmentResponse>('GET', `/appointments/${appointmentId}`);
  }

  async rescheduleAppointment(
    appointmentId: string,
    newSlotId: string
  ): Promise<AppointmentResponse> {
    return this.request<AppointmentResponse>(
      'POST',
      `/appointments/${appointmentId}/reschedule`,
      { slotId: newSlotId }
    );
  }

  async cancelAppointment(appointmentId: string): Promise<void> {
    await this.request<void>('POST', `/appointments/${appointmentId}/cancel`, {});
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      console.warn('Nitrogen webhook secret not configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  parseWebhookEvent(payload: string): {
    eventType: string;
    resourceType: string;
    resourceId: string;
    data: any;
  } {
    const event = JSON.parse(payload);
    return {
      eventType: event.eventType,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      data: event.data,
    };
  }
}

export const nitrogenClient = new NitrogenClient();
