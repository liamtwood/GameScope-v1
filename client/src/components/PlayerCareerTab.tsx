import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, ExternalLink, Trophy, Calendar } from "lucide-react";

interface SeasonStat {
  clubId: string;
  clubName: string;
  clubLogoPath: string | null;
  teamId: string;
  teamName: string;
  season: string;
  apps: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
}

interface MatchLog {
  fixtureId: string;
  hasNativeFixture: boolean;
  date: string;
  opponent: string;
  fixtureType: string; // HOME | AWAY | NEUTRAL
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  goals: number;
  assists: number;
  shotsAttempted: number;
  shotsOnTarget: number;
  minutesPlayed: number | null;
  source: "native" | "fbref";
}

interface SelectedSeason {
  teamId: string;
  season: string;
  clubName: string;
}

interface PlayerCareerTabProps {
  playerId: string;
  setSelectedFixture: (fixtureId: string) => void;
  setActiveTab: (tab: string) => void;
  clubPrimaryColor?: string;
}

function getResult(log: MatchLog): string {
  if (log.homeScore == null || log.awayScore == null) return "–";
  const isHome = log.fixtureType === "HOME";
  const teamScore = isHome ? log.homeScore : log.awayScore;
  const oppScore = isHome ? log.awayScore : log.homeScore;
  if (teamScore > oppScore) return `W ${teamScore}–${oppScore}`;
  if (teamScore < oppScore) return `L ${teamScore}–${oppScore}`;
  return `D ${teamScore}–${oppScore}`;
}

function getResultColor(log: MatchLog): string {
  if (log.homeScore == null || log.awayScore == null) return "text-foreground/50";
  const isHome = log.fixtureType === "HOME";
  const teamScore = isHome ? log.homeScore : log.awayScore;
  const oppScore = isHome ? log.awayScore : log.homeScore;
  if (teamScore > oppScore) return "text-green-600 font-semibold";
  if (teamScore < oppScore) return "text-red-500 font-semibold";
  return "text-yellow-600 font-semibold";
}

