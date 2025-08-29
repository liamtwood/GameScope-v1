import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTeamSchema, insertPlayerSchema, insertOppositionTeamSchema, insertFixtureSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

// Configure multer for file uploads
const upload = multer({
  dest: "temp-uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure temp upload directory exists
  try {
    await fs.mkdir("temp-uploads", { recursive: true });
    await fs.mkdir("client/public/assets/team-logos", { recursive: true });
  } catch (error) {
    console.log("Directories already exist");
  }
  // Team routes
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const team = await storage.getTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(400).json({ message: "Failed to create team" });
    }
  });

  // Player routes
  app.get("/api/players", async (req, res) => {
    try {
      const teamId = req.query.teamId as string;
      const players = await storage.getPlayers(teamId);
      res.json(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  // Route for getting players by team ID (expected by frontend)
  app.get("/api/players/:teamId", async (req, res) => {
    try {
      const teamId = req.params.teamId;
      const players = await storage.getPlayers(teamId);
      res.json(players);
    } catch (error) {
      console.error("Error fetching players by team:", error);
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  app.get("/api/player/:id", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(player);
    } catch (error) {
      console.error("Error fetching player:", error);
      res.status(500).json({ message: "Failed to fetch player" });
    }
  });

  app.post("/api/players", async (req, res) => {
    try {
      const playerData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(playerData);
      res.status(201).json(player);
    } catch (error) {
      console.error("Error creating player:", error);
      res.status(400).json({ message: "Failed to create player" });
    }
  });

  app.put("/api/players/:id", async (req, res) => {
    try {
      const playerData = insertPlayerSchema.partial().parse(req.body);
      const player = await storage.updatePlayer(req.params.id, playerData);
      res.json(player);
    } catch (error) {
      console.error("Error updating player:", error);
      res.status(400).json({ message: "Failed to update player" });
    }
  });

  app.delete("/api/players/:id", async (req, res) => {
    try {
      await storage.deletePlayer(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting player:", error);
      res.status(500).json({ message: "Failed to delete player" });
    }
  });

  // Opposition team routes
  app.get("/api/opposition-teams", async (req, res) => {
    try {
      const teams = await storage.getOppositionTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching opposition teams:", error);
      res.status(500).json({ message: "Failed to fetch opposition teams" });
    }
  });

  app.get("/api/opposition-teams/:id", async (req, res) => {
    try {
      const team = await storage.getOppositionTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ message: "Opposition team not found" });
      }
      res.json(team);
    } catch (error) {
      console.error("Error fetching opposition team:", error);
      res.status(500).json({ message: "Failed to fetch opposition team" });
    }
  });

  app.post("/api/opposition-teams", async (req, res) => {
    try {
      const teamData = insertOppositionTeamSchema.parse(req.body);
      const team = await storage.createOppositionTeam(teamData);
      res.status(201).json(team);
    } catch (error) {
      console.error("Error creating opposition team:", error);
      res.status(400).json({ message: "Failed to create opposition team" });
    }
  });

  app.put("/api/opposition-teams/:id", async (req, res) => {
    try {
      const teamData = insertOppositionTeamSchema.partial().parse(req.body);
      const team = await storage.updateOppositionTeam(req.params.id, teamData);
      res.json(team);
    } catch (error) {
      console.error("Error updating opposition team:", error);
      res.status(400).json({ message: "Failed to update opposition team" });
    }
  });

  app.delete("/api/opposition-teams/:id", async (req, res) => {
    try {
      await storage.deleteOppositionTeam(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting opposition team:", error);
      res.status(500).json({ message: "Failed to delete opposition team" });
    }
  });

  // Fixture routes
  app.get("/api/fixtures", async (req, res) => {
    try {
      const teamId = req.query.teamId as string;
      const fixtures = await storage.getFixtures(teamId);
      res.json(fixtures);
    } catch (error) {
      console.error("Error fetching fixtures:", error);
      res.status(500).json({ message: "Failed to fetch fixtures" });
    }
  });

  // Route for getting fixtures by team ID (expected by frontend)
  app.get("/api/fixtures/:teamId", async (req, res) => {
    try {
      const teamId = req.params.teamId;
      const fixtures = await storage.getFixtures(teamId);
      res.json(fixtures);
    } catch (error) {
      console.error("Error fetching fixtures by team:", error);
      res.status(500).json({ message: "Failed to fetch fixtures" });
    }
  });

  app.get("/api/fixture/:id", async (req, res) => {
    try {
      const fixture = await storage.getFixture(req.params.id);
      if (!fixture) {
        return res.status(404).json({ message: "Fixture not found" });
      }
      res.json(fixture);
    } catch (error) {
      console.error("Error fetching fixture:", error);
      res.status(500).json({ message: "Failed to fetch fixture" });
    }
  });

  app.post("/api/fixtures", async (req, res) => {
    try {
      const fixtureData = insertFixtureSchema.parse(req.body);
      const fixture = await storage.createFixture(fixtureData);
      res.status(201).json(fixture);
    } catch (error) {
      console.error("Error creating fixture:", error);
      res.status(400).json({ message: "Failed to create fixture" });
    }
  });

  app.put("/api/fixtures/:id", async (req, res) => {
    try {
      const fixtureData = insertFixtureSchema.partial().parse(req.body);
      const fixture = await storage.updateFixture(req.params.id, fixtureData);
      res.json(fixture);
    } catch (error) {
      console.error("Error updating fixture:", error);
      res.status(400).json({ message: "Failed to update fixture" });
    }
  });

  app.delete("/api/fixtures/:id", async (req, res) => {
    try {
      await storage.deleteFixture(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting fixture:", error);
      res.status(500).json({ message: "Failed to delete fixture" });
    }
  });

  // Statistics routes
  app.get("/api/statistics/team/:teamId", async (req, res) => {
    try {
      const { teamId } = req.params;
      const players = await storage.getPlayers(teamId);
      const fixtures = await storage.getFixtures(teamId);
      
      const completedFixtures = fixtures.filter(f => f.status === 'COMPLETED');
      const wins = completedFixtures.filter(f => 
        (f.type === 'HOME' && f.homeScore! > f.awayScore!) || 
        (f.type === 'AWAY' && f.awayScore! > f.homeScore!)
      ).length;
      
      const draws = completedFixtures.filter(f => 
        f.homeScore === f.awayScore && f.status === 'COMPLETED'
      ).length;
      
      const losses = completedFixtures.filter(f => 
        (f.type === 'HOME' && f.homeScore! < f.awayScore!) || 
        (f.type === 'AWAY' && f.awayScore! < f.homeScore!)
      ).length;

      const totalGoals = players.reduce((sum, p) => sum + (p.goals || 0), 0);
      const totalAssists = players.reduce((sum, p) => sum + (p.assists || 0), 0);

      const statistics = {
        totalPlayers: players.length,
        matchesPlayed: completedFixtures.length,
        wins,
        draws,
        losses,
        totalGoals,
        totalAssists,
        topScorer: players.reduce((top, p) => (p.goals || 0) > (top.goals || 0) ? p : top, players[0]),
        topAssist: players.reduce((top, p) => (p.assists || 0) > (top.assists || 0) ? p : top, players[0]),
      };

      res.json(statistics);
    } catch (error) {
      console.error("Error fetching team statistics:", error);
      res.status(500).json({ message: "Failed to fetch team statistics" });
    }
  });

  // Logo upload endpoint
  app.post("/api/upload-logo", upload.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const teamName = req.body.teamName || 'unknown';
      const sanitizedName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const fileExtension = path.extname(req.file.originalname);
      const outputFileName = `${sanitizedName}-logo${fileExtension}`;
      const outputPath = `client/public/assets/team-logos/${outputFileName}`;
      
      // For now, just copy the file (background removal can be added later)
      await fs.copyFile(req.file.path, outputPath);
      
      // Clean up temp file
      await fs.unlink(req.file.path);
      
      const logoPath = `/assets/team-logos/${outputFileName}`;
      
      res.json({ 
        message: "Logo uploaded successfully",
        logoPath: logoPath 
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      
      // Clean up temp file if it exists
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
