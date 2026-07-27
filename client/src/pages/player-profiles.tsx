import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Search, Blocks, LayoutTemplate } from "lucide-react";
import { useTeam } from "@/contexts/team-context";
import { useClubTheme } from "@/hooks/use-club-theme";

type PositionFilter = 'all' | 'GK' | 'DEF' | 'MID' | 'FWD';
type StarPlayerFilter = 'all' | 'yes' | 'no';
type ViewMode = 'tile' | 'formation';

export default function PlayerProfiles() {
  const [positionFilter, setPositionFilter] = useState<PositionFilter>('all');
  const [starPlayerFilter, setStarPlayerFilter] = useState<StarPlayerFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('tile');
  const [, setLocation] = useLocation();
  const { selectedTeam: currentTeam } = useTeam();
  
  const { clubPrimary } = useClubTheme();

  // Persist view mode preference
  useEffect(() => {
    const saved = localStorage.getItem('playerProfilesViewMode');
    if (saved === 'tile' || saved === 'formation') setViewMode(saved);
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('playerProfilesViewMode', mode);
  };


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
    const p = (position || '').toLowerCase();
    if (p === 'gk' || p === 'goalkeeper') return 'GK';
    if (p === 'def' || p === 'defender') return 'DEF';
    if (p === 'mid' || p === 'midfield' || p === 'midfielder') return 'MID';
    if (p === 'fwd' || p === 'forward' || p === 'attacker' || p === 'striker') return 'FWD';
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
    const matchesStarPlayer = starPlayerFilter === 'all' || 
      (starPlayerFilter === 'yes' && player.starPlayer) ||
      (starPlayerFilter === 'no' && !player.starPlayer);
    const matchesSearch = !searchTerm || 
      player.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.hometown?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPosition && matchesStarPlayer && matchesSearch;
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

  // ── Formation selection logic ──────────────────────────────────────────────
  // All star players start — slots are driven by the actual star count per group.
  // Fit-only: unfit players are excluded from pitch and bench entirely.

  const fitPlayers = allPlayers.filter(p => p.fitnessStatus === 'Fit');

  const fitByPos = {
    GK:  fitPlayers.filter(p => getPositionCategory(p.position || 'MID') === 'GK'),
    DEF: fitPlayers.filter(p => getPositionCategory(p.position || 'MID') === 'DEF'),
    MID: fitPlayers.filter(p => getPositionCategory(p.position || 'MID') === 'MID'),
    FWD: fitPlayers.filter(p => getPositionCategory(p.position || 'MID') === 'FWD'),
  };

  // All star players in each group go into the formation (no cap)
  const byJersey = (a: any, b: any) => (a.jerseyNumber || 999) - (b.jerseyNumber || 999);
  const formationGK  = fitByPos.GK.filter(p => p.starPlayer).sort(byJersey);
  const formationDEF = fitByPos.DEF.filter(p => p.starPlayer).sort(byJersey);
  const formationMID = fitByPos.MID.filter(p => p.starPlayer).sort(byJersey);
  const formationFWD = fitByPos.FWD.filter(p => p.starPlayer).sort(byJersey);

  const starterIds = new Set([
    ...formationGK, ...formationDEF, ...formationMID, ...formationFWD,
  ].map(p => p.id));

  // Bench: fit non-starters, grouped by position
  const benchPlayers = fitPlayers.filter(p => !starterIds.has(p.id));
  const subsGrouped = {
    GK:  benchPlayers.filter(p => getPositionCategory(p.position || 'MID') === 'GK' ).sort(byJersey),
    DEF: benchPlayers.filter(p => getPositionCategory(p.position || 'MID') === 'DEF').sort(byJersey),
    MID: benchPlayers.filter(p => getPositionCategory(p.position || 'MID') === 'MID').sort(byJersey),
    FWD: benchPlayers.filter(p => getPositionCategory(p.position || 'MID') === 'FWD').sort(byJersey),
  };

  // Compute evenly-spaced x positions for a row of `count` players
  const rowPositions = (count: number, y: number): { x: number; y: number }[] => {
    if (count === 0) return [];
    if (count === 1) return [{ x: 50, y }];
    const margin = 12;
    const span = 76;
    return Array.from({ length: count }, (_, i) => ({
      x: margin + (span / (count - 1)) * i,
      y,
    }));
  };

  // Rows top→bottom: FWD / MID / DEF / GK
  const starterRows = [
    { label: 'FWD', players: formationFWD, positions: rowPositions(formationFWD.length, 16) },
    { label: 'MID', players: formationMID, positions: rowPositions(formationMID.length, 38) },
    { label: 'DEF', players: formationDEF, positions: rowPositions(formationDEF.length, 61) },
    { label: 'GK',  players: formationGK,  positions: rowPositions(formationGK.length,  83) },
  ];

  // Formation label e.g. "1–4–3–3"
  const formationLabel = [formationGK.length, formationDEF.length, formationMID.length, formationFWD.length].join('–');

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

            <Select value={starPlayerFilter} onValueChange={(value) => setStarPlayerFilter(value as StarPlayerFilter)}>
              <SelectTrigger className="w-48" data-testid="select-star-player-filter">
                <SelectValue placeholder="Filter by star players" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Players</SelectItem>
                <SelectItem value="yes">Star Players Only</SelectItem>
                <SelectItem value="no">Non-Star Players</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{filteredPlayers.length} players</span>
              <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
              <span>{filteredPlayers.filter(p => p.starPlayer).length} star players</span>
            </div>
            {/* View Mode Toggle */}
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'tile' ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewModeChange('tile')}
                className={viewMode === 'tile' ? "bg-background text-foreground shadow-sm" : ""}
                data-testid="button-view-tile"
              >
                <Blocks className="h-4 w-4 mr-2" />
                Tile Mode
              </Button>
              <Button
                variant={viewMode === 'formation' ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewModeChange('formation')}
                className={viewMode === 'formation' ? "bg-background text-foreground shadow-sm" : ""}
                data-testid="button-view-formation"
              >
                <LayoutTemplate className="h-4 w-4 mr-2" />
                Formation Mode
              </Button>
            </div>
          </div>
        </div>

        {/* Tile Mode */}
        {viewMode === 'tile' && (
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
                        <CardHeader className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar className="h-16 w-16 border border-gray-300">
                                  {player.avatarPath && (
                                    <AvatarImage src={player.avatarPath} alt={`${player.firstName} ${player.lastName}`} />
                                  )}
                                  <AvatarFallback className="text-lg font-bold">
                                    {getPlayerInitials(player)}
                                  </AvatarFallback>
                                </Avatar>
                                {(player.jerseyNumber !== null && player.jerseyNumber !== undefined) && (
                                  <div 
                                    className="absolute -bottom-2 -right-2 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm border border-gray-300"
                                    style={{ backgroundColor: clubPrimary }}
                                  >
                                    {player.jerseyNumber}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold leading-tight">
                                  <div className="text-sm">{player.firstName}</div>
                                  <div className="text-lg flex items-center gap-2">
                                    <span>{player.lastName}</span>
                                    {player.starPlayer && (
                                      <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Badge className={`${getPositionColor(player.position || 'MID')} text-xs`}>
                              {player.position || 'MID'}
                            </Badge>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Formation Mode */}
        {viewMode === 'formation' && (
          <div className="flex gap-0 rounded-xl overflow-hidden" style={{ minHeight: '600px' }}>

            {/* ── Left: Substitutes panel ───────────────────────────── */}
            <div
              className="w-52 shrink-0 flex flex-col p-4"
              style={{ background: 'rgba(15,30,20,0.92)' }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">
                Substitutes
              </p>
              {benchPlayers.length === 0 && (
                <p className="text-white/40 text-xs italic">None</p>
              )}
              <div className="space-y-4 overflow-y-auto">
                {(['GK', 'DEF', 'MID', 'FWD'] as const).map(pos => {
                  const group = subsGrouped[pos];
                  if (group.length === 0) return null;
                  return (
                    <div key={pos}>
                      <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1 px-1">
                        {pos}
                      </p>
                      <div className="space-y-1">
                        {group.map(player => (
                          <button
                            key={player.id}
                            onClick={() => handlePlayerClick(player.id)}
                            className="w-full flex items-center gap-2 text-left group hover:bg-white/5 rounded px-1 py-0.5 transition-colors"
                            data-testid={`sub-player-${player.id}`}
                          >
                            <span className="text-white/40 text-xs w-5 text-right shrink-0">
                              {player.jerseyNumber ?? '–'}
                            </span>
                            <span className="text-white/80 text-xs leading-tight group-hover:text-white transition-colors">
                              {player.firstName}{' '}
                              <span className="font-bold uppercase">{player.lastName}</span>
                            </span>
                            {player.starPlayer && (
                              <Star className="h-2.5 w-2.5 text-orange-400 fill-orange-400 shrink-0 ml-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Right: Pitch ──────────────────────────────────────── */}
            <div
              className="relative flex-1"
              style={{
                background: 'linear-gradient(180deg, #1e7a30 0%, #22923a 30%, #1e7a30 50%, #22923a 70%, #1e7a30 100%)',
                minHeight: '600px',
              }}
            >
              {/* Pitch stripe pattern */}
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                {/* Pitch border */}
                <rect x="4%" y="2%" width="92%" height="96%" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" rx="2" />
                {/* Centre line */}
                <line x1="4%" y1="50%" x2="96%" y2="50%" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                {/* Centre circle */}
                <ellipse cx="50%" cy="50%" rx="9%" ry="11%" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" />
                {/* Centre spot */}
                <circle cx="50%" cy="50%" r="3" fill="rgba(255,255,255,0.5)" />
                {/* Top penalty area */}
                <rect x="28%" y="2%" width="44%" height="17%" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" />
                {/* Top 6-yard box */}
                <rect x="38%" y="2%" width="24%" height="7%" stroke="rgba(255,255,255,0.25)" strokeWidth="1" fill="none" />
                {/* Bottom penalty area */}
                <rect x="28%" y="81%" width="44%" height="17%" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" />
                {/* Bottom 6-yard box */}
                <rect x="38%" y="91%" width="24%" height="7%" stroke="rgba(255,255,255,0.25)" strokeWidth="1" fill="none" />
                {/* Penalty spots */}
                <circle cx="50%" cy="13%" r="2.5" fill="rgba(255,255,255,0.45)" />
                <circle cx="50%" cy="87%" r="2.5" fill="rgba(255,255,255,0.45)" />
              </svg>

              {/* ── Players (absolutely positioned) ── */}
              {starterRows.map(row =>
                row.players.map((player, i) => {
                  const pos = row.positions[i];
                  if (!pos) return null;
                  const isGK = row.label === 'GK';
                  return (
                    <button
                      key={player.id}
                      onClick={() => handlePlayerClick(player.id)}
                      className="absolute flex flex-col items-center gap-1 group cursor-pointer -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      data-testid={`formation-player-${player.id}`}
                    >
                      <div className="relative">
                        <Avatar
                          className="border-2 shadow-lg transition-all group-hover:scale-110"
                          style={{
                            width: 48, height: 48,
                            borderColor: isGK ? '#f59e0b' : 'rgba(255,255,255,0.7)',
                          }}
                        >
                          {player.avatarPath && (
                            <AvatarImage
                              src={player.avatarPath}
                              alt={`${player.firstName} ${player.lastName}`}
                            />
                          )}
                          <AvatarFallback
                            className="text-sm font-bold text-white"
                            style={{ backgroundColor: isGK ? '#92400e' : clubPrimary }}
                          >
                            {player.jerseyNumber ?? getPlayerInitials(player)}
                          </AvatarFallback>
                        </Avatar>
                        {/* Jersey number badge */}
                        {player.jerseyNumber !== null && player.jerseyNumber !== undefined && (
                          <div
                            className="absolute -bottom-1 -right-1 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold border border-white/60 shadow"
                            style={{ backgroundColor: isGK ? '#92400e' : clubPrimary }}
                          >
                            {player.jerseyNumber}
                          </div>
                        )}
                        {/* Star badge */}
                        {player.starPlayer && (
                          <div className="absolute -top-1 -left-1">
                            <Star className="h-3.5 w-3.5 text-orange-400 fill-orange-400 drop-shadow" />
                          </div>
                        )}
                      </div>
                      {/* Name label */}
                      <span
                        className="text-white text-[11px] font-semibold drop-shadow-md text-center leading-tight px-1 rounded"
                        style={{
                          maxWidth: 72,
                          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                          background: 'rgba(0,0,0,0.25)',
                        }}
                      >
                        {player.lastName?.toUpperCase()}
                      </span>
                    </button>
                  );
                })
              )}

              {/* Formation label */}
              <div className="absolute bottom-3 right-4 text-white/40 text-xs font-mono">
                {formationLabel}
              </div>
            </div>
          </div>
        )}

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