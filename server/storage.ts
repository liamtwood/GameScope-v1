import { randomUUID } from 'crypto';
import { eq, and } from "drizzle-orm";
import { db } from "./db";
import {
  clubs,
  teams,
  users,
  userTeams,
  userClubs,
  userParents,
  fixtures,
  oppositionTeams,
  systemTeams,
  competitions,
  matchStats,
  type Club,
  type Team,
  type User,
  type UserTeam,
  type UserClub,
  type UserParent,
  type Fixture,
  type OppositionTeam,
  type SystemTeam,
  type Competition,
  type MatchStats,
  type InsertClub,
  type InsertTeam,
  type InsertUser,
  type InsertUserTeam,
  type InsertUserParent,
  type InsertFixture,
  type InsertOppositionTeam,
  type InsertSystemTeam,
  type InsertCompetition,
  type InsertMatchStats,
} from '@shared/schema';

export interface IStorage {
  // Club operations
  getClubs(): Promise<Club[]>;
  getClub(id: string): Promise<Club | undefined>;
  createClub(club: InsertClub): Promise<Club>;
  updateClub(id: string, club: Partial<InsertClub>): Promise<Club>;
  updateClubLogo(id: string, logoURL: string): Promise<Club>;
  
  // Team operations
  getTeams(): Promise<Team[]>;
  getTeam(id: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, team: Partial<InsertTeam>): Promise<Team>;
  
  // User operations (replaces Player operations)
  getUsers(teamId?: string): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // User-Team relationship operations (replaces Player-Team operations)
  getUserTeams(userId: string): Promise<(UserTeam & { team: Team })[]>;
  addUserToTeam(userId: string, teamId: string, assignment: InsertUserTeam): Promise<UserTeam>;
  removeUserFromTeam(userId: string, teamId: string): Promise<void>;
  getTeamUsers(teamId: string): Promise<(UserTeam & { user: User })[]>;
  
  // User-Club relationship operations
  getUserClubs(userId: string): Promise<(UserClub & { club: Club })[]>;
  addUserToClub(userId: string, clubId: string, assignment: any): Promise<UserClub>;
  removeUserFromClub(userId: string, clubId: string): Promise<void>;
  getClubUsers(clubId: string): Promise<(UserClub & { user: User })[]>;
  
  // User-Parent relationship operations
  getUserParents(userId: string): Promise<(UserParent & { parent: User })[]>;
  addUserParent(userId: string, parentUserId: string, relationshipType?: string): Promise<UserParent>;
  removeUserParent(userId: string, parentUserId: string): Promise<void>;
  
  // Opposition team operations
  getOppositionTeams(): Promise<OppositionTeam[]>;
  getOppositionTeam(id: string): Promise<OppositionTeam | undefined>;
  getOrCreateOppositionTeam(name: string, websiteUrl?: string, logoUrl?: string): Promise<OppositionTeam>;
  createOppositionTeam(team: InsertOppositionTeam): Promise<OppositionTeam>;
  updateOppositionTeam(id: string, team: Partial<InsertOppositionTeam>): Promise<OppositionTeam>;
  deleteOppositionTeam(id: string): Promise<void>;
  
  // System team operations (NEW - global shared teams with object storage)
  getSystemTeams(): Promise<SystemTeam[]>;
  getSystemTeam(id: string): Promise<SystemTeam | undefined>;
  createSystemTeam(team: InsertSystemTeam): Promise<SystemTeam>;
  updateSystemTeam(id: string, team: Partial<InsertSystemTeam>): Promise<SystemTeam>;
  deleteSystemTeam(id: string): Promise<void>;
  searchSystemTeams(query: string): Promise<SystemTeam[]>;
  incrementSystemTeamUsage(id: string): Promise<void>;
  
