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

// Re-export chat models
export * from "./models/chat";
