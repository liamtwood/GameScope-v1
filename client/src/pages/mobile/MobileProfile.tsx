import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { useTeam } from "@/contexts/team-context";
import { Fixture } from "@shared/schema";
import { Play, Star } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PlayerStats {
  apps: number;
  goals: number;
  assists: number;
  minutesPlayed: number;
}

export default function MobileProfile() {
  const { selectedTeam } = useTeam();

  const { data: players = [] } = useQuery<any[]>({
    queryKey: ["/api/players", selectedTeam?.id],
    queryFn: async () => {
      const res = await fetch(`/api/players/${selectedTeam!.id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedTeam?.id,
  });

  const player = players[0];

  const { data: stats } = useQuery<PlayerStats>({
    queryKey: ["/api/users/stats", player?.id],
    queryFn: async () => {
      const res = await fetch(`/api/users/${player!.id}/stats`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!player?.id,
  });

  const { data: fixtures = [] } = useQuery<Fixture[]>({
    queryKey: ["/api/fixtures", selectedTeam?.id],
    queryFn: async () => {
      const res = await fetch(`/api/fixtures/${selectedTeam!.id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedTeam?.id,
  });

  const recentFixtures = [...fixtures]
    .filter(f => f.status === "COMPLETED")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const getResult = (f: Fixture) => {
    if (f.homeScore == null || f.awayScore == null) return null;
    const isHome = f.type === "HOME";
    const ours = isHome ? f.homeScore : f.awayScore;
    const theirs = isHome ? f.awayScore : f.homeScore;
    if (ours > theirs) return { label: "W", color: "text-green-600" };
    if (ours < theirs) return { label: "L", color: "text-red-500" };
    return { label: "D", color: "text-gray-500" };
  };

  const initials = player
    ? `${player.firstName?.[0] ?? ""}${player.lastName?.[0] ?? ""}`.toUpperCase()
    : "ME";

  const posLabel = player?.position ?? "Player";
  const jersey = player?.jerseyNumber ? `#${player.jerseyNumber}` : "";

  return (
    <MobileLayout>
      {/* Green header */}
      <div className="bg-green-600 px-4 pt-10 pb-6">
        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold mb-3">
            {initials}
          </div>
          <h1 className="text-white font-bold text-lg leading-tight">
            {player ? `${player.firstName} ${player.lastName}` : "Your Profile"}
          </h1>
          <p className="text-green-200 text-xs mt-0.5">
            {[jersey, posLabel, selectedTeam?.name].filter(Boolean).join(" · ")}
          </p>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-4 gap-2 mt-5">
          {[
            { label: "Apps", value: stats?.apps ?? 0 },
            { label: "Goals", value: stats?.goals ?? 0 },
            { label: "Assists", value: stats?.assists ?? 0 },
            { label: "Mins", value: stats?.minutesPlayed ?? 0 },
          ].map(t => (
            <div key={t.label} className="bg-white/15 rounded-xl py-2.5 text-center">
              <div className="text-white font-bold text-lg">{t.value}</div>
              <div className="text-green-200 text-[9px] mt-0.5">{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Watch highlights */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <Play className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">Watch Highlights</p>
            <p className="text-[11px] text-gray-400">View your match clips</p>
          </div>
          <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded">NEW</span>
        </div>

        {/* Recent matches */}
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">Recent Matches</h3>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {recentFixtures.length === 0 && (
              <p className="text-xs text-gray-300 text-center py-6">No recent matches</p>
            )}
            {recentFixtures.map((fixture, i) => {
              const result = getResult(fixture);
              const isHome = fixture.type === "HOME";
              const ours = isHome ? fixture.homeScore : fixture.awayScore;
              const theirs = isHome ? fixture.awayScore : fixture.homeScore;
              return (
                <div key={fixture.id} className={cn("flex items-center px-4 py-3 gap-3", i > 0 && "border-t border-gray-50")}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {fixture.type === "HOME" ? "vs" : "at"} {fixture.opponent}
                    </p>
                    <p className="text-[10px] text-gray-400">{format(new Date(fixture.date), "d MMM yyyy")}</p>
                  </div>
                  {result && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("text-xs font-bold", result.color)}>{result.label}</span>
                      <span className="text-xs text-gray-500 tabular-nums">{ours}–{theirs}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
