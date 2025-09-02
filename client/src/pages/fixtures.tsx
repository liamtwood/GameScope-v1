import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTeam } from "@/contexts/team-context";
import { MainLayout } from "@/components/layout/main-layout";
import { FixtureCard } from "@/components/ui/fixture-card";
import { StatsCard } from "@/components/ui/stats-card";
import { FixtureEditDialog } from "@/components/dialogs/fixture-edit-dialog";
import { FixtureCreateDialog } from "@/components/dialogs/fixture-create-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Target, TrendingUp, TrendingDown, TrendingUpDown, Minus, Trophy, Calendar, Video, MapPin, Clock, Home, Plane, Edit, Upload, Filter } from "lucide-react";
import { format } from "date-fns";
import { Fixture, Team, Competition } from "@shared/schema";
import { FixtureStatus } from "@/lib/types";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type FilterType = 'all' | FixtureStatus;

export default function Fixtures() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [competitionFilter, setCompetitionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fixtureToDelete, setFixtureToDelete] = useState<Fixture | null>(null);
  const [overviewTab, setOverviewTab] = useState<'season' | 'competitions'>('season');
  const [homeAwayFilter, setHomeAwayFilter] = useState<'all' | 'HOME' | 'AWAY'>('all');
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [editCompetitionName, setEditCompetitionName] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();


  const { selectedTeam: currentTeam } = useTeam();

  const { data: fixtures, isLoading } = useQuery<Fixture[]>({ 
    queryKey: ["/api/fixtures", currentTeam?.id],
    enabled: !!currentTeam?.id 
  });

  const { data: competitions = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"]
  });


  // Mutation for updating fixtures
  const updateFixtureMutation = useMutation({
    mutationFn: async ({ fixtureId, data }: { fixtureId: string; data: any }) => {
      return apiRequest("PUT", `/api/fixtures/${fixtureId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures", currentTeam?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      toast({
        title: "Success",
        description: "Fixture updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update fixture",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting fixtures
  const deleteFixtureMutation = useMutation({
    mutationFn: async (fixtureId: string) => {
      return apiRequest("DELETE", `/api/fixtures/${fixtureId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures", currentTeam?.id] });
      toast({
        title: "Success",
        description: "Fixture deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete fixture",
        variant: "destructive",
      });
    },
  });

  // Mutation for creating fixtures
  const createFixtureMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/fixtures", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures", currentTeam?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      toast({
        title: "Success",
        description: "Fixture created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create fixture",
        variant: "destructive",
      });
    },
  });

  const updateCompetitionMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await apiRequest("PATCH", `/api/competitions/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/competitions'] });
      toast({
        title: "Success",
        description: "Competition name has been updated successfully.",
      });
      setEditingCompetition(null);
      setEditCompetitionName("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadCompetitionLogoMutation = useMutation({
    mutationFn: async ({ competitionId, logoFile }: { competitionId: string; logoFile: File }) => {
      const formData = new FormData();
      formData.append('logo', logoFile);
      
      const response = await fetch(`/api/competitions/${competitionId}/logo`, {
        method: 'PUT',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/competitions'] });
      toast({
        title: "Success",
        description: "Competition logo has been updated successfully.",
      });
      setIsUploadingLogo(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsUploadingLogo(false);
    },
  });

  const handleEditCompetition = (competition: Competition) => {
    setEditingCompetition(competition);
    setEditCompetitionName(competition.name);
  };

  const handleSaveCompetitionName = () => {
    if (editingCompetition && editCompetitionName.trim()) {
      updateCompetitionMutation.mutate({ id: editingCompetition.id, name: editCompetitionName.trim() });
    }
  };

  const handleLogoUpload = (competitionId: string, file: File) => {
    setIsUploadingLogo(true);
    uploadCompetitionLogoMutation.mutate({ competitionId, logoFile: file });
  };

  const filteredFixtures = fixtures?.filter(fixture => {
    // Apply home/away filter to all tabs
    if (homeAwayFilter !== 'all' && fixture.type !== homeAwayFilter) {
      return false;
    }
    
    // Treat NO_CONTEST the same as COMPLETED when filtering
    const matchesFilter = activeFilter === 'all' || 
      fixture.status === activeFilter ||
      (activeFilter === 'COMPLETED' && fixture.status === 'NO_CONTEST');
    const matchesCompetition = competitionFilter === 'all' || fixture.competition === competitionFilter;
    const matchesSearch = searchTerm === '' || 
      fixture.opponent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fixture.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fixture.competition && fixture.competition.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesCompetition && matchesSearch;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  const handleViewDetails = (fixture: Fixture, activeTab?: string) => {
    if (activeTab) {
      setLocation(`/fixtures/${fixture.id}?tab=${activeTab}`);
    } else {
      setLocation(`/fixtures/${fixture.id}`);
    }
  };

  const handleViewAnalysis = (fixture: Fixture) => {
    setLocation(`/analysis/${fixture.id}`);
  };

  const handleEditFixture = (data: any) => {
    // This will be called from the dialog - we need to pass the fixture ID
    // The actual handler is passed to the dialog
  };

  const handleDeleteFixture = (fixture: Fixture) => {
    setFixtureToDelete(fixture);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (fixtureToDelete) {
      deleteFixtureMutation.mutate(fixtureToDelete.id);
      setDeleteDialogOpen(false);
      setFixtureToDelete(null);
    }
  };

  const filterButtons = [
    { id: 'all' as const, label: 'All' },
    { id: 'COMPLETED' as const, label: 'Completed' },
    { id: 'SCHEDULED' as const, label: 'Scheduled' },
  ];

  // Calculate fixture statistics
  const getFixtureStats = () => {
    if (!fixtures) return { 
      total: 0, scheduled: 0, completed: 0, competitions: 0,
      wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0
    };
    
    const scheduled = fixtures.filter(f => f.status === 'SCHEDULED').length;
    const completed = fixtures.filter(f => f.status === 'COMPLETED').length;
    const uniqueCompetitions = new Set(fixtures.map(f => f.competition).filter(Boolean)).size;
    
    // Calculate match results and goals
    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
    
    fixtures.forEach(fixture => {
      if (fixture.status === 'COMPLETED' && fixture.homeScore !== null && fixture.awayScore !== null) {
        const isHome = fixture.type === 'HOME';
        const ourScore = isHome ? fixture.homeScore : fixture.awayScore;
        const theirScore = isHome ? fixture.awayScore : fixture.homeScore;
        
        goalsFor += ourScore;
        goalsAgainst += theirScore;
        
        if (ourScore > theirScore) wins++;
        else if (ourScore === theirScore) draws++;
        else losses++;
      }
    });
    
    return {
      total: fixtures.length,
      scheduled,
      completed,
      competitions: uniqueCompetitions,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst
    };
  };

  // Calculate planning statistics
  const getPlanningStats = () => {
    if (!fixtures) return { upcoming: 0, homeGames: 0, awayGames: 0, thisMonth: 0 };
    
    const now = new Date();
    const upcoming = fixtures.filter(f => f.status === 'SCHEDULED' && new Date(f.date) > now);
    const homeGames = upcoming.filter(f => f.type === 'HOME').length;
    const awayGames = upcoming.filter(f => f.type === 'AWAY').length;
    
    const thisMonth = upcoming.filter(f => {
      const fixtureDate = new Date(f.date);
      return fixtureDate.getMonth() === now.getMonth() && fixtureDate.getFullYear() === now.getFullYear();
    }).length;
    
    return { upcoming: upcoming.length, homeGames, awayGames, thisMonth };
  };

  // Calculate video statistics
  const getVideoStats = () => {
    if (!fixtures || fixtures.length === 0) return { withVideo: 0, withoutVideo: 0, totalVideos: 0, coverage: 0 };
    
    // Include all past matches (ignore status, only check date) that need videos
    const now = new Date();
    const pastFixtures = fixtures.filter(f => {
      const matchDate = new Date(f.date);
      return matchDate < now;
    });
    
    const withVideo = pastFixtures.filter(f => f.hasVideo).length;
    const withoutVideo = pastFixtures.filter(f => !f.hasVideo).length;
    
    const totalVideos = fixtures.reduce((sum, f) => {
      return sum + (f.videoLinks && Array.isArray(f.videoLinks) ? f.videoLinks.length : 0);
    }, 0);
    
    const coverage = pastFixtures.length > 0 ? (withVideo / pastFixtures.length) * 100 : 0;
    
    return { withVideo, withoutVideo, totalVideos, coverage };
  };

  // Get matches that need video uploads (only past matches using today's date)
  const getMatchesNeedingVideos = () => {
    if (!fixtures) return [];
    
    const now = new Date();
    
    return fixtures.filter(f => {
      const matchDate = new Date(f.date);
      const isPastMatch = matchDate < now;
      const hasNoVideo = !f.hasVideo;
      
      // Include only past matches (before now) that need videos, ignore status
      return isPastMatch && hasNoVideo;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Most recent first
  };

  const stats = getFixtureStats();

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

  return (
    <MainLayout 
      title="Fixtures" 
      subtitle="Manage team fixtures and match results"
    >
      {/* Summary Cards */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* FCSAA League Card */}
            <StatsCard
              title="FCSAA League"
              value={`${fcsaaStats.wins}-${fcsaaStats.draws}-${fcsaaStats.losses}`}
              icon={Trophy}
              iconColor="text-border"
              subtitle="W-D-L"
            />

            {/* Goals For Card */}
            <StatsCard
              title="Goals For"
              value={stats.goalsFor}
              icon={TrendingUp}
              iconColor="text-border"
              subtitle={`${stats.completed > 0 ? (stats.goalsFor / stats.completed).toFixed(1) : '0.0'} per game`}
            />

            {/* Goals Against Card */}
            <StatsCard
              title="Goals Against"
              value={stats.goalsAgainst}
              icon={TrendingDown}
              iconColor="text-border"
              subtitle={`${stats.completed > 0 ? (stats.goalsAgainst / stats.completed).toFixed(1) : '0.0'} per game`}
            />

            {/* Goal Difference Card */}
            <StatsCard
              title="Goal Difference"
              value={`${stats.goalsFor - stats.goalsAgainst > 0 ? '+' : ''}${stats.goalsFor - stats.goalsAgainst}`}
              icon={TrendingUpDown}
              iconColor="text-border"
              subtitle={`${stats.completed} matches played`}
            />
        </div>
      </div>

      {/* Tab Navigation with Add Fixture Button */}
      <div className="mb-6 relative">
        <div className="flex items-center">
          <FixtureCreateDialog 
            teamId={currentTeam?.id || ""} 
            onSave={(data) => createFixtureMutation.mutate(data)}
          >
            <Button variant="outline" data-testid="button-add-fixture">
              <Plus className="mr-2 h-4 w-4" />
              Add Fixture
            </Button>
          </FixtureCreateDialog>
        </div>
        
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
          <div className="flex space-x-8 border-b border-gray-200 pointer-events-auto">
            <button
              onClick={() => setOverviewTab('season')}
              className={`pb-3 px-4 text-lg font-semibold ${
                overviewTab === 'season' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Season
            </button>
            <button
              onClick={() => setOverviewTab('competitions')}
              className={`pb-3 px-4 text-lg font-semibold ${
                overviewTab === 'competitions' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Competitions
            </button>
          </div>
        </div>
      </div>

      {/* Fixtures Content */}
      <>
          {/* Filters */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="p-2"
                data-testid="button-toggle-filters"
              >
                <Filter className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-foreground">Filter By:</span>
            </div>
            {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Competition Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Competition</label>
                <Select value={competitionFilter} onValueChange={setCompetitionFilter}>
                  <SelectTrigger className="w-full" data-testid="select-competition">
                    <SelectValue placeholder="All Competitions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Competitions</SelectItem>
                    {competitions.map((competition) => (
                      <SelectItem key={competition.id} value={competition.name}>
                        {competition.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="flex bg-muted rounded-lg p-1">
                  {filterButtons.map((filter) => (
                    <Button
                      key={filter.id}
                      variant={activeFilter === filter.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveFilter(filter.id)}
                      className={`flex-1 text-center ${activeFilter === filter.id ? "bg-background text-foreground shadow-sm" : ""}`}
                      data-testid={`button-filter-${filter.id}`}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <div className="flex bg-muted rounded-lg p-1">
                  <Button
                    variant={homeAwayFilter === 'all' ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setHomeAwayFilter('all')}
                    className={`flex-1 text-center ${homeAwayFilter === 'all' ? "bg-background text-foreground shadow-sm" : ""}`}
                    data-testid="button-filter-venue-all"
                  >
                    All
                  </Button>
                  <Button
                    variant={homeAwayFilter === 'HOME' ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setHomeAwayFilter('HOME')}
                    className={`flex-1 text-center ${homeAwayFilter === 'HOME' ? "bg-background text-foreground shadow-sm" : ""}`}
                    data-testid="button-filter-venue-home"
                  >
                    Home
                  </Button>
                  <Button
                    variant={homeAwayFilter === 'AWAY' ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setHomeAwayFilter('AWAY')}
                    className={`flex-1 text-center ${homeAwayFilter === 'AWAY' ? "bg-background text-foreground shadow-sm" : ""}`}
                    data-testid="button-filter-venue-away"
                  >
                    Away
                  </Button>
                </div>
              </div>

              {/* Keyword Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Keyword</label>
                <Input
                  placeholder="Search fixtures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                  data-testid="input-search-fixtures"
                />
              </div>
            </div>
            )}
          </div>

          {/* Competitions Content */}
          {overviewTab === 'competitions' ? (
            <div className="space-y-4">
              {competitions.length > 0 ? (
                competitions.map((competition) => (
                  <Card key={competition.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                          {competition.logoPath ? (
                            <img 
                              src={competition.logoPath} 
                              alt={competition.name}
                              className="h-6 w-6 object-contain"
                            />
                          ) : (
                            <Trophy className="h-6 w-6 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{competition.name}</h3>
                          {competition.shortName && (
                            <p className="text-sm text-muted-foreground mt-1">{competition.shortName}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="mt-1">
                          Competition
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCompetition(competition)}
                          className="mt-1"
                          data-testid={`button-edit-competition-${competition.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Competition fixtures count */}
                    {fixtures && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {fixtures.filter(f => f.competition === competition.name).length} fixtures
                          </span>
                        </div>
                      </div>
                    )}
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No competitions found</p>
                </div>
              )}
            </div>
          ) : (
            /* Fixtures List - Grouped by Competition */
            <div className="space-y-8">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading fixtures...</p>
                </div>
              ) : filteredFixtures.length > 0 ? (
                (() => {
                  // Group fixtures by competition
                  const groupedFixtures = filteredFixtures.reduce((groups, fixture) => {
                    const competition = fixture.competition || 'No Competition';
                    if (!groups[competition]) {
                      groups[competition] = [];
                    }
                    groups[competition].push(fixture);
                    return groups;
                  }, {} as Record<string, typeof filteredFixtures>);

                  return Object.entries(groupedFixtures).map(([competitionName, competitionFixtures]) => (
                    <div key={competitionName}>
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2 bg-blue-500" />
                        {competitionName} ({competitionFixtures.length})
                      </h3>
                      <div className="space-y-4">
                        {competitionFixtures.map((fixture) => (
                          <FixtureEditDialog 
                            key={fixture.id}
                            fixture={fixture}
                            onSave={(data) => updateFixtureMutation.mutate({ fixtureId: fixture.id, data })}
                          >
                            <div className="w-full">
                              <FixtureCard
                                fixture={fixture}
                                onViewDetails={handleViewDetails}
                                onViewAnalysis={handleViewAnalysis}
                                onEdit={() => {}} // Edit is handled by the dialog wrapper
                                onDelete={handleDeleteFixture}
                              />
                            </div>
                          </FixtureEditDialog>
                        ))}
                      </div>
                    </div>
                  ));
                })()
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No fixtures found matching your criteria</p>
                </div>
              )}
            </div>
          )}

          {/* Delete confirmation dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Fixture</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the fixture against {fixtureToDelete?.opponent}? 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Edit Competition Dialog */}
          <Dialog open={!!editingCompetition} onOpenChange={(open) => !open && setEditingCompetition(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Competition</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="competition-name" className="text-sm font-medium">
                    Competition Name
                  </label>
                  <Input
                    id="competition-name"
                    value={editCompetitionName}
                    onChange={(e) => setEditCompetitionName(e.target.value)}
                    placeholder="Enter competition name"
                    data-testid="input-competition-name"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Competition Logo</label>
                  <div className="flex items-center space-x-3">
                    {editingCompetition?.logoPath && (
                      <img 
                        src={editingCompetition.logoPath} 
                        alt="Competition logo"
                        className="h-10 w-10 object-contain border rounded"
                      />
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && editingCompetition) {
                            handleLogoUpload(editingCompetition.id, file);
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        disabled={isUploadingLogo}
                        data-testid="input-competition-logo"
                      />
                      {isUploadingLogo && (
                        <p className="text-xs text-muted-foreground mt-1">Uploading logo...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingCompetition(null)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCompetitionName}
                  disabled={!editCompetitionName.trim() || updateCompetitionMutation.isPending}
                  data-testid="button-save-competition"
                >
                  {updateCompetitionMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
    </MainLayout>
  );
}
