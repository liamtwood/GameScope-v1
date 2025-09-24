import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Plus, Video, BarChart3, MapPin, Clock, Trophy } from "lucide-react";
import { useTeam } from "@/contexts/team-context";
import { format } from "date-fns";
import { Fixture, OppositionTeam } from "@shared/schema";
import { LogoDisplay } from "@/components/logo-display";
import { Link, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

export default function FixturesMobile() {
  const { selectedTeam } = useTeam();
  const [, setLocation] = useLocation();

  const { data: fixtures = [] } = useQuery<Fixture[]>({
    queryKey: ['/api/fixtures', selectedTeam?.id],
    enabled: !!selectedTeam?.id
  });

  const { data: oppositionTeams = [] } = useQuery<OppositionTeam[]>({
    queryKey: ["/api/opposition-teams"],
  });

  // Separate fixtures by status
  const upcomingFixtures = fixtures
    .filter(f => f.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const completedFixtures = fixtures
    .filter(f => f.status === 'COMPLETED')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getResultBadge = (fixture: Fixture) => {
    if (fixture.status !== 'COMPLETED' || fixture.homeScore === null || fixture.awayScore === null) {
      return <Badge variant="outline" className="text-xs">Scheduled</Badge>;
    }

    const isHome = fixture.type === 'HOME';
    const ourScore = isHome ? fixture.homeScore : fixture.awayScore;
    const theirScore = isHome ? fixture.awayScore : fixture.homeScore;

    if (ourScore > theirScore) {
      return <Badge className="bg-green-500 text-white text-xs">W {ourScore}-{theirScore}</Badge>;
    } else if (ourScore < theirScore) {
      return <Badge className="bg-red-500 text-white text-xs">L {ourScore}-{theirScore}</Badge>;
    } else {
      return <Badge className="bg-yellow-500 text-white text-xs">D {ourScore}-{theirScore}</Badge>;
    }
  };

  const getOpponentLogo = (opponentName: string) => {
    const opponent = oppositionTeams.find(team => team.name === opponentName);
    return opponent?.logoPath;
  };

  const FixtureCard = ({ fixture }: { fixture: Fixture }) => {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <LogoDisplay
                src={getOpponentLogo(fixture.opponent)}
                alt={fixture.opponent}
                size="md"
                noBorder={true}
              />
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{fixture.opponent}</h3>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(fixture.date), 'MMM d')}</span>
                  <Clock className="h-3 w-3 ml-2" />
                  <span>{format(new Date(fixture.date), 'h:mm a')}</span>
                </div>
                {fixture.venue && (
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>{fixture.venue}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {fixture.type}
                  </Badge>
                  {fixture.competition && (
                    <Badge variant="outline" className="text-xs">
                      {fixture.competition}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              {getResultBadge(fixture)}
              <div className="flex space-x-1">
                {fixture.hasVideo && (
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Video className="h-3 w-3 text-blue-600" />
                  </Button>
                )}
                {fixture.status === 'COMPLETED' && (
                  <Link href={`/match-analysis`}>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <BarChart3 className="h-3 w-3 text-red-600" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!selectedTeam) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Please select a team to view fixtures</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Fixtures</h1>
          <p className="text-sm text-muted-foreground">
            {selectedTeam.name} - {fixtures.length} total fixtures
          </p>
        </div>
        <Button size="sm" className="h-8">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-green-600">
              {completedFixtures.filter(f => {
                const isHome = f.type === 'HOME';
                const ourScore = isHome ? f.homeScore : f.awayScore;
                const theirScore = isHome ? f.awayScore : f.homeScore;
                return ourScore !== null && theirScore !== null && ourScore > theirScore;
              }).length}
            </div>
            <div className="text-xs text-muted-foreground">Wins</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-yellow-600">
              {completedFixtures.filter(f => {
                const isHome = f.type === 'HOME';
                const ourScore = isHome ? f.homeScore : f.awayScore;
                const theirScore = isHome ? f.awayScore : f.homeScore;
                return ourScore !== null && theirScore !== null && ourScore === theirScore;
              }).length}
            </div>
            <div className="text-xs text-muted-foreground">Draws</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-red-600">
              {completedFixtures.filter(f => {
                const isHome = f.type === 'HOME';
                const ourScore = isHome ? f.homeScore : f.awayScore;
                const theirScore = isHome ? f.awayScore : f.homeScore;
                return ourScore !== null && theirScore !== null && ourScore < theirScore;
              }).length}
            </div>
            <div className="text-xs text-muted-foreground">Losses</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different fixture views */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming" className="text-xs">
            Upcoming ({upcomingFixtures.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs">
            Results ({completedFixtures.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {upcomingFixtures.length > 0 ? (
            upcomingFixtures.map((fixture) => (
              <FixtureCard key={fixture.id} fixture={fixture} />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-32 space-y-2">
                <Calendar className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">No upcoming fixtures</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          {completedFixtures.length > 0 ? (
            completedFixtures.map((fixture) => (
              <FixtureCard key={fixture.id} fixture={fixture} />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-32 space-y-2">
                <Trophy className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">No completed fixtures</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}