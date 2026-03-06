import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { Team, Fixture } from "@shared/schema";
import { TeamStatistics } from "@/lib/types";
import { ArrowLeft, Bell, Plus, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function MobileTeam() {
  const params = useParams<{ teamId: string }>();
  const teamId = params.teamId;
  const [, navigate] = useLocation();

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

  const sortedFixtures = [...fixtures].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getFixtureResult = (f: Fixture) => {
    if (f.status !== "COMPLETED" || f.homeScore == null || f.awayScore == null) return null;
    const isHome = f.type === "HOME";
    const ours = isHome ? f.homeScore : f.awayScore;
    const theirs = isHome ? f.awayScore : f.homeScore;
    if (ours > theirs) return { label: `W ${ours}-${theirs}`, color: "bg-green-500" };
    if (ours < theirs) return { label: `L ${ours}-${theirs}`, color: "bg-red-500" };
    return { label: `D ${ours}-${theirs}`, color: "bg-gray-400" };
  };

  const wins = stats?.wins ?? 0;
  const draws = stats?.draws ?? 0;
  const losses = stats?.losses ?? 0;
  const goalsFor = (stats as any)?.goalsFor ?? 0;
  const goalsAgainst = (stats as any)?.goalsAgainst ?? 0;
  const gd = goalsFor - goalsAgainst;

  return (
    <MobileLayout>
      {/* Header */}
      <div className="bg-green-600 px-4 pt-10 pb-5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/m")} className="p-1 -ml-1">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">
              {team?.shortName?.slice(0, 2) ?? "TM"}
            </div>
            <div>
              <h1 className="text-white font-bold text-sm">{team?.name ?? "Team"}</h1>
              <p className="text-green-200 text-[10px]">{new Date().getFullYear()} Season</p>
            </div>
          </div>
          <button className="p-1">
            <Bell className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Season record */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Season Record</h3>
          <div className="grid grid-cols-6 gap-1">
            {[
              { label: "Won", value: wins, color: "text-green-600" },
              { label: "Drawn", value: draws, color: "text-gray-500" },
              { label: "Lost", value: losses, color: "text-red-500" },
              { label: "GF", value: goalsFor, color: "text-gray-700" },
              { label: "GA", value: goalsAgainst, color: "text-gray-700" },
              { label: "GD", value: gd >= 0 ? `+${gd}` : gd, color: gd >= 0 ? "text-green-600" : "text-red-500" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={cn("text-lg font-bold", s.color)}>{s.value}</div>
                <div className="text-[9px] text-gray-400 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Fixtures list */}
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">Fixtures & Results</h3>
          <div className="space-y-2">
            {sortedFixtures.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No fixtures yet</p>
            )}
            {sortedFixtures.map(fixture => {
              const result = getFixtureResult(fixture);
              const isUpcoming = fixture.status === "SCHEDULED";
              const stripeColor = isUpcoming
                ? "bg-green-500"
                : result?.color.includes("red") ? "bg-red-500" : result?.color.includes("green") ? "bg-green-500" : "bg-gray-400";

              return (
                <div
                  key={fixture.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm flex cursor-pointer active:scale-[0.99] transition-transform"
                  onClick={() => navigate(`/m/match/${fixture.id}`)}
                >
                  <div className={cn("w-1 shrink-0", stripeColor)} />
                  <div className="flex-1 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm text-gray-800 truncate">{fixture.opponent}</span>
                          {isUpcoming && (
                            <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full shrink-0">
                              UPCOMING
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {format(new Date(fixture.date), "EEE d MMM, h:mm a")}
                          {fixture.venue ? ` · ${fixture.venue}` : ""}
                        </p>
                        {(fixture as any).competition && (
                          <p className="text-[10px] text-gray-300 mt-0.5">{(fixture as any).competition}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
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
            })}

            {/* Add fixture */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center justify-center gap-2 cursor-not-allowed opacity-50">
              <Plus className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">Add fixture</span>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
