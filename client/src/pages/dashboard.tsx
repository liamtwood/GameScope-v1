import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StatsCard } from "@/components/ui/stats-card";
import { FixtureCard } from "@/components/ui/fixture-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Target, Trophy, Calendar, Sparkles } from "lucide-react";
import { TeamStatistics } from "@/lib/types";
import { Fixture, Player, Team } from "@shared/schema";
import { useTeam } from "@/contexts/team-context";
import { useClub } from "@/contexts/club-context";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [fixturesWithAnalysis, setFixturesWithAnalysis] = useState<Set<string>>(new Set());
  const { selectedTeam: currentTeam } = useTeam();
  const { selectedClub: currentClub } = useClub();

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


  const now = new Date();
  const recentFixtures = fixtures
    ?.filter(f => f.status === 'COMPLETED' && new Date(f.date) <= now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3) || [];
  const upcomingFixtures = fixtures?.filter(f => {
    const fixtureDate = new Date(f.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    return f.status === 'SCHEDULED' && fixtureDate >= today;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3) || [];
  // Note: Goals data would need to be fetched from match stats separately
  // For now, show players without goals sorting
  const topScorers = players?.slice(0, 3) || [];

  // Check for analysis data for recent fixtures (memoized to prevent excessive API calls)
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
  }, [recentFixtures.map(f => f.id).join(',')]); // Only re-run when fixture IDs change

  const nextMatch = upcomingFixtures[0];
  const daysUntilNext = nextMatch ? Math.ceil((new Date(nextMatch.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

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
          iconColor="text-club-primary"
          trend={{
            value: "+2",
            label: "from last season",
            positive: true
          }}
        />
        
        <StatsCard
          title="Matches Played"
          value={`${statistics?.wins || 0}-${statistics?.draws || 0}-${statistics?.losses || 0}`}
          icon={Trophy}
          iconColor="text-club-primary"
          subtitle="W-D-L"
        />
        
        <StatsCard
          title="Videos Analyzed"
          value={statistics?.totalGoals || 0}
          icon={Sparkles}
          iconColor="text-club-primary"
          subtitle="GameScope AI"
        />
        
        <StatsCard
          title="Next Match"
          value={daysUntilNext !== null ? `${daysUntilNext} days` : "None"}
          icon={Calendar}
          iconColor="text-club-primary"
          subtitle={nextMatch ? `vs ${nextMatch.opponent}` : "No upcoming matches"}
        />
      </div>

      {/* Recent Results & Upcoming Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Recent Results</CardTitle>
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
            <CardTitle className="text-foreground">Upcoming Matches</CardTitle>
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

    </MainLayout>
  );
}
