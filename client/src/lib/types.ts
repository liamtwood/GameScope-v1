export type UserRole = 'admin' | 'coach' | 'player';

export type FixtureStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_CONTEST';

export type FixtureType = 'HOME' | 'AWAY' | 'NEUTRAL';

export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM' | 'LW' | 'RW' | 'ST' | 'CF';

export interface TeamStatistics {
  totalPlayers: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  totalGoals: number;
  totalAssists: number;
  topScorer?: {
    name: string;
    goals: number;
    position: string;
  };
  topAssist?: {
    name: string;
    assists: number;
    position: string;
  };
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  tooltip: string;
}
