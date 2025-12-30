import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { checkNBNAvailability } from "../../services/sq";
import { storage } from "../../storage";

// Define the tools for OpenAI function calling
const ALEX_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "check_nbn_coverage",
      description: "Check NBN availability and speed tiers at an Australian address. Use this when the user provides an address and wants to know if NBN is available.",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "The full Australian address to check, e.g. '123 Main Street, Sydney NSW 2000'"
          }
        },
        required: ["address"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_plan_details",
      description: "Get details about BroNET internet plans. Use this when the user asks about plans, pricing, or speeds.",
      parameters: {
        type: "object",
        properties: {
          plan_type: {
            type: "string",
            enum: ["all", "everyday", "extra_value", "family_max", "lightspeed", "hyperspeed"],
            description: "The specific plan to get details for, or 'all' for all plans"
          }
        },
        required: ["plan_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_account_info",
      description: "Get the logged-in user's account information including their current plan and service status. Only use this when the user asks about their own account, plan, or service.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_support_ticket",
      description: "Create a support ticket for the user. Use this when the user wants to report an issue, request help, or needs to escalate to human support.",
      parameters: {
        type: "object",
        properties: {
          subject: {
            type: "string",
            description: "A brief summary of the issue"
          },
          description: {
            type: "string",
            description: "Detailed description of the issue or request"
          }
        },
        required: ["subject", "description"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_network_outages",
      description: "Check for any current network outages or incidents affecting BroNET services. Use this when users report connectivity issues or ask about outages.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_billing_info",
      description: "Get the user's billing information including next payment date, current charges, and recent invoices. Only use for logged-in users asking about their bill or payments.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_usage_data",
      description: "Get the user's internet usage data for the current and recent billing periods. Use when users ask about their data usage or how much they've downloaded.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_service_status",
      description: "Check the current status of the user's internet service connection. Use when users ask if their service is active, connected, or having issues.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  }
];

// Context for tool execution
interface ToolContext {
  userId?: string;
}

// Function to execute tool calls with user context
async function executeToolCall(toolName: string, args: Record<string, any>, context: ToolContext = {}): Promise<string> {
  switch (toolName) {
    case "check_nbn_coverage": {
      try {
        const result = await checkNBNAvailability(args.address, '', undefined, undefined);
        if (result.error || !result.available) {
          return JSON.stringify({
            available: false,
            address: args.address,
            message: result.error || "NBN service is not currently available at this address.",
            suggestion: "Please verify the address is correct or contact support for assistance."
          });
        }
        return JSON.stringify({
          available: true,
          address: result.formattedAddress || args.address,
          technology: result.technology || "NBN",
          maxSpeed: result.maxTier || "Contact for details",
          message: `NBN is available via ${result.technology || 'NBN'}. Maximum speed: ${result.maxTier || 'Contact for details'}.`
        });
      } catch (error) {
        return JSON.stringify({
          available: false,
          error: "Unable to check coverage at this time. Please try the coverage checker at /coverage."
        });
      }
    }
    case "get_plan_details": {
      const plans = {
        everyday: { name: "Everyday", speed: "25Mbps", promo: "$45/month for 6 months", regular: "$72/month", description: "Great for casual browsing and email" },
        extra_value: { name: "Extra Value", speed: "50Mbps", promo: "$65/month for 6 months", regular: "$85/month", description: "Perfect for HD streaming" },
        family_max: { name: "Family Max", speed: "500Mbps", promo: "$69/month for 6 months", regular: "$95/month", description: "Ideal for families - RECOMMENDED", recommended: true },
        lightspeed: { name: "Lightspeed", speed: "1000Mbps", promo: "$85/month for 6 months", regular: "$109/month", description: "Ultra-fast for power users" },
        hyperspeed: { name: "Hyperspeed", speed: "2000Mbps", promo: "$145/month for 6 months", regular: "$165/month", description: "Maximum speed available" }
      };
      
      if (args.plan_type === "all") {
        return JSON.stringify({ plans: Object.values(plans), note: "All plans include unlimited data and no lock-in contracts" });
      }
      const plan = plans[args.plan_type as keyof typeof plans];
      return plan ? JSON.stringify(plan) : JSON.stringify({ error: "Plan not found" });
    }
    case "get_account_info": {
      if (!context.userId) {
        return JSON.stringify({
          error: "User not logged in",
          message: "Please log in to view your account information. You can log in at /auth or check your dashboard at /dashboard."
        });
      }
      try {
        const user = await storage.getUser(context.userId);
        if (!user) {
          return JSON.stringify({ error: "User not found" });
        }
        // Get user's tickets
        const tickets = await storage.getTicketsByUser(context.userId);
        const openTickets = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed');
        
        const fullName = `${user.firstName} ${user.lastName}`.trim();
        
        return JSON.stringify({
          name: fullName,
          email: user.email,
          plan: user.planId || "No active plan",
          serviceAddress: user.serviceAddress || "Not set",
          accountStatus: "Active",
          openTickets: openTickets.length,
          message: `Account found for ${fullName}. ${openTickets.length > 0 ? `You have ${openTickets.length} open support ticket(s).` : ''}`
        });
      } catch (error) {
        return JSON.stringify({
          error: "Unable to retrieve account information",
          message: "Please check your dashboard at /dashboard for account details."
        });
      }
    }
    case "create_support_ticket": {
      if (!context.userId) {
        return JSON.stringify({
          error: "User not logged in",
          message: "Please log in to create a support ticket. You can log in at /auth or create a ticket from your dashboard at /dashboard."
        });
      }
      try {
        const ticket = await storage.createTicket({
          userId: context.userId,
          subject: args.subject,
          description: args.description
        });
        return JSON.stringify({
          success: true,
          ticketId: ticket.id,
          message: `Support ticket #${ticket.id} has been created. Our team will respond within 24 hours. You can track your ticket in your dashboard at /dashboard.`
        });
      } catch (error) {
        return JSON.stringify({
          error: "Failed to create ticket",
          message: "Unable to create the support ticket. Please try again or submit through your dashboard at /dashboard."
        });
      }
    }
    case "check_network_outages": {
      try {
        const allIncidents = await storage.getIncidents();
        // Filter for active incidents (not resolved)
        const incidents = allIncidents.filter(inc => 
          inc.status === 'investigating' || inc.status === 'identified' || inc.status === 'monitoring'
        );
        if (incidents.length === 0) {
          return JSON.stringify({
            hasOutages: false,
            message: "All systems are operating normally. There are no current network outages or incidents affecting BroNET services.",
            checkTime: new Date().toISOString()
          });
        }
        const activeIncidents = incidents.map(inc => ({
          title: inc.title,
          severity: inc.severity,
          status: inc.status,
          affectedAreas: inc.affectedAreas,
          description: inc.description
        }));
        return JSON.stringify({
          hasOutages: true,
          count: incidents.length,
          incidents: activeIncidents,
          message: `There ${incidents.length === 1 ? 'is' : 'are'} currently ${incidents.length} active incident(s) affecting BroNET services.`,
          moreInfo: "Visit /support for full network status updates."
        });
      } catch (error) {
        return JSON.stringify({
          error: "Unable to check network status",
          message: "Please visit /support to view the current network status."
        });
      }
    }
    case "get_billing_info": {
      if (!context.userId) {
        return JSON.stringify({
          error: "User not logged in",
          message: "Please log in to view your billing information. You can access billing details in your dashboard at /dashboard."
        });
      }
      try {
        const user = await storage.getUser(context.userId);
        if (!user) {
          return JSON.stringify({ error: "User not found" });
        }
        
        // Get billing info based on plan pricing
        const planPrices: Record<string, number> = {
          'everyday': 72,
          'extra_value': 85,
          'family_max': 95,
          'lightspeed': 109,
          'hyperspeed': 165
        };
        
        const currentPlan = user.planId || 'none';
        const monthlyAmount = planPrices[currentPlan] || 0;
        
        if (currentPlan === 'none') {
          return JSON.stringify({
            plan: 'No active plan',
            message: "No active subscription found. Visit /plans to sign up for BroNET internet.",
            manageAt: "Visit /signup to get started."
          });
        }
        
        return JSON.stringify({
          plan: currentPlan.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          monthlyAmount: `$${monthlyAmount}/month`,
          paymentMethod: user.stripeCustomerId ? "Card on file" : "Not set up",
          message: `Your ${currentPlan.replace('_', ' ')} plan costs $${monthlyAmount}/month.`,
          note: "For your exact billing date, payment history, and invoices, please check your dashboard.",
          manageAt: "Visit /dashboard to view billing details and manage payment methods."
        });
      } catch (error) {
        return JSON.stringify({
          error: "Unable to retrieve billing information",
          message: "Please check your dashboard at /dashboard for billing details."
        });
      }
    }
    case "get_usage_data": {
      if (!context.userId) {
        return JSON.stringify({
          error: "User not logged in",
          message: "Please log in to view your usage data. You can access usage stats in your dashboard at /dashboard."
        });
      }
      try {
        const user = await storage.getUser(context.userId);
        if (!user) {
          return JSON.stringify({ error: "User not found" });
        }
        
        if (!user.planId) {
          return JSON.stringify({
            message: "No active plan found. Sign up at /plans to start using BroNET internet.",
            dataLimit: "N/A"
          });
        }
        
        // All BroNET plans include unlimited data
        return JSON.stringify({
          plan: user.planId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          dataLimit: "Unlimited",
          message: "Your BroNET plan includes unlimited data - download and stream as much as you like!",
          note: "For detailed usage statistics and history, please check your modem's admin panel or visit your dashboard.",
          viewDetails: "Visit /dashboard for account management."
        });
      } catch (error) {
        return JSON.stringify({
          error: "Unable to retrieve usage data",
          message: "Please check your dashboard at /dashboard for usage information."
        });
      }
    }
    case "check_service_status": {
      if (!context.userId) {
        return JSON.stringify({
          error: "User not logged in",
          message: "Please log in to check your service status. You can view your connection status in your dashboard at /dashboard."
        });
      }
      try {
        const user = await storage.getUser(context.userId);
        if (!user) {
          return JSON.stringify({ error: "User not found" });
        }
        
        // Check if user has an active service
        const hasActivePlan = !!user.planId;
        
        if (!hasActivePlan) {
          return JSON.stringify({
            status: "No active service",
            message: "You don't have an active internet plan. Visit /plans to sign up for BroNET internet.",
            action: "Sign up at /signup to get connected."
          });
        }
        
        // Check for any outages affecting this user's area
        const allIncidents = await storage.getIncidents();
        const activeIncidents = allIncidents.filter(inc => 
          inc.status === 'investigating' || inc.status === 'identified' || inc.status === 'monitoring'
        );
        
        // Safely extract suburb from address for matching
        let userSuburb = '';
        if (user.serviceAddress) {
          const addressParts = user.serviceAddress.split(',');
          if (addressParts.length > 1 && addressParts[1]) {
            userSuburb = addressParts[1].trim().toLowerCase();
          }
        }
        
        const areaIncidents = activeIncidents.filter(inc => {
          if (!userSuburb || !inc.affectedAreas) return false;
          return inc.affectedAreas.toLowerCase().includes(userSuburb);
        });
        
        if (areaIncidents.length > 0) {
          return JSON.stringify({
            status: "Potential issues",
            connectionHealth: "Degraded",
            activeIncidents: areaIncidents.length,
            message: `There may be network issues in your area. ${areaIncidents.length} incident(s) could be affecting your connection.`,
            troubleshooting: "Try restarting your modem. If issues persist, our team is working to resolve the outage.",
            moreInfo: "Visit /support for full network status."
          });
        }
        
        return JSON.stringify({
          status: "Active",
          connectionHealth: "Good",
          plan: user.planId?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          serviceAddress: user.serviceAddress || "Not set",
          lastChecked: new Date().toISOString(),
          message: "Your internet service is active and operating normally. No issues detected.",
          troubleshooting: "If you're experiencing issues, try restarting your modem or create a support ticket."
        });
      } catch (error) {
        return JSON.stringify({
          error: "Unable to check service status",
          message: "Please check your dashboard at /dashboard for service information."
        });
      }
    }
    default:
      return JSON.stringify({ error: "Unknown function" });
  }
}

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
  // Get all conversations (Admin only)
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      // Require authentication and admin access
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Check if user is admin (assuming user object has isAdmin property)
      // For now, just return user's own conversations for security
      const conversations = await chatStorage.getUserConversations(req.session.userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages (Owner or Admin only)
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Verify ownership - user must own this conversation
      if (conversation.userId && conversation.userId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
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
      const userId = req.session?.userId || null;
      const conversation = await chatStorage.createConversation(title || "New Chat", userId);
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
        // AI mode: Use OpenAI with function calling
        try {
          // Get conversation history for context (only if logging enabled)
          const chatMessages: Array<OpenAI.Chat.Completions.ChatCompletionMessageParam> = [];
          
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
          
          // First call - check if we need to use tools
          const initialResponse = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: chatMessages,
            tools: ALEX_TOOLS,
            tool_choice: "auto",
            max_completion_tokens: 1024,
          });
          
          const assistantMessage = initialResponse.choices[0]?.message;
          
          // Check if there are tool calls
          if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
            // Execute all tool calls
            const toolResults: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
            
            for (const toolCall of assistantMessage.tool_calls) {
              const args = JSON.parse(toolCall.function.arguments);
              const result = await executeToolCall(toolCall.function.name, args, { userId });
              
              // Send status update to client
              const statusMap: Record<string, string> = {
                'check_nbn_coverage': 'Checking NBN coverage...',
                'get_plan_details': 'Looking up plan details...',
                'get_account_info': 'Retrieving your account info...',
                'create_support_ticket': 'Creating support ticket...'
              };
              res.write(`data: ${JSON.stringify({ status: statusMap[toolCall.function.name] || 'Processing...' })}\n\n`);
              
              toolResults.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: result,
              });
            }
            
            // Add assistant message with tool calls and tool results
            chatMessages.push(assistantMessage);
            chatMessages.push(...toolResults);
            
            // Get final response with tool results
            const finalStream = await openai.chat.completions.create({
              model: "gpt-4.1-mini",
              messages: chatMessages,
              stream: true,
              max_completion_tokens: 1024,
            });
            
            for await (const chunk of finalStream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                fullResponse += content;
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            }
          } else {
            // No tool calls, stream the response directly
            if (assistantMessage?.content) {
              fullResponse = assistantMessage.content;
              // Simulate streaming for consistent UX
              const words = fullResponse.split(' ');
              for (let i = 0; i < words.length; i++) {
                const chunk = (i === 0 ? '' : ' ') + words[i];
                res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
                await new Promise(resolve => setTimeout(resolve, 15));
              }
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

