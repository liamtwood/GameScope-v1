import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MatchEvent, timestampToSeconds } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Play, ChevronDown, Target, Filter, AlertCircle, Search } from 'lucide-react';

interface RichMatchEventViewProps {
  onEventClick?: (eventTime: number, period: number) => void;
  events?: any[];
}

const eventCategories = {
  SHOTS: ['Shot - Goal', 'Shot - Saved', 'Shot - Blocked', 'Shot Off Target', 'Shot - Post', 'Shot - Wayward', 'High xG Chances', 'Medium xG Chances', 'Low xG Chances'],
  DEFENSE: ['Block', 'Clearance', 'Interception', 'Pressure', 'Goal Keeper', 'Won Tackles', 'Lost Tackles'],
  POSSESSION: ['Pass', 'Ball Receipt*', 'Carry', 'Shield', 'Dribble'],
  'SET PIECES': ['Corner', 'Free Kick', 'Throw-in', 'Goal Kick', 'Kick Off', 'Penalty', 'Penalty Saved'],
  TECHNIQUE: ['Headers', 'Left Foot', 'Right Foot', 'Volleys'],
  TRANSITIONS: ['50/50', 'Duel', 'Ball Recovery', 'Dispossessed', 'Dribbled Past', 'Foul Committed', 'Foul Won', 'Miscontrol'],
  SUBS: ['Tactical Substitutions'],
};

const TEAM_SHORT_NAMES: Record<string, string> = {
  'Afghanistan': 'AFG', 'Albania': 'ALB', 'Algeria': 'ALG', 'Argentina': 'ARG',
  'Armenia': 'ARM', 'Australia': 'AUS', 'Austria': 'AUT', 'Azerbaijan': 'AZE',
  'Bahrain': 'BHR', 'Bangladesh': 'BAN', 'Belgium': 'BEL', 'Bolivia': 'BOL',
  'Bosnia and Herzegovina': 'BIH', 'Brazil': 'BRA', 'Bulgaria': 'BUL',
  'Cameroon': 'CMR', 'Canada': 'CAN', 'Chile': 'CHI', 'China': 'CHN',
  "China PR": 'CHN', 'Colombia': 'COL', 'Costa Rica': 'CRC', 'Croatia': 'CRO',
  'Czech Republic': 'CZE', 'Czechia': 'CZE', 'Denmark': 'DEN', 'Ecuador': 'ECU',
  'Egypt': 'EGY', 'England': 'ENG', 'Estonia': 'EST', 'Ethiopia': 'ETH',
  'Finland': 'FIN', 'France': 'FRA', 'Georgia': 'GEO', 'Germany': 'GER',
  'Ghana': 'GHA', 'Greece': 'GRE', 'Guatemala': 'GUA', 'Honduras': 'HON',
  'Hungary': 'HUN', 'Iceland': 'ISL', 'India': 'IND', 'Indonesia': 'IDN',
  'Iran': 'IRN', 'Iraq': 'IRQ', 'Ireland': 'IRL', 'Israel': 'ISR',
  'Italy': 'ITA', 'Ivory Coast': 'CIV', 'Jamaica': 'JAM', 'Japan': 'JPN',
  'Jordan': 'JOR', 'Kazakhstan': 'KAZ', 'Kenya': 'KEN', 'Kosovo': 'KOS',
  'Kuwait': 'KUW', 'Latvia': 'LVA', 'Lithuania': 'LTU', 'Luxembourg': 'LUX',
  'Malaysia': 'MAS', 'Mali': 'MLI', 'Malta': 'MLT', 'Mexico': 'MEX',
  'Moldova': 'MDA', 'Montenegro': 'MNE', 'Morocco': 'MAR', 'Netherlands': 'NED',
  'New Zealand': 'NZL', 'Nigeria': 'NGA', 'Northern Ireland': 'NIR',
  'Norway': 'NOR', 'Oman': 'OMA', 'Pakistan': 'PAK', 'Panama': 'PAN',
  'Paraguay': 'PAR', 'Peru': 'PER', 'Philippines': 'PHI', 'Poland': 'POL',
  'Portugal': 'POR', 'Qatar': 'QAT', 'Romania': 'ROU', 'Russia': 'RUS',
  'Saudi Arabia': 'KSA', 'Scotland': 'SCO', 'Senegal': 'SEN', 'Serbia': 'SRB',
  'Slovakia': 'SVK', 'Slovenia': 'SVN', 'South Africa': 'RSA', 'South Korea': 'KOR',
  'Korea Republic': 'KOR', 'Spain': 'ESP', 'Sweden': 'SWE', 'Switzerland': 'SUI',
  'Syria': 'SYR', 'Thailand': 'THA', 'Tunisia': 'TUN', 'Turkey': 'TUR',
  'Türkiye': 'TUR', 'Ukraine': 'UKR', 'United Arab Emirates': 'UAE',
  'United States': 'USA', 'USA': 'USA', 'Uruguay': 'URU', 'Uzbekistan': 'UZB',
  'Venezuela': 'VEN', 'Vietnam': 'VIE', 'Wales': 'WAL', 'Zambia': 'ZAM',
};

