import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  planId: text("plan_id"),
  serviceAddress: text("service_address"),
  isAdmin: integer("is_admin").notNull().default(0),
  disabled: integer("disabled").notNull().default(0),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  joinedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Support Tickets Table
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

// Ticket Replies Table
export const ticketReplies = pgTable("ticket_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  message: text("message").notNull(),
  isStaff: integer("is_staff").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTicketReplySchema = createInsertSchema(ticketReplies).omit({
  id: true,
  createdAt: true,
});

export type InsertTicketReply = z.infer<typeof insertTicketReplySchema>;
export type TicketReply = typeof ticketReplies.$inferSelect;

// Network Incidents Table
export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(),
  status: text("status").notNull().default("investigating"),
  affectedAreas: text("affected_areas"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidents.$inferSelect;

// Contact Messages Table
export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

// Address Cache Table (for Nominatim results)
export const addressCache = pgTable("address_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inputAddress: text("input_address").notNull(),
  normalizedAddress: text("normalized_address").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  postcode: text("postcode"),
  suburb: text("suburb"),
  state: text("state"),
  rawResponse: text("raw_response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAddressCacheSchema = createInsertSchema(addressCache).omit({
  id: true,
  createdAt: true,
});

export type InsertAddressCache = z.infer<typeof insertAddressCacheSchema>;
export type AddressCache = typeof addressCache.$inferSelect;

// NBN Availability Dataset Table (admin-managed)
export const nbnDataset = pgTable("nbn_dataset", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  addressHash: text("address_hash"),
  locid: text("locid"),
  normalizedAddress: text("normalized_address"),
  postcode: text("postcode"),
  technology: text("technology").notNull(),
  maxTier: text("max_tier").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertNbnDatasetSchema = createInsertSchema(nbnDataset).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertNbnDataset = z.infer<typeof insertNbnDatasetSchema>;
export type NbnDataset = typeof nbnDataset.$inferSelect;

// Coverage Check History Table
export const coverageChecks = pgTable("coverage_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  inputAddress: text("input_address").notNull(),
  normalizedAddress: text("normalized_address").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  postcode: text("postcode"),
  technology: text("technology"),
  maxTier: text("max_tier"),
  available: integer("available"),
  source: text("source").notNull(), // 'wholesale_api' | 'dataset' | 'address_only'
  rawResponse: text("raw_response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCoverageCheckSchema = createInsertSchema(coverageChecks).omit({
  id: true,
  createdAt: true,
});

export type InsertCoverageCheck = z.infer<typeof insertCoverageCheckSchema>;
export type CoverageCheck = typeof coverageChecks.$inferSelect;

// Modem Enquiries Table
export const modemEnquiries = pgTable("modem_enquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  product: text("product").notNull(),
  quantity: integer("quantity").notNull().default(1),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertModemEnquirySchema = createInsertSchema(modemEnquiries).omit({
  id: true,
  createdAt: true,
});

export type InsertModemEnquiry = z.infer<typeof insertModemEnquirySchema>;
export type ModemEnquiry = typeof modemEnquiries.$inferSelect;

// Email Signups Table (Coming Soon notifications)
export const emailSignups = pgTable("email_signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  source: text("source").notNull().default("coming-soon"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEmailSignupSchema = createInsertSchema(emailSignups).omit({
  id: true,
  createdAt: true,
});

export type InsertEmailSignup = z.infer<typeof insertEmailSignupSchema>;
export type EmailSignup = typeof emailSignups.$inferSelect;

// Billing History Table
export const billingHistory = pgTable("billing_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: text("amount").notNull(),
  description: text("description").notNull(),
  planId: text("plan_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBillingHistorySchema = createInsertSchema(billingHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertBillingHistory = z.infer<typeof insertBillingHistorySchema>;
export type BillingHistory = typeof billingHistory.$inferSelect;

// Usage Records Table
export const usageRecords = pgTable("usage_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  downloadGb: text("download_gb").notNull(),
  uploadGb: text("upload_gb").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const insertUsageRecordSchema = createInsertSchema(usageRecords).omit({
  id: true,
  recordedAt: true,
});

export type InsertUsageRecord = z.infer<typeof insertUsageRecordSchema>;
export type UsageRecord = typeof usageRecords.$inferSelect;

// Service Qualifications Table (NBN SQ responses)
export const serviceQualifications = pgTable("service_qualifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  locId: text("loc_id"), // NBN Location ID
  csaId: text("csa_id"), // Connectivity Serving Area ID
  address: text("address").notNull(),
  postcode: text("postcode"),
  suburb: text("suburb"),
  state: text("state"),
  technology: text("technology").notNull(), // FTTP, FTTC, FTTB, HFC, FW, SAT
  maxDownload: integer("max_download"), // Mbps
  maxUpload: integer("max_upload"), // Mbps
  bandwidthProfile: text("bandwidth_profile"), // e.g., "TC4/1000/50"
  serviceClass: integer("service_class"), // 1-4
  newDevelopment: integer("new_development").default(0),
  sqReference: text("sq_reference"), // SQ transaction reference
  validUntil: timestamp("valid_until"),
  rawResponse: text("raw_response"), // Store full API response for debugging
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertServiceQualificationSchema = createInsertSchema(serviceQualifications).omit({
  id: true,
  createdAt: true,
});

export type InsertServiceQualification = z.infer<typeof insertServiceQualificationSchema>;
export type ServiceQualification = typeof serviceQualifications.$inferSelect;

// Service Orders Table (NBN connection orders)
export const serviceOrders = pgTable("service_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  qualificationId: varchar("qualification_id").references(() => serviceQualifications.id),
  orderReference: text("order_reference").notNull(), // BroNET order number
  nbnOrderId: text("nbn_order_id"), // NBN Co order ID (when RSP connected)
  avcId: text("avc_id"), // Access Virtual Circuit ID (assigned by NBN)
  cvcId: text("cvc_id"), // Connectivity Virtual Circuit ID
  planId: text("plan_id").notNull(),
  planName: text("plan_name").notNull(),
  downloadSpeed: integer("download_speed"), // Mbps
  uploadSpeed: integer("upload_speed"), // Mbps
  serviceAddress: text("service_address").notNull(),
  locId: text("loc_id"),
  technology: text("technology"),
  status: text("status").notNull().default("pending"), // pending, submitted, in_progress, provisioning, active, cancelled, failed
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  preferredDate: timestamp("preferred_date"),
  estimatedConnectionDate: timestamp("estimated_connection_date"),
  actualConnectionDate: timestamp("actual_connection_date"),
  stripeSessionId: text("stripe_session_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertServiceOrderSchema = createInsertSchema(serviceOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertServiceOrder = z.infer<typeof insertServiceOrderSchema>;
export type ServiceOrder = typeof serviceOrders.$inferSelect;

// Order status history for tracking
export const orderStatusHistory = pgTable("order_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => serviceOrders.id).notNull(),
  status: text("status").notNull(),
  message: text("message"),
  updatedBy: text("updated_by"), // 'system', 'admin', 'nbn_api'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderStatusHistorySchema = createInsertSchema(orderStatusHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertOrderStatusHistory = z.infer<typeof insertOrderStatusHistorySchema>;
export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;

// Plans Table (for admin-managed internet plans)
export const plans = pgTable("plans", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  speed: integer("speed").notNull(),
  uploadSpeed: integer("upload_speed").notNull(),
  priceMonthly: integer("price_monthly").notNull(),
  promoPrice: integer("promo_price"),
  promoDuration: integer("promo_duration"),
  description: text("description"),
  features: text("features").array(),
  isActive: integer("is_active").notNull().default(1),
  displayOrder: integer("display_order").notNull().default(0),
});

export const insertPlanSchema = createInsertSchema(plans);

export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Plan = typeof plans.$inferSelect;

// Superloop Webhook Events Table
export const superloopEvents = pgTable("superloop_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: text("event_id").notNull(), // Superloop's unique event ID
  eventType: text("event_type").notNull(), // appointment, diagnostic, order, service, disruption, health, location_quote
  eventSubtype: text("event_subtype"), // e.g., appointment.created, order.status_changed
  orderId: varchar("order_id").references(() => serviceOrders.id), // Related order if applicable
  serviceId: text("service_id"), // Superloop service ID
  avcId: text("avc_id"), // Related AVC if applicable
  status: text("status"), // Event status (e.g., confirmed, cancelled)
  severity: text("severity"), // For disruptions: low, medium, high, critical
  title: text("title"),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at"), // For appointments
  startedAt: timestamp("started_at"), // For disruptions
  endedAt: timestamp("ended_at"), // For disruptions
  metadata: text("metadata"), // JSON string for additional event-specific data
  acknowledged: integer("acknowledged").default(0), // Whether admin has acknowledged the event
  acknowledgedBy: varchar("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSuperloopEventSchema = createInsertSchema(superloopEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertSuperloopEvent = z.infer<typeof insertSuperloopEventSchema>;
export type SuperloopEvent = typeof superloopEvents.$inferSelect;

// Network Disruptions Table (for aggregated outage tracking)
export const networkDisruptions = pgTable("network_disruptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  externalId: text("external_id"), // Superloop/NBN disruption ID
  title: text("title").notNull(),
  description: text("description"),
  severity: text("severity").notNull(), // low, medium, high, critical
  status: text("status").notNull().default("active"), // active, resolved, scheduled
  affectedAreas: text("affected_areas"), // JSON array of affected suburbs/regions
  affectedTechnologies: text("affected_technologies"), // JSON array: FTTP, HFC, etc.
  estimatedResolution: timestamp("estimated_resolution"),
  startedAt: timestamp("started_at").notNull(),
  resolvedAt: timestamp("resolved_at"),
  source: text("source").default("superloop"), // superloop, nbn, manual
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertNetworkDisruptionSchema = createInsertSchema(networkDisruptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertNetworkDisruption = z.infer<typeof insertNetworkDisruptionSchema>;
export type NetworkDisruption = typeof networkDisruptions.$inferSelect;

// Service Health Records (periodic health checks from Superloop)
export const serviceHealthRecords = pgTable("service_health_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: text("service_id").notNull(), // Superloop service ID
  avcId: text("avc_id"), // NBN AVC ID
  orderId: varchar("order_id").references(() => serviceOrders.id),
  userId: varchar("user_id").references(() => users.id),
  status: text("status").notNull(), // healthy, degraded, down
  syncSpeed: integer("sync_speed"), // Line sync speed in Mbps
  maxAttainableSpeed: integer("max_attainable_speed"),
  signalQuality: text("signal_quality"), // good, fair, poor
  errorCount: integer("error_count"), // CRC errors etc.
  latency: integer("latency"), // ms
  packetLoss: text("packet_loss"), // percentage as string
  metadata: text("metadata"), // JSON for additional diagnostics
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const insertServiceHealthRecordSchema = createInsertSchema(serviceHealthRecords).omit({
  id: true,
  recordedAt: true,
});

export type InsertServiceHealthRecord = z.infer<typeof insertServiceHealthRecordSchema>;
export type ServiceHealthRecord = typeof serviceHealthRecords.$inferSelect;

// Appointment Slots (for technician appointments)
export const appointmentSlots = pgTable("appointment_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => serviceOrders.id).notNull(),
  externalAppointmentId: text("external_appointment_id"), // Superloop/NBN appointment ID
  slotDate: timestamp("slot_date").notNull(),
  slotWindow: text("slot_window"), // AM, PM, ALL_DAY
  status: text("status").notNull().default("scheduled"), // scheduled, confirmed, completed, cancelled, rescheduled
  technicianName: text("technician_name"),
  technicianPhone: text("technician_phone"),
  notes: text("notes"),
  confirmedAt: timestamp("confirmed_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAppointmentSlotSchema = createInsertSchema(appointmentSlots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppointmentSlot = z.infer<typeof insertAppointmentSlotSchema>;
export type AppointmentSlot = typeof appointmentSlots.$inferSelect;

// Re-export chat models
export * from "./models/chat";
