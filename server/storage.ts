import { 
  teams, 
  players, 
  fixtures, 
  matchStats, 
  users,
  type Team, 
  type Player, 
  type Fixture, 
  type MatchStats, 
  type User,
  type InsertTeam,
  type InsertPlayer,
  type InsertFixture,
  type InsertMatchStats,
  type InsertUser
} from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private teams: Map<string, Team> = new Map();
  private players: Map<string, Player> = new Map();
  private fixtures: Map<string, Fixture> = new Map();
  private matchStats: Map<string, MatchStats> = new Map();
  private users: Map<string, User> = new Map();

  constructor() {
    this.initializeData();
  }

  private initializeData() {
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
    this.teams.set(teamId, team);

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

    samplePlayers.forEach(playerData => {
      const playerId = randomUUID();
      const player: Player = {
        id: playerId,
        teamId,
        ...playerData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.players.set(playerId, player);
    });

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

    sampleFixtures.forEach(fixtureData => {
      const fixtureId = randomUUID();
      const fixture: Fixture = {
        id: fixtureId,
        teamId,
        ...fixtureData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.fixtures.set(fixtureId, fixture);
    });

    // Initialize sample user
    const userId = randomUUID();
    const user: User = {
      id: userId,
      username: 'coach',
      password: 'password',
      role: 'coach',
      teamId,
      name: 'Dee Shivraman',
      email: 'dee.shivraman@polk.edu',
      createdAt: new Date(),
    };
    this.users.set(userId, user);
  }

  // Team operations
  async getTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const newTeam: Team = {
      ...team,
      id,
      status: team.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.teams.set(id, newTeam);
    return newTeam;
  }

  async updateTeam(id: string, team: Partial<InsertTeam>): Promise<Team> {
    const existing = this.teams.get(id);
    if (!existing) throw new Error('Team not found');
    
    const updated: Team = {
      ...existing,
      ...team,
      updatedAt: new Date(),
    };
    this.teams.set(id, updated);
    return updated;
  }

  // Player operations
  async getPlayers(teamId?: string): Promise<Player[]> {
    const players = Array.from(this.players.values());
    return teamId ? players.filter(p => p.teamId === teamId) : players;
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    return this.players.get(id);
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
    this.players.set(id, newPlayer);
    return newPlayer;
  }

  async updatePlayer(id: string, player: Partial<InsertPlayer>): Promise<Player> {
    const existing = this.players.get(id);
    if (!existing) throw new Error('Player not found');
    
    const updated: Player = {
      ...existing,
      ...player,
      updatedAt: new Date(),
    };
    this.players.set(id, updated);
    return updated;
  }

  async deletePlayer(id: string): Promise<void> {
    this.players.delete(id);
  }

  // Fixture operations
  async getFixtures(teamId?: string): Promise<Fixture[]> {
    const fixtures = Array.from(this.fixtures.values());
    return teamId ? fixtures.filter(f => f.teamId === teamId) : fixtures;
  }

  async getFixture(id: string): Promise<Fixture | undefined> {
    return this.fixtures.get(id);
  }

  async createFixture(fixture: InsertFixture): Promise<Fixture> {
    const id = randomUUID();
    const newFixture: Fixture = {
      ...fixture,
      id,
      status: fixture.status || 'SCHEDULED',
      videoLinks: fixture.videoLinks || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.fixtures.set(id, newFixture);
    return newFixture;
  }

  async updateFixture(id: string, fixture: Partial<InsertFixture>): Promise<Fixture> {
    const existing = this.fixtures.get(id);
    if (!existing) throw new Error('Fixture not found');
    
    const updated: Fixture = {
      ...existing,
      ...fixture,
      updatedAt: new Date(),
    };
    this.fixtures.set(id, updated);
    return updated;
  }

  async deleteFixture(id: string): Promise<void> {
    this.fixtures.delete(id);
  }

  // Match stats operations
  async getMatchStats(fixtureId: string): Promise<MatchStats[]> {
    return Array.from(this.matchStats.values()).filter(s => s.fixtureId === fixtureId);
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
      passes: stats.passes || null,
      passesCompleted: stats.passesCompleted || null,
      shots: stats.shots || null,
      shotsOnTarget: stats.shotsOnTarget || null,
      corners: stats.corners || null,
      offsides: stats.offsides || null,
      fouls: stats.fouls || null,
      yellowCards: stats.yellowCards || null,
      redCards: stats.redCards || null,
      saves: stats.saves || null,
      blocks: stats.blocks || null,
      interceptions: stats.interceptions || null,
      tackles: stats.tackles || null,
      clearances: stats.clearances || null,
      crosses: stats.crosses || null,
      crossesSuccessful: stats.crossesSuccessful || null,
      dribbles: stats.dribbles || null,
      dribblesSuccessful: stats.dribblesSuccessful || null,
      passingAccuracy: stats.passingAccuracy || null,
      passingAverageVelocity: stats.passingAverageVelocity || null,
      createdAt: new Date(),
    };
    this.matchStats.set(id, newStats);
    return newStats;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = randomUUID();
    const newUser: User = {
      ...user,
      id,
      role: user.role || 'player',
      createdAt: new Date(),
    };
    this.users.set(id, newUser);
    return newUser;
  }
}

export const storage = new MemStorage();
