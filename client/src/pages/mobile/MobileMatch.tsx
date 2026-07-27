import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { useClub } from "@/contexts/club-context";
import { Fixture, OppositionTeam } from "@shared/schema";
import { ArrowLeft, AlertTriangle, Plus, X, Link as LinkIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

type Tab = "Details" | "Squad" | "Result" | "Video";

interface SquadPlayer {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  position: string;
  fitnessStatus: string;
  role: string | null;
}

interface VideoItem {
  id: string;
  url: string;
  label?: string;
  footageType?: string;
  cameraPosition?: string;
}

const POSITION_COLORS: Record<string, string> = {
  GK: "bg-yellow-400 text-yellow-900",
  DEF: "bg-blue-500 text-white",
  MID: "bg-green-500 text-white",
  FWD: "bg-red-500 text-white",
};
const POSITION_LABEL: Record<string, string> = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfield",
  FWD: "Forward",
};
const POSITION_ORDER = ["GK", "DEF", "MID", "FWD"];

export default function MobileMatch() {
  const params = useParams<{ fixtureId: string }>();
  const fixtureId = params.fixtureId;
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { selectedClub: club } = useClub();
  const clubColors = club?.colors as { primary?: string } | null | undefined;
  const primaryColor = clubColors?.primary ?? "#16a34a";
  const [activeTab, setActiveTab] = useState<Tab>("Details");

  const { data: fixture } = useQuery<Fixture>({
    queryKey: ["/api/fixture", fixtureId],
    queryFn: async () => {
      const res = await fetch(`/api/fixture/${fixtureId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!fixtureId,
  });

  const { data: competitions = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/competitions", club?.id],
    queryFn: async () => {
      const res = await fetch(`/api/competitions?clubId=${club?.id ?? ""}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!club?.id,
  });

  const { data: oppositionTeams = [] } = useQuery<OppositionTeam[]>({
    queryKey: ["/api/opposition-teams", club?.id],
    queryFn: async () => {
      const res = await fetch(`/api/opposition-teams?clubId=${club?.id ?? ""}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!club?.id,
  });

  const competition = competitions.find(c => c.id === fixture?.competitionId);
  const oppositionTeam = fixture?.oppositionTeamId
    ? oppositionTeams.find(t => t.id === fixture.oppositionTeamId)
    : oppositionTeams.find(t => t.name === fixture?.opponent);

  const { data: squadPlayers = [] } = useQuery<SquadPlayer[]>({
    queryKey: ["/api/fixtures/squad", fixtureId],
    queryFn: async () => {
      const res = await fetch(`/api/fixtures/${fixtureId}/squad`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      // Handle both old (array) and new ({ players, formation }) response shapes
      return Array.isArray(data) ? data : (data.players ?? []);
    },
    enabled: !!fixtureId && activeTab === "Squad",
  });

  const { data: videos = [] } = useQuery<VideoItem[]>({
    queryKey: ["/api/fixtures/videos", fixtureId],
    queryFn: async () => {
      const res = await fetch(`/api/fixtures/${fixtureId}/videos`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!fixtureId && activeTab === "Video",
  });

  // Squad state
  const [localRoles, setLocalRoles] = useState<Record<string, "starter" | "sub" | "none">>({});
  const saveSquadMutation = useMutation({
    mutationFn: async () => {
      const players = squadPlayers.map(p => ({
        userId: p.id,
        role: localRoles[p.id] ?? p.role ?? "starter",
      }));
      return apiRequest("PATCH", `/api/fixtures/${fixtureId}/squad`, { players });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/fixtures/squad", fixtureId] }),
  });

  // Details edit state — synced from fixture once loaded
  const [detailCompetitionId, setDetailCompetitionId] = useState("");
  const [detailDate, setDetailDate] = useState("");
  const [detailTime, setDetailTime] = useState("");
  const [detailVenue, setDetailVenue] = useState("");
  const [detailType, setDetailType] = useState("HOME");
  const [detailStatus, setDetailStatus] = useState("SCHEDULED");
  const [detailNotes, setDetailNotes] = useState("");
  useEffect(() => {
    if (fixture) {
      setDetailCompetitionId(fixture.competitionId ?? "");
      const d = new Date(fixture.date);
      setDetailDate(format(d, "yyyy-MM-dd"));
      setDetailTime(format(d, "HH:mm"));
      setDetailVenue(fixture.venue ?? "");
      setDetailType(fixture.type ?? "HOME");
      setDetailStatus(fixture.status ?? "SCHEDULED");
      setDetailNotes(fixture.notes ?? "");
    }
  }, [fixture?.id]);

  const saveDetailsMutation = useMutation({
    mutationFn: async () => {
      const combinedDate = new Date(`${detailDate}T${detailTime}`);
      return apiRequest("PUT", `/api/fixtures/${fixtureId}`, {
        ...fixture,
        competitionId: detailCompetitionId || null,
        date: combinedDate.toISOString(),
        venue: detailVenue,
        type: detailType,
        status: detailStatus,
        notes: detailNotes,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/fixture", fixtureId] }),
  });

  // Result state — synced from fixture once loaded
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  useEffect(() => {
    if (fixture) {
      setHomeScore(fixture.homeScore ?? 0);
      setAwayScore(fixture.awayScore ?? 0);
    }
  }, [fixture?.id, fixture?.homeScore, fixture?.awayScore]);

  const saveResultMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/fixtures/${fixtureId}`, {
        ...fixture,
        homeScore,
        awayScore,
        status: "COMPLETED",
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/fixture", fixtureId] }),
  });

  // Video state
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [footageType, setFootageType] = useState("Full Game");
  const [cameraPos, setCameraPos] = useState("Sideline");

  const addVideoMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/fixtures/${fixtureId}/videos`, {
        url: videoUrl,
        footageType,
        cameraPosition: cameraPos,
        source: videoUrl.includes("youtube") ? "youtube" : videoUrl.includes("dailymotion") ? "dailymotion" : "storage",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/fixtures/videos", fixtureId] });
      setVideoUrl("");
      setShowAddVideo(false);
    },
  });

  const removeVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      return apiRequest("DELETE", `/api/fixtures/${fixtureId}/videos/${videoId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/fixtures/videos", fixtureId] }),
  });

  const isHome = fixture?.type === "HOME";
  const homeTeamLabel = isHome ? "Us" : fixture?.opponent ?? "Away";
  const awayTeamLabel = isHome ? fixture?.opponent ?? "Away" : "Us";

  const effectiveRole = (p: SquadPlayer) => localRoles[p.id] ?? p.role ?? "starter";
  const starters = squadPlayers.filter(p => effectiveRole(p) === "starter");
  const subs = squadPlayers.filter(p => effectiveRole(p) === "sub");
  const notInSquad = squadPlayers.filter(p => effectiveRole(p) === "none");

  const TABS: Tab[] = ["Details", "Squad", "Result", "Video"];

  if (!fixture) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center py-24">
          <p className="text-gray-400 text-sm">Loading match...</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* Match header */}
      <div className="px-4 pt-10 pb-4" style={{ backgroundColor: primaryColor }}>
        <button onClick={() => window.history.back()} className="mb-3 p-1 -ml-1">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div className="flex items-center justify-between">
          {/* Home side */}
          <div className="flex-1 flex flex-col items-center gap-1">
            {club?.logoPath ? (
              <img src={club.logoPath} alt={club.name} className="h-10 w-auto max-w-[60px] object-contain" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">
                {club?.name?.slice(0, 2).toUpperCase() ?? "US"}
              </div>
            )}
            <p className="text-white text-[11px] font-medium text-center leading-tight">{homeTeamLabel}</p>
          </div>
          {/* Score / vs */}
          <div className="text-center px-2">
            {fixture.status === "COMPLETED" ? (
              <div className="text-white font-bold text-xl">{fixture.homeScore ?? 0} – {fixture.awayScore ?? 0}</div>
            ) : (
              <div className="text-white/70 font-medium text-xs">vs</div>
            )}
            <p className="text-white/60 text-[10px] mt-0.5">{format(new Date(fixture.date), "d MMM, h:mm a")}</p>
          </div>
          {/* Away side */}
          <div className="flex-1 flex flex-col items-center gap-1">
            {oppositionTeam?.logoPath ? (
              <img src={oppositionTeam.logoPath} alt={fixture.opponent ?? ""} className="h-10 w-auto max-w-[60px] object-contain" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">
                {fixture.opponent?.slice(0, 2).toUpperCase()}
              </div>
            )}
            <p className="text-white text-[11px] font-medium text-center leading-tight">{awayTeamLabel}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 text-xs font-medium transition-colors relative",
                activeTab === tab ? "" : "text-gray-400"
              )}
              style={activeTab === tab ? { color: primaryColor } : undefined}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ backgroundColor: primaryColor }} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* DETAILS TAB */}
        {activeTab === "Details" && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-50">
              {/* Competition */}
              <div className="flex items-center px-4 py-3 gap-3">
                <span className="text-[11px] text-gray-400 w-24 shrink-0">Competition</span>
                <select
                  value={detailCompetitionId}
                  onChange={e => setDetailCompetitionId(e.target.value)}
                  className="flex-1 text-[12px] text-gray-700 font-medium bg-transparent outline-none"
                >
                  <option value="">— none —</option>
                  {competitions.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {/* Date */}
              <div className="flex items-center px-4 py-3 gap-3">
                <span className="text-[11px] text-gray-400 w-24 shrink-0">Date</span>
                <input
                  type="date"
                  value={detailDate}
                  onChange={e => setDetailDate(e.target.value)}
                  className="flex-1 text-[12px] text-gray-700 font-medium bg-transparent outline-none"
                />
              </div>
              {/* Kick-off */}
              <div className="flex items-center px-4 py-3 gap-3">
                <span className="text-[11px] text-gray-400 w-24 shrink-0">Kick-off</span>
                <input
                  type="time"
                  value={detailTime}
                  onChange={e => setDetailTime(e.target.value)}
                  className="flex-1 text-[12px] text-gray-700 font-medium bg-transparent outline-none"
                />
              </div>
              {/* Venue */}
              <div className="flex items-center px-4 py-3 gap-3">
                <span className="text-[11px] text-gray-400 w-24 shrink-0">Venue</span>
                <input
                  type="text"
                  value={detailVenue}
                  onChange={e => setDetailVenue(e.target.value)}
                  placeholder="e.g. Home Stadium"
                  className="flex-1 text-[12px] text-gray-700 font-medium bg-transparent outline-none placeholder:text-gray-300"
                />
              </div>
              {/* Format */}
              <div className="flex items-center px-4 py-3 gap-3">
                <span className="text-[11px] text-gray-400 w-24 shrink-0">Format</span>
                <select
                  value={detailType}
                  onChange={e => setDetailType(e.target.value)}
                  className="flex-1 text-[12px] text-gray-700 font-medium bg-transparent outline-none"
                >
                  <option value="HOME">Home</option>
                  <option value="AWAY">Away</option>
                  <option value="NEUTRAL">Neutral</option>
                </select>
              </div>
              {/* Status */}
              <div className="flex items-center px-4 py-3 gap-3">
                <span className="text-[11px] text-gray-400 w-24 shrink-0">Status</span>
                <select
                  value={detailStatus}
                  onChange={e => setDetailStatus(e.target.value)}
                  className="flex-1 text-[12px] text-gray-700 font-medium bg-transparent outline-none"
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NO_CONTEST">No Contest</option>
                </select>
              </div>
              {/* Notes */}
              <div className="px-4 py-3">
                <p className="text-[11px] text-gray-400 mb-1.5">Notes</p>
                <textarea
                  value={detailNotes}
                  onChange={e => setDetailNotes(e.target.value)}
                  placeholder="Optional match notes..."
                  rows={3}
                  className="w-full text-[12px] text-gray-700 bg-transparent outline-none resize-none placeholder:text-gray-300"
                />
              </div>
            </div>
            {/* Save button */}
            <button
              onClick={() => saveDetailsMutation.mutate()}
              disabled={saveDetailsMutation.isPending}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: primaryColor }}
            >
              {saveDetailsMutation.isPending ? "Saving…" : saveDetailsMutation.isSuccess ? "Saved ✓" : "Save Details"}
            </button>
          </div>
        )}

        {/* SQUAD TAB */}
        {activeTab === "Squad" && (
          <div className="space-y-4">
            {/* Shared render helpers */}
            {(() => {
              const setRole = (userId: string, role: "starter" | "sub" | "none") => {
                setLocalRoles(prev => ({ ...prev, [userId]: role }));
              };

              const renderPlayer = (player: SquadPlayer, isFirst: boolean, section: "starter" | "sub" | "none") => {
                const notFit = player.fitnessStatus && player.fitnessStatus !== "Fit";
                const btnBase = "w-7 h-7 rounded-full text-xs font-bold transition-colors flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-gray-200";
                return (
                  <div key={player.id} className={cn("flex items-center px-4 py-2.5 gap-2", !isFirst && "border-t border-gray-50")}>
                    <span className="text-[11px] text-gray-400 w-5 text-center shrink-0">{player.jerseyNumber ?? "—"}</span>
                    <span className="flex-1 text-xs font-medium text-gray-800 truncate">{player.firstName} {player.lastName}</span>
                    {notFit ? (
                      <span className="text-[10px] text-red-400 font-medium px-2">{player.fitnessStatus}</span>
                    ) : (
                      <div className="flex items-center gap-1 shrink-0">
                        {section !== "starter" && (
                          <button onClick={() => setRole(player.id, "starter")} className={btnBase} style={{ backgroundColor: undefined }} title="Make Starter">
                            <span style={{ color: primaryColor }} className="font-bold">✓</span>
                          </button>
                        )}
                        {section !== "sub" && (
                          <button onClick={() => setRole(player.id, "sub")} className={btnBase} title="Make Substitute">
                            S
                          </button>
                        )}
                        {section !== "none" && (
                          <button onClick={() => setRole(player.id, "none")} className={btnBase} title="Remove from Squad">
                            <span className="text-red-400">✗</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              };

              const renderGroupedSection = (title: string, players: SquadPlayer[], section: "starter" | "sub" | "none") => {
                const groups = POSITION_ORDER.map(pos => ({
                  pos,
                  label: POSITION_LABEL[pos] ?? pos,
                  players: players.filter(p => p.position === pos),
                })).filter(g => g.players.length > 0);
                const ungrouped = players.filter(p => !POSITION_ORDER.includes(p.position));
                return (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-50 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700">{title}</span>
                      <span className="text-[10px] text-gray-400">{players.length}</span>
                    </div>
                    {players.length === 0 && <p className="text-xs text-gray-300 text-center py-4">None</p>}
                    {groups.map((group, gi) => (
                      <div key={group.pos}>
                        <div className={cn("px-4 py-1.5 flex items-center gap-2 bg-gray-50", gi > 0 && "border-t border-gray-100")}>
                          <span className="text-[10px] text-gray-500 font-semibold">{group.label}</span>
                          <span className="text-[10px] text-gray-300 ml-auto">{group.players.length}</span>
                        </div>
                        {group.players.map((p, i) => renderPlayer(p, i === 0, section))}
                      </div>
                    ))}
                    {ungrouped.map((p, i) => renderPlayer(p, i === 0 && groups.length === 0, section))}
                  </div>
                );
              };

              return (
                <>
                  {renderGroupedSection("Starters", starters, "starter")}
                  {renderGroupedSection("Substitutes", subs, "sub")}
                  {renderGroupedSection("Not in Squad", notInSquad, "none")}
                </>
              );
            })()}

            <button
              onClick={() => saveSquadMutation.mutate()}
              disabled={saveSquadMutation.isPending}
              className="w-full text-white rounded-xl py-3.5 text-sm font-semibold"
              style={{ backgroundColor: primaryColor }}
            >
              {saveSquadMutation.isPending ? "Saving..." : "Confirm Squad"}
            </button>
          </div>
        )}

        {/* RESULT TAB */}
        {activeTab === "Result" && (
          <div className="space-y-4">
            {fixture.status !== "COMPLETED" && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                <p className="text-xs text-orange-600">Result not yet entered for this match.</p>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4 text-center">Match Score</p>
              <div className="flex items-center justify-between gap-4">
                {[
                  { label: homeTeamLabel, score: homeScore, setScore: setHomeScore },
                  { label: awayTeamLabel, score: awayScore, setScore: setAwayScore },
                ].map(team => (
                  <div key={team.label} className="flex-1 flex flex-col items-center gap-2">
                    <p className="text-[11px] text-gray-500 font-medium text-center truncate w-full">{team.label}</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => team.setScore(Math.max(0, team.score - 1))}
                        className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold active:bg-gray-200"
                      >
                        −
                      </button>
                      <span className="text-3xl font-bold text-gray-800 w-8 text-center">{team.score}</span>
                      <button
                        onClick={() => team.setScore(team.score + 1)}
                        className="h-8 w-8 rounded-full flex items-center justify-center font-bold"
                        style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => saveResultMutation.mutate()}
              disabled={saveResultMutation.isPending}
              className="w-full text-white rounded-xl py-3.5 text-sm font-semibold"
              style={{ backgroundColor: primaryColor }}
            >
              {saveResultMutation.isPending ? "Saving..." : "Save Result"}
            </button>
            {saveResultMutation.isSuccess && (
              <p className="text-center text-xs font-medium" style={{ color: primaryColor }}>Result saved!</p>
            )}
          </div>
        )}

        {/* VIDEO TAB */}
        {activeTab === "Video" && (
          <div className="space-y-3">
            {videos.length === 0 && !showAddVideo && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No videos added yet</p>
              </div>
            )}

            {videos.map(v => (
              <div key={v.id} className="bg-white rounded-xl shadow-sm p-3 flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <LinkIcon className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{v.url || v.label}</p>
                  <div className="flex gap-2 mt-1">
                    {v.footageType && (
                      <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{v.footageType}</span>
                    )}
                    {v.cameraPosition && (
                      <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{v.cameraPosition}</span>
                    )}
                    <span className="text-[9px] font-medium flex items-center gap-0.5" style={{ color: primaryColor }}>
                      <Check className="h-2.5 w-2.5" /> Saved
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeVideoMutation.mutate(v.id)}
                  className="text-gray-300 hover:text-red-400 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {showAddVideo ? (
              <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-700">Add Video</h4>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wide">Video URL</label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/..."
                    className="mt-1 w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400"
                  />
                  {videoUrl.toLowerCase().includes("youtube") && (
                    <p className="text-[10px] mt-1" style={{ color: primaryColor }}>✓ YouTube link detected</p>
                  )}
                  {videoUrl.toLowerCase().includes("dailymotion") && (
                    <p className="text-[10px] mt-1" style={{ color: primaryColor }}>✓ Dailymotion link detected</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wide">Footage Type</label>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {["1st Half", "2nd Half", "Full Game", "Training"].map(ft => (
                      <button
                        key={ft}
                        onClick={() => setFootageType(ft)}
                        className="text-[10px] px-2.5 py-1 rounded-full border transition-colors"
                        style={footageType === ft
                          ? { backgroundColor: primaryColor, color: "#fff", borderColor: primaryColor }
                          : { borderColor: "#e5e7eb", color: "#6b7280" }
                        }
                      >
                        {ft}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wide">Camera Position</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {["Sideline", "Behind Goal", "Elevated", "Other"].map(cp => (
                      <button
                        key={cp}
                        onClick={() => setCameraPos(cp)}
                        className="text-[10px] px-2.5 py-1.5 rounded-lg border text-center transition-colors"
                        style={cameraPos === cp
                          ? { backgroundColor: primaryColor, color: "#fff", borderColor: primaryColor }
                          : { borderColor: "#e5e7eb", color: "#6b7280" }
                        }
                      >
                        {cp}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => addVideoMutation.mutate()}
                    disabled={!videoUrl || addVideoMutation.isPending}
                    className="flex-1 text-white rounded-lg py-2.5 text-xs font-semibold disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {addVideoMutation.isPending ? "Saving..." : "Save Video"}
                  </button>
                  <button
                    onClick={() => setShowAddVideo(false)}
                    className="px-4 border border-gray-200 rounded-lg text-xs text-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddVideo(true)}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 flex items-center justify-center gap-2 text-xs text-gray-400"
              >
                <Plus className="h-4 w-4" />
                Add another video
              </button>
            )}

            {videos.length > 0 && (
              <button
                className="w-full text-white rounded-xl py-3.5 text-sm font-semibold"
                style={{ backgroundColor: primaryColor }}
              >
                Submit {videos.length} Video{videos.length !== 1 ? "s" : ""} for Processing
              </button>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
