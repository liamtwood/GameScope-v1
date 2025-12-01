export type RequirementStatus = 'New' | 'Ready' | 'Coded' | 'Tested' | 'Complete';

export interface Requirement {
  id: string;
  description: string;
  status?: RequirementStatus;
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
  section: 'home' | 'team' | 'club' | 'devops';
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
  // REQUIREMENTS REGISTRY - CLEARED FOR IMPORT FROM SPECIFICATION DOC v3.0
  // =============================================================================
  // This array will be populated from GameScope_Full_Specification_v3.0.docx
  // 
  // Structure:
  // - HOME Section (GS-1): FR-001 to FR-004, AC-001 to AC-018
  // - TEAM Section: Dashboard (GS-15), Fixtures (GS-5), Squad (GS-4), Match Video (GS-6), Player Profiles (GS-32)
  // - CLUB Section: Teams (GS-3), Club Users (GS-8), Club Management (GS-2), Settings (GS-30)
  // - DEVOPS Section (GS-31): All Users, Clubs
  //
  // Total: 57 FRs (FR-001 to FR-057), 177 ACs (AC-001 to AC-177)
  // =============================================================================
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
};
