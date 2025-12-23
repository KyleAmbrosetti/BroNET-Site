import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";

// Rate limiting map: IP -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20; // Max requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Initialize OpenAI client (may be null if not configured)
let openai: OpenAI | null = null;
try {
  if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
    openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
} catch (error) {
  console.warn("OpenAI client initialization failed, will use fallback mode:", error);
}

// BroNET FAQ knowledge base for fallback mode
const BRONET_FAQ = {
  plans: {
    nbn25: { name: "Basic", speed: "25Mbps", price: "$59/month", description: "Perfect for browsing and email" },
    nbn50: { name: "Standard", speed: "50Mbps", price: "$69/month", description: "Great for streaming and working from home" },
    nbn100: { name: "Fast", speed: "100Mbps", price: "$79/month", description: "Ideal for households with multiple users" },
    nbn250: { name: "Superfast", speed: "250Mbps", price: "$99/month", description: "Perfect for heavy usage and 4K streaming" },
    nbn1000: { name: "Ultra", speed: "1000Mbps", price: "$129/month", description: "Ultimate speed for power users and gamers" },
  },
  modems: {
    eero7: { name: "eero 7", price: "$299", description: "Reliable mesh WiFi coverage for most homes" },
    eero_pro7: { name: "eero Pro 7", price: "$599", description: "Premium mesh WiFi with maximum coverage and speed" },
  },
  support: "24/7 support available via dashboard support tickets. Check your dashboard for account details and billing.",
  coverage: "BroNET services all NBN-connected areas in Australia. Use our coverage checker to verify availability at your address.",
  billing: "Monthly billing cycles. Payment methods and invoice history available in your dashboard.",
};

// Secret redaction patterns
const SECRET_PATTERNS = [
  /\b[A-Za-z0-9]{32,}\b/g, // API keys (long alphanumeric)
  /\bsk-[A-Za-z0-9]{20,}\b/g, // OpenAI-style keys
  /\bpassword[:\s]*[^\s]+/gi, // Password mentions
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card numbers
];

function redactSecrets(text: string): string {
  let redacted = text;
  SECRET_PATTERNS.forEach(pattern => {
    redacted = redacted.replace(pattern, '[REDACTED]');
  });
  return redacted;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}

function getFallbackResponse(message: string): string {
  const lowerMsg = message.toLowerCase();
  
  // Plans query
  if (lowerMsg.includes('plan') || lowerMsg.includes('price') || lowerMsg.includes('cost')) {
    const planList = Object.values(BRONET_FAQ.plans)
      .map(p => `${p.name} (${p.speed}): ${p.price} - ${p.description}`)
      .join('\n');
    return `G'day! Here are BroNET's NBN plans:\n\n${planList}\n\nYou can view more details and sign up at /plans`;
  }
  
  // Modem query
  if (lowerMsg.includes('modem') || lowerMsg.includes('router') || lowerMsg.includes('eero')) {
    const modemList = Object.values(BRONET_FAQ.modems)
      .map(m => `${m.name}: ${m.price} - ${m.description}`)
      .join('\n');
    return `We offer premium mesh WiFi routers:\n\n${modemList}\n\nCheck out /modems for more information.`;
  }
  
  // Coverage query
  if (lowerMsg.includes('coverage') || lowerMsg.includes('available') || lowerMsg.includes('area')) {
    return `${BRONET_FAQ.coverage} Visit /coverage to check if NBN is available at your address.`;
  }
  
  // Support query
  if (lowerMsg.includes('support') || lowerMsg.includes('help') || lowerMsg.includes('contact')) {
    return `${BRONET_FAQ.support} You can also visit /support for FAQs and contact information.`;
  }
  
  // Billing query
  if (lowerMsg.includes('bill') || lowerMsg.includes('payment') || lowerMsg.includes('invoice')) {
    return `${BRONET_FAQ.billing} For account-specific details, please log in to your dashboard at /dashboard.`;
  }
  
  // Default response
  return `G'day! I'm BroNET's customer support assistant. I can help you with:\n\n• NBN Plans & Pricing\n• Modem & Router Options\n• Coverage & Availability\n• Account & Billing\n• Technical Support\n\nWhat would you like to know about?`;
}

