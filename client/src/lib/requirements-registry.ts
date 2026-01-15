export type RequirementStatus = 'New' | 'Ready' | 'Coded' | 'Tested' | 'Complete';

export interface Requirement {
  id: string;
  description: string;
  status?: RequirementStatus;
  parentFrId?: string;
}

export interface FunctionalRequirement {
  id: string;
  title: string;
  description: string;
  status?: RequirementStatus;
}

export interface ChangeLogEntry {
  id: string;
  date: string;
  type: 'added' | 'removed' | 'changed' | 'fixed' | 'bug' | 'enhancement' | 'question' | 'action_item';
  area: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
}

export interface TestCase {
  id: string;
  title: string;
  objective: string;
  steps: string[];
  expectedResult: string;
  actualResult: string;
  status: 'passed' | 'failed' | 'partial' | 'blocked';
  associatedBug?: string;
  date: string;
  tester: string;
  component?: string;
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

export interface TabRequirements {
  id: string;
  name: string;
  overview: string;
  functionalRequirements: FunctionalRequirement[];
  acceptanceCriteria: Requirement[];
}

export interface EpicRequirements {
  id: string;
  title: string;
  route: string;
  overview: string;
  parentId?: string;
  section: 'home' | 'team' | 'club' | 'devops' | 'global';
  displayOrder?: number;
  functionalRequirements: FunctionalRequirement[];
  acceptanceCriteria: Requirement[];
  tabs?: TabRequirements[];
}

// Backwards compatibility alias
export type PageRequirements = EpicRequirements;

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
  {
    id: "CL-006",
    date: "2025-12-01",
    type: "question",
    area: "Fixtures",
    description: "FIX-FR-9 Videos Tab: Need clarification from AI team on video processing workflow - what are the processing states (Pending → Processing → Ready/Failed), how does PlayerTRACK™ and PlayerEVENT™ integration work, and what progress indicators should the UI display?",
    priority: "high",
    status: "open",
  },
];