export function PlayerCareerTab({
  playerId,
  setSelectedFixture,
  setActiveTab,
  clubPrimaryColor = "#486D8D",
}: PlayerCareerTabProps) {
  const [selectedSeason, setSelectedSeason] = useState<SelectedSeason | null>(null);
  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set());
  const [expandedFbrefRows, setExpandedFbrefRows] = useState<Set<string>>(new Set());

  // Fetch season stats
  const { data: seasonStats = [], isLoading: statsLoading } = useQuery<SeasonStat[]>({
    queryKey: ["/api/players", playerId, "season-stats"],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/season-stats`);
      if (!res.ok) throw new Error("Failed to fetch season stats");
      return res.json();
    },
    enabled: !!playerId,
  });

  // Fetch match logs when a season is selected
  const { data: matchLogs = [], isLoading: logsLoading } = useQuery<MatchLog[]>({
    queryKey: ["/api/players", playerId, "match-logs", selectedSeason?.teamId, selectedSeason?.season],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSeason?.teamId) params.set("teamId", selectedSeason.teamId);
      if (selectedSeason?.season) params.set("season", selectedSeason.season);
      const res = await fetch(`/api/players/${playerId}/match-logs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch match logs");
      return res.json();
    },
    enabled: !!selectedSeason,
  });

  // Group seasons by club
  const clubMap = new Map<string, { clubId: string; clubName: string; clubLogoPath: string | null; seasons: SeasonStat[] }>();
  for (const s of seasonStats) {
    if (!clubMap.has(s.clubId)) {
      clubMap.set(s.clubId, { clubId: s.clubId, clubName: s.clubName, clubLogoPath: s.clubLogoPath, seasons: [] });
    }
    clubMap.get(s.clubId)!.seasons.push(s);
  }
  // Sort seasons within each club: newest first
  Array.from(clubMap.values()).forEach(club => {
    club.seasons.sort((a: SeasonStat, b: SeasonStat) => b.season.localeCompare(a.season));
  });
  const clubs = Array.from(clubMap.values());

  // On first render, auto-expand the first club
  if (clubs.length > 0 && expandedClubs.size === 0) {
    setExpandedClubs(new Set([clubs[0].clubId]));
  }

  const toggleClub = (clubId: string) => {
    setExpandedClubs(prev => {
      const next = new Set(prev);
      if (next.has(clubId)) next.delete(clubId);
      else next.add(clubId);
      return next;
    });
  };

  const handleSeasonClick = (stat: SeasonStat) => {
    const isSame =
      selectedSeason?.teamId === stat.teamId && selectedSeason?.season === stat.season;
    if (isSame) {
      setSelectedSeason(null);
    } else {
      setSelectedSeason({ teamId: stat.teamId, season: stat.season, clubName: stat.clubName });
    }
  };

  const handleMatchClick = (log: MatchLog) => {
    if (log.hasNativeFixture && log.source === "native") {
      setSelectedFixture(log.fixtureId);
      setActiveTab("attack");
    }
  };

  const toggleFbrefRow = (fixtureId: string) => {
    setExpandedFbrefRows(prev => {
      const next = new Set(prev);
      if (next.has(fixtureId)) next.delete(fixtureId);
      else next.add(fixtureId);
      return next;
    });
  };

  // Aggregate header for selected season match logs
  const aggregate = matchLogs.reduce(
    (acc, log) => ({
      apps: acc.apps + 1,
      goals: acc.goals + log.goals,
      assists: acc.assists + log.assists,
      shots: acc.shots + log.shotsAttempted,
      shotsOnTarget: acc.shotsOnTarget + log.shotsOnTarget,
      mins: acc.mins + (log.minutesPlayed ?? 90),
    }),
    { apps: 0, goals: 0, assists: 0, shots: 0, shotsOnTarget: 0, mins: 0 }
  );
  const g90 = aggregate.mins > 0 ? ((aggregate.goals / aggregate.mins) * 90).toFixed(2) : "–";
  const a90 = aggregate.mins > 0 ? ((aggregate.assists / aggregate.mins) * 90).toFixed(2) : "–";

  if (statsLoading) {
    return (
      <div className="p-8 flex items-center justify-center text-foreground/50 text-sm">
        Loading career data…
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center gap-3 text-center">
        <Trophy className="h-10 w-10 text-foreground/20" />
        <p className="text-sm text-foreground/50">No career data yet.</p>
        <p className="text-xs text-foreground/40">
          Career history appears once match stats are recorded for this player.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-0 min-h-[500px]">
      {/* Left: Club + Season list */}
      <div className="w-72 flex-shrink-0 border-r border-border overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
            Career History
          </h3>
        </div>
        <div className="divide-y divide-border/40">
          {clubs.map(club => (
            <div key={club.clubId}>
              {/* Club header */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                onClick={() => toggleClub(club.clubId)}
              >
                {/* Club logo */}
                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                  {club.clubLogoPath ? (
                    <img
                      src={club.clubLogoPath}
                      alt={club.clubName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs font-bold text-foreground/40">
                      {club.clubName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="flex-1 text-sm font-semibold text-foreground">{club.clubName}</span>
                {expandedClubs.has(club.clubId) ? (
                  <ChevronDown className="h-4 w-4 text-foreground/40 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-foreground/40 flex-shrink-0" />
                )}
              </button>

              {/* Season rows */}
              {expandedClubs.has(club.clubId) && (
                <div className="bg-muted/20">
                  {/* Season list header */}
                  <div className="grid grid-cols-4 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/40 border-b border-border/30">
                    <span>Season</span>
                    <span className="text-center">Apps</span>
                    <span className="text-center">G</span>
                    <span className="text-center">A</span>
                  </div>
                  {club.seasons.map(stat => {
                    const isSelected =
                      selectedSeason?.teamId === stat.teamId &&
                      selectedSeason?.season === stat.season;
                    return (
                      <button
                        key={`${stat.teamId}__${stat.season}`}
                        className={`w-full grid grid-cols-4 px-4 py-2.5 text-left transition-colors hover:bg-muted/60 ${
                          isSelected ? "bg-muted/80 border-l-2" : "border-l-2 border-transparent"
                        }`}
                        style={isSelected ? { borderLeftColor: clubPrimaryColor } : undefined}
                        onClick={() => handleSeasonClick(stat)}
                      >
                        <span
                          className="text-xs font-medium"
                          style={isSelected ? { color: clubPrimaryColor } : undefined}
                        >
                          {stat.season}
                        </span>
                        <span className="text-xs text-center text-foreground/70">{stat.apps}</span>
                        <span className="text-xs text-center text-foreground/70">{stat.goals}</span>
                        <span className="text-xs text-center text-foreground/70">{stat.assists}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Match list */}
      <div className="flex-1 overflow-y-auto">
        {!selectedSeason ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
            <Calendar className="h-10 w-10 text-foreground/20" />
            <p className="text-sm text-foreground/50">Select a season to view match history</p>
          </div>
        ) : (
          <div>
            {/* Season aggregate header */}
            <div
              className="px-6 py-4 border-b border-border"
              style={{ backgroundColor: clubPrimaryColor + "12" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {selectedSeason.clubName} · {selectedSeason.season}
                  </h3>
                  <p className="text-xs text-foreground/50 mt-0.5">Season summary</p>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-3">
                {[
                  { label: "Apps", value: aggregate.apps },
                  { label: "Goals", value: aggregate.goals },
                  { label: "Assists", value: aggregate.assists },
                  { label: "G/90", value: g90 },
                  { label: "A/90", value: a90 },
                  { label: "Shots", value: aggregate.shots },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <div
                      className="text-lg font-bold"
                      style={{ color: clubPrimaryColor }}
                    >
                      {value}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-foreground/50 font-medium">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Match rows */}
            {logsLoading ? (
              <div className="p-6 text-sm text-foreground/50 text-center">Loading matches…</div>
            ) : matchLogs.length === 0 ? (
              <div className="p-6 text-sm text-foreground/50 text-center">No matches found for this season.</div>
            ) : (
              <div>
                {/* Table header */}
                <div className="grid grid-cols-8 px-6 py-2 text-[10px] font-semibold uppercase tracking-wide text-foreground/40 border-b border-border bg-muted/30">
                  <span className="col-span-1">Date</span>
                  <span className="col-span-2">Opponent</span>
                  <span className="text-center">Result</span>
                  <span className="text-center">G</span>
                  <span className="text-center">A</span>
                  <span className="text-center">Shots</span>
                  <span className="text-center">SoT</span>
                </div>
                {matchLogs.map(log => {
                  const isFbref = log.source === "fbref";
                  const isExpanded = expandedFbrefRows.has(log.fixtureId);
                  return (
                    <div key={log.fixtureId}>
                      <div
                        className={`grid grid-cols-8 px-6 py-3 border-b border-border/50 items-center transition-colors ${
                          isFbref
                            ? "cursor-pointer hover:bg-muted/30"
                            : "cursor-pointer hover:bg-muted/50"
                        }`}
                        onClick={() => {
                          if (isFbref) {
                            toggleFbrefRow(log.fixtureId);
                          } else {
                            handleMatchClick(log);
                          }
                        }}
                      >
                        <span className="col-span-1 text-xs text-foreground/60">
                          {new Date(log.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                        <span className="col-span-2 text-xs font-medium text-foreground flex items-center gap-1.5">
                          <span className="text-[10px] text-foreground/40 uppercase font-normal">
                            {log.fixtureType === "HOME" ? "vs" : "@"}
                          </span>
                          {log.opponent}
                          {isFbref && (
                            <span className="ml-1 px-1 py-0.5 text-[9px] uppercase font-bold bg-amber-100 text-amber-700 rounded leading-none">
                              FBref
                            </span>
                          )}
                        </span>
                        <span className={`text-xs text-center ${getResultColor(log)}`}>
                          {getResult(log)}
                        </span>
                        <span className="text-xs text-center text-foreground/70">{log.goals}</span>
                        <span className="text-xs text-center text-foreground/70">{log.assists}</span>
                        <span className="text-xs text-center text-foreground/70">{log.shotsAttempted}</span>
                        <span className="text-xs text-center text-foreground/70">{log.shotsOnTarget}</span>
                      </div>
                      {/* FBref inline expansion */}
                      {isFbref && isExpanded && (
                        <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 text-xs text-amber-800">
                          <p className="font-semibold mb-1 flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> FBref data only
                          </p>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            <div><span className="text-amber-600/70">Goals:</span> {log.goals}</div>
                            <div><span className="text-amber-600/70">Assists:</span> {log.assists}</div>
                            <div><span className="text-amber-600/70">Shots:</span> {log.shotsAttempted}</div>
                            <div><span className="text-amber-600/70">SoT:</span> {log.shotsOnTarget}</div>
                            {log.minutesPlayed != null && (
                              <div><span className="text-amber-600/70">Mins:</span> {log.minutesPlayed}</div>
                            )}
                          </div>
                          <p className="text-amber-600/60 mt-2 text-[10px]">
                            This match was imported from FBref and does not have full native stats.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
