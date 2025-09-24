import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Trophy, TrendingUp, Video, BarChart3 } from "lucide-react";
import { useTeam } from "@/contexts/team-context";
import { format } from "date-fns";
import { Fixture, Player } from "@shared/schema";
import { TeamStatistics } from "@/lib/types";
import { Link } from "wouter";

export default function DashboardMobile() {
  const { selectedTeam } = useTeam();

  const { data: fixtures = [] } = useQuery<Fixture[]>({
    queryKey: ['/api/fixtures', selectedTeam?.id],
    enabled: !!selectedTeam?.id
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ['/api/players', selectedTeam?.id],
    enabled: !!selectedTeam?.id
  });

  const { data: teamStats } = useQuery<TeamStatistics>({
    queryKey: ['/api/statistics/team', selectedTeam?.id],
    enabled: !!selectedTeam?.id
  });

  // Get recent fixtures (last 3)
  const recentFixtures = fixtures
    .filter(f => f.status === 'COMPLETED')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // Get upcoming fixtures (next 3)
  const upcomingFixtures = fixtures
    .filter(f => f.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const getResultBadge = (fixture: Fixture) => {
    if (fixture.status !== 'COMPLETED' || fixture.homeScore === null || fixture.awayScore === null) {
      return null;
    }

    const isHome = fixture.type === 'HOME';
    const ourScore = isHome ? fixture.homeScore : fixture.awayScore;
    const theirScore = isHome ? fixture.awayScore : fixture.homeScore;

    if (ourScore > theirScore) {
      return <Badge className="bg-green-500 text-white text-xs">W</Badge>;
    } else if (ourScore < theirScore) {
      return <Badge className="bg-red-500 text-white text-xs">L</Badge>;
    } else {
      return <Badge className="bg-yellow-500 text-white text-xs">D</Badge>;
    }
  };

  if (!selectedTeam) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Please select a team to view dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{players.length}</p>
                <p className="text-xs text-muted-foreground">Players</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{fixtures.length}</p>
                <p className="text-xs text-muted-foreground">Fixtures</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{teamStats?.wins || 0}</p>
                <p className="text-xs text-muted-foreground">Wins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{teamStats?.totalGoals || 0}</p>
                <p className="text-xs text-muted-foreground">Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Fixtures */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Recent Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentFixtures.length > 0 ? (
            recentFixtures.map((fixture) => (
              <div key={fixture.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{fixture.opponent}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(fixture.date), 'MMM d')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {fixture.homeScore !== null && fixture.awayScore !== null && (
                    <span className="text-sm font-medium">
                      {fixture.type === 'HOME' 
                        ? `${fixture.homeScore}-${fixture.awayScore}`
                        : `${fixture.awayScore}-${fixture.homeScore}`
                      }
                    </span>
                  )}
                  {getResultBadge(fixture)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">No recent fixtures</p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Fixtures */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Upcoming Fixtures</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingFixtures.length > 0 ? (
            upcomingFixtures.map((fixture) => (
              <div key={fixture.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{fixture.opponent}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(fixture.date), 'MMM d, h:mm a')}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {fixture.type}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">No upcoming fixtures</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/fixtures">
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                <Calendar className="h-6 w-6" />
                <span className="text-sm">Fixtures</span>
              </Button>
            </Link>
            <Link href="/squad">
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                <Users className="h-6 w-6" />
                <span className="text-sm">Squad</span>
              </Button>
            </Link>
            <Link href="/match-analysis">
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">Analysis</span>
              </Button>
            </Link>
            <Link href="/videos">
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                <Video className="h-6 w-6" />
                <span className="text-sm">Videos</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}