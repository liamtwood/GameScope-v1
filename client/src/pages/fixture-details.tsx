import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Clock, MapPin, Trophy } from "lucide-react";
import { Fixture, OppositionTeam, Player } from "@shared/schema";
import { format } from "date-fns";

export default function FixtureDetails() {
  const [, params] = useRoute("/fixtures/:id");
  const fixtureId = params?.id;

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

  if (isLoading || !fixture) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading fixture details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const oppositionTeam = oppositionTeams?.find(team => team.id === fixture.oppositionTeamId);
  const isHomeMatch = fixture.type === "HOME";
  
  const homeTeam = isHomeMatch ? "Polk State Women's Soccer" : (oppositionTeam?.name || fixture.opponent);
  const awayTeam = isHomeMatch ? (oppositionTeam?.name || fixture.opponent) : "Polk State Women's Soccer";
  
  const homeTeamLogo = isHomeMatch ? "/logo-polk-state.png" : (oppositionTeam?.logoPath || "/default-team-logo.png");
  const awayTeamLogo = isHomeMatch ? (oppositionTeam?.logoPath || "/default-team-logo.png") : "/logo-polk-state.png";

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
    <MainLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Fixtures
        </Button>

        {/* Header with Teams */}
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Teams Layout */}
              <div className="flex items-center justify-center space-x-8 md:space-x-16">
                {/* Home Team */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                    <img 
                      src={homeTeamLogo} 
                      alt={homeTeam}
                      className="w-16 h-16 md:w-20 md:h-20 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/default-team-logo.png";
                      }}
                    />
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
                    <img 
                      src={awayTeamLogo} 
                      alt={awayTeam}
                      className="w-16 h-16 md:w-20 md:h-20 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/default-team-logo.png";
                      }}
                    />
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
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
            <TabsTrigger value="videos" data-testid="tab-videos">Videos</TabsTrigger>
            <TabsTrigger value="lineups" data-testid="tab-lineups">Lineups</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Match Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Competition</h4>
                      <p className="text-foreground">{fixture.competition || "Regular Season"}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Venue</h4>
                      <p className="text-foreground">{fixture.venue}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Match Type</h4>
                      <p className="text-foreground">{fixture.type === "HOME" ? "Home" : fixture.type === "AWAY" ? "Away" : "Neutral"}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Status</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        fixture.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                        fixture.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                        fixture.status === "NO_CONTEST" ? "bg-orange-100 text-orange-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {getStatusText(fixture.status)}
                      </span>
                    </div>
                    {fixture.notes && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Notes</h4>
                        <p className="text-foreground">{fixture.notes}</p>
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
                <h3 className="text-lg font-semibold mb-4">Match Videos</h3>
                {fixture.hasVideo ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Video content available for this match.</p>
                    {/* Video links would be displayed here */}
                    <div className="bg-muted/30 rounded-lg p-4 text-center">
                      <p className="text-muted-foreground">Video player implementation coming soon</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No videos available for this match.</p>
                  </div>
                )}
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
                      <img 
                        src={homeTeamLogo} 
                        alt={homeTeam}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/default-team-logo.png";
                        }}
                      />
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
                      <img 
                        src={awayTeamLogo} 
                        alt={awayTeam}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/default-team-logo.png";
                        }}
                      />
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