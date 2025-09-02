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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").references(() => teams.id).notNull(),
  name: text("name").notNull(),
  position: varchar("position", { length: 10 }).notNull(),
  jerseyNumber: integer("jersey_number").notNull(),
  hometown: text("hometown"),
  status: varchar("status", { length: 20 }).default("Fit"),
  goals: integer("goals").default(0),
  assists: integer("assists").default(0),
  appearances: integer("appearances").default(0),
  keyPlayer: boolean("key_player").default(false),
  // Account fields
  email: text("email"),
  gender: varchar("gender", { length: 10 }), // Male or Female
  dateOfBirth: timestamp("date_of_birth"),
  accountStatus: varchar("account_status", { length: 20 }).default("Draft"), // Draft, Active, Suspended, Retired
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const competitions = pgTable("competitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  shortName: varchar("short_name", { length: 10 }),
  logoPath: text("logo_path"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("player"), // admin, coach, player
  teamId: varchar("team_id").references(() => teams.id),
  name: text("name"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertClubSchema = createInsertSchema(clubs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPlayerSchema = createInsertSchema(players)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    email: z.string().email().optional().or(z.literal("")),
    gender: z.enum(["Male", "Female"]).optional(),
    dateOfBirth: z.string().or(z.date()).transform((val) => val ? new Date(val) : undefined).optional(),
    accountStatus: z.enum(["Draft", "Active", "Suspended", "Retired"]).optional(),
  });
export const insertOppositionTeamSchema = createInsertSchema(oppositionTeams).omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    websiteUrl: z.string().url().optional().or(z.literal("")),
  });
export const insertCompetitionSchema = createInsertSchema(competitions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFixtureSchema = createInsertSchema(fixtures)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    date: z.string().or(z.date()).transform((val) => new Date(val))
  });
export const insertMatchStatsSchema = createInsertSchema(matchStats).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

// Types
export type Club = typeof clubs.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Player = typeof players.$inferSelect;
export type OppositionTeam = typeof oppositionTeams.$inferSelect;
export type Competition = typeof competitions.$inferSelect;
export type Fixture = typeof fixtures.$inferSelect;
export type MatchStats = typeof matchStats.$inferSelect;
export type User = typeof users.$inferSelect;

export type InsertClub = z.infer<typeof insertClubSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertOppositionTeam = z.infer<typeof insertOppositionTeamSchema>;
export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type InsertFixture = z.infer<typeof insertFixtureSchema>;
export type InsertMatchStats = z.infer<typeof insertMatchStatsSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
