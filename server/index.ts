import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './stripeClient';
import { WebhookHandlers } from './webhookHandlers';

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('DATABASE_URL not set, skipping Stripe initialization');
    return;
  }

  try {
    console.log('Initializing Stripe schema...');
    await runMigrations({ databaseUrl, schema: 'stripe' });
    console.log('Stripe schema ready');

    const stripeSync = await getStripeSync();

    console.log('Setting up managed webhook...');
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    try {
      const result = await stripeSync.findOrCreateManagedWebhook(
        `${webhookBaseUrl}/api/stripe/webhook`
      );
      if (result?.webhook?.url) {
        console.log(`Webhook configured: ${result.webhook.url}`);
      } else {
        console.log('Webhook setup completed (no URL returned)');
      }
    } catch (webhookError) {
      console.log('Webhook setup skipped (will be configured on next restart)');
    }

    console.log('Syncing Stripe data...');
    stripeSync.syncBackfill()
      .then(() => console.log('Stripe data synced'))
      .catch((err: any) => console.error('Error syncing Stripe data:', err));
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

// Initialize Stripe (wrapped in IIFE for CommonJS compatibility)
(async () => {
  await initStripe();
})();

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!Buffer.isBuffer(req.body)) {
        console.error('Webhook body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

// Nitrogen webhook - must be BEFORE express.json() to get raw body for signature verification
app.post(
  '/api/webhooks/nitrogen',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const { nitrogenClient } = await import('./nitrogenClient');
      const { nbnService } = await import('./nbnService');
      
      const signature = req.headers['x-nitrogen-signature'] as string;
      const payload = Buffer.isBuffer(req.body) ? req.body.toString() : String(req.body);
      
      if (signature && !nitrogenClient.verifyWebhookSignature(payload, signature)) {
        console.warn("Invalid Nitrogen webhook signature");
        return res.status(401).json({ error: "Invalid signature" });
      }

      const event = nitrogenClient.parseWebhookEvent(payload);
      console.log(`Nitrogen webhook: ${event.eventType} for ${event.resourceType}/${event.resourceId}`);

      const updateByNbnId = async (status: string, message: string) => {
        const updated = await nbnService.updateOrderByNbnOrderId(event.resourceId, status, message, 'nitrogen');
        if (!updated) {
          console.warn(`No order found with nbnOrderId: ${event.resourceId}`);
        }
        return updated;
      };

      switch (event.eventType) {
        case 'order.completed.event':
          await updateByNbnId('active', 'Service connected successfully');
          break;
        
        case 'order.accepted.event':
          await updateByNbnId('in_progress', 'Order accepted by NBN');
          break;

        case 'order.rejected.event':
        case 'order.failed.event':
          await updateByNbnId('failed', event.data?.reason || 'Order rejected');
          break;

        case 'order.cancelled.event':
          await updateByNbnId('cancelled', event.data?.reason || 'Order cancelled');
          break;

        case 'order.appointment-required.event':
        case 'order.appointment-reschedule-required.event':
          await updateByNbnId('pending', 'Appointment required - please contact support');
          break;

        default:
          console.log(`Unhandled Nitrogen event: ${event.eventType}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Nitrogen webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
