export interface Requirement {
  id: string;
  description: string;
}

export interface FunctionalRequirement {
  id: string;
  title: string;
  description: string;
}

export interface ChangeLogEntry {
  id: string;
  date: string;
  type: 'added' | 'removed' | 'changed' | 'fixed';
  area: string;
  description: string;
}

export interface DataModelField {
  name: string;
  type: string;
  mandatory: boolean;
  defaultValue?: string;
  listOfValues?: string[];
  description?: string;
}

export interface DataModel {
  id: string;
  name: string;
  description: string;
  fields: DataModelField[];
}

export interface PageRequirements {
  id: string;
  title: string;
  route: string;
  overview: string;
  parentId?: string;
  section: 'home' | 'team' | 'club' | 'devops';
  functionalRequirements: FunctionalRequirement[];
  acceptanceCriteria: Requirement[];
}

export const changeLog: ChangeLogEntry[] = [
  {
    id: "CL-001",
    date: "2025-11-26",
    type: "removed",
    area: "Teams",
    description: "Removed coach, assistant coach, and season fields from the Teams model as they are no longer needed.",
  },
  {
    id: "CL-002",
    date: "2025-11-26",
    type: "added",
    area: "DevOps",
    description: "Added Requirements page with hierarchical page structure and slide-out detail panel.",
  },
  {
    id: "CL-003",
    date: "2025-11-26",
    type: "added",
    area: "All Pages",
    description: "Added info icon (ℹ️) in header bar to display page requirements dialog.",
  },
  {
    id: "CL-004",
    date: "2025-11-12",
    type: "changed",
    area: "Fixtures",
    description: "Updated fixtures table to use competitionId foreign key instead of storing competition name as text.",
  },
  {
    id: "CL-005",
    date: "2025-11-12",
    type: "changed",
    area: "Logos",
    description: "Migrated all logo uploads from filesystem to cloud object storage for production compatibility.",
  },
];

