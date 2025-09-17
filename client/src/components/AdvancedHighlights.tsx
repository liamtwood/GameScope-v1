import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { X, Play, ChevronDown } from 'lucide-react';
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
  pass?: {
    recipient?: {
      id: number;
      name: string;
    };
    length: number;
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
}

interface SelectedEvent {
  id: string;
  time: string;
  description: string;
  eventTime: number;
  period: number;
}

export function AdvancedHighlights({ onEventClick }: AdvancedHighlightsProps) {
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
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

  // Define event categories
  const eventCategories = {
    DEFENSE: ['Block', 'Clearance', 'Interception', 'Pressure', 'Goal Keeper'],
    POSSESSION: ['Pass', 'Ball Receipt*', 'Carry', 'Shield'],
    ATTACK: ['Shot', 'Dribble'],
    TRANSITIONS: ['50/50', 'Duel', 'Ball Recovery', 'Dispossessed', 'Dribbled Past', 'Foul Committed', 'Foul Won', 'Miscontrol']
  };

  // Get available event types, teams, and organized players
  const { availableEventTypes, teams, teamData } = useMemo(() => {
    const typeSet = new Set(matchEvents.map(event => event.type.name));
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
    const startingXIEvents = matchEvents.filter(event => event.type.name === "Starting XI");
    
    startingXIEvents.forEach(event => {
      const teamName = event.team.name;
      
      if (event.tactics?.lineup && event.tactics.formation) {
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
      
      matchEvents.forEach(event => {
        if (event.team.name === teamName && event.player && !startingXIIds.has(event.player.id)) {
          if (!substitutes[event.player.id]) {
            substitutes[event.player.id] = {
              id: event.player.id,
              name: event.player.name,
              jerseyNumber: undefined
            };
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

  // Get counts for each event type
  const getEventTypeCount = (eventType: string): number => {
    return matchEvents.filter(e => e.type.name === eventType).length;
  };

  // Get counts for each category
  const getCategoryCount = (categoryEvents: string[]): number => {
    return categoryEvents.reduce((total, eventType) => {
      return total + getEventTypeCount(eventType);
    }, 0);
  };

  // Filter events based on selected criteria
  const filteredEvents = useMemo(() => {
    return matchEvents.filter(event => {
      const matchesEventType = selectedEventTypes.length === 0 || selectedEventTypes.includes(event.type.name);
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

  const handlePlayerToggle = (playerId: number) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  // Helper function to organize players by formation positions
  const organizePlayersByFormation = (startingXI: Array<{ id: number; name: string; jerseyNumber: number; position: string }>, formation: string) => {
    const positions = {
      goalkeeper: startingXI.filter(p => p.position === "Goalkeeper"),
      defenders: startingXI.filter(p => 
        p.position.includes("Back") || 
        p.position.includes("Center Back") || 
        p.position === "Left Center Back" || 
        p.position === "Right Center Back"
      ),
      midfielders: startingXI.filter(p => 
        p.position.includes("Midfield") ||
        p.position.includes("Wing Back")
      ),
      attackers: startingXI.filter(p => 
        p.position.includes("Forward") || 
        p.position.includes("Wing")
      )
    };
    
    return positions;
  };

  // Component for circular player button
  const PlayerCircle = ({ player, isSelected, disabled, onClick }: {
    player: { id: number; name: string; jerseyNumber: number };
    isSelected: boolean;
    disabled: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={player.name}
      className={`
        w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
        ${isSelected 
          ? 'bg-blue-500 text-white border-blue-600 shadow-lg scale-110' 
          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:scale-105'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      data-testid={`player-circle-${player.id}`}
    >
      {player.jerseyNumber}
    </button>
  );

  // Formation layout component
  const FormationLayout = ({ teamName }: { teamName: string }) => {
    const data = teamData[teamName];
    if (!data || !data.startingXI.length) return null;
    
    const positions = organizePlayersByFormation(data.startingXI, data.formation);
    
    return (
      <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20 bg-gradient-to-b from-green-400 to-green-600"
          style={{
            backgroundImage: `
              linear-gradient(90deg, transparent 49%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.3) 51%, transparent 52%),
              linear-gradient(0deg, transparent 24%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.2) 26%, transparent 27%),
              linear-gradient(0deg, transparent 49%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 51%, transparent 52%),
              linear-gradient(0deg, transparent 74%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0.2) 76%, transparent 77%)
            `
          }}
        />
        
        {/* Formation display */}
        <div className="relative z-10 space-y-6">
          <div className="text-center">
            <Badge variant="secondary" className="text-xs">{data.formation} Formation</Badge>
          </div>
          
          {/* Attackers */}
          {positions.attackers.length > 0 && (
            <div className="flex justify-center gap-8">
              {positions.attackers.map((player) => {
                const isSelected = selectedPlayers.includes(player.id);
                const eventCount = matchEvents.filter(e => e.player && e.player.id === player.id).length;
                return (
                  <PlayerCircle
                    key={player.id}
                    player={player}
                    isSelected={isSelected}
                    disabled={eventCount === 0}
                    onClick={() => handlePlayerToggle(player.id)}
                  />
                );
              })}
            </div>
          )}
          
          {/* Midfielders */}
          {positions.midfielders.length > 0 && (
            <div className="flex justify-center gap-4">
              {positions.midfielders.map((player) => {
                const isSelected = selectedPlayers.includes(player.id);
                const eventCount = matchEvents.filter(e => e.player && e.player.id === player.id).length;
                return (
                  <PlayerCircle
                    key={player.id}
                    player={player}
                    isSelected={isSelected}
                    disabled={eventCount === 0}
                    onClick={() => handlePlayerToggle(player.id)}
                  />
                );
              })}
            </div>
          )}
          
          {/* Defenders */}
          {positions.defenders.length > 0 && (
            <div className="flex justify-center gap-3">
              {positions.defenders.map((player) => {
                const isSelected = selectedPlayers.includes(player.id);
                const eventCount = matchEvents.filter(e => e.player && e.player.id === player.id).length;
                return (
                  <PlayerCircle
                    key={player.id}
                    player={player}
                    isSelected={isSelected}
                    disabled={eventCount === 0}
                    onClick={() => handlePlayerToggle(player.id)}
                  />
                );
              })}
            </div>
          )}
          
          {/* Goalkeeper */}
          {positions.goalkeeper.length > 0 && (
            <div className="flex justify-center">
              {positions.goalkeeper.map((player) => {
                const isSelected = selectedPlayers.includes(player.id);
                const eventCount = matchEvents.filter(e => e.player && e.player.id === player.id).length;
                return (
                  <PlayerCircle
                    key={player.id}
                    player={player}
                    isSelected={isSelected}
                    disabled={eventCount === 0}
                    onClick={() => handlePlayerToggle(player.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
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
    if (teamName.includes("Spain")) return "border-l-4 border-red-500";
    if (teamName.includes("England")) return "border-l-4 border-blue-500";
    return "";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Sidebar - Filters */}
      <aside className="lg:col-span-3">
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
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-between"
                          data-testid={`category-${categoryName.toLowerCase()}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{categoryName}</span>
                            {selectedInCategory.length > 0 && (
                              <Badge variant="default" className="text-xs">
                                {selectedInCategory.length}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{categoryCount}</Badge>
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-1 pl-4">
                        <Button
                          size="sm"
                          variant={selectedInCategory.length === availableEventsInCategory.length ? "default" : "outline"}
                          className="w-full mb-2"
                          onClick={() => {
                            if (selectedInCategory.length === availableEventsInCategory.length) {
                              // Deselect all in category
                              setSelectedEventTypes(prev => 
                                prev.filter(type => !categoryEvents.includes(type))
                              );
                            } else {
                              // Select all in category
                              setSelectedEventTypes(prev => [
                                ...prev.filter(type => !categoryEvents.includes(type)),
                                ...availableEventsInCategory
                              ]);
                            }
                          }}
                          data-testid={`select-all-${categoryName.toLowerCase()}`}
                        >
                          {selectedInCategory.length === availableEventsInCategory.length ? "Deselect All" : "Select All"}
                        </Button>
                        {availableEventsInCategory.map((eventType) => {
                          const count = getEventTypeCount(eventType);
                          const isSelected = selectedEventTypes.includes(eventType);
                          return (
                            <Button
                              key={eventType}
                              size="sm"
                              variant={isSelected ? "default" : "outline"}
                              className="w-full justify-between"
                              onClick={() => handleEventTypeToggle(eventType)}
                              data-testid={`filter-${eventType.toLowerCase().replace(/[\s*]/g, '-')}`}
                            >
                              {eventType}
                              <Badge variant="secondary">{count}</Badge>
                            </Button>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </div>

            {/* Team Filters - Grouped with Players */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Teams & Players</h3>
              <div className="space-y-3">
                {teams.map((teamName) => {
                  const teamEventCount = matchEvents.filter(e => e.team.name === teamName).length;
                  const selectedTeamPlayers = selectedPlayers.filter(playerId => 
                    teamData[teamName]?.startingXI.some(p => p.id === playerId) ||
                    teamData[teamName]?.substitutes.some(p => p.id === playerId)
                  );
                  const isTeamSelected = selectedTeams.includes(teamName);
                  
                  return (
                    <Collapsible key={teamName} className="space-y-2">
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-between"
                          data-testid={`team-${teamName.toLowerCase().replace(/\s/g, '-')}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {teamName.includes("Spain") ? "🇪🇸 Spain" : "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England"}
                            </span>
                            {(isTeamSelected || selectedTeamPlayers.length > 0) && (
                              <Badge variant="default" className="text-xs">
                                {isTeamSelected ? "Team" : `${selectedTeamPlayers.length} players`}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{teamEventCount}</Badge>
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-1 pl-4">
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={isTeamSelected ? "default" : "outline"}
                              className="flex-1"
                              onClick={() => handleTeamToggle(teamName)}
                              data-testid={`select-team-${teamName.toLowerCase().replace(/\s/g, '-')}`}
                            >
                              {isTeamSelected ? "Deselect Team" : "Select Team"}
                            </Button>
                            <Button
                              size="sm"
                              variant={selectedTeamPlayers.length === (teamData[teamName]?.startingXI.length || 0) + (teamData[teamName]?.substitutes.length || 0) ? "default" : "outline"}
                              className="flex-1"
                              onClick={() => {
                                const allPlayerIds = [
                                  ...(teamData[teamName]?.startingXI.map(p => p.id) || []),
                                  ...(teamData[teamName]?.substitutes.map(p => p.id) || [])
                                ];
                                if (selectedTeamPlayers.length === allPlayerIds.length) {
                                  // Deselect all players in team
                                  setSelectedPlayers(prev => 
                                    prev.filter(id => !allPlayerIds.includes(id))
                                  );
                                } else {
                                  // Select all players in team
                                  setSelectedPlayers(prev => [
                                    ...prev.filter(id => !allPlayerIds.includes(id)),
                                    ...allPlayerIds
                                  ]);
                                }
                              }}
                              data-testid={`select-all-players-${teamName.toLowerCase().replace(/\s/g, '-')}`}
                            >
                              {selectedTeamPlayers.length === (teamData[teamName]?.startingXI.length || 0) + (teamData[teamName]?.substitutes.length || 0) ? "Deselect All" : "All Players"}
                            </Button>
                          </div>

                          {/* Starting XI Formation */}
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-2">Starting XI</div>
                            <FormationLayout teamName={teamName} />
                          </div>

                          {/* Substitutes */}
                          {teamData[teamName]?.substitutes && teamData[teamName].substitutes.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-muted-foreground mb-2">Substitutes</div>
                              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                {teamData[teamName].substitutes.map((player) => {
                                  const isSelected = selectedPlayers.includes(player.id);
                                  const eventCount = matchEvents.filter(e => e.player && e.player.id === player.id).length;
                                  return (
                                    <PlayerCircle
                                      key={player.id}
                                      player={{ ...player, jerseyNumber: player.jerseyNumber || 99 }}
                                      isSelected={isSelected}
                                      disabled={eventCount === 0}
                                      onClick={() => handlePlayerToggle(player.id)}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* Center - Clips View */}
      <main className="lg:col-span-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clips ({filteredEvents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`cursor-pointer bg-white dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all border ${getTeamColor(event.team.name)}`}
                    data-testid={`clip-event-${event.index}`}
                  >
                    <div className="h-16 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                      <div className="text-center">
                        <div className="text-lg font-bold">{formatTimestamp(event.timestamp)}</div>
                        <div className="text-xs opacity-90">Period {event.period}</div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge 
                          className={`${getEventTypeColor(event.type.name, event.shot?.outcome?.name)} text-xs`}
                        >
                          {event.type.name === "Shot" && event.shot?.outcome?.name ? event.shot.outcome.name : event.type.name}
                        </Badge>
                        <span className="text-xs font-medium">
                          {event.team.name.includes("England") ? "ENG" : "ESP"}
                        </span>
                      </div>
                      <div className="text-sm font-medium mb-2">
                        {event.player?.name || "Team Action"}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEventClick?.(timestampToSeconds(event.timestamp), event.period)}
                          className="flex-1"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Play
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAddToHighlights(event)}
                          className="flex-1"
                          data-testid={`add-clip-${event.index}`}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredEvents.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p>No clips found matching your filters.</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </main>

      {/* Right Panel - Custom Highlight Builder */}
      <aside className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Highlight Builder</CardTitle>
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

            {/* Duration Info */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span>Selected Events</span>
                <span><strong>{selectedEvents.length}</strong> clips</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Estimated duration: ~{selectedEvents.length * 10}s
              </div>
            </div>

            {/* Selected Events */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Selected Events</h4>
              <ScrollArea className="h-32">
                {selectedEvents.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No events selected
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between bg-muted p-2 rounded text-sm"
                        data-testid={`selected-event-${event.id}`}
                      >
                        <div>
                          <div className="font-medium">{event.time}</div>
                          <div className="text-xs text-muted-foreground">{event.description}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFromHighlights(event.id)}
                          data-testid={`remove-event-${event.id}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
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
      </aside>
    </div>
  );
}