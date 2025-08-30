import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { FixtureCard } from "@/components/ui/fixture-card";
import { FixtureEditDialog } from "@/components/dialogs/fixture-edit-dialog";
import { FixtureCreateDialog } from "@/components/dialogs/fixture-create-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Target, TrendingUp, TrendingDown, Minus, Trophy } from "lucide-react";
import { Fixture, Team, Competition } from "@shared/schema";
import { FixtureStatus } from "@/lib/types";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type FilterType = 'all' | FixtureStatus;

export default function Fixtures() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [competitionFilter, setCompetitionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fixtureToDelete, setFixtureToDelete] = useState<Fixture | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const currentTeam = teams?.[0]; // For demo, use first team

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

  const filteredFixtures = fixtures?.filter(fixture => {
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

  const handleViewDetails = (fixture: Fixture) => {
    setLocation(`/fixtures/${fixture.id}`);
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

  const stats = getFixtureStats();

  return (
    <MainLayout 
      title="Fixtures" 
      subtitle="Manage team fixtures and match results"
    >
      <div className="mb-6 flex items-center justify-between">
        <FixtureCreateDialog 
          teamId={currentTeam?.id || ""} 
          onSave={(data) => createFixtureMutation.mutate(data)}
        >
          <Button data-testid="button-add-fixture">
            <Plus className="mr-2 h-4 w-4" />
            Add Fixture
          </Button>
        </FixtureCreateDialog>
      </div>

      {/* Season Overview */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Season Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Record Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-blue-700 mb-1">RECORD</p>
              <p className="text-2xl font-bold text-blue-900">
                {stats.wins}-{stats.draws}-{stats.losses}
              </p>
              <p className="text-xs text-blue-600 mt-1">W-D-L</p>
            </CardContent>
          </Card>

          {/* Goals For Card */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-green-700 mb-1">GOALS FOR</p>
              <p className="text-3xl font-bold text-green-900">{stats.goalsFor}</p>
              <p className="text-xs text-green-600 mt-1">
                {stats.completed > 0 ? (stats.goalsFor / stats.completed).toFixed(1) : '0.0'} per game
              </p>
            </CardContent>
          </Card>

          {/* Goals Against Card */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6 text-center">
              <TrendingDown className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <p className="text-sm text-red-700 mb-1">GOALS AGAINST</p>
              <p className="text-3xl font-bold text-red-900">{stats.goalsAgainst}</p>
              <p className="text-xs text-red-600 mt-1">
                {stats.completed > 0 ? (stats.goalsAgainst / stats.completed).toFixed(1) : '0.0'} per game
              </p>
            </CardContent>
          </Card>

          {/* Goal Difference Card */}
          <Card className={`bg-gradient-to-br ${
            stats.goalsFor - stats.goalsAgainst > 0 
              ? 'from-emerald-50 to-emerald-100 border-emerald-200' 
              : stats.goalsFor - stats.goalsAgainst < 0 
                ? 'from-orange-50 to-orange-100 border-orange-200'
                : 'from-gray-50 to-gray-100 border-gray-200'
          }`}>
            <CardContent className="p-6 text-center">
              <Target className={`h-8 w-8 mx-auto mb-2 ${
                stats.goalsFor - stats.goalsAgainst > 0 
                  ? 'text-emerald-600' 
                  : stats.goalsFor - stats.goalsAgainst < 0 
                    ? 'text-orange-600'
                    : 'text-gray-600'
              }`} />
              <p className={`text-sm mb-1 ${
                stats.goalsFor - stats.goalsAgainst > 0 
                  ? 'text-emerald-700' 
                  : stats.goalsFor - stats.goalsAgainst < 0 
                    ? 'text-orange-700'
                    : 'text-gray-700'
              }`}>GOAL DIFFERENCE</p>
              <p className={`text-3xl font-bold ${
                stats.goalsFor - stats.goalsAgainst > 0 
                  ? 'text-emerald-900' 
                  : stats.goalsFor - stats.goalsAgainst < 0 
                    ? 'text-orange-900'
                    : 'text-gray-900'
              }`}>
                {stats.goalsFor - stats.goalsAgainst > 0 ? '+' : ''}{stats.goalsFor - stats.goalsAgainst}
              </p>
              <p className={`text-xs mt-1 ${
                stats.goalsFor - stats.goalsAgainst > 0 
                  ? 'text-emerald-600' 
                  : stats.goalsFor - stats.goalsAgainst < 0 
                    ? 'text-orange-600'
                    : 'text-gray-600'
              }`}>
                {stats.completed} matches played
              </p>
            </CardContent>
          </Card>
        </div>
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
        
        <Select value={competitionFilter} onValueChange={setCompetitionFilter}>
          <SelectTrigger className="w-48" data-testid="select-competition">
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

        <Input
          placeholder="Search fixtures..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
          data-testid="input-search-fixtures"
        />
      </div>

      {/* Fixtures List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading fixtures...</p>
          </div>
        ) : filteredFixtures.length > 0 ? (
          filteredFixtures.map((fixture) => (
            <FixtureEditDialog 
              key={fixture.id}
              fixture={fixture}
              onSave={(data) => updateFixtureMutation.mutate({ fixtureId: fixture.id, data })}
            >
              <div className="w-full">
                <FixtureCard
                  fixture={fixture}
                  onViewDetails={handleViewDetails}
                  onEdit={() => {}} // Edit is handled by the dialog wrapper
                  onDelete={handleDeleteFixture}
                />
              </div>
            </FixtureEditDialog>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No fixtures found matching your criteria</p>
          </div>
        )}
      </div>

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
    </MainLayout>
  );
}
