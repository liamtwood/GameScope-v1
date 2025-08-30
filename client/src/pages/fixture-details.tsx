import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Clock, MapPin, Trophy, Edit } from "lucide-react";
import { Fixture, OppositionTeam, Player } from "@shared/schema";
import { format } from "date-fns";
import { FixtureEditDialog } from "@/components/dialogs/fixture-edit-dialog";
import { VideoManager } from "@/components/video-manager";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function FixtureDetails() {
  const [, params] = useRoute("/fixtures/:id");
  const fixtureId = params?.id;
  const [activeTab, setActiveTab] = useState("details");

  // Check for tab parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['details', 'videos', 'lineups'].includes(tabParam)) {
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
            <TabsTrigger value="videos" data-testid="tab-videos">Upload Video</TabsTrigger>
            <TabsTrigger value="lineups" data-testid="tab-lineups">Lineups</TabsTrigger>
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
        </Tabs>
      </div>
      
    </MainLayout>
  );
}