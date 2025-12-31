import { db } from './db';
import { 
  superloopEvents, 
  networkDisruptions, 
  serviceHealthRecords, 
  appointmentSlots,
  serviceOrders,
  orderStatusHistory 
} from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface SuperloopWebhookEvent {
  eventId: string;
  eventType: string;
  eventSubtype?: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface AppointmentEventData {
  appointmentId: string;
  orderId?: string;
  serviceId?: string;
  scheduledDate: string;
  window: string;
  status: string;
  technicianName?: string;
  technicianPhone?: string;
  notes?: string;
}

export interface DiagnosticEventData {
  serviceId: string;
  avcId?: string;
  diagnosticType: string;
  results: {
    syncSpeed?: number;
    maxAttainableSpeed?: number;
    signalQuality?: string;
    errorCount?: number;
    latency?: number;
    packetLoss?: string;
  };
  status: string;
  recommendation?: string;
}

export interface OrderEventData {
  orderId: string;
  externalOrderId?: string;
  status: string;
  previousStatus?: string;
  message?: string;
  avcId?: string;
  estimatedCompletionDate?: string;
}

export interface ServiceEventData {
  serviceId: string;
  avcId?: string;
  status: string;
  previousStatus?: string;
  planName?: string;
  message?: string;
}

export interface DisruptionEventData {
  disruptionId: string;
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'scheduled';
  affectedAreas?: string[];
  affectedTechnologies?: string[];
  estimatedResolution?: string;
  startedAt: string;
  resolvedAt?: string;
}

export interface ServiceHealthEventData {
  serviceId: string;
  avcId?: string;
  status: 'healthy' | 'degraded' | 'down';
  syncSpeed?: number;
  maxAttainableSpeed?: number;
  signalQuality?: string;
  errorCount?: number;
  latency?: number;
  packetLoss?: string;
}

export interface LocationQuoteEventData {
  quoteId: string;
  locationId: string;
  status: string;
  totalCost?: number;
  installationType?: string;
  estimatedDays?: number;
  validUntil?: string;
}

export class SuperloopWebhookHandler {
  async processEvent(event: SuperloopWebhookEvent): Promise<{ success: boolean; message: string }> {
    console.log(`Processing Superloop event: ${event.eventType}.${event.eventSubtype || 'unknown'}`);
    
    try {
      const [storedEvent] = await db.insert(superloopEvents).values({
        eventId: event.eventId,
        eventType: event.eventType,
        eventSubtype: event.eventSubtype,
        metadata: JSON.stringify(event.data),
        createdAt: new Date(),
      }).returning();

      switch (event.eventType) {
        case 'appointment':
          await this.handleAppointmentEvent(event, storedEvent.id);
          break;
        case 'diagnostic':
          await this.handleDiagnosticEvent(event, storedEvent.id);
          break;
        case 'order':
          await this.handleOrderEvent(event, storedEvent.id);
          break;
        case 'service':
          await this.handleServiceEvent(event, storedEvent.id);
          break;
        case 'disruption':
          await this.handleDisruptionEvent(event, storedEvent.id);
          break;
        case 'health':
          await this.handleServiceHealthEvent(event, storedEvent.id);
          break;
        case 'location_quote':
          await this.handleLocationQuoteEvent(event, storedEvent.id);
          break;
        default:
          console.warn(`Unknown event type: ${event.eventType}`);
      }

      return { success: true, message: `Event ${event.eventId} processed successfully` };
    } catch (error: any) {
      console.error('Error processing Superloop event:', error);
      return { success: false, message: error.message || 'Failed to process event' };
    }
  }

  private async handleAppointmentEvent(event: SuperloopWebhookEvent, storedEventId: string): Promise<void> {
    const data = event.data as AppointmentEventData;
    
    let orderId: string | undefined;
    if (data.orderId) {
      const [order] = await db.select().from(serviceOrders)
        .where(eq(serviceOrders.nbnOrderId, data.orderId))
        .limit(1);
      orderId = order?.id;
    }

    await db.update(superloopEvents).set({
      orderId,
      serviceId: data.serviceId,
      status: data.status,
      scheduledAt: data.scheduledDate ? new Date(data.scheduledDate) : null,
      title: `Appointment ${event.eventSubtype || data.status}`,
      description: data.notes,
    }).where(eq(superloopEvents.id, storedEventId));

    if (orderId) {
      const existingSlot = await db.select().from(appointmentSlots)
        .where(eq(appointmentSlots.externalAppointmentId, data.appointmentId))
        .limit(1);

      if (existingSlot.length > 0) {
        await db.update(appointmentSlots).set({
          status: data.status,
          slotDate: new Date(data.scheduledDate),
          slotWindow: data.window,
          technicianName: data.technicianName,
          technicianPhone: data.technicianPhone,
          notes: data.notes,
          confirmedAt: data.status === 'confirmed' ? new Date() : undefined,
          completedAt: data.status === 'completed' ? new Date() : undefined,
          cancelledAt: data.status === 'cancelled' ? new Date() : undefined,
          updatedAt: new Date(),
        }).where(eq(appointmentSlots.externalAppointmentId, data.appointmentId));
      } else {
        await db.insert(appointmentSlots).values({
          orderId,
          externalAppointmentId: data.appointmentId,
          slotDate: new Date(data.scheduledDate),
          slotWindow: data.window,
          status: data.status,
          technicianName: data.technicianName,
          technicianPhone: data.technicianPhone,
          notes: data.notes,
        });
      }
    }
  }

  private async handleDiagnosticEvent(event: SuperloopWebhookEvent, storedEventId: string): Promise<void> {
    const data = event.data as DiagnosticEventData;

    await db.update(superloopEvents).set({
      serviceId: data.serviceId,
      avcId: data.avcId,
      status: data.status,
      title: `Diagnostic: ${data.diagnosticType}`,
      description: data.recommendation,
    }).where(eq(superloopEvents.id, storedEventId));

    let userId: string | undefined;
    let orderId: string | undefined;
    if (data.avcId) {
      const [order] = await db.select().from(serviceOrders)
        .where(eq(serviceOrders.avcId, data.avcId))
        .limit(1);
      orderId = order?.id;
      userId = order?.userId;
    }

    await db.insert(serviceHealthRecords).values({
      serviceId: data.serviceId,
      avcId: data.avcId,
      orderId,
      userId,
      status: data.status === 'passed' ? 'healthy' : 'degraded',
      syncSpeed: data.results.syncSpeed,
      maxAttainableSpeed: data.results.maxAttainableSpeed,
      signalQuality: data.results.signalQuality,
      errorCount: data.results.errorCount,
      latency: data.results.latency,
      packetLoss: data.results.packetLoss,
      metadata: JSON.stringify({ diagnosticType: data.diagnosticType, recommendation: data.recommendation }),
    });
  }

  private async handleOrderEvent(event: SuperloopWebhookEvent, storedEventId: string): Promise<void> {
    const data = event.data as OrderEventData;

    const [order] = await db.select().from(serviceOrders)
      .where(eq(serviceOrders.nbnOrderId, data.orderId))
      .limit(1);

    await db.update(superloopEvents).set({
      orderId: order?.id,
      avcId: data.avcId,
      status: data.status,
      title: `Order ${event.eventSubtype || 'update'}`,
      description: data.message,
    }).where(eq(superloopEvents.id, storedEventId));

    if (order) {
      const statusMap: Record<string, string> = {
        'pending': 'pending',
        'submitted': 'submitted',
        'accepted': 'in_progress',
        'in_progress': 'in_progress',
        'provisioning': 'provisioning',
        'activated': 'active',
        'active': 'active',
        'completed': 'active',
        'cancelled': 'cancelled',
        'failed': 'failed',
        'rejected': 'failed',
      };

      const newStatus = statusMap[data.status.toLowerCase()] || data.status;
      
      if (order.status !== newStatus) {
        await db.update(serviceOrders).set({
          status: newStatus,
          avcId: data.avcId || order.avcId,
          nbnOrderId: data.externalOrderId || order.nbnOrderId,
          estimatedConnectionDate: data.estimatedCompletionDate ? new Date(data.estimatedCompletionDate) : order.estimatedConnectionDate,
          actualConnectionDate: newStatus === 'active' ? new Date() : order.actualConnectionDate,
          updatedAt: new Date(),
        }).where(eq(serviceOrders.id, order.id));

        await db.insert(orderStatusHistory).values({
          orderId: order.id,
          status: newStatus,
          message: data.message || `Status updated via Superloop: ${data.status}`,
          updatedBy: 'superloop_webhook',
        });
      }
    }
  }

  private async handleServiceEvent(event: SuperloopWebhookEvent, storedEventId: string): Promise<void> {
    const data = event.data as ServiceEventData;

    const [order] = await db.select().from(serviceOrders)
      .where(eq(serviceOrders.avcId, data.avcId || ''))
      .limit(1);

    await db.update(superloopEvents).set({
      orderId: order?.id,
      serviceId: data.serviceId,
      avcId: data.avcId,
      status: data.status,
      title: `Service ${event.eventSubtype || 'update'}`,
      description: data.message,
    }).where(eq(superloopEvents.id, storedEventId));

    if (order && data.status) {
      const statusMap: Record<string, string> = {
        'active': 'active',
        'suspended': 'suspended',
        'cancelled': 'cancelled',
        'disconnected': 'cancelled',
      };

      const newStatus = statusMap[data.status.toLowerCase()];
      if (newStatus && order.status !== newStatus) {
        await db.update(serviceOrders).set({
          status: newStatus,
          updatedAt: new Date(),
        }).where(eq(serviceOrders.id, order.id));

        await db.insert(orderStatusHistory).values({
          orderId: order.id,
          status: newStatus,
          message: data.message || `Service ${data.status}`,
          updatedBy: 'superloop_webhook',
        });
      }
    }
  }

  private async handleDisruptionEvent(event: SuperloopWebhookEvent, storedEventId: string): Promise<void> {
    const data = event.data as DisruptionEventData;

    await db.update(superloopEvents).set({
      severity: data.severity,
      status: data.status,
      title: data.title,
      description: data.description,
      startedAt: new Date(data.startedAt),
      endedAt: data.resolvedAt ? new Date(data.resolvedAt) : null,
    }).where(eq(superloopEvents.id, storedEventId));

    const existing = await db.select().from(networkDisruptions)
      .where(eq(networkDisruptions.externalId, data.disruptionId))
      .limit(1);

    if (existing.length > 0) {
      await db.update(networkDisruptions).set({
        title: data.title,
        description: data.description,
        severity: data.severity,
        status: data.status,
        affectedAreas: data.affectedAreas ? JSON.stringify(data.affectedAreas) : null,
        affectedTechnologies: data.affectedTechnologies ? JSON.stringify(data.affectedTechnologies) : null,
        estimatedResolution: data.estimatedResolution ? new Date(data.estimatedResolution) : null,
        resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : null,
        updatedAt: new Date(),
      }).where(eq(networkDisruptions.externalId, data.disruptionId));
    } else {
      await db.insert(networkDisruptions).values({
        externalId: data.disruptionId,
        title: data.title,
        description: data.description,
        severity: data.severity,
        status: data.status,
        affectedAreas: data.affectedAreas ? JSON.stringify(data.affectedAreas) : null,
        affectedTechnologies: data.affectedTechnologies ? JSON.stringify(data.affectedTechnologies) : null,
        estimatedResolution: data.estimatedResolution ? new Date(data.estimatedResolution) : null,
        startedAt: new Date(data.startedAt),
        resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : null,
        source: 'superloop',
      });
    }
  }

  private async handleServiceHealthEvent(event: SuperloopWebhookEvent, storedEventId: string): Promise<void> {
    const data = event.data as ServiceHealthEventData;

    let userId: string | undefined;
    let orderId: string | undefined;
    if (data.avcId) {
      const [order] = await db.select().from(serviceOrders)
        .where(eq(serviceOrders.avcId, data.avcId))
        .limit(1);
      orderId = order?.id;
      userId = order?.userId;
    }

    await db.update(superloopEvents).set({
      orderId,
      serviceId: data.serviceId,
      avcId: data.avcId,
      status: data.status,
      title: `Service Health: ${data.status}`,
    }).where(eq(superloopEvents.id, storedEventId));

    await db.insert(serviceHealthRecords).values({
      serviceId: data.serviceId,
      avcId: data.avcId,
      orderId,
      userId,
      status: data.status,
      syncSpeed: data.syncSpeed,
      maxAttainableSpeed: data.maxAttainableSpeed,
      signalQuality: data.signalQuality,
      errorCount: data.errorCount,
      latency: data.latency,
      packetLoss: data.packetLoss,
    });
  }

  private async handleLocationQuoteEvent(event: SuperloopWebhookEvent, storedEventId: string): Promise<void> {
    const data = event.data as LocationQuoteEventData;

    await db.update(superloopEvents).set({
      status: data.status,
      title: `Location Quote: ${data.status}`,
      description: data.installationType ? `Installation: ${data.installationType}, Est. ${data.estimatedDays} days` : undefined,
    }).where(eq(superloopEvents.id, storedEventId));
  }

  async getRecentEvents(limit: number = 50, eventType?: string): Promise<any[]> {
    if (eventType) {
      return await db.select().from(superloopEvents)
        .where(eq(superloopEvents.eventType, eventType))
        .orderBy(superloopEvents.createdAt)
        .limit(limit);
    }
    
    return await db.select().from(superloopEvents)
      .orderBy(superloopEvents.createdAt)
      .limit(limit);
  }

  async acknowledgeEvent(eventId: string, userId: string): Promise<void> {
    await db.update(superloopEvents).set({
      acknowledged: 1,
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
    }).where(eq(superloopEvents.id, eventId));
  }

  async getActiveDisruptions(): Promise<any[]> {
    return await db.select().from(networkDisruptions)
      .where(eq(networkDisruptions.status, 'active'))
      .orderBy(networkDisruptions.startedAt);
  }
}

export const superloopWebhookHandler = new SuperloopWebhookHandler();
