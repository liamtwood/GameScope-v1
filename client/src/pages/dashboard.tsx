import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StatsCard } from "@/components/ui/stats-card";
import { FixtureCard } from "@/components/ui/fixture-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, Trophy, Calendar, Sparkles } from "lucide-react";
import { TeamStatistics } from "@/lib/types";
import { Fixture, Player } from "@shared/schema";
import { useTeam } from "@/contexts/team-context";
import { useClub } from "@/contexts/club-context";
import {
  getEffectiveSeasonStartMonth,
  isDateInSeason,
  getAvailableSeasons,
} from "@/utils/seasonUtils";

function groupFixturesBySeason(
  fixtures: Fixture[],
  seasonStartMonth: string
): { season: string; fixtures: Fixture[] }[] {
  const seasons = getAvailableSeasons(seasonStartMonth, 5);
  const groups: { season: string; fixtures: Fixture[] }[] = [];

  for (const season of seasons) {
    const inSeason = fixtures.filter((f) => {
      const d = new Date(f.date);
      return isDateInSeason(d, season, seasonStartMonth);
    });
    if (inSeason.length > 0) {
      groups.push({ season, fixtures: inSeason });
    }
  }

  return groups;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [fixturesWithAnalysis, setFixturesWithAnalysis] = useState<Set<string>>(new Set());
  const { selectedTeam: currentTeam } = useTeam();
  const { selectedClub: currentClub } = useClub();

  const { data: players } = useQuery<Player[]>({
    queryKey: ["/api/players", currentTeam?.id],
    enabled: !!currentTeam?.id,
  });

  const { data: fixtures } = useQuery<Fixture[]>({
    queryKey: ["/api/fixtures", currentTeam?.id],
    enabled: !!currentTeam?.id,
  });

  const { data: statistics } = useQuery<TeamStatistics>({
    queryKey: ["/api/statistics/team", currentTeam?.id],
    enabled: !!currentTeam?.id,
  });

  const seasonStartMonth = getEffectiveSeasonStartMonth(
    currentTeam ?? undefined,
    currentClub ?? undefined
  );

  const now = new Date();

  const recentFixtures = (fixtures || [])
    .filter((f) => f.status === "COMPLETED" && new Date(f.date) <= now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const upcomingFixtures = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (fixtures || [])
      .filter((f) => f.status === "SCHEDULED" && new Date(f.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  })();

  const recentGroups = groupFixturesBySeason(recentFixtures, seasonStartMonth);
  const upcomingGroups = groupFixturesBySeason(upcomingFixtures, seasonStartMonth);

  const topScorers = players?.slice(0, 3) || [];

  useEffect(() => {
    const checkAnalysisData = async () => {
      const fixtureIds = new Set<string>();
      for (const fixture of recentFixtures) {
        try {
          const response = await fetch(`/api/match-stats/${fixture.id}`);
          if (response.ok) {
            const stats = await response.json();
            if (stats && stats.length > 0) fixtureIds.add(fixture.id);
          }
        } catch {}
      }
      setFixturesWithAnalysis(fixtureIds);
    };
    if (recentFixtures.length > 0) checkAnalysisData();
  }, [recentFixtures.map((f) => f.id).join(",")]);

  const nextMatch = upcomingFixtures[0];
  const daysUntilNext = nextMatch
    ? Math.ceil((new Date(nextMatch.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

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
          trend={{ value: "+2", label: "from last season", positive: true }}
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
          <CardContent className="space-y-6">
            {recentGroups.length > 0 ? (
              recentGroups.map(({ season, fixtures: groupFixtures }) => (
                <div key={season}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 pb-1 border-b">
                    {season}
                  </p>
                  <div className="space-y-3">
                    {groupFixtures.map((fixture) => (
                      <FixtureCard
                        key={fixture.id}
                        fixture={fixture}
                        showAnimatedBorder={true}
                        onViewAnalysis={handleAnalysisView}
                        hasAnalysisData={fixturesWithAnalysis.has(fixture.id)}
                      />
                    ))}
                  </div>
                </div>
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
          <CardContent className="space-y-6">
            {upcomingGroups.length > 0 ? (
              upcomingGroups.map(({ season, fixtures: groupFixtures }) => (
                <div key={season}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 pb-1 border-b">
                    {season}
                  </p>
                  <div className="space-y-3">
                    {groupFixtures.map((fixture) => (
                      <FixtureCard key={fixture.id} fixture={fixture} />
                    ))}
                  </div>
                </div>
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
