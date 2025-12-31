import express, { type Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import crypto from "crypto";
import { storage } from "./storage";
import { db } from "./db";
import { sql } from "drizzle-orm";
import {
  insertUserSchema,
  insertTicketSchema,
  insertIncidentSchema,
  insertContactMessageSchema,
  insertNbnDatasetSchema,
  insertPlanSchema,
} from "@shared/schema";
import { validateAddress } from "./services/nominatim";
import { checkNBNAvailability, getSQMode, generateAddressHash } from "./services/sq";
import bcrypt from "bcrypt";
import { registerChatRoutes } from "./replit_integrations/chat";

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

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
  const isProduction = process.env.REPLIT_DEPLOYMENT === "1" || process.env.NODE_ENV === "production";
  
  // Trust proxy for Replit's reverse proxy
  if (isProduction) {
    app.set('trust proxy', 1);
  }
  
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
        secure: isProduction, // Use secure cookies in production
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        sameSite: isProduction ? 'none' : 'lax', // Required for cross-site cookies
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
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        res.json({ user: { ...user, password: undefined } });
      });
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
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        res.json({ user: { ...user, password: undefined } });
      });
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

  // ============ INTERCOM ROUTES ============
  
  // Generate HMAC hash for Intercom Identity Verification
  app.get("/api/intercom/token", async (req, res) => {
    try {
      const secret = process.env.INTERCOM_IDENTITY_SECRET;
      if (!secret) {
        return res.status(500).json({ error: "Intercom identity verification not configured" });
      }
      
      // If user is logged in, include their info
      if (req.session?.userId) {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          const userId = String(user.id);
          const userHash = crypto.createHmac('sha256', secret).update(userId).digest('hex');
          const createdAt = user.joinedAt ? Math.floor(new Date(user.joinedAt).getTime() / 1000) : undefined;
          return res.json({ 
            user_hash: userHash, 
            user_id: userId, 
            email: user.email, 
            name: `${user.firstName} ${user.lastName}`.trim(),
            created_at: createdAt
          });
        }
      }
      
      // For anonymous users, no user_hash needed
      return res.json({ anonymous: true });
    } catch (error: any) {
      console.error('Intercom token error:', error);
      res.status(500).json({ error: "Failed to generate token" });
    }
  });
  
  // ============ COVERAGE CHECK ROUTES ============
  
  // Intercom-friendly NBN lookup endpoint (for custom actions/bots)
  app.get("/api/intercom/nbn-lookup", async (req, res) => {
    // Set proper headers for Intercom
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    try {
      const address = req.query.address as string;
      
      if (!address || address.length < 5) {
        return res.status(200).json({
          success: false,
          message: "Please provide a full Australian address to check NBN availability."
        });
      }

      // Import and use the NBN availability check
      const sqResult = await checkNBNAvailability(
        address,
        '',
        undefined,
        undefined
      );

      if (sqResult.error || !sqResult.available) {
        return res.json({
          success: false,
          address: address,
          message: sqResult.error || "NBN service is not currently available at this address.",
          suggestion: "Please check the address is correct or contact our support team for assistance."
        });
      }

      // Format a friendly response for Intercom
      const response = {
        success: true,
        address: sqResult.formattedAddress || address,
        technology: sqResult.technology || "NBN",
        maxSpeed: sqResult.maxTier || "Contact for details",
        available: sqResult.available,
        message: `Great news! NBN is available at this address via ${sqResult.technology || 'NBN'}. Maximum speed available: ${sqResult.maxTier || 'Contact for details'}.`,
        plans_url: "https://bronet-site.replit.app/plans",
        signup_url: "https://bronet-site.replit.app/signup"
      };

      res.json(response);
    } catch (error: any) {
      console.error('Intercom NBN lookup error:', error);
      res.json({
        success: false,
        message: "Sorry, I couldn't check that address right now. Please try again or contact our support team."
      });
    }
  });

  // Address autocomplete suggestions
  app.get("/api/coverage/suggest", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 3) {
        return res.json({ suggestions: [] });
      }
      
      // Try Superloop location search first (if configured)
      try {
        const { getSuperloopClient } = await import('./superloopClient');
        const client = getSuperloopClient();
        
        if (client.isConfigured()) {
          const locations = await client.searchLocationEnhanced(query);
          const suggestions = locations.map(loc => ({
            displayName: loc.description || loc.address,
            address: loc.description || loc.address,
            suburb: loc.suburb,
            state: loc.state,
            postcode: loc.postcode,
            locationId: loc.id,
          }));
          return res.json({ suggestions, source: 'superloop' });
        }
      } catch (superloopError) {
        console.warn('Superloop location search failed, falling back to Nominatim:', superloopError);
      }
      
      // Fallback to Nominatim
      const { searchAddresses } = await import("./services/nominatim");
      const suggestions = await searchAddresses(query);
      res.json({ suggestions, source: 'nominatim' });
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

      // Check if address looks like it came from NBN API (contains LOT or is uppercase formatted)
      const isNbnFormattedAddress = /^(LOT\s+\d+\s+)?\d+\s+[A-Z]+.*\d{4}$/i.test(address.trim());
      
      let addressResult: any;
      let addressForNBN: string;
      
      if (isNbnFormattedAddress) {
        // Skip Nominatim validation for NBN-formatted addresses - use directly
        const postcodeMatch = address.match(/\b(\d{4})\b/);
        const stateMatch = address.match(/\b(NSW|VIC|QLD|WA|SA|TAS|NT|ACT)\b/i);
        const suburbMatch = address.match(/\b([A-Z]{2,})\s+(NSW|VIC|QLD|WA|SA|TAS|NT|ACT)\s+\d{4}/i);
        
        addressResult = {
          success: true,
          normalizedAddress: address.trim(),
          postcode: postcodeMatch?.[1],
          state: stateMatch?.[1]?.toUpperCase(),
          suburb: suburbMatch?.[1],
        };
        addressForNBN = address.trim();
      } else {
        // Step 1: Validate and normalize address using Nominatim
        addressResult = await validateAddress(address);
        
        if (!addressResult.success || !addressResult.normalizedAddress) {
          return res.status(400).json({
            success: false,
            message: addressResult.error || "Address validation failed",
          });
        }

        // Use original address for NBN API to preserve street number
        const inputMatch = address.trim().match(/^(\d+[A-Za-z]?)\s+(.+)/);
        addressForNBN = addressResult.normalizedAddress;
        
        if (inputMatch) {
          const streetNumber = inputMatch[1];
          if (!addressResult.normalizedAddress.startsWith(streetNumber)) {
            addressForNBN = `${streetNumber} ${addressResult.normalizedAddress}`;
          }
        }
      }
      
      const inputMatch = address.trim().match(/^(\d+[A-Za-z]?)\s+(.+)/);
      
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
          locId: sqResult.locId,
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

  // ============ SUPERLOOP CONNECT API ROUTES ============
  
  // Check if Superloop is configured
  app.get("/api/superloop/status", async (_req, res) => {
    try {
      const { getSuperloopClient } = await import('./superloopClient');
      const client = getSuperloopClient();
      res.json({ 
        configured: client.isConfigured(),
        mode: client.isConfigured() ? 'live' : 'simulated'
      });
    } catch (error: any) {
      res.json({ configured: false, mode: 'simulated' });
    }
  });

  // Superloop location search (address autocomplete)
  app.get("/api/superloop/locations", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 3) {
        return res.json({ locations: [] });
      }

      const { getSuperloopClient } = await import('./superloopClient');
      const client = getSuperloopClient();
      
      if (!client.isConfigured()) {
        return res.json({ locations: [], mode: 'simulated' });
      }

      const locations = await client.searchLocationEnhanced(query);
      res.json({ 
        locations: locations.map(loc => ({
          id: loc.id,
          address: loc.description || loc.address,
          suburb: loc.suburb,
          state: loc.state,
          postcode: loc.postcode
        })),
        mode: 'live'
      });
    } catch (error: any) {
      console.error('Superloop location search error:', error);
      res.json({ locations: [], error: error.message });
    }
  });

  // Superloop full service qualification
  app.post("/api/superloop/qualify", async (req, res) => {
    try {
      const { locationId } = req.body;
      
      if (!locationId) {
        return res.status(400).json({ message: "Location ID is required" });
      }

      const { getSuperloopClient } = await import('./superloopClient');
      const client = getSuperloopClient();
      
      if (!client.isConfigured()) {
        return res.status(400).json({ 
          message: "Superloop API not configured",
          mode: 'simulated'
        });
      }

      const qualification = await client.qualifyLocation(locationId);
      
      res.json({
        success: true,
        qualification: {
          locId: qualification.locId,
          locationId: qualification.locationId,
          qualificationSearchId: qualification.qualificationSearchId,
          remoteQualificationSearchId: qualification.remoteQualificationSearchId,
          technologyType: qualification.technologyType,
          serviceClass: qualification.serviceClass,
          maxDownload: qualification.maxDownload,
          maxUpload: qualification.maxUpload,
          available: qualification.available,
          region: qualification.region,
          poi: qualification.poi,
          poiName: qualification.poiName,
          hasActivePOTS: qualification.hasActivePOTS,
          serviceType: qualification.serviceType,
          generationTwoNtds: qualification.generationTwoNtds,
          firstOrAdditionalNtdPlans: qualification.firstOrAdditionalNtdPlans,
          generationOneNtdPlans: qualification.generationOneNtdPlans,
          generationTwoNtdPlans: qualification.generationTwoNtdPlans,
          infrastructures: qualification.infrastructures,
          infrastructureInstallationOptions: qualification.infrastructureInstallationOptions,
          plans: qualification.plans,
        },
        mode: 'live'
      });
    } catch (error: any) {
      console.error('Superloop qualification error:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Service qualification failed"
      });
    }
  });

  // Superloop create order
  app.post("/api/superloop/orders", requireAuth, async (req, res) => {
    try {
      const { getSuperloopClient } = await import('./superloopClient');
      const client = getSuperloopClient();
      
      if (!client.isConfigured()) {
        return res.status(400).json({ 
          message: "Superloop API not configured",
          mode: 'simulated'
        });
      }

      const {
        qualificationSearchId,
        locationId,
        planName,
        term,
        trafficClass,
        restorationSla,
        contactName,
        contactPhone,
        contactEmail,
        aggregationMethod,
        ntdInstallation,
        ntdOption,
        infrastructureId,
        portId,
        avcIdForTransfer,
        transferType,
        customerReference,
      } = req.body;

      const orderResponse = await client.createOrder({
        sourceType: 'nbn',
        qualificationSearchId,
        locationId,
        planName,
        term: term || 1,
        trafficClass: trafficClass || 'tc4',
        restorationSla: restorationSla || 'Standard',
        contactName,
        contactPhone,
        contactEmail,
        aggregationMethod: aggregationMethod || 'L2TP',
        ntdInstallation: ntdInstallation || 'nbn-tech',
        ntdOption,
        infrastructureId,
        portId,
        avcIdForTransfer,
        transferType,
        customerReference: customerReference || `BRO-${req.session.userId}`,
      });

      res.json({
        success: true,
        order: orderResponse,
        mode: 'live'
      });
    } catch (error: any) {
      console.error('Superloop order creation error:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Order creation failed"
      });
    }
  });

  // Superloop get order status
  app.get("/api/superloop/orders/:orderId", requireAuth, async (req, res) => {
    try {
      const { getSuperloopClient } = await import('./superloopClient');
      const client = getSuperloopClient();
      
      if (!client.isConfigured()) {
        return res.status(400).json({ message: "Superloop API not configured" });
      }

      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const order = await client.getOrder(orderId);
      res.json({ success: true, order });
    } catch (error: any) {
      console.error('Superloop get order error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Superloop AVC qualification (for transfer orders)
  app.post("/api/superloop/avc-qualify", async (req, res) => {
    try {
      const { avcId } = req.body;
      
      if (!avcId) {
        return res.status(400).json({ message: "AVC ID is required" });
      }

      const { getSuperloopClient } = await import('./superloopClient');
      const client = getSuperloopClient();
      
      if (!client.isConfigured()) {
        return res.status(400).json({ message: "Superloop API not configured" });
      }

      const result = await client.qualifyAvc(avcId);
      res.json({ success: true, qualification: result });
    } catch (error: any) {
      console.error('Superloop AVC qualification error:', error);
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
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const enquiries = await storage.getAllModemEnquiries();
      res.json({ enquiries });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update enquiry status (admin only)
  app.patch("/api/admin/modems/enquiry/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { status } = req.body;
      const enquiry = await storage.updateModemEnquiryStatus(req.params.id, status);
      res.json({ enquiry });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get all tickets with user info (admin only)
  app.get("/api/admin/tickets", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const tickets = await storage.getAllTickets();
      
      const ticketsWithUserInfo = await Promise.all(
        tickets.map(async (ticket) => {
          const ticketUser = await storage.getUser(ticket.userId);
          return {
            ...ticket,
            userEmail: ticketUser?.email || 'Unknown',
            userName: ticketUser ? `${ticketUser.firstName} ${ticketUser.lastName}` : 'Unknown',
          };
        })
      );
      
      res.json({ tickets: ticketsWithUserInfo });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get single ticket with replies and user info (admin only)
  app.get("/api/admin/tickets/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const ticketUser = await storage.getUser(ticket.userId);
      const replies = await storage.getTicketReplies(req.params.id);
      
      const repliesWithUserInfo = await Promise.all(
        replies.map(async (reply) => {
          if (reply.userId) {
            const replyUser = await storage.getUser(reply.userId);
            return {
              ...reply,
              userName: replyUser ? `${replyUser.firstName} ${replyUser.lastName}` : 'Unknown',
            };
          }
          return { ...reply, userName: reply.isStaff ? 'Staff' : 'Unknown' };
        })
      );
      
      res.json({
        ticket: {
          ...ticket,
          userEmail: ticketUser?.email || 'Unknown',
          userName: ticketUser ? `${ticketUser.firstName} ${ticketUser.lastName}` : 'Unknown',
        },
        replies: repliesWithUserInfo,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Add admin reply to ticket (admin only)
  app.post("/api/admin/tickets/:id/reply", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { message } = req.body;
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const reply = await storage.createTicketReply({
        ticketId: req.params.id,
        userId: req.session.userId!,
        message: message.trim(),
        isStaff: 1,
      });
      
      await storage.updateTicket(req.params.id, { status: ticket.status === 'open' ? 'in_progress' : ticket.status });
      
      res.status(201).json({ reply: { ...reply, userName: `${user.firstName} ${user.lastName}` } });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update ticket status (admin only)
  app.patch("/api/admin/tickets/:id/status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { status } = req.body;
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be: open, in_progress, resolved, or closed" });
      }
      
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const updatedTicket = await storage.updateTicket(req.params.id, { status });
      res.json({ ticket: updatedTicket });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all contact messages (admin only)
  app.get("/api/admin/messages", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const messages = await storage.getAllContactMessages();
      res.json({ messages });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============ ADMIN ORDER MANAGEMENT ============

  // Get all orders (admin only)
  app.get("/api/admin/orders", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const orders = await storage.getAllOrders();
      res.json({ orders });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get single order (admin only)
  app.get("/api/admin/orders/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      const history = await storage.getOrderHistory(req.params.id);
      res.json({ order, history });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update order status (admin only)
  app.patch("/api/admin/orders/:id/status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { status, message } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      const validStatuses = ['pending', 'submitted', 'in_progress', 'provisioning', 'active', 'cancelled', 'failed', 'on_hold'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const order = await storage.updateOrderStatus(req.params.id, status, `admin:${user.email}`, message);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json({ order });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get order history (admin only)
  app.get("/api/admin/orders/:id/history", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const history = await storage.getOrderHistory(req.params.id);
      res.json({ history });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update order AVC ID (admin only)
  app.patch("/api/admin/orders/:id/avc", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { avcId } = req.body;
      if (!avcId || typeof avcId !== 'string') {
        return res.status(400).json({ message: "AVC ID is required" });
      }
      
      const order = await storage.updateOrderAvcId(req.params.id, avcId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json({ order });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete order (admin only, cancelled orders only)
  app.delete("/api/admin/orders/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      if (order.status !== 'cancelled') {
        return res.status(400).json({ message: "Only cancelled orders can be deleted" });
      }
      
      await storage.deleteOrder(req.params.id);
      res.json({ success: true, message: "Order deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Export orders as CSV (admin only)
  app.get("/api/admin/orders/export", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const orderIds = req.query.ids ? (req.query.ids as string).split(',') : null;
      let orders = await storage.getAllOrders();
      
      if (orderIds && orderIds.length > 0) {
        orders = orders.filter(o => orderIds.includes(o.id));
      }

      const csvHeaders = [
        'Order Reference',
        'Status',
        'Plan Name',
        'Contact Name',
        'Contact Email',
        'Contact Phone',
        'Service Address',
        'LOC ID',
        'AVC ID',
        'Technology',
        'Download Speed',
        'Upload Speed',
        'Created At',
        'Updated At'
      ];

      const escapeCSV = (value: any) => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvRows = orders.map(order => [
        escapeCSV(order.orderReference),
        escapeCSV(order.status),
        escapeCSV(order.planName),
        escapeCSV(order.contactName),
        escapeCSV(order.contactEmail),
        escapeCSV(order.contactPhone),
        escapeCSV(order.serviceAddress),
        escapeCSV(order.locId),
        escapeCSV(order.avcId),
        escapeCSV(order.technology),
        escapeCSV(order.downloadSpeed),
        escapeCSV(order.uploadSpeed),
        escapeCSV(order.createdAt),
        escapeCSV(order.updatedAt)
      ].join(','));

      const csv = [csvHeaders.join(','), ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Bulk update order statuses (admin only)
  app.post("/api/admin/orders/bulk-status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { orderIds, status, message } = req.body;

      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: "Order IDs are required" });
      }

      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: "Status is required" });
      }

      const validStatuses = ['pending', 'submitted', 'in_progress', 'provisioning', 'active', 'cancelled', 'failed', 'on_hold'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const results = [];
      for (const orderId of orderIds) {
        try {
          const order = await storage.getOrder(orderId);
          if (order) {
            await storage.updateOrderStatus(orderId, status, message || `Bulk status update to ${status}`, 'admin');
            results.push({ orderId, success: true });
          } else {
            results.push({ orderId, success: false, error: "Order not found" });
          }
        } catch (err: any) {
          results.push({ orderId, success: false, error: err.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      res.json({ 
        success: true, 
        message: `Updated ${successCount} of ${orderIds.length} orders`,
        results 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============ ADMIN USER MANAGEMENT ============

  // Get all users (admin only)
  app.get("/api/admin/users", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const users = await storage.getAllUsers();
      const sanitizedUsers = users.map(u => ({ ...u, password: undefined }));
      res.json({ users: sanitizedUsers });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Disable user account (admin only)
  app.patch("/api/admin/users/:id/disable", requireAuth, async (req, res) => {
    try {
      const adminUser = await storage.getUser(req.session.userId!);
      if (!adminUser || adminUser.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (targetUser.isAdmin === 1) {
        return res.status(400).json({ message: "Cannot disable admin accounts" });
      }

      const updated = await storage.disableUser(req.params.id);
      res.json({ user: { ...updated, password: undefined } });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Enable user account (admin only)
  app.patch("/api/admin/users/:id/enable", requireAuth, async (req, res) => {
    try {
      const adminUser = await storage.getUser(req.session.userId!);
      if (!adminUser || adminUser.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updated = await storage.enableUser(req.params.id);
      res.json({ user: { ...updated, password: undefined } });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Reset user password (admin only)
  app.post("/api/admin/users/:id/reset-password", requireAuth, async (req, res) => {
    try {
      const adminUser = await storage.getUser(req.session.userId!);
      if (!adminUser || adminUser.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const newPassword = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await storage.updateUser(req.params.id, { password: hashedPassword });
      
      res.json({ 
        message: "Password reset successfully", 
        newPassword,
        userEmail: targetUser.email
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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

      const signupSource = source || "coming-soon";
      await storage.createEmailSignup({
        email,
        source: signupSource,
      });

      // Send confirmation email to subscriber and admin notification
      const { sendNotifyMeConfirmation, sendAdminNotification } = await import("./emailService");
      
      // Send emails and log results
      console.log(`[Email] Attempting to send emails to ${email}...`);
      try {
        const [confirmResult, adminResult] = await Promise.all([
          sendNotifyMeConfirmation(email),
          sendAdminNotification(email, signupSource)
        ]);
        console.log(`[Email] Results - Confirmation: ${confirmResult}, Admin: ${adminResult}`);
      } catch (emailErr) {
        console.error("[Email] Sending error:", emailErr);
      }

      res.status(201).json({ message: "You're on the list!", success: true });
    } catch (error: any) {
      console.error("Email signup error:", error);
      res.status(500).json({ message: "Failed to subscribe. Please try again." });
    }
  });

  // Register AI chat routes
  registerChatRoutes(app);

  // ============ STRIPE CHECKOUT ROUTES ============
  
  // Get Stripe products and prices
  app.get("/api/stripe/products", async (req, res) => {
    try {
      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();
      
      // Fetch products and prices directly from Stripe API
      const [products, prices] = await Promise.all([
        stripe.products.list({ active: true, limit: 100 }),
        stripe.prices.list({ active: true, limit: 100, expand: ['data.product'] }),
      ]);
      
      // Build products with their prices
      const productsMap = new Map();
      for (const product of products.data) {
        productsMap.set(product.id, {
          id: product.id,
          name: product.name,
          description: product.description,
          metadata: product.metadata,
          prices: []
        });
      }
      
      for (const price of prices.data) {
        const productId = typeof price.product === 'string' ? price.product : price.product.id;
        if (productsMap.has(productId)) {
          productsMap.get(productId).prices.push({
            id: price.id,
            unit_amount: price.unit_amount,
            currency: price.currency,
            recurring: price.recurring,
          });
        }
      }
      
      // Sort by price
      const result = Array.from(productsMap.values())
        .filter(p => p.prices.length > 0)
        .sort((a, b) => (a.prices[0]?.unit_amount || 0) - (b.prices[0]?.unit_amount || 0));
      
      res.json({ products: result });
    } catch (error: any) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Create checkout session with order
  app.post("/api/stripe/checkout", requireAuth, async (req, res) => {
    try {
      const { 
        priceId, 
        planName,
        planId,
        serviceAddress,
        locId,
        csaId,
        sqReference,
        avcId,
        technology,
        downloadSpeed,
        uploadSpeed,
        contactName,
        contactEmail,
        contactPhone,
        preferredDate,
        routerOption,
        promoCode
      } = req.body;
      
      if (!priceId) {
        return res.status(400).json({ message: "Price ID is required" });
      }

      if (!serviceAddress || !contactName || !contactEmail || !contactPhone) {
        return res.status(400).json({ message: "Order details are required (address, name, email, phone)" });
      }

      if (!locId) {
        return res.status(400).json({ message: "NBN service qualification is required. Please verify your address first." });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: { userId: user.id }
        });
        await storage.updateUser(user.id, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      // Create order with pending_payment status BEFORE checkout
      const orderRef = `BRO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const { serviceOrders, orderStatusHistory } = await import('@shared/schema');
      const [order] = await db.insert(serviceOrders).values({
        userId: req.session.userId!,
        orderReference: orderRef,
        planId: planId || planName?.toLowerCase().replace(/\s+/g, '') || 'unknown',
        planName: planName || 'Unknown Plan',
        downloadSpeed: downloadSpeed || 0,
        uploadSpeed: uploadSpeed || 0,
        serviceAddress,
        locId,
        avcId: avcId || null,
        technology: technology || null,
        status: 'pending_payment',
        contactName,
        contactEmail,
        contactPhone,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        notes: JSON.stringify({ routerOption, promoCode, csaId, sqReference }),
      }).returning();
      
      const orderId = order.id;
      const orderReference = orderRef;
      
      await db.insert(orderStatusHistory).values({
        orderId: order.id,
        status: 'pending_payment',
        message: 'Order created - awaiting payment',
        updatedBy: 'system',
      });

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card', 'au_becs_debit'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        currency: 'aud',
        success_url: `${baseUrl}/dashboard?checkout=success&plan=${encodeURIComponent(planName || '')}&orderId=${orderId}`,
        cancel_url: `${baseUrl}/signup?checkout=cancelled`,
        metadata: { 
          userId: user.id, 
          planName: planName || 'Unknown Plan',
          orderId,
          orderReference,
          locId,
        }
      });

      res.json({ url: session.url, orderId, orderReference });
    } catch (error: any) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: error.message || "Checkout failed" });
    }
  });

  // Get Stripe publishable key
  app.get("/api/stripe/config", async (req, res) => {
    try {
      const { getStripePublishableKey } = await import('./stripeClient');
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error: any) {
      res.status(500).json({ message: "Stripe not configured" });
    }
  });

  // Customer portal
  app.post("/api/stripe/portal", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No billing account found" });
      }

      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();
      
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${baseUrl}/dashboard`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Portal error:", error);
      res.status(500).json({ message: "Failed to open billing portal" });
    }
  });

  // =========== NBN Service Order Routes ===========
  
  // Perform service qualification (enhanced coverage check)
  app.post("/api/orders/qualify", async (req, res) => {
    try {
      const { address, technology, postcode, suburb, state, locId } = req.body;
      
      if (!address || !technology) {
        return res.status(400).json({ message: "Address and technology are required" });
      }

      const { nbnService } = await import('./nbnService');
      const result = await nbnService.performServiceQualification(
        address,
        technology,
        postcode,
        suburb,
        state,
        req.session?.userId,
        locId // Pass LOC ID from RapidAPI if available
      );

      res.json({ success: true, qualification: result });
    } catch (error: any) {
      console.error("Qualification error:", error);
      res.status(500).json({ message: error.message || "Service qualification failed" });
    }
  });

  // Submit a service order
  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const {
        qualificationId,
        planId,
        planName,
        downloadSpeed,
        uploadSpeed,
        serviceAddress,
        locId,
        csaId,
        sqReference,
        technology,
        contactName,
        contactEmail,
        contactPhone,
        preferredDate,
        stripeSessionId,
      } = req.body;

      if (!planId || !planName || !serviceAddress || !contactName || !contactEmail || !contactPhone) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const { nbnService } = await import('./nbnService');
      const result = await nbnService.submitOrder({
        userId: req.session.userId!,
        qualificationId,
        planId,
        planName,
        downloadSpeed: downloadSpeed || 0,
        uploadSpeed: uploadSpeed || 0,
        serviceAddress,
        locId,
        csaId,
        sqReference,
        technology,
        contactName,
        contactEmail,
        contactPhone,
        preferredDate: preferredDate ? new Date(preferredDate) : undefined,
        stripeSessionId,
      });

      res.json({
        ...result.result,
        orderId: result.orderId,
        orderReference: result.orderReference,
      });
    } catch (error: any) {
      console.error("Order submission error:", error);
      res.status(500).json({ message: error.message || "Order submission failed" });
    }
  });

  // Get user's orders
  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const { nbnService } = await import('./nbnService');
      const orders = await nbnService.getUserOrders(req.session.userId!);
      res.json({ orders });
    } catch (error: any) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get single order details
  app.get("/api/orders/:orderId", requireAuth, async (req, res) => {
    try {
      const { nbnService } = await import('./nbnService');
      const status = await nbnService.getOrderStatus(req.params.orderId);
      
      if (!status) {
        return res.status(404).json({ message: "Order not found" });
      }

      const history = await nbnService.getOrderHistory(req.params.orderId);
      res.json({ order: status, history });
    } catch (error: any) {
      console.error("Get order error:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Admin: Update order status
  app.patch("/api/orders/:orderId/status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { status, message } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const { nbnService } = await import('./nbnService');
      await nbnService.updateOrderStatus(req.params.orderId, status, message, "admin");
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Update order status error:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Admin: Activate service (assign AVC ID)
  app.post("/api/orders/:orderId/activate", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { nbnService } = await import('./nbnService');
      await nbnService.activateService(req.params.orderId);
      
      res.json({ success: true, message: "Service activated" });
    } catch (error: any) {
      console.error("Activate service error:", error);
      res.status(500).json({ message: error.message || "Failed to activate service" });
    }
  });

  // Note: Nitrogen webhook is registered in index.ts before express.json() middleware

  // ============ ADMIN: ANALYTICS ============

  app.get("/api/admin/analytics", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const allUsers = await storage.getAllUsers();
      const allOrders = await storage.getAllOrders();

      const totalCustomers = allUsers.filter(u => u.isAdmin !== 1).length;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentSignups = allUsers.filter(u => 
        u.isAdmin !== 1 && new Date(u.joinedAt) >= thirtyDaysAgo
      );

      const signupsByDate: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        signupsByDate[dateKey] = 0;
      }
      recentSignups.forEach(u => {
        const dateKey = new Date(u.joinedAt).toISOString().split('T')[0];
        if (signupsByDate[dateKey] !== undefined) {
          signupsByDate[dateKey]++;
        }
      });
      const signupsTrend = Object.entries(signupsByDate).map(([date, count]) => ({
        date,
        signups: count
      }));

      const totalOrders = allOrders.length;
      const activeOrders = allOrders.filter(o => o.status === 'active').length;

      const ordersByStatus: Record<string, number> = {};
      allOrders.forEach(o => {
        ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
      });

      const ordersByPlan: Record<string, number> = {};
      allOrders.forEach(o => {
        const planKey = o.planName || 'Unknown';
        ordersByPlan[planKey] = (ordersByPlan[planKey] || 0) + 1;
      });

      const AVERAGE_PLAN_PRICE = 89;
      const estimatedRevenue = activeOrders * AVERAGE_PLAN_PRICE;

      res.json({
        totalCustomers,
        newSignups30Days: recentSignups.length,
        signupsTrend,
        totalOrders,
        activeOrders,
        ordersByStatus: Object.entries(ordersByStatus).map(([status, count]) => ({ status, count })),
        ordersByPlan: Object.entries(ordersByPlan).map(([plan, count]) => ({ plan, count })),
        estimatedMonthlyRevenue: estimatedRevenue,
      });
    } catch (error: any) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // ============ PLANS ROUTES ============

  // Get all active plans (public)
  app.get("/api/plans", async (_req, res) => {
    try {
      const plans = await storage.getPlans();
      res.json({ plans });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all plans including inactive (admin only)
  app.get("/api/admin/plans", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const plans = await storage.getAllPlansAdmin();
      res.json({ plans });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create plan (admin only)
  app.post("/api/admin/plans", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const data = insertPlanSchema.parse(req.body);
      
      const existingPlan = await storage.getPlan(data.id);
      if (existingPlan) {
        return res.status(400).json({ message: "Plan with this ID already exists" });
      }
      
      const plan = await storage.createPlan(data);
      res.status(201).json({ plan });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update plan (admin only)
  app.patch("/api/admin/plans/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const existingPlan = await storage.getPlan(req.params.id);
      if (!existingPlan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      
      const updates = req.body;
      delete updates.id;
      
      const plan = await storage.updatePlan(req.params.id, updates);
      res.json({ plan });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Delete plan (admin only)
  app.delete("/api/admin/plans/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const existingPlan = await storage.getPlan(req.params.id);
      if (!existingPlan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      
      await storage.deletePlan(req.params.id);
      res.json({ success: true, message: "Plan deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
