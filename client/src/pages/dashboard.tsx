import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StatsCard } from "@/components/ui/stats-card";
import { FixtureCard } from "@/components/ui/fixture-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Target, Trophy, Calendar } from "lucide-react";
import { TeamStatistics } from "@/lib/types";
import { Fixture, Player, Team } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [fixturesWithAnalysis, setFixturesWithAnalysis] = useState<Set<string>>(new Set());
  const { data: teams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const currentTeam = teams?.[0]; // For demo, use first team

  const { data: players } = useQuery<Player[]>({ 
    queryKey: ["/api/players", currentTeam?.id],
    enabled: !!currentTeam?.id 
  });

  const { data: fixtures } = useQuery<Fixture[]>({ 
    queryKey: ["/api/fixtures", currentTeam?.id],
    enabled: !!currentTeam?.id 
  });

  const { data: statistics } = useQuery<TeamStatistics>({ 
    queryKey: ["/api/statistics/team", currentTeam?.id],
    enabled: !!currentTeam?.id 
  });

  const recentFixtures = fixtures?.filter(f => f.status === 'COMPLETED').slice(0, 3) || [];
  const upcomingFixtures = fixtures?.filter(f => f.status === 'SCHEDULED').slice(0, 3) || [];
  const topScorers = players?.sort((a, b) => (b.goals || 0) - (a.goals || 0)).slice(0, 3) || [];

  // Check for analysis data for recent fixtures
  useEffect(() => {
    const checkAnalysisData = async () => {
      const fixtureIds = new Set<string>();
      
      for (const fixture of recentFixtures) {
        try {
          const response = await fetch(`/api/match-stats/${fixture.id}`);
          if (response.ok) {
            const stats = await response.json();
            if (stats && stats.length > 0) {
              fixtureIds.add(fixture.id);
            }
          }
        } catch (error) {
          // Ignore errors for now
        }
      }
      
      setFixturesWithAnalysis(fixtureIds);
    };

    if (recentFixtures.length > 0) {
      checkAnalysisData();
    }
  }, [recentFixtures]);

  const nextMatch = upcomingFixtures[0];
  const daysUntilNext = nextMatch ? Math.ceil((new Date(nextMatch.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  const handleAnalysisView = (fixture: Fixture) => {
    setLocation(`/analysis/${fixture.id}`);
  };

  return (
    <MainLayout 
      title="Dashboard" 
      subtitle="Overview of team performance and upcoming matches"
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Players"
          value={statistics?.totalPlayers || 0}
          icon={Users}
          iconColor="text-border"
          trend={{
            value: "+2",
            label: "from last season",
            positive: true
          }}
        />
        
        <StatsCard
          title="Matches Played"
          value={statistics?.matchesPlayed || 0}
          icon={Target}
          iconColor="text-border"
          subtitle={`${statistics?.wins || 0}W ${statistics?.draws || 0}D ${statistics?.losses || 0}L`}
        />
        
        <StatsCard
          title="Goals Scored"
          value={statistics?.totalGoals || 0}
          icon={Trophy}
          iconColor="text-border"
          subtitle={`${((statistics?.totalGoals || 0) / Math.max(statistics?.matchesPlayed || 1, 1)).toFixed(1)} avg per match`}
        />
        
        <StatsCard
          title="Next Match"
          value={`${daysUntilNext} days`}
          icon={Calendar}
          iconColor="text-border"
          subtitle={nextMatch ? `vs ${nextMatch.opponent}` : "No upcoming matches"}
        />
      </div>

      {/* Recent Results & Upcoming Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentFixtures.length > 0 ? (
              recentFixtures.map((fixture) => (
                <FixtureCard 
                  key={fixture.id} 
                  fixture={fixture} 
                  showAnimatedBorder={true}
                  onViewAnalysis={handleAnalysisView}
                  hasAnalysisData={fixturesWithAnalysis.has(fixture.id)}
                />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent results</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Matches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingFixtures.length > 0 ? (
              upcomingFixtures.map((fixture) => (
                <FixtureCard key={fixture.id} fixture={fixture} />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No upcoming matches</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Scorer */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Trophy className="text-white text-xl" />
              </div>
              <h4 className="font-semibold text-foreground">Top Scorer</h4>
              {topScorers[0] ? (
                <>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{topScorers[0].name}</p>
                  <p className="text-sm text-muted-foreground">{topScorers[0].goals} goals • {topScorers[0].position}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">No data available</p>
              )}
            </div>

            {/* Most Assists */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Target className="text-white text-xl" />
              </div>
              <h4 className="font-semibold text-foreground">Most Assists</h4>
              {players?.sort((a, b) => (b.assists || 0) - (a.assists || 0))[0] ? (
                <>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {players.sort((a, b) => (b.assists || 0) - (a.assists || 0))[0].name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {players.sort((a, b) => (b.assists || 0) - (a.assists || 0))[0].assists} assists • {players.sort((a, b) => (b.assists || 0) - (a.assists || 0))[0].position}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">No data available</p>
              )}
            </div>

            {/* Most Appearances */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Users className="text-white text-xl" />
              </div>
              <h4 className="font-semibold text-foreground">Most Reliable</h4>
              {players?.sort((a, b) => (b.appearances || 0) - (a.appearances || 0))[0] ? (
                <>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {players.sort((a, b) => (b.appearances || 0) - (a.appearances || 0))[0].name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {players.sort((a, b) => (b.appearances || 0) - (a.appearances || 0))[0].appearances} appearances
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">No data available</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
