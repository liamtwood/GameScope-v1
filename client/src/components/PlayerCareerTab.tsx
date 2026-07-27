import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, ExternalLink, Trophy, Calendar } from "lucide-react";

// ── Unified API shapes ─────────────────────────────────────────────────────

interface SeasonStat {
  id: string;
  season: string;
  clubName: string;
  /** null for fbref rows */
  clubId: string | null;
  /** null for fbref rows */
  clubLogoPath: string | null;
  /** null for fbref rows */
  teamId: string | null;
  /** null for fbref rows */
  teamName: string | null;
  competition: string | null;
  leagueRank: string | null;
  source: "native" | "fbref";
  /** Flat JSONB blob — read via STAT_DEFINITIONS keys */
  stats: Record<string, number>;
}

interface MatchLog {
  id: string;
  hasNativeFixture: boolean;
  /** null for fbref rows not yet linked to a native fixture */
  fixtureId: string | null;
  date: string | Date;
  opponent: string;
  /** "Home" | "Away" | "Neutral" */
  venue: string | null;
  /** e.g. "W 2–1" – populated for fbref rows; null for native (use scores) */
  result: string | null;
  competition: string | null;
  clubName: string | null;
  /** "HOME" | "AWAY" | "NEUTRAL" – populated for native rows */
  fixtureType: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string | null;
  goals: number;
  assists: number;
  shotsAttempted: number;
  shotsOnTarget: number;
  minutesPlayed: number | null;
  source: "native" | "fbref";
  stats: Record<string, number>;
}

interface SelectedSeason {
  season: string;
  clubName: string;
  /** teamId for native seasons; null for fbref seasons */
  teamId: string | null;
}

interface PlayerCareerTabProps {
  playerId: string;
  setSelectedFixture: (fixtureId: string) => void;
  setActiveTab: (tab: string) => void;
  clubPrimaryColor?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function statVal(stats: Record<string, number>, key: string): number {
  return stats[key] ?? 0;
}

/** Result string for display.
 *  For fbref rows we use the pre-computed `result` field.
 *  For native rows we derive it from scores + fixtureType. */
function getResultText(log: MatchLog): string {
  if (log.result) return log.result;
  if (log.homeScore == null || log.awayScore == null) return "–";
  const isHome = log.fixtureType === "HOME";
  const teamScore = isHome ? log.homeScore : log.awayScore;
  const oppScore  = isHome ? log.awayScore : log.homeScore;
  if (teamScore > oppScore) return `W ${teamScore}–${oppScore}`;
  if (teamScore < oppScore) return `L ${teamScore}–${oppScore}`;
  return `D ${teamScore}–${oppScore}`;
}

function getResultColor(text: string): string {
  if (text.startsWith("W")) return "text-green-600 font-semibold";
  if (text.startsWith("L")) return "text-red-500 font-semibold";
  if (text.startsWith("D")) return "text-yellow-600 font-semibold";
  return "text-foreground/50";
}

function venueLabel(log: MatchLog): string {
  if (log.source === "fbref") {
    return log.venue === "Home" ? "vs" : log.venue === "Away" ? "@" : "~";
  }
  return log.fixtureType === "HOME" ? "vs" : log.fixtureType === "AWAY" ? "@" : "~";
}

// ── Component ──────────────────────────────────────────────────────────────

export function PlayerCareerTab({
  playerId,
  setSelectedFixture,
  setActiveTab,
  clubPrimaryColor = "#486D8D",
}: PlayerCareerTabProps) {
  const [selectedSeason, setSelectedSeason] = useState<SelectedSeason | null>(null);
  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch season stats (merged native + fbref)
  const { data: seasonStats = [], isLoading: statsLoading } = useQuery<SeasonStat[]>({
    queryKey: ["/api/players", playerId, "season-stats"],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/season-stats`);
      if (!res.ok) throw new Error("Failed to fetch season stats");
      return res.json();
    },
    enabled: !!playerId,
  });

  // Fetch match logs when a season is selected — scoped to the selected club.
  // Native seasons pass teamId; fbref seasons pass clubName. Both also pass season.
  const { data: matchLogs = [], isLoading: logsLoading } = useQuery<MatchLog[]>({
    queryKey: ["/api/players", playerId, "match-logs", selectedSeason?.season, selectedSeason?.clubName, selectedSeason?.teamId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSeason?.season)   params.set("season",   selectedSeason.season);
      if (selectedSeason?.clubName) params.set("clubName", selectedSeason.clubName);
      if (selectedSeason?.teamId)   params.set("teamId",   selectedSeason.teamId);
      const res = await fetch(`/api/players/${playerId}/match-logs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch match logs");
      return res.json();
    },
    enabled: !!selectedSeason,
  });

