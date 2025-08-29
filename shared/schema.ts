import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  year: varchar("year", { length: 20 }),
  hometown: text("hometown"),
  height: varchar("height", { length: 10 }),
  goals: integer("goals").default(0),
  assists: integer("assists").default(0),
  appearances: integer("appearances").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fixtures = pgTable("fixtures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").references(() => teams.id).notNull(),
  opponent: text("opponent").notNull(),
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
  totalTeamDistance: integer("total_team_distance"),
  possession: integer("possession"),
  goals: integer("goals"),
  shotsAttempted: integer("shots_attempted"),
  shotsOnTarget: integer("shots_on_target"),
  runsIntoBoxes: integer("runs_into_boxes"),
  corners: integer("corners"),
  dangerousCrosses: integer("dangerous_crosses"),
  dribbles: integer("dribbles"),
  penetratingDribbles: integer("penetrating_dribbles"),
  takeOns: integer("take_ons"),
  firstTouchSuccess: integer("first_touch_success"),
  firstTouchSuccessRate: integer("first_touch_success_rate"),
  tackles: integer("tackles"),
  freeKicks: integer("free_kicks"),
  offsides: integer("offsides"),
  passesAttempted: integer("passes_attempted"),
  passesSuccess: integer("passes_success"),
  passingSuccessRate: integer("passing_success_rate"),
  passingTotalDistance: integer("passing_total_distance"),
  passingAverageDistance: integer("passing_average_distance"),
  passingAverageVelocity: integer("passing_average_velocity"),
  createdAt: timestamp("created_at").defaultNow(),
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
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPlayerSchema = createInsertSchema(players).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFixtureSchema = createInsertSchema(fixtures).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMatchStatsSchema = createInsertSchema(matchStats).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

// Types
export type Team = typeof teams.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Fixture = typeof fixtures.$inferSelect;
export type MatchStats = typeof matchStats.$inferSelect;
export type User = typeof users.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertFixture = z.infer<typeof insertFixtureSchema>;
export type InsertMatchStats = z.infer<typeof insertMatchStatsSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
