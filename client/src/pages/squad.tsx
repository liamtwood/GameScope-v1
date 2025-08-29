import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { PlayerRow } from "@/components/ui/player-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus } from "lucide-react";
import { Player, Team } from "@shared/schema";
import { Position } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

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

  const handleEditPlayer = (player: Player) => {
    toast({
      title: "Edit Player",
      description: `Editing ${player.name}`,
    });
  };

  const handleViewPlayer = (player: Player) => {
    toast({
      title: "Player Profile",
      description: `Viewing profile for ${player.name}`,
    });
  };

  const filterButtons = [
    { id: 'all' as const, label: 'All' },
    { id: 'GK' as const, label: 'GK' },
    { id: 'DEF' as const, label: 'Defense' },
    { id: 'MID' as const, label: 'Midfield' },
    { id: 'FWD' as const, label: 'Forward' },
  ];

  return (
    <MainLayout 
      title="Squad Management" 
      subtitle="Manage player roster and profiles"
    >
      <div className="mb-6 flex items-center justify-between">
        <Button data-testid="button-add-player">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Player
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex bg-muted rounded-lg p-1">
          {filterButtons.map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter(filter.id)}
              className={activeFilter === filter.id ? "bg-background text-foreground shadow-sm" : ""}
              data-testid={`button-filter-${filter.id}`}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <Input
          placeholder="Search players..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
          data-testid="input-search-players"
        />
      </div>

      {/* Squad Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-foreground">{getPositionCount('all')}</p>
            <p className="text-sm text-muted-foreground">Total Players</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-foreground">{getPositionCount('GK')}</p>
            <p className="text-sm text-muted-foreground">Goalkeepers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-foreground">{getPositionCount('DEF')}</p>
            <p className="text-sm text-muted-foreground">Defenders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-foreground">{getPositionCount('MID') + getPositionCount('FWD')}</p>
            <p className="text-sm text-muted-foreground">Mid/Forward</p>
          </CardContent>
        </Card>
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
                    <PlayerRow
                      key={player.id}
                      player={player}
                      onEdit={handleEditPlayer}
                      onView={handleViewPlayer}
                    />
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
