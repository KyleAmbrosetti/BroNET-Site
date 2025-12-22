// ... imports
// ... previous types

export type ContactMessage = {
  id: string;
  userId?: string; // Optional if guest
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt: string;
};

// ... previous DB_KEYS
const DB_KEYS = {
  USERS: 'bronet_users',
  TICKETS: 'bronet_tickets',
  INCIDENTS: 'bronet_incidents',
  SESSION: 'bronet_session',
  CONTACT_MESSAGES: 'bronet_contact_messages',
};

// ... previous code

class MockDB {
  // ... previous methods

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
