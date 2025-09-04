import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const clubs = pgTable("clubs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  shortName: text("short_name").notNull().default("PSC"),
  owner: text("owner").notNull(),
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
  coach: text("coach"),
  assistantCoach: text("assistant_coach"),
  ageGroup: text("age_group"),
  gender: varchar("gender", { length: 20 }),
  season: varchar("season", { length: 20 }),
  seasonStartMonth: varchar("season_start_month", { length: 20 }).default("inherit"), // inherit from club
  colors: jsonb("colors"), // Primary and secondary team colors
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
  competition: text("competition"),
  notes: text("notes"),
  hasVideo: boolean("has_video").default(false),
  videoLinks: jsonb("video_links"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const oppositionTeams = pgTable("opposition_teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  shortName: varchar("short_name", { length: 10 }),
  logoPath: text("logo_path"),
  websiteUrl: text("website_url"),
  colors: jsonb("colors"), // Primary and secondary team colors
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const competitions = pgTable("competitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  shortName: varchar("short_name", { length: 10 }),
  logoPath: text("logo_path"),
  seasonStartMonth: varchar("season_start_month", { length: 20 }).default("inherit"), // inherit from team
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
  
  // Contact Information
  email: text("email"),
  phone: text("phone"),
  emergencyContact: text("emergency_contact"),
  emergencyContactPhone: text("emergency_contact_phone"),
  
  // Account Information
  role: varchar("role", { length: 20 }).notNull().default("player"), // Player, Coach, Admin, Parent
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

// Insert schemas
export const insertClubSchema = createInsertSchema(clubs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    email: z.string().email().optional().or(z.literal("")),
    gender: z.enum(["Male", "Female", "Other"]).optional(),
    dateOfBirth: z.string().or(z.date()).transform((val) => val ? new Date(val) : undefined).optional(),
    role: z.enum(["player", "Player", "coach", "Coach", "admin", "Admin", "parent", "Parent"]).default("Player"),
    status: z.enum(["draft", "Draft", "active", "Active", "suspended", "Suspended", "retired", "Retired"]).default("Draft"),
  });
export const insertUserTeamSchema = createInsertSchema(userTeams).omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    position: z.enum(["Goalkeeper", "Defender", "Midfield", "Forward"]),
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
export const insertCompetitionSchema = createInsertSchema(competitions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFixtureSchema = createInsertSchema(fixtures)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    date: z.string().or(z.date()).transform((val) => new Date(val))
  });
export const insertMatchStatsSchema = createInsertSchema(matchStats).omit({ id: true, createdAt: true });

// Types
export type Club = typeof clubs.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type UserTeam = typeof userTeams.$inferSelect;
export type UserParent = typeof userParents.$inferSelect;
export type OppositionTeam = typeof oppositionTeams.$inferSelect;
export type Competition = typeof competitions.$inferSelect;
export type Fixture = typeof fixtures.$inferSelect;
export type MatchStats = typeof matchStats.$inferSelect;
export type User = typeof users.$inferSelect;

export type InsertClub = z.infer<typeof insertClubSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertUserTeam = z.infer<typeof insertUserTeamSchema>;
export type InsertUserParent = z.infer<typeof insertUserParentSchema>;
export type InsertOppositionTeam = z.infer<typeof insertOppositionTeamSchema>;
export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type InsertFixture = z.infer<typeof insertFixtureSchema>;
export type InsertMatchStats = z.infer<typeof insertMatchStatsSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
