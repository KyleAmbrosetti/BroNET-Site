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

interface LocationSearchResult {
  id: string;
  locId: string;
  address: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  technologyType: string;
  serviceClass: string;
}

interface QualificationResult {
  qualificationSearchId: string;
  locationId: string;
  locId: string;
  technologyType: string;
  serviceClass: number;
  maxDownload: number;
  maxUpload: number;
  available: boolean;
  region: string;
}

interface OrderRequest {
  sourceType: string;
  planName: string;
  term: number;
  trafficClass: string;
  qualificationSearchId: string;
  locationId: string;
  remoteOrderId: string;
  productType: string;
  restorationSla: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  aggregationMethod: string;
  ntdInstallation?: string;
  customerReference?: string;
}

interface OrderResponse {
  id: number;
  orderType: string;
  status: string;
  serviceClass: string;
  technologyType: string;
  trafficClass: string;
  locId: string;
  avcId?: string;
  vlanId?: string;
  poi?: string;
  region?: string;
  bandwidthProfile: {
    speedDown: number;
    speedUp: number;
    planName: string;
  };
}

interface ServiceInfo {
  id: number;
  customerRef: string;
  nbnServiceActivatedOn?: string;
  technologyType: string;
  trafficClass: string;
  locId: string;
  avcId: string;
  vlanId?: string;
  poi?: string;
  region?: string;
  eSla?: string;
  bandwidthProfile: {
    speedDown: number;
    speedUp: number;
    planName: string;
  };
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

  async searchLocation(address: string): Promise<LocationSearchResult[]> {
    return this.apiRequest<LocationSearchResult[]>(
      'POST',
      '/connect/location-searches',
      { address }
    );
  }

  async qualifyLocation(locationId: string): Promise<QualificationResult> {
    return this.apiRequest<QualificationResult>(
      'POST',
      '/connect/qualification-searches',
      { locationId }
    );
  }

  async createOrder(order: OrderRequest): Promise<OrderResponse> {
    return this.apiRequest<OrderResponse>(
      'POST',
      '/connect/orders/create',
      order
    );
  }

  async getOrder(orderId: number): Promise<OrderResponse> {
    return this.apiRequest<OrderResponse>(
      'GET',
      `/connect/orders/${orderId}`
    );
  }

  async getService(serviceId: number): Promise<ServiceInfo> {
    return this.apiRequest<ServiceInfo>(
      'GET',
      `/connect/services/${serviceId}`
    );
  }

  async requestAppointmentSlots(orderId: number, dateFrom: string): Promise<any[]> {
    return this.apiRequest<any[]>(
      'POST',
      '/connect/orders/appointment-requests/request',
      { orderId, dateFrom }
    );
  }

  async bookAppointment(appointmentRequestId: number, slotId: string): Promise<any> {
    return this.apiRequest<any>(
      'POST',
      '/connect/orders/appointments/request',
      { appointmentRequestId, slotId }
    );
  }

  async cancelService(serviceId: number): Promise<void> {
    await this.apiRequest<void>(
      'POST',
      '/connect/services/cancellations/request',
      { serviceId }
    );
  }

  async changePlan(serviceId: number, planName: string, term: number = 1): Promise<any> {
    return this.apiRequest<any>(
      'POST',
      '/connect/services/plan-changes/request',
      { serviceId, planName, term }
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
