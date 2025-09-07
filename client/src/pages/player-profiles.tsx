import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Search } from "lucide-react";
import { useTeam } from "@/contexts/team-context";
import { useClubTheme } from "@/hooks/use-club-theme";

type PositionFilter = 'all' | 'GK' | 'DEF' | 'MID' | 'FWD';

export default function PlayerProfiles() {
  const [positionFilter, setPositionFilter] = useState<PositionFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [, setLocation] = useLocation();
  const { selectedTeam: currentTeam } = useTeam();
  const { clubPrimary } = useClubTheme();

  const { data: teamPlayersData, isLoading } = useQuery<any[]>({
    queryKey: ["/api/team", currentTeam?.id, "users"],
    enabled: !!currentTeam?.id
  });

  // Convert team players to the format expected
  const allPlayers = teamPlayersData?.map(tp => ({
    ...tp.user,
    id: tp.user.id,
    jerseyNumber: tp.jerseyNumber,
    position: tp.position,
    starPlayer: tp.starPlayer,
    fitnessStatus: tp.fitnessStatus
  })) || [];

  const getPositionCategory = (position: string): string => {
    // Now that we have clean data, positions are already in the correct format
    if (position === 'GK') return 'GK';
    if (position === 'DEF') return 'DEF';
    if (position === 'MID') return 'MID';
    if (position === 'FWD') return 'FWD';
    return 'MID'; // Default fallback
  };

  const getPositionColor = (position: string) => {
    const category = getPositionCategory(position);
    switch (category) {
      case 'GK':
        return 'bg-purple-100 text-purple-800';
      case 'DEF':
        return 'bg-blue-100 text-blue-800';
      case 'MID':
        return 'bg-green-100 text-green-800';
      case 'FWD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  // Filter players
  const filteredPlayers = allPlayers.filter(player => {
    const matchesPosition = positionFilter === 'all' || getPositionCategory(player.position || 'MID') === positionFilter;
    const matchesSearch = !searchTerm || 
      player.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.hometown?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPosition && matchesSearch;
  });

  // Group players by position and sort by jersey number
  const groupedPlayers = {
    GK: filteredPlayers
      .filter(p => getPositionCategory(p.position || 'MID') === 'GK')
      .sort((a, b) => (a.jerseyNumber || 999) - (b.jerseyNumber || 999)),
    DEF: filteredPlayers
      .filter(p => getPositionCategory(p.position || 'MID') === 'DEF')
      .sort((a, b) => (a.jerseyNumber || 999) - (b.jerseyNumber || 999)),
    MID: filteredPlayers
      .filter(p => getPositionCategory(p.position || 'MID') === 'MID')
      .sort((a, b) => (a.jerseyNumber || 999) - (b.jerseyNumber || 999)),
    FWD: filteredPlayers
      .filter(p => getPositionCategory(p.position || 'MID') === 'FWD')
      .sort((a, b) => (a.jerseyNumber || 999) - (b.jerseyNumber || 999))
  };

  const positionLabels = {
    GK: 'Goalkeepers',
    DEF: 'Defenders', 
    MID: 'Midfielders',
    FWD: 'Forwards'
  };

  const getPlayerInitials = (player: any) => {
    return `${player.firstName?.[0] || ''}${player.lastName?.[0] || ''}`;
  };

  const handlePlayerClick = (playerId: string) => {
    setLocation(`/players/${playerId}?source=profiles`);
  };

  if (isLoading) {
    return (
      <MainLayout title="Player Profiles" subtitle="Loading player profiles...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading player profiles...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Player Profiles" subtitle="Detailed player information and statistics">
      <div className="space-y-6">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-players"
              />
            </div>

            <Select value={positionFilter} onValueChange={(value) => setPositionFilter(value as PositionFilter)}>
              <SelectTrigger className="w-48" data-testid="select-position-filter">
                <SelectValue placeholder="Filter by position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="GK">Goalkeepers</SelectItem>
                <SelectItem value="DEF">Defenders</SelectItem>
                <SelectItem value="MID">Midfielders</SelectItem>
                <SelectItem value="FWD">Forwards</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{filteredPlayers.length} players</span>
            <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
            <span>{filteredPlayers.filter(p => p.starPlayer).length} star players</span>
          </div>
        </div>

        {/* Players Grouped by Position */}
        <div className="space-y-8">
          {(['GK', 'DEF', 'MID', 'FWD'] as const).map(position => {
            const players = groupedPlayers[position];
            if (players.length === 0) return null;
            
            return (
              <div key={position} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">{positionLabels[position]}</h3>
                  <Badge variant="outline" className="px-3">
                    {players.length}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {players.map((player) => (
                    <Card 
                      key={player.id} 
                      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer" 
                      onClick={() => handlePlayerClick(player.id)}
                      data-testid={`card-player-${player.id}`}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-16 w-16">
                                {player.avatarPath && (
                                  <AvatarImage src={player.avatarPath} alt={`${player.firstName} ${player.lastName}`} />
                                )}
                                <AvatarFallback className="text-lg font-bold">
                                  {getPlayerInitials(player)}
                                </AvatarFallback>
                              </Avatar>
                              {player.jerseyNumber && (
                                <div 
                                  className="absolute -bottom-2 -right-2 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
                                  style={{ backgroundColor: clubPrimary }}
                                >
                                  {player.jerseyNumber}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold leading-tight">
                                <div className="text-sm flex items-center justify-between">
                                  <span>{player.firstName}</span>
                                  <Badge className={`${getPositionColor(player.position || 'MID')} text-xs`}>
                                    {player.position || 'MID'}
                                  </Badge>
                                </div>
                                <div className="text-lg flex items-center gap-2">
                                  <span>{player.lastName}</span>
                                  {player.starPlayer && (
                                    <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {filteredPlayers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No players found</h3>
              <p>Try adjusting your search terms or filters</p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}