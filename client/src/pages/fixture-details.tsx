import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Clock, MapPin, Trophy, Edit } from "lucide-react";
import { Fixture, OppositionTeam, Player, MatchStats } from "@shared/schema";
import { format } from "date-fns";
import { FixtureEditDialog } from "@/components/dialogs/fixture-edit-dialog";
import { VideoManager } from "@/components/video-manager";
import { ExcelUpload } from "@/components/excel-upload";
import { SpiderChart } from "@/components/spider-chart";
import { PossessionChart } from "@/components/possession-chart";
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
    if (tabParam && ['details', 'videos', 'lineups', 'analysis'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  const { data: fixture, isLoading } = useQuery<Fixture>({
    queryKey: [`/api/fixture/${fixtureId}`],
    enabled: !!fixtureId,
  });

  const { data: oppositionTeams } = useQuery<OppositionTeam[]>({
    queryKey: ["/api/opposition-teams"],
  });

  const { data: players } = useQuery<Player[]>({
    queryKey: ["/api/players", fixture?.teamId],
    enabled: !!fixture?.teamId,
  });

  const { data: matchStats } = useQuery<MatchStats[]>({
    queryKey: ["/api/match-stats", fixtureId],
    enabled: !!fixtureId,
  });

  const { toast } = useToast();

  // Mutation for updating fixture
  const updateFixtureMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/fixtures/${fixtureId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/fixture/${fixtureId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures", fixture?.teamId] });
      toast({
        title: "Fixture Updated",
        description: "Fixture details have been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to update fixture:", error);
      toast({
        title: "Error",
        description: "Failed to update fixture. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFixtureSave = (data: any) => {
    updateFixtureMutation.mutate(data);
  };

  if (isLoading || !fixture) {
    return (
      <MainLayout title="Fixture Details" subtitle="Loading fixture information...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading fixture details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const oppositionTeam = oppositionTeams?.find(team => 
    team.id === fixture.oppositionTeamId || team.name === fixture.opponent
  );
  const isHomeMatch = fixture.type === "HOME";
  
  const homeTeam = isHomeMatch ? "Polk State Women's Soccer" : (oppositionTeam?.name || fixture.opponent);
  const awayTeam = isHomeMatch ? (oppositionTeam?.name || fixture.opponent) : "Polk State Women's Soccer";
  
  // Use the same Polk State logo as in header, and opposition team logos from database
  const polkStateLogo = "/assets/logos/polk-state-logo.jpg";
  const homeTeamLogo = isHomeMatch ? polkStateLogo : (oppositionTeam?.logoPath || null);
  const awayTeamLogo = isHomeMatch ? (oppositionTeam?.logoPath || null) : polkStateLogo;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "text-green-600";
      case "CANCELLED": return "text-red-600";
      case "NO_CONTEST": return "text-orange-600";
      default: return "text-blue-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED": return "Completed";
      case "CANCELLED": return "Cancelled";
      case "NO_CONTEST": return "No Contest";
      default: return "Scheduled";
    }
  };

  // Helper functions for match statistics
  const getTeamStats = (period: string) => {
    return matchStats?.find(stat => stat.period === period && stat.isTeamStats === true);
  };

  const getOpponentStats = (period: string) => {
    return matchStats?.find(stat => stat.period === period && stat.isTeamStats === false);
  };

  const fullGameStats = getTeamStats('FULL_GAME');
  const firstHalfStats = getTeamStats('FIRST_HALF');
  const secondHalfStats = getTeamStats('SECOND_HALF');

  return (
    <MainLayout title="Fixture Details" subtitle={`${fixture.opponent} - ${format(new Date(fixture.date), "MMM d, yyyy")}`}>
      <div className="space-y-6">
        {/* Header Buttons */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Fixtures
          </Button>
        </div>

        {/* Header with Teams */}
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Teams Layout */}
              <div className="flex items-center justify-center space-x-8 md:space-x-16">
                {/* Home Team */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                    {homeTeamLogo ? (
                      <img 
                        src={homeTeamLogo} 
                        alt={homeTeam}
                        className="w-16 h-16 md:w-20 md:h-20 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          // If the logo fails to load, show initials instead
                          const container = target.parentElement;
                          if (container) {
                            container.innerHTML = `<div class="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">${homeTeam.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()}</div>`;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                        {homeTeam.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg text-foreground">{homeTeam}</h3>
                    <p className="text-sm text-muted-foreground">Home</p>
                  </div>
                </div>

                {/* VS and Score */}
                <div className="flex flex-col items-center space-y-2">
                  {fixture.status === "COMPLETED" && fixture.homeScore !== null && fixture.awayScore !== null ? (
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl font-bold text-foreground">
                        {fixture.homeScore} - {fixture.awayScore}
                      </div>
                      <p className="text-sm text-green-600 font-medium">Final Score</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-muted-foreground">VS</div>
                      <p className={`text-sm font-medium ${getStatusColor(fixture.status)}`}>
                        {getStatusText(fixture.status)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                    {awayTeamLogo ? (
                      <img 
                        src={awayTeamLogo} 
                        alt={awayTeam}
                        className="w-16 h-16 md:w-20 md:h-20 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          // If the logo fails to load, show initials instead
                          const container = target.parentElement;
                          if (container) {
                            container.innerHTML = `<div class="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">${awayTeam.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()}</div>`;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                        {awayTeam.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg text-foreground">{awayTeam}</h3>
                    <p className="text-sm text-muted-foreground">Away</p>
                  </div>
                </div>
              </div>

              {/* Match Info */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(fixture.date), "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{format(new Date(fixture.date), "h:mm a")}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{fixture.venue}</span>
                </div>
                {fixture.competition && (
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4" />
                    <span>{fixture.competition}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
            <TabsTrigger value="videos" data-testid="tab-videos">Upload Video</TabsTrigger>
            <TabsTrigger value="lineups" data-testid="tab-lineups">Lineups</TabsTrigger>
            <TabsTrigger value="analysis" data-testid="tab-analysis">GameScope Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Match Details</h3>
                  <FixtureEditDialog 
                    fixture={fixture}
                    onSave={handleFixtureSave}
                  >
                    <Button 
                      variant="default" 
                      data-testid="button-edit-fixture"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Fixture
                    </Button>
                  </FixtureEditDialog>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-base text-foreground border-b pb-2">Basic Information</h4>
                    <div>
                      <h5 className="font-medium text-sm text-muted-foreground mb-1">Opponent</h5>
                      <p className="text-foreground">{fixture.opponent}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm text-muted-foreground mb-1">Venue</h5>
                      <p className="text-foreground">{fixture.venue}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm text-muted-foreground mb-1">Competition</h5>
                      <p className="text-foreground">{fixture.competition || "Regular Season"}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm text-muted-foreground mb-1">Match Type</h5>
                      <p className="text-foreground">{fixture.type === "HOME" ? "Home" : fixture.type === "AWAY" ? "Away" : "Neutral"}</p>
                    </div>
                  </div>

                  {/* Status and Scores */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-base text-foreground border-b pb-2">Status & Results</h4>
                    <div>
                      <h5 className="font-medium text-sm text-muted-foreground mb-1">Status</h5>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        fixture.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                        fixture.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                        fixture.status === "NO_CONTEST" ? "bg-orange-100 text-orange-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {getStatusText(fixture.status)}
                      </span>
                    </div>
                    {(fixture.status === "COMPLETED" || fixture.status === "NO_CONTEST") && (
                      <>
                        <div>
                          <h5 className="font-medium text-sm text-muted-foreground mb-1">Home Score</h5>
                          <p className="text-foreground text-xl font-bold">{fixture.homeScore ?? 'N/A'}</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-sm text-muted-foreground mb-1">Away Score</h5>
                          <p className="text-foreground text-xl font-bold">{fixture.awayScore ?? 'N/A'}</p>
                        </div>
                      </>
                    )}
                    {fixture.hasVideo && (
                      <div>
                        <h5 className="font-medium text-sm text-muted-foreground mb-1">Video Available</h5>
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          Yes
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-base text-foreground border-b pb-2">Additional Information</h4>
                    <div>
                      <h5 className="font-medium text-sm text-muted-foreground mb-1">Created</h5>
                      <p className="text-foreground text-sm">{fixture.createdAt ? format(new Date(fixture.createdAt), "MMM d, yyyy") : 'N/A'}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm text-muted-foreground mb-1">Last Updated</h5>
                      <p className="text-foreground text-sm">{fixture.updatedAt ? format(new Date(fixture.updatedAt), "MMM d, yyyy") : 'N/A'}</p>
                    </div>
                    {fixture.notes && (
                      <div>
                        <h5 className="font-medium text-sm text-muted-foreground mb-1">Notes</h5>
                        <p className="text-foreground bg-muted/30 p-3 rounded-lg text-sm">{fixture.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <VideoManager 
                  fixtureId={fixture.id}
                  videoLinks={(fixture.videoLinks as any[]) || []}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lineups" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Team Lineups</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Home Team Lineup */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center space-x-2">
                      {homeTeamLogo ? (
                        <img 
                          src={homeTeamLogo} 
                          alt={homeTeam}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/default-team-logo.png";
                          }}
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-600">
                          {homeTeam.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span>{homeTeam}</span>
                    </h4>
                    {isHomeMatch && players ? (
                      <div className="space-y-2">
                        {players.slice(0, 11).map((player, index) => (
                          <div key={player.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/30">
                            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                              {player.jerseyNumber}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{player.name}</p>
                              <p className="text-xs text-muted-foreground">{player.position}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Lineup not available</p>
                    )}
                  </div>

                  {/* Away Team Lineup */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center space-x-2">
                      {awayTeamLogo ? (
                        <img 
                          src={awayTeamLogo} 
                          alt={awayTeam}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/default-team-logo.png";
                          }}
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-600">
                          {awayTeam.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span>{awayTeam}</span>
                    </h4>
                    {!isHomeMatch && players ? (
                      <div className="space-y-2">
                        {players.slice(0, 11).map((player, index) => (
                          <div key={player.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/30">
                            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                              {player.jerseyNumber}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{player.name}</p>
                              <p className="text-xs text-muted-foreground">{player.position}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Lineup not available</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="mt-6">
            <div className="space-y-6">
              {/* Analysis Sub-tabs */}
              <Tabs defaultValue="results" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="results" data-testid="subtab-results">Analysis Results</TabsTrigger>
                  <TabsTrigger value="upload" data-testid="subtab-upload">Upload Data</TabsTrigger>
                </TabsList>

                <TabsContent value="results" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-6">GameScope Analysis</h3>
                  {fullGameStats ? (
                <div className="space-y-6">
                  {/* Analysis Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-2">
                        {fullGameStats.possession || 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">Possession</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {fullGameStats.shotsOnTarget || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Shots on Target</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 mb-2">
                        {fullGameStats.passingSuccessRate || 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">Pass Accuracy</div>
                    </div>
                  </div>

                  {/* Possession Chart */}
                  <Card className="p-6">
                    <PossessionChart
                      teamName="POLK"
                      opponentName={oppositionTeam?.name || fixture.opponent}
                      teamPossession={fullGameStats.possession || 0}
                      opponentPossession={opponentFullGameStats?.possession || (100 - (fullGameStats.possession || 0))}
                    />
                  </Card>

                  {/* AI-Powered Insights */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
                    <h4 className="font-semibold text-foreground mb-4 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      AI-Powered Match Insights
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-3">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-muted-foreground">Strong defensive performance in the first half, intercepting 8 out of 12 opponent attacks in the midfield.</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-muted-foreground">Excellent ball retention through the wings, with 89% success rate on cross attempts.</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-muted-foreground">Opportunity for improvement: Converting corner kicks into scoring chances (2 out of 8 corners resulted in shots).</p>
                      </div>
                    </div>
                  </div>

                  {/* Key Player Performance */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-4">Top Performers</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg bg-yellow-50">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-yellow-100 text-yellow-700 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-lg">
                            10
                          </div>
                          <p className="font-medium text-foreground">Sarah Johnson</p>
                          <p className="text-xs text-muted-foreground mb-2">Midfielder</p>
                          <div className="text-sm text-yellow-700 font-medium">Player of the Match</div>
                          <div className="text-xs text-muted-foreground">2 Goals, 1 Assist</div>
                        </div>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gray-100 text-gray-700 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-lg">
                            3
                          </div>
                          <p className="font-medium text-foreground">Emma Rodriguez</p>
                          <p className="text-xs text-muted-foreground mb-2">Defender</p>
                          <div className="text-sm text-muted-foreground font-medium">Best Defender</div>
                          <div className="text-xs text-muted-foreground">5 Tackles, 8 Clearances</div>
                        </div>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gray-100 text-gray-700 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-lg">
                            1
                          </div>
                          <p className="font-medium text-foreground">Alex Mitchell</p>
                          <p className="text-xs text-muted-foreground mb-2">Goalkeeper</p>
                          <div className="text-sm text-muted-foreground font-medium">Clean Sheet</div>
                          <div className="text-xs text-muted-foreground">6 Saves, 0 Goals Conceded</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Analysis Tabs */}
                  <Tabs defaultValue="attack" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="attack" data-testid="tab-attack">Attack</TabsTrigger>
                      <TabsTrigger value="possession" data-testid="tab-possession">Possession</TabsTrigger>
                      <TabsTrigger value="technical" data-testid="tab-technical">Technical</TabsTrigger>
                    </TabsList>

                    <TabsContent value="attack" className="mt-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                          <SpiderChart
                            data={createAttackSpiderData(fullGameStats)}
                            teamName="POLK"
                            opponentName="OPP"
                            title="Attack Performance"
                            teamColor="#dc2626"
                            opponentColor="#64748b"
                          />
                        </Card>
                        <Card className="p-6">
                          <h4 className="font-semibold text-foreground mb-4">Attack Metrics</h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-4 text-sm font-medium border-b pb-2">
                              <span className="text-muted-foreground">Metric</span>
                              <span className="text-red-600 text-center">POLK</span>
                              <span className="text-gray-600 text-center">OPP</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-sm text-muted-foreground">Goals</span>
                              <span className="font-medium text-center">{fullGameStats.goals || 0}</span>
                              <span className="font-medium text-center text-gray-600">0</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-sm text-muted-foreground">Shots Attempted</span>
                              <span className="font-medium text-center">{fullGameStats.shotsAttempted || 0}</span>
                              <span className="font-medium text-center text-gray-600">0</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-sm text-muted-foreground">Shots on Target</span>
                              <span className="font-medium text-center">{fullGameStats.shotsOnTarget || 0}</span>
                              <span className="font-medium text-center text-gray-600">0</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-sm text-muted-foreground">Runs Into Boxes</span>
                              <span className="font-medium text-center">{fullGameStats.runsIntoBoxes || 0}</span>
                              <span className="font-medium text-center text-gray-600">0</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-sm text-muted-foreground">Corner Kicks</span>
                              <span className="font-medium text-center">{fullGameStats.corners || 0}</span>
                              <span className="font-medium text-center text-gray-600">0</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-sm text-muted-foreground">Dangerous Crosses</span>
                              <span className="font-medium text-center">{fullGameStats.dangerousCrosses || 0}</span>
                              <span className="font-medium text-center text-gray-600">0</span>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="possession" className="mt-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                          <SpiderChart
                            data={createPossessionSpiderData(fullGameStats)}
                            teamName="POLK"
                            opponentName="OPP"
                            title="Possession & Passing"
                            teamColor="#dc2626"
                            opponentColor="#64748b"
                          />
                        </Card>
                        <Card className="p-6">
                          <h4 className="font-semibold text-foreground mb-4">Possession Metrics</h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-4 text-sm font-medium border-b pb-2">
                              <span className="text-muted-foreground">Metric</span>
                              <span className="text-red-600 text-center">POLK</span>
                              <span className="text-gray-600 text-center">OPP</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-sm text-muted-foreground">Possession %</span>
                              <span className="font-medium text-center">{fullGameStats.possession || 0}%</span>
                              <span className="font-medium text-center text-gray-600">0%</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-sm text-muted-foreground">Pass Accuracy %</span>
                              <span className="font-medium text-center">{fullGameStats.passingSuccessRate || 0}%</span>
                              <span className="font-medium text-center text-gray-600">0%</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-sm text-muted-foreground">First Touch %</span>
                              <span className="font-medium text-center">{fullGameStats.firstTouchSuccessRate || 0}%</span>
                              <span className="font-medium text-center text-gray-600">0%</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-sm text-muted-foreground">Take Ons</span>
                              <span className="font-medium text-center">{fullGameStats.takeOns || 0}</span>
                              <span className="font-medium text-center text-gray-600">0</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-sm text-muted-foreground">Free Kicks</span>
                              <span className="font-medium text-center">{fullGameStats.freeKicks || 0}</span>
                              <span className="font-medium text-center text-gray-600">0</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-sm text-muted-foreground">Passes Success</span>
                              <span className="font-medium text-center">{fullGameStats.passesSuccess || 0}</span>
                              <span className="font-medium text-center text-gray-600">0</span>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="technical" className="mt-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                          <SpiderChart
                            data={createDefensiveSpiderData(fullGameStats)}
                            teamName="POLK"
                            opponentName="OPP"
                            title="Technical Performance"
                            teamColor="#dc2626"
                            opponentColor="#64748b"
                          />
                        </Card>
                        <Card className="p-6">
                          <h4 className="font-semibold text-foreground mb-4">Technical Metrics</h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-4 text-sm font-medium border-b pb-2">
                              <span className="text-muted-foreground">Metric</span>
                              <span className="text-red-600 text-center">POLK</span>
                              <span className="text-gray-600 text-center">OPP</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-sm text-muted-foreground">Tackles</span>
                              <span className="font-medium text-center">{fullGameStats.tackles || 0}</span>
                              <span className="font-medium text-center text-gray-600">0</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-sm text-muted-foreground">Free Kicks</span>
                              <span className="font-medium text-center">{fullGameStats.freeKicks || 0}</span>
                              <span className="font-medium text-center text-gray-600">0</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-sm text-muted-foreground">Offsides</span>
                              <span className="font-medium text-center">{fullGameStats.offsides || 0}</span>
                              <span className="font-medium text-center text-gray-600">0</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-sm text-muted-foreground">Pass Distance (m)</span>
                              <span className="font-medium text-center">{fullGameStats.passingTotalDistance || 0}</span>
                              <span className="font-medium text-center text-gray-600">0</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-sm text-muted-foreground">R.Foot Pass %</span>
                              <span className="font-medium text-center">{fullGameStats.rightFootPassSuccessRate || 0}%</span>
                              <span className="font-medium text-center text-gray-600">0%</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <span className="text-sm text-muted-foreground">L.Foot Pass %</span>
                              <span className="font-medium text-center">{fullGameStats.leftFootPassSuccessRate || 0}%</span>
                              <span className="font-medium text-center text-gray-600">0%</span>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>


                  {/* Video Analysis */}
                  {fixture.hasVideo && (
                    <div className="bg-muted/30 p-6 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-4">Video Analysis Available</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Detailed video breakdown with tactical insights, player movements, and key moments analysis.
                      </p>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        View Video Analysis
                      </Button>
                    </div>
                  )}

                  {!fixture.hasVideo && (
                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                      <h4 className="font-semibold text-muted-foreground mb-2">Video Analysis Pending</h4>
                      <p className="text-sm text-muted-foreground">
                        Upload match video to unlock AI-powered tactical analysis and detailed performance insights.
                      </p>
                    </div>
                  )}
                </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No match statistics available</p>
                    <p className="text-sm text-muted-foreground">Statistics will be displayed after the match is completed and data is uploaded.</p>
                  </div>
                )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="upload" className="mt-6">
                  <ExcelUpload 
                    fixtureId={fixture.id}
                    onUploadComplete={() => {
                      // Invalidate match stats query to refresh the data
                      queryClient.invalidateQueries({ queryKey: ["/api/match-stats", fixtureId] });
                    }}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
    </MainLayout>
  );
}