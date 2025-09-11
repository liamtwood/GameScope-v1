import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Clock, MapPin, Trophy, Edit, Trash2, Star } from "lucide-react";
import { Fixture, OppositionTeam, PlayerWithTeamData, MatchStats, Team, Club } from "@shared/schema";
import { format } from "date-fns";
import { FixtureEditDialog } from "@/components/dialogs/fixture-edit-dialog";
import { VideoManager } from "@/components/video-manager";
import { ExcelUpload } from "@/components/excel-upload";
import { SpiderChart } from "@/components/spider-chart";
import { MetricsComparison } from "@/components/metrics-comparison";
import { VideoAnalysisDashboard } from "@/components/video-analysis-dashboard";
import { MatchScoreBanner } from "@/components/match-score-banner";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function FixtureDetails() {
  const [, params] = useRoute("/fixtures/:id");
  const fixtureId = params?.id;
  const [activeTab, setActiveTab] = useState("details");

  // Spider Chart Data Transformation Functions
  const createAttackSpiderData = (teamStats: MatchStats, opponentStats?: MatchStats) => [
    { metric: 'Goals', team: teamStats.goals || 0, opponent: opponentStats?.goals || 0, fullMark: Math.max(10, (teamStats.goals || 0) * 2, (opponentStats?.goals || 0) * 2) },
    { metric: 'Shots Attempted', team: teamStats.shotsAttempted || 0, opponent: opponentStats?.shotsAttempted || 0, fullMark: Math.max(40, teamStats.shotsAttempted || 0, opponentStats?.shotsAttempted || 0) },
    { metric: 'Shots On Target', team: teamStats.shotsOnTarget || 0, opponent: opponentStats?.shotsOnTarget || 0, fullMark: Math.max(20, teamStats.shotsOnTarget || 0, opponentStats?.shotsOnTarget || 0) },
    { metric: 'Runs Into Boxes', team: teamStats.runsIntoBoxes || 0, opponent: opponentStats?.runsIntoBoxes || 0, fullMark: Math.max(70, teamStats.runsIntoBoxes || 0, opponentStats?.runsIntoBoxes || 0) },
    { metric: 'Corners', team: teamStats.corners || 0, opponent: opponentStats?.corners || 0, fullMark: Math.max(15, teamStats.corners || 0, opponentStats?.corners || 0) },
    { metric: 'Dangerous Crosses', team: teamStats.dangerousCrosses || 0, opponent: opponentStats?.dangerousCrosses || 0, fullMark: Math.max(20, teamStats.dangerousCrosses || 0, opponentStats?.dangerousCrosses || 0) }
  ];

  const createPossessionSpiderData = (teamStats: MatchStats, opponentStats?: MatchStats) => [
    { metric: 'Possession %', team: teamStats.possession || 0, opponent: opponentStats?.possession || 0, fullMark: 100 },
    { metric: 'Pass Accuracy %', team: teamStats.passingSuccessRate || 0, opponent: opponentStats?.passingSuccessRate || 0, fullMark: 100 },
    { metric: 'First Touch %', team: teamStats.firstTouchSuccessRate || 0, opponent: opponentStats?.firstTouchSuccessRate || 0, fullMark: 100 },
    { metric: 'Take Ons', team: teamStats.takeOns || 0, opponent: opponentStats?.takeOns || 0, fullMark: Math.max(30, teamStats.takeOns || 0, opponentStats?.takeOns || 0) },
    { metric: 'Free Kicks', team: teamStats.freeKicks || 0, opponent: opponentStats?.freeKicks || 0, fullMark: Math.max(20, teamStats.freeKicks || 0, opponentStats?.freeKicks || 0) },
    { metric: 'Passes Success', team: teamStats.passesSuccess || 0, opponent: opponentStats?.passesSuccess || 0, fullMark: Math.max(200, teamStats.passesSuccess || 0, opponentStats?.passesSuccess || 0) }
  ];

  const createDefensiveSpiderData = (teamStats: MatchStats, opponentStats?: MatchStats) => [
    { metric: 'Tackles', team: teamStats.tackles || 0, opponent: opponentStats?.tackles || 0, fullMark: Math.max(40, teamStats.tackles || 0, opponentStats?.tackles || 0) },
    { metric: 'Free Kicks', team: teamStats.freeKicks || 0, opponent: opponentStats?.freeKicks || 0, fullMark: Math.max(20, teamStats.freeKicks || 0, opponentStats?.freeKicks || 0) },
    { metric: 'Offsides', team: teamStats.offsides || 0, opponent: opponentStats?.offsides || 0, fullMark: Math.max(10, teamStats.offsides || 0, opponentStats?.offsides || 0) },
    { metric: 'Pass Distance', team: teamStats.passingTotalDistance || 0, opponent: opponentStats?.passingTotalDistance || 0, fullMark: Math.max(5000, teamStats.passingTotalDistance || 0, opponentStats?.passingTotalDistance || 0) },
    { metric: 'R.Foot Pass %', team: teamStats.rightFootPassSuccessRate || 0, opponent: opponentStats?.rightFootPassSuccessRate || 0, fullMark: 100 },
    { metric: 'L.Foot Pass %', team: teamStats.leftFootPassSuccessRate || 0, opponent: opponentStats?.leftFootPassSuccessRate || 0, fullMark: 100 }
  ];

  // Check for tab parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'analysis') {
      setActiveTab('analysis');
    }
  }, []);

  const { toast } = useToast();

  const { data: fixture, isLoading: fixtureLoading } = useQuery<Fixture>({
    queryKey: ["/api/fixture", fixtureId],
    enabled: !!fixtureId,
  });

  const { data: teamPlayersData } = useQuery<any[]>({
    queryKey: ["/api/team", fixture?.teamId, "users", "lineup-v2"],
    enabled: !!fixture?.teamId,
    staleTime: 0,
    gcTime: 0,
  });

  // Convert team players to the format expected by the lineup
  const players = teamPlayersData?.map((tp: any) => ({
    ...tp.user,
    id: tp.user.id,
    jerseyNumber: tp.jerseyNumber,
    position: tp.position,
    starPlayer: tp.starPlayer,
    fitnessStatus: tp.fitnessStatus
  })) || [];

  const { data: oppositionTeams } = useQuery<OppositionTeam[]>({
    queryKey: ["/api/opposition-teams"],
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: clubs } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
  });

  const { data: matchStats } = useQuery<MatchStats[]>({
    queryKey: ["/api/match-stats", fixtureId],
    enabled: !!fixtureId,
  });

  const deleteFixtureMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/fixtures/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Fixture deleted",
        description: "The fixture has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures"] });
      window.history.back();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete fixture. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (fixtureLoading) {
    return (
      <MainLayout title="Loading..." subtitle="Loading fixture details...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading fixture details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!fixture) {
    return (
      <MainLayout title="Fixture Not Found" subtitle="The requested fixture could not be found">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">The fixture you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Process match stats - get full game stats
  const fullGameStats = matchStats?.find(stat => stat.period === 'FULL_GAME' && stat.isTeamStats === true);
  const opponentFullGameStats = matchStats?.find(stat => stat.period === 'FULL_GAME' && (stat.isTeamStats === false || stat.isTeamStats === null));

  // Find the opposition team details
  const oppositionTeam = oppositionTeams?.find(team => 
    fixture.oppositionTeamId ? team.id === fixture.oppositionTeamId : team.name === fixture.opponent
  );

  // Find the current team and club details
  const currentTeam = teams?.find(team => team.id === fixture.teamId);
  const currentClub = clubs?.find(club => club.id === currentTeam?.clubId);

  // Extract club colors and logo for the results banner
  const clubColors = (currentClub?.colors as any) || {};
  const polkStateColor = clubColors.primary || '#CC4125';
  const primaryColor = clubColors.primary || '#CC4125';
  const teamLogoPath = currentClub?.logoPath;
  
  // Get opposition team colors and logo
  const oppositionColor = (oppositionTeam?.colors as any)?.primary || '#6b7280';
  const opponentLogoPath = oppositionTeam?.logoPath;

  const isHomeMatch = fixture.type === 'HOME';
  const homeTeam = isHomeMatch ? 'Polk State College' : fixture.opponent;
  const awayTeam = isHomeMatch ? fixture.opponent : 'Polk State College';

  const handleDeleteFixture = () => {
    if (fixture) {
      deleteFixtureMutation.mutate(fixture.id);
    }
  };

  // Helper function to get star players only, sorted by jersey number
  const getSortedLineup = (playersData: any[]) => {
    if (!playersData || playersData.length === 0) {
      console.log('LINEUP DEBUG: No players data available');
      return [];
    }
    
    console.log('LINEUP DEBUG: Original players data:', playersData.length, 'players');
    console.log('LINEUP DEBUG: First player sample:', playersData[0]);
    
    const starPlayers = playersData.filter(player => {
      const isStarPlayer = player.starPlayer === true;
      const hasJerseyNumber = player.jerseyNumber !== null && player.jerseyNumber !== undefined;
      console.log(`LINEUP DEBUG: ${player.firstName} ${player.lastName} - starPlayer: ${player.starPlayer}, jerseyNumber: ${player.jerseyNumber}, include: ${isStarPlayer && hasJerseyNumber}`);
      return isStarPlayer && hasJerseyNumber;
    });
    
    console.log('LINEUP DEBUG: Filtered star players:', starPlayers.length, 'players');
    
    return starPlayers.sort((a, b) => {
      const aNumber = a.jerseyNumber || 999;
      const bNumber = b.jerseyNumber || 999;
      return aNumber - bNumber;
    });
  };

  return (
    <MainLayout 
      title={`${fixture.opponent}`}
      subtitle={format(new Date(fixture.date), "d MMM yyyy")}
    >
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 border-0 shadow-none bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Fixtures</span>
          </Button>
          
          <div className="flex items-center space-x-2">
            <FixtureEditDialog 
              fixture={fixture}
              onSave={async (data) => {
                await apiRequest("PUT", `/api/fixtures/${fixture.id}`, data);
                queryClient.invalidateQueries({ queryKey: ["/api/fixture", fixtureId] });
                queryClient.invalidateQueries({ queryKey: ["/api/fixtures"] });
              }}
            >
              <Button variant="outline" size="sm" data-testid="button-edit-fixture-header">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </FixtureEditDialog>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteFixture}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              data-testid="button-delete-fixture"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        {/* Results Banner - only show for completed matches */}
        {fixture.status === 'COMPLETED' && (
          <MatchScoreBanner 
            fixture={fixture}
            teamLogoPath={teamLogoPath}
            opponentLogoPath={opponentLogoPath}
            polkStateColor={polkStateColor}
            oppositionColor={oppositionColor}
            primaryColor={primaryColor}
          />
        )}

        {/* Tabs Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details" data-testid="tab-fixture-details">Fixture Details</TabsTrigger>
            <TabsTrigger value="videos" data-testid="tab-videos">Upload Video</TabsTrigger>
            <TabsTrigger value="home-lineup" data-testid="tab-home-lineup">Home Lineup</TabsTrigger>
            <TabsTrigger value="away-lineup" data-testid="tab-away-lineup">Away Lineup</TabsTrigger>
            <TabsTrigger value="analysis" data-testid="tab-analysis">GameScope Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Fixture Details</h3>
                  <FixtureEditDialog 
                    fixture={fixture}
                    onSave={async (data) => {
                      await apiRequest("PUT", `/api/fixtures/${fixture.id}`, data);
                      queryClient.invalidateQueries({ queryKey: ["/api/fixture", fixtureId] });
                      queryClient.invalidateQueries({ queryKey: ["/api/fixtures"] });
                    }}
                  >
                    <Button variant="outline" size="sm" data-testid="button-edit-fixture">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </FixtureEditDialog>
                </div>
                
                <div className="space-y-4">
                  {/* Row 1 - Competition, Match Type, Opposition */}
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Competition</label>
                      <p className="text-lg mt-1">{fixture.competition}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Match Type</label>
                      <p className="text-lg mt-1">{fixture.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Opposition</label>
                      <p className="text-lg mt-1">{fixture.opponent}</p>
                    </div>
                  </div>

                  {/* Row 2 - Date, Time, Status */}
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date</label>
                      <p className="text-base mt-1">{format(new Date(fixture.date), "d MMM yyyy")}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Time</label>
                      <p className="text-base mt-1">{format(new Date(fixture.date), "h:mm a")}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <p className="text-base capitalize mt-1">
                        <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${
                          fixture.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          fixture.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          fixture.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {fixture.status.toLowerCase()}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Additional Information */}
                  {fixture.notes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Notes</label>
                      <p className="text-base mt-1">{fixture.notes}</p>
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-6">Video Management</h3>
                <VideoManager 
                  fixtureId={fixtureId || ""} 
                  videoLinks={Array.isArray(fixture.videoLinks) ? fixture.videoLinks : []} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="home-lineup" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Home Team - Polk State College</span>
                </h3>
                {isHomeMatch && players && players.length > 0 ? (
                  <div className="space-y-2">
                    {getSortedLineup(players).map((player, index) => (
                      <div key={player.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/30 border border-transparent hover:border-muted">
                        <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                          {player.jerseyNumber}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-foreground">{player.firstName} {player.lastName}</p>
                            {player.starPlayer && (
                              <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{player.position}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Home team lineup not available</p>
                    <p className="text-sm text-muted-foreground mt-2">Players will appear here when lineup is set</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="away-lineup" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Away Team - {awayTeam}</span>
                </h3>
                {!isHomeMatch && players && players.length > 0 ? (
                  <div className="space-y-2">
                    {getSortedLineup(players).map((player, index) => (
                      <div key={player.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/30 border border-transparent hover:border-muted">
                        <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                          {player.jerseyNumber}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-foreground">{player.firstName} {player.lastName}</p>
                            {player.starPlayer && (
                              <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{player.position}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Away team lineup not available</p>
                    <p className="text-sm text-muted-foreground mt-2">Players will appear here when lineup is set</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="mt-6">
            <div className="space-y-6">
              
              {/* Comprehensive Analysis Tabs */}
              <Tabs defaultValue="fixture-details" className="w-full">
                <div className="flex justify-center mb-6">
                  <TabsList className="grid w-[900px] grid-cols-8 gap-0">
                    <TabsTrigger value="fixture-details" className="min-w-[100px] px-4 py-3 text-center">Fixture Details</TabsTrigger>
                    <TabsTrigger value="statistics" className="min-w-[100px] px-4 py-3 text-center">Statistics</TabsTrigger>
                    <TabsTrigger value="spider" className="min-w-[100px] px-4 py-3 text-center">Spider Charts</TabsTrigger>
                    <TabsTrigger value="heatmaps" className="min-w-[100px] px-4 py-3 text-center">Heat Maps</TabsTrigger>
                    <TabsTrigger value="positions" className="min-w-[100px] px-4 py-3 text-center">Position Maps</TabsTrigger>
                    <TabsTrigger value="ai" className="min-w-[100px] px-4 py-3 text-center">AI Analysis</TabsTrigger>
                    <TabsTrigger value="videos" className="min-w-[100px] px-4 py-3 text-center">Videos</TabsTrigger>
                    <TabsTrigger value="upload" data-testid="tab-upload" className="min-w-[100px] px-4 py-3 text-center">Upload Data</TabsTrigger>
                  </TabsList>
                </div>

                {/* Fixed container to prevent horizontal and vertical layout shifts */}
                <div className="min-h-[600px] w-full overflow-x-hidden">

                {/* Fixture Details Tab */}
                <TabsContent value="fixture-details">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">Fixture Details</h3>
                        <FixtureEditDialog 
                          fixture={fixture}
                          onSave={async (data) => {
                            await apiRequest("PUT", `/api/fixtures/${fixture.id}`, data);
                            queryClient.invalidateQueries({ queryKey: ["/api/fixture", fixtureId] });
                            queryClient.invalidateQueries({ queryKey: ["/api/fixtures"] });
                          }}
                        >
                          <Button variant="outline" size="sm" data-testid="button-edit-fixture-analysis">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </FixtureEditDialog>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Row 1 - Competition, Match Type, Opposition */}
                        <div className="grid grid-cols-3 gap-6">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Competition</label>
                            <div className="flex items-center gap-2 mt-1">
                              <Trophy className="h-4 w-4 text-muted-foreground" />
                              <p className="text-lg">{fixture.competition}</p>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Match Type</label>
                            <div className="flex items-center gap-2 mt-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <p className="text-lg">{fixture.type}</p>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Opposition</label>
                            <p className="text-lg mt-1">{fixture.opponent}</p>
                          </div>
                        </div>

                        {/* Row 2 - Date, Time, Status */}
                        <div className="grid grid-cols-3 gap-6">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Date</label>
                            <p className="text-base mt-1">{format(new Date(fixture.date), "d MMM yyyy")}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Time</label>
                            <p className="text-base mt-1">{format(new Date(fixture.date), "h:mm a")}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <p className="text-base capitalize mt-1">
                              <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${
                                fixture.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                fixture.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                fixture.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                              }`}>
                                {fixture.status.toLowerCase()}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Additional Information */}
                        {fixture.notes && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Notes</label>
                            <p className="text-base mt-1">{fixture.notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Statistics Tab */}
                <TabsContent value="statistics">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Match Statistics</h3>
                      {fullGameStats ? (
                        <MetricsComparison
                          teamStats={fullGameStats}
                          opponentStats={opponentFullGameStats}
                        />
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-4">No match statistics available</p>
                          <p className="text-sm text-muted-foreground">Statistics will be displayed after the match is completed and data is uploaded.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Spider Charts Tab */}
                <TabsContent value="spider">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Spider Charts</h3>
                      {fullGameStats ? (
                        <Tabs defaultValue="attack" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="attack">Attack</TabsTrigger>
                            <TabsTrigger value="possession">Possession</TabsTrigger>
                            <TabsTrigger value="technical">Technical</TabsTrigger>
                          </TabsList>

                          <TabsContent value="attack" className="mt-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <Card className="p-6">
                                <SpiderChart
                                  data={createAttackSpiderData(fullGameStats, opponentFullGameStats)}
                                  teamName="POLK"
                                  opponentName={fixture.opponent.slice(0, 8)}
                                  title="Attack Performance"
                                  teamColor="#dc2626"
                                  opponentColor="#64748b"
                                />
                              </Card>
                            </div>
                          </TabsContent>

                          <TabsContent value="possession" className="mt-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <Card className="p-6">
                                <SpiderChart
                                  data={createPossessionSpiderData(fullGameStats, opponentFullGameStats)}
                                  teamName="POLK"
                                  opponentName={fixture.opponent.slice(0, 8)}
                                  title="Possession & Passing"
                                  teamColor="#dc2626"
                                  opponentColor="#64748b"
                                />
                              </Card>
                            </div>
                          </TabsContent>

                          <TabsContent value="technical" className="mt-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <Card className="p-6">
                                <SpiderChart
                                  data={createDefensiveSpiderData(fullGameStats, opponentFullGameStats)}
                                  teamName="POLK"
                                  opponentName={fixture.opponent.slice(0, 8)}
                                  title="Technical Performance"
                                  teamColor="#dc2626"
                                  opponentColor="#64748b"
                                />
                              </Card>
                            </div>
                          </TabsContent>
                        </Tabs>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">No data available for spider charts</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Heat Maps Tab */}
                <TabsContent value="heatmaps">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-12">
                        <h3 className="text-lg font-semibold mb-2">Heat Maps</h3>
                        <p className="text-muted-foreground">Coming soon - visualize player positioning and movement patterns</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Position Maps Tab */}
                <TabsContent value="positions">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-12">
                        <h3 className="text-lg font-semibold mb-2">Position Maps</h3>
                        <p className="text-muted-foreground">Coming soon - analyze player positioning and formation effectiveness</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Video Analysis Dashboard Tab */}
                <TabsContent value="analysis">
                  <VideoAnalysisDashboard fixtureId={fixtureId || ""} />
                </TabsContent>

                {/* Videos Tab */}
                <TabsContent value="videos">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">In Progress</h3>
                      <VideoManager 
                        fixtureId={fixtureId || ""} 
                        videoLinks={Array.isArray(fixture.videoLinks) ? fixture.videoLinks : []} 
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Upload Data Tab */}
                <TabsContent value="upload">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Upload Match Data</h3>
                      <ExcelUpload fixtureId={fixtureId || ""} />
                    </CardContent>
                  </Card>
                </TabsContent>
                </div>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
    </MainLayout>
  );
}