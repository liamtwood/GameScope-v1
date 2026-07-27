import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ChevronDown, Save, Check } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Player {
  id: string;
  firstName?: string;
  lastName?: string;
  avatarPath?: string | null;
  jerseyNumber?: number | null;
  position?: string | null;
  starPlayer?: boolean;
  fitnessStatus?: string | null;
}

interface FormationPitchProps {
  players: Player[];
  clubPrimary?: string;
  /** Override click handler — used in auto mode to navigate to player profile */
  onPlayerClick?: (id: string) => void;
  /** Show formation picker + edit mode (lineup pages) */
  showFormationPicker?: boolean;
  /** When set: load saved lineup from DB and enable Save */
  fixtureId?: string;
}

// ── Formations ────────────────────────────────────────────────────────────────
const FORMATIONS = [
  { label: "4-3-3",   def: 4, mid: 3, fwd: 3 },
  { label: "4-4-2",   def: 4, mid: 4, fwd: 2 },
  { label: "4-5-1",   def: 4, mid: 5, fwd: 1 },
  { label: "4-2-4",   def: 4, mid: 2, fwd: 4 },
  { label: "4-1-4-1", def: 4, mid: 5, fwd: 1 },
  { label: "3-5-2",   def: 3, mid: 5, fwd: 2 },
  { label: "3-4-3",   def: 3, mid: 4, fwd: 3 },
  { label: "5-3-2",   def: 5, mid: 3, fwd: 2 },
  { label: "5-4-1",   def: 5, mid: 4, fwd: 1 },
  { label: "4-3-2-1", def: 4, mid: 5, fwd: 1 },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
const getPositionCategory = (position: string): "GK" | "DEF" | "MID" | "FWD" => {
  const p = (position || "").toLowerCase();
  if (p === "gk" || p === "goalkeeper") return "GK";
  if (p === "def" || p === "defender") return "DEF";
  if (p === "mid" || p === "midfield" || p === "midfielder") return "MID";
  if (p === "fwd" || p === "forward" || p === "attacker" || p === "striker") return "FWD";
  return "MID";
};

const getInitials = (p: Player) =>
  `${p.firstName?.[0] || ""}${p.lastName?.[0] || ""}`;

const rowPositions = (count: number, y: number) => {
  if (count === 0) return [];
  if (count === 1) return [{ x: 50, y }];
  const margin = 12;
  const span = 76;
  return Array.from({ length: count }, (_, i) => ({
    x: margin + (span / (count - 1)) * i,
    y,
  }));
};

const byJersey = (a: Player, b: Player) =>
  (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999);

// ── Component ─────────────────────────────────────────────────────────────────
export function FormationPitch({
  players,
  clubPrimary = "#CC4125",
  onPlayerClick,
  showFormationPicker = false,
  fixtureId,
}: FormationPitchProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [selectedFormation, setSelectedFormation] = useState("4-3-3");
  const [initialized, setInitialized] = useState(false);
  const [manualStarterIds, setManualStarterIds] = useState<Set<string> | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  // Sub selected for a swap — null means no pending substitution
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  // ── Load saved squad when fixtureId is present ───────────────────────────
  const { data: squadData, isLoading: squadLoading } = useQuery<{
    players: Array<{ id: string; role: string }>;
    formation: string | null;
  }>({
    queryKey: ["/api/fixtures", fixtureId, "squad"],
    queryFn: () => fetch(`/api/fixtures/${fixtureId}/squad`).then(r => r.json()),
    enabled: !!fixtureId && showFormationPicker,
  });

  // ── Save mutation ────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (payload: { players: { userId: string; role: string }[]; formation: string }) => {
      const res = await fetch(`/api/fixtures/${fixtureId}/squad`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      setIsDirty(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
      queryClient.invalidateQueries({ queryKey: ["/api/fixtures", fixtureId, "squad"] });
    },
  });

  // ── Initialise from DB data or star players ──────────────────────────────
  const initFromStars = useCallback(() => {
    const starIds = new Set(players.filter(p => p.starPlayer).map(p => p.id));
    setManualStarterIds(starIds);
    const dCount = players.filter(p => p.starPlayer && getPositionCategory(p.position ?? "MID") === "DEF").length;
    const mCount = players.filter(p => p.starPlayer && getPositionCategory(p.position ?? "MID") === "MID").length;
    const fCount = players.filter(p => p.starPlayer && getPositionCategory(p.position ?? "MID") === "FWD").length;
    const detected = FORMATIONS.find(f => f.def === dCount && f.mid === mCount && f.fwd === fCount);
    if (detected) setSelectedFormation(detected.label);
    setInitialized(true);
  }, [players]);

  useEffect(() => {
    if (!showFormationPicker || initialized) return;

    if (fixtureId) {
      if (squadLoading) return; // Wait
      if (squadData) {
        // Load saved starters, but always include star players
        const savedStarters = new Set(
          squadData.players.filter(p => p.role === "starter").map(p => p.id)
        );
        // Star players are always on the pitch regardless of what was saved
        players.filter(p => p.starPlayer).forEach(p => savedStarters.add(p.id));
        setManualStarterIds(savedStarters);
        if (squadData.formation) setSelectedFormation(squadData.formation);
        setInitialized(true);
      } else if (players.length > 0) {
        initFromStars();
      }
    } else if (players.length > 0) {
      initFromStars();
    }
  }, [showFormationPicker, initialized, fixtureId, squadData, squadLoading, players, initFromStars]);

  // ── Group players by position ────────────────────────────────────────────
  const byPos = {
    GK:  players.filter(p => getPositionCategory(p.position ?? "MID") === "GK"),
    DEF: players.filter(p => getPositionCategory(p.position ?? "MID") === "DEF"),
    MID: players.filter(p => getPositionCategory(p.position ?? "MID") === "MID"),
    FWD: players.filter(p => getPositionCategory(p.position ?? "MID") === "FWD"),
  };

  // ── Compute starters ─────────────────────────────────────────────────────
  let formationGK: Player[];
  let formationDEF: Player[];
  let formationMID: Player[];
  let formationFWD: Player[];

  if (showFormationPicker && manualStarterIds !== null) {
    // Edit mode: manualStarterIds drives the pitch entirely
    formationGK  = byPos.GK.filter(p => manualStarterIds.has(p.id)).sort(byJersey);
    formationDEF = byPos.DEF.filter(p => manualStarterIds.has(p.id)).sort(byJersey);
    formationMID = byPos.MID.filter(p => manualStarterIds.has(p.id)).sort(byJersey);
    formationFWD = byPos.FWD.filter(p => manualStarterIds.has(p.id)).sort(byJersey);
  } else if (showFormationPicker) {
    // Still initialising — show nothing until ready
    formationGK = []; formationDEF = []; formationMID = []; formationFWD = [];
  } else {
    // Auto mode (Player Profiles): fit star players only
    formationGK  = byPos.GK.filter(p => p.fitnessStatus === "Fit" && p.starPlayer).sort(byJersey);
    formationDEF = byPos.DEF.filter(p => p.fitnessStatus === "Fit" && p.starPlayer).sort(byJersey);
    formationMID = byPos.MID.filter(p => p.fitnessStatus === "Fit" && p.starPlayer).sort(byJersey);
    formationFWD = byPos.FWD.filter(p => p.fitnessStatus === "Fit" && p.starPlayer).sort(byJersey);
  }

  const starterIds = new Set(
    [...formationGK, ...formationDEF, ...formationMID, ...formationFWD].map(p => p.id)
  );

  const benchPlayers = players.filter(p => !starterIds.has(p.id));
  const subsGrouped = {
    GK:  benchPlayers.filter(p => getPositionCategory(p.position ?? "MID") === "GK" ).sort(byJersey),
    DEF: benchPlayers.filter(p => getPositionCategory(p.position ?? "MID") === "DEF").sort(byJersey),
    MID: benchPlayers.filter(p => getPositionCategory(p.position ?? "MID") === "MID").sort(byJersey),
    FWD: benchPlayers.filter(p => getPositionCategory(p.position ?? "MID") === "FWD").sort(byJersey),
  };

  const starterRows = [
    { label: "FWD", players: formationFWD, positions: rowPositions(formationFWD.length, 16) },
    { label: "MID", players: formationMID, positions: rowPositions(formationMID.length, 38) },
    { label: "DEF", players: formationDEF, positions: rowPositions(formationDEF.length, 61) },
    { label: "GK",  players: formationGK,  positions: rowPositions(formationGK.length,  83) },
  ];

  const formationLabel = [
    formationGK.length, formationDEF.length, formationMID.length, formationFWD.length,
  ].join("–");

  const noStarters =
    formationGK.length + formationDEF.length + formationMID.length + formationFWD.length === 0;

  // ── Click: substitute in the subs panel ──────────────────────────────────
  const handleSubClick = (id: string) => {
    if (!showFormationPicker) {
      // Auto mode — navigate to profile
      if (onPlayerClick) onPlayerClick(id);
      else setLocation(`/players/${id}?source=profiles`);
      return;
    }
    // Toggle selection: clicking the same sub again deselects
    setSelectedSubId(prev => (prev === id ? null : id));
  };

  // ── Click: starter on the pitch ───────────────────────────────────────────
  const handleStarterClick = (id: string) => {
    if (!showFormationPicker) {
      if (onPlayerClick) onPlayerClick(id);
      else setLocation(`/players/${id}?source=profiles`);
      return;
    }
    if (selectedSubId) {
      // Swap: selected sub goes to pitch, clicked starter goes to bench
      setManualStarterIds(prev => {
        const next = new Set(prev ?? []);
        next.add(selectedSubId);   // sub → pitch
        next.delete(id);           // starter → bench
        return next;
      });
      setSelectedSubId(null);
      setIsDirty(true);
    } else {
      // No sub selected — move this starter to bench
      setManualStarterIds(prev => {
        const next = new Set(prev ?? []);
        next.delete(id);
        return next;
      });
      setIsDirty(true);
    }
  };

  // ── Save handler ──────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!fixtureId || !manualStarterIds) return;
    const payload = {
      players: players.map(p => ({
        userId: p.id,
        role: manualStarterIds.has(p.id) ? "starter" : "sub",
      })),
      formation: selectedFormation,
    };
    saveMutation.mutate(payload);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-0 rounded-xl overflow-hidden" style={{ minHeight: 600 }}>

      {/* ── Substitutes panel ──────────────────────────────── */}
      <div
        className="w-52 shrink-0 flex flex-col p-4"
        style={{ background: "rgba(15,30,20,0.92)" }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">
          Substitutes
        </p>
        {benchPlayers.length === 0 && (
          <p className="text-white/40 text-xs italic">None</p>
        )}
        <div className="space-y-4 overflow-y-auto flex-1">
          {(["GK", "DEF", "MID", "FWD"] as const).map(pos => {
            const group = subsGrouped[pos];
            if (group.length === 0) return null;
            return (
              <div key={pos}>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1 px-1">
                  {pos}
                </p>
                <div className="space-y-1">
                  {group.map(player => {
                    const isSelected = selectedSubId === player.id;
                    return (
                      <button
                        key={player.id}
                        onClick={() => handleSubClick(player.id)}
                        className={`w-full flex items-center gap-2 text-left rounded px-1 py-0.5 transition-all ${
                          isSelected
                            ? "bg-emerald-500/30 ring-1 ring-emerald-400/60"
                            : "hover:bg-white/10"
                        }`}
                      >
                        <span className="text-white/40 text-xs w-5 text-right shrink-0">
                          {player.jerseyNumber ?? "–"}
                        </span>
                        <span className={`text-xs leading-tight transition-colors ${isSelected ? "text-white font-semibold" : "text-white/80"}`}>
                          {player.firstName}{" "}
                          <span className="font-bold uppercase">{player.lastName}</span>
                        </span>
                        {player.starPlayer && (
                          <Star className="h-2.5 w-2.5 text-orange-400 fill-orange-400 shrink-0 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Save button */}
        {fixtureId && showFormationPicker && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending || savedFlash}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                savedFlash
                  ? "bg-emerald-600 text-white"
                  : isDirty
                  ? "bg-white text-gray-900 hover:bg-gray-100"
                  : "bg-white/10 text-white/40 cursor-default"
              }`}
            >
              {savedFlash ? (
                <><Check className="h-4 w-4" /> Saved</>
              ) : saveMutation.isPending ? (
                <><Save className="h-4 w-4 animate-pulse" /> Saving…</>
              ) : (
                <><Save className="h-4 w-4" /> {isDirty ? "Save Lineup" : "Lineup Saved"}</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── Pitch ──────────────────────────────────────────── */}
      <div
        className="relative flex-1"
        style={{
          background:
            "linear-gradient(180deg, #1e7a30 0%, #22923a 30%, #1e7a30 50%, #22923a 70%, #1e7a30 100%)",
          minHeight: 600,
        }}
      >
        {/* Pitch markings */}
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="4%" y="2%" width="92%" height="96%" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" rx="2" />
          <line x1="4%" y1="50%" x2="96%" y2="50%" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          <ellipse cx="50%" cy="50%" rx="9%" ry="11%" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" />
          <circle cx="50%" cy="50%" r="3" fill="rgba(255,255,255,0.5)" />
          <rect x="28%" y="2%" width="44%" height="17%" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" />
          <rect x="38%" y="2%" width="24%" height="7%"  stroke="rgba(255,255,255,0.25)" strokeWidth="1"   fill="none" />
          <rect x="28%" y="81%" width="44%" height="17%" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" />
          <rect x="38%" y="91%" width="24%" height="7%"  stroke="rgba(255,255,255,0.25)" strokeWidth="1"   fill="none" />
          <circle cx="50%" cy="13%" r="2.5" fill="rgba(255,255,255,0.45)" />
          <circle cx="50%" cy="87%" r="2.5" fill="rgba(255,255,255,0.45)" />
        </svg>

        {/* Edit hint */}
        {showFormationPicker && initialized && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
            <span className="text-white/40 text-[11px] bg-black/20 px-2 py-0.5 rounded-full">
              {selectedSubId
                ? "Now tap a player on the pitch to swap them"
                : "Select a sub, then tap a player to swap"}
            </span>
          </div>
        )}

        {/* Empty state */}
        {noStarters && initialized && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/40 text-sm text-center px-8">
              {showFormationPicker
                ? "No players — tap a substitute to add them to the pitch"
                : "No star players — mark players as ⭐ to populate the lineup"}
            </p>
          </div>
        )}

        {/* Players on pitch */}
        {starterRows.map(row =>
          row.players.map((player, i) => {
            const pos = row.positions[i];
            if (!pos) return null;
            const isGK = row.label === "GK";
            return (
              <button
                key={player.id}
                onClick={() => handleStarterClick(player.id)}
                className="absolute flex flex-col items-center gap-1 group cursor-pointer -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <div className="relative">
                  <Avatar
                    className="border-2 shadow-lg transition-all group-hover:scale-110"
                    style={{
                      width: 64,
                      height: 64,
                      borderColor: selectedSubId
                        ? "rgba(52,211,153,0.9)"   // green target ring when a sub is selected
                        : isGK ? "#f59e0b" : "rgba(255,255,255,0.7)",
                    }}
                  >
                    {player.avatarPath && (
                      <AvatarImage src={player.avatarPath} alt={`${player.firstName} ${player.lastName}`} />
                    )}
                    <AvatarFallback
                      className="text-sm font-bold text-white"
                      style={{ backgroundColor: isGK ? "#92400e" : clubPrimary }}
                    >
                      {player.jerseyNumber ?? getInitials(player)}
                    </AvatarFallback>
                  </Avatar>
                  {player.jerseyNumber != null && (
                    <div
                      className="absolute -bottom-1 -right-1 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold border border-white/60 shadow"
                      style={{ backgroundColor: isGK ? "#92400e" : clubPrimary }}
                    >
                      {player.jerseyNumber}
                    </div>
                  )}
                  {player.starPlayer && (
                    <div className="absolute -top-1 -left-1">
                      <Star className="h-3.5 w-3.5 text-orange-400 fill-orange-400 drop-shadow" />
                    </div>
                  )}
                  {/* Swap target pulse when a sub is selected */}
                  {showFormationPicker && selectedSubId && (
                    <div className="absolute inset-0 rounded-full bg-emerald-400/20 group-hover:bg-emerald-400/40 transition-colors" />
                  )}
                </div>
                <span
                  className="text-white text-[11px] font-semibold drop-shadow-md text-center leading-tight px-1 rounded"
                  style={{
                    maxWidth: 72,
                    textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  {player.lastName?.toUpperCase()}
                </span>
              </button>
            );
          })
        )}

        {/* Formation label / picker */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: "84%", top: "87%" }}
        >
          {showFormationPicker ? (
            <div className="relative">
              <select
                value={selectedFormation}
                onChange={e => {
                  setSelectedFormation(e.target.value);
                  if (fixtureId) setIsDirty(true);
                }}
                className="appearance-none bg-black/50 text-white/90 text-sm font-bold font-mono rounded-md pl-3 pr-7 py-1.5 border border-white/20 cursor-pointer hover:bg-black/70 focus:outline-none focus:border-white/40 transition-colors"
                style={{ backdropFilter: "blur(4px)" }}
              >
                {FORMATIONS.map(f => (
                  <option key={f.label} value={f.label} className="bg-gray-900">
                    {f.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60 pointer-events-none" />
            </div>
          ) : (
            <span className="text-white/50 text-sm font-mono font-bold pointer-events-none">
              {formationLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