const getTeamShortName = (teamName: string): string => {
  if (TEAM_SHORT_NAMES[teamName]) return TEAM_SHORT_NAMES[teamName];
  const base = teamName.replace(/\s+(Women|Men|Women's|Men's|U\d+|Youth|Olympic|FC|CF|SC|AC|AFC|RFC|United|City|Town|Wanderers|Rovers|Athletic|Albion)\s*$/i, '').trim();
  if (TEAM_SHORT_NAMES[base]) return TEAM_SHORT_NAMES[base];
  return teamName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 4);
};

const getPositionAcronym = (position: string): string => {
  const positionMap: Record<string, string> = {
    'Goalkeeper': 'GK', 'Right Back': 'RB', 'Right Center Back': 'RCB',
    'Center Back': 'CB', 'Left Center Back': 'LCB', 'Left Back': 'LB',
    'Right Wing Back': 'RWB', 'Left Wing Back': 'LWB', 'Defensive Midfield': 'DM',
    'Right Defensive Midfield': 'RDM', 'Left Defensive Midfield': 'LDM',
    'Center Defensive Midfield': 'CDM', 'Right Midfield': 'RM', 'Center Midfield': 'CM',
    'Left Midfield': 'LM', 'Right Center Midfield': 'RCM', 'Left Center Midfield': 'LCM',
    'Attacking Midfield': 'AM', 'Right Attacking Midfield': 'RAM',
    'Center Attacking Midfield': 'CAM', 'Left Attacking Midfield': 'LAM',
    'Right Wing': 'RW', 'Left Wing': 'LW', 'Right Center Forward': 'RCF',
    'Center Forward': 'CF', 'Left Center Forward': 'LCF', 'Striker': 'ST',
    'Right Forward': 'RF', 'Left Forward': 'LF',
  };
  return positionMap[position] || position.slice(0, 3).toUpperCase();
};

const getEventTypeColor = (eventType: string, shotOutcome?: string) => {
  if (eventType === 'Shot' && shotOutcome) {
    const shotColors: Record<string, string> = {
      'Goal': 'bg-green-500 text-white font-bold',
      'Saved': 'bg-yellow-500 text-white',
      'Off T': 'bg-red-500 text-white',
      'Blocked': 'bg-orange-500 text-white',
      'Wayward': 'bg-gray-500 text-white',
    };
    return shotColors[shotOutcome] || 'bg-red-100 text-red-800';
  }
  const colors: Record<string, string> = {
    'Pass': 'bg-blue-100 text-blue-800',
    'Ball Receipt*': 'bg-green-100 text-green-800',
    'Carry': 'bg-yellow-100 text-yellow-800',
    'Starting XI': 'bg-purple-100 text-purple-800',
    'Half Start': 'bg-orange-100 text-orange-800',
    'Shot': 'bg-red-100 text-red-800',
    'Substitution': 'bg-indigo-100 text-indigo-800',
    'Half End': 'bg-gray-100 text-gray-800',
  };
  return colors[eventType] || 'bg-gray-100 text-gray-800';
};