  // Competition operations
  getCompetitions(): Promise<Competition[]>;
  getCompetition(id: string): Promise<Competition | undefined>;
  getOrCreateCompetition(name: string): Promise<Competition>;
  createCompetition(competition: InsertCompetition): Promise<Competition>;
  updateCompetition(id: string, competition: Partial<InsertCompetition>): Promise<Competition>;
  updateCompetitionLogo(id: string, logoURL: string): Promise<Competition>;
  deleteCompetition(id: string): Promise<void>;
  
  // Fixture operations
  getFixtures(teamId?: string): Promise<Fixture[]>;
  getFixture(id: string): Promise<Fixture | undefined>;
  createFixture(fixture: InsertFixture): Promise<Fixture>;
  updateFixture(id: string, fixture: Partial<InsertFixture>): Promise<Fixture>;
  updateFixtureVideos(id: string, videos: any[]): Promise<void>;
  deleteFixture(id: string): Promise<void>;
  
  // Match stats operations
  getMatchStats(fixtureId: string): Promise<MatchStats[]>;
  createMatchStats(stats: InsertMatchStats): Promise<MatchStats>;
  updateMatchStats(id: string, stats: Partial<InsertMatchStats>): Promise<MatchStats>;
  deleteMatchStats(id: string): Promise<void>;
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Legacy player methods (aliases to user methods)
  getPlayer(id: string): Promise<User | undefined>;
  getPlayers(teamId?: string): Promise<User[]>;
  getTeamPlayers(teamId: string): Promise<(UserTeam & { user: User })[]>;
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

    // Create Polk State College club first
    const [club] = await db.insert(clubs).values({
      name: "Polk State College",
      owner: "Liam Wood",
    }).returning();