  // Group seasons by club name
  const clubMap = new Map<string, { clubName: string; clubLogoPath: string | null; seasons: SeasonStat[] }>();
  for (const s of seasonStats) {
    if (!clubMap.has(s.clubName)) {
      clubMap.set(s.clubName, { clubName: s.clubName, clubLogoPath: s.clubLogoPath, seasons: [] });
    }
    clubMap.get(s.clubName)!.seasons.push(s);
  }
  // Sort seasons within each club: newest first
  Array.from(clubMap.values()).forEach(club => {
    club.seasons.sort((a, b) => b.season.localeCompare(a.season));
  });
  const clubList = Array.from(clubMap.values());

  // Auto-expand the first club on first render
  if (clubList.length > 0 && expandedClubs.size === 0) {
    setExpandedClubs(new Set([clubList[0].clubName]));
  }

  const toggleClub = (clubName: string) => {
    setExpandedClubs(prev => {
      const next = new Set(prev);
      if (next.has(clubName)) next.delete(clubName);
      else next.add(clubName);
      return next;
    });
  };

  const handleSeasonClick = (stat: SeasonStat) => {
    const isSame =
      selectedSeason?.season === stat.season &&
      selectedSeason?.clubName === stat.clubName &&
      selectedSeason?.teamId === stat.teamId;
    if (isSame) {
      setSelectedSeason(null);
    } else {
      setSelectedSeason({
        season: stat.season,
        clubName: stat.clubName,
        teamId: stat.teamId ?? null,
      });
    }
  };

  const handleMatchClick = (log: MatchLog) => {
    if (log.hasNativeFixture && log.source === "native" && log.fixtureId) {
      setSelectedFixture(log.fixtureId);
      setActiveTab("attack");
    }
  };

