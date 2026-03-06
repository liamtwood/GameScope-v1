import { useQuery, useQueries } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { useClub } from "@/contexts/club-context";
import { Team, Fixture, OppositionTeam } from "@shared/schema";
import { TeamStatistics } from "@/lib/types";
import { LogoDisplay } from "@/components/logo-display";
import { Bell, ChevronRight, Plus } from "lucide-react";
import { format, isThisWeek } from "date-fns";
import { useState } from "react";

export default function MobileHome() {
  const { selectedClub: club } = useClub();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<"All" | "Men" | "Women">("All");

  const clubColors = club?.colors as { primary?: string; secondary?: string } | null | undefined;
  const primaryColor = clubColors?.primary ?? "#16a34a";

  const { data: allTeams = [] } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const { data: oppositionTeams = [] } = useQuery<OppositionTeam[]>({
    queryKey: ["/api/opposition-teams", club?.id],
    queryFn: async (): Promise<OppositionTeam[]> => {
      const res = await fetch(`/api/opposition-teams?clubId=${club?.id ?? ""}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!club?.id,
  });

  const oppositionMap = new Map(oppositionTeams.map(t => [t.id, t]));

  const clubTeams = allTeams.filter(t => {
    if (t.clubId !== club?.id) return false;
    const g = (t.gender ?? "").toLowerCase();
    if (filter === "Men") return ["male", "men", "boys"].includes(g);
    if (filter === "Women") return ["female", "women", "girls"].includes(g);
    return true;
  });

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

  const allFixtures = fixtureQueries.flatMap(q => q.data ?? []);
  const thisWeekFixtures = allFixtures.filter(f =>
    f.status === "SCHEDULED" && isThisWeek(new Date(f.date))
  );
  const videosCount = allFixtures.reduce((sum, f) => {
    const vl = Array.isArray(f.videoLinks) ? f.videoLinks : [];
    return sum + vl.length;
  }, 0);
  const totalPlayers = statsQueries.reduce((sum, q) => sum + ((q.data as any)?.totalPlayers ?? 0), 0);

  const getNextFixture = (teamId: string): Fixture | null => {
    const idx = clubTeams.findIndex(t => t.id === teamId);
    if (idx === -1) return null;
    const teamFixtures = (fixtureQueries[idx]?.data ?? [])
      .filter(f => f.status === "SCHEDULED")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return teamFixtures[0] ?? null;
  };

  const seasonYear = new Date().getFullYear();

  return (
    <MobileLayout>
      {/* Club Header */}
      <div className="px-4 pt-10 pb-5" style={{ backgroundColor: primaryColor }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {club?.logoPath ? (
              <img
                src={club.logoPath}
                alt={club.name}
                className="h-16 w-auto max-w-[128px] object-contain drop-shadow-sm"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xl">
                {club?.shortName ?? club?.name?.slice(0, 2).toUpperCase() ?? "GS"}
              </div>
            )}
            <div>
              <h1 className="text-white font-bold text-base leading-tight">{club?.name ?? "Club"}</h1>
              <p className="text-white/60 text-[11px]">{seasonYear}/{seasonYear + 1} Season</p>
            </div>
          </div>
          <button className="relative p-2">
            <Bell className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Players", value: totalPlayers || "—" },
            { label: "This Week", value: thisWeekFixtures.length },
            { label: "Videos", value: videosCount },
          ].map(tile => (
            <div key={tile.label} className="bg-white/15 rounded-xl p-3 text-center">
              <div className="text-white font-bold text-xl">{tile.value}</div>
              <div className="text-white/60 text-[10px] mt-0.5">{tile.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Filter row */}
        <div className="flex gap-2 mb-4">
          {(["All", "Men", "Women"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-colors border"
              style={filter === f
                ? { backgroundColor: primaryColor, color: "#fff", borderColor: primaryColor }
                : { backgroundColor: "#fff", color: "#6b7280", borderColor: "#e5e7eb" }
              }
            >
              {f}
            </button>
          ))}
        </div>

        {/* Teams list */}
        <div className="space-y-3">
          {clubTeams.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No teams found</p>
          )}
          {clubTeams.map((team, i) => {
            const stats: TeamStatistics | undefined = statsQueries[i]?.data;
            const nextFix = getNextFixture(team.id);
            const wins = stats?.wins ?? 0;
            const draws = stats?.draws ?? 0;
            const losses = stats?.losses ?? 0;
            const opponent = nextFix?.oppositionTeamId ? oppositionMap.get(nextFix.oppositionTeamId) : null;

            return (
              <div
                key={team.id}
                className="bg-white rounded-xl p-4 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
                onClick={() => navigate(`/m/team/${team.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <LogoDisplay
                      src={(team as any).logoUrl ?? (team as any).logoPath}
                      alt={team.name}
                      fallbackText={team.shortName?.slice(0, 2) ?? team.name.slice(0, 2)}
                      size="sm"
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm text-gray-800 truncate block">{team.name}</span>
                      {nextFix ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {opponent?.logoPath && (
                            <LogoDisplay
                              src={opponent.logoPath}
                              alt={opponent.name}
                              size="sm"
                              className="!w-4 !h-4 shrink-0"
                              noBorder
                            />
                          )}
                          <p className="text-[11px] text-gray-400 truncate">
                            {format(new Date(nextFix.date), "EEE d MMM")} · {nextFix.isHome ? "vs" : "at"} {nextFix.opponent}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-400 mt-0.5">No upcoming fixtures</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 ml-2" />
                </div>

                {/* W/D/L */}
                <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold" style={{ color: primaryColor }}>{wins}</span>
                    <span className="text-[10px] text-gray-400">W</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-500">{draws}</span>
                    <span className="text-[10px] text-gray-400">D</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-red-500">{losses}</span>
                    <span className="text-[10px] text-gray-400">L</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add team card */}
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center justify-center gap-2 cursor-not-allowed opacity-50">
            <Plus className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Add new team</span>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
