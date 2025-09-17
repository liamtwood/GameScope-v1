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

  // Define event categories including nested event types - ordered as requested
  const eventCategories = {
    DEFENSE: ['Block', 'Clearance', 'Interception', 'Pressure', 'Goal Keeper'],
    'DUEL OUTCOMES': ['Won Tackles', 'Lost Tackles', 'Aerial Duels Won', 'Aerial Duels Lost'],
    POSSESSION: ['Pass', 'Ball Receipt*', 'Carry', 'Shield', 'Dribble'],
    'SET PIECES': ['Corner', 'Free Kick', 'Throw-in', 'Goal Kick', 'Kick Off', 'Penalty', 'Penalty Saved'],
    'SHOT QUALITY': ['High xG Chances', 'Medium xG Chances', 'Low xG Chances'],
    'SHOT OUTCOMES': ['Shot - Goal', 'Shot - Saved', 'Shot - Blocked', 'Shot Off Target', 'Shot - Post', 'Shot - Wayward'],
    TECHNIQUE: ['Headers', 'Left Foot', 'Right Foot', 'Volleys'],
    PRESSURE: ['Under Pressure', 'Composed Play'],
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

  // Get counts for each event type (including nested types)
  const getEventTypeCount = (eventType: string): number => {
    return matchEvents.filter(e => {
      // Check base event type
      if (e.type.name === eventType) return true;
      
      // Check nested pass types
      if (e.type.name === 'Pass' && e.pass?.type?.name === eventType) return true;
      
      // Check shot outcomes
      if (e.type.name === 'Shot' && (eventType.startsWith('Shot - ') || eventType === 'Shot Off Target')) {
        if (eventType === 'Shot Off Target') {
          return e.shot?.outcome?.name === 'Off T';
        } else {
          const outcomeType = eventType.replace('Shot - ', '');
          return e.shot?.outcome?.name === outcomeType;
        }
      }
      
      // Check pressure context
      if (eventType === 'Under Pressure' && e.under_pressure === true) return true;
      if (eventType === 'Composed Play' && e.under_pressure !== true) return true;
      
      // Check shot quality based on xG
      if (eventType === 'High xG Chances' && e.shot?.statsbomb_xg && e.shot.statsbomb_xg > 0.3) return true;
      if (eventType === 'Medium xG Chances' && e.shot?.statsbomb_xg && e.shot.statsbomb_xg >= 0.1 && e.shot.statsbomb_xg <= 0.3) return true;
      if (eventType === 'Low xG Chances' && e.shot?.statsbomb_xg && e.shot.statsbomb_xg < 0.1) return true;
      
      // Check technique
      if (eventType === 'Headers' && (e.shot?.body_part?.name === 'Head' || e.clearance?.body_part?.name === 'Head')) return true;
      if (eventType === 'Left Foot' && (e.shot?.body_part?.name === 'Left Foot' || e.clearance?.body_part?.name === 'Left Foot' || e.clearance?.left_foot === true)) return true;
      if (eventType === 'Right Foot' && (e.shot?.body_part?.name === 'Right Foot' || e.clearance?.body_part?.name === 'Right Foot')) return true;
      if (eventType === 'Volleys' && e.shot?.technique?.name === 'Volley') return true;
      
      // Check substitution context
      if (eventType === 'Tactical Substitutions' && e.substitution?.outcome?.name === 'Tactical') return true;
      
      // Check duel outcomes
      if (eventType === 'Won Tackles' && e.duel?.type?.name === 'Tackle' && e.duel?.outcome?.name !== 'Lost In Play') return true;
      if (eventType === 'Lost Tackles' && e.duel?.type?.name === 'Tackle' && e.duel?.outcome?.name === 'Lost In Play') return true;
      if (eventType === 'Aerial Duels Won' && e.duel?.type?.name === 'Aerial Lost' && e.duel?.outcome?.name === 'Won') return true;
      if (eventType === 'Aerial Duels Lost' && e.duel?.type?.name === 'Aerial Lost' && e.duel?.outcome?.name === 'Lost') return true;
      
      // Check penalty events from nested structures
      if (eventType === 'Penalty' && e.type.name === 'Shot' && e.shot?.type?.name === 'Penalty') return true;
      if (eventType === 'Penalty Saved' && e.type.name === 'Goal Keeper' && e.goalkeeper?.type?.name === 'Penalty Saved') return true;
      
      return false;
    }).length;
  };

  // Get counts for each category
  const getCategoryCount = (categoryEvents: string[]): number => {
    return categoryEvents.reduce((total, eventType) => {
      return total + getEventTypeCount(eventType);
    }, 0);
  };

  // Filter events based on selected criteria (including nested event types)
  const filteredEvents = useMemo(() => {
    return matchEvents.filter(event => {
      let matchesEventType = selectedEventTypes.length === 0;
      
      if (selectedEventTypes.length > 0) {
        // Check if any selected event type matches
        matchesEventType = selectedEventTypes.some(selectedType => {
          // Check base event type
          if (event.type.name === selectedType) return true;
          
          // Check nested pass types
          if (event.type.name === 'Pass' && event.pass?.type?.name === selectedType) return true;
          
          // Check shot outcomes
          if (event.type.name === 'Shot' && (selectedType.startsWith('Shot - ') || selectedType === 'Shot Off Target')) {
            if (selectedType === 'Shot Off Target') {
              return event.shot?.outcome?.name === 'Off T';
            } else {
              const outcomeType = selectedType.replace('Shot - ', '');
              return event.shot?.outcome?.name === outcomeType;
            }
          }
          
          // Check pressure context
          if (selectedType === 'Under Pressure' && event.under_pressure === true) return true;
          if (selectedType === 'Composed Play' && event.under_pressure !== true) return true;
          
          // Check shot quality based on xG
          if (selectedType === 'High xG Chances' && event.shot?.statsbomb_xg && event.shot.statsbomb_xg > 0.3) return true;
          if (selectedType === 'Medium xG Chances' && event.shot?.statsbomb_xg && event.shot.statsbomb_xg >= 0.1 && event.shot.statsbomb_xg <= 0.3) return true;
          if (selectedType === 'Low xG Chances' && event.shot?.statsbomb_xg && event.shot.statsbomb_xg < 0.1) return true;
          
          // Check technique
          if (selectedType === 'Headers' && (event.shot?.body_part?.name === 'Head' || event.clearance?.body_part?.name === 'Head')) return true;
          if (selectedType === 'Left Foot' && (event.shot?.body_part?.name === 'Left Foot' || event.clearance?.body_part?.name === 'Left Foot' || event.clearance?.left_foot === true)) return true;
          if (selectedType === 'Right Foot' && (event.shot?.body_part?.name === 'Right Foot' || event.clearance?.body_part?.name === 'Right Foot')) return true;
          if (selectedType === 'Volleys' && event.shot?.technique?.name === 'Volley') return true;
          
          // Check substitution context
          if (selectedType === 'Tactical Substitutions' && event.substitution?.outcome?.name === 'Tactical') return true;
          
          // Check duel outcomes
          if (selectedType === 'Won Tackles' && event.duel?.type?.name === 'Tackle' && event.duel?.outcome?.name !== 'Lost In Play') return true;
          if (selectedType === 'Lost Tackles' && event.duel?.type?.name === 'Tackle' && event.duel?.outcome?.name === 'Lost In Play') return true;
          if (selectedType === 'Aerial Duels Won' && event.duel?.type?.name === 'Aerial Lost' && event.duel?.outcome?.name === 'Won') return true;
          if (selectedType === 'Aerial Duels Lost' && event.duel?.type?.name === 'Aerial Lost' && event.duel?.outcome?.name === 'Lost') return true;
          
          // Check penalty events from nested structures
          if (selectedType === 'Penalty' && event.type.name === 'Shot' && event.shot?.type?.name === 'Penalty') return true;
          if (selectedType === 'Penalty Saved' && event.type.name === 'Goal Keeper' && event.goalkeeper?.type?.name === 'Penalty Saved') return true;
          
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
    if (teamName.includes("Spain")) return "bg-red-50 border-l-4 border-red-500";
    if (teamName.includes("England")) return "bg-blue-50 border-l-4 border-blue-500";
    return "";
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Filters */}
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
          <CardContent className="p-0">
            <div className="h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                  <TableRow>
                    <TableHead className="w-16 px-2">Time</TableHead>
                    <TableHead className="w-24 px-2">Event</TableHead>
                    <TableHead className="w-12 px-2">Team</TableHead>
                    <TableHead className="px-2">Player</TableHead>
                    <TableHead className="w-20 px-2 text-center">Details</TableHead>
                    <TableHead className="w-32 px-2 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow 
                      key={event.id} 
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${getTeamColor(event.team.name)}`}
                      data-testid={`clip-event-${event.index}`}
                    >
                      <TableCell className="font-mono text-sm px-2">
                        {formatTimestamp(event.timestamp)}
                      </TableCell>
                      
                      <TableCell className="px-2">
                        <div className="flex items-center gap-1">
                          <Badge 
                            variant="secondary"
                            className={`${getEventTypeColor(event.type.name, event.shot?.outcome?.name)} whitespace-nowrap`}
                          >
                            {event.type.name === "Shot" && event.shot?.outcome?.name ? event.shot.outcome.name : event.type.name}
                          </Badge>
                          {event.type.name === "Shot" && (
                            <Target className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-2 text-center font-semibold text-xs">
                        {event.team.name.includes("England") ? "ENG" : "ESP"}
                      </TableCell>
                      
                      <TableCell className="px-2">
                        <div className="text-sm whitespace-nowrap">
                          {event.player?.name || "-"}
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-2 text-center">
                        {event.shot && (
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1 text-xs">
                              <TrendingUp className="h-3 w-3" />
                              <span className="font-mono">{(event.shot.statsbomb_xg * 100).toFixed(1)}%</span>
                            </div>
                            {event.shot.body_part && (
                              <div className="text-xs text-gray-500">
                                {event.shot.body_part.name}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell className="px-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
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
                  ))}
                </TableBody>
              </Table>
              
              {filteredEvents.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No clips found matching your filters.</p>
                </div>
              )}
            </div>
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
              <div className="h-32 overflow-y-auto border rounded">
                {selectedEvents.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No events selected
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="sticky top-0 bg-white dark:bg-gray-900">
                      <TableRow>
                        <TableHead className="px-2 text-xs">Time</TableHead>
                        <TableHead className="px-2 text-xs">Event</TableHead>
                        <TableHead className="w-12 px-2"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEvents.map((event) => {
                        const fullEvent = matchEvents.find(e => e.id === event.id);
                        return (
                          <TableRow
                            key={event.id}
                            className="text-sm"
                            data-testid={`selected-event-${event.id}`}
                          >
                            <TableCell className="px-2 font-mono text-xs">
                              {event.time}
                            </TableCell>
                            <TableCell className="px-2">
                              <div className="flex items-center gap-1">
                                <Badge 
                                  variant="secondary"
                                  className={`${getEventTypeColor(fullEvent?.type.name || '', fullEvent?.shot?.outcome?.name)} text-xs`}
                                >
                                  {fullEvent?.type.name || 'Event'}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {fullEvent?.player?.name || 'Team Action'}
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
              </div>
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

        {/* Main Content - Events Table */}
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
                              {event.type.name}
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
                              Outcome: {event.shot.outcome.name}
                            </div>
                          )}
                          {event.substitution && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {event.substitution.replacement && `In: ${event.substitution.replacement.name}`}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell" data-testid={`event-team-${event.index}`}>
                          <span className="text-sm font-medium">
                            {event.team.name}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell" data-testid={`event-player-${event.index}`}>
                          {event.player ? (
                            <span className="text-sm">
                              {event.player.name}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Team Action
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEventClick?.(timestampToSeconds(event.timestamp), event.period)}
                              data-testid={`play-event-${event.index}`}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                            {!isSelected ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddToHighlights(event)}
                                data-testid={`add-clip-${event.index}`}
                              >
                                <Target className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemoveFromHighlights(event.id)}
                                data-testid={`remove-clip-${event.index}`}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filteredEvents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-events-message">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No events match your current filters</p>
                  <p className="text-sm">Try adjusting your selection criteria</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        </main>
      </div>

      {/* Floating Film Button with Hover Overlay */}
      <div className="fixed bottom-6 right-6 z-50 group">
        {/* Hover Overlay */}
        <div className="invisible group-hover:visible absolute bottom-16 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <Card className="w-80 shadow-2xl border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Custom Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Options */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Options</h3>
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
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span>Selected Events</span>
                  <span data-testid="selected-events-count"><strong>{selectedEvents.length}</strong> clips</span>
                </div>
                <div className="text-xs text-muted-foreground" data-testid="estimated-duration">
                  Estimated duration: ~{selectedEvents.length * 10}s
                </div>
              </div>

              {/* Selected Events */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Selected Events</h4>
                <ScrollArea className="h-32 border rounded">
                  {selectedEvents.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4" data-testid="no-selected-events">
                      No events selected
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="sticky top-0 bg-white dark:bg-gray-900">
                        <TableRow>
                          <TableHead className="px-2 text-xs">Time</TableHead>
                          <TableHead className="px-2 text-xs">Event</TableHead>
                          <TableHead className="w-12 px-2"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedEvents.map((event) => {
                          const fullEvent = matchEvents.find(e => e.id === event.id);
                          return (
                            <TableRow
                              key={event.id}
                              className="text-sm"
                              data-testid={`selected-event-${event.id}`}
                            >
                              <TableCell className="px-2 font-mono text-xs" data-testid={`selected-event-time-${event.id}`}>
                                {event.time}
                              </TableCell>
                              <TableCell className="px-2">
                                <div className="flex items-center gap-1">
                                  <Badge 
                                    variant="secondary"
                                    className={`${getEventTypeColor(fullEvent?.type.name || '', fullEvent?.shot?.outcome?.name)} text-xs`}
                                    data-testid={`selected-event-type-${event.id}`}
                                  >
                                    {fullEvent?.type.name || 'Event'}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1" data-testid={`selected-event-player-${event.id}`}>
                                  {fullEvent?.player?.name || 'Team Action'}
                                </div>
                              </TableCell>
                              <TableCell className="px-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveFromHighlights(event.id)}
                                  data-testid={`remove-selected-event-${event.id}`}
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
  );
}