const getEnhancedEventDisplay = (event: MatchEvent): string => {
  if (event.type.name === 'Shot' && event.shot?.outcome?.name) {
    return event.shot.outcome.name === 'Off T'
      ? 'Shot Off Target'
      : `Shot - ${event.shot.outcome.name}`;
  }
  if (event.type.name === 'Pass' && event.pass?.type?.name === 'Free Kick') {
    return event.pass.technique?.name ? `Free Kick - ${event.pass.technique.name}` : 'Free Kick';
  }
  if (event.type.name === 'Pass' && event.pass?.type?.name === 'Corner') {
    if (event.pass.technique?.name) return `Corner - ${event.pass.technique.name}`;
    if (event.pass.outcome?.name) return `Corner - ${event.pass.outcome.name}`;
    return 'Corner';
  }
  if (event.type.name === 'Pass' && event.pass?.type?.name === 'Throw-in') {
    if (event.pass.height?.name) return `Throw-in - ${event.pass.height.name}`;
    if (event.pass.outcome?.name) return `Throw-in - ${event.pass.outcome.name}`;
    return 'Throw-in';
  }
  if (event.type.name === 'Pass' && event.pass?.type?.name === 'Goal Kick') {
    if (event.pass.height?.name) return `Goal Kick - ${event.pass.height.name}`;
    if (event.pass.outcome?.name) return `Goal Kick - ${event.pass.outcome.name}`;
    return 'Goal Kick';
  }
  if (event.type.name === 'Pass' && event.pass?.type?.name === 'Kick Off') {
    return event.pass.height?.name ? `Kick Off - ${event.pass.height.name}` : 'Kick Off';
  }
  if (event.type.name === 'Shot' && event.shot?.type?.name === 'Penalty') {
    return event.shot.outcome?.name === 'Off T'
      ? 'Penalty Off Target'
      : `Penalty - ${event.shot.outcome?.name || 'Unknown'}`;
  }
  return event.type.name;
};