  const toggleRow = (rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  // Server-side scoping already handles club + team filtering via clubName/teamId params.
  // filteredLogs is just matchLogs when a season is selected.
  const filteredLogs = selectedSeason ? matchLogs : [];

  // Aggregate header for selected season
  const aggregate = filteredLogs.reduce(
    (acc, log) => ({
      apps:         acc.apps + 1,
      goals:        acc.goals + log.goals,
      assists:      acc.assists + log.assists,
      shots:        acc.shots + log.shotsAttempted,
      shotsOnTarget:acc.shotsOnTarget + log.shotsOnTarget,
      mins:         acc.mins + ((log.minutesPlayed ?? statVal(log.stats, "min_played")) || 90),
    }),
    { apps: 0, goals: 0, assists: 0, shots: 0, shotsOnTarget: 0, mins: 0 }
  );
  const g90 = aggregate.mins > 0 ? ((aggregate.goals / aggregate.mins) * 90).toFixed(2) : "–";
  const a90 = aggregate.mins > 0 ? ((aggregate.assists / aggregate.mins) * 90).toFixed(2) : "–";

  // ── Loading / empty states ─────────────────────────────────────────────

  if (statsLoading) {
    return (
      <div className="p-8 flex items-center justify-center text-foreground/50 text-sm">
        Loading career data…
      </div>
    );
  }

  if (clubList.length === 0) {
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

  // ── Render ─────────────────────────────────────────────────────────────

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
          {clubList.map(club => (
            <div key={club.clubName}>
              {/* Club header */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                onClick={() => toggleClub(club.clubName)}
              >
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
                {expandedClubs.has(club.clubName) ? (
                  <ChevronDown className="h-4 w-4 text-foreground/40 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-foreground/40 flex-shrink-0" />
                )}
              </button>

              {/* Season rows */}
              {expandedClubs.has(club.clubName) && (
                <div className="bg-muted/20">
                  <div className="grid grid-cols-4 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/40 border-b border-border/30">
                    <span>Season</span>
                    <span className="text-center">Apps</span>
                    <span className="text-center">G</span>
                    <span className="text-center">A</span>
                  </div>
                  {club.seasons.map(stat => {
                    const isSelected =
                      selectedSeason?.season === stat.season &&
                      selectedSeason?.clubName === stat.clubName &&
                      selectedSeason?.teamId === (stat.teamId ?? null);
                    const apps    = statVal(stat.stats, "mp");
                    const goals   = statVal(stat.stats, "goals");
                    const assists = statVal(stat.stats, "assists");
                    return (
                      <button
                        key={stat.id}
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
                        <span className="text-xs text-center text-foreground/70">{apps || "–"}</span>
                        <span className="text-xs text-center text-foreground/70">{goals}</span>
                        <span className="text-xs text-center text-foreground/70">{assists}</span>
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
                  { label: "Apps",   value: aggregate.apps   },
                  { label: "Goals",  value: aggregate.goals  },
                  { label: "Assists",value: aggregate.assists },
                  { label: "G/90",   value: g90              },
                  { label: "A/90",   value: a90              },
                  { label: "Shots",  value: aggregate.shots  },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <div className="text-lg font-bold" style={{ color: clubPrimaryColor }}>
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
            ) : filteredLogs.length === 0 ? (
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
                {filteredLogs.map(log => {
                  const isFbref     = log.source === "fbref";
                  const isExpanded  = expandedRows.has(log.id);
                  const resultText  = getResultText(log);
                  const resultColor = getResultColor(resultText);
                  const vLabel      = venueLabel(log);
                  return (
                    <div key={log.id}>
                      <div
                        className={`grid grid-cols-8 px-6 py-3 border-b border-border/50 items-center transition-colors cursor-pointer ${
                          isFbref ? "hover:bg-muted/30" : "hover:bg-muted/50"
                        }`}
                        onClick={() => {
                          if (isFbref) {
                            toggleRow(log.id);
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
                            {vLabel}
                          </span>
                          {log.opponent}
                          {isFbref && (
                            <span className="ml-1 px-1 py-0.5 text-[9px] uppercase font-bold bg-amber-100 text-amber-700 rounded leading-none">
                              FBref
                            </span>
                          )}
                        </span>
                        <span className={`text-xs text-center ${resultColor}`}>
                          {resultText}
                        </span>
                        <span className="text-xs text-center text-foreground/70">{log.goals}</span>
                        <span className="text-xs text-center text-foreground/70">{log.assists}</span>
                        <span className="text-xs text-center text-foreground/70">{log.shotsAttempted}</span>
                        <span className="text-xs text-center text-foreground/70">{log.shotsOnTarget}</span>
                      </div>

                      {/* FBref inline expansion — shows extra stats from JSONB blob */}
                      {isFbref && isExpanded && (
                        <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 text-xs text-amber-800">
                          <p className="font-semibold mb-2 flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> FBref match data
                            {log.competition && (
                              <span className="ml-1 text-amber-600/70 font-normal">· {log.competition}</span>
                            )}
                          </p>
                          <div className="grid grid-cols-4 gap-x-4 gap-y-1 mt-1">
                            {log.minutesPlayed != null && (
                              <div><span className="text-amber-600/70">Mins:</span> {log.minutesPlayed}</div>
                            )}
                            <div><span className="text-amber-600/70">Goals:</span> {log.goals}</div>
                            <div><span className="text-amber-600/70">Assists:</span> {log.assists}</div>
                            <div><span className="text-amber-600/70">Shots:</span> {log.shotsAttempted}</div>
                            <div><span className="text-amber-600/70">SoT:</span> {log.shotsOnTarget}</div>
                            {(log.stats.crosses ?? 0) > 0 && (
                              <div><span className="text-amber-600/70">Crosses:</span> {log.stats.crosses}</div>
                            )}
                            {(log.stats.tackles_won ?? 0) > 0 && (
                              <div><span className="text-amber-600/70">TklW:</span> {log.stats.tackles_won}</div>
                            )}
                            {(log.stats.interceptions ?? 0) > 0 && (
                              <div><span className="text-amber-600/70">Int:</span> {log.stats.interceptions}</div>
                            )}
                            {(log.stats.fouls_committed ?? 0) > 0 && (
                              <div><span className="text-amber-600/70">Fls:</span> {log.stats.fouls_committed}</div>
                            )}
                            {(log.stats.fouls_won ?? 0) > 0 && (
                              <div><span className="text-amber-600/70">Fld:</span> {log.stats.fouls_won}</div>
                            )}
                          </div>
                          <p className="text-amber-600/50 mt-2 text-[10px]">
                            Imported from FBref — no full GPS/tracking data available.
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
