import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { useClub } from "@/contexts/club-context";
import { Team, Fixture, OppositionTeam } from "@shared/schema";
import { TeamStatistics } from "@/lib/types";
import { LogoDisplay } from "@/components/logo-display";
import { ArrowLeft, Bell, Plus, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function MobileTeam() {
  const params = useParams<{ teamId: string }>();
  const teamId = params.teamId;
  const [, navigate] = useLocation();
  const { selectedClub: club } = useClub();

  const clubColors = club?.colors as { primary?: string } | null | undefined;
  const primaryColor = clubColors?.primary ?? "#16a34a";

  const { data: team } = useQuery<Team>({
    queryKey: ["/api/teams", teamId],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!teamId,
  });

  const { data: stats } = useQuery<TeamStatistics>({
    queryKey: ["/api/statistics/team", teamId],
    queryFn: async () => {
      const res = await fetch(`/api/statistics/team/${teamId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!teamId,
  });

  const { data: fixtures = [] } = useQuery<Fixture[]>({
    queryKey: ["/api/fixtures", teamId],
    queryFn: async () => {
      const res = await fetch(`/api/fixtures/${teamId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!teamId,
  });

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

  const getFixtureResult = (f: Fixture) => {
    if (f.status !== "COMPLETED" || f.homeScore == null || f.awayScore == null) return null;
    const isHome = f.type === "HOME";
    const ours = isHome ? f.homeScore : f.awayScore;
    const theirs = isHome ? f.awayScore : f.homeScore;
    if (ours > theirs) return { label: `W ${ours}-${theirs}`, color: "bg-green-500" };
    if (ours < theirs) return { label: `L ${ours}-${theirs}`, color: "bg-red-500" };
    return { label: `D ${ours}-${theirs}`, color: "bg-gray-400" };
  };

  // Split into upcoming and results
  const upcomingFixtures = fixtures
    .filter(f => f.status === "SCHEDULED")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const resultFixtures = fixtures
    .filter(f => f.status !== "SCHEDULED")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group results by month label e.g. "October 2025"
  const resultsByMonth: { month: string; fixtures: Fixture[] }[] = [];
  for (const f of resultFixtures) {
    const month = format(new Date(f.date), "MMMM yyyy");
    const existing = resultsByMonth.find(g => g.month === month);
    if (existing) {
      existing.fixtures.push(f);
    } else {
      resultsByMonth.push({ month, fixtures: [f] });
    }
  }

  const wins = stats?.wins ?? 0;
  const draws = stats?.draws ?? 0;
  const losses = stats?.losses ?? 0;
  const goalsFor = (stats as any)?.goalsFor ?? 0;
  const goalsAgainst = (stats as any)?.goalsAgainst ?? 0;
  const gd = goalsFor - goalsAgainst;

  const renderFixtureCard = (fixture: Fixture) => {
    const result = getFixtureResult(fixture);
    const isUpcoming = fixture.status === "SCHEDULED";
    const opponent = fixture.oppositionTeamId ? oppositionMap.get(fixture.oppositionTeamId) : null;
    const stripeColor = isUpcoming
      ? primaryColor
      : result?.color.includes("red") ? "#ef4444" : result?.color.includes("green") ? "#22c55e" : "#9ca3af";

    return (
      <div
        key={fixture.id}
        className="bg-white rounded-xl overflow-hidden shadow-sm flex cursor-pointer active:scale-[0.99] transition-transform"
        onClick={() => navigate(`/m/match/${fixture.id}`)}
      >
        <div className="w-1 shrink-0" style={{ backgroundColor: stripeColor }} />
        <div className="flex-1 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {opponent?.logoPath ? (
                <img
                  src={opponent.logoPath}
                  alt={opponent.name}
                  className="w-[50px] h-[50px] object-contain shrink-0"
                />
              ) : opponent ? (
                <div className="w-[50px] h-[50px] rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-[10px] shrink-0">
                  {opponent.name.slice(0, 2).toUpperCase()}
                </div>
              ) : null}
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm text-gray-800 truncate block">{fixture.opponent}</span>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {format(new Date(fixture.date), "EEE d MMM, h:mm a")}
                  {fixture.venue ? ` · ${fixture.venue}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {result && (
                <span className={cn("text-[11px] font-bold text-white px-2 py-0.5 rounded-lg", result.color)}>
                  {result.label}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MobileLayout>
      {/* Header */}
      <div className="px-4 pt-10 pb-5" style={{ backgroundColor: primaryColor }}>
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/m")} className="p-1 -ml-1">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            {club?.logoPath ? (
              <img
                src={club.logoPath}
                alt={club.name}
                className="h-10 w-auto max-w-[80px] object-contain drop-shadow-sm"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                {club?.shortName ?? club?.name?.slice(0, 2).toUpperCase() ?? "GS"}
              </div>
            )}
            <div>
              <h1 className="text-white font-bold text-sm">{team?.name ?? "Team"}</h1>
              <p className="text-white/60 text-[10px]">{new Date().getFullYear()} Season</p>
            </div>
          </div>
          <button className="p-1">
            <Bell className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Season record */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Season Record</h3>
          <div className="grid grid-cols-6 gap-1">
            {[
              { label: "Won", value: wins, style: { color: primaryColor } },
              { label: "Drawn", value: draws, style: { color: "#6b7280" } },
              { label: "Lost", value: losses, style: { color: "#ef4444" } },
              { label: "GF", value: goalsFor, style: { color: "#374151" } },
              { label: "GA", value: goalsAgainst, style: { color: "#374151" } },
              { label: "GD", value: gd >= 0 ? `+${gd}` : gd, style: { color: gd >= 0 ? primaryColor : "#ef4444" } },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-lg font-bold" style={s.style}>{s.value}</div>
                <div className="text-[9px] text-gray-400 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* UPCOMING */}
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Upcoming</span>
            {upcomingFixtures.length > 0 && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
              >
                {upcomingFixtures.length}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {upcomingFixtures.length === 0 && (
              <p className="text-xs text-gray-400 px-1 mb-1">No upcoming fixtures scheduled</p>
            )}
            {upcomingFixtures.map(renderFixtureCard)}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center justify-center gap-2 cursor-not-allowed opacity-50">
              <Plus className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">Add fixture</span>
            </div>
          </div>
        </div>

        {/* RESULTS grouped by month */}
        {resultsByMonth.length > 0 && (
          <div className="space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1 block">Results</span>
            {resultsByMonth.map(({ month, fixtures: monthFixtures }) => (
              <div key={month}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-300 mb-2 px-1">{month}</p>
                <div className="space-y-2">
                  {monthFixtures.map(renderFixtureCard)}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </MobileLayout>
  );
}
