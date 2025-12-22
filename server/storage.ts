import { 
  users, 
  tickets, 
  ticketReplies,
  incidents, 
  contactMessages,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  // Tickets
  getTickets(userId: string): Promise<(Ticket & { replies: TicketReply[] })[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  addTicketReply(reply: InsertTicketReply): Promise<TicketReply>;

  // Incidents
  getIncidents(): Promise<Incident[]>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  resolveIncident(id: string): Promise<void>;

  // Contact Messages
  getContactMessages(userId: string): Promise<ContactMessage[]>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Tickets
  async getTickets(userId: string): Promise<(Ticket & { replies: TicketReply[] })[]> {
    const userTickets = await db
      .select()
      .from(tickets)
      .where(eq(tickets.userId, userId))
      .orderBy(desc(tickets.createdAt));

    const ticketsWithReplies = await Promise.all(
      userTickets.map(async (ticket) => {
        const replies = await db
          .select()
          .from(ticketReplies)
          .where(eq(ticketReplies.ticketId, ticket.id))
          .orderBy(ticketReplies.createdAt);
        return { ...ticket, replies };
      })
    );

    return ticketsWithReplies;
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db
      .insert(tickets)
      .values(ticket)
      .returning();
    return newTicket;
  }

  async addTicketReply(reply: InsertTicketReply): Promise<TicketReply> {
    const [newReply] = await db
      .insert(ticketReplies)
      .values(reply)
      .returning();
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
    const [newIncident] = await db
      .insert(incidents)
      .values(incident)
      .returning();
    return newIncident;
  }

  async resolveIncident(id: string): Promise<void> {
    await db
      .update(incidents)
      .set({ status: 'resolved', updatedAt: new Date() })
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

  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [newMessage] = await db
      .insert(contactMessages)
      .values(message)
      .returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();