export function registerChatRoutes(app: Express): void {
  // Check AI configuration status
  app.get("/api/chat/config-status", (req: Request, res: Response) => {
    const isConfigured = !!openai;
    const saveLogs = process.env.SAVE_CHAT_LOGS === 'true';
    res.json({ 
      isConfigured, 
      saveLogs,
      mode: isConfigured ? 'ai' : 'fallback',
      provider: isConfigured ? 'OpenAI (Replit AI Integrations)' : 'Built-in FAQ'
    });
  });
  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Enhanced chat stream endpoint with AI and fallback modes
  app.post("/api/chat/stream", async (req: Request, res: Response) => {
    try {
      const { conversationId, message, systemPrompt } = req.body;
      const userId = req.session?.userId;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const saveLogs = process.env.SAVE_CHAT_LOGS === 'true';
      
      // Rate limiting check
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ 
          error: "Too many requests. Please wait a moment before trying again." 
        });
      }
      
      // Redact secrets from user message
      const sanitizedMessage = redactSecrets(message);
      
      let convId = conversationId;
      
      // Create or get conversation (save only if logging enabled)
      if (!convId && saveLogs) {
        const conversation = await chatStorage.createConversation("Support Chat", userId || null);
        convId = conversation.id;
      }
      
      // Save user message only if logging enabled
      if (convId && saveLogs) {
        await chatStorage.createMessage(convId, "user", sanitizedMessage);
      }
      
      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      
      // Send conversation ID and mode
      res.write(`data: ${JSON.stringify({ 
        conversationId: convId || null,
        mode: openai ? 'ai' : 'fallback'
      })}\n\n`);
      
      let fullResponse = "";
      
      if (openai) {
        // AI mode: Use OpenAI
        try {
          // Get conversation history for context (only if logging enabled)
          const chatMessages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [];
          
          if (systemPrompt) {
            chatMessages.push({ role: "system", content: systemPrompt });
          }
          
          if (convId && saveLogs) {
            const messages = await chatStorage.getMessagesByConversation(convId);
            chatMessages.push(...messages.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })));
          } else {
            // No conversation history, just add current message
            chatMessages.push({ role: "user", content: sanitizedMessage });
          }
          
          const stream = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: chatMessages,
            stream: true,
            max_completion_tokens: 1024,
          });
          
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullResponse += content;
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          }
        } catch (error) {
          console.error("AI mode failed, falling back to FAQ:", error);
          // Fall back to FAQ mode on AI error
          fullResponse = getFallbackResponse(sanitizedMessage);
          res.write(`data: ${JSON.stringify({ content: fullResponse })}\n\n`);
        }
      } else {
        // Fallback mode: Use built-in FAQ
        fullResponse = getFallbackResponse(sanitizedMessage);
        // Simulate streaming for consistent UX
        const words = fullResponse.split(' ');
        for (let i = 0; i < words.length; i++) {
          const chunk = (i === 0 ? '' : ' ') + words[i];
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }
      
      // Save assistant message only if logging enabled
      if (convId && saveLogs) {
        await chatStorage.createMessage(convId, "assistant", fullResponse);
      }
      
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in chat stream:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to get response" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process chat" });
      }
    }
  });
  
  // Export conversation to support ticket
  app.post("/api/chat/export-ticket", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Must be logged in to export to ticket" });
      }
      
      const { conversationId, subject } = req.body;
      if (!conversationId) {
        return res.status(400).json({ error: "Conversation ID required" });
      }
      
      // Get conversation messages
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      
      // Format conversation as ticket description
      const description = messages
        .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
        .join('\n\n');
      
      // This assumes there's a storage.createTicket method from the main storage
      // We'll need to import and use it
      res.json({ 
        success: true,
        description,
        subject: subject || 'Chat Support Conversation'
      });
    } catch (error) {
      console.error("Error exporting to ticket:", error);
      res.status(500).json({ error: "Failed to export conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response from OpenAI
      const stream = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 2048,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}