export const dataModels: DataModel[] = [
  {
    id: "fixture",
    name: "Fixture",
    description: "Represents a scheduled or completed match between the team and an opponent.",
    fields: [
      { name: "id", type: "UUID", mandatory: true, defaultValue: "Auto-generated", description: "Unique identifier" },
      { name: "teamId", type: "UUID (FK)", mandatory: true, description: "Reference to the team playing" },
      { name: "opponent", type: "Text", mandatory: true, description: "Name of the opposing team" },
      { name: "oppositionTeamId", type: "UUID (FK)", mandatory: false, description: "Reference to opposition team record" },
      { name: "date", type: "Timestamp", mandatory: true, description: "Date and time of the match" },
      { name: "venue", type: "Text", mandatory: true, description: "Location where match is played" },
      { name: "type", type: "Varchar(20)", mandatory: true, listOfValues: ["HOME", "AWAY", "NEUTRAL"], description: "Match venue type" },
      { name: "status", type: "Varchar(20)", mandatory: true, defaultValue: "SCHEDULED", listOfValues: ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_CONTEST"], description: "Current match status" },
      { name: "homeScore", type: "Integer", mandatory: false, description: "Goals scored by home team" },
      { name: "awayScore", type: "Integer", mandatory: false, description: "Goals scored by away team" },
      { name: "competitionId", type: "UUID (FK)", mandatory: false, description: "Reference to competition" },
      { name: "notes", type: "Text", mandatory: false, description: "Additional match notes" },
      { name: "report", type: "Text", mandatory: false, description: "Match report text" },
      { name: "attendance", type: "Integer", mandatory: false, description: "Number of attendees" },
      { name: "hasVideo", type: "Boolean", mandatory: false, defaultValue: "false", description: "Whether match has video" },
      { name: "videoLinks", type: "JSONB", mandatory: false, description: "Array of video link objects" },
      { name: "createdAt", type: "Timestamp", mandatory: false, defaultValue: "Now", description: "Record creation time" },
      { name: "updatedAt", type: "Timestamp", mandatory: false, defaultValue: "Now", description: "Last update time" },
    ],
  },
  {
    id: "team",
    name: "Team",
    description: "Represents a team within a club organization.",
    fields: [
      { name: "id", type: "UUID", mandatory: true, defaultValue: "Auto-generated", description: "Unique identifier" },
      { name: "clubId", type: "UUID (FK)", mandatory: true, description: "Reference to parent club" },
      { name: "name", type: "Text", mandatory: true, description: "Full team name" },
      { name: "shortName", type: "Varchar(10)", mandatory: true, description: "Abbreviated team name" },
      { name: "status", type: "Varchar(20)", mandatory: true, defaultValue: "ACTIVE", listOfValues: ["ACTIVE", "INACTIVE", "ARCHIVED"], description: "Team status" },
      { name: "ageGroup", type: "Text", mandatory: false, description: "Age category (e.g., U18, College)" },
      { name: "gender", type: "Varchar(20)", mandatory: false, listOfValues: ["Men", "Women", "Mixed"], description: "Team gender category" },
      { name: "seasonStartMonth", type: "Varchar(20)", mandatory: false, defaultValue: "inherit", description: "When season starts" },
      { name: "colors", type: "JSONB", mandatory: false, description: "Primary and secondary colors" },
      { name: "createdAt", type: "Timestamp", mandatory: false, defaultValue: "Now", description: "Record creation time" },
      { name: "updatedAt", type: "Timestamp", mandatory: false, defaultValue: "Now", description: "Last update time" },
    ],
  },
  {
    id: "club",
    name: "Club",
    description: "Represents a sports club organization that contains multiple teams.",
    fields: [
      { name: "id", type: "UUID", mandatory: true, defaultValue: "Auto-generated", description: "Unique identifier" },
      { name: "name", type: "Text", mandatory: true, description: "Full club name" },
      { name: "shortName", type: "Text", mandatory: true, defaultValue: "PSC", description: "Abbreviated club name" },
      { name: "owner", type: "Text", mandatory: true, description: "Club owner name" },
      { name: "logoPath", type: "Text", mandatory: false, description: "Path to club logo" },
      { name: "address", type: "Text", mandatory: false, description: "Street address" },
      { name: "city", type: "Text", mandatory: false, description: "City" },
      { name: "state", type: "Text", mandatory: false, description: "State/Province" },
      { name: "country", type: "Text", mandatory: false, description: "Country" },
      { name: "phone", type: "Text", mandatory: false, description: "Contact phone" },
      { name: "email", type: "Text", mandatory: false, description: "Contact email" },
      { name: "website", type: "Text", mandatory: false, description: "Website URL" },
      { name: "colors", type: "JSONB", mandatory: false, description: "Primary and secondary colors" },
      { name: "timezone", type: "Text", mandatory: false, defaultValue: "UTC", description: "Club timezone" },
      { name: "seasonStartMonth", type: "Varchar(20)", mandatory: false, defaultValue: "August", description: "Default season start" },
      { name: "createdAt", type: "Timestamp", mandatory: false, defaultValue: "Now", description: "Record creation time" },
      { name: "updatedAt", type: "Timestamp", mandatory: false, defaultValue: "Now", description: "Last update time" },
    ],
  },
  {
    id: "competition",
    name: "Competition",
    description: "Represents a league, tournament, or cup competition.",
    fields: [
      { name: "id", type: "UUID", mandatory: true, defaultValue: "Auto-generated", description: "Unique identifier" },
      { name: "name", type: "Text", mandatory: true, description: "Competition name (unique)" },
      { name: "shortName", type: "Varchar(10)", mandatory: false, description: "Abbreviated name" },
      { name: "logoPath", type: "Text", mandatory: false, description: "Path to competition logo" },
      { name: "seasonStartMonth", type: "Varchar(20)", mandatory: false, defaultValue: "inherit", description: "Season start month" },
      { name: "createdAt", type: "Timestamp", mandatory: false, defaultValue: "Now", description: "Record creation time" },
      { name: "updatedAt", type: "Timestamp", mandatory: false, defaultValue: "Now", description: "Last update time" },
    ],
  },
  {
    id: "user",
    name: "User (Player/Coach/Admin)",
    description: "Represents a user in the system who can be a player, coach, admin, or parent.",
    fields: [
      { name: "id", type: "UUID", mandatory: true, defaultValue: "Auto-generated", description: "Unique identifier" },
      { name: "username", type: "Text", mandatory: false, description: "Login username (unique)" },
      { name: "password", type: "Text", mandatory: false, description: "Hashed password" },
      { name: "firstName", type: "Text", mandatory: true, description: "First name" },
      { name: "lastName", type: "Text", mandatory: true, description: "Last name" },
      { name: "shirtName", type: "Text", mandatory: false, description: "Name on jersey" },
      { name: "dateOfBirth", type: "Timestamp", mandatory: false, description: "Date of birth" },
      { name: "gender", type: "Varchar(10)", mandatory: false, listOfValues: ["Male", "Female", "Other"], description: "Gender" },
      { name: "avatarPath", type: "Text", mandatory: false, description: "Profile photo path" },
      { name: "headshotPath", type: "Text", mandatory: false, description: "Headshot photo path" },
      { name: "height", type: "Text", mandatory: false, description: "Height (e.g., 5-7)" },
      { name: "hometown", type: "Text", mandatory: false, description: "Hometown" },
      { name: "classYear", type: "Varchar(20)", mandatory: false, listOfValues: ["Freshman", "Sophomore", "Junior", "Senior"], description: "Academic year" },
      { name: "email", type: "Text", mandatory: false, description: "Email address" },
      { name: "phone", type: "Text", mandatory: false, description: "Phone number" },
      { name: "role", type: "Varchar(20)", mandatory: true, defaultValue: "Player", listOfValues: ["Player", "Coach", "Admin", "Parent"], description: "User role" },
      { name: "status", type: "Varchar(20)", mandatory: false, defaultValue: "Draft", listOfValues: ["Draft", "Active", "Suspended", "Retired"], description: "Account status" },
      { name: "createdAt", type: "Timestamp", mandatory: false, defaultValue: "Now", description: "Record creation time" },
      { name: "updatedAt", type: "Timestamp", mandatory: false, defaultValue: "Now", description: "Last update time" },
    ],
  },
  {
    id: "oppositionTeam",
    name: "Opposition Team",
    description: "Represents an opposing team that can be played against in fixtures.",
    fields: [
      { name: "id", type: "UUID", mandatory: true, defaultValue: "Auto-generated", description: "Unique identifier" },
      { name: "name", type: "Text", mandatory: true, description: "Team name (unique)" },
      { name: "shortName", type: "Varchar(10)", mandatory: false, description: "Abbreviated name" },
      { name: "logoPath", type: "Text", mandatory: false, description: "Path to team logo" },
      { name: "websiteUrl", type: "Text", mandatory: false, description: "Team website" },
      { name: "colors", type: "JSONB", mandatory: false, description: "Primary and secondary colors" },
      { name: "createdAt", type: "Timestamp", mandatory: false, defaultValue: "Now", description: "Record creation time" },
      { name: "updatedAt", type: "Timestamp", mandatory: false, defaultValue: "Now", description: "Last update time" },
    ],
  },
  {
    id: "userTeam",
    name: "User Team Assignment",
    description: "Links users to teams with team-specific information like jersey number and position.",
    fields: [
      { name: "id", type: "UUID", mandatory: true, defaultValue: "Auto-generated", description: "Unique identifier" },
      { name: "userId", type: "UUID (FK)", mandatory: true, description: "Reference to user" },
      { name: "teamId", type: "UUID (FK)", mandatory: true, description: "Reference to team" },
      { name: "jerseyNumber", type: "Integer", mandatory: false, description: "Player jersey number" },
      { name: "position", type: "Varchar(20)", mandatory: true, listOfValues: ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "ST", "CF"], description: "Playing position" },
      { name: "starPlayer", type: "Boolean", mandatory: false, defaultValue: "false", description: "Key player flag" },
      { name: "fitnessStatus", type: "Varchar(20)", mandatory: false, defaultValue: "Fit", listOfValues: ["Fit", "Injured", "Retired"], description: "Current fitness" },
      { name: "joinedAt", type: "Timestamp", mandatory: false, defaultValue: "Now", description: "When joined team" },
      { name: "leftAt", type: "Timestamp", mandatory: false, description: "When left team" },
      { name: "createdAt", type: "Timestamp", mandatory: false, defaultValue: "Now", description: "Record creation time" },
      { name: "updatedAt", type: "Timestamp", mandatory: false, defaultValue: "Now", description: "Last update time" },
    ],
  },
];

