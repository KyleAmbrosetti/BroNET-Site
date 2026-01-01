// Types
export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string; // "Hashed" (simulated)
  planId?: string;
  joinedAt: string;
  isAdmin?: boolean;
};

export type Ticket = {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'closed' | 'in-progress';
  createdAt: string;
  replies: { id: string; sender: 'user' | 'support'; message: string; createdAt: string }[];
};

export type Incident = {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  createdAt: string;
  updatedAt: string;
};

export type UsageData = {
  month: string;
  download: number; // GB
  upload: number; // GB
};

export type ContactMessage = {
  id: string;
  userId?: string; // Optional if guest
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt: string;
};

// Mock DB Implementation
const DB_KEYS = {
  USERS: 'bronet_users',
  TICKETS: 'bronet_tickets',
  INCIDENTS: 'bronet_incidents',
  SESSION: 'bronet_session',
  CONTACT_MESSAGES: 'bronet_contact_messages',
};

// Simple ID generator
const genId = () => Math.random().toString(36).substr(2, 9);

// Initial Data
const SEED_INCIDENTS: Incident[] = [
  {
    id: 'inc_1',
    title: 'NBN Maintenance - Western Sydney',
    status: 'resolved',
    severity: 'minor',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  }
];

class MockDB {
  private getUsers(): User[] {
    const data = localStorage.getItem(DB_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  }

  private saveUsers(users: User[]) {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  }

  // --- Auth ---
  createUser(data: Omit<User, 'id' | 'joinedAt'>): User {
    const users = this.getUsers();
    if (users.find(u => u.email === data.email)) {
      throw new Error('Email already exists');
    }
    const newUser: User = {
      ...data,
      id: genId(),
      joinedAt: new Date().toISOString(),
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  authenticate(email: string, password: string): User {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.passwordHash === btoa(password));
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return user;
  }

  updateUser(id: string, data: Partial<User>): User {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    
    users[idx] = { ...users[idx], ...data };
    this.saveUsers(users);
    return users[idx];
  }

  // --- Tickets ---
  getTickets(userId: string): Ticket[] {
    const data = localStorage.getItem(DB_KEYS.TICKETS);
    const tickets: Ticket[] = data ? JSON.parse(data) : [];
    return tickets.filter(t => t.userId === userId);
  }

  createTicket(userId: string, subject: string, message: string): Ticket {
    const data = localStorage.getItem(DB_KEYS.TICKETS);
    const tickets: Ticket[] = data ? JSON.parse(data) : [];
    
    const newTicket: Ticket = {
      id: genId(),
      userId,
      subject,
      message,
      status: 'open',
      createdAt: new Date().toISOString(),
      replies: []
    };
    
    tickets.push(newTicket);
    localStorage.setItem(DB_KEYS.TICKETS, JSON.stringify(tickets));
    return newTicket;
  }

  replyToTicket(ticketId: string, message: string, sender: 'user' | 'support'): Ticket {
    const data = localStorage.getItem(DB_KEYS.TICKETS);
    const tickets: Ticket[] = data ? JSON.parse(data) : [];
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx === -1) throw new Error('Ticket not found');

    tickets[idx].replies.push({
      id: genId(),
      sender,
      message,
      createdAt: new Date().toISOString()
    });
    
    localStorage.setItem(DB_KEYS.TICKETS, JSON.stringify(tickets));
    return tickets[idx];
  }

  // --- Incidents ---
  getIncidents(): Incident[] {
    const data = localStorage.getItem(DB_KEYS.INCIDENTS);
    return data ? JSON.parse(data) : SEED_INCIDENTS;
  }

  createIncident(incident: Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>): Incident {
    const incidents = this.getIncidents();
    const newIncident: Incident = {
      ...incident,
      id: genId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    incidents.unshift(newIncident); // Newest first
    localStorage.setItem(DB_KEYS.INCIDENTS, JSON.stringify(incidents));
    return newIncident;
  }

  resolveIncident(id: string) {
    const incidents = this.getIncidents();
    const idx = incidents.findIndex(i => i.id === id);
    if (idx !== -1) {
      incidents[idx].status = 'resolved';
      incidents[idx].updatedAt = new Date().toISOString();
      localStorage.setItem(DB_KEYS.INCIDENTS, JSON.stringify(incidents));
    }
  }

  // --- Usage (Generated Mock) ---
  getUsage(userId: string): UsageData[] {
    // Deterministic mock based on User ID
    const seed = userId.charCodeAt(0);
    return [
      { month: 'Current', download: 450 + (seed % 100), upload: 45 + (seed % 10) },
      { month: 'Last Month', download: 420 + (seed % 100), upload: 40 + (seed % 10) },
      { month: '2 Months Ago', download: 380 + (seed % 100), upload: 35 + (seed % 10) },
    ];
  }

  // --- Contact Messages ---
  getContactMessages(userId: string): ContactMessage[] {
    const data = localStorage.getItem(DB_KEYS.CONTACT_MESSAGES);
    const messages: ContactMessage[] = data ? JSON.parse(data) : [];
    // Only return messages linked to this user (if they were logged in)
    return messages.filter(m => m.userId === userId);
  }

  saveContactMessage(data: Omit<ContactMessage, 'id' | 'createdAt'>): ContactMessage {
    const stored = localStorage.getItem(DB_KEYS.CONTACT_MESSAGES);
    const messages: ContactMessage[] = stored ? JSON.parse(stored) : [];
    
    const newMessage: ContactMessage = {
      ...data,
      id: genId(),
      createdAt: new Date().toISOString(),
    };
    
    messages.push(newMessage);
    localStorage.setItem(DB_KEYS.CONTACT_MESSAGES, JSON.stringify(messages));
    return newMessage;
  }
}

export const db = new MockDB();
