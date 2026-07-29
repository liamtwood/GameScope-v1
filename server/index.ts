import express, { type Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { registerRoutes } from "./routes";
import { log } from "./logger";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve locally-stored uploads/assets where present (harmless if absent).
app.use('/uploads', express.static('public/uploads'));
app.use(
  '/assets',
  express.static(app.get("env") === "development" ? 'client/public/assets' : 'dist/public/assets'),
);
app.use('/assets/uploads', express.static('public/uploads'));

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  const isDev = app.get("env") === "development";

  // Optional demo seeds — wrapped so a seed failure never blocks startup.
  if (!isDev) {
    try {
      const { seedWWCDemoFixture } = await import('./seed-demo');
      await seedWWCDemoFixture();
    } catch (err) {
      console.error('[seed-demo] Failed to seed demo fixture:', err);
    }
  }
  try {
    const { seedHempData } = await import('./seed-hemp');
    await seedHempData();
  } catch (err) {
    console.error('[seed-hemp] Failed to seed Hemp data:', err);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err);
  });

  if (isDev) {
    // Dev only: attach Vite middleware (dynamic import keeps Vite out of prod).
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    // Production is API-only. Serve a built client if one happens to exist,
    // otherwise expose a simple health/root response.
    const distPath = path.resolve(import.meta.dirname, "public");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.use("*", (_req, res) => res.sendFile(path.resolve(distPath, "index.html")));
    } else {
      app.get("/", (_req, res) =>
        res.json({ status: "ok", service: "gamescope-api" }),
      );
    }
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on port ${port}`);
  });
})();
