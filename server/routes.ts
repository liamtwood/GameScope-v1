import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClubSchema, insertTeamSchema, insertUserSchema, insertUserTeamSchema, insertOppositionTeamSchema, insertCompetitionSchema, insertFixtureSchema, insertMatchStatsSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import XLSX from "xlsx";

// Helper function to parse statistics from Excel data
function parseStatsFromExcelData(data: any[], teamColumn: string) {
  const stats: any = {};
  
  // Map Excel event names to database field names with type information
  const fieldMapping: { [key: string]: { field: string; type: 'integer' | 'float' | 'percentage' } } = {
    'Total Team Distance (km)': { field: 'totalTeamDistance', type: 'integer' }, // converted to meters
    'Possession (%)': { field: 'possession', type: 'percentage' },
    'Goals': { field: 'goals', type: 'integer' },
    'Shots - Attempted': { field: 'shotsAttempted', type: 'integer' },
    'Shots - On Target': { field: 'shotsOnTarget', type: 'integer' },
    'Runs Into Boxes': { field: 'runsIntoBoxes', type: 'integer' },
    'Corners': { field: 'corners', type: 'integer' },
    'Dangerous Crosses': { field: 'dangerousCrosses', type: 'integer' },
    'Dribbles': { field: 'dribbles', type: 'integer' },
    'Penetrating Dribbles': { field: 'penetratingDribbles', type: 'integer' },
    'Take Ons': { field: 'takeOns', type: 'integer' },
    'First Touch - Success': { field: 'firstTouchSuccess', type: 'integer' },
    'First Touch - Success Rate (%)': { field: 'firstTouchSuccessRate', type: 'percentage' },
    'Tackles': { field: 'tackles', type: 'integer' },
    'Free Kicks': { field: 'freeKicks', type: 'integer' },
    'Offsides': { field: 'offsides', type: 'integer' },
    'Pass - Total Attempted': { field: 'passesAttempted', type: 'integer' },
    'Pass - Success': { field: 'passesSuccess', type: 'integer' },
    'Pass - Success Rate (%)': { field: 'passingSuccessRate', type: 'percentage' },
    'Pass - Total Distance (m)': { field: 'passingTotalDistance', type: 'integer' },
    'Pass - Average Pass Distance (m)': { field: 'passingAverageDistance', type: 'integer' },
    'Pass - Average Pass Velocity (km/h)': { field: 'passingAverageVelocity', type: 'integer' },
    'Right Foot Pass - Attempted': { field: 'rightFootPassAttempted', type: 'integer' },
    'Right Foot Pass - Success': { field: 'rightFootPassSuccess', type: 'integer' },
    'Right Foot Pass - Success Rate (%)': { field: 'rightFootPassSuccessRate', type: 'percentage' },
    'Left Foot Pass - Attempted': { field: 'leftFootPassAttempted', type: 'integer' },
    'Left Foot Pass - Success': { field: 'leftFootPassSuccess', type: 'integer' },
    'Left Foot Pass - Success Rate (%)': { field: 'leftFootPassSuccessRate', type: 'percentage' },
  };

  // Process each row of data
  for (const row of data) {
    const event = row['Event'];
    const value = row[teamColumn];
    
    if (event && fieldMapping[event] && value !== undefined && value !== null && value !== '') {
      const mapping = fieldMapping[event];
      const fieldName = mapping.field;
      const fieldType = mapping.type;
      
      // Convert value to appropriate type
      let parsedValue = value;
      
      // First, extract numeric value from string if needed
      if (typeof value === 'string') {
        // Remove any non-numeric characters except decimal points and negative signs
        const numericString = value.replace(/[^0-9.-]/g, '');
        if (numericString && !isNaN(parseFloat(numericString))) {
          parsedValue = parseFloat(numericString);
        } else {
          continue; // Skip non-numeric values
        }
      }
      
      // Ensure we have a number
      if (typeof parsedValue !== 'number' || isNaN(parsedValue)) {
        continue; // Skip invalid values
      }
      
      // Apply type-specific formatting
      switch (fieldType) {
        case 'integer':
          // Special handling for distance conversion
          if (fieldName === 'totalTeamDistance') {
            parsedValue = Math.round(parsedValue * 1000); // Convert km to meters
          } else {
            parsedValue = Math.round(parsedValue); // Round to integer
          }
          break;
        case 'percentage':
          // Database expects integer percentage values
          parsedValue = Math.round(parsedValue); // Round to integer
          break;
        case 'float':
          // Keep as float, round to reasonable precision
          parsedValue = Math.round(parsedValue * 100) / 100; // Round to 2 decimal places
          break;
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
  // Club routes
  app.get("/api/clubs", async (req, res) => {
    try {
      const clubs = await storage.getClubs();
      res.json(clubs);
    } catch (error) {
      console.error("Error fetching clubs:", error);
      res.status(500).json({ message: "Failed to fetch clubs" });
    }
  });

  app.get("/api/clubs/:id", async (req, res) => {
    try {
      const club = await storage.getClub(req.params.id);
      if (!club) {
        return res.status(404).json({ message: "Club not found" });
      }
      res.json(club);
    } catch (error) {
      console.error("Error fetching club:", error);
      res.status(500).json({ message: "Failed to fetch club" });
    }
  });

  app.post("/api/clubs", async (req, res) => {
    try {
      const clubData = insertClubSchema.parse(req.body);
      const club = await storage.createClub(clubData);
      res.status(201).json(club);
    } catch (error) {
      console.error("Error creating club:", error);
      res.status(400).json({ message: "Failed to create club" });
    }
  });

  app.patch("/api/clubs/:id", async (req, res) => {
    try {
      const clubData = insertClubSchema.partial().parse(req.body);
      const club = await storage.updateClub(req.params.id, clubData);
      res.json(club);
    } catch (error) {
      console.error("Error updating club:", error);
      res.status(400).json({ message: "Failed to update club" });
    }
  });

  app.put("/api/clubs/:id/logo", async (req, res) => {
    try {
      const { logoURL } = req.body;
      const club = await storage.updateClubLogo(req.params.id, logoURL);
      res.json(club);
    } catch (error) {
      console.error("Error updating club logo:", error);
      res.status(400).json({ message: "Failed to update club logo" });
    }
  });

  // Object upload route for logos
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  // Serve uploaded logos
  app.get("/logos/:logoPath(*)", async (req, res) => {
    try {
      const logoPath = `/logos/${req.params.logoPath}`;
      const objectStorageService = new ObjectStorageService();
      const logoFile = await objectStorageService.getLogoFile(logoPath);
      await objectStorageService.downloadObject(logoFile, res);
    } catch (error) {
      console.error("Error serving logo:", error);
      res.status(404).json({ message: "Logo not found" });
    }
  });

  // Serve uploads from object storage
  app.get("/uploads/:uploadPath(*)", async (req, res) => {
    try {
      const uploadPath = `/uploads/${req.params.uploadPath}`;
      const objectStorageService = new ObjectStorageService();
      const uploadFile = await objectStorageService.getUploadFile(uploadPath);
      await objectStorageService.downloadObject(uploadFile, res);
    } catch (error) {
      console.error("Error serving upload:", error);
      res.status(404).json({ message: "Upload not found" });
    }
  });

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

  app.put("/api/teams/:id", async (req, res) => {
    try {
      const teamData = insertTeamSchema.partial().parse(req.body);
      const team = await storage.updateTeam(req.params.id, teamData);
      res.json(team);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(400).json({ message: "Failed to update team" });
    }
  });

  // Player routes
  // Get single user by id
  app.get("/api/user/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update single user by id
  app.patch("/api/user/:id", async (req, res) => {
    try {
      // For PATCH requests, validate the partial data with all the new fields
      const validKeys = ['firstName', 'lastName', 'shirtName', 'email', 'phone', 'emergencyContact', 'emergencyContactPhone', 'gender', 'dateOfBirth', 'status', 'role', 'hometown', 'year', 'height'];
      const updates = Object.keys(req.body).reduce((acc, key) => {
        if (validKeys.includes(key)) {
          acc[key] = req.body[key];
        }
        return acc;
      }, {} as any);
      
      const user = await storage.updateUser(req.params.id, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const teamId = req.query.teamId as string;
      const users = await storage.getUsers(teamId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Route for getting players by team ID (expected by frontend)
  app.get("/api/users/:teamId", async (req, res) => {
    try {
      const teamId = req.params.teamId;
      const users = await storage.getUsers(teamId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users by team:", error);
      res.status(500).json({ message: "Failed to fetch users" });
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

  app.post("/api/users", async (req, res) => {
    try {
      const { teamId, jerseyNumber, position, starPlayer, fitnessStatus, ...userData } = req.body;
      
      // Set shirt_name to surname if not provided
      if (!userData.shirtName && userData.lastName) {
        userData.shirtName = userData.lastName;
      }
      
      // Create user first with personal information
      const validatedUserData = insertUserSchema.parse(userData);
      const user = await storage.createUser(validatedUserData);
      
      // Add to team if teamId and position are provided
      if (teamId && position) {
        const teamAssignment = {
          userId: user.id,
          teamId,
          jerseyNumber: jerseyNumber || null,
          position,
          starPlayer: starPlayer || false,
          fitnessStatus: fitnessStatus || 'Fit'
        };
        
        const validatedTeamData = insertUserTeamSchema.parse(teamAssignment);
        await storage.addUserToTeam(user.id, teamId, validatedTeamData);
      }
      
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, userData);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      // For PATCH requests, validate the partial data
      const validKeys = ['firstName', 'lastName', 'shirtName', 'email', 'phone', 'emergencyContact', 'emergencyContactPhone', 'gender', 'dateOfBirth', 'status', 'role', 'hometown', 'year', 'height'];
      const updates = Object.keys(req.body).reduce((acc, key) => {
        if (validKeys.includes(key)) {
          acc[key] = req.body[key];
        }
        return acc;
      }, {} as any);
      
      const user = await storage.updateUser(req.params.id, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // User-Team relationship routes
  // Get all teams for a user
  app.get("/api/user/:userId/teams", async (req, res) => {
    try {
      const userTeams = await storage.getUserTeams(req.params.userId);
      res.json(userTeams);
    } catch (error) {
      console.error("Error fetching user teams:", error);
      res.status(500).json({ message: "Failed to fetch user teams" });
    }
  });

  // Add user to a team
  app.post("/api/user/:userId/teams", async (req, res) => {
    try {
      const { teamId, jerseyNumber, position, starPlayer, fitnessStatus } = req.body;
      
      const teamAssignment = {
        userId: req.params.userId,
        teamId,
        jerseyNumber: jerseyNumber || 0,
        position,
        starPlayer: starPlayer || false,
        fitnessStatus: fitnessStatus || 'Fit'
      };
      
      const validatedTeamData = insertUserTeamSchema.parse(teamAssignment);
      const userTeam = await storage.addUserToTeam(req.params.userId, teamId, validatedTeamData);
      res.status(201).json(userTeam);
    } catch (error) {
      console.error("Error adding user to team:", error);
      res.status(400).json({ message: "Failed to add user to team" });
    }
  });

  // Remove user from a team
  app.delete("/api/user/:userId/teams/:teamId", async (req, res) => {
    try {
      await storage.removeUserFromTeam(req.params.userId, req.params.teamId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing user from team:", error);
      res.status(500).json({ message: "Failed to remove player from team" });
    }
  });


  // Get all players for a team
  app.get("/api/team/:teamId/users", async (req, res) => {
    try {
      const teamUsers = await storage.getTeamUsers(req.params.teamId);
      res.json(teamUsers);
    } catch (error) {
      console.error("Error fetching team users:", error);
      res.status(500).json({ message: "Failed to fetch team users" });
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

  // Image fetching endpoint for URL-based logo acquisition
  app.get("/api/fetch-image", async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      
      if (!imageUrl) {
        return res.status(400).json({ message: "URL parameter is required" });
      }

      // Validate URL format
      try {
        new URL(imageUrl);
      } catch (error) {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      // Fetch the image
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        return res.status(400).json({ message: "Failed to fetch image from URL" });
      }

      const contentType = response.headers.get('content-type');
      
      // Validate that it's an image
      if (!contentType || !contentType.startsWith('image/')) {
        return res.status(400).json({ message: "URL does not point to a valid image" });
      }

      // Stream the image data back to the client
      res.setHeader('Content-Type', contentType);
      
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));

    } catch (error) {
      console.error("Error fetching image from URL:", error);
      res.status(500).json({ message: "Failed to fetch image" });
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

  app.patch("/api/competitions/:id", async (req, res) => {
    try {
      const competitionData = insertCompetitionSchema.partial().parse(req.body);
      const competition = await storage.updateCompetition(req.params.id, competitionData);
      res.json(competition);
    } catch (error) {
      console.error("Error updating competition:", error);
      res.status(400).json({ message: "Failed to update competition" });
    }
  });

  app.post("/api/competitions/:id/logo", upload.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No logo file uploaded" });
      }
      
      const logoPath = `/uploads/${Date.now()}-${req.file.originalname}`;
      await fs.writeFile(`public${logoPath}`, req.file.buffer);
      
      const competition = await storage.updateCompetitionLogo(req.params.id, logoPath);
      res.json({ success: true, logoPath, competition });
    } catch (error) {
      console.error("Error uploading competition logo:", error);
      res.status(500).json({ message: "Failed to upload competition logo" });
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
      const { newOpponentWebsite, discoveredLogoUrl, ...fixtureData } = req.body;
      const parsedData = insertFixtureSchema.parse(fixtureData);
      
      // Auto-create competition if it doesn't exist
      if (parsedData.competition) {
        await storage.getOrCreateCompetition(parsedData.competition);
      }
      
      // Auto-create opposition team if it doesn't exist, with website URL and logo if provided
      if (parsedData.opponent) {
        await storage.getOrCreateOppositionTeam(
          parsedData.opponent, 
          newOpponentWebsite, 
          discoveredLogoUrl
        );
      }
      
      const fixture = await storage.createFixture(parsedData);
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

      // Note: Individual player stats removed from schema

      const statistics = {
        totalPlayers: players.length,
        matchesPlayed: completedFixtures.length,
        wins,
        draws,
        losses,
        totalGoals: totalGoalsScored, // Use actual match goals
        totalGoalsConceded,
        goalDifference: totalGoalsScored - totalGoalsConceded,
        // Player-level goal/assist tracking removed from individual player records
      };

      res.json(statistics);
    } catch (error) {
      console.error("Error fetching team statistics:", error);
      res.status(500).json({ message: "Failed to fetch team statistics" });
    }
  });

  // Team card statistics (for team overview cards)
  app.get("/api/teams/:teamId/card-stats", async (req, res) => {
    try {
      const { teamId } = req.params;
      
      // Get player count via playerTeams junction table
      const teamPlayers = await storage.getTeamPlayers(teamId);
      const playerCount = teamPlayers.filter(tp => tp.status === 'active').length;
      
      // Get all fixtures for this team
      const fixtures = await storage.getFixtures(teamId);
      const matchCount = fixtures.length;
      
      // Get fixtures with videos
      const processingCount = fixtures.filter(f => f.hasVideo === true).length;
      
      const cardStats = {
        players: playerCount,
        matches: matchCount,
        processing: processingCount
      };

      res.json(cardStats);
    } catch (error) {
      console.error("Error fetching team card statistics:", error);
      res.status(500).json({ message: "Failed to fetch team card statistics" });
    }
  });

  // Club card statistics (for club overview card)
  app.get("/api/clubs/:clubId/card-stats", async (req, res) => {
    try {
      const { clubId } = req.params;
      
      // Get all teams for this club
      const teams = await storage.getTeams();
      const clubTeams = teams.filter(team => team.clubId === clubId);
      const teamCount = clubTeams.length;
      
      // Get all players across all teams in this club
      let totalPlayers = 0;
      for (const team of clubTeams) {
        const teamPlayers = await storage.getTeamPlayers(team.id);
        totalPlayers += teamPlayers.filter(tp => tp.status === 'active').length;
      }
      
      // Get all fixtures across all teams in this club
      let totalFixtures = 0;
      for (const team of clubTeams) {
        const fixtures = await storage.getFixtures(team.id);
        totalFixtures += fixtures.length;
      }
      
      const cardStats = {
        players: totalPlayers,
        matches: teamCount, // Changed from fixtures to team count as requested
        processing: totalFixtures // Using total fixtures for processing count
      };

      res.json(cardStats);
    } catch (error) {
      console.error("Error fetching club card statistics:", error);
      res.status(500).json({ message: "Failed to fetch club card statistics" });
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

  // Video serving endpoint to handle CORS and authentication
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      // Set proper headers for video streaming
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length',
      });
      
      // Enable range requests for video seeking
      if (req.headers.range) {
        res.set('Accept-Ranges', 'bytes');
      }
      
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving video:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Video not found" });
      }
      return res.status(500).json({ error: "Failed to serve video" });
    }
  });

  // Logo upload routes
  app.post("/api/logos/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getLogoUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting logo upload URL:", error);
      res.status(500).json({ error: "Failed to get logo upload URL" });
    }
  });

  app.get("/logos/:logoPath(*)", async (req, res) => {
    const logoPath = `/${req.params.logoPath}`;
    const objectStorageService = new ObjectStorageService();
    try {
      const logoFile = await objectStorageService.getLogoFile(logoPath);
      objectStorageService.downloadObject(logoFile, res);
    } catch (error) {
      console.error("Error serving logo:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Update club logo
  app.put("/api/clubs/:id/logo", async (req, res) => {
    try {
      if (!req.body.logoURL) {
        return res.status(400).json({ error: "logoURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const logoPath = objectStorageService.normalizeLogoPath(req.body.logoURL);

      const updatedClub = await storage.updateClub(req.params.id, {
        logoPath: logoPath,
      });

      res.status(200).json({
        logoPath: logoPath,
        club: updatedClub,
      });
    } catch (error) {
      console.error("Error setting club logo:", error);
      res.status(500).json({ error: "Internal server error" });
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

  // Logo upload endpoint
  const logoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.') as any, false);
      }
    }
  });

  app.post('/api/opposition-teams/logo', logoUpload.single('logo'), async (req, res) => {
    try {
      const teamId = req.body.teamId;
      const file = req.file;

      if (!teamId || !file) {
        return res.status(400).json({ error: 'Team ID and logo file are required' });
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const ext = path.extname(file.originalname) || '.png';
      const filename = `${teamId}-logo-${timestamp}${ext}`;
      const filepath = path.join(uploadsDir, filename);

      // Save the file
      await fs.writeFile(filepath, file.buffer);

      // Update the opposition team with the logo path
      const logoPath = `/uploads/${filename}`;
      await storage.updateOppositionTeam(teamId, { logoPath });

      res.json({ 
        success: true, 
        logoPath,
        message: 'Logo uploaded and saved successfully'
      });

    } catch (error) {
      console.error('Logo upload error:', error);
      res.status(500).json({ error: 'Failed to upload logo' });
    }
  });

  app.delete('/api/opposition-teams/:id/logo', async (req, res) => {
    try {
      const teamId = req.params.id;
      const team = await storage.getOppositionTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ error: 'Opposition team not found' });
      }

      if (!team.logoPath) {
        return res.status(400).json({ error: 'Team has no logo to delete' });
      }

      // Delete the file if it exists
      try {
        if (team.logoPath.startsWith('/uploads/')) {
          const filePath = path.join(process.cwd(), 'public', team.logoPath);
          await fs.unlink(filePath);
        }
      } catch (fileError) {
        console.warn('Could not delete logo file:', fileError);
        // Continue even if file deletion fails
      }

      // Update team to remove logo path
      await storage.updateOppositionTeam(teamId, { logoPath: null });

      res.json({ 
        success: true, 
        message: 'Opposition team logo deleted successfully'
      });

    } catch (error) {
      console.error('Opposition team logo deletion error:', error);
      res.status(500).json({ error: 'Failed to delete opposition team logo' });
    }
  });

  app.post('/api/clubs/logo', logoUpload.single('logo'), async (req, res) => {
    try {
      const clubId = req.body.clubId;
      const file = req.file;

      if (!clubId || !file) {
        return res.status(400).json({ error: 'Club ID and logo file are required' });
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const ext = path.extname(file.originalname) || '.png';
      const filename = `${clubId}-logo-${timestamp}${ext}`;
      const filepath = path.join(uploadsDir, filename);

      // Save the file
      await fs.writeFile(filepath, file.buffer);

      // Update the club with the logo path
      const logoPath = `/uploads/${filename}`;
      await storage.updateClub(clubId, { logoPath });

      res.json({ 
        success: true, 
        logoPath,
        message: 'Club logo uploaded and saved successfully'
      });

    } catch (error) {
      console.error('Club logo upload error:', error);
      res.status(500).json({ error: 'Failed to upload club logo' });
    }
  });

  app.delete('/api/clubs/:id/logo', async (req, res) => {
    try {
      const clubId = req.params.id;
      const club = await storage.getClub(clubId);
      
      if (!club) {
        return res.status(404).json({ error: 'Club not found' });
      }

      if (!club.logoPath) {
        return res.status(400).json({ error: 'Club has no logo to delete' });
      }

      // Delete the file if it exists
      try {
        if (club.logoPath.startsWith('/uploads/')) {
          const filePath = path.join(process.cwd(), 'public', club.logoPath);
          await fs.unlink(filePath);
        }
      } catch (fileError) {
        console.warn('Could not delete logo file:', fileError);
        // Continue even if file deletion fails
      }

      // Update club to remove logo path
      await storage.updateClub(clubId, { logoPath: null });

      res.json({ 
        success: true, 
        message: 'Club logo deleted successfully'
      });

    } catch (error) {
      console.error('Club logo deletion error:', error);
      res.status(500).json({ error: 'Failed to delete club logo' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
