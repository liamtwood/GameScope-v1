import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { MatchEvent, timestampToSeconds } from '@/lib/types';
import { Play, Target, AlertCircle, Search } from 'lucide-react';

interface RichMatchEventViewProps {
  onEventClick?: (eventTime: number, period: number, eventId?: string) => void;
  events?: any[];
}

const eventCategories: Record<string, string[]> = {
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

const matchesCategoryTypes = (event: any, types: string[]): boolean =>
  types.some(sel => {
    if (event.type.name === sel) return true;
    if (event.type.name === 'Pass' && event.pass?.type?.name === sel) return true;
    if (event.type.name === 'Shot') {
      if (sel === 'Shot Off Target') return event.shot?.outcome?.name === 'Off T';
      if (sel.startsWith('Shot - ')) return event.shot?.outcome?.name === sel.replace('Shot - ', '');
    }
    if (sel === 'High xG Chances') return (event.shot?.statsbomb_xg ?? 0) > 0.3;
    if (sel === 'Medium xG Chances') return (event.shot?.statsbomb_xg ?? 0) >= 0.1 && (event.shot?.statsbomb_xg ?? 0) <= 0.3;
    if (sel === 'Low xG Chances') return (event.shot?.statsbomb_xg ?? 0) < 0.1 && (event.shot?.statsbomb_xg ?? 0) > 0;
    if (sel === 'Won Tackles') return event.duel?.type?.name === 'Tackle' && event.duel?.outcome?.name !== 'Lost In Play';
    if (sel === 'Lost Tackles') return event.duel?.type?.name === 'Tackle' && event.duel?.outcome?.name === 'Lost In Play';
    return false;
  });

const chips: { label: string; match: (event: any) => boolean }[] = [
  { label: 'SHOTS',      match: e => matchesCategoryTypes(e, eventCategories.SHOTS) },
  { label: 'PASSES',     match: e => e.type.name === 'Pass' },
  { label: 'DEFENSE',    match: e => matchesCategoryTypes(e, eventCategories.DEFENSE) },
  { label: 'SET PIECES', match: e => matchesCategoryTypes(e, eventCategories['SET PIECES']) },
  { label: 'POSSESSION', match: e => matchesCategoryTypes(e, eventCategories.POSSESSION) },
  { label: 'TRANSITIONS',match: e => matchesCategoryTypes(e, eventCategories.TRANSITIONS) },
];

export function RichMatchEventView({ onEventClick, events: eventsOverride }: RichMatchEventViewProps) {
  const matchEvents = (eventsOverride ?? []) as any[];
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  const players = useMemo(() => {
    const seen = new Map<number, string>();
    matchEvents.forEach((e: any) => {
      if (e.player?.id && e.player?.name) seen.set(e.player.id, e.player.name);
    });
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [matchEvents]);

  const filteredEvents = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const chipMatcher = activeCategory ? chips.find(c => c.label === activeCategory)?.match : null;
    return matchEvents.filter((event: any) => {
      const matchesCat = !chipMatcher || chipMatcher(event);
      const matchesPlayer = selectedPlayerId === 'all' || event.player?.id === Number(selectedPlayerId);
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
      return matchesCat && matchesPlayer && matchesSearch;
    });
  }, [activeCategory, selectedPlayerId, matchEvents, searchText]);

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
    <Card>
      <CardContent className="p-0">
        {/* Filter bar */}
        <div className="p-4 border-b space-y-3">
          {/* Category chips */}
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={activeCategory === null ? 'default' : 'outline'}
              className="h-7 px-3 text-xs"
              onClick={() => setActiveCategory(null)}
            >
              ALL
            </Button>
            {chips.map(chip => (
              <Button
                key={chip.label}
                size="sm"
                variant={activeCategory === chip.label ? 'default' : 'outline'}
                className="h-7 px-3 text-xs"
                onClick={() => setActiveCategory(activeCategory === chip.label ? null : chip.label)}
              >
                {chip.label}
              </Button>
            ))}
          </div>

          {/* Search + player + count */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search player, team, event…"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
              <SelectTrigger className="h-8 text-sm w-48">
                <SelectValue placeholder="All Players" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Players</SelectItem>
                {players.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="text-xs ml-auto whitespace-nowrap">
              {filteredEvents.length.toLocaleString()} events
            </Badge>
          </div>
        </div>

        {/* Event table */}
        <ScrollArea className="h-[520px]">
          <Table>
            <TableHeader>
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
                  onClick={() => onEventClick?.(timestampToSeconds(event.timestamp), event.period, String(event.id))}
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
                      onClick={() => onEventClick?.(timestampToSeconds(event.timestamp), event.period, String(event.id))}
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
