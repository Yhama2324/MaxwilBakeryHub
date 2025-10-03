import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Security middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Pass environment variables to frontend
app.get('/api/config', (req, res) => {
  res.json({
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY
  });
});

// Rate limiting for API routes
const rateLimitMap = new Map();
app.use('/api', (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const userData = rateLimitMap.get(ip);
  if (now > userData.resetTime) {
    userData.count = 1;
    userData.resetTime = now + windowMs;
    return next();
  }

  if (userData.count >= maxRequests) {
    return res.status(429).json({ message: "Too many requests" });
  }

  userData.count++;
  next();
});

// Middleware to log API requests (with sensitive data filtering)
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
        // Sanitize response before logging - remove sensitive fields
        const sanitizedResponse = sanitizeLogData(capturedJsonResponse);
        logLine += ` :: ${JSON.stringify(sanitizedResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Helper function to remove sensitive fields from logged data
function sanitizeLogData(data: any): any {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item));
  }
  
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const key in data) {
      // Skip sensitive fields
      if (key === 'password' || key === 'securityCode') {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeLogData(data[key]);
      }
    }
    return sanitized;
  }
  
  return data;
}

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT from environment (Railway, Heroku, etc.) or default to 5000
  const port = parseInt(process.env.PORT || "5000");
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
