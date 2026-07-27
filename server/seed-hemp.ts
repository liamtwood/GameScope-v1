/**
 * Seed script: Lauren Hemp FBref career data
 *
 * Sources:
 *   - Seasonal aggregates: "Standard Stats: Domestic Leagues" (FBref WSL export)
 *   - Match logs: "2024-2025 Match Logs (Summary)" (FBref)
 *
 * Run once via:  npx tsx server/seed-hemp.ts
 *
 * The script is idempotent — it checks for existing rows before inserting.
 */

import { db } from './db';
import { users, playerSeasonStats, playerMatchLogs } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

// ── Lauren Hemp player identity ─────────────────────────────────────────────

async function findOrCreateLaurenHemp(): Promise<string> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.firstName, 'Lauren'), eq(users.lastName, 'Hemp')))
    .limit(1);

  if (existing.length > 0) {
    console.log('[seed-hemp] Found existing Lauren Hemp record:', existing[0].id);
    return existing[0].id;
  }

  console.log('[seed-hemp] Creating Lauren Hemp user record…');
  const [created] = await db
    .insert(users)
    .values({
      firstName: 'Lauren',
      lastName: 'Hemp',
      role: 'Player',
      status: 'Active',
      gender: 'Female',
    })
    .returning({ id: users.id });

  console.log('[seed-hemp] Created Lauren Hemp:', created.id);
  return created.id;
}

// ── Season stats ─────────────────────────────────────────────────────────────
// Columns: season, clubName, competition, leagueRank, mp, starts, min, nineties,
//          goals, assists, g_a, g_minus_pk, pk, pk_att, yellow_cards, red_cards,
//          gls_per90, ast_per90, g_a_per90, g_minus_pk_per90, g_a_minus_pk_per90

interface SeasonRow {
  season: string;
  clubName: string;
  competition: string;
  leagueRank: string;
  stats: Record<string, number>;
}

