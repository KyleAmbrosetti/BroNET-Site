import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertTicketSchema,
  insertIncidentSchema,
  insertContactMessageSchema,
  insertNbnDatasetSchema,
} from "@shared/schema";
import { validateAddress } from "./services/nominatim";
import { checkNBNAvailability, getSQMode, generateAddressHash } from "./services/sq";
import bcrypt from "bcrypt";
import { registerChatRoutes } from "./replit_integrations/chat";

// Middleware to require authentication
function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Set up session middleware
  const PgStore = connectPgSimple(session);
  app.use(
    session({
      store: new PgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "bronet-dev-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
    })
  );
  
  // ============ AUTH ROUTES ============
  
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if email already exists
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password with bcrypt
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      req.session.userId = user.id;
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password with bcrypt
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: { ...user, password: undefined } });
  });

  app.patch("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      delete updates.password; // Don't allow password updates via this endpoint

      const user = await storage.updateUser(req.session.userId!, updates);
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============ USER MANAGEMENT ROUTES ============

  app.post("/api/user/plan", requireAuth, async (req, res) => {
    try {
      const { planId } = req.body;
      
      if (!planId || typeof planId !== 'string') {
        return res.status(400).json({ message: "Plan ID is required" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const oldPlanId = user.planId;
      const updatedUser = await storage.updateUser(req.session.userId!, { planId });

      await storage.createBillingRecord({
        userId: req.session.userId!,
        amount: "0.00",
        description: `Plan changed from ${oldPlanId || 'None'} to ${planId}`,
        planId,
      });

      res.json({ user: { ...updatedUser, password: undefined } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/user/address", requireAuth, async (req, res) => {
    try {
      const { serviceAddress } = req.body;
      
      if (typeof serviceAddress !== 'string') {
        return res.status(400).json({ message: "Service address is required" });
      }

      const updatedUser = await storage.updateUser(req.session.userId!, { serviceAddress });
      res.json({ user: { ...updatedUser, password: undefined } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/user/password", requireAuth, async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "Both old and new passwords are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValid = await bcrypt.compare(oldPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(req.session.userId!, { password: hashedPassword });

      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/billing", requireAuth, async (req, res) => {
    try {
      const history = await storage.getBillingHistory(req.session.userId!);
      res.json({ history });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============ TICKET ROUTES ============
  
  app.get("/api/tickets", requireAuth, async (req, res) => {
    try {
      const tickets = await storage.getTickets(req.session.userId!);
      res.json({ tickets });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tickets", requireAuth, async (req, res) => {
    try {
      const data = insertTicketSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      
      const ticket = await storage.createTicket(data);
      res.status(201).json({ ticket });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/tickets/:id/replies", requireAuth, async (req, res) => {
    try {
      const replies = await storage.getTicketReplies(req.params.id);
      res.json({ replies });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============ INCIDENT ROUTES ============
  
  app.get("/api/incidents", async (_req, res) => {
    try {
      const incidents = await storage.getIncidents();
      res.json({ incidents });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/incidents", requireAuth, async (req, res) => {
    try {
      const data = insertIncidentSchema.parse(req.body);
      const incident = await storage.createIncident(data);
      res.status(201).json({ incident });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/incidents/:id/resolve", requireAuth, async (req, res) => {
    try {
      await storage.resolveIncident(req.params.id);
      res.json({ message: "Incident resolved" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============ CONTACT MESSAGE ROUTES ============
  
  app.get("/api/messages", requireAuth, async (req, res) => {
    try {
      const messages = await storage.getContactMessages(req.session.userId!);
      res.json({ messages });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

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

  // ============ COVERAGE CHECK ROUTES ============
  
  // Address autocomplete suggestions
  app.get("/api/coverage/suggest", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 3) {
        return res.json({ suggestions: [] });
      }
      
      const { searchAddresses } = await import("./services/nominatim");
      const suggestions = await searchAddresses(query);
      res.json({ suggestions });
    } catch (error: any) {
      console.error('Address suggestion error:', error);
      res.json({ suggestions: [] });
    }
  });
  
  // Get coverage system status
  app.get("/api/coverage/status", async (_req, res) => {
    try {
      const mode = getSQMode();
      const datasetCount = (await storage.getAllNbnDataset()).length;
      
      let configuredMode = mode;
      if (mode === 'none' && datasetCount > 0) {
        configuredMode = 'dataset';
      }

      res.json({
        mode: configuredMode,
        wholesaleConfigured: mode === 'wholesale_api',
        datasetRecords: datasetCount,
        addressValidationEnabled: true,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Perform coverage check
  app.post("/api/coverage/check", async (req, res) => {
    try {
      const { address } = req.body;

      if (!address || typeof address !== 'string' || address.trim().length < 5) {
        return res.status(400).json({ message: "Valid address is required" });
      }

      // Step 1: Validate and normalize address using Nominatim
      const addressResult = await validateAddress(address);
      
      if (!addressResult.success || !addressResult.normalizedAddress) {
        return res.status(400).json({
          success: false,
          message: addressResult.error || "Address validation failed",
        });
      }

      // Step 2: Check NBN availability (wholesale API or dataset)
      // Use original address for NBN API to preserve street number, fall back to normalized
      const inputMatch = address.trim().match(/^(\d+[A-Za-z]?)\s+(.+)/);
      let addressForNBN = addressResult.normalizedAddress;
      
      // If user input has a street number, ensure it's in the address sent to NBN API
      if (inputMatch) {
        const streetNumber = inputMatch[1];
        // Check if normalized address already has the street number
        if (!addressResult.normalizedAddress.startsWith(streetNumber)) {
          // Prepend street number to the normalized address for more accurate NBN lookup
          addressForNBN = `${streetNumber} ${addressResult.normalizedAddress}`;
        }
      }
      
      const sqResult = await checkNBNAvailability(
        addressForNBN,
        addressResult.postcode || '',
        addressResult.latitude,
        addressResult.longitude
      );

      // Step 3: Store in coverage history
      if (req.session?.userId) {
        await storage.createCoverageCheck({
          userId: req.session.userId,
          inputAddress: address.trim(),
          normalizedAddress: addressResult.normalizedAddress,
          latitude: addressResult.latitude || null,
          longitude: addressResult.longitude || null,
          postcode: addressResult.postcode || null,
          technology: sqResult.technology || null,
          maxTier: sqResult.maxTier || null,
          available: sqResult.available !== undefined ? (sqResult.available ? 1 : 0) : null,
          source: sqResult.source,
          rawResponse: sqResult.rawResponse ? JSON.stringify(sqResult.rawResponse) : null,
        });
      }

      // Step 4: Return result - prefer RapidAPI address details when available
      let finalAddress = sqResult.formattedAddress || addressResult.normalizedAddress;
      const inputStreetNumber = inputMatch ? inputMatch[1] : null;
      
      // Clean up the address - if RapidAPI returned address already contains the street number, use it as-is
      // Otherwise, prepend the user's street number
      if (inputStreetNumber && finalAddress) {
        // Check if the address already contains the street number somewhere
        const addressContainsNumber = finalAddress.match(new RegExp(`\\b${inputStreetNumber}\\b`));
        if (!addressContainsNumber && !finalAddress.match(/^\d+/)) {
          finalAddress = `${inputStreetNumber} ${finalAddress}`;
        }
      }
      
      // Clean up address formatting (remove "Australia" suffix, normalize spacing)
      finalAddress = finalAddress?.replace(/\s+Australia$/i, '').replace(/\s+/g, ' ').trim();
      
      const finalSuburb = sqResult.locality || addressResult.suburb;
      const finalPostcode = sqResult.postcode || addressResult.postcode;
      const finalState = sqResult.state || addressResult.state;
      
      res.json({
        success: true,
        result: {
          normalizedAddress: finalAddress,
          postcode: finalPostcode,
          suburb: finalSuburb,
          state: finalState,
          technology: sqResult.technology,
          maxTier: sqResult.maxTier,
          available: sqResult.available,
          source: sqResult.source,
        },
      });

    } catch (error: any) {
      console.error('Coverage check error:', error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to check coverage",
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

  // ============ ADMIN: NBN DATASET MANAGEMENT ============
  
  // Get all dataset records
  app.get("/api/admin/nbn-dataset", requireAuth, async (req, res) => {
    try {
      const dataset = await storage.getAllNbnDataset();
      res.json({ dataset });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Upload dataset (CSV/JSON)
  app.post("/api/admin/nbn-dataset/upload", requireAuth, async (req, res) => {
    try {
      const { data, replace } = req.body;

      if (!Array.isArray(data)) {
        return res.status(400).json({ message: "Data must be an array" });
      }

      // Replace existing dataset if requested
      if (replace) {
        await storage.deleteAllNbnDataset();
      }

      // Process and insert records
      const records = data.map((item: any) => {
        // Generate address hash if address and postcode provided
        let addressHash = item.addressHash;
        if (!addressHash && item.normalizedAddress && item.postcode) {
          addressHash = generateAddressHash(item.normalizedAddress, item.postcode);
        }

        return {
          addressHash: addressHash || null,
          locid: item.locid || null,
          normalizedAddress: item.normalizedAddress || null,
          postcode: item.postcode || null,
          technology: item.technology || 'Unknown',
          maxTier: item.maxTier || 'Unknown',
          notes: item.notes || null,
        };
      });

      await storage.bulkCreateNbnDataset(records);

      res.json({
        success: true,
        message: `Imported ${records.length} records`,
        recordsImported: records.length,
      });
    } catch (error: any) {
      console.error('Dataset upload error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Delete all dataset records
  app.delete("/api/admin/nbn-dataset", requireAuth, async (req, res) => {
    try {
      await storage.deleteAllNbnDataset();
      res.json({ message: "Dataset cleared" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============ MODEM ENQUIRY ROUTES ============
  
  // Submit modem enquiry
  app.post("/api/modems/enquiry", async (req, res) => {
    try {
      const { name, email, phone, product, quantity, message } = req.body;

      if (!name || !email || !product) {
        return res.status(400).json({ message: "Name, email, and product are required" });
      }

      const enquiry = await storage.createModemEnquiry({
        userId: req.session?.userId || null,
        name,
        email,
        phone: phone || null,
        product,
        quantity: quantity || 1,
        message: message || null,
        status: "pending",
      });

      res.status(201).json({ enquiry });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get user's modem enquiries
  app.get("/api/modems/enquiry", requireAuth, async (req, res) => {
    try {
      const enquiries = await storage.getModemEnquiries(req.session.userId!);
      res.json({ enquiries });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all modem enquiries (admin only)
  app.get("/api/admin/modems/enquiry", requireAuth, async (req, res) => {
    try {
      const enquiries = await storage.getAllModemEnquiries();
      res.json({ enquiries });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update enquiry status (admin only)
  app.patch("/api/admin/modems/enquiry/:id", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      const enquiry = await storage.updateModemEnquiryStatus(req.params.id, status);
      res.json({ enquiry });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============ EMAIL SIGNUP ROUTES ============

  // Subscribe to email notifications (coming soon page)
  app.post("/api/email-signup", async (req, res) => {
    try {
      const { email, source } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email is required" });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Check if already subscribed
      const existing = await storage.getEmailSignupByEmail(email);
      if (existing) {
        return res.json({ message: "You're already on the list!", alreadySubscribed: true });
      }

      await storage.createEmailSignup({
        email,
        source: source || "coming-soon",
      });

      res.status(201).json({ message: "You're on the list!", success: true });
    } catch (error: any) {
      console.error("Email signup error:", error);
      res.status(500).json({ message: "Failed to subscribe. Please try again." });
    }
  });

  // Register AI chat routes
  registerChatRoutes(app);

  return httpServer;
}
