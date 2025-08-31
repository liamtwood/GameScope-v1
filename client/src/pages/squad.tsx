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
import { StatsCard } from "@/components/ui/stats-card";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { UserPlus, Star, Edit, Eye, Check, X, Users, Shield, Target, Trophy } from "lucide-react";
import { Player, Team, Fixture } from "@shared/schema";
import { Position } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type PositionFilter = 'all' | 'GK' | 'DEF' | 'MID' | 'FWD';

export default function Squad() {
  const [activeFilter, setActiveFilter] = useState<PositionFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingField, setEditingField] = useState<{playerId: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState("");
  const { toast } = useToast();

  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const currentTeam = teams?.[0]; // For demo, use first team

  const { data: players, isLoading } = useQuery<Player[]>({ 
    queryKey: ["/api/players", currentTeam?.id],
    enabled: !!currentTeam?.id 
  });

  const { data: fixtures } = useQuery<Fixture[]>({ 
    queryKey: ["/api/fixtures", currentTeam?.id],
    enabled: !!currentTeam?.id 
  });

  const createPlayerMutation = useMutation({
    mutationFn: async (playerData: any) => {
      return apiRequest("POST", "/api/players", playerData);
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
      return apiRequest("PUT", `/api/players/${playerId}`, data);
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
      return apiRequest("PATCH", `/api/players/${playerId}`, { keyPlayer });
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

  const getPositionOrder = (position: string): number => {
    const category = getPositionCategory(position);
    switch (category) {
      case 'GK': return 1;
      case 'DEF': return 2;
      case 'MID': return 3;
      case 'FWD': return 4;
      default: return 5;
    }
  };

  const filteredPlayers = players?.filter(player => {
    const matchesFilter = activeFilter === 'all' || getPositionCategory(player.position) === activeFilter;
    const matchesSearch = searchTerm === '' || 
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.hometown?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
    // First sort by position order (GK, DEF, MID, FWD)
    const positionDiff = getPositionOrder(a.position) - getPositionOrder(b.position);
    if (positionDiff !== 0) return positionDiff;
    
    // Then sort by jersey number
    return (a.jerseyNumber || 999) - (b.jerseyNumber || 999);
  }) || [];

  const getPositionCount = (category: PositionFilter) => {
    if (category === 'all') return players?.length || 0;
    return players?.filter(p => getPositionCategory(p.position) === category).length || 0;
  };

  const getKeyPlayersCount = () => {
    if (!players) return 0;
    return players.filter(player => player.keyPlayer).length;
  };

  // Calculate FCSAA League specific stats
  const getFCSAAStats = () => {
    if (!fixtures) return { completed: 0, wins: 0, draws: 0, losses: 0 };
    
    const fcsaaFixtures = fixtures.filter(f => f.competition === 'FCSAA League' && f.status === 'COMPLETED');
    let wins = 0, draws = 0, losses = 0;
    
    fcsaaFixtures.forEach(fixture => {
      if (fixture.homeScore !== null && fixture.awayScore !== null) {
        const isHome = fixture.type === 'HOME';
        const ourScore = isHome ? fixture.homeScore : fixture.awayScore;
        const theirScore = isHome ? fixture.awayScore : fixture.homeScore;
        
        if (ourScore > theirScore) wins++;
        else if (ourScore === theirScore) draws++;
        else losses++;
      }
    });
    
    return { completed: fcsaaFixtures.length, wins, draws, losses };
  };

  const fcsaaStats = getFCSAAStats();

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

  const handleStartEdit = (playerId: string, field: string, currentValue: string) => {
    setEditingField({ playerId, field });
    setEditValue(currentValue);
  };

  const handleSaveEdit = (playerId: string, field: string) => {
    const value = field === 'goals' || field === 'assists' || field === 'appearances' 
      ? parseInt(editValue) || 0 
      : editValue;
    
    updatePlayerMutation.mutate({ 
      playerId, 
      data: { [field]: value } 
    });
    setEditingField(null);
    setEditValue("");
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
          <Button variant="outline" data-testid="button-add-player">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Player
          </Button>
        </PlayerCreateDialog>
      </div>

      {/* Summary Cards */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Players */}
          <StatsCard
            title="Total Players"
            value={getPositionCount('all')}
            icon={Users}
            iconColor="text-border"
            subtitle="active squad members"
          />

          {/* Defenders */}
          <StatsCard
            title="Defenders"
            value={getPositionCount('DEF')}
            subtitle="defensive players"
          />

          {/* Midfield */}
          <StatsCard
            title="Midfield"
            value={getPositionCount('MID')}
            subtitle="midfield players"
          />

          {/* Forwards */}
          <StatsCard
            title="Forwards"
            value={getPositionCount('FWD')}
            subtitle="attacking players"
          />
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
                  <TableHead className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Status</TableHead>
                  <TableHead className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Apps</TableHead>
                  <TableHead className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Goals</TableHead>
                  <TableHead className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Assists</TableHead>
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
                      <TableCell>
                        {editingField?.playerId === player.id && editingField?.field === 'status' ? (
                          <div className="flex items-center space-x-2">
                            <Select value={editValue} onValueChange={setEditValue}>
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Fit">Fit</SelectItem>
                                <SelectItem value="Injured">Injured</SelectItem>
                                <SelectItem value="Retired">Retired</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(player.id, 'status')}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:bg-opacity-80 ${
                              player.status === 'Fit' ? 'bg-green-100 text-green-800' :
                              player.status === 'Injured' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                            onClick={() => handleStartEdit(player.id, 'status', player.status || 'Fit')}
                          >
                            {player.status || 'Fit'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingField?.playerId === player.id && editingField?.field === 'appearances' ? (
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="number" 
                              value={editValue} 
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-16"
                            />
                            <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(player.id, 'appearances')}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span 
                            className="text-foreground font-semibold cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
                            onClick={() => handleStartEdit(player.id, 'appearances', String(player.appearances || 0))}
                          >
                            {player.appearances}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingField?.playerId === player.id && editingField?.field === 'goals' ? (
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="number" 
                              value={editValue} 
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-16"
                            />
                            <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(player.id, 'goals')}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span 
                            className="text-foreground font-semibold cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
                            onClick={() => handleStartEdit(player.id, 'goals', String(player.goals || 0))}
                          >
                            {player.goals}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingField?.playerId === player.id && editingField?.field === 'assists' ? (
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="number" 
                              value={editValue} 
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-16"
                            />
                            <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(player.id, 'assists')}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span 
                            className="text-foreground font-semibold cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
                            onClick={() => handleStartEdit(player.id, 'assists', String(player.assists || 0))}
                          >
                            {player.assists}
                          </span>
                        )}
                      </TableCell>
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