const HEMP_SEASON_STATS: SeasonRow[] = [
  {
    season: '2017',
    clubName: 'Bristol City',
    competition: 'WSL 1',
    leagueRank: '8th',
    stats: { mp: 4, starts: 3, min_played: 278, nineties: 3.1, goals: 1, assists: 0, g_a: 1, g_minus_pk: 1, pk: 0, pk_att: 0, yellow_cards: 0, red_cards: 0, gls_per90: 0.32, ast_per90: 0.00, g_a_per90: 0.32, g_minus_pk_per90: 0.32, g_a_minus_pk_per90: 0.32 },
  },
  {
    season: '2017-2018',
    clubName: 'Bristol City',
    competition: 'WSL 1',
    leagueRank: '8th',
    stats: { mp: 18, starts: 18, min_played: 1619, nineties: 18.0, goals: 7, assists: 0, g_a: 7, g_minus_pk: 6, pk: 1, pk_att: 2, yellow_cards: 3, red_cards: 0, gls_per90: 0.39, ast_per90: 0.00, g_a_per90: 0.39, g_minus_pk_per90: 0.33, g_a_minus_pk_per90: 0.33 },
  },
  {
    season: '2018-2019',
    clubName: 'Manchester City',
    competition: 'WSL',
    leagueRank: '2nd',
    stats: { mp: 10, starts: 7, min_played: 603, nineties: 6.7, goals: 2, assists: 1, g_a: 3, g_minus_pk: 2, pk: 0, pk_att: 0, yellow_cards: 1, red_cards: 0, gls_per90: 0.30, ast_per90: 0.15, g_a_per90: 0.45, g_minus_pk_per90: 0.30, g_a_minus_pk_per90: 0.45 },
  },
  {
    season: '2019-2020',
    clubName: 'Manchester City',
    competition: 'WSL',
    leagueRank: '2nd',
    stats: { mp: 14, starts: 13, min_played: 1134, nineties: 12.6, goals: 5, assists: 5, g_a: 10, g_minus_pk: 5, pk: 0, pk_att: 0, yellow_cards: 2, red_cards: 0, gls_per90: 0.40, ast_per90: 0.40, g_a_per90: 0.79, g_minus_pk_per90: 0.40, g_a_minus_pk_per90: 0.79 },
  },
  {
    season: '2020-2021',
    clubName: 'Manchester City',
    competition: 'WSL',
    leagueRank: '2nd',
    stats: { mp: 15, starts: 13, min_played: 1057, nineties: 11.7, goals: 6, assists: 8, g_a: 14, g_minus_pk: 6, pk: 0, pk_att: 0, yellow_cards: 0, red_cards: 0, gls_per90: 0.51, ast_per90: 0.68, g_a_per90: 1.19, g_minus_pk_per90: 0.51, g_a_minus_pk_per90: 1.19 },
  },
  {
    season: '2021-2022',
    clubName: 'Manchester City',
    competition: 'WSL',
    leagueRank: '3rd',
    stats: { mp: 22, starts: 20, min_played: 1733, nineties: 19.3, goals: 10, assists: 6, g_a: 16, g_minus_pk: 10, pk: 0, pk_att: 0, yellow_cards: 1, red_cards: 0, gls_per90: 0.52, ast_per90: 0.31, g_a_per90: 0.83, g_minus_pk_per90: 0.52, g_a_minus_pk_per90: 0.83 },
  },
  {
    season: '2022-2023',
    clubName: 'Manchester City',
    competition: 'WSL',
    leagueRank: '4th',
    stats: { mp: 20, starts: 20, min_played: 1674, nineties: 18.6, goals: 7, assists: 6, g_a: 13, g_minus_pk: 7, pk: 0, pk_att: 0, yellow_cards: 2, red_cards: 0, gls_per90: 0.38, ast_per90: 0.32, g_a_per90: 0.70, g_minus_pk_per90: 0.38, g_a_minus_pk_per90: 0.70 },
  },
  {
    season: '2023-2024',
    clubName: 'Manchester City',
    competition: 'WSL',
    leagueRank: '2nd',
    stats: { mp: 21, starts: 19, min_played: 1746, nineties: 19.4, goals: 11, assists: 8, g_a: 19, g_minus_pk: 11, pk: 0, pk_att: 0, yellow_cards: 4, red_cards: 1, gls_per90: 0.57, ast_per90: 0.41, g_a_per90: 0.98, g_minus_pk_per90: 0.57, g_a_minus_pk_per90: 0.98 },
  },
  {
    season: '2024-2025',
    clubName: 'Manchester City',
    competition: 'WSL',
    leagueRank: '4th',
    stats: { mp: 10, starts: 9, min_played: 726, nineties: 8.1, goals: 2, assists: 8, g_a: 10, g_minus_pk: 2, pk: 0, pk_att: 0, yellow_cards: 1, red_cards: 0, gls_per90: 0.25, ast_per90: 0.99, g_a_per90: 1.24, g_minus_pk_per90: 0.25, g_a_minus_pk_per90: 1.24 },
  },
  {
    season: '2025-2026',
    clubName: 'Manchester City',
    competition: 'WSL',
    leagueRank: '1st',
    stats: { mp: 18, starts: 17, min_played: 1379, nineties: 15.3, goals: 1, assists: 6, g_a: 7, g_minus_pk: 1, pk: 0, pk_att: 0, yellow_cards: 0, red_cards: 0, gls_per90: 0.07, ast_per90: 0.39, g_a_per90: 0.46, g_minus_pk_per90: 0.07, g_a_minus_pk_per90: 0.46 },
  },
];

async function seedSeasonStats(playerId: string): Promise<void> {
  const existing = await db
    .select({ id: playerSeasonStats.id })
    .from(playerSeasonStats)
    .where(eq(playerSeasonStats.playerId, playerId));

  if (existing.length > 0) {
    console.log(`[seed-hemp] Season stats already seeded (${existing.length} rows) — skipping`);
    return;
  }

  console.log(`[seed-hemp] Inserting ${HEMP_SEASON_STATS.length} season-stats rows…`);
  for (const row of HEMP_SEASON_STATS) {
    await db.insert(playerSeasonStats).values({
      playerId,
      season: row.season,
      clubName: row.clubName,
      competition: row.competition,
      leagueRank: row.leagueRank,
      source: 'fbref',
      stats: row.stats,
    });
  }
  console.log('[seed-hemp] Season stats seeded.');
}

