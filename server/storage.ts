import { randomUUID } from 'crypto';
import { eq, and, sql } from "drizzle-orm";
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
  teamCompetitions,
  matchStats,
  playerStats,
  pageRequirements,
  dataModels,
  changeLog,
  workItems,
  workItemLinks,
  testRuns,
  testRunResults,
  fmApps,
  fmWidgets,
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
  type TeamCompetition,
  type MatchStats,
  type PlayerStats,
  type InsertClub,
  type InsertTeam,
  type InsertUser,
  type InsertUserTeam,
  type InsertUserParent,
  type InsertFixture,
  type InsertOppositionTeam,
  type InsertSystemTeam,
  type InsertCompetition,
  type InsertTeamCompetition,
  type InsertMatchStats,
  type InsertPlayerStats,
  type PageRequirementRecord,
  type DataModel as DevopsDataModelRecord,
  type ChangeLog as DevopsChangeLogRecord,
  type InsertPageRequirement,
  type InsertDataModel as InsertDevopsDataModel,
  type InsertChangeLog as InsertDevopsChangeLog,
  type WorkItem as WorkItemRecord,
  type WorkItemLink as WorkItemLinkRecord,
  type InsertWorkItem,
  type InsertWorkItemLink,
  type TestRun as TestRunRecord,
  type TestRunResult as TestRunResultRecord,
  type InsertTestRun,
  type InsertTestRunResult,
  type FmApp,
  type FmWidget,
  type InsertFmApp,
  type InsertFmWidget,
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
  updateUserTeam(userId: string, teamId: string, updates: Partial<InsertUserTeam>): Promise<UserTeam>;
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
  getCompetitions(clubId?: string): Promise<Competition[]>;
  getCompetition(id: string): Promise<Competition | undefined>;
  getOrCreateCompetition(name: string, clubId?: string): Promise<Competition>;
  createCompetition(competition: InsertCompetition): Promise<Competition>;
  updateCompetition(id: string, competition: Partial<InsertCompetition>): Promise<Competition>;
  updateCompetitionLogo(id: string, logoURL: string): Promise<Competition>;
  deleteCompetition(id: string): Promise<void>;
  
  // Team-Competition operations
  getTeamCompetitions(teamId: string): Promise<(TeamCompetition & { competition: Competition })[]>;
  setTeamCompetition(teamId: string, competitionId: string, isEnabled: boolean): Promise<TeamCompetition>;
  getEnabledCompetitions(teamId: string): Promise<Competition[]>;
  
  // Fixture operations
  getFixtures(teamId?: string): Promise<Fixture[]>;
  getFixture(id: string): Promise<Fixture | undefined>;
  createFixture(fixture: InsertFixture): Promise<Fixture>;
  updateFixture(id: string, fixture: Partial<InsertFixture>): Promise<Fixture>;
  updateFixtureVideos(id: string, videos: any[]): Promise<void>;
  updateFixtureVideoMetadata(fixtureId: string, videoId: string, metadata: Record<string, any>): Promise<any[]>;
  deleteFixture(id: string): Promise<void>;
  
  // Match stats operations
  getMatchStats(fixtureId: string): Promise<MatchStats[]>;
  createMatchStats(stats: InsertMatchStats): Promise<MatchStats>;
  updateMatchStats(id: string, stats: Partial<InsertMatchStats>): Promise<MatchStats>;
  deleteMatchStats(id: string): Promise<void>;
  
  // Player stats operations
  getPlayerStats(playerId: string): Promise<PlayerStats[]>;
  getPlayerStatsByFixture(playerId: string, fixtureId: string): Promise<PlayerStats[]>;
  createPlayerStats(stats: InsertPlayerStats): Promise<PlayerStats>;
  updatePlayerStats(id: string, stats: Partial<InsertPlayerStats>): Promise<PlayerStats>;
  deletePlayerStats(id: string): Promise<void>;
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Legacy player methods (aliases to user methods)
  getPlayer(id: string): Promise<User | undefined>;
  getPlayers(teamId?: string): Promise<User[]>;
  getTeamPlayers(teamId: string): Promise<(UserTeam & { user: User })[]>;
  
  // DevOps Requirements CRUD operations
  getPageRequirements(): Promise<PageRequirementRecord[]>;
  getPageRequirement(id: string): Promise<PageRequirementRecord | undefined>;
  createPageRequirement(req: InsertPageRequirement): Promise<PageRequirementRecord>;
  updatePageRequirement(id: string, req: Partial<InsertPageRequirement>): Promise<PageRequirementRecord>;
  deletePageRequirement(id: string): Promise<void>;
  
  // DevOps Data Models CRUD operations
  getDevopsDataModels(): Promise<DevopsDataModelRecord[]>;
  getDevopsDataModel(id: string): Promise<DevopsDataModelRecord | undefined>;
  createDevopsDataModel(model: InsertDevopsDataModel): Promise<DevopsDataModelRecord>;
  updateDevopsDataModel(id: string, model: Partial<InsertDevopsDataModel>): Promise<DevopsDataModelRecord>;
  deleteDevopsDataModel(id: string): Promise<void>;
  
  // DevOps Change Log CRUD operations
  getDevopsChangeLogs(): Promise<DevopsChangeLogRecord[]>;
  getDevopsChangeLog(id: string): Promise<DevopsChangeLogRecord | undefined>;
  createDevopsChangeLog(entry: InsertDevopsChangeLog): Promise<DevopsChangeLogRecord>;
  updateDevopsChangeLog(id: string, entry: Partial<InsertDevopsChangeLog>): Promise<DevopsChangeLogRecord>;
  deleteDevopsChangeLog(id: string): Promise<void>;
  
  // Work Items CRUD operations
  getWorkItems(filters?: { type?: string; parentId?: string; area?: string; status?: string }): Promise<WorkItemRecord[]>;
  getWorkItem(id: string): Promise<WorkItemRecord | undefined>;
  createWorkItem(item: InsertWorkItem): Promise<WorkItemRecord>;
  updateWorkItem(id: string, item: Partial<InsertWorkItem>): Promise<WorkItemRecord>;
  deleteWorkItem(id: string): Promise<void>;
  convertWorkItemType(id: string, newType: string): Promise<WorkItemRecord>;
  getWorkItemChildren(parentId: string): Promise<WorkItemRecord[]>;
  
  // Work Item Links CRUD operations
  getWorkItemLinks(itemId?: string): Promise<WorkItemLinkRecord[]>;
  createWorkItemLink(link: InsertWorkItemLink): Promise<WorkItemLinkRecord>;
  deleteWorkItemLink(id: string): Promise<void>;
  getLinkedItems(itemId: string, linkType?: string): Promise<WorkItemRecord[]>;
  
  // Test Run CRUD operations
  getTestRuns(): Promise<TestRunRecord[]>;
  getTestRun(id: string): Promise<TestRunRecord | undefined>;
  createTestRun(run: InsertTestRun): Promise<TestRunRecord>;
  updateTestRun(id: string, run: Partial<InsertTestRun>): Promise<TestRunRecord>;
  deleteTestRun(id: string): Promise<void>;
  
  // Test Run Results CRUD operations
  getTestRunResults(testRunId: string): Promise<TestRunResultRecord[]>;
  createTestRunResult(result: InsertTestRunResult): Promise<TestRunResultRecord>;
  updateTestRunResult(id: string, result: Partial<InsertTestRunResult>): Promise<TestRunResultRecord>;
  deleteTestRunResult(id: string): Promise<void>;
  getTestRunWithResults(id: string): Promise<{ run: TestRunRecord; results: TestRunResultRecord[] } | undefined>;
  
  // FM Apps CRUD operations
  getFmApps(): Promise<FmApp[]>;
  getFmApp(id: string): Promise<FmApp | undefined>;
  createFmApp(app: InsertFmApp): Promise<FmApp>;
  updateFmApp(id: string, app: Partial<InsertFmApp>): Promise<FmApp>;
  deleteFmApp(id: string): Promise<void>;
  
  // FM Widgets CRUD operations
  getFmWidgets(appId?: string): Promise<FmWidget[]>;
  getFmWidget(id: string): Promise<FmWidget | undefined>;
  createFmWidget(widget: InsertFmWidget): Promise<FmWidget>;
  updateFmWidget(id: string, widget: Partial<InsertFmWidget>): Promise<FmWidget>;
  deleteFmWidget(id: string): Promise<void>;
  
  // Seed requirements data from registry
  seedRequirementsData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeData().catch(err => {
      console.error('Failed to initialize database data:', err);
      // Don't throw here - allow the app to continue running
    });
  }

  private async initializeData() {
    try {
      console.log('Initializing database data...');
      
      // Check if data already exists
      const existingTeams = await db.select().from(teams);
      if (existingTeams.length > 0) {
        console.log('Database data already exists, skipping initialization');
        return; // Data already exists
      }

      console.log('Creating initial database data...');

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
      ageGroup: "College",
      gender: "Women",
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
    
    console.log('Database initialization completed successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
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
      ageGroup: team.ageGroup || null,
      gender: team.gender || null,
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
  async getUsers(teamId?: string, role?: string): Promise<User[]> {
    if (teamId && role) {
      // Get users through team assignments with team-specific fields and role filter
      return await db.select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        shirtName: users.shirtName,
        dateOfBirth: users.dateOfBirth,
        gender: users.gender,
        avatarPath: users.avatarPath,
        headshotPath: users.headshotPath,
        email: users.email,
        phone: users.phone,
        emergencyContact: users.emergencyContact,
        emergencyContactPhone: users.emergencyContactPhone,
        role: users.role,
        status: users.status,
        height: users.height,
        hometown: users.hometown,
        highSchool: users.highSchool,
        classYear: users.classYear,
        bio: users.bio,
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
      .where(and(eq(userTeams.teamId, teamId), eq(users.role, role)));
    } else if (teamId) {
      // Get users through team assignments with team-specific fields
      return await db.select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        shirtName: users.shirtName,
        dateOfBirth: users.dateOfBirth,
        gender: users.gender,
        avatarPath: users.avatarPath,
        headshotPath: users.headshotPath,
        email: users.email,
        phone: users.phone,
        emergencyContact: users.emergencyContact,
        emergencyContactPhone: users.emergencyContactPhone,
        role: users.role,
        status: users.status,
        height: users.height,
        hometown: users.hometown,
        highSchool: users.highSchool,
        classYear: users.classYear,
        bio: users.bio,
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
    } else if (role) {
      // Get all users with role filter
      return await db.select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        shirtName: users.shirtName,
        dateOfBirth: users.dateOfBirth,
        gender: users.gender,
        avatarPath: users.avatarPath,
        headshotPath: users.headshotPath,
        email: users.email,
        phone: users.phone,
        emergencyContact: users.emergencyContact,
        emergencyContactPhone: users.emergencyContactPhone,
        role: users.role,
        status: users.status,
        height: users.height,
        hometown: users.hometown,
        highSchool: users.highSchool,
        classYear: users.classYear,
        bio: users.bio,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      }).from(users).where(eq(users.role, role));
    } else {
      // Get all users
      return await db.select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        shirtName: users.shirtName,
        dateOfBirth: users.dateOfBirth,
        gender: users.gender,
        avatarPath: users.avatarPath,
        headshotPath: users.headshotPath,
        email: users.email,
        phone: users.phone,
        emergencyContact: users.emergencyContact,
        emergencyContactPhone: users.emergencyContactPhone,
        role: users.role,
        status: users.status,
        height: users.height,
        hometown: users.hometown,
        highSchool: users.highSchool,
        classYear: users.classYear,
        bio: users.bio,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      }).from(users);
    }
  }

  async getUsersWithClubs(role?: string): Promise<(User & { clubId?: string | null; clubName?: string | null })[]> {
    if (role) {
      const result = await db.select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        shirtName: users.shirtName,
        dateOfBirth: users.dateOfBirth,
        gender: users.gender,
        avatarPath: users.avatarPath,
        headshotPath: users.headshotPath,
        email: users.email,
        phone: users.phone,
        emergencyContact: users.emergencyContact,
        emergencyContactPhone: users.emergencyContactPhone,
        role: users.role,
        status: users.status,
        height: users.height,
        hometown: users.hometown,
        highSchool: users.highSchool,
        classYear: users.classYear,
        bio: users.bio,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        clubId: clubs.id,
        clubName: clubs.name,
      })
      .from(users)
      .leftJoin(userClubs, eq(users.id, userClubs.userId))
      .leftJoin(clubs, eq(userClubs.clubId, clubs.id))
      .where(eq(users.role, role));
      
      return result;
    } else {
      const result = await db.select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        shirtName: users.shirtName,
        dateOfBirth: users.dateOfBirth,
        gender: users.gender,
        avatarPath: users.avatarPath,
        headshotPath: users.headshotPath,
        email: users.email,
        phone: users.phone,
        emergencyContact: users.emergencyContact,
        emergencyContactPhone: users.emergencyContactPhone,
        role: users.role,
        status: users.status,
        height: users.height,
        hometown: users.hometown,
        highSchool: users.highSchool,
        classYear: users.classYear,
        bio: users.bio,
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
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      shirtName: users.shirtName,
      dateOfBirth: users.dateOfBirth,
      gender: users.gender,
      avatarPath: users.avatarPath,
      headshotPath: users.headshotPath,
      email: users.email,
      phone: users.phone,
      emergencyContact: users.emergencyContact,
      emergencyContactPhone: users.emergencyContactPhone,
      role: users.role,
      status: users.status,
      height: users.height,
      hometown: users.hometown,
      highSchool: users.highSchool,
      classYear: users.classYear,
      bio: users.bio,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(eq(users.id, id));
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
    // Return user without password field for security
    const { password, ...userWithoutPassword } = newUserData;
    return userWithoutPassword as User;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User> {
    const updated = {
      ...user,
      updatedAt: new Date(),
    };
    
    await db.update(users).set(updated).where(eq(users.id, id));
    
    const [updatedUser] = await db.select({
      id: users.id,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      shirtName: users.shirtName,
      dateOfBirth: users.dateOfBirth,
      gender: users.gender,
      avatarPath: users.avatarPath,
      headshotPath: users.headshotPath,
      email: users.email,
      phone: users.phone,
      emergencyContact: users.emergencyContact,
      emergencyContactPhone: users.emergencyContactPhone,
      role: users.role,
      status: users.status,
      height: users.height,
      hometown: users.hometown,
      highSchool: users.highSchool,
      classYear: users.classYear,
      bio: users.bio,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(eq(users.id, id));
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

  async updateUserTeam(
    userId: string, 
    teamId: string, 
    updates: Partial<InsertUserTeam>
  ): Promise<UserTeam> {
    const updatedData = {
      ...updates,
      updatedAt: new Date()
    };
    
    await db.update(userTeams)
      .set(updatedData)
      .where(
        and(
          eq(userTeams.userId, userId),
          eq(userTeams.teamId, teamId)
        )
      );
    
    const [updatedUserTeam] = await db.select()
      .from(userTeams)
      .where(
        and(
          eq(userTeams.userId, userId),
          eq(userTeams.teamId, teamId)
        )
      );
    
    if (!updatedUserTeam) throw new Error('UserTeam not found');
    return updatedUserTeam;
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
      user: {
        id: row.users!.id,
        username: row.users!.username,
        firstName: row.users!.firstName,
        lastName: row.users!.lastName,
        shirtName: row.users!.shirtName,
        dateOfBirth: row.users!.dateOfBirth,
        gender: row.users!.gender,
        avatarPath: row.users!.avatarPath,
        email: row.users!.email,
        phone: row.users!.phone,
        emergencyContact: row.users!.emergencyContact,
        emergencyContactPhone: row.users!.emergencyContactPhone,
        role: row.users!.role,
        status: row.users!.status,
        createdAt: row.users!.createdAt,
        updatedAt: row.users!.updatedAt,
      }
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
      user: {
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        shirtName: users.shirtName,
        dateOfBirth: users.dateOfBirth,
        gender: users.gender,
        avatarPath: users.avatarPath,
        headshotPath: users.headshotPath,
        email: users.email,
        phone: users.phone,
        emergencyContact: users.emergencyContact,
        emergencyContactPhone: users.emergencyContactPhone,
        role: users.role,
        status: users.status,
        height: users.height,
        hometown: users.hometown,
        highSchool: users.highSchool,
        classYear: users.classYear,
        bio: users.bio,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      }
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
      parent: {
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        shirtName: users.shirtName,
        dateOfBirth: users.dateOfBirth,
        gender: users.gender,
        avatarPath: users.avatarPath,
        headshotPath: users.headshotPath,
        email: users.email,
        phone: users.phone,
        emergencyContact: users.emergencyContact,
        emergencyContactPhone: users.emergencyContactPhone,
        role: users.role,
        status: users.status,
        height: users.height,
        hometown: users.hometown,
        highSchool: users.highSchool,
        classYear: users.classYear,
        bio: users.bio,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      }
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

  async updateFixtureVideoMetadata(fixtureId: string, videoId: string, metadata: Record<string, any>): Promise<any[]> {
    // Use PostgreSQL's JSONB operations to atomically update a single video in the array
    const result = await db.execute(sql`
      WITH video_update AS (
        SELECT 
          COALESCE(video_links, '[]'::jsonb) as current_links
        FROM ${fixtures}
        WHERE id = ${fixtureId}
      ),
      updated_links AS (
        SELECT 
          COALESCE(
            jsonb_agg(
              CASE 
                WHEN elem_value->>'id' = ${videoId} 
                THEN elem_value || ${JSON.stringify(metadata)}::jsonb
                ELSE elem_value
              END
              ORDER BY ordinality
            ),
            '[]'::jsonb
          ) as new_links,
          bool_or(elem_value->>'id' = ${videoId}) as video_found
        FROM video_update,
          jsonb_array_elements(current_links) WITH ORDINALITY as elem(elem_value, ordinality)
      )
      UPDATE ${fixtures}
      SET 
        video_links = (SELECT new_links FROM updated_links),
        updated_at = NOW()
      WHERE id = ${fixtureId}
        AND EXISTS (SELECT 1 FROM updated_links WHERE video_found = true)
      RETURNING video_links, 
        (SELECT video_found FROM updated_links) as video_found
    `);

    if (!result.rows || result.rows.length === 0) {
      throw new Error('Fixture not found or video not found in fixture');
    }

    if (!result.rows[0].video_found) {
      throw new Error('Video not found in fixture');
    }

    return result.rows[0].video_links || [];
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
  async getCompetitions(clubId?: string): Promise<Competition[]> {
    if (clubId) {
      return await db.select().from(competitions).where(eq(competitions.clubId, clubId));
    }
    return await db.select().from(competitions);
  }

  async getCompetition(id: string): Promise<Competition | undefined> {
    const [competition] = await db.select().from(competitions).where(eq(competitions.id, id));
    return competition;
  }

  async getOrCreateCompetition(name: string, clubId?: string): Promise<Competition> {
    // First try to find existing competition (match by name and clubId)
    const conditions = [eq(competitions.name, name)];
    if (clubId) {
      conditions.push(eq(competitions.clubId, clubId));
    }
    const [existingCompetition] = await db.select().from(competitions).where(and(...conditions));
    if (existingCompetition) {
      return existingCompetition;
    }

    // Create new competition if it doesn't exist
    const id = randomUUID();
    const newCompetition: Competition = {
      id,
      clubId: clubId || null,
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
      clubId: competition.clubId || null,
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

  // Team-Competition operations
  async getTeamCompetitions(teamId: string): Promise<(TeamCompetition & { competition: Competition })[]> {
    const results = await db
      .select({
        teamCompetition: teamCompetitions,
        competition: competitions,
      })
      .from(teamCompetitions)
      .leftJoin(competitions, eq(teamCompetitions.competitionId, competitions.id))
      .where(eq(teamCompetitions.teamId, teamId));

    return results.map(r => ({
      ...r.teamCompetition,
      competition: r.competition!,
    }));
  }

  async setTeamCompetition(teamId: string, competitionId: string, isEnabled: boolean): Promise<TeamCompetition> {
    // Check if the relationship already exists
    const [existing] = await db
      .select()
      .from(teamCompetitions)
      .where(
        and(
          eq(teamCompetitions.teamId, teamId),
          eq(teamCompetitions.competitionId, competitionId)
        )
      );

    if (existing) {
      // Update existing relationship
      const [updated] = await db
        .update(teamCompetitions)
        .set({ isEnabled, updatedAt: new Date() })
        .where(eq(teamCompetitions.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new relationship
      const [created] = await db
        .insert(teamCompetitions)
        .values({
          teamId,
          competitionId,
          isEnabled,
        })
        .returning();
      return created;
    }
  }

  async getEnabledCompetitions(teamId: string): Promise<Competition[]> {
    const results = await db
      .select({ competition: competitions })
      .from(teamCompetitions)
      .leftJoin(competitions, eq(teamCompetitions.competitionId, competitions.id))
      .where(
        and(
          eq(teamCompetitions.teamId, teamId),
          eq(teamCompetitions.isEnabled, true)
        )
      );

    return results
      .map(r => r.competition)
      .filter((c): c is Competition => c !== null);
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

  // Player stats operations
  async getPlayerStats(playerId: string): Promise<PlayerStats[]> {
    return await db.select().from(playerStats).where(eq(playerStats.playerId, playerId));
  }

  async getPlayerStatsByFixture(playerId: string, fixtureId: string): Promise<PlayerStats[]> {
    return await db.select().from(playerStats).where(
      and(eq(playerStats.playerId, playerId), eq(playerStats.fixtureId, fixtureId))
    );
  }

  async createPlayerStats(stats: InsertPlayerStats): Promise<PlayerStats> {
    const id = randomUUID();
    const newStats: PlayerStats = {
      ...stats,
      id,
      createdAt: new Date(),
      // Set defaults for optional fields
      totalDistance: stats.totalDistance || null,
      goals: stats.goals || null,
      assists: stats.assists || null,
      shotsAttempted: stats.shotsAttempted || null,
      shotsOnTarget: stats.shotsOnTarget || null,
      runsIntoBoxes: stats.runsIntoBoxes || null,
      dangerousCrosses: stats.dangerousCrosses || null,
      dribbles: stats.dribbles || null,
      dribblesSuccessful: stats.dribblesSuccessful || null,
      dribblesSuccessRate: stats.dribblesSuccessRate || null,
      penetratingDribbles: stats.penetratingDribbles || null,
      penetratingDribblesSuccessful: stats.penetratingDribblesSuccessful || null,
      penetratingDribblesSuccessRate: stats.penetratingDribblesSuccessRate || null,
      takeOns: stats.takeOns || null,
      firstTouchSuccess: stats.firstTouchSuccess || null,
      firstTouchAttempted: stats.firstTouchAttempted || null,
      firstTouchSuccessRate: stats.firstTouchSuccessRate || null,
      tackles: stats.tackles || null,
      tacklesWon: stats.tacklesWon || null,
      tacklesSuccessRate: stats.tacklesSuccessRate || null,
      interceptions: stats.interceptions || null,
      clearances: stats.clearances || null,
      foulsCommitted: stats.foulsCommitted || null,
      foulsWon: stats.foulsWon || null,
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
      sprintsCompleted: stats.sprintsCompleted || null,
      highIntensityRuns: stats.highIntensityRuns || null,
    };
    
    await db.insert(playerStats).values(newStats);
    return newStats;
  }

  async updatePlayerStats(id: string, stats: Partial<InsertPlayerStats>): Promise<PlayerStats> {
    const [updatedStats] = await db
      .update(playerStats)
      .set(stats)
      .where(eq(playerStats.id, id))
      .returning();
    
    if (!updatedStats) {
      throw new Error("Player statistics not found");
    }
    
    return updatedStats;
  }

  async deletePlayerStats(id: string): Promise<void> {
    await db.delete(playerStats).where(eq(playerStats.id, id));
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

  // DevOps Page Requirements CRUD
  async getPageRequirements(appId?: string): Promise<PageRequirementRecord[]> {
    if (appId) {
      return await db.select().from(pageRequirements).where(eq(pageRequirements.appId, appId));
    }
    return await db.select().from(pageRequirements);
  }

  async getPageRequirement(id: string): Promise<PageRequirementRecord | undefined> {
    const [result] = await db.select().from(pageRequirements).where(eq(pageRequirements.id, id));
    return result;
  }

  async createPageRequirement(req: InsertPageRequirement): Promise<PageRequirementRecord> {
    const [result] = await db.insert(pageRequirements).values({
      ...req,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result;
  }

  async updatePageRequirement(id: string, req: Partial<InsertPageRequirement>): Promise<PageRequirementRecord> {
    const [result] = await db.update(pageRequirements)
      .set({ ...req, updatedAt: new Date() })
      .where(eq(pageRequirements.id, id))
      .returning();
    if (!result) throw new Error("Page requirement not found");
    return result;
  }

  async deletePageRequirement(id: string): Promise<void> {
    await db.delete(pageRequirements).where(eq(pageRequirements.id, id));
  }

  // DevOps Data Models CRUD
  async getDevopsDataModels(appId?: string): Promise<DevopsDataModelRecord[]> {
    if (appId) {
      return await db.select().from(dataModels).where(eq(dataModels.appId, appId));
    }
    return await db.select().from(dataModels);
  }

  async getDevopsDataModel(id: string): Promise<DevopsDataModelRecord | undefined> {
    const [result] = await db.select().from(dataModels).where(eq(dataModels.id, id));
    return result;
  }

  async createDevopsDataModel(model: InsertDevopsDataModel): Promise<DevopsDataModelRecord> {
    const [result] = await db.insert(dataModels).values({
      ...model,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result;
  }

  async updateDevopsDataModel(id: string, model: Partial<InsertDevopsDataModel>): Promise<DevopsDataModelRecord> {
    const [result] = await db.update(dataModels)
      .set({ ...model, updatedAt: new Date() })
      .where(eq(dataModels.id, id))
      .returning();
    if (!result) throw new Error("Data model not found");
    return result;
  }

  async deleteDevopsDataModel(id: string): Promise<void> {
    await db.delete(dataModels).where(eq(dataModels.id, id));
  }

  // DevOps Change Log CRUD
  async getDevopsChangeLogs(appId?: string): Promise<DevopsChangeLogRecord[]> {
    if (appId) {
      return await db.select().from(changeLog).where(eq(changeLog.appId, appId));
    }
    return await db.select().from(changeLog);
  }

  async getDevopsChangeLog(id: string): Promise<DevopsChangeLogRecord | undefined> {
    const [result] = await db.select().from(changeLog).where(eq(changeLog.id, id));
    return result;
  }

  async createDevopsChangeLog(entry: InsertDevopsChangeLog): Promise<DevopsChangeLogRecord> {
    const [result] = await db.insert(changeLog).values({
      ...entry,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result;
  }

  async updateDevopsChangeLog(id: string, entry: Partial<InsertDevopsChangeLog>): Promise<DevopsChangeLogRecord> {
    const [result] = await db.update(changeLog)
      .set({ ...entry, updatedAt: new Date() })
      .where(eq(changeLog.id, id))
      .returning();
    if (!result) throw new Error("Change log entry not found");
    return result;
  }

  async deleteDevopsChangeLog(id: string): Promise<void> {
    await db.delete(changeLog).where(eq(changeLog.id, id));
  }

  // Work Items CRUD
  async getWorkItems(filters?: { type?: string; parentId?: string; area?: string; status?: string; appId?: string }): Promise<WorkItemRecord[]> {
    let query = db.select().from(workItems);
    
    if (filters) {
      const conditions = [];
      if (filters.type) conditions.push(eq(workItems.type, filters.type));
      if (filters.parentId) conditions.push(eq(workItems.parentId, filters.parentId));
      if (filters.area) conditions.push(eq(workItems.area, filters.area));
      if (filters.status) conditions.push(eq(workItems.status, filters.status));
      if (filters.appId) conditions.push(eq(workItems.appId, filters.appId));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }
    }
    
    return await query;
  }

  async getWorkItem(id: string): Promise<WorkItemRecord | undefined> {
    const [result] = await db.select().from(workItems).where(eq(workItems.id, id));
    return result;
  }

  async createWorkItem(item: InsertWorkItem): Promise<WorkItemRecord> {
    const [result] = await db.insert(workItems).values({
      ...item,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result;
  }

  async updateWorkItem(id: string, item: Partial<InsertWorkItem>): Promise<WorkItemRecord> {
    const [result] = await db.update(workItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(workItems.id, id))
      .returning();
    if (!result) throw new Error("Work item not found");
    return result;
  }

  async deleteWorkItem(id: string): Promise<void> {
    // Also delete any links involving this item
    await db.delete(workItemLinks).where(
      sql`${workItemLinks.sourceId} = ${id} OR ${workItemLinks.targetId} = ${id}`
    );
    await db.delete(workItems).where(eq(workItems.id, id));
  }

  async convertWorkItemType(id: string, newType: string): Promise<WorkItemRecord> {
    const existing = await this.getWorkItem(id);
    if (!existing) throw new Error("Work item not found");
    
    const [result] = await db.update(workItems)
      .set({ 
        type: newType,
        convertedFrom: existing.id,
        updatedAt: new Date() 
      })
      .where(eq(workItems.id, id))
      .returning();
    return result;
  }

  async getWorkItemChildren(parentId: string): Promise<WorkItemRecord[]> {
    return await db.select().from(workItems).where(eq(workItems.parentId, parentId));
  }

  // Work Item Links CRUD
  async getWorkItemLinks(itemId?: string): Promise<WorkItemLinkRecord[]> {
    if (itemId) {
      return await db.select().from(workItemLinks).where(
        sql`${workItemLinks.sourceId} = ${itemId} OR ${workItemLinks.targetId} = ${itemId}`
      );
    }
    return await db.select().from(workItemLinks);
  }

  async createWorkItemLink(link: InsertWorkItemLink): Promise<WorkItemLinkRecord> {
    const [result] = await db.insert(workItemLinks).values({
      ...link,
      createdAt: new Date(),
    }).returning();
    return result;
  }

  async deleteWorkItemLink(id: string): Promise<void> {
    await db.delete(workItemLinks).where(eq(workItemLinks.id, id));
  }

  async getLinkedItems(itemId: string, linkType?: string): Promise<WorkItemRecord[]> {
    // Get all links for this item
    let links: WorkItemLinkRecord[];
    if (linkType) {
      links = await db.select().from(workItemLinks).where(
        and(
          sql`${workItemLinks.sourceId} = ${itemId} OR ${workItemLinks.targetId} = ${itemId}`,
          eq(workItemLinks.linkType, linkType)
        )
      );
    } else {
      links = await db.select().from(workItemLinks).where(
        sql`${workItemLinks.sourceId} = ${itemId} OR ${workItemLinks.targetId} = ${itemId}`
      );
    }
    
    // Get the linked item IDs (excluding the current item)
    const linkedIds = links.map(link => 
      link.sourceId === itemId ? link.targetId : link.sourceId
    ).filter(id => id !== itemId);
    
    if (linkedIds.length === 0) return [];
    
    // Fetch all linked items
    const items = await db.select().from(workItems).where(
      sql`${workItems.id} IN (${sql.join(linkedIds.map(id => sql`${id}`), sql`, `)})`
    );
    
    return items;
  }

  // Seed requirements data from hardcoded registry
  async seedRequirementsData(): Promise<void> {
    // Check if data already exists
    const existingRequirements = await db.select().from(pageRequirements);
    if (existingRequirements.length > 0) {
      console.log('Requirements data already exists, skipping seed');
      return;
    }

    console.log('Seeding requirements data...');

    // Import hardcoded data from registry
    const { requirementsRegistry, dataModels: dataModelsData, changeLog: changeLogData } = await import('../client/src/lib/requirements-registry');

    // Seed page requirements
    for (const req of requirementsRegistry) {
      await db.insert(pageRequirements).values({
        id: req.id,
        title: req.title,
        route: req.route,
        section: req.section,
        overview: req.overview,
        parentId: req.parentId || null,
        functionalRequirements: req.functionalRequirements,
        acceptanceCriteria: req.acceptanceCriteria,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Seed data models
    for (const model of dataModelsData) {
      await db.insert(dataModels).values({
        id: model.id,
        name: model.name,
        description: model.description,
        fields: model.fields,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Seed change log
    for (const entry of changeLogData) {
      await db.insert(changeLog).values({
        id: entry.id,
        date: entry.date,
        type: entry.type,
        area: entry.area,
        description: entry.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    console.log('Requirements data seeded successfully');
  }

  // Test Run CRUD operations
  async getTestRuns(appId?: string): Promise<TestRunRecord[]> {
    if (appId) {
      return await db.select().from(testRuns).where(eq(testRuns.appId, appId)).orderBy(sql`${testRuns.runNumber} DESC`);
    }
    return await db.select().from(testRuns).orderBy(sql`${testRuns.runNumber} DESC`);
  }

  async getTestRun(id: string): Promise<TestRunRecord | undefined> {
    const [run] = await db.select().from(testRuns).where(eq(testRuns.id, id));
    return run;
  }

  async createTestRun(run: InsertTestRun): Promise<TestRunRecord> {
    const [created] = await db.insert(testRuns).values(run).returning();
    return created;
  }

  async updateTestRun(id: string, run: Partial<InsertTestRun>): Promise<TestRunRecord> {
    const [updated] = await db.update(testRuns)
      .set({ ...run, updatedAt: new Date() })
      .where(eq(testRuns.id, id))
      .returning();
    return updated;
  }

  async deleteTestRun(id: string): Promise<void> {
    // Delete all results first
    await db.delete(testRunResults).where(eq(testRunResults.testRunId, id));
    // Then delete the run
    await db.delete(testRuns).where(eq(testRuns.id, id));
  }

  // Test Run Results CRUD operations
  async getTestRunResults(testRunId: string): Promise<TestRunResultRecord[]> {
    return await db.select().from(testRunResults).where(eq(testRunResults.testRunId, testRunId));
  }

  async createTestRunResult(result: InsertTestRunResult): Promise<TestRunResultRecord> {
    const [created] = await db.insert(testRunResults).values(result).returning();
    return created;
  }

  async updateTestRunResult(id: string, result: Partial<InsertTestRunResult>): Promise<TestRunResultRecord> {
    const [updated] = await db.update(testRunResults)
      .set(result)
      .where(eq(testRunResults.id, id))
      .returning();
    return updated;
  }

  async deleteTestRunResult(id: string): Promise<void> {
    await db.delete(testRunResults).where(eq(testRunResults.id, id));
  }

  async getTestRunWithResults(id: string): Promise<{ run: TestRunRecord; results: TestRunResultRecord[] } | undefined> {
    const run = await this.getTestRun(id);
    if (!run) return undefined;
    const results = await this.getTestRunResults(id);
    return { run, results };
  }

  // FM Apps CRUD operations
  async getFmApps(): Promise<FmApp[]> {
    return await db.select().from(fmApps).orderBy(fmApps.name);
  }

  async getFmApp(id: string): Promise<FmApp | undefined> {
    const [app] = await db.select().from(fmApps).where(eq(fmApps.id, id));
    return app;
  }

  async createFmApp(app: InsertFmApp): Promise<FmApp> {
    const [created] = await db.insert(fmApps).values(app).returning();
    return created;
  }

  async updateFmApp(id: string, app: Partial<InsertFmApp>): Promise<FmApp> {
    const [updated] = await db.update(fmApps)
      .set({ ...app, updatedAt: new Date() })
      .where(eq(fmApps.id, id))
      .returning();
    return updated;
  }

  async deleteFmApp(id: string): Promise<void> {
    await db.delete(fmApps).where(eq(fmApps.id, id));
  }

  // FM Widgets CRUD operations
  async getFmWidgets(appId?: string): Promise<FmWidget[]> {
    if (appId) {
      return await db.select().from(fmWidgets).where(eq(fmWidgets.appId, appId)).orderBy(fmWidgets.name);
    }
    return await db.select().from(fmWidgets).orderBy(fmWidgets.name);
  }

  async getFmWidget(id: string): Promise<FmWidget | undefined> {
    const [widget] = await db.select().from(fmWidgets).where(eq(fmWidgets.id, id));
    return widget;
  }

  async createFmWidget(widget: InsertFmWidget): Promise<FmWidget> {
    const [created] = await db.insert(fmWidgets).values(widget).returning();
    return created;
  }

  async updateFmWidget(id: string, widget: Partial<InsertFmWidget>): Promise<FmWidget> {
    const [updated] = await db.update(fmWidgets)
      .set({ ...widget, updatedAt: new Date() })
      .where(eq(fmWidgets.id, id))
      .returning();
    return updated;
  }

  async deleteFmWidget(id: string): Promise<void> {
    await db.delete(fmWidgets).where(eq(fmWidgets.id, id));
  }
}

export const storage = new DatabaseStorage();