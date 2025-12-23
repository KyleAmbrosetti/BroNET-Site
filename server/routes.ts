import type { Express } from "express";
import { createServer, type Server } from "http";
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
      const sqResult = await checkNBNAvailability(
        addressResult.normalizedAddress,
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

      // Step 4: Return result
      res.json({
        success: true,
        result: {
          normalizedAddress: addressResult.normalizedAddress,
          postcode: addressResult.postcode,
          suburb: addressResult.suburb,
          state: addressResult.state,
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

  return httpServer;
}
