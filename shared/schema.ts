import { sql } from "drizzle-orm";
import { pgTable, pgSchema, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// FM schema for requirements and devops tables
export const fmSchema = pgSchema("fm");

// FM Apps - Multi-app support (GameScope, MAGPIE, etc.)
export const fmApps = fmSchema.table("apps", {
  id: text("id").primaryKey(), // e.g., 'gamescope', 'magpie'
  name: text("name").notNull(),
  description: text("description"),
  framework: varchar("framework", { length: 20 }), // 'react', 'angular'
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// FM Widgets - Reusable UI components
export const fmWidgets = fmSchema.table("widgets", {
  id: text("id").primaryKey(), // e.g., 'fixture-card', 'stats-cards'
  appId: text("app_id").references(() => fmApps.id),
  name: text("name").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).default("general"), // form, display, navigation, action, container, data, feedback, general
  isReusable: boolean("is_reusable").default(true),
  props: jsonb("props"), // Array of prop names this widget accepts
  events: jsonb("events"), // Array of event names this widget emits
  dataModels: jsonb("data_models"), // Array of data model IDs this widget consumes
  configSchema: jsonb("config_schema"), // Optional: JSON schema for widget configuration
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clubs = pgTable("clubs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  shortName: text("short_name").notNull().default("PSC"),
  owner: text("owner").notNull(),
  ownerFirstName: text("owner_first_name"),
  ownerLastName: text("owner_last_name"),
  logoPath: text("logo_path"),
  // Tenant-specific attributes
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  postalCode: text("postal_code"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  description: text("description"),
  established: text("established"), // Year established
  colors: jsonb("colors"), // Primary and secondary colors
  socialMedia: jsonb("social_media"), // Links to social media
  // Settings and preferences
  timezone: text("timezone").default("UTC"),
  currency: text("currency").default("USD"),
  dateFormat: text("date_format").default("MM/DD/YYYY"),
  seasonStartMonth: varchar("season_start_month", { length: 20 }).default("August"),
  // Subscription/tenant info
  subscriptionTier: text("subscription_tier").default("basic"),
  subscriptionStatus: text("subscription_status").default("active"),
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clubId: varchar("club_id").references(() => clubs.id).notNull(),
  name: text("name").notNull(),
  shortName: varchar("short_name", { length: 10 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
  ageGroup: text("age_group"),
  gender: varchar("gender", { length: 20 }),
  seasonStartMonth: varchar("season_start_month", { length: 20 }).default("inherit"),
  colors: jsonb("colors"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



export const fixtures = pgTable("fixtures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").references(() => teams.id).notNull(),
  opponent: text("opponent").notNull(), // Keep for backward compatibility
  oppositionTeamId: varchar("opposition_team_id").references(() => oppositionTeams.id),
  oppositionClubId: varchar("opposition_club_id").references(() => clubs.id), // NEW: For club vs club games
  date: timestamp("date").notNull(),
  venue: text("venue").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // HOME, AWAY, NEUTRAL
  status: varchar("status", { length: 20 }).notNull().default("SCHEDULED"), // SCHEDULED, COMPLETED, CANCELLED, NO_CONTEST
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  competitionId: varchar("competition_id").references(() => competitions.id),
  notes: text("notes"),
  report: text("report"),
  attendance: integer("attendance"),
  hasVideo: boolean("has_video").default(false),
  videoLinks: jsonb("video_links"),
  lineupFormation: varchar("lineup_formation"),
  lineupSlots: jsonb("lineup_slots"), // { GK: string[], DEF: string[], MID: string[], FWD: string[] }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const matchEvents = pgTable("match_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fixtureId: varchar("fixture_id").references(() => fixtures.id).notNull().unique(),
  events: jsonb("events").notNull(),
  lineups: jsonb("lineups"),
  source: varchar("source", { length: 50 }).default("statsbomb"),
  importedAt: timestamp("imported_at").defaultNow(),
  highlightsTimestamps: jsonb("highlights_timestamps").$type<Record<string, number>>(),
});

export const matchStats = pgTable("match_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fixtureId: varchar("fixture_id").references(() => fixtures.id).notNull(),
  period: varchar("period", { length: 20 }).notNull(), // FIRST_HALF, SECOND_HALF, FULL_GAME
  isTeamStats: boolean("is_team_stats").default(true), // true for team stats, false for opponent
  
  // Key stats (distance in km, stored as decimal with 2 places)
  totalTeamDistance: integer("total_team_distance"), // stored as meters, display as km
  possession: integer("possession"), // percentage
  
  // Attack stats
  goals: integer("goals"),
  shotsAttempted: integer("shots_attempted"),
  shotsOnTarget: integer("shots_on_target"),
  runsIntoBoxes: integer("runs_into_boxes"),
  corners: integer("corners"),
  dangerousCrosses: integer("dangerous_crosses"),
  
  // Possession stats
  dribbles: integer("dribbles"),
  penetratingDribbles: integer("penetrating_dribbles"),
  takeOns: integer("take_ons"),
  firstTouchSuccess: integer("first_touch_success"),
  firstTouchSuccessRate: integer("first_touch_success_rate"), // percentage
  
  // Defence stats
  tackles: integer("tackles"),
  freeKicks: integer("free_kicks"),
  offsides: integer("offsides"),
  
  // Passing stats
  passesAttempted: integer("passes_attempted"),
  passesSuccess: integer("passes_success"),
  passingSuccessRate: integer("passing_success_rate"), // percentage
  passingTotalDistance: integer("passing_total_distance"), // stored as meters
  passingAverageDistance: integer("passing_average_distance"), // stored as meters
  passingAverageVelocity: integer("passing_average_velocity"), // km/h
  
  // Foot-specific passing stats (new fields)
  rightFootPassAttempted: integer("right_foot_pass_attempted"),
  rightFootPassSuccess: integer("right_foot_pass_success"),
  rightFootPassSuccessRate: integer("right_foot_pass_success_rate"), // percentage
  leftFootPassAttempted: integer("left_foot_pass_attempted"),
  leftFootPassSuccess: integer("left_foot_pass_success"),
  leftFootPassSuccessRate: integer("left_foot_pass_success_rate"), // percentage
  
  createdAt: timestamp("created_at").defaultNow(),
});

// External historical season aggregates (e.g. FBref WSL seasons)
export const playerSeasonStats = pgTable("player_season_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").references(() => users.id).notNull(),
  season: text("season").notNull(),           // e.g. "2024-2025"
  clubName: text("club_name").notNull(),
  competition: text("competition"),           // e.g. "WSL"
  leagueRank: text("league_rank"),            // e.g. "4th"
  source: varchar("source", { length: 50 }).default("fbref"),
  stats: jsonb("stats").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// External per-match appearances (e.g. FBref match logs)
export const playerMatchLogs = pgTable("player_match_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").references(() => users.id).notNull(),
  fixtureId: varchar("fixture_id").references(() => fixtures.id), // nullable – populated when linked to a native fixture
  matchDate: timestamp("match_date").notNull(),
  competition: text("competition"),
  clubName: text("club_name").notNull(),
  opponent: text("opponent").notNull(),
  venue: varchar("venue", { length: 20 }),    // Home | Away | Neutral
  result: text("result"),                     // e.g. "W 2–1"
  source: varchar("source", { length: 50 }).default("fbref"),
  stats: jsonb("stats").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const playerStats = pgTable("player_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").references(() => users.id).notNull(),
  fixtureId: varchar("fixture_id").references(() => fixtures.id).notNull(),
  period: varchar("period", { length: 20 }).notNull(), // FIRST_HALF, SECOND_HALF, FULL_GAME
  
  // Key stats (distance in km, stored as decimal with 2 places)
  totalDistance: integer("total_distance"), // stored as meters, display as km
  
  // Attack stats
  goals: integer("goals"),
  assists: integer("assists"),
  shotsAttempted: integer("shots_attempted"),
  shotsOnTarget: integer("shots_on_target"),
  runsIntoBoxes: integer("runs_into_boxes"),
  dangerousCrosses: integer("dangerous_crosses"),
  
  // Possession stats
  dribbles: integer("dribbles"),
  dribblesSuccessful: integer("dribbles_successful"),
  dribblesSuccessRate: integer("dribbles_success_rate"), // percentage
  penetratingDribbles: integer("penetrating_dribbles"),
  penetratingDribblesSuccessful: integer("penetrating_dribbles_successful"),
  penetratingDribblesSuccessRate: integer("penetrating_dribbles_success_rate"), // percentage
  takeOns: integer("take_ons"),
  firstTouchSuccess: integer("first_touch_success"),
  firstTouchAttempted: integer("first_touch_attempted"),
  firstTouchSuccessRate: integer("first_touch_success_rate"), // percentage
  
  // Defence stats
  tackles: integer("tackles"),
  tacklesWon: integer("tackles_won"),
  tacklesSuccessRate: integer("tackles_success_rate"), // percentage
  interceptions: integer("interceptions"),
  clearances: integer("clearances"),
  foulsCommitted: integer("fouls_committed"),
  foulsWon: integer("fouls_won"),
  offsides: integer("offsides"),
  
  // Passing stats
  passesAttempted: integer("passes_attempted"),
  passesSuccess: integer("passes_success"),
  passingSuccessRate: integer("passing_success_rate"), // percentage
  passingTotalDistance: integer("passing_total_distance"), // stored as meters
  passingAverageDistance: integer("passing_average_distance"), // stored as meters
  passingAverageVelocity: integer("passing_average_velocity"), // km/h
  
  // Foot-specific passing stats
  rightFootPassAttempted: integer("right_foot_pass_attempted"),
  rightFootPassSuccess: integer("right_foot_pass_success"),
  rightFootPassSuccessRate: integer("right_foot_pass_success_rate"), // percentage
  leftFootPassAttempted: integer("left_foot_pass_attempted"),
  leftFootPassSuccess: integer("left_foot_pass_success"),
  leftFootPassSuccessRate: integer("left_foot_pass_success_rate"), // percentage
  
  // Physical stats
  sprintsCompleted: integer("sprints_completed"),
  highIntensityRuns: integer("high_intensity_runs"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const oppositionTeams = pgTable("opposition_teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clubId: varchar("club_id").references(() => clubs.id),
  name: text("name").notNull(),
  shortName: varchar("short_name", { length: 10 }),
  logoPath: text("logo_path"),
  websiteUrl: text("website_url"),
  colors: jsonb("colors"),
  isVisible: boolean("is_visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System-wide shared teams table (NEW - stores logos in object storage)
export const systemTeams = pgTable("system_teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  shortName: varchar("short_name", { length: 10 }),
  logoUrl: text("logo_url"), // Object storage URL (different from logoPath)
  // Location and contact information (same as clubs table)
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  postalCode: text("postal_code"),
  phone: text("phone"),
  email: text("email"),
  websiteUrl: text("website_url"),
  description: text("description"),
  established: text("established"), // Year established
  colors: jsonb("colors"), // Primary and secondary team colors
  // Metadata for system management
  isVerified: boolean("is_verified").default(false), // Admin-verified teams
  usage_count: integer("usage_count").default(0), // Track how often used
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const competitions = pgTable("competitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clubId: varchar("club_id").references(() => clubs.id),
  name: text("name").notNull(),
  shortName: varchar("short_name", { length: 10 }),
  logoPath: text("logo_path"),
  seasonStartMonth: varchar("season_start_month", { length: 20 }).default("inherit"), // inherit from team
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teamCompetitions = pgTable("team_competitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").references(() => teams.id).notNull(),
  competitionId: varchar("competition_id").references(() => competitions.id).notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced users table - replaces old users and players tables
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Authentication (optional for players)
  username: text("username").unique(),
  password: text("password"),
  
  // Name Information
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  shirtName: text("shirt_name"), // What appears on jersey, defaults to surname
  
  // Personal Information
  dateOfBirth: timestamp("date_of_birth"),
  gender: varchar("gender", { length: 10 }), // Male, Female, Other
  avatarPath: text("avatar_path"), // Path to profile photo
  headshotPath: text("headshot_path"), // Path to headshot photo
  
  // Bio Information
  height: text("height"), // e.g., "5-7"
  hometown: text("hometown"), // e.g., "Thornton, Colo."
  highSchool: text("high_school"), // e.g., "Broomfield HS"
  classYear: varchar("class_year", { length: 20 }), // Freshman, Sophomore, Junior, Senior
  bio: text("bio"), // Personal bio text
  
  // Contact Information
  email: text("email"),
  phone: text("phone"),
  emergencyContact: text("emergency_contact"),
  emergencyContactPhone: text("emergency_contact_phone"),
  
  // Account Information
  role: varchar("role", { length: 20 }).notNull().default("Player"), // Player, Coach, Admin, Parent
  status: varchar("status", { length: 20 }).default("Draft"), // Draft, Active, Suspended, Retired
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team assignments and stats - replaces player_teams table
export const userTeams = pgTable("user_teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  teamId: varchar("team_id").references(() => teams.id).notNull(),
  
  // Team-specific assignments
  jerseyNumber: integer("jersey_number"),
  position: varchar("position", { length: 20 }).notNull(),
  starPlayer: boolean("star_player").default(false),
  fitnessStatus: varchar("fitness_status", { length: 20 }).default("Fit"), // Fit, Injured, Retired
  
  // Assignment tracking
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User-club relationships (for club transfers and multi-club support)
export const userClubs = pgTable("user_clubs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  clubId: varchar("club_id").references(() => clubs.id).notNull(),
  
  // Status tracking
  status: varchar("status", { length: 20 }).default("Active"), // Active, Inactive, Transferred
  keyUser: boolean("key_user").default(false), // true for key users at club level
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Parent-child relationships
export const userParents = pgTable("user_parents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(), // The child/player
  parentUserId: varchar("parent_user_id").references(() => users.id).notNull(), // The parent
  relationshipType: varchar("relationship_type", { length: 20 }).default("parent"), // parent, guardian, emergency_contact
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Fixture squad selections (starter/sub per match)
export const fixtureSquad = pgTable("fixture_squad", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fixtureId: varchar("fixture_id").references(() => fixtures.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("starter"), // starter, sub
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video link schema with camera angle support
export const videoLinkSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  label: z.string(), // e.g., "Full Match", "1st Half", "2nd Half"
  duration: z.string().optional(), // e.g., "45:00"
  cameraAngle: z.string().optional(), // e.g., "Halfway Line", "Behind Goal", "Tactical"
  location: z.enum(["youtube", "drive", "storage", "fifa_plus"]).optional(),
  eventsJsonUrl: z.string().optional(), // URL to uploaded JSON events file
  eventsJsonFilename: z.string().optional(), // Filename of uploaded JSON events file
});

export const videoLinksArraySchema = z.array(videoLinkSchema).optional();

export type VideoLink = z.infer<typeof videoLinkSchema>;

export const insertFixtureSquadSchema = createInsertSchema(fixtureSquad)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({ role: z.enum(["starter", "sub"]).default("starter") });

// Insert schemas
export const insertClubSchema = createInsertSchema(clubs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    email: z.string().email().optional().or(z.literal("")),
    gender: z.enum(["Male", "Female", "Other"]).optional(),
    dateOfBirth: z.string().or(z.date()).transform((val) => val ? new Date(val) : undefined).optional(),
    role: z.enum(["Player", "Coach", "Admin", "Parent"]).default("Player"),
    status: z.enum(["Draft", "Active", "Suspended", "Retired"]).default("Active"),
  });
export const insertUserTeamSchema = createInsertSchema(userTeams).omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    position: z.enum(["Goalkeeper", "Defender", "Midfield", "Forward", "Head Coach", "Assistant Coach"]),
    fitnessStatus: z.enum(["Fit", "Injured", "Retired"]).default("Fit"),
  });
export const insertUserClubSchema = createInsertSchema(userClubs).omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    status: z.enum(["Active", "Inactive", "Transferred"]).default("Active"),
    keyUser: z.boolean().default(false),
  });
export const insertUserParentSchema = createInsertSchema(userParents).omit({ id: true, createdAt: true })
  .extend({
    relationshipType: z.enum(["parent", "guardian", "emergency_contact"]).optional(),
  });
export const insertOppositionTeamSchema = createInsertSchema(oppositionTeams).omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    websiteUrl: z.string().url().optional().or(z.literal("")),
    colors: z.object({
      primary: z.string().min(1, "Primary color is required"),
      secondary: z.string().optional(),
    }).optional(),
  });
export const insertSystemTeamSchema = createInsertSchema(systemTeams).omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    websiteUrl: z.string().url().optional().or(z.literal("")),
    colors: z.object({
      primary: z.string().min(1, "Primary color is required"),
      secondary: z.string().optional(),
    }).optional(),
  });
export const insertCompetitionSchema = createInsertSchema(competitions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTeamCompetitionSchema = createInsertSchema(teamCompetitions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFixtureSchema = createInsertSchema(fixtures)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    date: z.string().or(z.date()).transform((val) => new Date(val)),
    videoLinks: videoLinksArraySchema,
  });
export const insertMatchEventsSchema = createInsertSchema(matchEvents).omit({ id: true, importedAt: true });
export const insertMatchStatsSchema = createInsertSchema(matchStats).omit({ id: true, createdAt: true });
export const insertPlayerStatsSchema = createInsertSchema(playerStats).omit({ id: true, createdAt: true })
  .extend({
    period: z.enum(["FIRST_HALF", "SECOND_HALF", "FULL_GAME"]).default("FULL_GAME"),
  });
export const insertPlayerSeasonStatsSchema = createInsertSchema(playerSeasonStats).omit({ id: true, createdAt: true })
  .extend({
    stats: z.record(z.string(), z.number()).default({}),
  });
export const insertPlayerMatchLogSchema = createInsertSchema(playerMatchLogs).omit({ id: true, createdAt: true })
  .extend({
    matchDate: z.string().or(z.date()).transform((val) => new Date(val)),
    stats: z.record(z.string(), z.number()).default({}),
  });

// Types
export type Club = typeof clubs.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type UserTeam = typeof userTeams.$inferSelect;
export type UserClub = typeof userClubs.$inferSelect;
export type UserParent = typeof userParents.$inferSelect;
export type OppositionTeam = typeof oppositionTeams.$inferSelect;
export type SystemTeam = typeof systemTeams.$inferSelect;
export type Competition = typeof competitions.$inferSelect;
export type TeamCompetition = typeof teamCompetitions.$inferSelect;
export type Fixture = typeof fixtures.$inferSelect;
export type MatchEvents = typeof matchEvents.$inferSelect;
export type InsertMatchEvents = z.infer<typeof insertMatchEventsSchema>;
export type MatchStats = typeof matchStats.$inferSelect;
export type PlayerStats = typeof playerStats.$inferSelect;
export type PlayerSeasonStats = typeof playerSeasonStats.$inferSelect;
export type PlayerMatchLog = typeof playerMatchLogs.$inferSelect;
export type User = typeof users.$inferSelect;

export type InsertClub = z.infer<typeof insertClubSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertUserTeam = z.infer<typeof insertUserTeamSchema>;
export type InsertUserParent = z.infer<typeof insertUserParentSchema>;
export type InsertOppositionTeam = z.infer<typeof insertOppositionTeamSchema>;
export type InsertSystemTeam = z.infer<typeof insertSystemTeamSchema>;
export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type InsertTeamCompetition = z.infer<typeof insertTeamCompetitionSchema>;
export type InsertFixture = z.infer<typeof insertFixtureSchema>;
export type InsertMatchStats = z.infer<typeof insertMatchStatsSchema>;
export type InsertPlayerStats = z.infer<typeof insertPlayerStatsSchema>;
export type InsertPlayerSeasonStats = z.infer<typeof insertPlayerSeasonStatsSchema>;
export type InsertPlayerMatchLog = z.infer<typeof insertPlayerMatchLogSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertUserClub = z.infer<typeof insertUserClubSchema>;
export type FixtureSquad = typeof fixtureSquad.$inferSelect;
export type InsertFixtureSquad = z.infer<typeof insertFixtureSquadSchema>;

// Player transfer schema
export const playerTransferSchema = z.object({
  playerIds: z.array(z.string().uuid("Invalid player ID")).min(1, "At least one player must be selected"),
  sourceTeamId: z.string().uuid("Invalid source team ID"),
  targetTeamId: z.string().uuid("Invalid target team ID"),
  keepOnSourceTeam: z.boolean(),
}).refine(data => data.sourceTeamId !== data.targetTeamId, {
  message: "Source and target teams cannot be the same",
  path: ["targetTeamId"]
});

export type PlayerTransferRequest = z.infer<typeof playerTransferSchema>;

// Extended types for users with team data
export type UserWithTeamData = User & {
  jerseyNumber: number | null;
  position: string | null;
  starPlayer: boolean | null;
  fitnessStatus: string | null;
};

// Legacy aliases for backward compatibility
export type InsertPlayer = InsertUser;
export type Player = User;
export type PlayerWithTeamData = UserWithTeamData;

// DevOps Requirements Management Tables (FM schema)
export const pageRequirements = fmSchema.table("page_requirements", {
  id: varchar("id").primaryKey(),
  appId: text("app_id").references(() => fmApps.id),
  title: text("title").notNull(),
  route: text("route").notNull(),
  section: varchar("section", { length: 20 }).notNull(), // home, team, club, devops, global
  overview: text("overview").notNull(),
  epicOverview: text("epic_overview").default(''),
  parentId: varchar("parent_id"),
  displayOrder: integer("display_order").default(0),
  functionalRequirements: jsonb("functional_requirements").notNull().default([]),
  acceptanceCriteria: jsonb("acceptance_criteria").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dataModels = fmSchema.table("data_models", {
  id: varchar("id").primaryKey(),
  appId: text("app_id").references(() => fmApps.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  fields: jsonb("fields").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const changeLog = fmSchema.table("change_log", {
  id: varchar("id").primaryKey(),
  appId: text("app_id").references(() => fmApps.id),
  date: text("date").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // added, removed, changed, fixed, bug, enhancement, question, action_item
  area: text("area").notNull(),
  description: text("description").notNull(),
  priority: varchar("priority", { length: 20 }), // low, medium, high, critical (for bugs/enhancements/questions/action_items)
  status: varchar("status", { length: 20 }).default("open"), // open, in_progress, resolved, closed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Unified Work Items table - supports all trackable item types with easy conversion (FM schema)
export const workItems = fmSchema.table("work_items", {
  id: varchar("id").primaryKey(), // Format: TYPE-NNN (e.g., STORY-001, BUG-003, TC-008)
  type: varchar("type", { length: 20 }).notNull(), // epoch, epic, feature, story, bug, enhancement, test_case, question, action_item
  parentId: varchar("parent_id"), // For hierarchy (story → feature → epic → epoch)
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("new"), // new, defined, in_progress, qc, complete
  priority: varchar("priority", { length: 20 }), // low, medium, high, critical
  area: varchar("area", { length: 50 }), // squad, fixtures, video, dashboard, etc.
  
  // Assignment & Tracking
  createdBy: text("created_by"),
  assignedTo: text("assigned_to"),
  priorityRank: integer("priority_rank"), // 1-5 for sprint ordering
  size: varchar("size", { length: 10 }), // S, M, L, XL
  effort: integer("effort"), // 0-99
  
  // App, Page, Widget linking
  appId: text("app_id").references(() => fmApps.id),
  pageId: varchar("page_id"), // FK to page_requirements.id
  widgetId: text("widget_id"), // FK to widgets.id
  
  // Section info (for ACs placed on pages)
  sectionTitle: text("section_title"),
  sectionOrder: integer("section_order"),
  sectionType: varchar("section_type", { length: 20 }), // section, tab, nested-tab, modal, drawer, dropdown
  
  // Test case specific fields
  steps: jsonb("steps"), // Array of step strings for test cases
  expectedResult: text("expected_result"),
  actualResult: text("actual_result"),
  tester: varchar("tester", { length: 100 }),
  
  // Metadata
  date: text("date"), // For backwards compat with changelog entries
  convertedFrom: varchar("converted_from"), // Preserves history: "BUG-003" if converted from bug
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Many-to-many links between work items for traceability (FM schema)
export const workItemLinks = fmSchema.table("work_item_links", {
  id: varchar("id").primaryKey(), // Auto-generated
  sourceId: varchar("source_id").notNull(), // FK to work_items
  targetId: varchar("target_id").notNull(), // FK to work_items
  linkType: varchar("link_type", { length: 20 }).notNull(), // traces_to, blocks, duplicates, relates_to, parent_of
  createdAt: timestamp("created_at").defaultNow(),
});

// Test Runs - a grouping of test case executions against a specific build (FM schema)
export const testRuns = fmSchema.table("test_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appId: text("app_id").references(() => fmApps.id),
  runNumber: integer("run_number").notNull(), // Test Run 1, 2, 3...
  name: text("name"), // Optional descriptive name
  date: text("date").notNull(), // Execution date
  testers: jsonb("testers").notNull().default([]), // Array of tester names
  buildInfo: text("build_info"), // Version/build identifier
  notes: text("notes"), // Additional notes about the run
  status: varchar("status", { length: 20 }).notNull().default("in_progress"), // in_progress, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Test Run Results - individual test case outcomes within a test run (FM schema)
export const testRunResults = fmSchema.table("test_run_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appId: text("app_id").references(() => fmApps.id),
  testRunId: varchar("test_run_id").references(() => testRuns.id).notNull(),
  testCaseId: varchar("test_case_id").notNull(), // Work item ID of the test case
  outcome: varchar("outcome", { length: 20 }).notNull(), // passed, failed, blocked, skipped
  notes: text("notes"), // Execution notes
  executedBy: varchar("executed_by", { length: 100 }), // Which tester executed this specific case
  executedAt: timestamp("executed_at"), // When this specific test was executed
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for requirements types
const functionalRequirementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

const acceptanceCriteriaSchema = z.object({
  id: z.string(),
  description: z.string(),
  parentFrId: z.string().optional(),
});

const dataModelFieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  mandatory: z.boolean(),
  defaultValue: z.string().optional(),
  listOfValues: z.array(z.string()).optional(),
  description: z.string().optional(),
});

// Insert schemas for requirements
export const insertPageRequirementsSchema = createInsertSchema(pageRequirements)
  .omit({ createdAt: true, updatedAt: true })
  .extend({
    section: z.enum(["home", "team", "club", "devops"]),
    functionalRequirements: z.array(functionalRequirementSchema),
    acceptanceCriteria: z.array(acceptanceCriteriaSchema),
  });

export const insertDataModelSchema = createInsertSchema(dataModels)
  .omit({ createdAt: true, updatedAt: true })
  .extend({
    fields: z.array(dataModelFieldSchema),
  });

export const insertChangeLogSchema = createInsertSchema(changeLog)
  .omit({ createdAt: true, updatedAt: true })
  .extend({
    type: z.enum(["added", "removed", "changed", "fixed", "bug", "enhancement", "question", "action_item"]),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  });

// Work Item schemas
export const workItemTypeEnum = z.enum([
  "epoch", "epic", "feature", "story", 
  "bug", "enhancement", "test_case", 
  "question", "action_item"
]);

export const workItemStatusEnum = z.enum([
  "new", "defined", "rejected", "dev", "qc", "complete",
  // Legacy values for backward compatibility
  "draft", "open", "resolved", "closed", "in_progress",
  // Test case specific
  "passed", "failed", "partial", "blocked"
]);

export const sectionTypeEnum = z.enum([
  "section", "tab", "nested-tab", "modal", "drawer", "dropdown"
]);

export const sizeEnum = z.enum(["S", "M", "L", "XL"]);

export const workItemPriorityEnum = z.enum(["low", "medium", "high", "critical"]);

export const workItemLinkTypeEnum = z.enum([
  "traces_to", "blocks", "duplicates", "relates_to", "parent_of"
]);

export const insertWorkItemSchema = createInsertSchema(workItems)
  .omit({ createdAt: true, updatedAt: true })
  .extend({
    type: workItemTypeEnum,
    status: workItemStatusEnum.optional(),
    priority: workItemPriorityEnum.nullish(),
    size: sizeEnum.nullish(),
    sectionType: sectionTypeEnum.nullish(),
    steps: z.array(z.string()).nullish(),
  });

// FM App schemas
export const insertFmAppSchema = createInsertSchema(fmApps)
  .omit({ createdAt: true, updatedAt: true });

// FM Widget schemas  
export const insertFmWidgetSchema = createInsertSchema(fmWidgets)
  .omit({ createdAt: true, updatedAt: true })
  .extend({
    dataModels: z.array(z.string()).optional(),
    props: z.array(z.string()).optional(),
    events: z.array(z.string()).optional(),
  });

export const insertWorkItemLinkSchema = createInsertSchema(workItemLinks)
  .omit({ createdAt: true })
  .extend({
    linkType: workItemLinkTypeEnum,
  });

// Types for requirements
export type PageRequirementRecord = typeof pageRequirements.$inferSelect;
export type DataModel = typeof dataModels.$inferSelect;
export type ChangeLog = typeof changeLog.$inferSelect;

export type InsertPageRequirement = z.infer<typeof insertPageRequirementsSchema>;
export type InsertDataModel = z.infer<typeof insertDataModelSchema>;
export type InsertChangeLog = z.infer<typeof insertChangeLogSchema>;

// Legacy aliases for backward compatibility
export type DevopsDataModel = DataModel;
export type DevopsChangeLog = ChangeLog;
export type InsertDevopsDataModel = InsertDataModel;
export type InsertDevopsChangeLog = InsertChangeLog;

// Work Item types
export type WorkItem = typeof workItems.$inferSelect;
export type WorkItemLink = typeof workItemLinks.$inferSelect;
export type InsertWorkItem = z.infer<typeof insertWorkItemSchema>;
export type InsertWorkItemLink = z.infer<typeof insertWorkItemLinkSchema>;
export type WorkItemType = z.infer<typeof workItemTypeEnum>;
export type WorkItemStatus = z.infer<typeof workItemStatusEnum>;
export type WorkItemPriority = z.infer<typeof workItemPriorityEnum>;
export type WorkItemLinkType = z.infer<typeof workItemLinkTypeEnum>;
export type SectionType = z.infer<typeof sectionTypeEnum>;
export type Size = z.infer<typeof sizeEnum>;

// FM App types
export type FmApp = typeof fmApps.$inferSelect;
export type InsertFmApp = z.infer<typeof insertFmAppSchema>;

// FM Widget types
export type FmWidget = typeof fmWidgets.$inferSelect;
export type InsertFmWidget = z.infer<typeof insertFmWidgetSchema>;

// Test Run schemas
export const testRunStatusEnum = z.enum(["in_progress", "completed"]);
export const testRunOutcomeEnum = z.enum(["passed", "failed", "blocked", "skipped"]);

export const insertTestRunSchema = createInsertSchema(testRuns)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    testers: z.array(z.string()),
    status: testRunStatusEnum.optional(),
  });

export const insertTestRunResultSchema = createInsertSchema(testRunResults)
  .omit({ id: true, createdAt: true })
  .extend({
    outcome: testRunOutcomeEnum,
  });

// Test Run types
export type TestRun = typeof testRuns.$inferSelect;
export type TestRunResult = typeof testRunResults.$inferSelect;
export type InsertTestRun = z.infer<typeof insertTestRunSchema>;
export type InsertTestRunResult = z.infer<typeof insertTestRunResultSchema>;
export type TestRunStatus = z.infer<typeof testRunStatusEnum>;
export type TestRunOutcome = z.infer<typeof testRunOutcomeEnum>;
