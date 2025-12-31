import { 
  users, 
  tickets,
  ticketReplies,
  incidents, 
  contactMessages,
  addressCache,
  nbnDataset,
  coverageChecks,
  modemEnquiries,
  emailSignups,
  billingHistory,
  usageRecords,
  serviceOrders,
  orderStatusHistory,
  type User, 
  type InsertUser,
  type Ticket,
  type InsertTicket,
  type TicketReply,
  type InsertTicketReply,
  type Incident,
  type InsertIncident,
  type ContactMessage,
  type InsertContactMessage,
  type AddressCache,
  type InsertAddressCache,
  type NbnDataset,
  type InsertNbnDataset,
  type CoverageCheck,
  type InsertCoverageCheck,
  type ModemEnquiry,
  type InsertModemEnquiry,
  type EmailSignup,
  type InsertEmailSignup,
  type BillingHistory,
  type InsertBillingHistory,
  type UsageRecord,
  type InsertUsageRecord,
  type ServiceOrder,
  type InsertServiceOrder,
  type OrderStatusHistory,
  type InsertOrderStatusHistory,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User>;

  // Tickets
  getTickets(userId: string): Promise<Ticket[]>;
  getAllTickets(): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, data: Partial<InsertTicket>): Promise<Ticket>;

  // Ticket Replies
  getTicketReplies(ticketId: string): Promise<TicketReply[]>;
  createTicketReply(reply: InsertTicketReply): Promise<TicketReply>;

  // Incidents
  getIncidents(): Promise<Incident[]>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  resolveIncident(id: string): Promise<void>;

  // Contact Messages
  getContactMessages(userId: string): Promise<ContactMessage[]>;
  getAllContactMessages(): Promise<ContactMessage[]>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;

  // Address Cache
  getAddressCacheByInput(inputAddress: string): Promise<AddressCache | undefined>;
  createAddressCache(cache: InsertAddressCache): Promise<AddressCache>;

  // NBN Dataset
  getNbnDatasetByPostcode(postcode: string): Promise<NbnDataset[]>;
  getNbnDatasetByHash(addressHash: string): Promise<NbnDataset | undefined>;
  getNbnDatasetByLocid(locid: string): Promise<NbnDataset | undefined>;
  getAllNbnDataset(): Promise<NbnDataset[]>;
  createNbnDataset(data: InsertNbnDataset): Promise<NbnDataset>;
  bulkCreateNbnDataset(data: InsertNbnDataset[]): Promise<void>;
  deleteAllNbnDataset(): Promise<void>;

  // Coverage Checks
  getCoverageChecks(userId: string): Promise<CoverageCheck[]>;
  createCoverageCheck(check: InsertCoverageCheck): Promise<CoverageCheck>;

  // Modem Enquiries
  getModemEnquiries(userId: string): Promise<ModemEnquiry[]>;
  getAllModemEnquiries(): Promise<ModemEnquiry[]>;
  createModemEnquiry(enquiry: InsertModemEnquiry): Promise<ModemEnquiry>;
  updateModemEnquiryStatus(id: string, status: string): Promise<ModemEnquiry>;

  // Email Signups
  getEmailSignupByEmail(email: string): Promise<EmailSignup | undefined>;
  createEmailSignup(signup: InsertEmailSignup): Promise<EmailSignup>;

  // Billing History
  getBillingHistory(userId: string): Promise<BillingHistory[]>;
  createBillingRecord(record: InsertBillingHistory): Promise<BillingHistory>;

  // Usage Records
  getUsageRecords(userId: string): Promise<UsageRecord[]>;
  createUsageRecord(record: InsertUsageRecord): Promise<UsageRecord>;

  // Service Orders (Admin)
  getAllOrders(): Promise<ServiceOrder[]>;
  getOrder(id: string): Promise<ServiceOrder | undefined>;
  getOrdersByUser(userId: string): Promise<ServiceOrder[]>;
  updateOrderStatus(id: string, status: string, updatedBy: string, message?: string): Promise<ServiceOrder>;
  getOrderHistory(orderId: string): Promise<OrderStatusHistory[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // Tickets
  async getTickets(userId: string): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.userId, userId))
      .orderBy(desc(tickets.createdAt));
  }

  async getAllTickets(): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .orderBy(desc(tickets.createdAt));
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    const result = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
    return result[0];
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db.insert(tickets).values(ticket).returning();
    return newTicket;
  }

  async updateTicket(id: string, data: Partial<InsertTicket>): Promise<Ticket> {
    const [updated] = await db
      .update(tickets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return updated;
  }

  // Ticket Replies
  async getTicketReplies(ticketId: string): Promise<TicketReply[]> {
    return await db
      .select()
      .from(ticketReplies)
      .where(eq(ticketReplies.ticketId, ticketId))
      .orderBy(ticketReplies.createdAt);
  }

  async createTicketReply(reply: InsertTicketReply): Promise<TicketReply> {
    const [newReply] = await db.insert(ticketReplies).values(reply).returning();
    return newReply;
  }

  // Incidents
  async getIncidents(): Promise<Incident[]> {
    return await db
      .select()
      .from(incidents)
      .orderBy(desc(incidents.createdAt));
  }

  async createIncident(incident: InsertIncident): Promise<Incident> {
    const [newIncident] = await db.insert(incidents).values(incident).returning();
    return newIncident;
  }

  async resolveIncident(id: string): Promise<void> {
    await db
      .update(incidents)
      .set({ status: "resolved", resolvedAt: new Date() })
      .where(eq(incidents.id, id));
  }

  // Contact Messages
  async getContactMessages(userId: string): Promise<ContactMessage[]> {
    return await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.userId, userId))
      .orderBy(desc(contactMessages.createdAt));
  }

  async getAllContactMessages(): Promise<ContactMessage[]> {
    return await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
  }

  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [newMessage] = await db
      .insert(contactMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  // Address Cache
  async getAddressCacheByInput(inputAddress: string): Promise<AddressCache | undefined> {
    const result = await db
      .select()
      .from(addressCache)
      .where(eq(addressCache.inputAddress, inputAddress.toLowerCase().trim()))
      .limit(1);
    return result[0];
  }

  async createAddressCache(cache: InsertAddressCache): Promise<AddressCache> {
    const [newCache] = await db.insert(addressCache).values(cache).returning();
    return newCache;
  }

  // NBN Dataset
  async getNbnDatasetByPostcode(postcode: string): Promise<NbnDataset[]> {
    return await db
      .select()
      .from(nbnDataset)
      .where(eq(nbnDataset.postcode, postcode));
  }

  async getNbnDatasetByHash(addressHash: string): Promise<NbnDataset | undefined> {
    const result = await db
      .select()
      .from(nbnDataset)
      .where(eq(nbnDataset.addressHash, addressHash))
      .limit(1);
    return result[0];
  }

  async getNbnDatasetByLocid(locid: string): Promise<NbnDataset | undefined> {
    const result = await db
      .select()
      .from(nbnDataset)
      .where(eq(nbnDataset.locid, locid))
      .limit(1);
    return result[0];
  }

  async getAllNbnDataset(): Promise<NbnDataset[]> {
    return await db.select().from(nbnDataset).orderBy(nbnDataset.postcode);
  }

  async createNbnDataset(data: InsertNbnDataset): Promise<NbnDataset> {
    const [newData] = await db.insert(nbnDataset).values(data).returning();
    return newData;
  }

  async bulkCreateNbnDataset(data: InsertNbnDataset[]): Promise<void> {
    if (data.length > 0) {
      await db.insert(nbnDataset).values(data);
    }
  }

  async deleteAllNbnDataset(): Promise<void> {
    await db.delete(nbnDataset);
  }

  // Coverage Checks
  async getCoverageChecks(userId: string): Promise<CoverageCheck[]> {
    return await db
      .select()
      .from(coverageChecks)
      .where(eq(coverageChecks.userId, userId))
      .orderBy(desc(coverageChecks.createdAt))
      .limit(20);
  }

  async createCoverageCheck(check: InsertCoverageCheck): Promise<CoverageCheck> {
    const [newCheck] = await db
      .insert(coverageChecks)
      .values(check)
      .returning();
    return newCheck;
  }

  // Modem Enquiries
  async getModemEnquiries(userId: string): Promise<ModemEnquiry[]> {
    return await db
      .select()
      .from(modemEnquiries)
      .where(eq(modemEnquiries.userId, userId))
      .orderBy(desc(modemEnquiries.createdAt));
  }

  async getAllModemEnquiries(): Promise<ModemEnquiry[]> {
    return await db
      .select()
      .from(modemEnquiries)
      .orderBy(desc(modemEnquiries.createdAt));
  }

  async createModemEnquiry(enquiry: InsertModemEnquiry): Promise<ModemEnquiry> {
    const [newEnquiry] = await db
      .insert(modemEnquiries)
      .values(enquiry)
      .returning();
    return newEnquiry;
  }

  async updateModemEnquiryStatus(id: string, status: string): Promise<ModemEnquiry> {
    const [updated] = await db
      .update(modemEnquiries)
      .set({ status })
      .where(eq(modemEnquiries.id, id))
      .returning();
    return updated;
  }

  // Email Signups
  async getEmailSignupByEmail(email: string): Promise<EmailSignup | undefined> {
    const result = await db
      .select()
      .from(emailSignups)
      .where(eq(emailSignups.email, email))
      .limit(1);
    return result[0];
  }

  async createEmailSignup(signup: InsertEmailSignup): Promise<EmailSignup> {
    const [newSignup] = await db
      .insert(emailSignups)
      .values(signup)
      .returning();
    return newSignup;
  }

  // Billing History
  async getBillingHistory(userId: string): Promise<BillingHistory[]> {
    return await db
      .select()
      .from(billingHistory)
      .where(eq(billingHistory.userId, userId))
      .orderBy(desc(billingHistory.createdAt));
  }

  async createBillingRecord(record: InsertBillingHistory): Promise<BillingHistory> {
    const [newRecord] = await db
      .insert(billingHistory)
      .values(record)
      .returning();
    return newRecord;
  }

  // Usage Records
  async getUsageRecords(userId: string): Promise<UsageRecord[]> {
    return await db
      .select()
      .from(usageRecords)
      .where(eq(usageRecords.userId, userId))
      .orderBy(desc(usageRecords.recordedAt))
      .limit(12);
  }

  async createUsageRecord(record: InsertUsageRecord): Promise<UsageRecord> {
    const [newRecord] = await db
      .insert(usageRecords)
      .values(record)
      .returning();
    return newRecord;
  }

  // Service Orders (Admin)
  async getAllOrders(): Promise<ServiceOrder[]> {
    return await db
      .select()
      .from(serviceOrders)
      .orderBy(desc(serviceOrders.createdAt));
  }

  async getOrder(id: string): Promise<ServiceOrder | undefined> {
    const result = await db
      .select()
      .from(serviceOrders)
      .where(eq(serviceOrders.id, id))
      .limit(1);
    return result[0];
  }

  async getOrdersByUser(userId: string): Promise<ServiceOrder[]> {
    return await db
      .select()
      .from(serviceOrders)
      .where(eq(serviceOrders.userId, userId))
      .orderBy(desc(serviceOrders.createdAt));
  }

  async updateOrderStatus(id: string, status: string, updatedBy: string, message?: string): Promise<ServiceOrder> {
    const [updated] = await db
      .update(serviceOrders)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(serviceOrders.id, id))
      .returning();
    
    await db.insert(orderStatusHistory).values({
      orderId: id,
      status,
      message: message || `Status changed to ${status}`,
      updatedBy,
    });
    
    return updated;
  }

  async getOrderHistory(orderId: string): Promise<OrderStatusHistory[]> {
    return await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(desc(orderStatusHistory.createdAt));
  }
}

export const storage = new DatabaseStorage();
