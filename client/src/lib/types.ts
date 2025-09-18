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
  totalGoalsConceded: number;
  goalDifference: number;
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

export interface ColorTheme {
  name: string;
  light: { accent: string; light: string };
  dark: { accent: string; light: string };
}

// Match event types for timeline and analysis components
export interface MatchEvent {
  id: string;
  index: number;
  period: number;
  timestamp: string;
  minute: number;
  second: number;
  type: {
    id: number;
    name: string;
  };
  team: {
    id: number;
    name: string;
  };
  player?: {
    id: number;
    name: string;
  };
  location?: number[];
  under_pressure?: boolean;
  pass?: {
    recipient?: {
      id: number;
      name: string;
    };
    length: number;
    type?: {
      id: number;
      name: string;
    };
    technique?: {
      id: number;
      name: string;
    };
    outcome?: {
      id: number;
      name: string;
    };
    height?: {
      id: number;
      name: string;
    };
  };
  shot?: {
    statsbomb_xg: number;
    end_location: number[];
    technique?: {
      id: number;
      name: string;
    };
    body_part?: {
      id: number;
      name: string;
    };
    type?: {
      id: number;
      name: string;
    };
    outcome: {
      id: number;
      name: string;
    };
    first_time?: boolean;
    freeze_frame?: any[];
  };
  clearance?: {
    left_foot?: boolean;
    body_part?: {
      id: number;
      name: string;
    };
  };
  duel?: {
    type?: {
      id: number;
      name: string;
    };
    outcome?: {
      id: number;
      name: string;
    };
  };
  substitution?: {
    outcome?: {
      id: number;
      name: string;
    };
    replacement?: {
      id: number;
      name: string;
    };
  };
  tactics?: {
    formation: number;
    lineup: Array<{
      player: {
        id: number;
        name: string;
      };
      position: {
        id: number;
        name: string;
      };
      jersey_number: number;
    }>;
  };
  goalkeeper?: {
    type?: {
      id: number;
      name: string;
    };
    outcome?: {
      id: number;
      name: string;
    };
  };
}

// Team configuration for flexible color mapping
export interface TeamConfig {
  id: number;
  name: string;
  shortName: string;
  color: string;
  lightColor: string;
  textColor: string;
}

// Utility functions for match events
export const timestampToSeconds = (timestamp: string): number => {
  const [hours, minutes, seconds] = timestamp.split(':');
  const [secs, ms] = seconds.split('.');
  return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(secs) + (parseInt(ms || '0') / 1000);
};

// Get team configuration from event data
export const getTeamConfig = (teamName: string, teamId: number): TeamConfig => {
  // Common team color mappings - can be extended as needed
  const teamColorMap: { [key: string]: { color: string; lightColor: string; textColor: string; shortName: string } } = {
    'spain': { color: 'bg-red-600', lightColor: 'bg-red-400', textColor: 'text-red-600', shortName: 'ESP' },
    'england': { color: 'bg-blue-600', lightColor: 'bg-blue-400', textColor: 'text-blue-600', shortName: 'ENG' },
    'germany': { color: 'bg-black', lightColor: 'bg-gray-600', textColor: 'text-gray-900', shortName: 'GER' },
    'france': { color: 'bg-blue-800', lightColor: 'bg-blue-500', textColor: 'text-blue-800', shortName: 'FRA' },
    'italy': { color: 'bg-green-600', lightColor: 'bg-green-400', textColor: 'text-green-600', shortName: 'ITA' },
    'netherlands': { color: 'bg-orange-600', lightColor: 'bg-orange-400', textColor: 'text-orange-600', shortName: 'NED' },
    'portugal': { color: 'bg-red-700', lightColor: 'bg-red-500', textColor: 'text-red-700', shortName: 'POR' },
    'brazil': { color: 'bg-yellow-500', lightColor: 'bg-yellow-300', textColor: 'text-yellow-600', shortName: 'BRA' },
    'argentina': { color: 'bg-sky-400', lightColor: 'bg-sky-200', textColor: 'text-sky-600', shortName: 'ARG' },
  };

  // Extract key from team name (handle various formats)
  const teamKey = teamName.toLowerCase()
    .replace(/women.s/g, '')
    .replace(/men.s/g, '')
    .replace(/\s+/g, '')
    .replace(/'/g, '')
    .trim();

  // Find matching team configuration
  const matchedTeam = Object.keys(teamColorMap).find(key => 
    teamKey.includes(key) || key.includes(teamKey)
  );

  if (matchedTeam && teamColorMap[matchedTeam]) {
    const config = teamColorMap[matchedTeam];
    return {
      id: teamId,
      name: teamName,
      shortName: config.shortName,
      color: config.color,
      lightColor: config.lightColor,
      textColor: config.textColor
    };
  }

  // Default configuration for unknown teams
  // Use team ID to generate consistent colors
  const colors = [
    { color: 'bg-purple-600', lightColor: 'bg-purple-400', textColor: 'text-purple-600' },
    { color: 'bg-green-600', lightColor: 'bg-green-400', textColor: 'text-green-600' },
    { color: 'bg-pink-600', lightColor: 'bg-pink-400', textColor: 'text-pink-600' },
    { color: 'bg-indigo-600', lightColor: 'bg-indigo-400', textColor: 'text-indigo-600' },
    { color: 'bg-teal-600', lightColor: 'bg-teal-400', textColor: 'text-teal-600' },
    { color: 'bg-amber-600', lightColor: 'bg-amber-400', textColor: 'text-amber-600' },
  ];
  
  const colorIndex = teamId % colors.length;
  const selectedColor = colors[colorIndex];
  
  return {
    id: teamId,
    name: teamName,
    shortName: teamName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 3),
    color: selectedColor.color,
    lightColor: selectedColor.lightColor,
    textColor: selectedColor.textColor
  };
};
