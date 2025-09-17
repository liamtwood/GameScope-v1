import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import matchEvents from '@/data/match-events.json';

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
    recipient: {
      id: number;
      name: string;
    };
    length: number;
  };
}

interface MatchEventTableProps {
  onEventClick: (timeInSeconds: number) => void;
}

export function MatchEventTable({ onEventClick }: MatchEventTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");

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

  // Get unique event types and teams for filtering
  const { eventTypes, teams } = useMemo(() => {
    const typeSet = new Set(matchEvents.map(event => event.type.name));
    const teamSet = new Set(matchEvents.map(event => event.team.name));
    const types = Array.from(typeSet);
    const teamNames = Array.from(teamSet);
    return {
      eventTypes: types.sort(),
      teams: teamNames.sort()
    };
  }, []);

  // Filter events based on search and filters
  const filteredEvents = useMemo(() => {
    return matchEvents.filter(event => {
      const matchesSearch = 
        event.type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.player?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.team.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEventType = selectedEventType === "" || event.type.name === selectedEventType;
      const matchesTeam = selectedTeam === "" || event.team.name === selectedTeam;

      return matchesSearch && matchesEventType && matchesTeam;
    });
  }, [searchTerm, selectedEventType, selectedTeam]);

  const handleEventClick = (event: MatchEvent) => {
    const timeInSeconds = timestampToSeconds(event.timestamp);
    onEventClick(timeInSeconds);
  };

  const getEventTypeColor = (eventType: string) => {
    const colors: { [key: string]: string } = {
      "Pass": "bg-blue-100 text-blue-800",
      "Ball Receipt*": "bg-green-100 text-green-800", 
      "Carry": "bg-yellow-100 text-yellow-800",
      "Starting XI": "bg-purple-100 text-purple-800",
      "Half Start": "bg-orange-100 text-orange-800",
      "Shot": "bg-red-100 text-red-800",
      "Goal": "bg-emerald-100 text-emerald-800",
      "Substitution": "bg-indigo-100 text-indigo-800"
    };
    return colors[eventType] || "bg-gray-100 text-gray-800";
  };

  const getTeamColor = (teamName: string) => {
    if (teamName.includes("Spain")) return "bg-red-50 border-l-4 border-red-500";
    if (teamName.includes("England")) return "bg-blue-50 border-l-4 border-blue-500";
    return "";
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Match Events
        </CardTitle>
        
        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events, players, teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="event-search"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              data-testid="event-type-filter"
            >
              <option value="">All Event Types</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              data-testid="team-filter"
            >
              <option value="">All Teams</option>
              {teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="w-16 px-2">Time</TableHead>
                <TableHead className="w-24 px-2">Event</TableHead>
                <TableHead className="w-12 px-2">Team</TableHead>
                <TableHead className="px-2">Player</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow 
                  key={event.id} 
                  className={`cursor-pointer hover:bg-gray-50 ${getTeamColor(event.team.name)}`}
                  onClick={() => handleEventClick(event)}
                  data-testid={`event-row-${event.index}`}
                >
                  <TableCell className="font-mono text-sm px-2">
                    {formatTimestamp(event.timestamp)}
                  </TableCell>
                  
                  <TableCell className="px-2">
                    <Badge 
                      variant="secondary"
                      className={`${getEventTypeColor(event.type.name)} whitespace-nowrap`}
                    >
                      {event.type.name}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="px-2 text-center font-semibold text-xs">
                    {event.team.name.includes("England") ? "ENG" : "ESP"}
                  </TableCell>
                  
                  <TableCell className="px-2">
                    <div className="text-sm whitespace-nowrap">
                      {event.player?.name || "-"}
                    </div>
                  </TableCell>
                  
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredEvents.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No events found matching your search.</p>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Summary */}
      <div className="px-6 py-3 border-t bg-gray-50 text-sm text-gray-600">
        Showing {filteredEvents.length} of {matchEvents.length} events
      </div>
    </Card>
  );
}