import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClubSchema, insertTeamSchema, insertUserSchema, insertUserTeamSchema, insertOppositionTeamSchema, insertSystemTeamSchema, insertCompetitionSchema, insertFixtureSchema, insertMatchStatsSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { stat } from "fs/promises";
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

  // Get users by club ID  
  app.get("/api/club/:clubId/users", async (req, res) => {
    try {
      console.log("Club users endpoint hit with clubId:", req.params.clubId);
      const clubUsers = await storage.getClubUsers(req.params.clubId);
      console.log("Found users:", clubUsers.length);
      // Extract just the user data for frontend compatibility
      const users = clubUsers.map(cu => cu.user);
      res.json(users);
    } catch (error) {
      console.error("Error fetching club users:", error);
      res.status(500).json({ message: "Failed to fetch club users" });
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
      const includeClubs = req.query.includeClubs === 'true';
      
      if (includeClubs) {
        const users = await storage.getUsersWithClubs();
        res.json(users);
      } else {
        const users = await storage.getUsers(teamId);
        res.json(users);
      }
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

  // Player-Team relationship routes (aliases for user-team routes)
  // Get all teams for a player
  app.get("/api/player/:playerId/teams", async (req, res) => {
    try {
      const userTeams = await storage.getUserTeams(req.params.playerId);
      res.json(userTeams);
    } catch (error) {
      console.error("Error fetching player teams:", error);
      res.status(500).json({ message: "Failed to fetch player teams" });
    }
  });

  // Add player to a team
  app.post("/api/player/:playerId/teams", async (req, res) => {
    try {
      const { teamId, jerseyNumber, position, starPlayer, fitnessStatus } = req.body;
      
      const teamAssignment = {
        userId: req.params.playerId,
        teamId,
        jerseyNumber: jerseyNumber || 0,
        position,
        starPlayer: starPlayer || false,
        fitnessStatus: fitnessStatus || 'Fit'
      };
      
      const validatedTeamData = insertUserTeamSchema.parse(teamAssignment);
      const userTeam = await storage.addUserToTeam(req.params.playerId, teamId, validatedTeamData);
      res.status(201).json(userTeam);
    } catch (error) {
      console.error("Error adding player to team:", error);
      res.status(400).json({ message: "Failed to add player to team" });
    }
  });

  // Remove player from a team
  app.delete("/api/player/:playerId/teams/:teamId", async (req, res) => {
    try {
      await storage.removeUserFromTeam(req.params.playerId, req.params.teamId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing player from team:", error);
      res.status(500).json({ message: "Failed to remove player from team" });
    }
  });

  // Photo upload routes
  // Get upload URL for player photo
  app.post("/api/player/:playerId/photo/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting photo upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Update player avatar path after upload
  app.put("/api/player/:playerId/photo", async (req, res) => {
    try {
      if (!req.body.photoURL) {
        return res.status(400).json({ error: "photoURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const avatarPath = objectStorageService.normalizeObjectEntityPath(req.body.photoURL);

      // Update the user's avatar path
      const user = await storage.updateUser(req.params.playerId, { avatarPath });
      res.json({ avatarPath, user });
    } catch (error) {
      console.error("Error updating player photo:", error);
      res.status(500).json({ message: "Failed to update player photo" });
    }
  });

  // Serve player photos
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving photo:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Photo not found" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Flashscore fixtures parser function
  async function parseFlashscoreFixtures(html: string) {
    const fixtures: any[] = [];
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);

    console.log("Starting Flashscore fixtures parsing...");

    try {
      // Extract team name from page header
      const teamName = $('h1 .participant__participantName').text().trim() || 
                       $('.teamHeader__name').text().trim() || 
                       $('.heading__name').text().trim() || 
                       'Team';
      
      console.log(`Found team name: ${teamName}`);

      // Find all fixture rows - they typically have specific classes or patterns
      const fixtureElements = $('[class*="event__match"], .event-row, [data-testid*="match"], .fixture');
      
      if (fixtureElements.length === 0) {
        console.log("No fixture elements found, trying alternative selectors...");
        // Try alternative patterns
        const alternativeElements = $('a[href*="/match/"], .match, .fixture, [class*="fixture"]');
        console.log(`Found ${alternativeElements.length} alternative fixture elements`);
      }

      // Try different parsing approaches
      console.log("Trying multiple parsing strategies...");
      
      // Strategy 1: Look for fixture containers with multiple selectors
      const possibleSelectors = [
        '[class*="event"], [data-testid*="event"], [class*="match"], [data-testid*="match"]',
        '.event__match, .fixture, .match-item, [class*="fixture"]',
        'div[class*="event"], div[class*="match"], div[class*="fixture"]',
        '[role="row"], tr, .table-row'
      ];

      let foundFixtures = false;
      
      for (const selector of possibleSelectors) {
        console.log(`Trying selector: ${selector}`);
        const elements = $(selector);
        console.log(`Found ${elements.length} elements with selector`);
        
        if (elements.length > 0) {
          elements.each((index, element) => {
            const $element = $(element);
            const text = $element.text();
            
            // Look for date patterns: various formats
            const datePatterns = [
              /(\d{1,2}[\./]\d{1,2}[\./]?\d{0,4})\s*(\d{1,2}:\d{2})/,  // DD.MM or DD.MM.YYYY with time
              /(\d{1,2}[\./]\d{1,2})\s+(\d{1,2}:\d{2})/,               // DD/MM with time
              /(\d{4}-\d{2}-\d{2})\s*(\d{1,2}:\d{2})/,                 // YYYY-MM-DD with time
            ];
            
            for (const pattern of datePatterns) {
              const dateTimeMatch = text.match(pattern);
              
              if (dateTimeMatch) {
                const [, dateStr, timeStr] = dateTimeMatch;
                console.log(`Found date/time: ${dateStr} ${timeStr} in text: ${text.substring(0, 100)}...`);
                
                // Look for team names in various ways
                let homeTeam = '';
                let awayTeam = '';
                
                // Clean the text and split by common separators
                const cleanText = text.replace(/\s+/g, ' ').trim();
                const parts = cleanText.split(/\s*[-–—vs\.]\s*/i);
                
                // Try to find two team names
                const possibleTeams = parts.filter(part => {
                  const trimmed = part.trim();
                  return trimmed.length > 2 && 
                         trimmed.length < 40 && 
                         !trimmed.match(/^\d/) && // Not starting with number
                         !trimmed.match(/\d{1,2}:\d{2}/) && // Not time
                         !trimmed.match(/^\d{1,2}[\./]\d{1,2}/) && // Not date
                         !trimmed.match(/^(Home|Away|Neutral)$/i); // Not venue
                });
                
                console.log(`Possible teams found: ${possibleTeams.join(', ')}`);
                
                if (possibleTeams.length >= 2) {
                  // Take first two as home and away
                  homeTeam = possibleTeams[0].trim();
                  awayTeam = possibleTeams[1].trim();
                } else if (possibleTeams.length === 1 && teamName) {
                  // One team found, use teamName as the other
                  const foundTeam = possibleTeams[0].trim();
                  if (foundTeam !== teamName) {
                    if (text.toLowerCase().includes('home') || text.toLowerCase().includes('h')) {
                      homeTeam = teamName;
                      awayTeam = foundTeam;
                    } else {
                      homeTeam = foundTeam;
                      awayTeam = teamName;
                    }
                  }
                }
                
                if (homeTeam && awayTeam && homeTeam !== awayTeam) {
                  // Parse date
                  let fixtureDate: Date;
                  try {
                    if (dateStr.includes('/') || dateStr.includes('.')) {
                      const [day, month, year] = dateStr.split(/[\/\.]/).map(n => parseInt(n));
                      const currentYear = new Date().getFullYear();
                      const fullYear = year && year > 2000 ? year : (year ? 2000 + year : currentYear);
                      fixtureDate = new Date(fullYear, (month || 1) - 1, day || 1);
                    } else {
                      fixtureDate = new Date(dateStr);
                    }
                    
                    // If date is in the past, assume next year
                    if (fixtureDate < new Date() && !year) {
                      fixtureDate.setFullYear(fixtureDate.getFullYear() + 1);
                    }
                  } catch (e) {
                    console.log(`Failed to parse date: ${dateStr}`);
                    continue;
                  }
                  
                  const fixture = {
                    date: fixtureDate.toISOString(),
                    time: timeStr,
                    homeTeam: homeTeam.trim(),
                    awayTeam: awayTeam.trim(),
                    userTeam: teamName,
                    isHome: homeTeam.trim().includes(teamName) || homeTeam.trim() === teamName
                  };
                  
                  // Check for duplicates
                  const isDuplicate = fixtures.some(f => 
                    f.date === fixture.date && 
                    f.homeTeam === fixture.homeTeam && 
                    f.awayTeam === fixture.awayTeam
                  );
                  
                  if (!isDuplicate) {
                    fixtures.push(fixture);
                    foundFixtures = true;
                    console.log(`Found fixture: ${fixture.homeTeam} vs ${fixture.awayTeam} on ${dateStr} at ${timeStr}`);
                  }
                }
                
                break; // Found a date pattern, move to next element
              }
            }
          });
        }
        
        if (foundFixtures && fixtures.length > 0) {
          console.log(`Successfully found fixtures with selector: ${selector}`);
          break; // Stop trying other selectors if we found fixtures
        }
      }

      console.log(`Successfully parsed ${fixtures.length} fixtures`);
      
    } catch (error) {
      console.error("Error parsing Flashscore fixtures:", error);
    }

    return fixtures;
  }

  // Fixtures import endpoints
  app.post("/api/fixtures/import-from-url", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }

      // Import node-fetch for web scraping
      const fetch = (await import('node-fetch')).default;
      
      console.log(`Starting fixture import from URL: ${url}`);
      
      // Fetch the webpage
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        return res.status(400).json({ 
          message: `Failed to fetch URL: ${response.status} ${response.statusText}` 
        });
      }

      const html = await response.text();
      console.log(`Fetched HTML content, size: ${html.length} chars`);

      // Parse fixtures using our Flashscore parser
      const fixtures = await parseFlashscoreFixtures(html);

      res.json({
        success: true,
        url,
        fixtures
      });

    } catch (error) {
      console.error("Error importing fixtures from URL:", error);
      res.status(500).json({ 
        message: "Failed to import fixtures from URL",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Bulk import fixtures endpoint
  app.post("/api/fixtures/bulk-import", async (req, res) => {
    try {
      const { teamId, fixtures } = req.body;
      
      if (!teamId || !fixtures || !Array.isArray(fixtures)) {
        return res.status(400).json({ message: "teamId and fixtures array are required" });
      }

      console.log(`Starting import of ${fixtures.length} fixtures to team ${teamId}`);

      // Get team to validate it exists
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      let importedCount = 0;
      const errors: string[] = [];

      for (const fixtureData of fixtures) {
        try {
          // Parse the fixture data
          const { date, time, homeTeam, awayTeam, isHome } = fixtureData;
          
          // Combine date and time into a proper datetime
          const fixtureDate = new Date(date);
          const [hours, minutes] = time.split(':').map((n: string) => parseInt(n));
          fixtureDate.setHours(hours, minutes, 0, 0);

          // Check if fixture already exists (avoid duplicates)
          const existingFixtures = await storage.getFixtures();
          const isDuplicate = existingFixtures.some((f: any) => {
            const existingDate = new Date(f.date);
            return Math.abs(existingDate.getTime() - fixtureDate.getTime()) < 60000 && // Within 1 minute
                   f.opponent === (isHome ? awayTeam : homeTeam);
          });

          if (isDuplicate) {
            console.log(`Fixture vs ${isHome ? awayTeam : homeTeam} on ${fixtureDate.toISOString()} already exists - skipping`);
            continue;
          }

          // Create the fixture
          const fixture = await storage.createFixture({
            date: fixtureDate,
            opponent: isHome ? awayTeam : homeTeam,
            venue: isHome ? "Home" : "Away",
            type: isHome ? "HOME" : "AWAY",
            competition: "League", // Default competition
            homeScore: null,
            awayScore: null,
            status: "SCHEDULED",
            teamId // Associate with the selected team
          });

          console.log(`Created fixture: vs ${fixture.opponent}`);
          importedCount++;

        } catch (error) {
          const errorMsg = `Failed to import fixture ${fixtureData.homeTeam} vs ${fixtureData.awayTeam}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`Import completed: ${importedCount} fixtures imported, ${errors.length} errors`);

      res.json({
        success: true,
        imported: importedCount,
        errors: errors.length > 0 ? errors : undefined,
        total: fixtures.length
      });

    } catch (error) {
      console.error("Error in bulk fixture import:", error);
      res.status(500).json({ 
        message: "Failed to import fixtures",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Squad import endpoints
  // Scrape player data from URL
  app.post("/api/squad/import-from-url", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }

      // Import cheerio and node-fetch for web scraping
      const fetch = (await import('node-fetch')).default;
      const cheerio = await import('cheerio');

      // Fetch the webpage
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(400).json({ message: "Failed to fetch URL" });
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Parse Soccerway squad page structure
      const players: Array<{
        name: string;
        position: string;
        age: number | null;
        appearances: number;
        goals: number;
        jerseyNumber?: number;
      }> = [];

      console.log('Parsing HTML for squad data...');
      
      // Debug: Log some key elements to understand the structure
      console.log('Page title:', $('title').text());
      console.log('Found player links:', $('a[href*="/players/"]').length);
      console.log('URL hostname:', new URL(url).hostname);
      
      // Check if this is Flashscore (clean table structure)
      if (url.includes('flashscore.')) {
        console.log('Detected Flashscore - using table parser');
        
        // Look for section headers and player table rows
        const flashscoreSections = ['Goalkeepers', 'Defenders', 'Midfielders', 'Forwards', 'Attackers'];
        
        // Try a different approach - parse the entire text and group by position headers
        const fullText = $('body').text();
        const lines = fullText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        let currentPosition = 'Unknown';
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Check if this line is a position header
          if (line === 'Goalkeepers') {
            currentPosition = 'Goalkeeper';
            console.log(`Found position section: Goalkeepers`);
            continue;
          } else if (line === 'Defenders') {
            currentPosition = 'Defender';
            console.log(`Found position section: Defenders`);
            continue;
          } else if (line === 'Midfielders') {
            currentPosition = 'Midfielder';
            console.log(`Found position section: Midfielders`);
            continue;
          } else if (line === 'Forwards' || line === 'Attackers') {
            currentPosition = 'Forward';
            console.log(`Found position section: ${line}`);
            continue;
          }
          
          // Skip header lines like "#", "Name", "Age", "MIN"
          if (line === '#' || line === 'Name' || line === 'Age' || line === 'MIN') {
            continue;
          }
          
          // Look for player lines: number + name + age pattern
          const playerMatch = line.match(/^(\d+)\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d{1,2}|\?)/);
          if (playerMatch) {
            const [, number, name, ageStr] = playerMatch as RegExpMatchArray;
            const age = ageStr === '?' ? null : parseInt(ageStr);
            const cleanName = name.trim();
            
            if (cleanName.length > 3 && cleanName.length < 40) {
              players.push({
                name: cleanName,
                position: currentPosition,
                age,
                appearances: 0,
                goals: 0,
                jerseyNumber: parseInt(number)
              });
              
              console.log(`Found player: ${cleanName} (#${number}, ${currentPosition}, age ${age || 'unknown'})`);
            }
          }
        }
        
        // New approach: Parse player links directly from the Flashscore structure
        if (players.length === 0) {
          console.log('Text parsing failed, trying direct link-based approach...');
          
          flashscoreSections.forEach(sectionName => {
            // Find section header
            $(`*:contains("${sectionName}")`).filter(function() {
              return $(this).text().trim() === sectionName;
            }).each((_: any, sectionEl: any) => {
              console.log(`Processing Flashscore section: ${sectionName}`);
              
              const $section = $(sectionEl);
              
              // Look for player links after this section header
              // Find the container that holds the player data
              let container = $section.parent();
              let searchAttempts = 0;
              
              while (container.length && searchAttempts < 5) {
                const playerLinks = container.find('a[href*="/player/"]');
                
                if (playerLinks.length > 0) {
                  console.log(`Found ${playerLinks.length} player links in ${sectionName} section`);
                  
                  playerLinks.each((_: any, linkEl: any) => {
                    const $link = $(linkEl);
                    const playerName = $link.text().trim();
                    
                    // Skip if not a valid player name
                    if (!playerName || playerName.length < 3 || playerName.match(/^\d+$/)) {
                      return;
                    }
                    
                    // Find the row containing this link to get jersey number and age
                    // Look for table row or parent container
                    let $row = $link.closest('tr');
                    if (!$row.length) {
                      $row = $link.parent();
                      // Keep going up until we find a container with more data
                      let attempts = 0;
                      while ($row.length && $row.text().trim().split(/\s+/).length < 4 && attempts < 5) {
                        $row = $row.parent();
                        attempts++;
                      }
                    }
                    
                    const rowText = $row.text().trim();
                    console.log(`Row text for ${playerName}: "${rowText}"`);
                    
                    // Extract jersey number (first number in the row)
                    const jerseyMatch = rowText.match(/^(\d+)/);
                    const jerseyNumber = jerseyMatch ? parseInt(jerseyMatch[1]) : undefined;
                    
                    // Better age extraction - look for two-digit number that's likely age
                    // Pattern: Find numbers in the row, look for age-like values (14-25 typically)
                    const numbers = rowText.match(/\d+/g) || [];
                    let age = null;
                    
                    // Look for age pattern - typically after the name and before stats
                    for (const num of numbers) {
                      const numVal = parseInt(num);
                      if (numVal >= 14 && numVal <= 25 && numVal !== jerseyNumber) {
                        age = numVal;
                        break;
                      }
                    }
                    
                    // Also try to find age pattern with ? for unknown age
                    if (!age) {
                      const agePatternMatch = rowText.match(/(\d{1,2}|\?)\s+(?:0\s+)*MIN|(\d{1,2}|\?)\s+\d+/);
                      if (agePatternMatch) {
                        const ageStr = agePatternMatch[1] || agePatternMatch[2];
                        if (ageStr !== '?' && parseInt(ageStr) >= 14 && parseInt(ageStr) <= 25) {
                          age = parseInt(ageStr);
                        }
                      }
                    }
                    
                    // Map section to position
                    let position = sectionName;
                    if (position === 'Goalkeepers') position = 'Goalkeeper';
                    if (position === 'Defenders') position = 'Defender';  
                    if (position === 'Midfielders') position = 'Midfielder';
                    if (position === 'Forwards' || position === 'Attackers') position = 'Forward';
                    
                    players.push({
                      name: playerName,
                      position,
                      age,
                      appearances: 0,
                      goals: 0,
                      jerseyNumber
                    });
                    
                    console.log(`Found player: ${playerName} (#${jerseyNumber || '?'}, ${position}, age ${age || 'unknown'})`);
                  });
                  
                  break; // Found players in this container, move to next section
                }
                
                container = container.next();
                searchAttempts++;
              }
            });
          });
        }
        
        // Fallback to original section-based approach if direct link parsing didn't work
        if (players.length === 0) {
          console.log('Direct link parsing failed, trying section-based approach...');
          
          flashscoreSections.forEach(sectionName => {
            // Find section header
            $(`*:contains("${sectionName}")`).filter(function() {
              return $(this).text().trim() === sectionName;
            }).each((_: any, sectionEl: any) => {
              console.log(`Found Flashscore section: ${sectionName}`);
              
              // Look for table rows after this section
              const $section = $(sectionEl);
              let container = $section.closest('div, section, table').next();
              
              // Also check siblings and parent containers
              const possibleContainers = [
                container,
                $section.parent().next(),
                $section.closest('table').find('tbody'),
                $section.nextAll().first()
              ];
            
            possibleContainers.forEach(cont => {
              if (cont && cont.length) {
                cont.find('tr, .player-row, [class*="player"], [class*="row"]').each((_: any, rowEl: any) => {
                  const $row = $(rowEl);
                  const rowText = $row.text().trim();
                  
                  // Look for player data pattern: number + name + age (with optional stats)
                  // Pattern: jersey# + name + age + optional stats (0 0 0 0 0 0)
                  const playerMatch = rowText.match(/(\d+)\s+([A-Za-z\s\.\-\']+?)\s+(\d{1,2}|\?)\s+(\d+\s+)*/) ||
                                   rowText.match(/(\d+)\s+([A-Za-z\s\.\-\']+?)\s+(\d{1,2})/);
                  
                  if (playerMatch) {
                    const [, number, name, ageStr] = playerMatch;
                    const age = ageStr === '?' ? null : parseInt(ageStr);
                    
                    // Clean up the name
                    const cleanName = name.trim().replace(/\s+/g, ' ');
                    
                    if (cleanName.length > 2 && cleanName.length < 40) {
                      // Map section to position
                      let position = sectionName;
                      if (position === 'Goalkeepers') position = 'Goalkeeper';
                      if (position === 'Defenders') position = 'Defender';
                      if (position === 'Midfielders') position = 'Midfielder';
                      if (position === 'Forwards' || position === 'Attackers') position = 'Forward';
                      
                      players.push({
                        name: cleanName,
                        position,
                        age: age !== null ? parseInt(age.toString()) : null,
                        appearances: 0,
                        goals: 0,
                        jerseyNumber: parseInt(number)
                      });
                      
                      console.log(`Found Flashscore player: ${cleanName} (#${number}, ${position}, age ${age || 'unknown'})`);
                    }
                  }
                  
                  // Also try a more direct approach for the exact format you showed
                  // Lines like: "12 Eze Goodness 17 0 0 0 0 0 0"
                  const directMatch = rowText.match(/^(\d+)\s+([A-Za-z]+\s+[A-Za-z]+)\s+(\d{1,2}|\?)/);
                  if (directMatch && !playerMatch) {
                    const [, number, name, ageStr] = directMatch;
                    const age = ageStr === '?' ? null : parseInt(ageStr);
                    const cleanName = name.trim();
                    
                    if (cleanName.length > 3 && cleanName.length < 40) {
                      // Map section to position
                      let position = sectionName;
                      if (position === 'Goalkeepers') position = 'Goalkeeper';
                      if (position === 'Defenders') position = 'Defender';
                      if (position === 'Midfielders') position = 'Midfielder';
                      if (position === 'Forwards' || position === 'Attackers') position = 'Forward';
                      
                      players.push({
                        name: cleanName,
                        position,
                        age,
                        appearances: 0,
                        goals: 0,
                        jerseyNumber: parseInt(number)
                      });
                      
                      console.log(`Found Flashscore player (direct): ${cleanName} (#${number}, ${position}, age ${age || 'unknown'})`);
                    }
                  }
                });
              }
            });
          });
        });
        }
      }
      // Check if this is Everton FC official site (different structure)  
      else if (url.includes('evertonfc.com')) {
        console.log('Detected Everton FC official site - using specific parser');
        
        // Look for player cards with position sections
        const positionSections = ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD', 'STRIKER'];
        
        positionSections.forEach(sectionName => {
          // Find section headers
          $(`*:contains("${sectionName}")`).filter(function() {
            return $(this).text().trim().toUpperCase() === sectionName;
          }).each((_: any, sectionEl: any) => {
            console.log(`Found section: ${sectionName}`);
            
            // Look for player cards after this section
            const $section = $(sectionEl);
            let container = $section.closest('div, section').next();
            let attempts = 0;
            
            while (container.length && attempts < 5) {
              // Look for player names in this container
              container.find('*').each((_: any, el: any) => {
                const $el = $(el);
                const text = $el.text().trim();
                
                // Look for player names (typically names like "Gospel-Eze", "Lukjanciks")
                if (text && 
                    text.length > 2 && 
                    text.length < 30 &&
                    text.match(/^[A-Z][a-z-]/) && // Starts with capital, contains letters/hyphens
                    !text.includes(' ') && // Single word (surname)
                    !text.toUpperCase().includes('GOALKEEPER') &&
                    !text.toUpperCase().includes('DEFENDER') &&
                    !text.toUpperCase().includes('MIDFIELDER') &&
                    !text.toUpperCase().includes('FORWARD')) {
                  
                  // Map section to position
                  let position = sectionName;
                  if (position === 'GOALKEEPER') position = 'Goalkeeper';
                  if (position === 'DEFENDER') position = 'Defender';
                  if (position === 'MIDFIELDER') position = 'Midfielder';
                  if (position === 'FORWARD' || position === 'STRIKER') position = 'Forward';
                  
                  players.push({
                    name: text,
                    position,
                    age: null, // Everton site might not show ages
                    appearances: 0,
                    goals: 0
                  });
                  
                  console.log(`Found Everton player: ${text} (${position})`);
                }
              });
              
              container = container.next();
              attempts++;
            }
          });
        });
        
        // If still no players, try a more general approach for Everton site
        if (players.length === 0) {
          console.log('Trying general Everton player search...');
          
          // Look for any text that might be player names
          $('*').each((_: any, el: any) => {
            const $el = $(el);
            const text = $el.text().trim();
            
            if (text && 
                text.length > 3 && 
                text.length < 25 &&
                text.match(/^[A-Z][a-z-]+$/) && // Capital letter start, letters/hyphens only
                !text.match(/^(GOALKEEPER|DEFENDER|MIDFIELDER|FORWARD|STRIKER|TEAMS|NEWS|MATCHES)$/)) {
              
              players.push({
                name: text,
                position: 'Unknown',
                age: null,
                appearances: 0,
                goals: 0
              });
              
              console.log(`Found Everton player (general): ${text}`);
            }
          });
        }
      }
      
      // Look for the specific pattern from your data: player containers with name, age, stats
      // Based on your example: "C. Loney\n2\n1\nC. Loney\n2\n1\n17 years old"
      
      // Method 1: Look for elements containing player names with age patterns
      const sections = ['Attackers', 'Midfielders', 'Defenders', 'Goalkeepers'];
      
      sections.forEach(sectionName => {
        // Find the section header
        const sectionHeader = $(`*:contains("${sectionName}")`).filter(function() {
          return $(this).text().trim() === sectionName;
        }).first();
        
        if (sectionHeader.length > 0) {
          console.log(`Found section: ${sectionName}`);
          
          // Find all player links after this section
          let nextElement = sectionHeader.parent().next();
          let searchAttempts = 0;
          
          while (nextElement.length && searchAttempts < 10) {
            const playerLinks = nextElement.find('a[href*="/players/"]');
            
            playerLinks.each((_: any, link: any) => {
              const $link = $(link);
              let playerName = $link.text().trim();
              
              // Clean up the name (remove numbers, extra whitespace)
              playerName = playerName.replace(/^\d+\s*/, '').replace(/\s+/g, ' ').trim();
              
              if (playerName && playerName.length > 2 && !playerName.match(/^\d+$/)) {
                // Extract age from surrounding text
                const containerText = $link.closest('div, tr, li').text();
                const ageMatch = containerText.match(/(\d+)\s*years?\s*old/i);
                const age = ageMatch ? parseInt(ageMatch[1]) : null;
                
                // Try to find stats (appearances and goals)
                const numbers = containerText.match(/\b\d+\b/g) || [];
                let appearances = 0;
                let goals = 0;
                
                // Look for patterns like "2 1" (appearances goals)
                if (numbers.length >= 2) {
                  appearances = parseInt(numbers[numbers.length - 2]) || 0;
                  goals = parseInt(numbers[numbers.length - 1]) || 0;
                }
                
                // Map section to position
                let position = sectionName.slice(0, -1); // Remove 's'
                if (position === 'Attacker') position = 'Forward';
                
                players.push({
                  name: playerName,
                  position,
                  age,
                  appearances,
                  goals
                });
                
                console.log(`Found player: ${playerName} (${position})`);
              }
            });
            
            nextElement = nextElement.next();
            searchAttempts++;
          }
        }
      });

      // Method 2: Target the specific Soccerway player card structure
      if (players.length === 0) {
        console.log('Trying Soccerway player card structure...');
        
        // Look for elements that contain both player links and age text
        $('a[href*="/players/"]').each((_: any, link: any) => {
          const $link = $(link);
          const playerName = $link.text().trim();
          
          // Filter out navigation and non-player links
          if (playerName && 
              playerName.length > 2 && 
              !playerName.toLowerCase().includes('player') &&
              !playerName.toLowerCase().includes('team') &&
              !playerName.toLowerCase().includes('match') &&
              !playerName.match(/^\d+$/) &&
              playerName.match(/^[A-Z]/)) { // Should start with capital letter
            
            // Look for the age and stats in the surrounding container
            const container = $link.closest('div, tr, li, section');
            const containerText = container.text();
            
            // Log what we found for debugging
            console.log(`Checking player link: "${playerName}"`);
            console.log(`Container text: "${containerText.substring(0, 100)}..."`);
            
            // Extract age pattern (X years old)
            const ageMatch = containerText.match(/(\d+)\s*years?\s*old/i);
            const age = ageMatch ? parseInt(ageMatch[1]) : null;
            
            // Only add if we found age info (more likely to be a real player)
            if (age !== null || containerText.includes('years')) {
              // Try to determine position from page sections
              const pageText = $('body').text().toLowerCase();
              let position = 'Unknown';
              
              // Look at surrounding context for position clues
              const surroundingText = container.parent().text().toLowerCase();
              if (surroundingText.includes('attack') || surroundingText.includes('forward')) {
                position = 'Forward';
              } else if (surroundingText.includes('midfield')) {
                position = 'Midfielder';
              } else if (surroundingText.includes('defend') || surroundingText.includes('defence')) {
                position = 'Defender';
              } else if (surroundingText.includes('goalkeeper') || surroundingText.includes('keeper')) {
                position = 'Goalkeeper';
              }
              
              // Extract stats (appearances and goals)
              const numbers = containerText.match(/\b\d+\b/g) || [];
              let appearances = 0;
              let goals = 0;
              
              // Look for the pattern: name, appearances, goals, age
              if (numbers.length >= 2) {
                // Filter out the age number
                const statsNumbers = numbers.filter(n => parseInt(n) !== age);
                if (statsNumbers.length >= 2) {
                  appearances = parseInt(statsNumbers[0]) || 0;
                  goals = parseInt(statsNumbers[1]) || 0;
                }
              }
              
              players.push({
                name: playerName,
                position,
                age,
                appearances,
                goals
              });
              
              console.log(`Found valid player: ${playerName} (${position}, ${age}y, ${appearances}⚽${goals}🥅)`);
            }
          }
        });
      }

      // Method 3: Direct search for all player links as fallback
      if (players.length === 0) {
        console.log('Trying basic player link search...');
        
        $('a[href*="/players/"]').each((_: any, link: any) => {
          const $link = $(link);
          let playerName = $link.text().trim();
          
          // Basic filtering
          if (playerName && 
              playerName.length > 2 && 
              !playerName.toLowerCase().includes('player') &&
              !playerName.match(/^\d+$/)) {
            
            players.push({
              name: playerName,
              position: 'Unknown',
              age: null,
              appearances: 0,
              goals: 0
            });
            
            console.log(`Found player (basic): ${playerName}`);
          }
        });
      }

      // Method 3: Look for specific Soccerway HTML patterns based on the content you shared
      if (players.length === 0) {
        console.log('Trying specific Soccerway patterns...');
        
        // Look for player containers with specific patterns
        $('*').filter(function() {
          const text = $(this).text();
          return text.includes('years old') && !!text.match(/\d+\s+\d+/); // Has age and stats
        }).each((_: any, element: any) => {
          const $element = $(element);
          const text = $element.text();
          
          // Extract player name (often the first meaningful text)
          const playerLinks = $element.find('a[href*="/players/"]');
          
          playerLinks.each((_: any, link: any) => {
            const $link = $(link);
            const playerName = $link.text().trim();
            
            if (playerName && playerName.length > 2) {
              const ageMatch = text.match(/(\d+)\s*years?\s*old/i);
              const age = ageMatch ? parseInt(ageMatch[1]) : null;
              
              // Extract stats
              const numbers = text.match(/\b\d+\b/g) || [];
              let appearances = 0;
              let goals = 0;
              
              if (numbers.length >= 2) {
                appearances = parseInt(numbers[numbers.length - 2]) || 0;
                goals = parseInt(numbers[numbers.length - 1]) || 0;
              }
              
              players.push({
                name: playerName,
                position: 'Unknown',
                age,
                appearances,
                goals
              });
              
              console.log(`Found player (pattern): ${playerName}`);
            }
          });
        });
      }

      // Remove duplicates
      const uniquePlayers = players.filter((player, index, self) => 
        index === self.findIndex(p => p.name === player.name)
      );

      res.json({
        success: true,
        url,
        playersFound: uniquePlayers.length,
        players: uniquePlayers
      });

    } catch (error) {
      console.error("Error importing squad from URL:", error);
      res.status(500).json({ 
        message: "Failed to import squad from URL",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Bulk import players endpoint
  app.post("/api/squad/bulk-import", async (req, res) => {
    try {
      const { teamId, players } = req.body;
      
      if (!teamId || !players || !Array.isArray(players)) {
        return res.status(400).json({ message: "teamId and players array are required" });
      }

      const importedPlayers = [];
      
      console.log(`Starting import of ${players.length} players to team ${teamId}`);
      
      for (let i = 0; i < players.length; i++) {
        const playerData = players[i];
        console.log(`Processing player ${i + 1}/${players.length}: ${playerData.name}`);
        
        if (!playerData.name) {
          console.log(`Skipping player ${i + 1} - no name`);
          continue;
        }
        
        const firstName = playerData.name.split(' ')[0] || playerData.name;
        const lastName = playerData.name.split(' ').slice(1).join(' ') || '';
        
        // Check if player is already in the squad/team
        console.log(`Checking if ${firstName} ${lastName} is already in team ${teamId}`);
        const teamUsers = await storage.getTeamUsers(teamId);
        const existingTeamMember = teamUsers.find(tu => 
          tu.user.firstName?.toLowerCase() === firstName.toLowerCase() && 
          tu.user.lastName?.toLowerCase() === lastName.toLowerCase()
        );
        
        if (existingTeamMember) {
          console.log(`Player ${firstName} ${lastName} already in squad - skipping`);
          continue; // Skip this player as they're already in the team
        }
        
        console.log(`Player ${firstName} ${lastName} not in squad - proceeding with import`);
        
        // Player not in squad, now check if user exists globally
        const allUsers = await storage.getUsers();
        const existingUser = allUsers.find(u => 
          u.firstName?.toLowerCase() === firstName.toLowerCase() && 
          u.lastName?.toLowerCase() === lastName.toLowerCase()
        );
        
        let user;
        try {
          if (existingUser) {
            console.log(`Found existing user: ${existingUser.firstName} ${existingUser.lastName} (${existingUser.id}) - reusing for squad`);
            // Update age if provided and not already set
            if (playerData.age && !existingUser.age) {
              user = await storage.updateUser(existingUser.id, { age: playerData.age });
            } else {
              user = existingUser;
            }
          } else {
            // Create new user
            const userData = {
              firstName,
              lastName,
              shirtName: playerData.name.split(' ').slice(-1)[0] || playerData.name,
              email: '',
              phone: '',
              role: 'Player' as const,
              status: 'Active' as const,
              age: playerData.age
            };
            
            console.log(`Creating new user: ${firstName} ${lastName}`);
            user = await storage.createUser(userData);
          }
        } catch (error) {
          console.error(`Error checking/creating user for ${firstName} ${lastName}:`, error);
          continue;
        }
        
        // Add to team with position (we already know they're not in the team)
        if (teamId && playerData.position) {
          try {
            // Get team info to find the club
            const team = await storage.getTeam(teamId);
            
            const teamAssignment = {
              userId: user.id,
              teamId,
              jerseyNumber: playerData.jerseyNumber || null,
              position: playerData.position,
              starPlayer: false,
              fitnessStatus: 'Fit' as const
            };
            
            console.log(`Adding user ${user.id} to team ${teamId} with position ${playerData.position}`);
            await storage.addUserToTeam(user.id, teamId, teamAssignment);
            console.log(`Successfully added user ${user.id} to team ${teamId}`);
            
            // Also add to club if team has a club
            if (team?.clubId) {
              try {
                const clubAssignment = {
                  status: 'Active' as const,
                  joinedAt: new Date()
                };
                await storage.addUserToClub(user.id, team.clubId, clubAssignment);
                console.log(`Successfully added user ${user.id} to club ${team.clubId}`);
              } catch (clubError) {
                console.error(`Error adding user ${user.id} to club ${team.clubId}:`, clubError);
              }
            } else {
              console.log(`Team ${teamId} has no associated club - skipping club assignment`);
            }
          } catch (error) {
            console.error(`Error adding user ${user.id} to team ${teamId}:`, error);
          }
        } else {
          console.log(`Skipping team assignment for user ${user.id} - teamId: ${teamId}, position: ${playerData.position}`);
        }
        
        importedPlayers.push({ ...user, position: playerData.position });
      }

      res.json({
        success: true,
        imported: importedPlayers.length,
        players: importedPlayers
      });

    } catch (error) {
      console.error("Error bulk importing players:", error);
      res.status(500).json({ 
        message: "Failed to bulk import players",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const { teamId, jerseyNumber, position, starPlayer, fitnessStatus, clubId, ...userData } = req.body;
      
      // Set shirt_name to surname if not provided
      if (!userData.shirtName && userData.lastName) {
        userData.shirtName = userData.lastName;
      }
      
      // Create user first with personal information
      const validatedUserData = insertUserSchema.parse(userData);
      const user = await storage.createUser(validatedUserData);
      
      // Add to club if clubId is provided
      if (clubId) {
        const clubAssignment = {
          status: 'Active',
          keyUser: false
        };
        await storage.addUserToClub(user.id, clubId, clubAssignment);
      }
      
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

  // Get file modification times for screenshots page
  app.get("/api/file-modifications", async (req, res) => {
    try {
      const fileMap: Record<string, string> = {
        // Pages
        "Home": "client/src/pages/home.tsx",
        "Dashboard": "client/src/pages/dashboard.tsx",
        "Club Management": "client/src/pages/club-management.tsx",
        "Fixtures": "client/src/pages/fixtures.tsx",
        "Squad": "client/src/pages/squad.tsx",
        "Statistics": "client/src/pages/statistics.tsx",
        "Videos": "client/src/pages/videos.tsx",
        "Teams": "client/src/pages/teams.tsx",
        "Clubs": "client/src/pages/clubs.tsx",
        "Users": "client/src/pages/users.tsx",
        "DevOps Users": "client/src/pages/devops-users.tsx",
        "Settings": "client/src/pages/settings.tsx",
        "Fixture Details": "client/src/pages/fixture-details.tsx",
        "Player Details": "client/src/pages/player-details.tsx",
        "User Details": "client/src/pages/user-details.tsx",
        "Analysis": "client/src/pages/analysis.tsx",
        
        // Modals/Dialogs
        "Player Create Dialog": "client/src/components/dialogs/player-create-dialog.tsx",
        "Player Edit Dialog": "client/src/components/dialogs/player-edit-dialog.tsx",
        "Player Details Modal": "client/src/components/dialogs/player-details-modal.tsx",
        "Fixture Create Dialog": "client/src/components/dialogs/fixture-create-dialog.tsx",
        "Fixture Edit Dialog": "client/src/components/dialogs/fixture-edit-dialog.tsx",
        "Fixture Settings Dialog": "client/src/components/dialogs/fixture-settings-dialog.tsx",
        "User Create Dialog": "client/src/components/dialogs/user-create-dialog.tsx",
        
        // Tab components (track the parent page file for tab modifications)
        "Player Details > Details Tab": "client/src/pages/player-details.tsx",
        "Player Details > Teams Tab": "client/src/pages/player-details.tsx",
        "Player Details > Parents Tab": "client/src/pages/player-details.tsx",
        "Fixture Details > Details Tab": "client/src/pages/fixture-details.tsx",
        "Fixture Details > Upload Video Tab": "client/src/pages/fixture-details.tsx",
        "Fixture Details > Lineups Tab": "client/src/pages/fixture-details.tsx",
        "Fixture Details > Analysis Tab": "client/src/pages/fixture-details.tsx",
        "Analysis > Game Details Tab": "client/src/pages/analysis.tsx",
        "Analysis > Line-Ups Tab": "client/src/pages/analysis.tsx",
        "Analysis > Videos Tab": "client/src/pages/analysis.tsx",
        "Analysis > Upload Data Tab": "client/src/pages/analysis.tsx",
        "Analysis > Statistics Tab": "client/src/pages/analysis.tsx",
        "Analysis > Spider Charts Tab": "client/src/pages/analysis.tsx",
        "Analysis > AI Analysis Tab": "client/src/pages/analysis.tsx",
        "Fixture Analysis > Fixture Details Tab": "client/src/pages/fixture-details.tsx",
        "Fixture Analysis > Statistics Tab": "client/src/pages/fixture-details.tsx",
        "Fixture Analysis > Spider Charts Tab": "client/src/pages/fixture-details.tsx",
        "Fixture Analysis > Heat Maps Tab": "client/src/pages/fixture-details.tsx",
        "Fixture Analysis > Position Maps Tab": "client/src/pages/fixture-details.tsx",
        "Fixture Analysis > AI Analysis Tab": "client/src/pages/fixture-details.tsx",
        "Fixture Analysis > Videos Tab": "client/src/pages/fixture-details.tsx",
        "Fixture Analysis > Upload Data Tab": "client/src/pages/fixture-details.tsx",
      };

      // Get modification times for all files
      const results: Record<string, number> = {};
      
      for (const [name, filePath] of Object.entries(fileMap)) {
        try {
          const stats = await stat(filePath);
          results[name] = stats.mtime.getTime();
        } catch (error) {
          // File doesn't exist or can't be accessed
          results[name] = 0;
        }
      }

      res.json(results);
    } catch (error) {
      console.error("Error fetching file modifications:", error);
      res.status(500).json({ error: "Failed to fetch file modifications" });
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
      
      const logoPath = `/assets/uploads/${Date.now()}-${req.file.originalname}`;
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
      const playerCount = teamPlayers.length;
      
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
        totalPlayers += teamPlayers.length;
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

  // Fixtures import from URL
  app.post("/api/fixtures/import-from-url", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      console.log(`Fetching fixtures from: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      const fixtures = parseFlashscoreFixtures(html);
      
      console.log(`Found ${fixtures.length} fixtures`);
      
      res.json({
        success: true,
        url,
        fixtures
      });

    } catch (error) {
      console.error("Error fetching fixtures from URL:", error);
      res.status(500).json({ 
        error: "Failed to fetch fixtures", 
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Bulk import fixtures
  app.post("/api/fixtures/bulk-import", async (req, res) => {
    try {
      const { fixtures, teamId } = req.body;
      
      if (!fixtures || !Array.isArray(fixtures)) {
        return res.status(400).json({ error: "Fixtures array is required" });
      }
      
      if (!teamId) {
        return res.status(400).json({ error: "Team ID is required" });
      }
      
      console.log(`Starting import of ${fixtures.length} fixtures for team ${teamId}`);
      
      const importedFixtures = [];
      
      for (let i = 0; i < fixtures.length; i++) {
        const fixtureData = fixtures[i];
        console.log(`Processing fixture ${i + 1}/${fixtures.length}: ${fixtureData.homeTeam} vs ${fixtureData.awayTeam}`);
        
        try {
          // Check if fixture already exists (based on date and teams)
          const existingFixtures = await storage.getFixtures(teamId);
          const duplicate = existingFixtures.find(f => {
            const fixtureDate = new Date(fixtureData.date).toDateString();
            const existingDate = new Date(f.date).toDateString();
            return (
              existingDate === fixtureDate &&
              ((f.homeTeam === fixtureData.homeTeam && f.awayTeam === fixtureData.awayTeam) ||
               (f.homeTeam === fixtureData.awayTeam && f.awayTeam === fixtureData.homeTeam))
            );
          });
          
          if (duplicate) {
            console.log(`Fixture already exists: ${fixtureData.homeTeam} vs ${fixtureData.awayTeam} on ${fixtureData.date}`);
            continue;
          }
          
          // Create or get opposition team
          let oppositionTeam;
          const oppositionName = fixtureData.homeTeam === fixtureData.userTeam ? fixtureData.awayTeam : fixtureData.homeTeam;
          
          const existingOppositionTeams = await storage.getOppositionTeams();
          oppositionTeam = existingOppositionTeams.find(t => 
            t.name.toLowerCase().trim() === oppositionName.toLowerCase().trim()
          );
          
          if (!oppositionTeam) {
            console.log(`Creating new opposition team: ${oppositionName}`);
            oppositionTeam = await storage.createOppositionTeam({
              name: oppositionName,
              shortName: oppositionName.length > 10 ? oppositionName.substring(0, 10) : oppositionName,
              logoPath: null
            });
          }
          
          // Create the fixture
          const newFixture = await storage.createFixture({
            teamId,
            oppositionTeamId: oppositionTeam.id,
            date: new Date(fixtureData.date),
            kickoffTime: fixtureData.time || "15:00",
            venue: fixtureData.isHome ? "Home" : "Away",
            homeTeam: fixtureData.homeTeam,
            awayTeam: fixtureData.awayTeam,
            homeScore: null,
            awayScore: null,
            status: "Scheduled",
            matchType: "League",
            competitionId: null,
            season: new Date(fixtureData.date).getFullYear().toString()
          });
          
          console.log(`Successfully imported fixture: ${fixtureData.homeTeam} vs ${fixtureData.awayTeam}`);
          importedFixtures.push(newFixture);
          
        } catch (error) {
          console.error(`Error importing fixture ${fixtureData.homeTeam} vs ${fixtureData.awayTeam}:`, error);
          continue;
        }
      }
      
      res.json({
        success: true,
        imported: importedFixtures.length,
        fixtures: importedFixtures
      });

    } catch (error) {
      console.error("Error bulk importing fixtures:", error);
      res.status(500).json({ 
        message: "Failed to bulk import fixtures",
        error: error instanceof Error ? error.message : "Unknown error"
      });
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

  // Club logo upload endpoint - uses object storage for production reliability
  app.post('/api/clubs/logo', logoUpload.single('logo'), async (req, res) => {
    try {
      const clubId = req.body.clubId;
      const file = req.file;

      if (!clubId || !file) {
        return res.status(400).json({ error: 'Club ID and logo file are required' });
      }

      // Use object storage for production-ready logo storage
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getLogoUploadURL();
      
      // Upload directly to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file.buffer,
        headers: {
          'Content-Type': file.mimetype,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Object storage upload failed: ${uploadResponse.status}`);
      }

      // Get the normalized path for serving
      const logoPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      await storage.updateClub(clubId, { logoPath });

      res.json({ 
        success: true, 
        logoPath,
        message: 'Club logo uploaded to cloud storage successfully'
      });

    } catch (error) {
      console.error('Club logo upload error:', error);
      res.status(500).json({ error: 'Failed to upload club logo' });
    }
  });

  app.post('/api/opposition-teams/logo', logoUpload.single('logo'), async (req, res) => {
    try {
      const teamId = req.body.teamId;
      const file = req.file;

      if (!teamId || !file) {
        return res.status(400).json({ error: 'Team ID and logo file are required' });
      }

      // Use object storage for production-ready logo storage
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getLogoUploadURL();
      
      // Upload directly to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file.buffer,
        headers: {
          'Content-Type': file.mimetype,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Object storage upload failed: ${uploadResponse.status}`);
      }

      // Get the normalized path for serving
      const logoPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      await storage.updateOppositionTeam(teamId, { logoPath });

      res.json({ 
        success: true, 
        logoPath,
        message: 'Opposition team logo uploaded to cloud storage successfully'
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
        if (team.logoPath.startsWith('/uploads/') || team.logoPath.startsWith('/assets/uploads/')) {
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

      // Create team-logos directory if it doesn't exist (this works in production)
      const logoDir = path.join(process.cwd(), 'client', 'public', 'assets', 'team-logos');
      await fs.mkdir(logoDir, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const ext = path.extname(file.originalname) || '.png';
      const filename = `${clubId}-logo-${timestamp}${ext}`;
      const filepath = path.join(logoDir, filename);

      // Save the file
      await fs.writeFile(filepath, file.buffer);

      // Update the club with the logo path (this path works in production)
      const logoPath = `/assets/team-logos/${filename}`;
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
        if (club.logoPath.startsWith('/uploads/') || club.logoPath.startsWith('/assets/uploads/')) {
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

  // =====================================
  // SYSTEM TEAMS API (NEW - Global teams with object storage)
  // =====================================
  
  // Get all system teams
  app.get('/api/system-teams', async (req, res) => {
    try {
      const teams = await storage.getSystemTeams();
      res.json(teams);
    } catch (error) {
      console.error('Get system teams error:', error);
      res.status(500).json({ error: 'Failed to fetch system teams' });
    }
  });

  // Search system teams by name
  app.get('/api/system-teams/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }
      const teams = await storage.searchSystemTeams(query);
      res.json(teams);
    } catch (error) {
      console.error('Search system teams error:', error);
      res.status(500).json({ error: 'Failed to search system teams' });
    }
  });

  // Get single system team
  app.get('/api/system-teams/:id', async (req, res) => {
    try {
      const team = await storage.getSystemTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ error: 'System team not found' });
      }
      res.json(team);
    } catch (error) {
      console.error('Get system team error:', error);
      res.status(500).json({ error: 'Failed to fetch system team' });
    }
  });

  // Create new system team
  app.post('/api/system-teams', async (req, res) => {
    try {
      const validated = insertSystemTeamSchema.parse(req.body);
      const team = await storage.createSystemTeam(validated);
      res.status(201).json(team);
    } catch (error) {
      console.error('Create system team error:', error);
      res.status(500).json({ error: 'Failed to create system team' });
    }
  });

  // Update system team
  app.put('/api/system-teams/:id', async (req, res) => {
    try {
      const validated = insertSystemTeamSchema.partial().parse(req.body);
      const team = await storage.updateSystemTeam(req.params.id, validated);
      res.json(team);
    } catch (error) {
      console.error('Update system team error:', error);
      res.status(500).json({ error: 'Failed to update system team' });
    }
  });

  // Delete system team
  app.delete('/api/system-teams/:id', async (req, res) => {
    try {
      await storage.deleteSystemTeam(req.params.id);
      res.json({ success: true, message: 'System team deleted successfully' });
    } catch (error) {
      console.error('Delete system team error:', error);
      res.status(500).json({ error: 'Failed to delete system team' });
    }
  });

  // Upload logo for system team (uses object storage)
  app.post('/api/system-teams/:id/logo', logoUpload.single('logo'), async (req, res) => {
    try {
      const teamId = req.params.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'Logo file is required' });
      }

      // Verify team exists
      const team = await storage.getSystemTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: 'System team not found' });
      }

      // Use object storage for system teams (production-ready cloud storage)
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getLogoUploadURL();
      
      // Upload directly to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file.buffer,
        headers: {
          'Content-Type': file.mimetype,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Object storage upload failed: ${uploadResponse.status}`);
      }

      // Normalize the uploaded URL to get the entity path
      const finalPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      // Update the system team with the object storage URL
      const updatedTeam = await storage.updateSystemTeam(teamId, { logoUrl: finalPath });

      res.json({ 
        success: true, 
        logoUrl: finalPath,
        team: updatedTeam,
        message: 'System team logo uploaded successfully'
      });

    } catch (error) {
      console.error('System team logo upload error:', error);
      res.status(500).json({ error: 'Failed to upload system team logo' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
