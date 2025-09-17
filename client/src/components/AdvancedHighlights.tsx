import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, Play, ChevronDown, Target, TrendingUp, Film } from 'lucide-react';
import matchEvents from '@/data/match-events.json';

interface AdvancedHighlightsProps {
  onEventClick?: (eventTime: number, period: number) => void;
}

interface MatchEvent {
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
}

interface SelectedEvent {
  id: string;
  time: string;
  description: string;
  eventTime: number;
  period: number;
}

export function AdvancedHighlights({ onEventClick }: AdvancedHighlightsProps) {
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([
    'Shot - Goal', 'Shot - Saved', 'Shot - Blocked', 'Shot Off Target', 'Shot - Post', 'Shot - Wayward', 
    'High xG Chances', 'Medium xG Chances', 'Low xG Chances'
  ]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<SelectedEvent[]>([]);
  const [includeCommentary, setIncludeCommentary] = useState<boolean>(false);
  const [includeLineups, setIncludeLineups] = useState<boolean>(false);

  // Convert timestamp to seconds
  const timestampToSeconds = (timestamp: string): number => {
    const [hours, minutes, seconds] = timestamp.split(':');
    const [secs, ms] = seconds.split('.');
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(secs) + (parseInt(ms || '0') / 1000);
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    const seconds = timestampToSeconds(timestamp);
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Define event categories including nested event types - shots prioritized at top
  const eventCategories = {
    SHOTS: ['Shot - Goal', 'Shot - Saved', 'Shot - Blocked', 'Shot Off Target', 'Shot - Post', 'Shot - Wayward', 'High xG Chances', 'Medium xG Chances', 'Low xG Chances'],
    DEFENSE: ['Block', 'Clearance', 'Interception', 'Pressure', 'Goal Keeper', 'Won Tackles', 'Lost Tackles'],
    POSSESSION: ['Pass', 'Ball Receipt*', 'Carry', 'Shield', 'Dribble'],
    'SET PIECES': ['Corner', 'Free Kick', 'Throw-in', 'Goal Kick', 'Kick Off', 'Penalty', 'Penalty Saved'],
    TECHNIQUE: ['Headers', 'Left Foot', 'Right Foot', 'Volleys'],
    TRANSITIONS: ['50/50', 'Duel', 'Ball Recovery', 'Dispossessed', 'Dribbled Past', 'Foul Committed', 'Foul Won', 'Miscontrol'],
    SUBS: ['Tactical Substitutions']
  };

  // Get available event types (including nested ones), teams, and organized players
  const { availableEventTypes, teams, teamData } = useMemo(() => {
    // Collect base event types
    const typeSet = new Set(matchEvents.map(event => event.type.name));
    
    // Add nested pass types
    matchEvents.forEach(event => {
      if (event.type.name === 'Pass' && event.pass?.type?.name) {
        typeSet.add(event.pass.type.name);
      }
      // Add shot outcomes as separate event types
      if (event.type.name === 'Shot' && event.shot?.outcome?.name) {
        // Map 'Off T' to 'Shot Off Target' for better display
        if (event.shot.outcome.name === 'Off T') {
          typeSet.add('Shot Off Target');
        } else {
          typeSet.add(`Shot - ${event.shot.outcome.name}`);
        }
      }
      // Add penalty shots from nested shot types
      if (event.type.name === 'Shot' && event.shot?.type?.name === 'Penalty') {
        typeSet.add('Penalty');
      }
      // Add penalty saves from nested goalkeeper types
      if (event.type.name === 'Goal Keeper' && event.goalkeeper?.type?.name === 'Penalty Saved') {
        typeSet.add('Penalty Saved');
      }
    });
    
    // Add pressure context filters
    const hasUnderPressure = matchEvents.some(event => event.under_pressure === true);
    const hasComposedPlay = matchEvents.some(event => event.under_pressure !== true);
    if (hasUnderPressure) typeSet.add('Under Pressure');
    if (hasComposedPlay) typeSet.add('Composed Play');
    
    // Add shot quality filters based on xG values
    const hasHighXg = matchEvents.some(event => event.shot?.statsbomb_xg && event.shot.statsbomb_xg > 0.3);
    const hasMediumXg = matchEvents.some(event => event.shot?.statsbomb_xg && event.shot.statsbomb_xg >= 0.1 && event.shot.statsbomb_xg <= 0.3);
    const hasLowXg = matchEvents.some(event => event.shot?.statsbomb_xg && event.shot.statsbomb_xg < 0.1);
    if (hasHighXg) typeSet.add('High xG Chances');
    if (hasMediumXg) typeSet.add('Medium xG Chances');
    if (hasLowXg) typeSet.add('Low xG Chances');
    
    // Add technique filters
    const hasHeaders = matchEvents.some(event => event.shot?.body_part?.name === 'Head' || event.clearance?.body_part?.name === 'Head');
    const hasLeftFoot = matchEvents.some(event => event.shot?.body_part?.name === 'Left Foot' || event.clearance?.body_part?.name === 'Left Foot' || event.clearance?.left_foot === true);
    const hasRightFoot = matchEvents.some(event => event.shot?.body_part?.name === 'Right Foot' || event.clearance?.body_part?.name === 'Right Foot');
    const hasVolleys = matchEvents.some(event => event.shot?.technique?.name === 'Volley');
    if (hasHeaders) typeSet.add('Headers');
    if (hasLeftFoot) typeSet.add('Left Foot');
    if (hasRightFoot) typeSet.add('Right Foot');
    if (hasVolleys) typeSet.add('Volleys');
    
    // Add substitution context filters
    const hasTacticalSubs = matchEvents.some(event => event.substitution?.outcome?.name === 'Tactical');
    if (hasTacticalSubs) typeSet.add('Tactical Substitutions');
    
    // Add duel outcome filters
    const hasWonTackles = matchEvents.some(event => event.duel?.type?.name === 'Tackle' && event.duel?.outcome?.name !== 'Lost In Play');
    const hasLostTackles = matchEvents.some(event => event.duel?.type?.name === 'Tackle' && event.duel?.outcome?.name === 'Lost In Play');
    const hasAerialWon = matchEvents.some(event => event.duel?.type?.name === 'Aerial Lost' && event.duel?.outcome?.name === 'Won');
    const hasAerialLost = matchEvents.some(event => event.duel?.type?.name === 'Aerial Lost' && event.duel?.outcome?.name === 'Lost');
    if (hasWonTackles) typeSet.add('Won Tackles');
    if (hasLostTackles) typeSet.add('Lost Tackles');
    if (hasAerialWon) typeSet.add('Aerial Duels Won');
    if (hasAerialLost) typeSet.add('Aerial Duels Lost');
    
    const teamSet = new Set(matchEvents.map(event => event.team.name));
    const types = Array.from(typeSet);
    const teamNames = Array.from(teamSet);
    
    // Extract formation data and players for each team
    const teamFormationData: { [teamName: string]: { 
      formation: string;
      startingXI: Array<{ id: number; name: string; jerseyNumber: number; position: string }>;
      substitutes: Array<{ id: number; name: string; jerseyNumber?: number }>;
    }} = {};
    
    // Find Starting XI events to get formation and lineup data
    // Only take the first Starting XI event for each team to avoid duplicates
    const startingXIEvents = matchEvents.filter(event => event.type.name === "Starting XI");
    
    startingXIEvents.forEach(event => {
      const teamName = event.team.name;
      
      // Only set formation data if not already set (to prevent overwriting with duplicates)
      if (!teamFormationData[teamName] && event.tactics?.lineup && event.tactics.formation) {
        teamFormationData[teamName] = {
          formation: event.tactics.formation.toString(),
          startingXI: event.tactics.lineup.map(player => ({
            id: player.player.id,
            name: player.player.name,
            jerseyNumber: player.jersey_number,
            position: player.position.name
          })),
          substitutes: []
        };
      }
    });
    
    // Get all players who appear in events but are not in starting XI (substitutes)
    teamNames.forEach(teamName => {
      if (!teamFormationData[teamName]) {
        teamFormationData[teamName] = {
          formation: "4231", // default
          startingXI: [],
          substitutes: []
        };
      }
      
      const startingXIIds = new Set(teamFormationData[teamName].startingXI.map(p => p.id));
      const substitutes: { [id: number]: { id: number; name: string; jerseyNumber?: number } } = {};
      
      // Only collect substitutes from substitution events to avoid duplicates
      matchEvents.forEach(event => {
        if (event.team.name === teamName && event.type.name === "Substitution") {
          // Get the player coming on (replacement)
          if (event.substitution?.replacement && !startingXIIds.has(event.substitution.replacement.id)) {
            const replacementPlayer = event.substitution.replacement;
            if (!substitutes[replacementPlayer.id]) {
              substitutes[replacementPlayer.id] = {
                id: replacementPlayer.id,
                name: replacementPlayer.name,
                jerseyNumber: undefined
              };
            }
          }
        }
      });
      
      teamFormationData[teamName].substitutes = Object.values(substitutes).sort((a, b) => 
        a.name.localeCompare(b.name)
      );
    });
    
    return {
      availableEventTypes: types.sort(),
      teams: teamNames.sort(),
      teamData: teamFormationData
    };
  }, []);

  // All other functions would be copied here (getEventTypeCount, getCategoryCount, filteredEvents, handlers, etc.)
  // For brevity, I'll include key ones:

  const getEventTypeCount = (eventType: string): number => {
    return matchEvents.filter(e => {
      if (e.type.name === eventType) return true;
      if (e.type.name === 'Pass' && e.pass?.type?.name === eventType) return true;
      if (e.type.name === 'Shot' && (eventType.startsWith('Shot - ') || eventType === 'Shot Off Target')) {
        if (eventType === 'Shot Off Target') {
          return e.shot?.outcome?.name === 'Off T';
        } else {
          const outcomeType = eventType.replace('Shot - ', '');
          return e.shot?.outcome?.name === outcomeType;
        }
      }
      if (eventType === 'Under Pressure' && e.under_pressure === true) return true;
      if (eventType === 'Composed Play' && e.under_pressure !== true) return true;
      if (eventType === 'High xG Chances' && e.shot?.statsbomb_xg && e.shot.statsbomb_xg > 0.3) return true;
      if (eventType === 'Medium xG Chances' && e.shot?.statsbomb_xg && e.shot.statsbomb_xg >= 0.1 && e.shot.statsbomb_xg <= 0.3) return true;
      if (eventType === 'Low xG Chances' && e.shot?.statsbomb_xg && e.shot.statsbomb_xg < 0.1) return true;
      
      // TECHNIQUE events - check shot data for technique and body_part
      if (eventType === 'Volleys' && e.shot?.technique?.name === 'Volley') return true;
      if (eventType === 'Left Foot' && e.shot?.body_part?.name === 'Left Foot') return true;
      if (eventType === 'Right Foot' && e.shot?.body_part?.name === 'Right Foot') return true;
      if (eventType === 'Headers' && e.shot?.body_part?.name === 'Head') return true;
      
      return false;
    }).length;
  };

  const getCategoryCount = (categoryEvents: string[]): number => {
    return categoryEvents.reduce((total, eventType) => {
      return total + getEventTypeCount(eventType);
    }, 0);
  };

  const filteredEvents = useMemo(() => {
    return matchEvents.filter(event => {
      let matchesEventType = selectedEventTypes.length === 0;
      
      if (selectedEventTypes.length > 0) {
        matchesEventType = selectedEventTypes.some(selectedType => {
          if (event.type.name === selectedType) return true;
          if (event.type.name === 'Pass' && event.pass?.type?.name === selectedType) return true;
          if (event.type.name === 'Shot' && (selectedType.startsWith('Shot - ') || selectedType === 'Shot Off Target')) {
            if (selectedType === 'Shot Off Target') {
              return event.shot?.outcome?.name === 'Off T';
            } else {
              const outcomeType = selectedType.replace('Shot - ', '');
              return event.shot?.outcome?.name === outcomeType;
            }
          }
          if (selectedType === 'Under Pressure' && event.under_pressure === true) return true;
          if (selectedType === 'Composed Play' && event.under_pressure !== true) return true;
          
          // TECHNIQUE events - check shot data for technique and body_part
          if (selectedType === 'Volleys' && event.shot?.technique?.name === 'Volley') return true;
          if (selectedType === 'Left Foot' && event.shot?.body_part?.name === 'Left Foot') return true;
          if (selectedType === 'Right Foot' && event.shot?.body_part?.name === 'Right Foot') return true;
          if (selectedType === 'Headers' && event.shot?.body_part?.name === 'Head') return true;
          
          return false;
        });
      }
      
      const matchesTeam = selectedTeams.length === 0 || selectedTeams.includes(event.team.name);
      const matchesPlayer = selectedPlayers.length === 0 || (event.player && selectedPlayers.includes(event.player.id));
      return matchesEventType && matchesTeam && matchesPlayer;
    });
  }, [selectedEventTypes, selectedTeams, selectedPlayers]);

  const handleEventTypeToggle = (eventType: string) => {
    setSelectedEventTypes(prev => 
      prev.includes(eventType) 
        ? prev.filter(t => t !== eventType)
        : [...prev, eventType]
    );
  };

  const handleTeamToggle = (teamName: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamName) 
        ? prev.filter(t => t !== teamName)
        : [...prev, teamName]
    );
  };

  const handleCategoryToggle = (categoryName: string) => {
    const categoryEvents = eventCategories[categoryName as keyof typeof eventCategories];
    const availableEventsInCategory = categoryEvents.filter((eventType: string) => 
      availableEventTypes.includes(eventType)
    );
    const selectedInCategory = selectedEventTypes.filter(type => categoryEvents.includes(type));
    
    if (selectedInCategory.length === availableEventsInCategory.length) {
      // All selected - deselect all
      setSelectedEventTypes(prev => prev.filter(type => !categoryEvents.includes(type)));
    } else {
      // None or partial selected - select all
      setSelectedEventTypes(prev => {
        const filtered = prev.filter(type => !categoryEvents.includes(type));
        return [...filtered, ...availableEventsInCategory];
      });
    }
  };

  const handlePlayerToggle = (playerId: number) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleAddToHighlights = (event: MatchEvent) => {
    const eventTime = timestampToSeconds(event.timestamp);
    const newEvent: SelectedEvent = {
      id: event.id,
      time: formatTimestamp(event.timestamp),
      description: `${event.type.name}${event.player ? ' - ' + event.player.name : ''}`,
      eventTime: eventTime,
      period: event.period
    };

    setSelectedEvents(prev => {
      if (!prev.find(e => e.id === event.id)) {
        return [...prev, newEvent];
      }
      return prev;
    });
  };

  const handleRemoveFromHighlights = (eventId: string) => {
    setSelectedEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const getEventTypeColor = (eventType: string, shotOutcome?: string) => {
    if (eventType === "Shot" && shotOutcome) {
      const shotColors: { [key: string]: string } = {
        "Goal": "bg-green-500 text-white font-bold",
        "Saved": "bg-yellow-500 text-white",
        "Off T": "bg-red-500 text-white",
        "Blocked": "bg-orange-500 text-white",
        "Wayward": "bg-gray-500 text-white"
      };
      return shotColors[shotOutcome] || "bg-red-100 text-red-800";
    }
    
    const colors: { [key: string]: string } = {
      "Pass": "bg-blue-100 text-blue-800",
      "Ball Receipt*": "bg-green-100 text-green-800", 
      "Carry": "bg-yellow-100 text-yellow-800",
      "Starting XI": "bg-purple-100 text-purple-800",
      "Half Start": "bg-orange-100 text-orange-800",
      "Shot": "bg-red-100 text-red-800",
      "Goal": "bg-emerald-100 text-emerald-800",
      "Substitution": "bg-indigo-100 text-indigo-800",
      "Half End": "bg-gray-100 text-gray-800"
    };
    return colors[eventType] || "bg-gray-100 text-gray-800";
  };

  const getTeamColor = (teamName: string) => {
    if (teamName.includes("Spain")) return "bg-red-50 border-l-4 border-red-500";
    if (teamName.includes("England")) return "bg-blue-50 border-l-4 border-blue-500";
    return "";
  };

  // Enhanced event display function for tactical clarity
  const getEnhancedEventDisplay = (event: MatchEvent): string => {
    // Shots: Show outcome
    if (event.type.name === 'Shot' && event.shot?.outcome?.name) {
      return event.shot.outcome.name === 'Off T' 
        ? 'Shot Off Target' 
        : `Shot - ${event.shot.outcome.name}`;
    }
    
    // Free Kicks: Check if this is a pass with Free Kick type
    if (event.type.name === 'Pass' && event.pass?.type?.name === 'Free Kick') {
      // Add outcome or technique if available
      if (event.pass.technique?.name) {
        return `Free Kick - ${event.pass.technique.name}`;
      }
      return 'Free Kick';
    }
    
    // Corners: Check if this is a pass with Corner type  
    if (event.type.name === 'Pass' && event.pass?.type?.name === 'Corner') {
      // Add technique or outcome if available
      if (event.pass.technique?.name) {
        return `Corner - ${event.pass.technique.name}`;
      }
      if (event.pass.outcome?.name) {
        return `Corner - ${event.pass.outcome.name}`;
      }
      return 'Corner';
    }
    
    // Penalties: Show outcome
    if (event.type.name === 'Shot' && event.shot?.type?.name === 'Penalty') {
      return event.shot.outcome?.name === 'Off T'
        ? 'Penalty Off Target'
        : `Penalty - ${event.shot.outcome?.name || 'Unknown'}`;
    }
    
    // Default: Keep as-is
    return event.type.name;
  };

  // Clean JSX structure following architect guidance
  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Event Type Filters - Grouped */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Event Categories</h3>
                <div className="space-y-3">
                  {Object.entries(eventCategories).map(([categoryName, categoryEvents]) => {
                    const availableEventsInCategory = categoryEvents.filter(eventType => 
                      availableEventTypes.includes(eventType)
                    );
                    const categoryCount = getCategoryCount(availableEventsInCategory);
                    const selectedInCategory = selectedEventTypes.filter(type => categoryEvents.includes(type));
                    
                    if (availableEventsInCategory.length === 0) return null;
                    
                    return (
                      <Collapsible key={categoryName} className="space-y-2">
                        {/* Category Select All Checkbox Container */}
                        <div 
                          className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer w-full"
                          onClick={() => handleCategoryToggle(categoryName)}
                          data-testid={`category-select-${categoryName.toLowerCase()}`}
                        >
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              checked={
                                selectedInCategory.length > 0 && 
                                selectedInCategory.length === availableEventsInCategory.length
                              }
                              onChange={() => {}}
                              data-testid={`category-checkbox-${categoryName.toLowerCase()}`}
                            />
                            <span className="font-medium text-xs">{categoryName}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {categoryCount}
                            </Badge>
                            
                            {/* Dropdown Toggle Inside Container */}
                            <CollapsibleTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="px-1"
                                data-testid={`category-dropdown-${categoryName.toLowerCase()}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                        <CollapsibleContent className="pl-2">
                          <div className="grid grid-cols-1 gap-2">
                            {availableEventsInCategory.map(eventType => {
                              const count = getEventTypeCount(eventType);
                              const isSelected = selectedEventTypes.includes(eventType);
                              return (
                                <div 
                                  key={eventType} 
                                  className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                                  onClick={() => handleEventTypeToggle(eventType)}
                                >
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      checked={isSelected}
                                      onChange={() => {}}
                                      data-testid={`event-type-${eventType.toLowerCase().replace(/\s+/g, '-')}`}
                                    />
                                    <span className="text-sm">{eventType}</span>
                                  </div>
                                  <Badge variant={isSelected ? "default" : "outline"} className="text-xs">
                                    {count}
                                  </Badge>
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

              {/* Team Filter */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Teams</h3>
                <div className="space-y-2">
                  {teams.map(teamName => {
                    const isSelected = selectedTeams.includes(teamName);
                    const teamEvents = matchEvents.filter(e => e.team.name === teamName).length;
                    return (
                      <div 
                        key={teamName} 
                        className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleTeamToggle(teamName)}
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            checked={isSelected}
                            onChange={() => {}}
                            data-testid={`team-${teamName.toLowerCase().replace(/\s+/g, '-')}`}
                          />
                          <span className="text-sm font-medium">
                            {teamName.includes('Spain') ? 'Spain Women\'s' : 'England Women\'s'}
                          </span>
                        </div>
                        <Badge variant={isSelected ? "default" : "outline"} className="text-xs">
                          {teamEvents}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Match Events</span>
                <Badge variant="secondary" data-testid="total-events-count">
                  {filteredEvents.length} events
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                    <TableRow>
                      <TableHead className="w-16 text-center min-w-16">Time</TableHead>
                      <TableHead className="w-20 text-center min-w-20">Period</TableHead>
                      <TableHead className="min-w-40">Event</TableHead>
                      <TableHead className="w-32 min-w-32 hidden sm:table-cell">Team</TableHead>
                      <TableHead className="w-40 min-w-40 hidden md:table-cell">Player</TableHead>
                      <TableHead className="w-32 text-center min-w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => {
                      const isSelected = selectedEvents.some(selected => selected.id === event.id);
                      return (
                        <TableRow
                          key={event.id}
                          className={`${getTeamColor(event.team.name)} hover:bg-muted/50 transition-colors`}
                          data-testid={`event-row-${event.index}`}
                        >
                          <TableCell className="text-center font-mono text-sm" data-testid={`event-time-${event.index}`}>
                            {formatTimestamp(event.timestamp)}
                          </TableCell>
                          <TableCell className="text-center" data-testid={`event-period-${event.index}`}>
                            <Badge variant="outline" className="text-xs">
                              {event.period === 1 ? '1H' : event.period === 2 ? '2H' : `P${event.period}`}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`event-type-${event.index}`}>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="secondary"
                                className={`${getEventTypeColor(event.type.name, event.shot?.outcome?.name)} text-xs`}
                              >
                                {getEnhancedEventDisplay(event)}
                              </Badge>
                              {event.shot?.statsbomb_xg && (
                                <span className="text-xs text-muted-foreground" data-testid={`event-xg-${event.index}`}>
                                  xG: {event.shot.statsbomb_xg.toFixed(2)}
                                </span>
                              )}
                              {event.under_pressure && (
                                <Badge variant="destructive" className="text-xs">
                                  Pressure
                                </Badge>
                              )}
                            </div>
                            {/* Additional event details */}
                            {event.pass && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {event.pass.type?.name && `${event.pass.type.name} • `}
                                Length: {event.pass.length.toFixed(0)}m
                                {event.pass.recipient && ` → ${event.pass.recipient.name}`}
                              </div>
                            )}
                            {event.shot && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {event.shot.technique?.name && `${event.shot.technique.name} • `}
                                {event.shot.body_part?.name && `${event.shot.body_part.name} • `}
                                End: [{event.shot.end_location?.[0]?.toFixed(0)}, {event.shot.end_location?.[1]?.toFixed(0)}]
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell" data-testid={`event-team-${event.index}`}>
                            <Badge variant="outline" className="text-xs">
                              {event.team.name.includes('Spain') ? 'ESP' : 'ENG'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell" data-testid={`event-player-${event.index}`}>
                            <span className="text-sm">
                              {event.player?.name || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onEventClick?.(timestampToSeconds(event.timestamp), event.period)}
                                className="flex-1 text-xs"
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Play
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAddToHighlights(event)}
                                className="flex-1 text-xs"
                                data-testid={`add-clip-${event.index}`}
                              >
                                Add
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                
                {filteredEvents.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No clips found matching your filters.</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Floating Film Button with Hover Overlay */}
      <div className="fixed bottom-6 right-6 z-50 group">
        <div className="relative">
          {/* Highlight Builder Overlay */}
          <div className="absolute bottom-full right-0 mb-4 w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <Card className="shadow-2xl border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Film className="h-5 w-5" />
                  Highlight Builder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Options */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="commentary" 
                      checked={includeCommentary}
                      onCheckedChange={(checked) => setIncludeCommentary(!!checked)}
                      data-testid="checkbox-commentary"
                    />
                    <label htmlFor="commentary" className="text-sm font-medium">Include Commentary</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="lineups" 
                      checked={includeLineups}
                      onCheckedChange={(checked) => setIncludeLineups(!!checked)}
                      data-testid="checkbox-lineups"
                    />
                    <label htmlFor="lineups" className="text-sm font-medium">Include Line-ups</label>
                  </div>
                </div>

                {/* Selected Events */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Selected Events ({selectedEvents.length})
                  </h4>
                  <ScrollArea className="h-32">
                    {selectedEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2 text-center">
                        No events selected
                      </p>
                    ) : (
                      <Table>
                        <TableBody>
                          {selectedEvents.map((event) => {
                            const fullEvent = matchEvents.find(e => e.id === event.id);
                            return (
                              <TableRow key={event.id} className="border-none py-1">
                                <TableCell className="px-2 py-1">
                                  <div className="text-xs">
                                    <span className="font-mono">{event.time}</span>
                                    <div className="text-muted-foreground truncate">
                                      {fullEvent ? getEnhancedEventDisplay(fullEvent) : 'Unknown Event'} - {fullEvent?.player?.name || 'Team Action'}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="px-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveFromHighlights(event.id)}
                                    data-testid={`remove-event-${event.id}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </ScrollArea>
                </div>

                {/* Generate Button */}
                <Button 
                  className="w-full" 
                  disabled={selectedEvents.length === 0}
                  data-testid="generate-highlights"
                >
                  Generate Custom Highlights
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Floating Film Button */}
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-primary hover:bg-primary/90"
            data-testid="floating-film-button"
          >
            <Film className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}