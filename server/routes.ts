import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTeamSchema, insertPlayerSchema, insertOppositionTeamSchema, insertCompetitionSchema, insertFixtureSchema, insertMatchStatsSchema } from "@shared/schema";
import { ObjectStorageService } from "./objectStorage";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import XLSX from "xlsx";

// Helper function to parse statistics from Excel data
function parseStatsFromExcelData(data: any[], teamColumn: string) {
  const stats: any = {};
  
  // Map Excel event names to database field names
  const fieldMapping: { [key: string]: string } = {
    'Total Team Distance (km)': 'totalTeamDistance',
    'Possession (%)': 'possession',
    'Goals': 'goals',
    'Shots - Attempted': 'shotsAttempted',
    'Shots - On Target': 'shotsOnTarget',
    'Runs Into Boxes': 'runsIntoBoxes',
    'Corners': 'corners',
    'Dangerous Crosses': 'dangerousCrosses',
    'Dribbles': 'dribbles',
    'Penetrating Dribbles': 'penetratingDribbles',
    'Take Ons': 'takeOns',
    'First Touch - Success': 'firstTouchSuccess',
    'First Touch - Success Rate (%)': 'firstTouchSuccessRate',
    'Tackles': 'tackles',
    'Free Kicks': 'freeKicks',
    'Offsides': 'offsides',
    'Pass - Total Attempted': 'passesAttempted',
    'Pass - Success': 'passesSuccess',
    'Pass - Success Rate (%)': 'passingSuccessRate',
    'Pass - Total Distance (m)': 'passingTotalDistance',
    'Pass - Average Pass Distance (m)': 'passingAverageDistance',
    'Pass - Average Pass Velocity (km/h)': 'passingAverageVelocity',
    'Right Foot Pass - Attempted': 'rightFootPassAttempted',
    'Right Foot Pass - Success': 'rightFootPassSuccess',
    'Right Foot Pass - Success Rate (%)': 'rightFootPassSuccessRate',
    'Left Foot Pass - Attempted': 'leftFootPassAttempted',
    'Left Foot Pass - Success': 'leftFootPassSuccess',
    'Left Foot Pass - Success Rate (%)': 'leftFootPassSuccessRate',
  };

  // Process each row of data
  for (const row of data) {
    const event = row['Event'];
    const value = row[teamColumn];
    
    if (event && fieldMapping[event] && value !== undefined && value !== null && value !== '') {
      const fieldName = fieldMapping[event];
      
      // Convert value to appropriate type
      let parsedValue = value;
      if (typeof value === 'string') {
        // Remove any non-numeric characters except decimal points
        const numericString = value.replace(/[^0-9.-]/g, '');
        parsedValue = parseFloat(numericString);
        
        // If it's NaN, keep the original value
        if (isNaN(parsedValue)) {
          parsedValue = value;
        }
      }
      
      // Special handling for distance values (convert km to meters)
      if (fieldName === 'totalTeamDistance' && typeof parsedValue === 'number') {
        parsedValue = Math.round(parsedValue * 1000); // Convert km to meters
      }
      
      // Special handling for distance in meters
      if ((fieldName === 'passingTotalDistance' || fieldName === 'passingAverageDistance') && typeof parsedValue === 'number') {
        parsedValue = Math.round(parsedValue); // Ensure integer meters
      }
      
      stats[fieldName] = parsedValue;
    }
  }
  
  return stats;
}

// Configure multer for image uploads
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

