import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { 
  insertUserSchema, 
  insertTicketSchema, 
  insertContactMessageSchema, 
  insertIncidentSchema 
} from "@shared/schema";

const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session middleware
  app.use(
    session({
      store: new PgSession({
        pool,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "bronet-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // ============ AUTH ROUTES ============
  
  // Sign Up
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName, planId } = req.body;
      
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Check if user exists
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create user with hashed password (base64 for demo)
      const user = await storage.createUser({
        email,
        passwordHash: btoa(password),
        firstName,
        lastName,
        planId: planId || null,
        isAdmin: 0,
      });
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { passwordHash, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Signup failed" });
    }
  });

  // Sign In
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.passwordHash !== btoa(password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { passwordHash, ...userWithoutPassword } = user;
      res.status(200).json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update profile
  app.patch("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const { firstName, lastName, planId } = req.body;
      const user = await storage.updateUser(req.session.userId!, {
        firstName,
        lastName,
        planId,
      });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // ============ TICKET ROUTES ============
  
  // Get user tickets
  app.get("/api/tickets", requireAuth, async (req, res) => {
    try {
      const tickets = await storage.getTickets(req.session.userId!);
      res.json({ tickets });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create ticket
  app.post("/api/tickets", requireAuth, async (req, res) => {
    try {
      const { subject, message } = req.body;
      
      if (!subject || !message) {
        return res.status(400).json({ message: "Subject and message are required" });
      }
      
      const ticket = await storage.createTicket({
        userId: req.session.userId!,
        subject,
        message,
        status: 'open',
      });
      res.status(201).json({ ticket });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============ INCIDENT ROUTES ============
  
  // Get all incidents
  app.get("/api/incidents", async (_req, res) => {
    try {
      const incidents = await storage.getIncidents();
      res.json({ incidents });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create incident (admin only - simplified, no real admin check for demo)
  app.post("/api/incidents", requireAuth, async (req, res) => {
    try {
      const data = insertIncidentSchema.parse(req.body);
      const incident = await storage.createIncident(data);
      res.status(201).json({ incident });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Resolve incident
  app.patch("/api/incidents/:id/resolve", requireAuth, async (req, res) => {
    try {
      await storage.resolveIncident(req.params.id);
      res.json({ message: "Incident resolved" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============ CONTACT MESSAGE ROUTES ============
  
  // Get user contact messages
  app.get("/api/messages", requireAuth, async (req, res) => {
    try {
      const messages = await storage.getContactMessages(req.session.userId!);
      res.json({ messages });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create contact message (can be guest or logged in)
  app.post("/api/messages", async (req, res) => {
    try {
      const data = insertContactMessageSchema.parse({
        ...req.body,
        userId: req.session.userId || null,
      });
      
      const message = await storage.createContactMessage(data);
      res.status(201).json({ message });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============ USAGE DATA (Mock for now) ============
  app.get("/api/usage", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const seed = userId.charCodeAt(0);
      const usage = [
        { month: 'Current', download: 450 + (seed % 100), upload: 45 + (seed % 10) },
        { month: 'Last Month', download: 420 + (seed % 100), upload: 40 + (seed % 10) },
        { month: '2 Months Ago', download: 380 + (seed % 100), upload: 35 + (seed % 10) },
      ];
      res.json({ usage });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============ COVERAGE CHECK ============
  
  // Check if coverage API is configured
  app.get("/api/coverage/status", async (_req, res) => {
    const isConfigured = !!(process.env.COVERAGE_API_URL && process.env.COVERAGE_API_KEY);
    res.json({ 
      configured: isConfigured,
      requiredEnvVars: ['COVERAGE_API_URL', 'COVERAGE_API_KEY']
    });
  });

  // Perform coverage check
  app.post("/api/coverage/check", async (req, res) => {
    try {
      const { address } = req.body;

      if (!address || typeof address !== 'string' || address.trim().length < 5) {
        return res.status(400).json({ message: "Valid address is required" });
      }

      const apiUrl = process.env.COVERAGE_API_URL;
      const apiKey = process.env.COVERAGE_API_KEY;

      // Check if API is configured
      if (!apiUrl || !apiKey) {
        return res.status(503).json({ 
          message: "Coverage API not configured",
          configured: false,
          requiredEnvVars: ['COVERAGE_API_URL', 'COVERAGE_API_KEY']
        });
      }

      // Call external coverage API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ address: address.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Coverage API returned ${response.status}`);
      }

      const data = await response.json();

      // Parse API response (adjust based on actual API structure)
      const result = {
        address: data.standardizedAddress || address,
        technology: data.technology || data.nbnTechnology || 'Unknown',
        maxSpeed: data.maxSpeed || data.downloadSpeed || 'Unknown',
        available: data.available !== false ? 1 : 0,
        rawResponse: JSON.stringify(data),
      };

      // Store in database if user is logged in
      if (req.session.userId) {
        await storage.createCoverageCheck({
          userId: req.session.userId,
          ...result,
        });
      }

      res.json({ 
        success: true,
        result: {
          address: result.address,
          technology: result.technology,
          maxSpeed: result.maxSpeed,
          available: result.available === 1,
        }
      });

    } catch (error: any) {
      console.error('Coverage check error:', error);
      res.status(500).json({ 
        message: error.message || "Failed to check coverage",
        success: false,
      });
    }
  });

  // Get coverage check history
  app.get("/api/coverage/history", requireAuth, async (req, res) => {
    try {
      const checks = await storage.getCoverageChecks(req.session.userId!);
      res.json({ checks });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