export const requirementsRegistry: PageRequirements[] = [
  // LANDING/LOGIN (Pre-auth)
  {
    id: "landing",
    title: "Landing Page",
    route: "/",
    section: "home",
    overview: "Public landing page showcasing GameScope features and capabilities.",
    functionalRequirements: [
      { id: "LAND-FR-1", title: "Feature Showcase", description: "Display key features of GameScope including video analysis, team management, and statistics." },
      { id: "LAND-FR-2", title: "Call to Action", description: "Prominent login/signup buttons directing users to authentication." },
    ],
    acceptanceCriteria: [
      { id: "LAND-AC-1", description: "Landing page loads with feature highlights" },
      { id: "LAND-AC-2", description: "Login button navigates to login page" },
    ],
  },
  {
    id: "login",
    title: "Login",
    route: "/login",
    section: "home",
    overview: "User authentication page for accessing the application.",
    functionalRequirements: [
      { id: "LOG-FR-1", title: "Authentication", description: "Allow users to log in with credentials or SSO." },
      { id: "LOG-FR-2", title: "Error Handling", description: "Display clear error messages for failed login attempts." },
    ],
    acceptanceCriteria: [
      { id: "LOG-AC-1", description: "Valid credentials grant access to the application" },
      { id: "LOG-AC-2", description: "Invalid credentials show appropriate error message" },
    ],
  },
  // HOME SECTION
  {
    id: "home",
    title: "Home",
    route: "/home",
    section: "home",
    overview: "Team selection hub where users choose which team to manage before accessing team-specific features.",
    functionalRequirements: [
      { id: "HOME-FR-1", title: "Team Selection", description: "Display all available teams for the current club. Allow users to select a team to work with." },
      { id: "HOME-FR-2", title: "Club Branding", description: "Display current club logo and colors throughout the interface." },
    ],
    acceptanceCriteria: [
      { id: "HOME-AC-1", description: "All teams for the current club are displayed" },
      { id: "HOME-AC-2", description: "Selecting a team navigates to team dashboard" },
    ],
  },

  // TEAM SECTION
  {
    id: "dashboard",
    title: "Dashboard",
    route: "/dashboard",
    section: "team",
    overview: "Overview of team performance, upcoming fixtures, and key metrics at a glance.",
    functionalRequirements: [
      { id: "DASH-FR-1", title: "Quick Stats", description: "Display key team statistics including wins, losses, draws, and goal difference." },
      { id: "DASH-FR-2", title: "Upcoming Fixtures", description: "Show next 3-5 scheduled matches with opponent, date, and venue." },
      { id: "DASH-FR-3", title: "Recent Results", description: "Display last 5 match results with scores." },
      { id: "DASH-FR-4", title: "Squad Overview", description: "Show total players, availability status, and position breakdown." },
    ],
    acceptanceCriteria: [
      { id: "DASH-AC-1", description: "Dashboard loads with current team data" },
      { id: "DASH-AC-2", description: "Stats reflect actual team performance from fixtures" },
      { id: "DASH-AC-3", description: "Upcoming fixtures show correct dates and opponents" },
      { id: "DASH-AC-4", description: "Recent results display accurate scores" },
    ],
  },
  {
    id: "fixtures",
    title: "Fixtures",
    route: "/fixtures",
    section: "team",
    overview: "Manage team fixtures, schedules, and match planning with video upload capabilities.",
    functionalRequirements: [
      { id: "FIX-FR-1", title: "Season Tab", description: "View and manage all fixtures for the season. Filter by competition. Create, edit, and delete fixtures." },
      { id: "FIX-FR-2", title: "Planning Tab", description: "Calendar view of upcoming fixtures with month navigation." },
      { id: "FIX-FR-3", title: "Videos Tab", description: "Upload and manage match videos for fixtures. Support for multiple camera angles per fixture with labels." },
      { id: "FIX-FR-4", title: "Logos Tab", description: "Manage team logos with background removal. Individual theme controls per logo container." },
      { id: "FIX-FR-5", title: "Fixture Creation", description: "Single-screen fixture creation with inline opponent and competition management." },
      { id: "FIX-FR-6", title: "Competition Management", description: "Create and manage competitions on-the-fly during fixture creation." },
      { id: "FIX-FR-7", title: "Excel Import", description: "Import fixtures from Excel files with automatic field mapping." },
    ],
    acceptanceCriteria: [
      { id: "FIX-AC-1", description: "Fixtures can be created with opponent, date, venue, and competition" },
      { id: "FIX-AC-2", description: "Fixtures can be edited and scores updated" },
      { id: "FIX-AC-3", description: "Videos can be uploaded with labels and associated with fixtures" },
      { id: "FIX-AC-4", description: "Multiple camera angles supported per fixture" },
      { id: "FIX-AC-5", description: "Competitions can be created inline during fixture creation" },
      { id: "FIX-AC-6", description: "Excel import correctly maps columns to fixture fields" },
    ],
  },
  {
    id: "fixture-details",
    title: "View Fixture",
    route: "/fixtures/:id",
    parentId: "fixtures",
    section: "team",
    overview: "Detailed view of a single fixture with match information, lineup, and video management.",
    functionalRequirements: [
      { id: "FIXD-FR-1", title: "Match Header", description: "Display both team logos, names, and score (if completed)." },
      { id: "FIXD-FR-2", title: "Match Details", description: "Show date, time, venue, competition, and match status." },
      { id: "FIXD-FR-3", title: "Video Management", description: "Upload, view, and delete match videos for this fixture." },
      { id: "FIXD-FR-4", title: "Match Report", description: "View and edit match report text." },
      { id: "FIXD-FR-5", title: "Navigation", description: "Quick access to watch video and analysis pages." },
    ],
    acceptanceCriteria: [
      { id: "FIXD-AC-1", description: "All fixture details display correctly" },
      { id: "FIXD-AC-2", description: "Videos can be uploaded and managed" },
      { id: "FIXD-AC-3", description: "Match report can be edited and saved" },
      { id: "FIXD-AC-4", description: "Navigation to video pages works correctly" },
    ],
  },
  {
    id: "analysis",
    title: "Fixture Analysis",
    route: "/analysis/:fixtureId",
    parentId: "fixture-details",
    section: "team",
    overview: "Detailed tactical analysis of a specific fixture with formation and player statistics.",
    functionalRequirements: [
      { id: "ANL-FR-1", title: "Formation Display", description: "Visual representation of team formation during the match." },
      { id: "ANL-FR-2", title: "Player Statistics", description: "Individual player performance metrics for the match." },
      { id: "ANL-FR-3", title: "Tactical Insights", description: "Heat maps, passing networks, and tactical breakdowns." },
    ],
    acceptanceCriteria: [
      { id: "ANL-AC-1", description: "Formation displays correctly for both teams" },
      { id: "ANL-AC-2", description: "Player stats are accurate and complete" },
      { id: "ANL-AC-3", description: "Tactical visualizations render correctly" },
    ],
  },
  {
    id: "statistics",
    title: "Statistics",
    route: "/statistics",
    section: "team",
    overview: "Comprehensive team and player statistics across all fixtures.",
    functionalRequirements: [
      { id: "STAT-FR-1", title: "Team Overview", description: "Display overall team performance metrics (wins, losses, goals, clean sheets)." },
      { id: "STAT-FR-2", title: "Player Rankings", description: "Leaderboards for top scorers, assisters, and appearances." },
      { id: "STAT-FR-3", title: "Trend Analysis", description: "Performance trends over time with charts and graphs." },
      { id: "STAT-FR-4", title: "Competition Breakdown", description: "Statistics filtered by competition." },
    ],
    acceptanceCriteria: [
      { id: "STAT-AC-1", description: "Team statistics are accurate based on fixture data" },
      { id: "STAT-AC-2", description: "Player rankings reflect actual performance" },
      { id: "STAT-AC-3", description: "Charts render correctly with accurate data" },
    ],
  },
  {
    id: "squad",
    title: "Squad Management",
    route: "/squad",
    section: "team",
    overview: "Manage team roster, player information, and squad composition.",
    functionalRequirements: [
      { id: "SQD-FR-1", title: "Player List", description: "Display all players in the squad with photos, names, numbers, and positions." },
      { id: "SQD-FR-2", title: "Position Filtering", description: "Filter players by position (GK, DEF, MID, FWD)." },
      { id: "SQD-FR-3", title: "Player Details", description: "Click to view detailed player information." },
      { id: "SQD-FR-4", title: "Add/Edit Players", description: "Create new players or edit existing player details." },
      { id: "SQD-FR-5", title: "Excel/JSON Import", description: "Import player data from Excel or JSON files." },
    ],
    acceptanceCriteria: [
      { id: "SQD-AC-1", description: "All squad players display with correct information" },
      { id: "SQD-AC-2", description: "Position filter correctly groups players" },
      { id: "SQD-AC-3", description: "Player profiles are accessible and complete" },
      { id: "SQD-AC-4", description: "Excel import correctly populates player data" },
    ],
  },
  {
    id: "player-details",
    title: "View Squad Member",
    route: "/players/:id",
    parentId: "squad",
    section: "team",
    overview: "Detailed profile view for individual players with statistics and personal information.",
    functionalRequirements: [
      { id: "PLYD-FR-1", title: "Player Header", description: "Display player photo, name, number, and position." },
      { id: "PLYD-FR-2", title: "Personal Information", description: "Show height, weight, date of birth, nationality." },
      { id: "PLYD-FR-3", title: "Season Statistics", description: "Display appearances, goals, assists, minutes played." },
      { id: "PLYD-FR-4", title: "Edit Profile", description: "Ability to edit player details." },
    ],
    acceptanceCriteria: [
      { id: "PLYD-AC-1", description: "All player details display correctly" },
      { id: "PLYD-AC-2", description: "Statistics reflect actual performance data" },
      { id: "PLYD-AC-3", description: "Profile edits save successfully" },
    ],
  },
  {
    id: "videos",
    title: "Match Videos",
    route: "/videos",
    section: "team",
    overview: "Browse, filter, and access match video recordings organized by competition.",
    functionalRequirements: [
      { id: "VID-FR-1", title: "View Mode Selection", description: "Users can switch between Tile Mode and Watch Mode. Selected view mode persists in localStorage." },
      { id: "VID-FR-2", title: "Filtering", description: "Competition dropdown to filter fixtures by competition (or 'All Competitions'). Keyword search field to filter fixtures by opponent name (case-insensitive)." },
      { id: "VID-FR-3", title: "Sorting", description: "Toggle button to switch between earliest-first and latest-first display. Visual indicator (arrow up/down) shows current sort order." },
      { id: "VID-FR-4", title: "Video Preview Display", description: "Shows club logo on the left, score in center, opponent logo on the right. Play button overlay in center. Shows 'No video' indicator when video unavailable." },
      { id: "VID-FR-5", title: "Tile Mode Cards", description: "Grid layout (1-3 columns based on screen size). Grouped by competition with match count. Card footer shows date and Home/Away badge." },
      { id: "VID-FR-6", title: "Watch Mode", description: "Horizontal scrolling fixture selector. Larger video preview with match details. Match report and attendance display (when available)." },
    ],
    acceptanceCriteria: [
      { id: "VID-AC-1", description: "Selecting a competition filters fixtures to only that competition" },
      { id: "VID-AC-2", description: "Typing in search field immediately filters fixtures by opponent name" },
      { id: "VID-AC-3", description: "Both team logos display correctly (fallback to initials if no logo)" },
      { id: "VID-AC-4", description: "Score displays correctly based on home/away fixture type" },
      { id: "VID-AC-5", description: "Clicking any fixture card navigates to Watch Match Video page" },
      { id: "VID-AC-6", description: "View mode preference persists across page refreshes" },
    ],
  },
  {
    id: "watch-match-video",
    title: "Watch Match Video",
    route: "/watch-match-video",
    parentId: "videos",
    section: "team",
    overview: "Full match analysis page with video player, events, statistics, and reporting.",
    functionalRequirements: [
      { id: "WMV-FR-1", title: "Match Score Banner", description: "Displays both team logos, names, and final score. Shows match date and venue type." },
      { id: "WMV-FR-2", title: "Camera Selector", description: "Dropdown labeled 'Choose Camera:' in Video Player tab header. Lists all uploaded videos for the fixture by their label/name. Switching camera loads the selected video." },
      { id: "WMV-FR-3", title: "Video Player Tab", description: "Supports YouTube, Google Drive, direct video files, and FIFA Plus links. FIFA Plus videos show external link button (cannot embed). Native video controls for direct video files." },
      { id: "WMV-FR-4", title: "Match Events Tab", description: "Displays match events in tabular format. Linked to video timestamps when available." },
      { id: "WMV-FR-5", title: "Team Statistics Tab", description: "Comparison metrics between teams. Visual stat bars/comparisons." },
      { id: "WMV-FR-6", title: "Spider Charts Tab", description: "Multi-category radar charts comparing team performance. Categories: Attack, Defense, Possession, Technical." },
      { id: "WMV-FR-7", title: "Match Report Tab", description: "Displays written match report text. Shows attendance figures when available." },
    ],
    acceptanceCriteria: [
      { id: "WMV-AC-1", description: "Camera selector shows all uploaded video names for the fixture" },
      { id: "WMV-AC-2", description: "Changing camera selection loads the corresponding video" },
      { id: "WMV-AC-3", description: "YouTube videos embed and play correctly" },
      { id: "WMV-AC-4", description: "Google Drive videos embed correctly" },
      { id: "WMV-AC-5", description: "Direct video files play with native controls" },
      { id: "WMV-AC-6", description: "FIFA Plus links show 'Open in FIFA Plus' button" },
      { id: "WMV-AC-7", description: "Back button returns to Match Video listing page" },
      { id: "WMV-AC-8", description: "All five tabs display appropriate content when selected" },
    ],
  },
  {
    id: "match-analysis",
    title: "Video Analysis",
    route: "/match-analysis",
    section: "team",
    overview: "Advanced video analysis with event data synchronization and interactive playback.",
    functionalRequirements: [
      { id: "MA-FR-1", title: "Video Player", description: "Full video player with playback controls and timeline scrubbing." },
      { id: "MA-FR-2", title: "Event Data Upload", description: "Upload JSON event data files for each video. Display filename when uploaded." },
      { id: "MA-FR-3", title: "Event Synchronization", description: "Events sync with video playback. Current event highlighted based on video timestamp." },
      { id: "MA-FR-4", title: "Event List View", description: "Scrollable list of events with timestamp, type, and player information." },
      { id: "MA-FR-5", title: "Event Filtering", description: "Filter events by type (Pass, Shot, Tackle, etc.) and team." },
      { id: "MA-FR-6", title: "Click-to-Seek", description: "Clicking an event jumps video to that timestamp." },
    ],
    acceptanceCriteria: [
      { id: "MA-AC-1", description: "JSON event files can be uploaded and parsed" },
      { id: "MA-AC-2", description: "Uploaded filename displays in the UI" },
      { id: "MA-AC-3", description: "Events update as video plays (previous/current/next)" },
      { id: "MA-AC-4", description: "Clicking an event seeks video to correct timestamp" },
      { id: "MA-AC-5", description: "Event filters work correctly" },
    ],
  },
  {
    id: "player-profiles",
    title: "Player Profiles",
    route: "/player-profiles",
    section: "team",
    overview: "Comprehensive player profile cards with detailed statistics and performance data.",
    functionalRequirements: [
      { id: "PP-FR-1", title: "Profile Cards", description: "Display player cards with photo, name, position, and key stats." },
      { id: "PP-FR-2", title: "Stat Comparison", description: "Compare multiple players side by side." },
      { id: "PP-FR-3", title: "Performance Trends", description: "Charts showing player performance over time." },
    ],
    acceptanceCriteria: [
      { id: "PP-AC-1", description: "All player profiles display with complete information" },
      { id: "PP-AC-2", description: "Comparison view works correctly" },
    ],
  },

  // CLUB SECTION
  {
    id: "teams",
    title: "Teams",
    route: "/teams",
    section: "club",
    overview: "Manage multiple teams within the club organization.",
    functionalRequirements: [
      { id: "TM-FR-1", title: "Team List", description: "Display all teams in the club with name, age group, and gender." },
      { id: "TM-FR-2", title: "Add Team", description: "Create new teams with name, age group, gender, and coach assignment." },
      { id: "TM-FR-3", title: "Edit Team", description: "Modify team details and settings." },
    ],
    acceptanceCriteria: [
      { id: "TM-AC-1", description: "All club teams are displayed" },
      { id: "TM-AC-2", description: "New teams can be created" },
      { id: "TM-AC-3", description: "Team details can be edited" },
    ],
  },
  {
    id: "users",
    title: "Club Users",
    route: "/users",
    section: "club",
    overview: "Manage users who have access to the club's features and data.",
    functionalRequirements: [
      { id: "CU-FR-1", title: "User List", description: "Display all users with access to this club." },
      { id: "CU-FR-2", title: "Role Management", description: "Assign roles (Admin, Coach, Player) to users." },
      { id: "CU-FR-3", title: "Invite Users", description: "Send invitations to new users." },
    ],
    acceptanceCriteria: [
      { id: "CU-AC-1", description: "All club users are displayed with their roles" },
      { id: "CU-AC-2", description: "Roles can be changed" },
      { id: "CU-AC-3", description: "Invitations can be sent" },
    ],
  },
  {
    id: "club-management",
    title: "Club Management",
    route: "/club-management",
    section: "club",
    overview: "Manage club details, branding, and organizational settings.",
    functionalRequirements: [
      { id: "CM-FR-1", title: "Club Details", description: "Edit club name, short name, and description." },
      { id: "CM-FR-2", title: "Branding", description: "Upload club logo and set primary/secondary colors." },
      { id: "CM-FR-3", title: "Contact Information", description: "Manage club address and contact details." },
    ],
    acceptanceCriteria: [
      { id: "CM-AC-1", description: "Club details can be edited and saved" },
      { id: "CM-AC-2", description: "Logo uploads successfully" },
      { id: "CM-AC-3", description: "Colors apply to the UI theme" },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    route: "/settings",
    section: "club",
    overview: "Configure club-wide settings and preferences.",
    functionalRequirements: [
      { id: "SET-FR-1", title: "General Settings", description: "Configure timezone, date format, and language preferences." },
      { id: "SET-FR-2", title: "Notification Settings", description: "Manage email and push notification preferences." },
      { id: "SET-FR-3", title: "Data Management", description: "Export data, manage storage, and data retention policies." },
    ],
    acceptanceCriteria: [
      { id: "SET-AC-1", description: "Settings changes are saved and applied" },
      { id: "SET-AC-2", description: "Notification preferences work correctly" },
    ],
  },

  // DEVOPS SECTION
  {
    id: "devops-users",
    title: "All Users",
    route: "/devops-users",
    section: "devops",
    overview: "System-wide user management across all clubs and teams.",
    functionalRequirements: [
      { id: "DU-FR-1", title: "User Directory", description: "Display all users in the system with club affiliations." },
      { id: "DU-FR-2", title: "Search and Filter", description: "Search users by name, email, or filter by club/role." },
      { id: "DU-FR-3", title: "User Management", description: "Create, edit, and deactivate user accounts." },
    ],
    acceptanceCriteria: [
      { id: "DU-AC-1", description: "All system users are displayed" },
      { id: "DU-AC-2", description: "Search and filters work correctly" },
      { id: "DU-AC-3", description: "User accounts can be managed" },
    ],
  },
  {
    id: "clubs",
    title: "Clubs",
    route: "/clubs",
    section: "devops",
    overview: "Manage all clubs in the system from a DevOps perspective.",
    functionalRequirements: [
      { id: "CLB-FR-1", title: "Club List", description: "Display all clubs with logos, names, and team counts." },
      { id: "CLB-FR-2", title: "Add Club", description: "Create new clubs with all required details." },
      { id: "CLB-FR-3", title: "Club Status", description: "Activate, deactivate, or archive clubs." },
    ],
    acceptanceCriteria: [
      { id: "CLB-AC-1", description: "All clubs are displayed" },
      { id: "CLB-AC-2", description: "New clubs can be created" },
      { id: "CLB-AC-3", description: "Club status can be changed" },
    ],
  },
  {
    id: "requirements",
    title: "Requirements",
    route: "/requirements",
    section: "devops",
    overview: "View all page requirements and acceptance criteria organized by hierarchy.",
    functionalRequirements: [
      { id: "REQ-FR-1", title: "Hierarchical View", description: "Display pages in a tree structure showing parent-child relationships (e.g., TEAM > Fixtures > View Fixture)." },
      { id: "REQ-FR-2", title: "Section Grouping", description: "Group pages by section (Home, Team, Club, DevOps)." },
      { id: "REQ-FR-3", title: "Search/Filter", description: "Search by page name or requirement ID." },
      { id: "REQ-FR-4", title: "Expand/Collapse", description: "Accordion-style expansion to view requirements for each page." },
    ],
    acceptanceCriteria: [
      { id: "REQ-AC-1", description: "All pages are displayed in correct hierarchy" },
      { id: "REQ-AC-2", description: "Search filters pages and requirements correctly" },
      { id: "REQ-AC-3", description: "Requirements display with FR IDs and AC IDs" },
    ],
  },
];

export function getRequirementsByRoute(route: string): PageRequirements | null {
  const exactMatch = requirementsRegistry.find(p => p.route === route);
  if (exactMatch) return exactMatch;

  if (route.startsWith("/watch-match-video")) {
    return requirementsRegistry.find(p => p.id === "watch-match-video") || null;
  }
  if (route.startsWith("/fixtures/")) {
    return requirementsRegistry.find(p => p.id === "fixture-details") || null;
  }
  if (route.startsWith("/players/")) {
    return requirementsRegistry.find(p => p.id === "player-details") || null;
  }
  if (route.startsWith("/users/")) {
    return requirementsRegistry.find(p => p.id === "user-details") || null;
  }
  if (route.startsWith("/analysis/")) {
    return requirementsRegistry.find(p => p.id === "match-analysis") || null;
  }

  return requirementsRegistry.find(p => p.route === "/home") || null;
}

export function getRequirementsBySection(section: PageRequirements['section']): PageRequirements[] {
  return requirementsRegistry.filter(p => p.section === section);
}

export function getChildPages(parentId: string): PageRequirements[] {
  return requirementsRegistry.filter(p => p.parentId === parentId);
}

export function getRootPages(section: PageRequirements['section']): PageRequirements[] {
  return requirementsRegistry.filter(p => p.section === section && !p.parentId);
}

export interface PageWithChildren extends PageRequirements {
  children: PageWithChildren[];
}

function buildPageTree(page: PageRequirements): PageWithChildren {
  const children = getChildPages(page.id);
  return {
    ...page,
    children: children.map(child => buildPageTree(child)),
  };
}

export function buildHierarchy(section: PageRequirements['section']): PageWithChildren[] {
  const roots = getRootPages(section);
  return roots.map(root => buildPageTree(root));
}

export const sectionTitles: Record<PageRequirements['section'], string> = {
  home: 'Home',
  team: 'Team',
  club: 'Club',
  devops: 'DevOps',
};
