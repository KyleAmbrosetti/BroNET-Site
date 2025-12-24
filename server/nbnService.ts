import * as crypto from "crypto";
import { db } from "./db";
import { serviceQualifications, serviceOrders, orderStatusHistory } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getSuperloopClient, SuperloopClient } from "./superloopClient";

export interface ServiceQualificationResult {
  locId: string;
  csaId?: string;
  address: string;
  postcode?: string;
  suburb?: string;
  state?: string;
  technology: string;
  maxDownload: number;
  maxUpload: number;
  bandwidthProfile?: string;
  serviceClass: number;
  newDevelopment: boolean;
  sqReference: string;
  validUntil: Date;
  available: boolean;
}

export interface OrderSubmissionResult {
  success: boolean;
  nbnOrderId?: string;
  avcId?: string;
  cvcId?: string;
  estimatedConnectionDate?: Date;
  message?: string;
}

export interface OrderStatusResult {
  status: string;
  avcId?: string;
  cvcId?: string;
  estimatedConnectionDate?: Date;
  actualConnectionDate?: Date;
  message?: string;
}

function generateLocId(): string {
  const prefix = "LOC";
  const randomNum = Math.floor(Math.random() * 900000000) + 100000000;
  return `${prefix}${randomNum}`;
}

function generateCsaId(): string {
  const prefix = "CSA";
  const randomNum = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}${randomNum}`;
}

function generateSqReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SQ-${timestamp}-${random}`;
}

function generateOrderReference(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BRO-${date}-${random}`;
}

function generateAvcId(): string {
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `AVC${random}`;
}

function generateCvcId(): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CVC${random}`;
}

function generateNbnOrderId(): string {
  const random = Math.floor(Math.random() * 9000000000) + 1000000000;
  return `NBN${random}`;
}

function getTechnologySpecs(technology: string): { maxDownload: number; maxUpload: number; serviceClass: number } {
  const techLower = technology.toLowerCase();
  
  if (techLower.includes("fttp") || techLower.includes("fibre to the premises")) {
    return { maxDownload: 2000, maxUpload: 500, serviceClass: 4 };
  }
  if (techLower.includes("fttc") || techLower.includes("fibre to the curb")) {
    return { maxDownload: 1000, maxUpload: 50, serviceClass: 3 };
  }
  if (techLower.includes("fttb") || techLower.includes("fibre to the building")) {
    return { maxDownload: 1000, maxUpload: 50, serviceClass: 3 };
  }
  if (techLower.includes("hfc") || techLower.includes("cable")) {
    return { maxDownload: 1000, maxUpload: 50, serviceClass: 3 };
  }
  if (techLower.includes("wireless") || techLower.includes("fw")) {
    return { maxDownload: 100, maxUpload: 20, serviceClass: 2 };
  }
  if (techLower.includes("satellite") || techLower.includes("sat")) {
    return { maxDownload: 50, maxUpload: 10, serviceClass: 1 };
  }
  
  return { maxDownload: 100, maxUpload: 20, serviceClass: 2 };
}

function getBandwidthProfile(technology: string, maxDownload: number, maxUpload: number): string {
  const serviceClass = getTechnologySpecs(technology).serviceClass;
  return `TC${serviceClass}/${maxDownload}/${maxUpload}`;
}

export class NbnService {
  private useRealApi: boolean = false;
  private useSuperloop: boolean = false;
  private superloopClient: SuperloopClient | null = null;
  
  constructor() {
    this.useRealApi = !!process.env.NBN_RSP_API_KEY;
    
    const superloop = getSuperloopClient();
    if (superloop.isConfigured()) {
      this.useSuperloop = true;
      this.superloopClient = superloop;
      console.log("Superloop Connect API configured - using real NBN integration");
    }
  }

  async performServiceQualification(
    address: string,
    technology: string,
    postcode?: string,
    suburb?: string,
    state?: string,
    userId?: string
  ): Promise<ServiceQualificationResult> {
    if (this.useSuperloop && this.superloopClient) {
      return this.superloopServiceQualification(address, technology, postcode, suburb, state, userId);
    }
    if (this.useRealApi) {
      return this.realServiceQualification(address, technology, postcode, suburb, state, userId);
    }
    return this.simulatedServiceQualification(address, technology, postcode, suburb, state, userId);
  }