// Configure multer for Excel uploads
const excelUpload = multer({
  dest: "temp-uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for Excel files
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
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

  app.patch("/api/players/:id", async (req, res) => {
    try {
      // For PATCH requests, validate the partial data
      const validKeys = ['keyPlayer', 'goals', 'assists', 'appearances', 'status', 'name', 'position', 'jerseyNumber', 'hometown'];
      const updates = Object.keys(req.body).reduce((acc, key) => {
        if (validKeys.includes(key)) {
          acc[key] = req.body[key];
        }
        return acc;
      }, {} as any);
      
      const player = await storage.updatePlayer(req.params.id, updates);
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

  // Competition routes
  app.get("/api/competitions", async (req, res) => {
    try {
      const competitions = await storage.getCompetitions();
      res.json(competitions);
    } catch (error) {
      console.error("Error fetching competitions:", error);
      res.status(500).json({ message: "Failed to fetch competitions" });
    }
  });

  app.post("/api/competitions", async (req, res) => {
    try {
      const competitionData = insertCompetitionSchema.parse(req.body);
      const competition = await storage.createCompetition(competitionData);
      res.status(201).json(competition);
    } catch (error) {
      console.error("Error creating competition:", error);
      res.status(400).json({ message: "Failed to create competition" });
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

  // Route for getting a single fixture
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
      
      // Auto-create competition if it doesn't exist
      if (fixtureData.competition) {
        await storage.getOrCreateCompetition(fixtureData.competition);
      }
      
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
      
      // Auto-create competition if it doesn't exist
      if (fixtureData.competition) {
        await storage.getOrCreateCompetition(fixtureData.competition);
      }
      
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

      // Calculate total goals scored by the team from match results
      const totalGoalsScored = completedFixtures.reduce((sum, f) => {
        if (f.type === 'HOME') {
          return sum + (f.homeScore || 0);
        } else {
          return sum + (f.awayScore || 0);
        }
      }, 0);
      
      // Calculate total goals conceded by the team
      const totalGoalsConceded = completedFixtures.reduce((sum, f) => {
        if (f.type === 'HOME') {
          return sum + (f.awayScore || 0);
        } else {
          return sum + (f.homeScore || 0);
        }
      }, 0);

      // Individual player stats (for reference)
      const totalPlayerGoals = players.reduce((sum, p) => sum + (p.goals || 0), 0);
      const totalAssists = players.reduce((sum, p) => sum + (p.assists || 0), 0);

      const statistics = {
        totalPlayers: players.length,
        matchesPlayed: completedFixtures.length,
        wins,
        draws,
        losses,
        totalGoals: totalGoalsScored, // Use actual match goals
        totalGoalsConceded,
        goalDifference: totalGoalsScored - totalGoalsConceded,
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

  // Match Statistics routes
  app.get("/api/match-stats/:fixtureId", async (req, res) => {
    try {
      const { fixtureId } = req.params;
      const matchStats = await storage.getMatchStats(fixtureId);
      res.json(matchStats);
    } catch (error) {
      console.error("Error fetching match statistics:", error);
      res.status(500).json({ message: "Failed to fetch match statistics" });
    }
  });

  app.post("/api/match-stats", async (req, res) => {
    try {
      const statsData = insertMatchStatsSchema.parse(req.body);
      const stats = await storage.createMatchStats(statsData);
      res.status(201).json(stats);
    } catch (error) {
      console.error("Error creating match statistics:", error);
      res.status(400).json({ message: "Failed to create match statistics" });
    }
  });

  app.put("/api/match-stats/:id", async (req, res) => {
    try {
      const statsData = insertMatchStatsSchema.partial().parse(req.body);
      const stats = await storage.updateMatchStats(req.params.id, statsData);
      res.json(stats);
    } catch (error) {
      console.error("Error updating match statistics:", error);
      res.status(400).json({ message: "Failed to update match statistics" });
    }
  });

  app.delete("/api/match-stats/:id", async (req, res) => {
    try {
      await storage.deleteMatchStats(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting match statistics:", error);
      res.status(500).json({ message: "Failed to delete match statistics" });
    }
  });

  // Bulk import match statistics for a fixture (1st half, 2nd half, full game)
  app.post("/api/match-stats/bulk/:fixtureId", async (req, res) => {
    try {
      const { fixtureId } = req.params;
      const { periods } = req.body; // expects array of {period, teamStats, opponentStats}
      
      const results = [];
      for (const periodData of periods) {
        // Create team stats
        if (periodData.teamStats) {
          const teamStatsData = insertMatchStatsSchema.parse({
            fixtureId,
            period: periodData.period,
            isTeamStats: true,
            ...periodData.teamStats
          });
          const teamStats = await storage.createMatchStats(teamStatsData);
          results.push(teamStats);
        }
        
        // Create opponent stats
        if (periodData.opponentStats) {
          const opponentStatsData = insertMatchStatsSchema.parse({
            fixtureId,
            period: periodData.period,
            isTeamStats: false,
            ...periodData.opponentStats
          });
          const opponentStats = await storage.createMatchStats(opponentStatsData);
          results.push(opponentStats);
        }
      }
      
      res.status(201).json(results);
    } catch (error) {
      console.error("Error creating bulk match statistics:", error);
      res.status(400).json({ message: "Failed to create bulk match statistics" });
    }
  });

  // Excel preview endpoint - shows what will be parsed without saving
  app.post("/api/preview-match-stats", excelUpload.single('excel'), async (req, res) => {
    try {
      console.log('Preview request received, file:', req.file ? req.file.originalname : 'none');
      
      if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({ message: "No Excel file uploaded" });
      }

      // Read and parse the Excel file
      const workbook = XLSX.readFile(req.file.path);
      const sheetNames = workbook.SheetNames;
      
      const preview: any = {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        sheets: [],
        totalSheets: sheetNames.length
      };

      // Process each sheet for preview
      for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet);
        
        // Determine period based on sheet name
        let period = 'FULL_GAME';
        if (sheetName.toLowerCase().includes('1st') || sheetName.toLowerCase().includes('first')) {
          period = 'FIRST_HALF';
        } else if (sheetName.toLowerCase().includes('2nd') || sheetName.toLowerCase().includes('second')) {
          period = 'SECOND_HALF';
        }

        // Parse the data for both team and opponent stats
        const teamStats = parseStatsFromExcelData(rawData, 'POLK');
        const opponentStats = parseStatsFromExcelData(rawData, 'FSC');

        preview.sheets.push({
          sheetName,
          period,
          rowCount: rawData.length,
          rawSample: rawData.slice(0, 5), // First 5 rows for debugging
          teamStatsFound: Object.keys(teamStats).length,
          opponentStatsFound: Object.keys(opponentStats).length,
          teamStatsParsed: teamStats,
          opponentStatsParsed: opponentStats,
          availableColumns: rawData.length > 0 ? Object.keys(rawData[0] as any) : []
        });
      }

      // Clean up temp file
      await fs.unlink(req.file.path);

      res.json(preview);
    } catch (error) {
      console.error("Error previewing Excel file:", error);
      
      // Clean up temp file if it exists
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up temp file:", cleanupError);
        }
      }
      
      res.status(500).json({ 
        message: "Failed to preview Excel file",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Excel upload endpoint for match statistics
  app.post("/api/upload-match-stats", excelUpload.single('excel'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No Excel file uploaded" });
      }

      if (!req.body.fixtureId) {
        return res.status(400).json({ message: "Fixture ID is required" });
      }

      const fixtureId = req.body.fixtureId;
      
      // Read and parse the Excel file
      const workbook = XLSX.readFile(req.file.path);
      const sheetNames = workbook.SheetNames;
      
      let periodsImported = 0;
      const results = [];

      // Process each sheet (expecting 1st Half, 2nd Half, Full Game)
      for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        // Determine period based on sheet name
        let period = 'FULL_GAME';
        if (sheetName.toLowerCase().includes('1st') || sheetName.toLowerCase().includes('first')) {
          period = 'FIRST_HALF';
        } else if (sheetName.toLowerCase().includes('2nd') || sheetName.toLowerCase().includes('second')) {
          period = 'SECOND_HALF';
        }

        // Parse the data for both team and opponent stats
        const teamStats = parseStatsFromExcelData(data, 'POLK');
        const opponentStats = parseStatsFromExcelData(data, 'FSC');

        // Create team statistics
        if (teamStats && Object.keys(teamStats).length > 0) {
          const teamStatsData = insertMatchStatsSchema.parse({
            fixtureId,
            period,
            isTeamStats: true,
            ...teamStats
          });
          const createdTeamStats = await storage.createMatchStats(teamStatsData);
          results.push(createdTeamStats);
        }

        // Create opponent statistics
        if (opponentStats && Object.keys(opponentStats).length > 0) {
          const opponentStatsData = insertMatchStatsSchema.parse({
            fixtureId,
            period,
            isTeamStats: false,
            ...opponentStats
          });
          const createdOpponentStats = await storage.createMatchStats(opponentStatsData);
          results.push(createdOpponentStats);
        }

        periodsImported++;
      }

      // Clean up temp file
      await fs.unlink(req.file.path);

      res.json({
        message: "Match statistics uploaded successfully",
        periodsImported,
        recordsCreated: results.length
      });
    } catch (error) {
      console.error("Error uploading match statistics:", error);
      
      // Clean up temp file if it exists
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up temp file:", cleanupError);
        }
      }
      
      res.status(500).json({ message: "Failed to upload match statistics" });
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

  // Video management endpoints
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Update fixture videos
  app.put("/api/fixtures/:fixtureId/videos", async (req, res) => {
    try {
      const { fixtureId } = req.params;
      const { videos } = req.body;

      if (!Array.isArray(videos)) {
        return res.status(400).json({ error: "Videos must be an array" });
      }

      await storage.updateFixtureVideos(fixtureId, videos);
      res.json({ message: "Videos updated successfully" });
    } catch (error) {
      console.error("Error updating fixture videos:", error);
      res.status(500).json({ error: "Failed to update videos" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
