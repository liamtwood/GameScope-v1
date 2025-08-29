import { randomUUID } from 'crypto';
import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  teams,
  players,
  fixtures,
  oppositionTeams,
  matchStats,
  users,
  type Team,
  type Player,
  type Fixture,
  type OppositionTeam,
  type MatchStats,
  type User,
  type InsertTeam,
  type InsertPlayer,
  type InsertFixture,
  type InsertOppositionTeam,
  type InsertMatchStats,
  type InsertUser,
} from '@shared/schema';

export interface IStorage {
  // Team operations
  getTeams(): Promise<Team[]>;
  getTeam(id: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, team: Partial<InsertTeam>): Promise<Team>;
  
  // Player operations
  getPlayers(teamId?: string): Promise<Player[]>;
  getPlayer(id: string): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: string, player: Partial<InsertPlayer>): Promise<Player>;
  deletePlayer(id: string): Promise<void>;
  
  // Opposition team operations
  getOppositionTeams(): Promise<OppositionTeam[]>;
  getOppositionTeam(id: string): Promise<OppositionTeam | undefined>;
  getOrCreateOppositionTeam(name: string): Promise<OppositionTeam>;
  createOppositionTeam(team: InsertOppositionTeam): Promise<OppositionTeam>;
  updateOppositionTeam(id: string, team: Partial<InsertOppositionTeam>): Promise<OppositionTeam>;
  deleteOppositionTeam(id: string): Promise<void>;
  
  // Fixture operations
  getFixtures(teamId?: string): Promise<Fixture[]>;
  getFixture(id: string): Promise<Fixture | undefined>;
  createFixture(fixture: InsertFixture): Promise<Fixture>;
  updateFixture(id: string, fixture: Partial<InsertFixture>): Promise<Fixture>;
  deleteFixture(id: string): Promise<void>;
  
  // Match stats operations
  getMatchStats(fixtureId: string): Promise<MatchStats[]>;
  createMatchStats(stats: InsertMatchStats): Promise<MatchStats>;
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    // Check if data already exists
    const existingTeams = await db.select().from(teams);
    if (existingTeams.length > 0) {
      return; // Data already exists
    }

    // Initialize with sample team
    const teamId = randomUUID();
    const team: Team = {
      id: teamId,
      name: "WOMEN'S SOCCER",
      shortName: "WSC",
      status: "ACTIVE",
      coach: "Dee Shivraman",
      assistantCoach: "Brian McNulty",
      ageGroup: "College",
      gender: "Women",
      season: "2024/25",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(teams).values(team);

    // Initialize sample players
    const samplePlayers = [
      { name: 'Kati Nikel', position: 'GK', jerseyNumber: 0, year: 'Sophomore', hometown: 'Tampa, FL', height: '5\'8"', goals: 0, assists: 0, appearances: 6 },
      { name: 'Ashley Miller', position: 'GK', jerseyNumber: 1, year: 'Freshman', hometown: 'Orlando, FL', height: '5\'7"', goals: 0, assists: 0, appearances: 2 },
      { name: 'Lulu Vester', position: 'CB', jerseyNumber: 2, year: 'Senior', hometown: 'Miami, FL', height: '5\'6"', goals: 1, assists: 2, appearances: 6 },
      { name: 'Paula Cortijo', position: 'CB', jerseyNumber: 3, year: 'Junior', hometown: 'Jacksonville, FL', height: '5\'7"', goals: 0, assists: 1, appearances: 6 },
      { name: 'Kaylin Allen', position: 'LB', jerseyNumber: 4, year: 'Sophomore', hometown: 'Gainesville, FL', height: '5\'5"', goals: 2, assists: 3, appearances: 6 },
      { name: 'Riley Whale', position: 'RB', jerseyNumber: 5, year: 'Freshman', hometown: 'St. Petersburg, FL', height: '5\'4"', goals: 1, assists: 4, appearances: 5 },
      { name: 'Sofia Salas', position: 'CAM', jerseyNumber: 18, year: 'Junior', hometown: 'Sarasota, FL', height: '5\'7"', goals: 4, assists: 6, appearances: 6 },
      { name: 'Janessa Crespo', position: 'ST', jerseyNumber: 9, year: 'Senior', hometown: 'West Palm Beach, FL', height: '5\'8"', goals: 12, assists: 3, appearances: 6 },
      { name: 'Marie Narewski', position: 'LW', jerseyNumber: 10, year: 'Junior', hometown: 'Fort Myers, FL', height: '5\'5"', goals: 8, assists: 5, appearances: 6 },
      { name: 'Alex Van Lare', position: 'CF', jerseyNumber: 99, year: 'Junior', hometown: 'Ocala, FL', height: '5\'8"', goals: 9, assists: 4, appearances: 6 }
    ];

    const playerInserts = samplePlayers.map(playerData => ({
      id: randomUUID(),
      teamId,
      ...playerData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(players).values(playerInserts);

    // Initialize sample fixtures
    const sampleFixtures = [
      {
        opponent: 'Millennia Atlantic University',
        date: new Date('2025-08-22T16:00:00'),
        venue: 'Polk State Soccer Field',
        type: 'HOME' as const,
        status: 'COMPLETED' as const,
        homeScore: 8,
        awayScore: 0,
        competition: 'FCSAA League',
        hasVideo: true,
        videoLinks: null,
      },
      {
        opponent: 'Monroe University',
        date: new Date('2025-08-24T10:00:00'),
        venue: 'Polk State Soccer Field',
        type: 'HOME' as const,
        status: 'NO_CONTEST' as const,
        homeScore: null,
        awayScore: null,
        competition: 'FCSAA League',
        notes: 'No contest after 62 minutes due to field conditions',
        hasVideo: false,
        videoLinks: null,
      },
      {
        opponent: 'Montgomery College (MD)',
        date: new Date('2025-08-29T16:00:00'),
        venue: 'Polk State Soccer Field',
        type: 'HOME' as const,
        status: 'SCHEDULED' as const,
        competition: 'FCSAA League',
        hasVideo: false,
        videoLinks: null,
      },
      {
        opponent: 'Webber International University JV',
        date: new Date('2025-09-03T16:00:00'),
        venue: 'Polk State Soccer Field',
        type: 'HOME' as const,
        status: 'SCHEDULED' as const,
        competition: 'FCSAA League',
        hasVideo: false,
        videoLinks: null,
      }
    ];

    const fixtureInserts = sampleFixtures.map(fixtureData => ({
      id: randomUUID(),
      teamId,
      ...fixtureData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(fixtures).values(fixtureInserts);

    // Initialize sample user
    const user: User = {
      id: randomUUID(),
      username: 'coach',
      password: 'password',
      role: 'coach',
      teamId,
      name: 'Dee Shivraman',
      email: 'dee.shivraman@polk.edu',
      createdAt: new Date(),
    };

    await db.insert(users).values(user);
  }

  // Team operations
  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const newTeam: Team = {
      ...team,
      id,
      status: team.status || 'active',
      coach: team.coach || null,
      assistantCoach: team.assistantCoach || null,
      ageGroup: team.ageGroup || null,
      gender: team.gender || null,
      season: team.season || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(teams).values(newTeam);
    return newTeam;
  }

  async updateTeam(id: string, team: Partial<InsertTeam>): Promise<Team> {
    const updated = {
      ...team,
      updatedAt: new Date(),
    };
    
    await db.update(teams).set(updated).where(eq(teams.id, id));
    
    const [updatedTeam] = await db.select().from(teams).where(eq(teams.id, id));
    if (!updatedTeam) throw new Error('Team not found');
    
    return updatedTeam;
  }

  // Player operations
  async getPlayers(teamId?: string): Promise<Player[]> {
    if (teamId) {
      return await db.select().from(players).where(eq(players.teamId, teamId));
    }
    return await db.select().from(players);
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player;
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const newPlayer: Player = {
      ...player,
      id,
      height: player.height || null,
      year: player.year || null,
      hometown: player.hometown || null,
      goals: player.goals || null,
      assists: player.assists || null,
      appearances: player.appearances || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(players).values(newPlayer);
    return newPlayer;
  }

  async updatePlayer(id: string, player: Partial<InsertPlayer>): Promise<Player> {
    const updated = {
      ...player,
      updatedAt: new Date(),
    };
    
    await db.update(players).set(updated).where(eq(players.id, id));
    
    const [updatedPlayer] = await db.select().from(players).where(eq(players.id, id));
    if (!updatedPlayer) throw new Error('Player not found');
    
    return updatedPlayer;
  }

  async deletePlayer(id: string): Promise<void> {
    await db.delete(players).where(eq(players.id, id));
  }

  // Fixture operations
  async getFixtures(teamId?: string): Promise<Fixture[]> {
    if (teamId) {
      return await db.select().from(fixtures).where(eq(fixtures.teamId, teamId));
    }
    return await db.select().from(fixtures);
  }

  async getFixture(id: string): Promise<Fixture | undefined> {
    const [fixture] = await db.select().from(fixtures).where(eq(fixtures.id, id));
    return fixture;
  }

  async createFixture(fixture: InsertFixture): Promise<Fixture> {
    const id = randomUUID();
    const newFixture: Fixture = {
      ...fixture,
      id,
      status: fixture.status || 'SCHEDULED',
      homeScore: fixture.homeScore || null,
      awayScore: fixture.awayScore || null,
      videoLinks: fixture.videoLinks || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(fixtures).values(newFixture);
    return newFixture;
  }

  async updateFixture(id: string, fixture: Partial<InsertFixture>): Promise<Fixture> {
    const updated = {
      ...fixture,
      updatedAt: new Date(),
    };
    
    await db.update(fixtures).set(updated).where(eq(fixtures.id, id));
    
    const [updatedFixture] = await db.select().from(fixtures).where(eq(fixtures.id, id));
    if (!updatedFixture) throw new Error('Fixture not found');
    
    return updatedFixture;
  }

  async deleteFixture(id: string): Promise<void> {
    await db.delete(fixtures).where(eq(fixtures.id, id));
  }

  // Opposition team operations
  async getOppositionTeams(): Promise<OppositionTeam[]> {
    return await db.select().from(oppositionTeams);
  }

  async getOppositionTeam(id: string): Promise<OppositionTeam | undefined> {
    const [team] = await db.select().from(oppositionTeams).where(eq(oppositionTeams.id, id));
    return team;
  }

  async getOrCreateOppositionTeam(name: string): Promise<OppositionTeam> {
    // First try to find existing team
    const [existingTeam] = await db.select().from(oppositionTeams).where(eq(oppositionTeams.name, name));
    if (existingTeam) {
      return existingTeam;
    }

    // Create new team if it doesn't exist
    const id = randomUUID();
    const newTeam: OppositionTeam = {
      id,
      name,
      shortName: name.split(' ').map(word => word[0]).join('').slice(0, 3).toUpperCase(),
      logoPath: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(oppositionTeams).values(newTeam);
    return newTeam;
  }

  async createOppositionTeam(team: InsertOppositionTeam): Promise<OppositionTeam> {
    const id = randomUUID();
    const newTeam: OppositionTeam = {
      ...team,
      id,
      shortName: team.shortName || team.name.split(' ').map(word => word[0]).join('').slice(0, 3).toUpperCase(),
      logoPath: team.logoPath || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(oppositionTeams).values(newTeam);
    return newTeam;
  }

  async updateOppositionTeam(id: string, team: Partial<InsertOppositionTeam>): Promise<OppositionTeam> {
    const updated = {
      ...team,
      updatedAt: new Date(),
    };
    
    await db.update(oppositionTeams).set(updated).where(eq(oppositionTeams.id, id));
    
    const [updatedTeam] = await db.select().from(oppositionTeams).where(eq(oppositionTeams.id, id));
    if (!updatedTeam) throw new Error('Opposition team not found');
    
    return updatedTeam;
  }

  async deleteOppositionTeam(id: string): Promise<void> {
    await db.delete(oppositionTeams).where(eq(oppositionTeams.id, id));
  }

  // Match stats operations
  async getMatchStats(fixtureId: string): Promise<MatchStats[]> {
    return await db.select().from(matchStats).where(eq(matchStats.fixtureId, fixtureId));
  }

  async createMatchStats(stats: InsertMatchStats): Promise<MatchStats> {
    const id = randomUUID();
    const newStats: MatchStats = {
      ...stats,
      id,
      goals: stats.goals || null,
      isTeamStats: stats.isTeamStats || null,
      totalTeamDistance: stats.totalTeamDistance || null,
      possession: stats.possession || null,
      createdAt: new Date(),
    };
    
    await db.insert(matchStats).values(newStats);
    return newStats;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = randomUUID();
    const newUser: User = {
      ...user,
      id,
      role: user.role || 'player',
      name: user.name || null,
      email: user.email || null,
      teamId: user.teamId || null,
      createdAt: new Date(),
    };
    
    await db.insert(users).values(newUser);
    return newUser;
  }
}

export const storage = new DatabaseStorage();