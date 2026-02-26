import { useQuery, useQueries } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoDisplay } from "@/components/logo-display";
import { useClub } from "@/contexts/club-context";
import { useTeam } from "@/contexts/team-context";
import { format } from "date-fns";
import { Trophy, Calendar, Users, ChevronRight, MapPin } from "lucide-react";
import { Team, Fixture, OppositionTeam } from "@shared/schema";
import { TeamStatistics } from "@/lib/types";

export default function Home() {
  const { selectedClub: currentClub } = useClub();
  const { selectTeam } = useTeam();
  const [, setLocation] = useLocation();

  const { data: allTeams = [] } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const { data: oppositionTeams = [] } = useQuery<OppositionTeam[]>({
    queryKey: ["/api/opposition-teams", currentClub?.id],
    queryFn: async () => {
      const url = currentClub?.id ? `/api/opposition-teams?clubId=${currentClub.id}` : '/api/opposition-teams';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch opposition teams');
      return res.json();
    }
  });

  const clubTeams = allTeams.filter(t => t.clubId === currentClub?.id);

  const statsQueries = useQueries({
    queries: clubTeams.map(team => ({
      queryKey: ["/api/statistics/team", team.id],
      queryFn: async (): Promise<TeamStatistics> => {
        const res = await fetch(`/api/statistics/team/${team.id}`);
        if (!res.ok) throw new Error("Failed");
        return res.json();
      },
      enabled: !!team.id,
    })),
  });

  const fixtureQueries = useQueries({
    queries: clubTeams.map(team => ({
      queryKey: ["/api/fixtures", team.id],
      queryFn: async (): Promise<Fixture[]> => {
        const res = await fetch(`/api/fixtures/${team.id}`);
        if (!res.ok) throw new Error("Failed");
        return res.json();
      },
      enabled: !!team.id,
    })),
  });

  const allFixtures: Array<Fixture & { teamName: string }> = fixtureQueries
    .flatMap((q, i) =>
      (q.data ?? []).map(f => ({ ...f, teamName: clubTeams[i]?.name ?? "" }))
    );

  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingFixtures = allFixtures
    .filter(f => f.status === "SCHEDULED" && new Date(f.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const recentFixtures = allFixtures
    .filter(f => f.status === "COMPLETED" && new Date(f.date) <= now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const handleTeamClick = (team: Team) => {
    selectTeam(team);
    setLocation("/dashboard");
  };

  const getResultBadge = (fixture: Fixture) => {
    if (fixture.homeScore === null || fixture.awayScore === null) return null;
    const isHome = fixture.type === "HOME";
    const ours = isHome ? fixture.homeScore : fixture.awayScore;
    const theirs = isHome ? fixture.awayScore : fixture.homeScore;
    if (ours > theirs) return <Badge className="bg-green-500 text-white text-xs">W</Badge>;
    if (ours < theirs) return <Badge className="bg-red-500 text-white text-xs">L</Badge>;
    return <Badge className="bg-yellow-500 text-white text-xs">D</Badge>;
  };

  const getScore = (fixture: Fixture) => {
    if (fixture.homeScore === null || fixture.awayScore === null) return null;
    const isHome = fixture.type === "HOME";
    const ours = isHome ? fixture.homeScore : fixture.awayScore;
    const theirs = isHome ? fixture.awayScore : fixture.homeScore;
    return `${ours}–${theirs}`;
  };

  const getOpponentLogo = (fixture: Fixture) => {
    const oppositionTeam = oppositionTeams.find(team => 
      fixture.oppositionTeamId ? team.id === fixture.oppositionTeamId : team.name === fixture.opponent
    );
    return oppositionTeam?.logoPath;
  };

  return (
    <MainLayout title="Club Dashboard" subtitle={currentClub?.name ?? "Club overview"}>
      {/* Teams */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-club-primary" />
          Teams
        </h2>
        {clubTeams.length === 0 ? (
          <p className="text-muted-foreground text-sm">No teams found for this club.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubTeams.map((team, i) => {
              const stats: TeamStatistics | undefined = statsQueries[i]?.data;
              const isLoading = statsQueries[i]?.isLoading;
              const wins = stats?.wins ?? 0;
              const draws = stats?.draws ?? 0;
              const losses = stats?.losses ?? 0;
              const played = wins + draws + losses;

              return (
                <Card
                  key={team.id}
                  className="cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() => handleTeamClick(team)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">{team.name}</h3>
                          {team.status && (
                            <Badge variant="outline" className="text-xs capitalize shrink-0">
                              {team.status.toLowerCase()}
                            </Badge>
                          )}
                        </div>
                        {isLoading ? (
                          <p className="text-xs text-muted-foreground">Loading record…</p>
                        ) : played > 0 ? (
                          <div className="flex items-center gap-3 mt-2">
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">{wins}</div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">W</div>
                            </div>
                            <div className="text-muted-foreground text-sm">·</div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{draws}</div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">D</div>
                            </div>
                            <div className="text-muted-foreground text-sm">·</div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-red-600 dark:text-red-400">{losses}</div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">L</div>
                            </div>
                            <div className="ml-2 text-xs text-muted-foreground">({played} played)</div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">No results yet</p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Two column layout for fixtures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Fixtures */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-club-primary" />
              Upcoming Fixtures
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingFixtures.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6 px-4">No upcoming fixtures</p>
            ) : (
              <div className="divide-y">
                {upcomingFixtures.map(fixture => (
                  <div key={`${fixture.id}-upcoming`} className="flex items-center gap-3 px-4 py-3">
                    <div className="text-center w-12 shrink-0">
                      <div className="text-xs font-medium text-foreground">
                        {format(new Date(fixture.date), "d MMM")}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {format(new Date(fixture.date), "h:mm a")}
                      </div>
                    </div>
                    
                    <div className="h-10 w-10 shrink-0">
                      <LogoDisplay
                        src={getOpponentLogo(fixture)}
                        alt={fixture.opponent}
                        size="md"
                        noBorder
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">
                        {fixture.type === 'HOME' ? 'vs' : 'at'} {fixture.opponent}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{fixture.type}</Badge>
                        {fixture.competition && (
                          <span className="text-[10px] text-muted-foreground truncate">{fixture.competition}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0 text-right max-w-[90px] truncate">
                      {fixture.teamName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Last 5 Results */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-club-primary" />
              Last 5 Results
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentFixtures.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6 px-4">No completed fixtures yet</p>
            ) : (
              <div className="divide-y">
                {recentFixtures.map(fixture => (
                  <div key={`${fixture.id}-recent`} className="flex items-center gap-3 px-4 py-3">
                    <div className="text-center w-12 shrink-0">
                      <div className="text-xs font-medium text-foreground">
                        {format(new Date(fixture.date), "d MMM")}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {format(new Date(fixture.date), "yyyy")}
                      </div>
                    </div>

                    <div className="h-10 w-10 shrink-0">
                      <LogoDisplay
                        src={getOpponentLogo(fixture)}
                        alt={fixture.opponent}
                        size="md"
                        noBorder
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">
                        {fixture.type === 'HOME' ? 'vs' : 'at'} {fixture.opponent}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">{fixture.teamName}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {getScore(fixture) && (
                        <span className="text-sm font-semibold tabular-nums">{getScore(fixture)}</span>
                      )}
                      {getResultBadge(fixture)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