// ── Match logs ────────────────────────────────────────────────────────────────
// Source: 2024-2025 Match Logs (Summary)
// Columns: matchDate, competition, clubName, opponent, venue, result,
//          + stats: min_played, goals, assists, pk, pk_att, shots,
//                   shots_on_target, yellow_cards, red_cards, fouls_committed,
//                   fouls_won, offsides, crosses, tackles_won, interceptions,
//                   own_goals, pk_won, pk_conceded

interface MatchLogRow {
  matchDate: string; // ISO date
  competition: string;
  clubName: string;
  opponent: string;
  venue: string; // Home | Away | Neutral
  result: string;
  stats: Record<string, number>;
}

// null values represented as -1 are omitted from stats (no data available)
function s(
  minPlayed: number,
  goals: number,
  assists: number,
  pk: number,
  pkAtt: number,
  shots: number | null,
  shotsOnTarget: number | null,
  yellowCards: number,
  redCards: number,
  foulsCommitted: number | null,
  foulsWon: number | null,
  offsides: number | null,
  crosses: number | null,
  tacklesWon: number | null,
  interceptions: number | null,
  ownGoals: number | null,
  pkWon: number | null,
  pkConceded: number | null,
): Record<string, number> {
  const result: Record<string, number> = {
    min_played: minPlayed,
    goals,
    assists,
    pk,
    pk_att: pkAtt,
    yellow_cards: yellowCards,
    red_cards: redCards,
  };
  if (shots != null)          result.shots = shots;
  if (shotsOnTarget != null)  result.shots_on_target = shotsOnTarget;
  if (foulsCommitted != null) result.fouls_committed = foulsCommitted;
  if (foulsWon != null)       result.fouls_won = foulsWon;
  if (offsides != null)       result.offsides = offsides;
  if (crosses != null)        result.crosses = crosses;
  if (tacklesWon != null)     result.tackles_won = tacklesWon;
  if (interceptions != null)  result.interceptions = interceptions;
  if (ownGoals != null)       result.own_goals = ownGoals;
  if (pkWon != null)          result.pk_won = pkWon;
  if (pkConceded != null)     result.pk_conceded = pkConceded;
  return result;
}