    // Initialize with sample team
    const teamId = randomUUID();
    const team: Team = {
      id: teamId,
      clubId: club.id,
      name: "WOMEN'S SOCCER",
      shortName: "WSC",
      status: "ACTIVE",
      coach: "Dee Shivraman",
      assistantCoach: "Brian McNulty",
      ageGroup: "College",
      gender: "Women",
      season: "2024/25",
      seasonStartMonth: "August",
      colors: { primary: "#003366", secondary: "#FFD700" },
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

    const playerInserts = samplePlayers.map(playerData => {
      const [firstName, lastName] = playerData.name.split(' ');
      return {
        id: randomUUID(),
        teamId,
        firstName,
        lastName: lastName || '',
        position: playerData.position,
        jerseyNumber: playerData.jerseyNumber,
        year: playerData.year,
        hometown: playerData.hometown,
        height: playerData.height,
        goals: playerData.goals,
        assists: playerData.assists,
        appearances: playerData.appearances,
        status: 'Fit',
        keyPlayer: false,
        email: null,
        phone: null,
        emergencyContact: null,
        gender: 'Female',
        dateOfBirth: null,
        accountStatus: 'Active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // Convert to users and user-team assignments
    for (const playerData of samplePlayers) {
      const [firstName, lastName] = playerData.name.split(' ');
      
      // Create user
      const userId = randomUUID();
      const userData: InsertUser = {
        firstName,
        lastName: lastName || '',
        role: 'Player',
        status: 'Active',
        gender: 'Female',
        email: undefined,
        phone: undefined
      };
      
      await db.insert(users).values({ ...userData, id: userId });
      
      // Create team assignment
      const userTeamData: InsertUserTeam = {
        userId,
        teamId,
        position: playerData.position as 'Goalkeeper' | 'Defender' | 'Midfield' | 'Forward',
        jerseyNumber: playerData.jerseyNumber,
        starPlayer: false,
        fitnessStatus: 'Fit'
      };
      
      await db.insert(userTeams).values({ ...userTeamData, id: randomUUID() });
    }

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
    const userData: InsertUser = {
      username: 'coach',
      password: 'password',
      role: 'Coach',
      firstName: 'Dee',
      lastName: 'Shivraman',
      email: 'dee.shivraman@polk.edu',
      status: 'Active'
    };

    await db.insert(users).values({ ...userData, id: randomUUID() });
  }

  // Club operations
  async getClubs(): Promise<Club[]> {
    return await db.select().from(clubs);
  }

  async getClub(id: string): Promise<Club | undefined> {
    const [club] = await db.select().from(clubs).where(eq(clubs.id, id));
    return club;
  }

  async createClub(club: InsertClub): Promise<Club> {
    const [newClub] = await db.insert(clubs).values(club).returning();
    return newClub;
  }

  async updateClub(id: string, club: Partial<InsertClub>): Promise<Club> {
    const updated = {
      ...club,
      updatedAt: new Date(),
    };
    
    await db.update(clubs).set(updated).where(eq(clubs.id, id));
    
    const [updatedClub] = await db.select().from(clubs).where(eq(clubs.id, id));
    return updatedClub!;
  }

  async updateClubLogo(id: string, logoURL: string): Promise<Club> {
    // Import ObjectStorageService here to avoid circular dependency
    const { ObjectStorageService } = await import('./objectStorage');
    const objectStorageService = new ObjectStorageService();
    
    // Normalize the logo path using the object storage service
    const logoPath = objectStorageService.normalizeLogoPath(logoURL);
    
    const updated = {
      logoPath,
      updatedAt: new Date(),
    };
    
    await db.update(clubs).set(updated).where(eq(clubs.id, id));
    
    const [updatedClub] = await db.select().from(clubs).where(eq(clubs.id, id));
    return updatedClub!;
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
      seasonStartMonth: team.seasonStartMonth || 'August',
      colors: team.colors || null,
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

  // User operations (replaces Player operations)
  async getUsers(teamId?: string): Promise<User[]> {
    if (teamId) {
      // Get users through team assignments with team-specific fields
      return await db.select({
        id: users.id,
        username: users.username,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        shirtName: users.shirtName,
        dateOfBirth: users.dateOfBirth,
        gender: users.gender,
        email: users.email,
        phone: users.phone,
        emergencyContact: users.emergencyContact,
        emergencyContactPhone: users.emergencyContactPhone,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        // Add team-specific fields
        jerseyNumber: userTeams.jerseyNumber,
        position: userTeams.position,
        starPlayer: userTeams.starPlayer,
        fitnessStatus: userTeams.fitnessStatus,
      })
      .from(users)
      .innerJoin(userTeams, eq(users.id, userTeams.userId))
      .where(eq(userTeams.teamId, teamId));
    }
    return await db.select().from(users);
  }

  async getUsersWithClubs(): Promise<(User & { clubId?: string | null; clubName?: string | null })[]> {
    const result = await db.select({
      id: users.id,
      username: users.username,
      password: users.password,
      firstName: users.firstName,
      lastName: users.lastName,
      shirtName: users.shirtName,
      dateOfBirth: users.dateOfBirth,
      gender: users.gender,
      email: users.email,
      phone: users.phone,
      emergencyContact: users.emergencyContact,
      emergencyContactPhone: users.emergencyContactPhone,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      clubId: clubs.id,
      clubName: clubs.name,
    })
    .from(users)
    .leftJoin(userClubs, eq(users.id, userClubs.userId))
    .leftJoin(clubs, eq(userClubs.clubId, clubs.id));
    
    return result;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUserData = {
      ...user,
      id: randomUUID(),
      username: user.username || null,
      password: user.password || null,
      shirtName: user.shirtName || null,
      dateOfBirth: user.dateOfBirth || null,
      gender: user.gender || null,
      email: user.email || null,
      phone: user.phone || null,
      emergencyContact: user.emergencyContact || null,
      emergencyContactPhone: user.emergencyContactPhone || null,
      role: user.role || 'Player',
      status: user.status || 'Draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(users).values(newUserData);
    return newUserData as User;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User> {
    const updated = {
      ...user,
      updatedAt: new Date(),
    };
    
    await db.update(users).set(updated).where(eq(users.id, id));
    
    const [updatedUser] = await db.select().from(users).where(eq(users.id, id));
    if (!updatedUser) throw new Error('User not found');
    
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    // First remove all club assignments for this user
    await db.delete(userClubs).where(eq(userClubs.userId, id));
    // Remove all team assignments for this user
    await db.delete(userTeams).where(eq(userTeams.userId, id));
    // Remove all parent relationships
    await db.delete(userParents).where(eq(userParents.userId, id));
    await db.delete(userParents).where(eq(userParents.parentUserId, id));
    // Then delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  // User-Team relationship operations (replaces Player-Team operations)
  async getUserTeams(userId: string): Promise<(UserTeam & { team: Team })[]> {
    return await db.select({
      id: userTeams.id,
      userId: userTeams.userId,
      teamId: userTeams.teamId,
      jerseyNumber: userTeams.jerseyNumber,
      position: userTeams.position,
      starPlayer: userTeams.starPlayer,
      fitnessStatus: userTeams.fitnessStatus,

      joinedAt: userTeams.joinedAt,
      leftAt: userTeams.leftAt,

      createdAt: userTeams.createdAt,
      updatedAt: userTeams.updatedAt,
      team: teams
    })
    .from(userTeams)
    .innerJoin(teams, eq(userTeams.teamId, teams.id))
    .where(eq(userTeams.userId, userId));
  }

  async addUserToTeam(
    userId: string, 
    teamId: string, 
    assignment: InsertUserTeam
  ): Promise<UserTeam> {
    const id = randomUUID();
    const newUserTeam = {
      ...assignment,
      id,
      userId,
      teamId,
      jerseyNumber: assignment.jerseyNumber || 0,
      starPlayer: assignment.starPlayer || false,
      fitnessStatus: assignment.fitnessStatus || 'Fit',
      joinedAt: new Date(),
      leftAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.insert(userTeams).values(newUserTeam);
    return newUserTeam as UserTeam;
  }

  async addUserToClub(
    userId: string, 
    clubId: string, 
    assignment: any
  ): Promise<UserClub> {
    const id = randomUUID();
    const newUserClub = {
      id,
      userId,
      clubId,
      status: assignment.status || 'Active',
      keyUser: assignment.keyUser || false,
      joinedAt: new Date(),
      leftAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.insert(userClubs).values(newUserClub);
    return newUserClub as UserClub;
  }

  async getClubUsers(clubId: string): Promise<(UserClub & { user: User })[]> {
    const result = await db
      .select()
      .from(userClubs)
      .leftJoin(users, eq(userClubs.userId, users.id))
      .where(eq(userClubs.clubId, clubId));
      
    return result.map(row => ({
      ...row.user_clubs,
      user: row.users!
    })) as (UserClub & { user: User })[];
  }

  async getUserClubs(userId: string): Promise<(UserClub & { club: Club })[]> {
    const result = await db
      .select()
      .from(userClubs)
      .leftJoin(clubs, eq(userClubs.clubId, clubs.id))
      .where(eq(userClubs.userId, userId));
      
    return result.map(row => ({
      ...row.user_clubs,
      club: row.clubs!
    })) as (UserClub & { club: Club })[];
  }

  async removeUserFromClub(userId: string, clubId: string): Promise<void> {
    await db
      .delete(userClubs)
      .where(and(eq(userClubs.userId, userId), eq(userClubs.clubId, clubId)));
  }

  async removeUserFromTeam(userId: string, teamId: string): Promise<void> {
    await db.delete(userTeams)
      .where(and(eq(userTeams.userId, userId), eq(userTeams.teamId, teamId)));
  }


  async getTeamUsers(teamId: string): Promise<(UserTeam & { user: User })[]> {
    return await db.select({
      id: userTeams.id,
      userId: userTeams.userId,
      teamId: userTeams.teamId,
      jerseyNumber: userTeams.jerseyNumber,
      position: userTeams.position,
      starPlayer: userTeams.starPlayer,
      fitnessStatus: userTeams.fitnessStatus,

      joinedAt: userTeams.joinedAt,
      leftAt: userTeams.leftAt,

      createdAt: userTeams.createdAt,
      updatedAt: userTeams.updatedAt,
      user: users
    })
    .from(userTeams)
    .innerJoin(users, eq(userTeams.userId, users.id))
    .where(eq(userTeams.teamId, teamId));
  }

  // User-Parent relationship operations
  async getUserParents(userId: string): Promise<(UserParent & { parent: User })[]> {
    return await db.select({
      id: userParents.id,
      userId: userParents.userId,
      parentUserId: userParents.parentUserId,
      relationshipType: userParents.relationshipType,
      createdAt: userParents.createdAt,
      parent: users
    })
    .from(userParents)
    .innerJoin(users, eq(userParents.parentUserId, users.id))
    .where(eq(userParents.userId, userId));
  }

  async addUserParent(userId: string, parentUserId: string, relationshipType?: string): Promise<UserParent> {
    const id = randomUUID();
    const newUserParent = {
      id,
      userId,
      parentUserId,
      relationshipType: relationshipType || 'parent',
      createdAt: new Date(),
    };
    
    await db.insert(userParents).values(newUserParent);
    return newUserParent as UserParent;
  }

  async removeUserParent(userId: string, parentUserId: string): Promise<void> {
    await db.delete(userParents)
      .where(and(eq(userParents.userId, userId), eq(userParents.parentUserId, parentUserId)));
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
      oppositionTeamId: fixture.oppositionTeamId || null,
      oppositionClubId: fixture.oppositionClubId || null,
      competition: fixture.competition || null,
      notes: fixture.notes || null,
      hasVideo: fixture.hasVideo || false,
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

  async updateFixtureVideos(id: string, videos: any[]): Promise<void> {
    const hasVideo = videos.length > 0;
    await db.update(fixtures)
      .set({ 
        videoLinks: videos,
        hasVideo,
        updatedAt: new Date(),
      })
      .where(eq(fixtures.id, id));
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

  async getOrCreateOppositionTeam(name: string, websiteUrl?: string, logoUrl?: string): Promise<OppositionTeam> {
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
      logoPath: logoUrl || null,
      websiteUrl: websiteUrl ?? null,
      colors: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(oppositionTeams).values(newTeam);
    return newTeam;
  }

  async createOppositionTeam(team: InsertOppositionTeam): Promise<OppositionTeam> {
    const id = randomUUID();
    const newTeam: OppositionTeam = {
      id,
      name: team.name,
      shortName: team.shortName || team.name.split(' ').map(word => word[0]).join('').slice(0, 3).toUpperCase(),
      logoPath: team.logoPath || null,
      websiteUrl: team.websiteUrl || null,
      colors: team.colors || null,
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

  // System team operations (NEW - global shared teams)
  async getSystemTeams(): Promise<SystemTeam[]> {
    return await db.select().from(systemTeams);
  }

  async getSystemTeam(id: string): Promise<SystemTeam | undefined> {
    const [team] = await db.select().from(systemTeams).where(eq(systemTeams.id, id));
    return team;
  }

  async createSystemTeam(team: InsertSystemTeam): Promise<SystemTeam> {
    const [created] = await db.insert(systemTeams).values(team).returning();
    return created;
  }

  async updateSystemTeam(id: string, team: Partial<InsertSystemTeam>): Promise<SystemTeam> {
    const [updated] = await db.update(systemTeams).set(team).where(eq(systemTeams.id, id)).returning();
    return updated;
  }

  async deleteSystemTeam(id: string): Promise<void> {
    await db.delete(systemTeams).where(eq(systemTeams.id, id));
  }

  async searchSystemTeams(query: string): Promise<SystemTeam[]> {
    return await db.select().from(systemTeams)
      .where(eq(systemTeams.name, query)); // Simple exact match for now
  }

  async incrementSystemTeamUsage(id: string): Promise<void> {
    await db.update(systemTeams)
      .set({ usage_count: (systemTeams as any).usage_count + 1 })
      .where(eq(systemTeams.id, id));
  }

  // Competition operations
  async getCompetitions(): Promise<Competition[]> {
    return await db.select().from(competitions);
  }

  async getCompetition(id: string): Promise<Competition | undefined> {
    const [competition] = await db.select().from(competitions).where(eq(competitions.id, id));
    return competition;
  }

  async getOrCreateCompetition(name: string): Promise<Competition> {
    // First try to find existing competition
    const [existingCompetition] = await db.select().from(competitions).where(eq(competitions.name, name));
    if (existingCompetition) {
      return existingCompetition;
    }

    // Create new competition if it doesn't exist
    const id = randomUUID();
    const newCompetition: Competition = {
      id,
      name,
      shortName: name.split(' ').map(word => word[0]).join('').slice(0, 3).toUpperCase(),
      logoPath: null,
      seasonStartMonth: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(competitions).values(newCompetition);
    return newCompetition;
  }

  async createCompetition(competition: InsertCompetition): Promise<Competition> {
    const id = randomUUID();
    const newCompetition: Competition = {
      ...competition,
      id,
      shortName: competition.shortName || competition.name.split(' ').map(word => word[0]).join('').slice(0, 3).toUpperCase(),
      logoPath: competition.logoPath || null,
      seasonStartMonth: competition.seasonStartMonth || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(competitions).values(newCompetition);
    return newCompetition;
  }

  async updateCompetition(id: string, competition: Partial<InsertCompetition>): Promise<Competition> {
    const updated = {
      ...competition,
      updatedAt: new Date(),
    };
    
    await db.update(competitions).set(updated).where(eq(competitions.id, id));
    
    const [updatedCompetition] = await db.select().from(competitions).where(eq(competitions.id, id));
    if (!updatedCompetition) throw new Error('Competition not found');
    
    return updatedCompetition;
  }

  async updateCompetitionLogo(id: string, logoURL: string): Promise<Competition> {
    const updated = {
      logoPath: logoURL,
      updatedAt: new Date(),
    };
    
    await db.update(competitions).set(updated).where(eq(competitions.id, id));
    
    const [updatedCompetition] = await db.select().from(competitions).where(eq(competitions.id, id));
    if (!updatedCompetition) throw new Error('Competition not found');
    
    return updatedCompetition;
  }

  async deleteCompetition(id: string): Promise<void> {
    await db.delete(competitions).where(eq(competitions.id, id));
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
      shotsAttempted: stats.shotsAttempted || null,
      shotsOnTarget: stats.shotsOnTarget || null,
      runsIntoBoxes: stats.runsIntoBoxes || null,
      corners: stats.corners || null,
      dangerousCrosses: stats.dangerousCrosses || null,
      dribbles: stats.dribbles || null,
      penetratingDribbles: stats.penetratingDribbles || null,
      takeOns: stats.takeOns || null,
      firstTouchSuccess: stats.firstTouchSuccess || null,
      firstTouchSuccessRate: stats.firstTouchSuccessRate || null,
      tackles: stats.tackles || null,
      freeKicks: stats.freeKicks || null,
      offsides: stats.offsides || null,
      passesAttempted: stats.passesAttempted || null,
      passesSuccess: stats.passesSuccess || null,
      passingSuccessRate: stats.passingSuccessRate || null,
      passingTotalDistance: stats.passingTotalDistance || null,
      passingAverageDistance: stats.passingAverageDistance || null,
      passingAverageVelocity: stats.passingAverageVelocity || null,
      rightFootPassAttempted: stats.rightFootPassAttempted || null,
      rightFootPassSuccess: stats.rightFootPassSuccess || null,
      rightFootPassSuccessRate: stats.rightFootPassSuccessRate || null,
      leftFootPassAttempted: stats.leftFootPassAttempted || null,
      leftFootPassSuccess: stats.leftFootPassSuccess || null,
      leftFootPassSuccessRate: stats.leftFootPassSuccessRate || null,
      createdAt: new Date(),
    };
    
    await db.insert(matchStats).values(newStats);
    return newStats;
  }

  async updateMatchStats(id: string, stats: Partial<InsertMatchStats>): Promise<MatchStats> {
    const [updatedStats] = await db
      .update(matchStats)
      .set({
        ...stats,
        // Include all the new fields with proper null handling
        goals: stats.goals !== undefined ? stats.goals : undefined,
        isTeamStats: stats.isTeamStats !== undefined ? stats.isTeamStats : undefined,
        totalTeamDistance: stats.totalTeamDistance !== undefined ? stats.totalTeamDistance : undefined,
        possession: stats.possession !== undefined ? stats.possession : undefined,
        shotsAttempted: stats.shotsAttempted !== undefined ? stats.shotsAttempted : undefined,
        shotsOnTarget: stats.shotsOnTarget !== undefined ? stats.shotsOnTarget : undefined,
        runsIntoBoxes: stats.runsIntoBoxes !== undefined ? stats.runsIntoBoxes : undefined,
        corners: stats.corners !== undefined ? stats.corners : undefined,
        dangerousCrosses: stats.dangerousCrosses !== undefined ? stats.dangerousCrosses : undefined,
        dribbles: stats.dribbles !== undefined ? stats.dribbles : undefined,
        penetratingDribbles: stats.penetratingDribbles !== undefined ? stats.penetratingDribbles : undefined,
        takeOns: stats.takeOns !== undefined ? stats.takeOns : undefined,
        firstTouchSuccess: stats.firstTouchSuccess !== undefined ? stats.firstTouchSuccess : undefined,
        firstTouchSuccessRate: stats.firstTouchSuccessRate !== undefined ? stats.firstTouchSuccessRate : undefined,
        tackles: stats.tackles !== undefined ? stats.tackles : undefined,
        freeKicks: stats.freeKicks !== undefined ? stats.freeKicks : undefined,
        offsides: stats.offsides !== undefined ? stats.offsides : undefined,
        passesAttempted: stats.passesAttempted !== undefined ? stats.passesAttempted : undefined,
        passesSuccess: stats.passesSuccess !== undefined ? stats.passesSuccess : undefined,
        passingSuccessRate: stats.passingSuccessRate !== undefined ? stats.passingSuccessRate : undefined,
        passingTotalDistance: stats.passingTotalDistance !== undefined ? stats.passingTotalDistance : undefined,
        passingAverageDistance: stats.passingAverageDistance !== undefined ? stats.passingAverageDistance : undefined,
        passingAverageVelocity: stats.passingAverageVelocity !== undefined ? stats.passingAverageVelocity : undefined,
        rightFootPassAttempted: stats.rightFootPassAttempted !== undefined ? stats.rightFootPassAttempted : undefined,
        rightFootPassSuccess: stats.rightFootPassSuccess !== undefined ? stats.rightFootPassSuccess : undefined,
        rightFootPassSuccessRate: stats.rightFootPassSuccessRate !== undefined ? stats.rightFootPassSuccessRate : undefined,
        leftFootPassAttempted: stats.leftFootPassAttempted !== undefined ? stats.leftFootPassAttempted : undefined,
        leftFootPassSuccess: stats.leftFootPassSuccess !== undefined ? stats.leftFootPassSuccess : undefined,
        leftFootPassSuccessRate: stats.leftFootPassSuccessRate !== undefined ? stats.leftFootPassSuccessRate : undefined,
      })
      .where(eq(matchStats.id, id))
      .returning();
    
    if (!updatedStats) {
      throw new Error("Match statistics not found");
    }
    
    return updatedStats;
  }

  async deleteMatchStats(id: string): Promise<void> {
    await db.delete(matchStats).where(eq(matchStats.id, id));
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  // Legacy player methods (aliases to user methods)
  async getPlayer(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }
  
  async getPlayers(teamId?: string): Promise<User[]> {
    return this.getUsers(teamId);
  }
  
  async getTeamPlayers(teamId: string): Promise<(UserTeam & { user: User })[]> {
    return this.getTeamUsers(teamId);
  }

}

export const storage = new DatabaseStorage();