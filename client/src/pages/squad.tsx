import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { PlayerRow } from "@/components/ui/player-row";
import { PlayerCreateDialog } from "@/components/dialogs/player-create-dialog";
import { PlayerEditDialog } from "@/components/dialogs/player-edit-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { UserPlus, Star, Edit, Eye } from "lucide-react";
import { Player, Team } from "@shared/schema";
import { Position } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type PositionFilter = 'all' | 'GK' | 'DEF' | 'MID' | 'FWD';

export default function Squad() {
  const [activeFilter, setActiveFilter] = useState<PositionFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const currentTeam = teams?.[0]; // For demo, use first team

  const { data: players, isLoading } = useQuery<Player[]>({ 
    queryKey: ["/api/players", currentTeam?.id],
    enabled: !!currentTeam?.id 
  });

  const createPlayerMutation = useMutation({
    mutationFn: async (playerData: any) => {
      return apiRequest("/api/players", "POST", playerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players", currentTeam?.id] });
      toast({
        title: "Player Added",
        description: "New player has been added to the squad.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add player.",
        variant: "destructive",
      });
    },
  });

  const updatePlayerMutation = useMutation({
    mutationFn: async ({ playerId, data }: { playerId: string; data: any }) => {
      return apiRequest(`/api/players/${playerId}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players", currentTeam?.id] });
      toast({
        title: "Player Updated",
        description: "Player information has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update player.",
        variant: "destructive",
      });
    },
  });

  const toggleKeyPlayerMutation = useMutation({
    mutationFn: async ({ playerId, keyPlayer }: { playerId: string; keyPlayer: boolean }) => {
      return apiRequest(`/api/players/${playerId}`, "PATCH", { keyPlayer });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players", currentTeam?.id] });
      toast({
        title: "Key Player Updated",
        description: "Player status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update player status.",
        variant: "destructive",
      });
    },
  });

  const getPositionCategory = (position: string): PositionFilter => {
    if (['GK'].includes(position)) return 'GK';
    if (['CB', 'LB', 'RB', 'DEF'].includes(position)) return 'DEF';
    if (['CM', 'CDM', 'CAM', 'LM', 'RM', 'MID'].includes(position)) return 'MID';
    if (['ST', 'LW', 'RW', 'CF', 'FWD'].includes(position)) return 'FWD';
    return 'DEF';
  };

  const filteredPlayers = players?.filter(player => {
    const matchesFilter = activeFilter === 'all' || getPositionCategory(player.position) === activeFilter;
    const matchesSearch = searchTerm === '' || 
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.hometown?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  }) || [];

  const getPositionCount = (category: PositionFilter) => {
    if (category === 'all') return players?.length || 0;
    return players?.filter(p => getPositionCategory(p.position) === category).length || 0;
  };

  const getKeyPlayersCount = () => {
    if (!players) return 0;
    return players.filter(player => player.keyPlayer).length;
  };

  const handleCreatePlayer = (data: any) => {
    createPlayerMutation.mutate(data);
  };

  const handleUpdatePlayer = (playerId: string, data: any) => {
    updatePlayerMutation.mutate({ playerId, data });
  };

  const handleToggleKeyPlayer = (player: Player) => {
    toggleKeyPlayerMutation.mutate({
      playerId: player.id,
      keyPlayer: !player.keyPlayer
    });
  };

  const handleViewPlayer = (player: Player) => {
    toast({
      title: "Player Profile",
      description: `Viewing profile for ${player.name}`,
    });
  };


  return (
    <MainLayout 
      title="Squad Management" 
      subtitle="Manage player roster and profiles"
    >
      <div className="mb-6 flex items-center justify-between">
        <PlayerCreateDialog 
          teamId={currentTeam?.id || ""} 
          onSave={handleCreatePlayer}
        >
          <Button data-testid="button-add-player">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Player
          </Button>
        </PlayerCreateDialog>
      </div>

      {/* Squad Overview Stats */}
      <div className="mb-6">
        {/* Main Squad Size */}
        <Card className="mb-4">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">SQUAD SIZE</p>
            <p className="text-4xl font-bold text-foreground">{getPositionCount('all')}</p>
          </CardContent>
        </Card>
        
        {/* Position Breakdown */}
        <div className="grid grid-cols-5 gap-2">
          <Card className="bg-orange-50 border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors" onClick={() => setActiveFilter('all')}>
            <CardContent className="p-3 text-center">
              <Star className="h-5 w-5 mx-auto mb-1 text-orange-600" fill="currentColor" />
              <p className="text-2xl font-bold text-foreground">{getKeyPlayersCount()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">GK</p>
              <p className="text-2xl font-bold text-foreground">{getPositionCount('GK')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">DEF</p>
              <p className="text-2xl font-bold text-foreground">{getPositionCount('DEF')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">MID</p>
              <p className="text-2xl font-bold text-foreground">{getPositionCount('MID')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">FWD</p>
              <p className="text-2xl font-bold text-foreground">{getPositionCount('FWD')}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <Select value={activeFilter} onValueChange={(value: PositionFilter) => setActiveFilter(value)}>
          <SelectTrigger className="w-48" data-testid="select-position">
            <SelectValue placeholder="All Positions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            <SelectItem value="GK">Goalkeeper</SelectItem>
            <SelectItem value="DEF">Defense</SelectItem>
            <SelectItem value="MID">Midfield</SelectItem>
            <SelectItem value="FWD">Forward</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Search players..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
          data-testid="input-search-players"
        />
      </div>

      {/* Squad Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">#</TableHead>
                  <TableHead className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Player</TableHead>
                  <TableHead className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Position</TableHead>
                  <TableHead className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Year</TableHead>
                  <TableHead className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Apps</TableHead>
                  <TableHead className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Goals</TableHead>
                  <TableHead className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Assists</TableHead>
                  <TableHead className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Height</TableHead>
                  <TableHead className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <td colSpan={9} className="text-center py-8">
                      <p className="text-muted-foreground">Loading players...</p>
                    </td>
                  </TableRow>
                ) : filteredPlayers.length > 0 ? (
                  filteredPlayers.map((player) => (
                    <TableRow 
                      key={player.id}
                      className="hover:bg-muted/30" 
                      data-position={getPositionCategory(player.position)}
                      data-testid={`row-player-${player.id}`}
                    >
                      <TableCell>
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                          {player.jerseyNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div>
                            <p className="font-semibold text-foreground">{player.name}</p>
                            <p className="text-sm text-muted-foreground">{player.hometown}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleKeyPlayer(player)}
                            className="h-6 w-6 p-0"
                            data-testid={`button-key-player-${player.id}`}
                          >
                            <Star 
                              className={`h-4 w-4 transition-colors ${
                                player.keyPlayer 
                                  ? 'text-orange-500 fill-orange-500' 
                                  : 'text-gray-300 hover:text-orange-300'
                              }`} 
                            />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getPositionCategory(player.position) === 'GK' ? 'bg-purple-100 text-purple-800' :
                          getPositionCategory(player.position) === 'DEF' ? 'bg-blue-100 text-blue-800' :
                          getPositionCategory(player.position) === 'MID' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {player.position}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{player.year}</TableCell>
                      <TableCell className="text-foreground font-semibold">{player.appearances}</TableCell>
                      <TableCell className="text-foreground font-semibold">{player.goals}</TableCell>
                      <TableCell className="text-foreground font-semibold">{player.assists}</TableCell>
                      <TableCell className="text-muted-foreground">{player.height}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <PlayerEditDialog
                            player={player}
                            onSave={handleUpdatePlayer}
                          >
                            <Button 
                              variant="ghost" 
                              size="sm"
                              data-testid={`button-edit-player-${player.id}`}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                          </PlayerEditDialog>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewPlayer(player)}
                            data-testid={`button-view-player-${player.id}`}
                          >
                            <Eye className="h-4 w-4 text-green-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <td colSpan={9} className="text-center py-8">
                      <p className="text-muted-foreground">No players found matching your criteria</p>
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