const HEMP_MATCH_LOGS_2024_25: MatchLogRow[] = [
  // Date       Comp               Club        Opponent            Venue   Result
  // England international appearances (UEFA Euro qualifying)
  { matchDate: '2024-07-12', competition: 'UEFA Euro qual.',  clubName: 'England',        opponent: 'Rep. of Ireland', venue: 'Home',    result: 'W 2–1', stats: s(87, 0, 0, 0, 0, null, null, 0, 0, null, null, null, null, null, null, null, null, null) },
  { matchDate: '2024-07-16', competition: 'UEFA Euro qual.',  clubName: 'England',        opponent: 'Sweden',          venue: 'Away',    result: 'D 0–0', stats: s(89, 0, 0, 0, 0, null, null, 0, 0, null, null, null, null, null, null, null, null, null) },
  // Manchester City club appearances
  { matchDate: '2024-09-18', competition: 'Champions Lg',    clubName: 'Manchester City', opponent: 'Paris FC',        venue: 'Away',    result: 'W 5–0', stats: s(78, 0, 1, 0, 0, null, null, 0, 0, null, null, null, null, null, null, null, null, null) },
  { matchDate: '2024-09-22', competition: 'WSL',             clubName: 'Manchester City', opponent: 'Arsenal',         venue: 'Away',    result: 'D 2–2', stats: s(90, 0, 0, 0, 0, 1, 1, 1, 0, 2, 1, 2, 4, 0, 2, 0, null, null) },
  { matchDate: '2024-09-29', competition: 'WSL',             clubName: 'Manchester City', opponent: 'Brighton',        venue: 'Home',    result: 'W 1–0', stats: s(90, 0, 0, 0, 0, 4, 2, 0, 0, 0, 1, 2, 10, 1, 0, 0, null, null) },
  { matchDate: '2024-10-06', competition: 'WSL',             clubName: 'Manchester City', opponent: 'West Ham',        venue: 'Home',    result: 'W 2–0', stats: s(69, 1, 0, 0, 0, 6, 3, 0, 0, 0, 1, 0, 2, 0, 2, 0, null, null) },
  { matchDate: '2024-10-09', competition: 'Champions Lg',    clubName: 'Manchester City', opponent: 'Barcelona',       venue: 'Home',    result: 'W 2–0', stats: s(90, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 2, 8, 6, 2, 0, null, null) },
  { matchDate: '2024-10-13', competition: 'WSL',             clubName: 'Manchester City', opponent: 'Liverpool',       venue: 'Away',    result: 'W 2–1', stats: s(90, 0, 1, 0, 0, 3, 0, 0, 0, 2, 0, 0, 12, 0, 0, 0, null, null) },
  { matchDate: '2024-10-16', competition: 'Champions Lg',    clubName: 'Manchester City', opponent: 'St. Pölten',      venue: 'Neutral', result: 'W 3–2', stats: s(28, 0, 1, 0, 0, 2, 0, 0, 0, 0, 1, 0, 2, 0, 1, 0, null, null) },
  { matchDate: '2024-10-20', competition: 'WSL',             clubName: 'Manchester City', opponent: 'Aston Villa',     venue: 'Home',    result: 'W 2–1', stats: s(90, 1, 1, 0, 0, 5, 5, 0, 0, 1, 5, 1, 8, 1, 1, 0, null, null) },
  { matchDate: '2024-11-03', competition: 'WSL',             clubName: 'Manchester City', opponent: 'Crystal Palace',  venue: 'Away',    result: 'W 3–0', stats: s(58, 0, 0, 0, 0, 3, 0, 0, 0, 0, 2, 0, 11, 0, 0, 0, null, null) },
  { matchDate: '2024-11-08', competition: 'WSL',             clubName: 'Manchester City', opponent: 'Tottenham',       venue: 'Home',    result: 'W 4–0', stats: s(77, 0, 3, 0, 0, 3, 1, 0, 0, 0, 0, 0, 7, 0, 1, 0, null, null) },
  { matchDate: '2025-04-27', competition: 'WSL',             clubName: 'Manchester City', opponent: 'Leicester City',  venue: 'Away',    result: 'W 1–0', stats: s(31, 0, 1, 0, 0, 2, 1, 0, 0, 1, 1, 0, 3, 0, 0, 0, null, null) },
  { matchDate: '2025-05-04', competition: 'WSL',             clubName: 'Manchester City', opponent: 'Manchester Utd',  venue: 'Away',    result: 'D 2–2', stats: s(64, 0, 1, 0, 0, 2, 2, 0, 0, 1, 2, 0, 6, 0, 0, 0, null, null) },
  { matchDate: '2025-05-10', competition: 'WSL',             clubName: 'Manchester City', opponent: 'Crystal Palace',  venue: 'Home',    result: 'W 5–2', stats: s(67, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 2, 12, 0, 1, 0, null, null) },
];

async function seedMatchLogs(playerId: string): Promise<void> {
  const existing = await db
    .select({ id: playerMatchLogs.id })
    .from(playerMatchLogs)
    .where(eq(playerMatchLogs.playerId, playerId));

  if (existing.length > 0) {
    console.log(`[seed-hemp] Match logs already seeded (${existing.length} rows) — skipping`);
    return;
  }

  console.log(`[seed-hemp] Inserting ${HEMP_MATCH_LOGS_2024_25.length} match-log rows…`);
  for (const row of HEMP_MATCH_LOGS_2024_25) {
    await db.insert(playerMatchLogs).values({
      playerId,
      matchDate: new Date(row.matchDate),
      competition: row.competition,
      clubName: row.clubName,
      opponent: row.opponent,
      venue: row.venue,
      result: row.result,
      source: 'fbref',
      stats: row.stats,
    });
  }
  console.log('[seed-hemp] Match logs seeded.');
}

// ── Entry point ───────────────────────────────────────────────────────────────

export async function seedHempData(): Promise<void> {
  const playerId = await findOrCreateLaurenHemp();
  await seedSeasonStats(playerId);
  await seedMatchLogs(playerId);
  console.log('[seed-hemp] Done.');
}

// Allow direct execution: npx tsx server/seed-hemp.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  seedHempData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[seed-hemp] Fatal error:', err);
      process.exit(1);
    });
}