  private async superloopServiceQualification(
    address: string,
    technology: string,
    postcode?: string,
    suburb?: string,
    state?: string,
    userId?: string
  ): Promise<ServiceQualificationResult> {
    if (!this.superloopClient) {
      throw new Error("Superloop client not configured");
    }

    try {
      const locations = await this.superloopClient.searchLocation(address);
      
      if (!locations || locations.length === 0) {
        throw new Error("No locations found for address");
      }

      const location = locations[0];
      const qualification = await this.superloopClient.qualifyLocation(location.id);

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      const result: ServiceQualificationResult = {
        locId: qualification.locId || location.locId,
        csaId: location.id,
        address: location.address,
        postcode: location.postcode || postcode,
        suburb: location.suburb || suburb,
        state: location.state || state,
        technology: qualification.technologyType || location.technologyType,
        maxDownload: qualification.maxDownload,
        maxUpload: qualification.maxUpload,
        bandwidthProfile: `TC${qualification.serviceClass}/${qualification.maxDownload}/${qualification.maxUpload}`,
        serviceClass: qualification.serviceClass,
        newDevelopment: false,
        sqReference: qualification.qualificationSearchId,
        validUntil,
        available: qualification.available,
      };

      await db.insert(serviceQualifications).values({
        userId: userId || null,
        locId: result.locId,
        csaId: result.csaId,
        address: result.address,
        postcode: result.postcode,
        suburb: result.suburb,
        state: result.state,
        technology: result.technology,
        maxDownload: result.maxDownload,
        maxUpload: result.maxUpload,
        bandwidthProfile: result.bandwidthProfile,
        serviceClass: result.serviceClass,
        newDevelopment: result.newDevelopment ? 1 : 0,
        sqReference: result.sqReference,
        validUntil: result.validUntil,
        rawResponse: JSON.stringify({ superloop: true, qualification, location, superloopLocationId: location.id }),
      });

      return result;
    } catch (error: any) {
      console.error("Superloop qualification error:", error);
      console.log("Falling back to simulated qualification");
      return this.simulatedServiceQualification(address, technology, postcode, suburb, state, userId);
    }
  }

  private async simulatedServiceQualification(
    address: string,
    technology: string,
    postcode?: string,
    suburb?: string,
    state?: string,
    userId?: string
  ): Promise<ServiceQualificationResult> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const specs = getTechnologySpecs(technology);
    const locId = generateLocId();
    const csaId = generateCsaId();
    const sqReference = generateSqReference();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const result: ServiceQualificationResult = {
      locId,
      csaId,
      address,
      postcode,
      suburb,
      state,
      technology,
      maxDownload: specs.maxDownload,
      maxUpload: specs.maxUpload,
      bandwidthProfile: getBandwidthProfile(technology, specs.maxDownload, specs.maxUpload),
      serviceClass: specs.serviceClass,
      newDevelopment: false,
      sqReference,
      validUntil,
      available: true,
    };

    await db.insert(serviceQualifications).values({
      userId: userId || null,
      locId: result.locId,
      csaId: result.csaId,
      address: result.address,
      postcode: result.postcode,
      suburb: result.suburb,
      state: result.state,
      technology: result.technology,
      maxDownload: result.maxDownload,
      maxUpload: result.maxUpload,
      bandwidthProfile: result.bandwidthProfile,
      serviceClass: result.serviceClass,
      newDevelopment: result.newDevelopment ? 1 : 0,
      sqReference: result.sqReference,
      validUntil: result.validUntil,
      rawResponse: JSON.stringify({ simulated: true, ...result }),
    });

