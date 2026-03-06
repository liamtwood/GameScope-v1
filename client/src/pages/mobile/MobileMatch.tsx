import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { useClub } from "@/contexts/club-context";
import { Fixture } from "@shared/schema";
import { ArrowLeft, AlertTriangle, Plus, X, Link as LinkIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
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
  Goalkeeper: "bg-yellow-400 text-yellow-900",
  Defender: "bg-blue-500 text-white",
  Midfield: "bg-green-500 text-white",
  Forward: "bg-red-500 text-white",
};
const POSITION_SHORT: Record<string, string> = {
  Goalkeeper: "GK",
  Defender: "DEF",
  Midfield: "MID",
  Forward: "FWD",
};

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

  const { data: squadPlayers = [] } = useQuery<SquadPlayer[]>({
    queryKey: ["/api/fixtures/squad", fixtureId],
    queryFn: async () => {
      const res = await fetch(`/api/fixtures/${fixtureId}/squad`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
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
  const [localRoles, setLocalRoles] = useState<Record<string, "starter" | "sub">>({});
  const toggleRole = (userId: string, currentRole: string | null) => {
    const cur = localRoles[userId] ?? currentRole ?? "starter";
    setLocalRoles(prev => ({ ...prev, [userId]: cur === "starter" ? "sub" : "starter" }));
  };

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

  // Result state
  const [homeScore, setHomeScore] = useState<number>(fixture?.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState<number>(fixture?.awayScore ?? 0);

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

  const starters = squadPlayers.filter(p => (localRoles[p.id] ?? p.role) === "starter");
  const subs = squadPlayers.filter(p => (localRoles[p.id] ?? p.role) !== "starter");

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
          <div className="flex-1 text-center">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs mx-auto mb-1">US</div>
            <p className="text-white text-[11px] font-medium">{homeTeamLabel}</p>
          </div>
          <div className="text-center px-2">
            {fixture.status === "COMPLETED" ? (
              <div className="text-white font-bold text-xl">{fixture.homeScore ?? 0} – {fixture.awayScore ?? 0}</div>
            ) : (
              <div className="text-green-200 font-medium text-xs">vs</div>
            )}
            <p className="text-green-200 text-[10px] mt-0.5">{format(new Date(fixture.date), "d MMM, h:mm a")}</p>
          </div>
          <div className="flex-1 text-center">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs mx-auto mb-1">
              {fixture.opponent?.slice(0, 2).toUpperCase()}
            </div>
            <p className="text-white text-[11px] font-medium">{awayTeamLabel}</p>
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
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {[
              { label: "Competition", value: (fixture as any).competition || "—" },
              { label: "Date", value: format(new Date(fixture.date), "EEEE, d MMMM yyyy") },
              { label: "Kick-off", value: format(new Date(fixture.date), "h:mm a") },
              { label: "Venue", value: fixture.venue || "—" },
              { label: "Format", value: fixture.type },
              { label: "Status", value: fixture.status },
            ].map((row, i) => (
              <div key={row.label} className={cn("flex items-center px-4 py-3", i > 0 && "border-t border-gray-50")}>
                <span className="text-[11px] text-gray-400 w-24 shrink-0">{row.label}</span>
                <span className="text-[12px] text-gray-700 font-medium">{row.value}</span>
              </div>
            ))}
            {fixture.notes && (
              <div className="border-t border-gray-50 px-4 py-3">
                <p className="text-[11px] text-gray-400 mb-1">Notes</p>
                <p className="text-xs text-gray-600">{fixture.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* SQUAD TAB */}
        {activeTab === "Squad" && (
          <div className="space-y-4">
            <p className="text-[10px] text-gray-400 text-center">Tap a role badge to toggle between Starter and Sub.</p>

            {[{ title: "Starters", players: starters }, { title: "Substitutes", players: subs }].map(section => (
              <div key={section.title} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">{section.title}</span>
                  <span className="text-[10px] text-gray-400">{section.players.length}</span>
                </div>
                {section.players.length === 0 && (
                  <p className="text-xs text-gray-300 text-center py-4">None</p>
                )}
                {section.players.map((player, i) => {
                  const role = localRoles[player.id] ?? player.role ?? "starter";
                  const isInjured = player.fitnessStatus === "Injured";
                  const posShort = POSITION_SHORT[player.position] ?? player.position?.slice(0, 3).toUpperCase();
                  const posColor = POSITION_COLORS[player.position] ?? "bg-gray-200 text-gray-700";
                  return (
                    <div key={player.id} className={cn("flex items-center px-4 py-2.5 gap-3", i > 0 && "border-t border-gray-50")}>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", posColor)}>{posShort}</span>
                      <span className="text-[11px] text-gray-400 w-5 text-center shrink-0">{player.jerseyNumber ?? "—"}</span>
                      <span className="flex-1 text-xs font-medium text-gray-800 truncate">
                        {player.firstName} {player.lastName}
                      </span>
                      {isInjured ? (
                        <span className="text-[10px] text-red-500 font-medium">Injured</span>
                      ) : (
                        <button
                          onClick={() => toggleRole(player.id, player.role)}
                          className={cn(
                            "text-[10px] font-medium px-2.5 py-1 rounded-full transition-colors",
                            role !== "starter" ? "bg-gray-100 text-gray-500" : ""
                          )}
                          style={role === "starter" ? { backgroundColor: `${primaryColor}20`, color: primaryColor } : undefined}
                        >
                          {role === "starter" ? "✓ Starter" : "⇄ Sub"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

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