export const testCases: TestCase[] = [
  {
    id: "TC-001",
    title: "Create Club",
    objective: "Verify club creation workflow with all required fields",
    steps: [
      "Login to GameScope",
      "Navigate to dev environment",
      "Click on Clubs",
      "Click Add Club",
      "Enter club details: Club name: Newcastle, Short name: ufc, Owner name: [any], Primary color: Black, Secondary color: White, Phone number: [entered], Email: leam.wood@yahoo.com, Country: United Kingdom",
      "Upload Newcastle United logo",
      "Click Create Club"
    ],
    expectedResult: "Club created with all details saved and displayed correctly",
    actualResult: "Club created successfully. Name and country were correctly displayed and used for the filter.",
    status: "passed",
    date: "2025-11-11",
    tester: "Liam Wood",
    component: "Clubs"
  },
  {
    id: "TC-002",
    title: "Create Team",
    objective: "Create a team for Newcastle United club",
    steps: [
      "Navigate to Teams section",
      "Click Create Team",
      "Enter team details: Team name: Under 18, Short name: u18, Head coach: x, Assistant coach: y, Gender: Male, Age group: U18, Season: 25-26",
      "Click Create Team"
    ],
    expectedResult: "Team created and displayed in teams list",
    actualResult: "System displayed 'Team created successfully' message but team does not appear in the list. Attempted to create the same team again with identical information - received success message again without duplicate error, indicating the team is not being saved to the database.",
    status: "failed",
    associatedBug: "BUG-001",
    date: "2025-11-11",
    tester: "Liam Wood",
    component: "Teams"
  },
  {
    id: "TC-003",
    title: "Add User",
    objective: "Add a new user to the club with required fields",
    steps: [
      "Navigate to Club → Club Users",
      "Click Add User",
      "Enter user details: First name: Liam, Last name: Wood, Short name: Wood, Email: leam.wood@yahoo.com, Password: [any], Gender: [selected]",
      "Click Save"
    ],
    expectedResult: "User created with only first name, last name, email, and password required. Other fields should be optional.",
    actualResult: "Received 'Bad request exception' error. Testing revealed that 'short name' field is incorrectly required when it should be optional.",
    status: "failed",
    associatedBug: "BUG-002",
    date: "2025-11-11",
    tester: "Liam Wood",
    component: "User Management"
  },
  {
    id: "TC-004",
    title: "Delete User",
    objective: "Delete a user (Liam Wood) from the club",
    steps: [
      "Navigate to Club → Club Users",
      "Find user: Liam Wood",
      "Click three dots menu",
      "Click Delete User",
      "Confirmation dialog appears: 'Are you sure you want to delete Bob or Liam Wood? This player may be a part of active squads. Deleting this user will remove them from all teams.'",
      "Click 'Yes, delete user'"
    ],
    expectedResult: "User deleted from system permanently",
    actualResult: "System displayed 'Liam Wood has been deleted successfully' but user was not actually deleted (confirmed in Test Case 5).",
    status: "failed",
    associatedBug: "BUG-003",
    date: "2025-11-11",
    tester: "Liam Wood",
    component: "User Management"
  },
  {
    id: "TC-005",
    title: "Verify User Deletion",
    objective: "Confirm user deletion by attempting to recreate the same user",
    steps: [
      "Navigate to Club → Club Users",
      "Click Add User",
      "Enter same details as deleted user: First name: Liam, Last name: Wood, Short name: Wood, Email: leam.wood@yahoo.com, Password: [any]",
      "Click Create User"
    ],
    expectedResult: "User should be created successfully since previous user was deleted",
    actualResult: "Received error: 'Email already exists' - confirming that the user was never actually deleted despite success message.",
    status: "failed",
    associatedBug: "BUG-003",
    date: "2025-11-11",
    tester: "Liam Wood",
    component: "User Management"
  },
  {
    id: "TC-006",
    title: "Multiple Users with Different Roles",
    objective: "Create multiple users with different roles and verify summary tabs display correct information",
    steps: [
      "Create three users: Test 1: Player role, Test 2: Admin role, Test 3: Coach role",
      "Check Club User Management summary tabs for accurate counts"
    ],
    expectedResult: "Summary should show: Total users: 3, Role breakdown: 1 admin, 1 coach, 1 player, User status: 3 active, 0 retired, 0 suspended",
    actualResult: "Partial success: Total users: Shows 4 (incorrect - should be 3), Role breakdown: 1 admin, 1 coach, 1 player (correct), User status: 3 active, 0 retired, 0 suspended (correct), Grouping works correctly on the Club User Management screen",
    status: "partial",
    associatedBug: "BUG-004",
    date: "2025-11-11",
    tester: "Liam Wood",
    component: "User Management"
  },
  {
    id: "TC-007",
    title: "Filter Users by Role",
    objective: "Verify filtering functionality for user roles and status",
    steps: [
      "Click Enable Filter",
      "Test role filters: Admin, Coach, Players, Sub Admin",
      "Test status filter: Active"
    ],
    expectedResult: "Filters should correctly display users matching selected criteria",
    actualResult: "All filters work correctly. Users are properly filtered by role and status.",
    status: "passed",
    date: "2025-11-11",
    tester: "Liam Wood",
    component: "User Management"
  },
  {
    id: "TC-008",
    title: "Change User Status",
    objective: "Change user status from Active to Suspended",
    steps: [
      "Navigate to Club → Club Users",
      "Click on Test 2 user (admin role)",
      "Click Edit",
      "Change Account Status from Active to Suspended",
      "Click Save"
    ],
    expectedResult: "User status changes to Suspended and summary reflects the change",
    actualResult: "System displayed 'User details updated successfully' but the user's account status remains Active. No actual change was applied.",
    status: "failed",
    associatedBug: "BUG-005",
    date: "2025-11-11",
    tester: "Liam Wood",
    component: "User Management"
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
  // =============================================================================
  // HOME SECTION - Epic GS-1
  // =============================================================================
  {
    id: "landing",
    title: "Landing Page",
    route: "/",
    section: "home",
    overview: "Public landing page showcasing GameScope features and capabilities.",
    functionalRequirements: [
      { id: "FR-001", title: "Landing Page", description: "Display key features: video analysis, team management, statistics. Prominent login/signup buttons. Feature highlights with screenshots or illustrations. Testimonials or client logos (optional)." },
    ],
    acceptanceCriteria: [
      { id: "AC-001", description: "Landing page loads with feature highlights", parentFrId: "FR-001" },
      { id: "AC-002", description: "Login button navigates to login page", parentFrId: "FR-001" },
      { id: "AC-003", description: "Page is responsive across all device sizes", parentFrId: "FR-001" },
    ],
  },
  {
    id: "login",
    title: "Login",
    route: "/login",
    section: "home",
    overview: "User authentication page for accessing the application.",
    functionalRequirements: [
      { id: "FR-002", title: "Login", description: "Email and password authentication. 'Remember me' option. Forgot password link. SSO integration (future). Validation: Email format required, Password required." },
    ],
    acceptanceCriteria: [
      { id: "AC-004", description: "Valid credentials grant access to the application", parentFrId: "FR-002" },
      { id: "AC-005", description: "Invalid credentials show appropriate error message", parentFrId: "FR-002" },
      { id: "AC-006", description: "Error messages are user-friendly (not technical)", parentFrId: "FR-002" },
      { id: "AC-007", description: "Successful login redirects to Home (team selection)", parentFrId: "FR-002" },
    ],
  },
  {
    id: "home",
    title: "Home (Team Selection Hub)",
    route: "/home",
    section: "home",
    overview: "Team selection hub where users choose which team to manage before accessing team-specific features.",
    functionalRequirements: [
      { id: "FR-003", title: "Home (Team Selection Hub)", description: "Club logo and name displayed prominently. Grid of team cards for the current club. Each card shows: Team name, Age group, Player count, Status badge. Display all teams the user has access to. Club branding applied throughout. Quick access to club-level functions for admins." },
      { id: "FR-004", title: "Select Team Component", description: "Persistent team selector dropdown in the top-left navigation bar. Allow team switching without navigating away. Remember selected team across sessions. Show team name and optional logo/badge." },
    ],
    acceptanceCriteria: [
      { id: "AC-008", description: "All teams for the current club are displayed", parentFrId: "FR-003" },
      { id: "AC-009", description: "Selecting a team navigates to team dashboard", parentFrId: "FR-003" },
      { id: "AC-010", description: "Only teams user has permission to view are shown", parentFrId: "FR-003" },
      { id: "AC-011", description: "Club logo and colors display correctly", parentFrId: "FR-003" },
      { id: "AC-012", description: "Team selector is visible on all pages after login", parentFrId: "FR-004" },
      { id: "AC-013", description: "Switching teams updates all team-specific data on current page", parentFrId: "FR-004" },
      { id: "AC-014", description: "Selected team persists in localStorage or session", parentFrId: "FR-004" },
      { id: "AC-015", description: "Only teams from current club are shown in dropdown", parentFrId: "FR-004" },
      { id: "AC-016", description: "Only teams user has permission to access are shown", parentFrId: "FR-004" },
      { id: "AC-017 (Epic)", description: "Home section pages load in under 3 seconds", parentFrId: "FR-003" },
      { id: "AC-018 (Epic)", description: "Club branding applied consistently across all Home pages", parentFrId: "FR-003" },
    ],
  },

  // =============================================================================
  // TEAM SECTION - Epic GS-15: Dashboard
  // =============================================================================
  {
    id: "dashboard",
    title: "Dashboard",
    route: "/dashboard",
    section: "team",
    overview: "Overview of team performance, upcoming fixtures, and key metrics at a glance. This is the landing page after selecting a team.",
    functionalRequirements: [
      { id: "FR-005", title: "Statistics Cards", description: "4-column grid of key team metrics: Total Players (Users icon, count, 'Active squad members'), Matches Played (Target icon, from fixtures, 'This season'), Win Rate (TrendingUp/Down, percentage, 'W-D-L record'), Next Match (Calendar, days count, 'vs [Opponent]')." },
      { id: "FR-006", title: "Recent Results Section", description: "Title 'Recent Results' with 'View all' link. Shows last 3-5 completed matches. FixtureCard displays opposition logo, match info, location badge, result/score. Result badges: WIN (green W), LOSS (red L), DRAW (gray D)." },
      { id: "FR-007", title: "Upcoming Fixtures Section", description: "Title 'Upcoming Fixtures' with 'View all' link. Shows next 3-5 scheduled matches. Shows 'SCHEDULED' badge in blue. No score display for upcoming matches." },
    ],
    acceptanceCriteria: [
      { id: "AC-019", description: "All 4 statistics cards display with correct icons", parentFrId: "FR-005" },
      { id: "AC-020", description: "Stats reflect actual team performance from database", parentFrId: "FR-005" },
      { id: "AC-021", description: "Win Rate shows TrendingUp (green) if ≥60%, TrendingDown (red) if <40%", parentFrId: "FR-005" },
      { id: "AC-022", description: "Recent results display accurate scores", parentFrId: "FR-006" },
      { id: "AC-023", description: "'View all' link navigates to Fixtures page", parentFrId: "FR-006" },
      { id: "AC-024", description: "Upcoming fixtures show correct dates and opponents", parentFrId: "FR-007" },
      { id: "AC-025", description: "'View all' link navigates to Fixtures page", parentFrId: "FR-007" },
      { id: "AC-026 (Epic)", description: "Dashboard loads in under 2 seconds", parentFrId: "FR-005" },
      { id: "AC-027 (Epic)", description: "Data refreshes automatically when team is changed", parentFrId: "FR-005" },
    ],
  },

  // =============================================================================
  // TEAM SECTION - Epic GS-5: Fixtures
  // =============================================================================
  {
    id: "fixtures",
    title: "Fixtures",
    route: "/fixtures",
    section: "team",
    overview: "The Fixtures page is the central hub for managing all team matches, including scheduling, results, and video uploads.",
    functionalRequirements: [
      { id: "FR-008", title: "Fixtures List View", description: "Statistics Cards (4-column grid): Total Fixtures (Target, count, 'All time'), Win Rate (TrendingUp/Down, percentage, 'This season'), Goal Difference (Plus/Minus, signed number, 'GF: X GA: Y'), Competitions (Trophy, count, 'Active competitions')." },
      { id: "FR-009", title: "Control Bar", description: "Left: Enable Filter button, Search input. Right: Add Fixture button, Import CSV button, Settings button." },
      { id: "FR-010", title: "Filter Panel", description: "Collapsible filter panel: Season (Season Picker), Competition (Dropdown, dynamic + 'All'), Status (Button group: All/Completed/Scheduled), Location (Button group: All/Home/Away)." },
      { id: "FR-011", title: "FixtureCard Component", description: "Team Identity (opposition logo 40x40px), Match Information (opponent name, date/time, competition), Location Badge (HOME green/AWAY blue), Result/Status (Completed: score + W/L/D badge, Scheduled: 'SCHEDULED' badge), Actions (Video icon, Stats icon, Edit, Delete)." },
      { id: "FR-012", title: "Add/Edit Fixture", description: "Form fields: Opposition (Autocomplete + Add New), Date (DD Mon YYYY), Time (HH:MM optional), Competition (Dropdown + Add New), Venue (text), Type (Home/Away toggle). Edit mode adds Home Score and Away Score. Inline Opposition Creation: Team Name (required), Short Name (max 5), Logo upload, colors." },
      { id: "FR-013", title: "Delete Fixture", description: "Soft delete: Set status to 'Deleted' or add deletedAt timestamp. Fixture no longer appears in list. Associated videos remain archived. Match statistics preserved. Confirmation Dialog with warning if videos/analysis attached." },
      { id: "FR-022", title: "Import Fixtures from Excel/CSV", description: "CSV Format: Date,Opposition,Competition,Location,Time,KickOff,Score. Upload flow: 1) Select file, 2) Validation (extension, <5MB, structure), 3) Preview with color coding, 4) Options: Import Valid Only/Fix Errors/Cancel, 5) Progress indicator and success message." },
    ],
    acceptanceCriteria: [
      { id: "AC-028", description: "All 4 statistics cards display with correct values", parentFrId: "FR-008" },
      { id: "AC-029", description: "Win Rate icon reflects performance (green/red/gray)", parentFrId: "FR-008" },
      { id: "AC-030", description: "Search filters fixtures by opponent, venue, competition", parentFrId: "FR-009" },
      { id: "AC-031", description: "All buttons trigger correct actions", parentFrId: "FR-009" },
      { id: "AC-032", description: "All filters work independently", parentFrId: "FR-010" },
      { id: "AC-033", description: "Filters combine with AND logic", parentFrId: "FR-010" },
      { id: "AC-034", description: "Filter panel expands/collapses correctly", parentFrId: "FR-010" },
      { id: "AC-035", description: "Fixture cards display all required elements", parentFrId: "FR-011" },
      { id: "AC-036", description: "Clicking card navigates to fixture detail", parentFrId: "FR-011" },
      { id: "AC-037", description: "Form validates all required fields", parentFrId: "FR-012" },
      { id: "AC-038", description: "Opposition can be created inline during fixture creation", parentFrId: "FR-012" },
      { id: "AC-039", description: "Edit mode pre-populates all fields", parentFrId: "FR-012" },
      { id: "AC-040", description: "Success message displays after database confirms save", parentFrId: "FR-012" },
      { id: "AC-041", description: "Delete shows confirmation dialog", parentFrId: "FR-013" },
      { id: "AC-042", description: "Deleted fixture removed from list", parentFrId: "FR-013" },
      { id: "AC-043", description: "Associated videos preserved", parentFrId: "FR-013" },
      { id: "AC-066", description: "Import accepts .csv and .xlsx files", parentFrId: "FR-022" },
      { id: "AC-067", description: "Preview shows validation status per row", parentFrId: "FR-022" },
      { id: "AC-068", description: "Import Valid Only skips error rows", parentFrId: "FR-022" },
      { id: "AC-069 (Epic)", description: "Fixtures page handles 500+ fixtures without performance issues", parentFrId: "FR-008" },
      { id: "AC-070 (Epic)", description: "All fixture operations confirm with database before showing success", parentFrId: "FR-008" },
      { id: "AC-071 (Epic)", description: "Fixture data persists after page refresh", parentFrId: "FR-008" },
    ],
  },
  {
    id: "fixture-details",
    title: "View Fixture Detail",
    route: "/fixtures/:id",
    parentId: "fixtures",
    section: "team",
    overview: "Detailed view of a single fixture with match header, navigation actions, and tabbed content for different aspects of match data.",
    functionalRequirements: [
      { id: "FR-014", title: "Fixture Detail Header", description: "Match Header: Both team logos (home left, away right), team names with score (if completed), date/time/venue/competition, status badge (COMPLETED/SCHEDULED/POSTPONED). Navigation: Back button, breadcrumb (Fixtures > [Opposition]), Edit/Delete buttons." },
    ],
    acceptanceCriteria: [
      { id: "AC-044", description: "Match header displays both team logos and names", parentFrId: "FR-014" },
      { id: "AC-045", description: "Score displays only for completed fixtures", parentFrId: "FR-014" },
      { id: "AC-046", description: "Back button returns to Fixtures list", parentFrId: "FR-014" },
      { id: "AC-047", description: "Edit/Delete buttons visible for authorized users", parentFrId: "FR-014" },
    ],
    tabs: [
      {
        id: "match-report",
        name: "Match Report",
        overview: "Scoreboard with final score and goal scorers, key facts, event timeline, and export options.",
        functionalRequirements: [
          { id: "FR-015", title: "Match Report Tab", description: "Scoreboard with final score and goal scorers. Key facts: Venue, date, time, officials, attendance. Event timeline: Goals, cards, substitutions in chronological order. Export options: PDF and HTML formats." },
        ],
        acceptanceCriteria: [
          { id: "AC-048", description: "Match header and event timeline render correctly", parentFrId: "FR-015" },
          { id: "AC-049", description: "Export produces valid PDF/HTML with all match data", parentFrId: "FR-015" },
        ],
      },
      {
        id: "line-ups",
        name: "Line-Ups",
        overview: "Visual formation display with starting XI positions, substitutes bench, and substitution log.",
        functionalRequirements: [
          { id: "FR-016", title: "Line-Ups Tab", description: "Visual formation display (e.g., 4-4-2, 4-3-3). Starting XI with positions on pitch graphic. Substitutes bench with player details. Substitution log with timestamps. Player status tags (captain, yellow card, red card, injured)." },
        ],
        acceptanceCriteria: [
          { id: "AC-050", description: "Formation display matches stored metadata", parentFrId: "FR-016" },
          { id: "AC-051", description: "Substitution log enforces player availability rules", parentFrId: "FR-016" },
        ],
      },
      {
        id: "videos",
        name: "Videos",
        overview: "Video management for this fixture including upload, AI processing, and playback.",
        functionalRequirements: [
          { id: "FR-017", title: "Videos Tab", description: "Video Actions: Add Video (upload with camera label), Process All Videos (AI analysis with PlayerTRACK + PlayerEVENT), View Video (player with controls), Upload JSON Events, Edit Video Details, Delete Video. Camera Labels: 1st Half Half Way Line, 1st Half Behind Goal, 2nd Half Half Way Line, 2nd Half Behind Goal, Tactical View." },
        ],
        acceptanceCriteria: [
          { id: "AC-052", description: "Add Video allows file upload with camera label assignment", parentFrId: "FR-017" },
          { id: "AC-053", description: "Process All Videos triggers AI analysis and shows progress", parentFrId: "FR-017" },
          { id: "AC-054", description: "Upload JSON Events validates format before import", parentFrId: "FR-017" },
          { id: "AC-055", description: "Edit/Delete actions work with confirmation", parentFrId: "FR-017" },
        ],
      },
      {
        id: "upload-data",
        name: "Upload Data",
        overview: "File upload for statistics, events, and tracking data with validation and error reporting.",
        functionalRequirements: [
          { id: "FR-018", title: "Upload Data Tab", description: "File upload: CSV, Excel (.xlsx), JSON formats. Data types: Statistics, events, tracking data. Validation: Schema checking, required fields, data types. Error reporting: Row-level errors with field details. Audit logging: Track who uploaded what and when." },
        ],
        acceptanceCriteria: [
          { id: "AC-056", description: "Invalid files rejected with specific row/field errors", parentFrId: "FR-017" },
          { id: "AC-057", description: "Upload completes within 60 seconds with audit trail", parentFrId: "FR-017" },
        ],
      },
      {
        id: "statistics",
        name: "Statistics",
        overview: "Side-by-side team comparison with metrics organized by category.",
        functionalRequirements: [
          { id: "FR-019", title: "Statistics Tab", description: "Metric Categories: Key (Total Team Distance, Ball Possession), Attack (Goals, Shots Attempted, Shots on Target, Runs into Boxes, Corner Kicks, Dangerous Crosses), Possession (Dribbles, Penetrating Dribbles, Take Ons, First Touch Success), Defense (Tackles, Free Kicks, Offsides), Passing (Passes Attempted, Success, Rate, Distance, Velocity). Display: Home value + % | Away value + % with percentage bars. Period filters: Full Match, 1st Half, 2nd Half." },
        ],
        acceptanceCriteria: [
          { id: "AC-058", description: "All 5 category tabs display with correct metrics", parentFrId: "FR-019" },
          { id: "AC-059", description: "Period filter updates all metrics coherently", parentFrId: "FR-019" },
          { id: "AC-060", description: "Stats render within 100ms of filter change", parentFrId: "FR-019" },
        ],
      },
      {
        id: "spider-charts",
        name: "Spider Charts",
        overview: "Radar chart visualization of the same metrics from the Statistics tab.",
        functionalRequirements: [
          { id: "FR-020", title: "Spider Charts Tab", description: "Chart Categories: Attack (Goals, Shots, Shots on Target, Runs into Boxes, Corners, Dangerous Crosses), Possession (Ball Possession, Dribbles, Penetrating Dribbles, Take Ons, First Touch Success), Technical (Passes Attempted, Success, Rate, Distance, Avg Distance, Velocity). Features: Radar/spider chart, home team solid line with club primary color, away team dashed line with opponent color, normalized 0-100 scale, tooltips showing actual values." },
        ],
        acceptanceCriteria: [
          { id: "AC-061", description: "All three charts (Attack, Possession, Technical) render correctly", parentFrId: "FR-020" },
          { id: "AC-062", description: "Each chart displays 6+ metrics with normalized values", parentFrId: "FR-020" },
          { id: "AC-063", description: "Tooltips show actual metric values on hover", parentFrId: "FR-020" },
        ],
      },
      {
        id: "ai-analysis",
        name: "AI Analysis",
        overview: "AI-generated match insights, tactical themes, and recommendations.",
        functionalRequirements: [
          { id: "FR-021", title: "AI Analysis Tab", description: "Narrative insights: AI-generated match summary. Tactical themes: Key patterns identified from data. Recommendations: Suggested improvements for team. Confidence indicators: Show AI certainty levels." },
        ],
        acceptanceCriteria: [
          { id: "AC-064", description: "AI generates coherent narrative from match data", parentFrId: "FR-021" },
          { id: "AC-065", description: "Tactical themes are supported by specific events/stats", parentFrId: "FR-021" },
        ],
      },
    ],
  },

  // =============================================================================
  // TEAM SECTION - Epic GS-4: Squad
  // =============================================================================
  {
    id: "squad",
    title: "Squad",
    route: "/squad",
    section: "team",
    overview: "Card-based roster view with filtering and quick actions for managing players.",
    functionalRequirements: [
      { id: "FR-023", title: "Squad List View", description: "Statistics Cards: Total Players, Star Players (keyPlayer=true), Position Breakdown (2x2 grid: GK/DEF/MID/FWD), Player Status (W-X-Y-Z: fit-injured-n/a-retired). Control Bar: Filter toggle, Add Player, Import Excel, Transfer Players, Settings. Filter Panel: Position, Fit Status, Star Players, Search. Player Cards grouped by position with squad number, star toggle, name, position badge, fit status badge, actions (Edit, Delete, View Profile)." },
      { id: "FR-024", title: "Add Player", description: "3-column form: First Name*, Last Name*, Shirt Name, Squad Number, Position*, Fit Status*, Date of Birth, Age (calculated), Gender, Email, Password, Phone, Account Status. Validation: Required fields marked, if Email provided Password required (min 8 chars, 1 uppercase, 1 number, 1 special), Email unique across all users." },
      { id: "FR-025", title: "Edit Player", description: "Same as Add Player Dialog, pre-populated with existing data. All fields pre-populated. Email uniqueness check excludes current player. Password validation only if changed." },
      { id: "FR-026", title: "Delete Player", description: "Flow: Click Delete → Confirmation dialog → Confirm deletes TeamMember record. Shows player name in confirmation. Cancel closes without deleting." },
      { id: "FR-027", title: "View Player Details", description: "Route: /squad/:id or /users/:id. Opens User Details page with tabbed interface. Tabs: User Details (name, personal, contact, account info), Teams (memberships, add/remove), Bio (high school, class year, bio text), Photos (profile photo, headshot)." },
      { id: "FR-028", title: "Transfer Players", description: "Modes: Transfer In (select source team → view players → select → transfer), Transfer Out (select target team → view current → select → transfer). Prompt: 'Are these players going to play for both teams?' Yes: Create new TeamMember, keep original. No: Create new, delete original." },
      { id: "FR-029", title: "Import Squad from Excel", description: "Accepted columns: First Name (required), Last Name (required), Position (recommended), Jersey Number (recommended), Email (optional), Phone (optional). Upload flow: Drag & drop or click, preview with status badges (Valid/Warning/Error), 'Import X Players' button for valid+warning rows only." },
    ],
    acceptanceCriteria: [
      { id: "AC-072", description: "Total Players shows correct count matching database", parentFrId: "FR-023" },
      { id: "AC-073", description: "Players grouped by position: GK → DEF → MID → FWD", parentFrId: "FR-023" },
      { id: "AC-074", description: "All filters work independently and combine with AND logic", parentFrId: "FR-023" },
      { id: "AC-075", description: "Star toggle updates keyPlayer on click and persists", parentFrId: "FR-023" },
      { id: "AC-076", description: "Form validates all required fields", parentFrId: "FR-024" },
      { id: "AC-077", description: "Password field disabled when email is blank", parentFrId: "FR-024" },
      { id: "AC-078", description: "Email uniqueness validated before save", parentFrId: "FR-024" },
      { id: "AC-079", description: "Success message displays after database confirms save", parentFrId: "FR-025" },
      { id: "AC-080", description: "Edit dialog pre-populates all fields", parentFrId: "FR-025" },
      { id: "AC-081", description: "Changes persist after save", parentFrId: "FR-026" },
      { id: "AC-082", description: "Delete shows confirmation with player name", parentFrId: "FR-026" },
      { id: "AC-083", description: "Player removed from list after confirmation", parentFrId: "FR-027" },
      { id: "AC-084", description: "Success message displays after database confirms deletion", parentFrId: "FR-027" },
      { id: "AC-085", description: "Clicking player card opens detail page", parentFrId: "FR-028" },
      { id: "AC-086", description: "All four tabs load with correct content", parentFrId: "FR-028" },
      { id: "AC-087", description: "Transfer In shows players from selected source team", parentFrId: "FR-028" },
      { id: "AC-088", description: "Transfer Out shows current team players", parentFrId: "FR-029" },
      { id: "AC-089", description: "'Play for both' option creates dual membership", parentFrId: "FR-029" },
      { id: "AC-090", description: "Import accepts .xls and .xlsx files", parentFrId: "FR-029" },
      { id: "AC-091", description: "Preview shows validation status per row", parentFrId: "FR-029" },
      { id: "AC-092", description: "Only valid/warning rows are imported", parentFrId: "FR-029" },
      { id: "AC-093 (Epic)", description: "Squad page handles 100+ players without performance issues", parentFrId: "FR-023" },
      { id: "AC-094 (Epic)", description: "Error messages are user-friendly (not raw exceptions)", parentFrId: "FR-023" },
      { id: "AC-095 (Epic)", description: "All squad operations confirm with database before showing success", parentFrId: "FR-023" },
    ],
  },

  // =============================================================================
  // TEAM SECTION - Epic GS-6: Match Video
  // =============================================================================
  {
    id: "videos",
    title: "Match Video",
    route: "/videos",
    section: "team",
    overview: "Browse and view match videos organized by fixture. This page provides read-only access to uploaded videos. Video upload, editing, and deletion is managed via Fixtures → View Fixture → Videos tab.",
    functionalRequirements: [
      { id: "FR-030", title: "Video List View", description: "Two Display Modes: Match List (videos grouped by fixture/match), All Videos (flat list). Match List Mode: Matches organized by competition, each section collapsible. Competition header with chevron. Match cards showing: team logos, score, date, video count, status badge. Click match to view videos. Match Card Display: Team badge/logo, opponent name, venue (HOME/AWAY), date & time, status badge (WIN/LOSS/DRAW/SCHEDULED), video count." },
      { id: "FR-031", title: "Match Videos Page", description: "Route: /watch-match-video. Match Header: Both team logos and names, score (if completed), date/time/venue, link to Fixture Detail for management. Videos Section (Read-Only): Grid of video cards with thumbnail, title, camera label, duration, upload date. Click to play. No edit/delete on this page. Video Player: Full playback controls, fullscreen mode, playback speed control, camera angle switcher." },
    ],
    acceptanceCriteria: [
      { id: "AC-096", description: "Match list displays all fixtures with video counts", parentFrId: "FR-030" },
      { id: "AC-097", description: "Competition grouping expands/collapses correctly", parentFrId: "FR-031" },
      { id: "AC-098", description: "Clicking match navigates to match videos page", parentFrId: "FR-031" },
      { id: "AC-099", description: "Video player loads and plays correctly", parentFrId: "FR-031" },
      { id: "AC-100", description: "Camera angle switcher preserves timestamp when switching", parentFrId: "FR-032" },
      { id: "AC-101", description: "Edit link navigates to Fixtures page for video management", parentFrId: "FR-032" },
    ],
  },
  {
    id: "watch-match-video",
    title: "Watch Match Video",
    route: "/watch-match-video",
    parentId: "videos",
    section: "team",
    overview: "Video player page for watching match videos with full playback controls and camera angle switching.",
    functionalRequirements: [
      { id: "FR-031", title: "Match Videos Page", description: "Match Header with team logos and names, score, date/time/venue. Videos grid with thumbnails, titles, camera labels. Video Player with full playback controls, fullscreen, speed control, camera angle switcher." },
    ],
    acceptanceCriteria: [
      { id: "AC-099", description: "Video player loads and plays correctly", parentFrId: "FR-031" },
      { id: "AC-100", description: "Camera angle switcher preserves timestamp when switching", parentFrId: "FR-032" },
    ],
  },

  // =============================================================================
  // TEAM SECTION - Epic GS-32: Player Profiles
  // =============================================================================
  {
    id: "player-profiles",
    title: "Player Profiles",
    route: "/player-profiles",
    section: "team",
    overview: "Comprehensive player profile cards with detailed statistics and performance data.",
    functionalRequirements: [
      { id: "FR-032", title: "Profile Cards", description: "Grid of player profile cards. Search by name, filter by position/status, sort by name/goals/appearances. Profile Card Display: Player photo (or placeholder), name (bold), position badge, key stats summary (Appearances, Goals, Assists). Click to view full profile." },
      { id: "FR-033", title: "Player Stat Comparison", description: "Compare 2-4 players side by side. Side-by-side stat comparison. Radar chart visualization. Metrics: Goals, Assists, Appearances, Minutes, Pass accuracy." },
      { id: "FR-034", title: "Performance Trends", description: "Statistics Section: Appearances (Total, Starts, Sub), Goals (Total, Per game avg), Assists (Total, Per game avg), Minutes Played (Total, Avg per game). Performance Trend Charts: Line charts over time, goals per month/season, fitness status history." },
    ],
    acceptanceCriteria: [
      { id: "AC-102", description: "Profile cards show photo, name, position, and key stats", parentFrId: "FR-033" },
      { id: "AC-103", description: "Search filters players by name", parentFrId: "FR-033" },
      { id: "AC-104", description: "Clicking card opens player detail", parentFrId: "FR-034" },
      { id: "AC-105", description: "Can select 2-4 players for comparison", parentFrId: "FR-034" },
      { id: "AC-106", description: "Comparison displays all metrics side by side", parentFrId: "FR-034" },
      { id: "AC-107", description: "Radar chart renders correctly", parentFrId: "FR-035" },
      { id: "AC-108", description: "Performance trend charts render correctly", parentFrId: "FR-035" },
      { id: "AC-109", description: "Data updates when season filter changes", parentFrId: "FR-036" },
      { id: "AC-110 (Epic)", description: "Player profiles page loads in under 2 seconds", parentFrId: "FR-027" },
    ],
  },

  // =============================================================================
  // CLUB SECTION - Epic GS-3: Teams
  // =============================================================================
  {
    id: "teams",
    title: "Teams",
    route: "/teams",
    section: "club",
    overview: "The Teams page displays all teams within the selected club in a card-based grid layout.",
    functionalRequirements: [
      { id: "FR-035", title: "Teams Grid", description: "Card-based grid layout grouped by Gender. Each card shows: Team name, Age group, Player count, Matches count, Status badge (ACTIVE green, INACTIVE gray, ARCHIVED red)." },
      { id: "FR-036", title: "Add Team", description: "Form fields: Team Name (required), Short Name (required, max 10 chars), Gender (required dropdown), Age Group (optional, U12-U21/Senior), Status (required, default Active)." },
      { id: "FR-037", title: "Edit/Delete Team", description: "Edit: Same as creation dialog, pre-populated. Edit button on card for authorized users. Can change status. Delete: Soft delete (status 'Deleted' or deletedAt). Team removed from lists. Squad members remain as users. Confirmation shows impact summary (X players, Y fixtures, Z videos affected)." },
    ],
    acceptanceCriteria: [
      { id: "AC-111", description: "All teams for current club display in grid", parentFrId: "FR-037" },
      { id: "AC-112", description: "Teams grouped by gender", parentFrId: "FR-037" },
      { id: "AC-113", description: "Player and match counts are accurate", parentFrId: "FR-038" },
      { id: "AC-114", description: "Form validates all required fields", parentFrId: "FR-038" },
      { id: "AC-115", description: "Short name limited to 10 characters", parentFrId: "FR-039" },
      { id: "AC-116", description: "Status defaults to ACTIVE", parentFrId: "FR-039" },
      { id: "AC-117", description: "Success toast on creation", parentFrId: "FR-040" },
      { id: "AC-118", description: "Dialog closes on success", parentFrId: "FR-040" },
      { id: "AC-119", description: "Edit dialog pre-populates all fields", parentFrId: "FR-040" },
      { id: "AC-120", description: "Delete shows confirmation with impact summary", parentFrId: "FR-040" },
      { id: "AC-121", description: "Deleted team removed from grid", parentFrId: "FR-040" },
    ],
  },

  // =============================================================================
  // CLUB SECTION - Epic GS-8: Club Users
  // =============================================================================
  {
    id: "users",
    title: "Club Users",
    route: "/users",
    section: "club",
    overview: "Manage all users within the club context, including role assignment and team membership.",
    functionalRequirements: [
      { id: "FR-038", title: "User List View", description: "Summary Cards: Total Users, By Role (Admin, Coach, Analyst, Parent, Player counts), By Status (Active, Inactive, Suspended). User Table/Cards: Columns (Name, Email, Role, Teams, Status, Last Login), Search by name/email, Filter by role/status, Sort by any column." },
      { id: "FR-039", title: "Add User", description: "Form fields: Email (required, unique), First Name (required, max 50), Last Name (required, max 50), Role (required dropdown: Admin/Coach/Analyst/Parent/Player), Password (required, min 8 chars with complexity), Account Status (required, default Active)." },
      { id: "FR-040", title: "Edit User", description: "Same as Add User, pre-populated. Email uniqueness checked excluding current user. Password validation only if changed." },
      { id: "FR-041", title: "Delete User", description: "Soft delete: accountStatus 'Deleted' or deletedAt. User removed from lists, cannot log in. Associated TeamMember records preserved. Confirmation dialog with warning if assigned to teams. Delete button visible only to Admin users. Cannot delete yourself." },
    ],
    acceptanceCriteria: [
      { id: "AC-122", description: "User list displays all club users", parentFrId: "FR-040" },
      { id: "AC-123", description: "Search filters by name and email", parentFrId: "FR-041" },
      { id: "AC-124", description: "Filters work independently and combine", parentFrId: "FR-041" },
      { id: "AC-125", description: "Form validates all required fields", parentFrId: "FR-042" },
      { id: "AC-126", description: "Email uniqueness validated", parentFrId: "FR-042" },
      { id: "AC-127", description: "Password meets complexity requirements", parentFrId: "FR-043" },
      { id: "AC-128", description: "Success message after database confirms save", parentFrId: "FR-043" },
      { id: "AC-129", description: "Edit dialog pre-populates all fields", parentFrId: "FR-044" },
      { id: "AC-130", description: "Changes persist after save", parentFrId: "FR-044" },
      { id: "AC-131", description: "Delete button visible only to Admin users", parentFrId: "FR-044" },
      { id: "AC-132", description: "Delete shows confirmation dialog", parentFrId: "FR-045" },
      { id: "AC-133", description: "Cannot delete yourself (current logged-in user)", parentFrId: "FR-045" },
      { id: "AC-134", description: "User removed from list after deletion", parentFrId: "FR-045" },
    ],
  },
  {
    id: "user-details",
    title: "User Details",
    route: "/users/:id",
    parentId: "users",
    section: "club",
    overview: "Individual user profile page with tabbed interface for managing all aspects of a user's information.",
    functionalRequirements: [
      { id: "FR-042", title: "User Header", description: "User avatar (profile photo or initials), full name (First Last), role badge (Admin, Coach, Player, etc.), status indicator (Active/Inactive/Suspended), Edit button (opens edit dialog)." },
      { id: "FR-043", title: "Navigation", description: "Back button returns to Club Users list. Breadcrumb: Club Users > [User Name]." },
      { id: "FR-044", title: "User Details Tab", description: "Core user information: Name Info (First Name, Last Name, Shirt Name), Personal Info (DOB, Age calculated, Gender, Height, Hometown), Contact Info (Email, Phone), Account Info (Role, Account Status)." },
      { id: "FR-045", title: "Teams Tab", description: "List of teams user belongs to. Each row shows: Team name, Squad Number, Position. Add to Team button, Remove from Team with confirmation. Edit squad number and position inline. Add to Team Dialog: Team (dropdown, teams user not in), Squad Number, Position (GK/DEF/MID/FWD required)." },
      { id: "FR-046", title: "Bio Tab", description: "Extended biographical information: High School (text), Class Year (dropdown), Bio (textarea, free-form)." },
      { id: "FR-047", title: "Photos Tab", description: "Profile Photo: Main avatar used throughout app. Headshot Photo: Formal photo for team sheets. Upload via drag & drop or file picker. Formats: JPG, PNG, WebP. Max 5MB. Preview before saving." },
    ],
    acceptanceCriteria: [
      { id: "AC-135", description: "User header displays avatar, name, role, and status", parentFrId: "FR-045" },
      { id: "AC-136", description: "Edit button opens edit dialog", parentFrId: "FR-046" },
      { id: "AC-137", description: "Back button returns to Club Users list", parentFrId: "FR-046" },
      { id: "AC-138", description: "Breadcrumb displays correctly", parentFrId: "FR-046" },
      { id: "AC-139", description: "All user details display correctly", parentFrId: "FR-047" },
      { id: "AC-140", description: "Age calculated from DOB", parentFrId: "FR-047" },
      { id: "AC-141", description: "Team list shows all user's team memberships", parentFrId: "FR-048" },
      { id: "AC-142", description: "Add to Team only shows teams user is not already in", parentFrId: "FR-048" },
      { id: "AC-143", description: "Remove from Team shows confirmation dialog", parentFrId: "FR-049" },
      { id: "AC-144", description: "Bio fields display and save correctly", parentFrId: "FR-049" },
      { id: "AC-145", description: "Photo uploads validate format and size", parentFrId: "FR-050" },
      { id: "AC-146", description: "Preview shows before saving", parentFrId: "FR-050" },
      { id: "AC-147", description: "Photos persist after page refresh", parentFrId: "FR-050" },
      { id: "AC-148 (Epic)", description: "User pages load in under 2 seconds", parentFrId: "FR-045" },
      { id: "AC-149 (Epic)", description: "All user operations confirm with database before showing success", parentFrId: "FR-045" },
    ],
  },

  // =============================================================================
  // CLUB SECTION - Epic GS-2: Club Management
  // =============================================================================
  {
    id: "club-management",
    title: "Club Management",
    route: "/club-management",
    section: "club",
    overview: "Edit club details, branding, and owner assignment. This is the 'Edit Club' functionality.",
    functionalRequirements: [
      { id: "FR-048", title: "Club Details Form", description: "Basic Information: Club Name (required, unique, max 100), Short Name (max 5 chars), Address, City, Country. Club Owner: First Name, Last Name, Phone, Email (creates admin user). Branding: Club Logo (JPG/PNG, max 2MB), Primary Color (default #dc2626), Secondary Color (default #000000), Status (Active/Inactive)." },
      { id: "FR-049", title: "Auto-Create Admin User", description: "When club owner info provided (First Name, Last Name, Email, Phone): System creates admin user account, uses email as username, generates temporary password, assigns as club owner, sends welcome email with credentials." },
    ],
    acceptanceCriteria: [
      { id: "AC-150", description: "Club Name uniqueness checked across all clubs", parentFrId: "FR-051" },
      { id: "AC-151", description: "Short Name limited to 5 characters", parentFrId: "FR-051" },
      { id: "AC-152", description: "Logo accepts JPG/PNG only, max 2MB", parentFrId: "FR-052" },
      { id: "AC-153", description: "Color preview squares display correctly", parentFrId: "FR-052" },
      { id: "AC-154", description: "Admin user created when owner details provided", parentFrId: "FR-053" },
    ],
  },

  // =============================================================================
  // CLUB SECTION - Epic GS-30: Settings
  // =============================================================================
  {
    id: "settings",
    title: "Settings",
    route: "/settings",
    section: "club",
    overview: "Club settings and team logo management. Unified interface for managing all team logos within the club context.",
    functionalRequirements: [
      { id: "FR-050", title: "Logo Grid View", description: "Page Header: Title 'SETTINGS', subtitle 'Club settings and team logo management'. All Team Logos Section: Unified grid of Club Teams and Opposition Teams. Logo Card: Thumbnail (or initials avatar), team name, type label, status badge ('Has Logo' green / 'No Logo' gray), edit icon. Initials Avatar: First two letters, club primary color background, white text." },
      { id: "FR-051", title: "Edit Logo Dialog", description: "Fields: Team Name (editable for Opposition only), Short Name (max 5), Logo Upload (PNG/JPG/GIF/WebP, max 10MB), Primary/Secondary Color pickers. Background Removal Tools: Smart Mode (auto-detect white/light), Color Mode (target specific colors), Manual Mode (adjustable 0-100 threshold). Preview shows processed image." },
      { id: "FR-052", title: "Delete Opposition Logo", description: "Soft delete: status 'Archived'. Logo removed from grid. Historical fixtures preserve opponent reference. Confirmation shows fixture count." },
    ],
    acceptanceCriteria: [
      { id: "AC-155", description: "Both Club Teams and Opposition Teams display in unified grid", parentFrId: "FR-053" },
      { id: "AC-156", description: "Teams without logos display initials avatar", parentFrId: "FR-053" },
      { id: "AC-157", description: "Clicking card opens edit dialog", parentFrId: "FR-053" },
      { id: "AC-158", description: "Club Team names are read-only", parentFrId: "FR-054" },
      { id: "AC-159", description: "Opposition Team names are editable", parentFrId: "FR-054" },
      { id: "AC-160", description: "Background removal modes work correctly", parentFrId: "FR-054" },
      { id: "AC-161", description: "Preview shows processed image", parentFrId: "FR-055" },
      { id: "AC-162", description: "Delete shows confirmation with fixture count", parentFrId: "FR-055" },
      { id: "AC-163", description: "Deleted opposition removed from grid", parentFrId: "FR-055" },
      { id: "AC-164", description: "Historical fixtures still show opponent name", parentFrId: "FR-056" },
    ],
  },

  // =============================================================================
  // DEVOPS SECTION - Epic GS-31: All Users
  // =============================================================================
  {
    id: "devops-users",
    title: "All Users",
    route: "/devops/users",
    section: "devops",
    overview: "Manage all users across the entire GameScope platform (all clubs). Internal only for GameScope administrators.",
    functionalRequirements: [
      { id: "FR-053", title: "User List View", description: "Table view of ALL users on platform. Columns: Name, Email, Club, Role, Status, Last Login. Search by name, email. Filter by club, role, status. Sort by any column." },
      { id: "FR-054", title: "User Actions", description: "View User: See profile, club assignments, activity log. Edit User: Modify details, role, status. Reset Password: Send reset email. Suspend User: Immediately block access. Delete User: Soft delete with confirmation. Move to Club: Transfer to different club." },
    ],
    acceptanceCriteria: [
      { id: "AC-165", description: "User list shows ALL users across all clubs", parentFrId: "FR-056" },
      { id: "AC-166", description: "Search and filter work correctly", parentFrId: "FR-057" },
      { id: "AC-167", description: "Only accessible to users with DevOps role", parentFrId: "FR-057" },
      { id: "AC-168", description: "All user actions function correctly", parentFrId: "FR-057" },
      { id: "AC-169", description: "All actions are logged for audit", parentFrId: "FR-058" },
    ],
  },

  // =============================================================================
  // DEVOPS SECTION - Epic GS-31: Clubs
  // =============================================================================
  {
    id: "devops-clubs",
    title: "Clubs",
    route: "/devops/clubs",
    section: "devops",
    overview: "Manage all clubs across the entire GameScope platform. Internal only for GameScope administrators.",
    functionalRequirements: [
      { id: "FR-055", title: "Club List View", description: "Card or table view of ALL clubs. Each shows: Club logo, name, short name, team count, user count, status badge (ACTIVE green, INACTIVE gray). Search/filter by name, country, status." },
      { id: "FR-056", title: "Club Actions", description: "View Club: All details, teams, users, activity. Edit Club: Settings, branding, owner. Add Club: Create new with owner. Deactivate Club: Set Inactive. Delete Club: Soft delete (requires typing club name). Impersonate: Log in as club admin (audit logged, time-limited)." },
      { id: "FR-057", title: "Add Club Form (DevOps)", description: "Same as main app Add Club plus: Subscription Tier (Free/Basic/Pro/Enterprise), Subscription Expiry Date, Video Storage Quota, Internal Notes." },
      { id: "FR-058", title: "Audit Log", description: "All DevOps actions logged. Fields: id, devopsUserId, action (CREATE/UPDATE/DELETE/IMPERSONATE), entityType, entityId, previousValue (JSON), newValue (JSON), timestamp, ipAddress." },
    ],
    acceptanceCriteria: [
      { id: "AC-170", description: "Club list shows ALL clubs on platform", parentFrId: "FR-058" },
      { id: "AC-171", description: "Search and filter work correctly", parentFrId: "FR-059" },
      { id: "AC-172", description: "All club actions function correctly", parentFrId: "FR-059" },
      { id: "AC-173", description: "Impersonation requires confirmation and is time-limited", parentFrId: "FR-060" },
      { id: "AC-174", description: "Delete requires typing club name to confirm", parentFrId: "FR-060" },
      { id: "AC-175", description: "All DevOps-specific fields available in Add Club", parentFrId: "FR-054" },
      { id: "AC-176", description: "Subscription settings saved correctly", parentFrId: "FR-061" },
      { id: "AC-177", description: "All DevOps actions create audit log entries", parentFrId: "FR-061" },
      { id: "AC-178", description: "Audit log includes before/after values", parentFrId: "FR-062" },
      { id: "AC-179 (Epic)", description: "DevOps module only accessible to DevOps role", parentFrId: "FR-054" },
      { id: "AC-180 (Epic)", description: "All operations confirm with database before showing success", parentFrId: "FR-054" },
    ],
  },
];

// PLACEHOLDER: Old registry content removed. Ready for new import.
// Helper functions below remain unchanged.

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

export function getTabRequirements(route: string, tabName: string): TabRequirements | null {
  const page = getRequirementsByRoute(route);
  if (!page || !page.tabs) return null;
  return page.tabs.find(tab => tab.name.toLowerCase() === tabName.toLowerCase()) || null;
}

export const sectionTitles: Record<PageRequirements['section'], string> = {
  home: 'Home',
  team: 'Team',
  club: 'Club',
  devops: 'DevOps',
  global: 'Global',
};