    return result;
  }

  private async realServiceQualification(
    address: string,
    technology: string,
    postcode?: string,
    suburb?: string,
    state?: string,
    userId?: string
  ): Promise<ServiceQualificationResult> {
    throw new Error("Real NBN API not configured. Set NBN_RSP_API_KEY and NBN_RSP_CERT_PATH environment variables.");
  }

  async submitOrder(params: {
    userId: string;
    qualificationId?: string;
    planId: string;
    planName: string;
    downloadSpeed: number;
    uploadSpeed: number;
    serviceAddress: string;
    locId?: string;
    technology?: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    preferredDate?: Date;
    stripeSessionId?: string;
    sqReference?: string;
  }): Promise<{ orderId: string; orderReference: string; result: OrderSubmissionResult }> {
    const orderReference = generateOrderReference();
    
    let submissionResult: OrderSubmissionResult;
    if (this.useSuperloop && this.superloopClient) {
      submissionResult = await this.superloopSubmitOrder(params);
    } else if (this.useRealApi) {
      submissionResult = await this.realSubmitOrder(params);
    } else {
      submissionResult = await this.simulatedSubmitOrder(params);
    }

    const estimatedDate = submissionResult.estimatedConnectionDate || new Date();
    if (!submissionResult.estimatedConnectionDate) {
      estimatedDate.setDate(estimatedDate.getDate() + 7);
    }

    const [order] = await db.insert(serviceOrders).values({
      userId: params.userId,
      qualificationId: params.qualificationId,
      orderReference,
      nbnOrderId: submissionResult.nbnOrderId,
      avcId: submissionResult.avcId,
      cvcId: submissionResult.cvcId,
      planId: params.planId,
      planName: params.planName,
      downloadSpeed: params.downloadSpeed,
      uploadSpeed: params.uploadSpeed,
      serviceAddress: params.serviceAddress,
      locId: params.locId,
      technology: params.technology,
      status: submissionResult.success ? "submitted" : "failed",
      contactName: params.contactName,
      contactEmail: params.contactEmail,
      contactPhone: params.contactPhone,
      preferredDate: params.preferredDate,
      estimatedConnectionDate: estimatedDate,
      stripeSessionId: params.stripeSessionId,
      notes: submissionResult.message,
    }).returning();

    await db.insert(orderStatusHistory).values({
      orderId: order.id,
      status: submissionResult.success ? "submitted" : "failed",
      message: submissionResult.message || "Order created",
      updatedBy: "system",
    });

    return {
      orderId: order.id,
      orderReference,
      result: submissionResult,
    };
  }

  private async simulatedSubmitOrder(params: any): Promise<OrderSubmissionResult> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + Math.floor(Math.random() * 7) + 5);

    return {
      success: true,
      nbnOrderId: generateNbnOrderId(),
      avcId: generateAvcId(),
      cvcId: generateCvcId(),
      estimatedConnectionDate: estimatedDate,
      message: "Order submitted successfully. You will receive confirmation via email.",
    };
  }

  private async superloopSubmitOrder(params: any): Promise<OrderSubmissionResult> {
    if (!this.superloopClient) {
      throw new Error("Superloop client not configured");
    }

    try {
      const remoteOrderId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2)}`;
      
      const superloopLocationId = params.csaId || params.superloopLocationId || "";
      
      const orderResponse = await this.superloopClient.createOrder({
        sourceType: "nbn",
        planName: params.planName,
        term: 1,
        trafficClass: "tc4",
        qualificationSearchId: params.sqReference || "",
        locationId: superloopLocationId,
        remoteOrderId,
        productType: "Access Only",
        restorationSla: "Standard",
        contactName: params.contactName,
        contactPhone: params.contactPhone.replace(/\s/g, ""),
        contactEmail: params.contactEmail,
        aggregationMethod: "L2TP",
        ntdInstallation: "nbn-tech",
        customerReference: `BRO-${params.userId.substring(0, 8)}`,
      });

      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + 7);

      return {
        success: true,
        nbnOrderId: `SL-${orderResponse.id}`,
        avcId: orderResponse.avcId || undefined,
        cvcId: undefined,
        estimatedConnectionDate: estimatedDate,
        message: `Order submitted via Superloop Connect. Reference: ${orderResponse.id}`,
      };
    } catch (error: any) {
      console.error("Superloop order submission error:", error);
      return {
        success: false,
        message: `Order submission failed: ${error.message}`,
      };
    }
  }

  private async realSubmitOrder(params: any): Promise<OrderSubmissionResult> {
    throw new Error("Real NBN API not configured. Set NBN_RSP_API_KEY and NBN_RSP_CERT_PATH environment variables.");
  }

  async getOrderStatus(orderId: string): Promise<OrderStatusResult | null> {
    const [order] = await db.select().from(serviceOrders).where(eq(serviceOrders.id, orderId));
    if (!order) return null;

    return {
      status: order.status,
      avcId: order.avcId || undefined,
      cvcId: order.cvcId || undefined,
      estimatedConnectionDate: order.estimatedConnectionDate || undefined,
      actualConnectionDate: order.actualConnectionDate || undefined,
    };
  }

  async updateOrderStatus(orderId: string, status: string, message?: string, updatedBy: string = "system"): Promise<void> {
    await db.update(serviceOrders)
      .set({ status, updatedAt: new Date() })
      .where(eq(serviceOrders.id, orderId));

    await db.insert(orderStatusHistory).values({
      orderId,
      status,
      message,
      updatedBy,
    });
  }

  async activateService(orderId: string): Promise<void> {
    const [order] = await db.select().from(serviceOrders).where(eq(serviceOrders.id, orderId));
    if (!order) throw new Error("Order not found");

    let avcId = order.avcId;
    let cvcId = order.cvcId;

    if (!avcId) {
      avcId = generateAvcId();
      cvcId = cvcId || generateCvcId();
    }

    await db.update(serviceOrders)
      .set({
        status: "active",
        avcId,
        cvcId,
        actualConnectionDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(serviceOrders.id, orderId));

    await db.insert(orderStatusHistory).values({
      orderId,
      status: "active",
      message: `Service activated. AVC ID: ${avcId}`,
      updatedBy: "system",
    });
  }

  async getUserOrders(userId: string) {
    return db.select().from(serviceOrders).where(eq(serviceOrders.userId, userId));
  }

  async getOrderHistory(orderId: string) {
    return db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, orderId));
  }
}

export const nbnService = new NbnService();
