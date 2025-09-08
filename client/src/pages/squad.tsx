import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { PlayerRow } from "@/components/ui/player-row";
import { PlayerCard } from "@/components/ui/player-card";
import { PlayerCreateDialog } from "@/components/dialogs/player-create-dialog";
import { ExcelImportDialog } from "@/components/dialogs/excel-import-dialog";
import { PlayerReadOnlyView } from "@/components/ui/player-read-only-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { UserPlus, Star, Edit, Trash2, Check, X, Users, Shield, Target, Trophy, Filter, Settings, Upload } from "lucide-react";
import { User, Team, Fixture } from "@shared/schema";

// Define Player type for compatibility
type Player = User & {
  jerseyNumber?: number | null;
  position?: string;
  starPlayer?: boolean;
  keyPlayer?: boolean;
  fitnessStatus?: string;
};
import { Position } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useTeam } from "@/contexts/team-context";
import { apiRequest, queryClient } from "@/lib/queryClient";

type PositionFilter = 'all' | 'GK' | 'DEF' | 'MID' | 'FWD';
type StatusFilter = 'all' | 'Fit' | 'Injured' | 'Retired';
type StarFilter = 'all' | 'star' | 'regular';

export default function Squad() {
  const [activeFilter, setActiveFilter] = useState<PositionFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [starFilter, setStarFilter] = useState<StarFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingField, setEditingField] = useState<{playerId: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingJersey, setEditingJersey] = useState<string | null>(null);
  const [jerseyEditValue, setJerseyEditValue] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'player-card'>('player-card');
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const { selectedTeam: currentTeam } = useTeam();

  // Fetch team players (with squad numbers and positions)
  const { data: teamPlayersData, isLoading } = useQuery<any[]>({ 
    queryKey: ["/api/team", currentTeam?.id, "users"],
    enabled: !!currentTeam?.id 
  });
  
  // Convert team players to legacy format for compatibility
  const players = teamPlayersData?.map(tp => ({
    ...tp.user,
    id: tp.user.id, // Use user ID as player ID
    jerseyNumber: tp.jerseyNumber, // Use jersey number from team assignment
    position: tp.position, // Use position from team assignment
    starPlayer: tp.starPlayer, // Use star player status from team assignment
    keyPlayer: tp.starPlayer, // Use star player status for keyPlayer compatibility
    fitnessStatus: tp.fitnessStatus // Use fitness status from team assignment
  })) || [];

  const { data: fixtures } = useQuery<Fixture[]>({ 
    queryKey: ["/api/fixtures", currentTeam?.id],
    enabled: !!currentTeam?.id 
  });

  const createPlayerMutation = useMutation({
    mutationFn: async (playerData: any) => {
      // Add teamId and clubId to the data so user gets assigned to current team and club
      const dataWithTeam = { 
        ...playerData, 
        teamId: currentTeam?.id,
        clubId: currentTeam?.clubId // Add clubId from the team
      };
      return apiRequest("POST", "/api/users", dataWithTeam);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team", currentTeam?.id, "users"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/team", currentTeam?.id, "players"] });
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
    mutationFn: async ({ playerId, starPlayer }: { playerId: string; starPlayer: boolean }) => {
      return apiRequest("PATCH", `/api/player/${playerId}/team/${currentTeam?.id}/star`, { starPlayer });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team", currentTeam?.id, "users"] });
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

  const updateJerseyNumberMutation = useMutation({
    mutationFn: async ({ playerId, teamId, jerseyNumber }: { playerId: string; teamId: string; jerseyNumber: number }) => {
      return apiRequest("PATCH", `/api/player/${playerId}/team/${teamId}/jersey`, { jerseyNumber });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team", currentTeam?.id, "users"] });
      toast({
        title: "Jersey Number Updated",
        description: "Player's jersey number has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update jersey number.",
        variant: "destructive",
      });
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      return apiRequest("DELETE", `/api/users/${playerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team", currentTeam?.id, "players"] });
      toast({
        title: "Player Deleted",
        description: "Player has been removed from the squad.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete player.",
        variant: "destructive",
      });
    },
  });

  const getPositionCategory = (position: string): PositionFilter => {
    if (['GK', 'Goalkeeper', 'goalkeeper'].includes(position)) return 'GK';
    if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'DEF', 'Defender', 'defender'].includes(position)) return 'DEF';
    if (['CM', 'CDM', 'CAM', 'LM', 'RM', 'DM', 'AM', 'MID', 'Midfielder', 'midfield'].includes(position)) return 'MID';
    if (['ST', 'LW', 'RW', 'CF', 'FWD', 'Forward', 'forward'].includes(position)) return 'FWD';
    return 'MID'; // Default to midfield instead of defender
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
    const matchesStatus = statusFilter === 'all' || player.status === statusFilter;
    const matchesStar = starFilter === 'all' || 
      (starFilter === 'star' && player.keyPlayer) ||
      (starFilter === 'regular' && !player.keyPlayer);
    const matchesSearch = searchTerm === '' || 
      `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesStatus && matchesStar && matchesSearch;
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
    if (!currentTeam?.id) {
      toast({
        title: "Error",
        description: "No team selected. Please select a team first.",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure teamId is properly set
    const playerData = {
      ...data,
      teamId: currentTeam.id
    };
    
    createPlayerMutation.mutate(playerData);
  };

  const handleUpdatePlayer = (playerId: string, data: any) => {
    updatePlayerMutation.mutate({ playerId, data });
  };

  const handleToggleKeyPlayer = (player: Player) => {
    toggleKeyPlayerMutation.mutate({
      playerId: player.id,
      starPlayer: !player.keyPlayer
    });
  };

  const handleUpdateJerseyNumber = (playerId: string, teamId: string, jerseyNumber: number) => {
    updateJerseyNumberMutation.mutate({ playerId, teamId, jerseyNumber });
  };

  const handleStartJerseyEdit = (playerId: string, currentJersey: number | null) => {
    setEditingJersey(playerId);
    setJerseyEditValue(currentJersey?.toString() || '');
  };

  const handleSaveJerseyEdit = (playerId: string) => {
    const newJerseyNumber = parseInt(jerseyEditValue);
    if (!isNaN(newJerseyNumber) && currentTeam?.id) {
      handleUpdateJerseyNumber(playerId, currentTeam.id, newJerseyNumber);
    }
    setEditingJersey(null);
    setJerseyEditValue('');
  };

  const handleCancelJerseyEdit = () => {
    setEditingJersey(null);
    setJerseyEditValue('');
  };

  const handleStartEdit = (playerId: string, field: string, currentValue: string) => {
    setEditingField({ playerId, field });
    setEditValue(currentValue);
  };

  const [, navigate] = useLocation();

  const handleViewPlayer = (player: Player) => {
    navigate(`/users/${player.id}`);
  };

  const handleSaveEdit = (playerId: string, field: string) => {
    const value = editValue;
    
    updatePlayerMutation.mutate({ 
      playerId, 
      data: { [field]: value } 
    });
    setEditingField(null);
    setEditValue("");
  };

  const handleDeletePlayer = (player: Player) => {
    if (window.confirm(`Are you sure you want to delete ${player.firstName} ${player.lastName} from the squad?`)) {
      deletePlayerMutation.mutate(player.id);
    }
  };

  const handleImportComplete = () => {
    // Refresh the team players list after import
    queryClient.invalidateQueries({ queryKey: ["/api/team", currentTeam?.id, "users"] });
  };


  return (
    <MainLayout 
      title="Squad Management" 
      subtitle="Manage player roster and profiles"
    >

      {/* Summary Cards */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Players */}
          <StatsCard
            title="Total Players"
            value={getPositionCount('all')}
            icon={Users}
            iconColor="text-club-primary"
            subtitle="active squad members"
          />
          
          {/* Star Players */}
          <StatsCard
            title="Star Players"
            value={players?.filter(p => p.keyPlayer).length || 0}
            icon={Star}
            iconColor="text-club-primary"
            subtitle="regular starters"
          />

          {/* Position Breakdown */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">GK</p>
                      <p className="text-3xl font-bold text-foreground">{getPositionCount('GK')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">DEF</p>
                      <p className="text-3xl font-bold text-foreground">{getPositionCount('DEF')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">MID</p>
                      <p className="text-3xl font-bold text-foreground">{getPositionCount('MID')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">FWD</p>
                      <p className="text-3xl font-bold text-foreground">{getPositionCount('FWD')}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-muted-foreground text-sm">position breakdown</span>
              </div>
            </CardContent>
          </Card>

          {/* Player Status */}
          <StatsCard
            title="Player Status"
            value={`${players?.filter(p => p.status === 'Fit').length || 0}-${players?.filter(p => p.status === 'Injured').length || 0}-${players?.filter(p => p.status === 'Retired').length || 0}`}
            icon={Users}
            iconColor="text-club-primary"
            subtitle="fit-injured-retired"
          />
        </div>
      </div>

      {/* Tab Navigation with Filter and Add Player Buttons */}
      <div className="mb-6 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <Filter className="mr-2 h-4 w-4" />
              Enable Filter
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <PlayerCreateDialog 
              teamId={currentTeam?.id || ""} 
              clubId={currentTeam?.clubId || ""} 
              onSave={handleCreatePlayer}
            >
              <Button 
                variant="outline" 
                data-testid="button-add-player"
                disabled={!currentTeam?.id}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Player
              </Button>
            </PlayerCreateDialog>
            
            {/* Excel Import Modal */}
            <ExcelImportDialog 
              teamId={currentTeam?.id || ""} 
              onImportComplete={handleImportComplete}
            >
              <Button 
                variant="outline" 
                disabled={!currentTeam?.id}
                data-testid="button-import-excel"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Excel
              </Button>
            </ExcelImportDialog>
            
            <Button variant="ghost" data-testid="button-squad-settings">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
{/* Tab navigation hidden when only one tab */}
      </div>

      {/* Table Tab Content */}
      {activeTab === 'table' && (
        <>
          {/* Filters */}
          {showFilters && (
            <div className="mb-6 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Position</label>
                  <Select value={activeFilter} onValueChange={(value: PositionFilter) => setActiveFilter(value)}>
                    <SelectTrigger className="w-full" data-testid="select-position">
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
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                    <SelectTrigger className="w-full" data-testid="select-status">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Fit">Fit</SelectItem>
                      <SelectItem value="Injured">Injured</SelectItem>
                      <SelectItem value="Retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Star Players</label>
                  <Select value={starFilter} onValueChange={(value: StarFilter) => setStarFilter(value)}>
                    <SelectTrigger className="w-full" data-testid="select-star">
                      <SelectValue placeholder="All Players" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Players</SelectItem>
                      <SelectItem value="star">Star Players</SelectItem>
                      <SelectItem value="regular">Regular Players</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Keyword</label>
                  <Input
                    placeholder="Search players..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                    data-testid="input-search-players"
                  />
                </div>
              </div>
            </div>
          )}

      {/* Squad Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">#</TableHead>
                  <TableHead className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Player</TableHead>
                  <TableHead className="text-center py-3 px-4 font-medium text-muted-foreground text-sm">⭐</TableHead>
                  <TableHead className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Position</TableHead>
                  <TableHead className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Status</TableHead>
                  <TableHead className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <td colSpan={10} className="text-center py-8">
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
                        {editingJersey === player.id ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={jerseyEditValue}
                              onChange={(e) => setJerseyEditValue(e.target.value)}
                              className="w-16 h-8 text-center"
                              min="1"
                              max="99"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveJerseyEdit(player.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelJerseyEdit}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold cursor-pointer hover:bg-primary/80"
                            onClick={() => handleStartJerseyEdit(player.id, player.jerseyNumber)}
                            title="Click to edit jersey number"
                          >
                            {player.jerseyNumber !== undefined && player.jerseyNumber !== null ? player.jerseyNumber : '?'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground">{player.firstName} {player.lastName}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
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
                              (player.fitnessStatus || player.status) === 'Fit' ? 'bg-green-100 text-green-800' :
                              (player.fitnessStatus || player.status) === 'Injured' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                            onClick={() => handleStartEdit(player.id, 'status', player.fitnessStatus || player.status || 'Fit')}
                          >
                            {player.fitnessStatus || player.status || 'Fit'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewPlayer(player)}
                            data-testid={`button-edit-player-${player.id}`}
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeletePlayer(player)}
                            data-testid={`button-delete-player-${player.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <td colSpan={10} className="text-center py-8">
                      <p className="text-muted-foreground">No players found matching your criteria</p>
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

        </>
      )}

      {/* Player Card Tab Content */}
      {activeTab === 'player-card' && (
        <>
          {/* Filters */}
          {showFilters && (
            <div className="mb-6 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Position</label>
                  <Select value={activeFilter} onValueChange={(value: PositionFilter) => setActiveFilter(value)}>
                    <SelectTrigger className="w-full" data-testid="select-position-cards">
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
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                    <SelectTrigger className="w-full" data-testid="select-status-cards">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Fit">Fit</SelectItem>
                      <SelectItem value="Injured">Injured</SelectItem>
                      <SelectItem value="Retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Star Players</label>
                  <Select value={starFilter} onValueChange={(value: StarFilter) => setStarFilter(value)}>
                    <SelectTrigger className="w-full" data-testid="select-star-cards">
                      <SelectValue placeholder="All Players" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Players</SelectItem>
                      <SelectItem value="star">Star Players</SelectItem>
                      <SelectItem value="regular">Regular Players</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Keyword</label>
                  <Input
                    placeholder="Search players..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                    data-testid="input-search-players-cards"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Player Cards Grid - Grouped by Position */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading players...</p>
            </div>
          ) : filteredPlayers.length > 0 ? (
            <div className="space-y-8">
              {/* Group players by position */}
              {['GK', 'DEF', 'MID', 'FWD'].map(positionCategory => {
                const playersInPosition = filteredPlayers.filter(player => 
                  getPositionCategory(player.position) === positionCategory
                );
                
                if (playersInPosition.length === 0) return null;
                
                const positionName = {
                  'GK': 'Goalkeepers',
                  'DEF': 'Defenders', 
                  'MID': 'Midfielders',
                  'FWD': 'Forwards'
                }[positionCategory];
                
                return (
                  <div key={positionCategory}>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                      {positionName} ({playersInPosition.length})
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {playersInPosition.map((player) => (
                        <div key={player.id} className="relative">
                          <PlayerCard
                            player={player}
                            onEdit={handleViewPlayer}
                            onDelete={handleDeletePlayer}
                            onToggleKeyPlayer={handleToggleKeyPlayer}
                            onUpdateStatus={(player, newStatus) => {
                              handleUpdatePlayer(player.id, { status: newStatus });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No players found matching your criteria</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}


    </MainLayout>
  );
}