const formatTimestamp = (timestamp: string): string => {
  const seconds = timestampToSeconds(timestamp);
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface FilterSidebarProps {
  availableEventTypes: string[];
  selectedEventTypes: string[];
  teams: string[];
  teamData: Record<string, { formation: string; startingXI: Array<{ id: number; name: string; jerseyNumber: number; position: string }> }>;
  matchEventCount: (teamName: string) => number;
  selectedTeams: string[];
  selectedPlayers: number[];
  getEventTypeCount: (t: string) => number;
  getCategoryCount: (cats: string[]) => number;
  toggleType: (t: string) => void;
  toggleTeam: (t: string) => void;
  togglePlayer: (id: number) => void;
  toggleCategory: (name: string) => void;
}

function FilterSidebarContent({
  availableEventTypes, selectedEventTypes, teams, teamData, matchEventCount,
  selectedTeams, selectedPlayers, getEventTypeCount, getCategoryCount,
  toggleType, toggleTeam, togglePlayer, toggleCategory,
}: FilterSidebarProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Event Categories</h3>
        <div className="space-y-2">
          {Object.entries(eventCategories).map(([catName, catEvents]) => {
            const available = catEvents.filter(t => availableEventTypes.includes(t));
            const count = getCategoryCount(available);
            const selected = selectedEventTypes.filter(t => catEvents.includes(t));
            if (available.length === 0) return null;
            return (
              <Collapsible key={catName} className="space-y-1">
                <div
                  className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => toggleCategory(catName)}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selected.length > 0 && selected.length === available.length} onChange={() => {}} />
                    <span className="font-medium text-xs">{catName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">{count}</Badge>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="px-1 h-6" onClick={e => e.stopPropagation()}>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
                <CollapsibleContent className="pl-3">
                  <div className="space-y-1">
                    {available.map(eventType => {
                      const c = getEventTypeCount(eventType);
                      const isSel = selectedEventTypes.includes(eventType);
                      return (
                        <div
                          key={eventType}
                          className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted/40 cursor-pointer"
                          onClick={() => toggleType(eventType)}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox checked={isSel} onChange={() => {}} className="h-3 w-3" />
                            <span className="text-xs">{eventType}</span>
                          </div>
                          <Badge variant={isSel ? 'default' : 'outline'} className="text-xs">{c}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Teams & Players</h3>
        <div className="space-y-2">
          {teams.map(teamName => {
            const isTeamSel = selectedTeams.includes(teamName);
            const teamCount = matchEventCount(teamName);
            const players = teamData[teamName]?.startingXI ?? [];
            return (
              <Collapsible key={teamName} className="space-y-1">
                <div className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={isTeamSel} onChange={() => toggleTeam(teamName)} />
                    <span className="text-sm font-medium">{teamName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={isTeamSel ? 'default' : 'outline'} className="text-xs">{teamCount}</Badge>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="px-1 h-6">
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
                <CollapsibleContent className="pl-3">
                  <div className="space-y-1">
                    {players.map(player => {
                      const isSel = selectedPlayers.includes(player.id);
                      return (
                        <div
                          key={player.id}
                          className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted/30 cursor-pointer"
                          onClick={() => togglePlayer(player.id)}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox checked={isSel} onChange={() => {}} className="h-3 w-3" />
                            <span className="text-xs">{player.jerseyNumber}. {player.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">{getPositionAcronym(player.position)}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function RichMatchEventView({ onEventClick, events: eventsOverride }: RichMatchEventViewProps) {
  const matchEvents = (eventsOverride ?? []) as any[];
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const { availableEventTypes, teams, teamData } = useMemo(() => {
    const typeSet = new Set(matchEvents.map((e: any) => e.type.name));

    matchEvents.forEach((event: any) => {
      if (event.type.name === 'Pass' && event.pass?.type?.name) typeSet.add(event.pass.type.name);
      if (event.type.name === 'Shot' && event.shot?.outcome?.name) {
        typeSet.add(event.shot.outcome.name === 'Off T' ? 'Shot Off Target' : `Shot - ${event.shot.outcome.name}`);
      }
      if (event.type.name === 'Shot' && event.shot?.type?.name === 'Penalty') typeSet.add('Penalty');
      if (event.type.name === 'Goal Keeper' && event.goalkeeper?.type?.name === 'Penalty Saved') typeSet.add('Penalty Saved');
    });

    if (matchEvents.some((e: any) => e.under_pressure === true)) typeSet.add('Under Pressure');
    if (matchEvents.some((e: any) => e.under_pressure !== true)) typeSet.add('Composed Play');
    if (matchEvents.some((e: any) => e.shot?.statsbomb_xg > 0.3)) typeSet.add('High xG Chances');
    if (matchEvents.some((e: any) => e.shot?.statsbomb_xg >= 0.1 && e.shot?.statsbomb_xg <= 0.3)) typeSet.add('Medium xG Chances');
    if (matchEvents.some((e: any) => e.shot?.statsbomb_xg < 0.1 && e.shot?.statsbomb_xg > 0)) typeSet.add('Low xG Chances');
    if (matchEvents.some((e: any) => e.shot?.body_part?.name === 'Head' || e.clearance?.body_part?.name === 'Head')) typeSet.add('Headers');
    if (matchEvents.some((e: any) => e.shot?.body_part?.name === 'Left Foot' || e.clearance?.left_foot)) typeSet.add('Left Foot');
    if (matchEvents.some((e: any) => e.shot?.body_part?.name === 'Right Foot')) typeSet.add('Right Foot');
    if (matchEvents.some((e: any) => e.shot?.technique?.name === 'Volley')) typeSet.add('Volleys');
    if (matchEvents.some((e: any) => e.substitution?.outcome?.name === 'Tactical')) typeSet.add('Tactical Substitutions');
    if (matchEvents.some((e: any) => e.duel?.type?.name === 'Tackle' && e.duel?.outcome?.name !== 'Lost In Play')) typeSet.add('Won Tackles');
    if (matchEvents.some((e: any) => e.duel?.type?.name === 'Tackle' && e.duel?.outcome?.name === 'Lost In Play')) typeSet.add('Lost Tackles');

    const teamSet = new Set(matchEvents.map((e: any) => e.team.name));
    const teamNames = Array.from(teamSet) as string[];

    const teamFormationData: Record<string, { formation: string; startingXI: Array<{ id: number; name: string; jerseyNumber: number; position: string }> }> = {};

    matchEvents.filter((e: any) => e.type.name === 'Starting XI').forEach((event: any) => {
      const teamName = event.team.name;
      if (!teamFormationData[teamName] && event.tactics?.lineup && event.tactics.formation) {
        teamFormationData[teamName] = {
          formation: event.tactics.formation.toString(),
          startingXI: event.tactics.lineup.map((p: any) => ({
            id: p.player.id,
            name: p.player.name,
            jerseyNumber: p.jersey_number,
            position: p.position.name,
          })),
        };
      }
    });

    teamNames.forEach(name => {
      if (!teamFormationData[name]) teamFormationData[name] = { formation: '4231', startingXI: [] };
    });

    return { availableEventTypes: Array.from(typeSet).sort(), teams: teamNames.sort(), teamData: teamFormationData };
  }, [matchEvents]);

  const getEventTypeCount = (eventType: string): number =>
    matchEvents.filter((e: any) => {
      if (e.type.name === eventType) return true;
      if (e.type.name === 'Pass' && e.pass?.type?.name === eventType) return true;
      if (e.type.name === 'Shot' && (eventType.startsWith('Shot - ') || eventType === 'Shot Off Target')) {
        return eventType === 'Shot Off Target' ? e.shot?.outcome?.name === 'Off T' : e.shot?.outcome?.name === eventType.replace('Shot - ', '');
      }
      if (eventType === 'Under Pressure') return e.under_pressure === true;
      if (eventType === 'Composed Play') return e.under_pressure !== true;
      if (eventType === 'High xG Chances') return e.shot?.statsbomb_xg > 0.3;
      if (eventType === 'Medium xG Chances') return e.shot?.statsbomb_xg >= 0.1 && e.shot?.statsbomb_xg <= 0.3;
      if (eventType === 'Low xG Chances') return e.shot?.statsbomb_xg < 0.1 && e.shot?.statsbomb_xg > 0;
      if (eventType === 'Volleys') return e.shot?.technique?.name === 'Volley';
      if (eventType === 'Left Foot') return e.shot?.body_part?.name === 'Left Foot';
      if (eventType === 'Right Foot') return e.shot?.body_part?.name === 'Right Foot';
      if (eventType === 'Headers') return e.shot?.body_part?.name === 'Head';
      return false;
    }).length;

  const getCategoryCount = (cats: string[]) => cats.reduce((t, et) => t + getEventTypeCount(et), 0);

  const filteredEvents = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return matchEvents.filter((event: any) => {
      const matchesType = selectedEventTypes.length === 0 || selectedEventTypes.some(sel => {
        if (event.type.name === sel) return true;
        if (event.type.name === 'Pass' && event.pass?.type?.name === sel) return true;
        if (event.type.name === 'Shot' && (sel.startsWith('Shot - ') || sel === 'Shot Off Target')) {
          return sel === 'Shot Off Target' ? event.shot?.outcome?.name === 'Off T' : event.shot?.outcome?.name === sel.replace('Shot - ', '');
        }
        if (sel === 'Under Pressure') return event.under_pressure === true;
        if (sel === 'Composed Play') return event.under_pressure !== true;
        if (sel === 'High xG Chances') return event.shot?.statsbomb_xg > 0.3;
        if (sel === 'Medium xG Chances') return event.shot?.statsbomb_xg >= 0.1 && event.shot?.statsbomb_xg <= 0.3;
        if (sel === 'Low xG Chances') return event.shot?.statsbomb_xg < 0.1 && event.shot?.statsbomb_xg > 0;
        if (sel === 'Volleys') return event.shot?.technique?.name === 'Volley';
        if (sel === 'Left Foot') return event.shot?.body_part?.name === 'Left Foot';
        if (sel === 'Right Foot') return event.shot?.body_part?.name === 'Right Foot';
        if (sel === 'Headers') return event.shot?.body_part?.name === 'Head';
        return false;
      });
      const matchesTeam = selectedTeams.length === 0 || selectedTeams.includes(event.team.name);
      const matchesPlayer = selectedPlayers.length === 0 || (event.player && selectedPlayers.includes(event.player.id));
      const matchesSearch = !q || [
        event.player?.name,
        event.team?.name,
        event.type?.name,
        getEnhancedEventDisplay(event),
        event.pass?.recipient?.name,
        event.shot?.outcome?.name,
        event.shot?.technique?.name,
        event.shot?.body_part?.name,
      ].some(v => v?.toLowerCase().includes(q));
      return matchesType && matchesTeam && matchesPlayer && matchesSearch;
    });
  }, [selectedEventTypes, selectedTeams, selectedPlayers, matchEvents, searchText]);

  const toggleType = (t: string) => setSelectedEventTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleTeam = (t: string) => setSelectedTeams(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const togglePlayer = (id: number) => setSelectedPlayers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleCategory = (name: string) => {
    const cats = eventCategories[name as keyof typeof eventCategories];
    const available = cats.filter(t => availableEventTypes.includes(t));
    const selected = selectedEventTypes.filter(t => cats.includes(t));
    if (selected.length === available.length) {
      setSelectedEventTypes(prev => prev.filter(t => !cats.includes(t)));
    } else {
      setSelectedEventTypes(prev => [...prev.filter(t => !cats.includes(t)), ...available]);
    }
  };

  const sidebarProps: FilterSidebarProps = {
    availableEventTypes,
    selectedEventTypes,
    teams,
    teamData,
    matchEventCount: (teamName: string) => matchEvents.filter((e: any) => e.team.name === teamName).length,
    selectedTeams,
    selectedPlayers,
    getEventTypeCount,
    getCategoryCount,
    toggleType,
    toggleTeam,
    togglePlayer,
    toggleCategory,
  };

  if (matchEvents.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-muted-foreground">
          <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="font-medium">No events loaded</p>
          <p className="text-sm mt-1">Select a fixture with imported StatsBomb events to see match events.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      {/* Mobile filter toggle */}
      <div className="lg:hidden mb-4">
        <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Event Filters ({selectedEventTypes.length} active)
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SheetHeader className="p-6">
              <SheetTitle>Event Filters</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-80px)] px-6 pb-6">
              <FilterSidebarContent {...sidebarProps} />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Desktop filter sidebar */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Event Filters</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[620px] pr-2">
                <FilterSidebarContent {...sidebarProps} />
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        {/* Event table */}
        <main className="flex-1 min-w-0">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base shrink-0">Match Events</CardTitle>
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search player, team, event…"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <Badge variant="secondary" className="shrink-0">{filteredEvents.length} events</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[620px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm border-b">
                    <TableRow>
                      <TableHead className="w-20 text-center">Time</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead className="w-36 hidden md:table-cell">Player</TableHead>
                      <TableHead className="w-20 text-center">Play</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event: any) => (
                      <TableRow
                        key={event.id}
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => onEventClick?.(timestampToSeconds(event.timestamp), event.period)}
                      >
                        <TableCell className="text-center py-1.5">
                          <div className="flex flex-col items-center gap-0.5">
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                              {event.period === 1 ? '1H' : event.period === 2 ? '2H' : `P${event.period}`}
                            </Badge>
                            <span className="font-mono text-sm leading-tight">
                              {formatTimestamp(event.timestamp)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="secondary"
                              className={`${getEventTypeColor(event.type.name, event.shot?.outcome?.name)} text-xs`}
                            >
                              {getEnhancedEventDisplay(event)}
                            </Badge>
                            {event.shot?.statsbomb_xg ? (
                              <span className="text-xs text-muted-foreground">
                                xG: {event.shot.statsbomb_xg.toFixed(2)}
                              </span>
                            ) : null}
                            {event.under_pressure && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-1.5 py-0.5">
                                      <AlertCircle className="h-3 w-3" />
                                    </Badge>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent><p>Under pressure</p></TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          {event.pass && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {event.pass.type?.name && `${event.pass.type.name} • `}
                              {`Length: ${Number(event.pass.length).toFixed(0)}m`}
                              {event.pass.recipient && ` → ${event.pass.recipient.name}`}
                            </div>
                          )}
                          {event.shot && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {event.shot.technique?.name && `${event.shot.technique.name} • `}
                              {event.shot.body_part?.name && `${event.shot.body_part.name} • `}
                              {`End: [${event.shot.end_location?.[0]?.toFixed(0)}, ${event.shot.end_location?.[1]?.toFixed(0)}]`}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="hidden md:table-cell py-1.5">
                          <div className="flex flex-col gap-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-default">
                                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 w-fit">
                                    {getTeamShortName(event.team.name)}
                                  </Badge>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent><p>{event.team.name}</p></TooltipContent>
                            </Tooltip>
                            <span className="text-sm leading-tight truncate max-w-[130px]" title={event.player?.name}>
                              {event.player?.name || '—'}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-center py-1.5" onClick={e => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => onEventClick?.(timestampToSeconds(event.timestamp), event.period)}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Play
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredEvents.length === 0 && (
                  <div className="p-10 text-center text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>No events match your current filters.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
