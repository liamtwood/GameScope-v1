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

type RowKey = "GK" | "DEF" | "MID" | "FWD";

// Each row holds ordered slot IDs — null means an empty slot
type Slots = Record<RowKey, Array<string | null>>;

interface FormationPitchProps {
  players: Player[];
  clubPrimary?: string;
  onPlayerClick?: (id: string) => void;
  showFormationPicker?: boolean;
  fixtureId?: string;
}

// ── Formations ────────────────────────────────────────────────────────────────
const FORMATIONS = [
  { label: "4-3-3",   gk: 1, def: 4, mid: 3, fwd: 3 },
  { label: "4-4-2",   gk: 1, def: 4, mid: 4, fwd: 2 },
  { label: "4-2-3-1", gk: 1, def: 4, mid: 5, fwd: 1 },
  { label: "4-5-1",   gk: 1, def: 4, mid: 5, fwd: 1 },
  { label: "4-1-4-1", gk: 1, def: 4, mid: 5, fwd: 1 },
  { label: "4-3-2-1", gk: 1, def: 4, mid: 5, fwd: 1 },
  { label: "4-2-4",   gk: 1, def: 4, mid: 2, fwd: 4 },
  { label: "3-5-2",   gk: 1, def: 3, mid: 5, fwd: 2 },
  { label: "3-4-3",   gk: 1, def: 3, mid: 4, fwd: 3 },
  { label: "5-3-2",   gk: 1, def: 5, mid: 3, fwd: 2 },
  { label: "5-4-1",   gk: 1, def: 5, mid: 4, fwd: 1 },
] as const;

const getFormationConfig = (label: string) =>
  FORMATIONS.find(f => f.label === label) ?? FORMATIONS[0];

// ── Helpers ───────────────────────────────────────────────────────────────────
const getPositionCategory = (position: string): RowKey => {
  const p = (position || "").toLowerCase();
  if (p === "gk" || p === "goalkeeper") return "GK";
  if (p === "def" || p === "defender") return "DEF";
  if (p === "mid" || p === "midfield" || p === "midfielder") return "MID";
  if (p === "fwd" || p === "forward" || p === "attacker" || p === "striker") return "FWD";
  return "MID";
};

const getInitials = (p: Player) =>
  `${p.firstName?.[0] || ""}${p.lastName?.[0] || ""}`;

const byJersey = (a: Player, b: Player) =>
  (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999);

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

// ── Slot helpers ──────────────────────────────────────────────────────────────
/**
 * Build initial slots from a list of players and a formation.
 * Star players fill the slots first; remaining non-stars fill up to the slot count.
 * If starterIdSet is provided, those players are treated as "starters" instead of star flag.
 */
function buildSlots(
  players: Player[],
  formationLabel: string,
  starterIdSet?: Set<string>
): Slots {
  const f = getFormationConfig(formationLabel);
  const isStarter = (p: Player) =>
    starterIdSet ? starterIdSet.has(p.id) : p.starPlayer === true;

  const rows: Record<RowKey, Player[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of players) {
    rows[getPositionCategory(p.position ?? "MID")].push(p);
  }

  const fillRow = (key: RowKey, count: number): Array<string | null> => {
    // Stars (or saved starters) first, then non-stars to fill remaining
    const starters = rows[key].filter(isStarter).sort(byJersey);
    const fillers = rows[key].filter(p => !isStarter(p)).sort(byJersey);
    const combined = [...starters, ...fillers];
    return Array.from({ length: count }, (_, i) => combined[i]?.id ?? null);
  };

  return {
    GK: fillRow("GK", f.gk),
    DEF: fillRow("DEF", f.def),
    MID: fillRow("MID", f.mid),
    FWD: fillRow("FWD", f.fwd),
  };
}

/**
 * Resize slots when the formation changes.
 * Tries to keep existing player assignments; trims or pads with nulls as needed.
 */
function resizeSlots(current: Slots, newLabel: string): Slots {
  const f = getFormationConfig(newLabel);

  const resize = (row: Array<string | null>, needed: number): Array<string | null> => {
    // Compact: filled entries first so trimming removes nulls
    const filled = row.filter(Boolean) as string[];
    const combined = [
      ...filled,
      ...Array<null>(Math.max(0, row.length - filled.length)).fill(null),
    ];
    if (combined.length >= needed) return combined.slice(0, needed);
    return [...combined, ...Array<null>(needed - combined.length).fill(null)];
  };

  return {
    GK: resize(current.GK, f.gk),
    DEF: resize(current.DEF, f.def),
    MID: resize(current.MID, f.mid),
    FWD: resize(current.FWD, f.fwd),
  };
}

/**
 * Move pendingId into the target slot.
 * - If pending is already on pitch → swap with the target slot's occupant.
 * - If pending is on the bench → place into target slot; target's previous occupant goes to bench.
 */
function moveIntoSlot(
  slots: Slots,
  pendingId: string,
  targetRow: RowKey,
  targetIndex: number
): Slots {
  const next: Slots = {
    GK: [...slots.GK],
    DEF: [...slots.DEF],
    MID: [...slots.MID],
    FWD: [...slots.FWD],
  };

  const displaced = next[targetRow][targetIndex]; // the player (or null) being replaced

  // Find pending player's current slot (if on pitch)
  let pendingRow: RowKey | null = null;
  let pendingIdx = -1;
  for (const row of ["GK", "DEF", "MID", "FWD"] as RowKey[]) {
    const idx = next[row].indexOf(pendingId);
    if (idx !== -1) { pendingRow = row; pendingIdx = idx; break; }
  }

  if (pendingRow !== null) {
    // On pitch → swap
    next[pendingRow][pendingIdx] = displaced; // put displaced into pending's old slot
  }
  // else: pending is on bench → displaced simply leaves the slots (goes to bench)

  next[targetRow][targetIndex] = pendingId;
  return next;
}

/** Collect all player IDs currently on the pitch */
const allOnPitch = (slots: Slots): Set<string> =>
  new Set(
    (["GK", "DEF", "MID", "FWD"] as RowKey[])
      .flatMap(r => slots[r])
      .filter(Boolean) as string[]
  );

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
  const [slots, setSlots] = useState<Slots | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // ── Load saved lineup from DB ───────────────────────────────────────────
  const { data: squadData, isLoading: squadLoading } = useQuery<{
    players: Array<{ id: string; role: string }>;
    formation: string | null;
  }>({
    queryKey: ["/api/fixtures", fixtureId, "squad"],
    queryFn: () => fetch(`/api/fixtures/${fixtureId}/squad`).then(r => r.json()),
    enabled: !!fixtureId && showFormationPicker,
  });

  // ── Save mutation ───────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (payload: {
      players: { userId: string; role: string }[];
      formation: string;
    }) => {
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

  // ── Initialise slots ────────────────────────────────────────────────────
  const initialiseFromStars = useCallback(() => {
    // Auto-detect formation from star player counts
    const dCount = players.filter(p => p.starPlayer && getPositionCategory(p.position ?? "MID") === "DEF").length;
    const mCount = players.filter(p => p.starPlayer && getPositionCategory(p.position ?? "MID") === "MID").length;
    const fCount = players.filter(p => p.starPlayer && getPositionCategory(p.position ?? "MID") === "FWD").length;
    const detected = FORMATIONS.find(f => f.def === dCount && f.mid === mCount && f.fwd === fCount);
    const formation = detected?.label ?? "4-3-3";
    setSelectedFormation(formation);
    setSlots(buildSlots(players, formation));
  }, [players]);

  useEffect(() => {
    if (!showFormationPicker || slots !== null) return;
    if (players.length === 0) return;

    if (fixtureId) {
      if (squadLoading) return;
      const formation = squadData?.formation ?? "4-3-3";
      if (squadData) {
        const savedStarters = new Set(
          squadData.players.filter(p => p.role === "starter").map(p => p.id)
        );
        // Always ensure star players are included
        players.filter(p => p.starPlayer).forEach(p => savedStarters.add(p.id));
        setSelectedFormation(formation);
        setSlots(buildSlots(players, formation, savedStarters));
      } else {
        initialiseFromStars();
      }
    } else {
      initialiseFromStars();
    }
  }, [showFormationPicker, slots, players, fixtureId, squadData, squadLoading, initialiseFromStars]);

  // ── Derived: bench players ──────────────────────────────────────────────
  const pitchIds = slots ? allOnPitch(slots) : new Set<string>();

  // Auto mode (no picker): derive starters from star+fit players
  const autoStarters = !showFormationPicker
    ? players.filter(p => p.fitnessStatus === "Fit" && p.starPlayer)
    : [];
  const autoStarterIds = new Set(autoStarters.map(p => p.id));

  const activePitchIds = showFormationPicker ? pitchIds : autoStarterIds;

  const benchPlayers = players.filter(p => !activePitchIds.has(p.id));
  const subsGrouped: Record<RowKey, Player[]> = {
    GK:  benchPlayers.filter(p => getPositionCategory(p.position ?? "MID") === "GK" ).sort(byJersey),
    DEF: benchPlayers.filter(p => getPositionCategory(p.position ?? "MID") === "DEF").sort(byJersey),
    MID: benchPlayers.filter(p => getPositionCategory(p.position ?? "MID") === "MID").sort(byJersey),
    FWD: benchPlayers.filter(p => getPositionCategory(p.position ?? "MID") === "FWD").sort(byJersey),
  };

  // ── Formation change ────────────────────────────────────────────────────
  const handleFormationChange = (newLabel: string) => {
    setSelectedFormation(newLabel);
    if (slots) setSlots(resizeSlots(slots, newLabel));
    if (fixtureId) setIsDirty(true);
    setPendingId(null);
  };

  // ── Click: slot on the pitch ─────────────────────────────────────────────
  const handleSlotClick = (row: RowKey, index: number) => {
    if (!showFormationPicker || !slots) return;

    const occupant = slots[row][index]; // could be null (empty slot)

    if (pendingId === null) {
      // Nothing selected yet — only select if slot is occupied
      if (occupant) setPendingId(occupant);
    } else if (pendingId === occupant) {
      // Clicked the same player — deselect
      setPendingId(null);
    } else {
      // Perform swap/move
      setSlots(moveIntoSlot(slots, pendingId, row, index));
      setPendingId(null);
      setIsDirty(true);
    }
  };

  // ── Click: bench player ──────────────────────────────────────────────────
  const handleSubClick = (id: string) => {
    if (!showFormationPicker) {
      if (onPlayerClick) onPlayerClick(id);
      else setLocation(`/players/${id}?source=profiles`);
      return;
    }
    if (pendingId === id) {
      setPendingId(null); // deselect
    } else {
      setPendingId(id); // select this sub
    }
  };

  // ── Auto-mode pitch player click ─────────────────────────────────────────
  const handleAutoPlayerClick = (id: string) => {
    if (onPlayerClick) onPlayerClick(id);
    else setLocation(`/players/${id}?source=profiles`);
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!fixtureId || !slots) return;
    const onPitch = allOnPitch(slots);
    const payload = {
      players: players.map(p => ({
        userId: p.id,
        role: onPitch.has(p.id) ? "starter" : "sub",
      })),
      formation: selectedFormation,
    };
    saveMutation.mutate(payload);
  };

  // ── Build pitch rows ─────────────────────────────────────────────────────
  const playerById = new Map(players.map(p => [p.id, p]));

  type PitchRow = { label: RowKey; slotIds: Array<string | null>; y: number };
  let pitchRows: PitchRow[];

  if (showFormationPicker && slots) {
    pitchRows = [
      { label: "FWD", slotIds: slots.FWD, y: 16 },
      { label: "MID", slotIds: slots.MID, y: 38 },
      { label: "DEF", slotIds: slots.DEF, y: 61 },
      { label: "GK",  slotIds: slots.GK,  y: 83 },
    ];
  } else if (!showFormationPicker) {
    // Auto mode
    const byPos = {
      GK:  autoStarters.filter(p => getPositionCategory(p.position ?? "MID") === "GK" ).sort(byJersey),
      DEF: autoStarters.filter(p => getPositionCategory(p.position ?? "MID") === "DEF").sort(byJersey),
      MID: autoStarters.filter(p => getPositionCategory(p.position ?? "MID") === "MID").sort(byJersey),
      FWD: autoStarters.filter(p => getPositionCategory(p.position ?? "MID") === "FWD").sort(byJersey),
    };
    pitchRows = [
      { label: "FWD", slotIds: byPos.FWD.map(p => p.id), y: 16 },
      { label: "MID", slotIds: byPos.MID.map(p => p.id), y: 38 },
      { label: "DEF", slotIds: byPos.DEF.map(p => p.id), y: 61 },
      { label: "GK",  slotIds: byPos.GK.map(p => p.id),  y: 83 },
    ];
  } else {
    pitchRows = [];
  }

  const totalOnPitch = pitchRows.reduce((s, r) => s + r.slotIds.filter(Boolean).length, 0);
  const pendingIsOnBench = pendingId !== null && !pitchIds.has(pendingId);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex gap-0 rounded-xl overflow-hidden"
      style={{ minHeight: 600 }}
      onClick={e => {
        // Clicking the backdrop (not a slot/button) deselects
        if ((e.target as HTMLElement).closest("[data-slot], [data-sub]") === null) {
          setPendingId(null);
        }
      }}
    >
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
          {(["GK", "DEF", "MID", "FWD"] as RowKey[]).map(pos => {
            const group = subsGrouped[pos];
            if (group.length === 0) return null;
            return (
              <div key={pos}>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1 px-1">
                  {pos}
                </p>
                <div className="space-y-1">
                  {group.map(player => {
                    const isSel = pendingId === player.id;
                    return (
                      <button
                        key={player.id}
                        data-sub
                        onClick={e => { e.stopPropagation(); handleSubClick(player.id); }}
                        className={`w-full flex items-center gap-2 text-left rounded px-1 py-0.5 transition-all ${
                          isSel
                            ? "bg-emerald-500/30 ring-1 ring-emerald-400/60"
                            : "hover:bg-white/10"
                        }`}
                      >
                        <span className="text-white/40 text-xs w-5 text-right shrink-0">
                          {player.jerseyNumber ?? "–"}
                        </span>
                        <span className={`text-xs leading-tight transition-colors ${isSel ? "text-white font-semibold" : "text-white/80"}`}>
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
          className="absolute inset-0 w-full h-full pointer-events-none"
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

        {/* Hint bar */}
        {showFormationPicker && slots && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <span className="text-white/40 text-[11px] bg-black/20 px-2 py-0.5 rounded-full whitespace-nowrap">
              {pendingId
                ? pendingIsOnBench
                  ? "Tap a player on the pitch to bring them on"
                  : "Tap another player or empty slot to swap"
                : "Tap a player to move them, or pick a sub first"}
            </span>
          </div>
        )}

        {/* Empty state */}
        {totalOnPitch === 0 && slots && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-white/40 text-sm text-center px-8">
              No players — assign positions to populate the lineup
            </p>
          </div>
        )}

        {/* Pitch rows */}
        {pitchRows.map(row => {
          const positions = rowPositions(row.slotIds.length, row.y);
          return row.slotIds.map((slotId, i) => {
            const pos = positions[i];
            if (!pos) return null;
            const player = slotId ? playerById.get(slotId) : null;
            const isGK = row.label === "GK";
            const isPending = slotId !== null && pendingId === slotId;
            const isTarget = pendingId !== null && !isPending;

            if (slotId && player) {
              // ── Occupied slot ──────────────────────────
              return (
                <button
                  key={`${row.label}-${i}`}
                  data-slot
                  onClick={e => { e.stopPropagation(); showFormationPicker ? handleSlotClick(row.label, i) : handleAutoPlayerClick(slotId); }}
                  className="absolute flex flex-col items-center gap-1 cursor-pointer -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <div className="relative">
                    <Avatar
                      className="border-2 shadow-lg transition-all group-hover:scale-105"
                      style={{
                        width: 64,
                        height: 64,
                        borderColor: isPending
                          ? "#34d399"   // bright green = selected
                          : isTarget
                          ? "rgba(52,211,153,0.7)"  // softer green = swap target
                          : isGK ? "#f59e0b" : "rgba(255,255,255,0.7)",
                        boxShadow: isPending ? "0 0 0 3px rgba(52,211,153,0.5)" : undefined,
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
                    {/* Swap-target overlay */}
                    {isTarget && showFormationPicker && (
                      <div className="absolute inset-0 rounded-full bg-emerald-400/20 group-hover:bg-emerald-400/35 transition-colors" />
                    )}
                  </div>
                  <span
                    className="text-white text-[11px] font-semibold text-center leading-tight px-1 rounded"
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
            } else {
              // ── Empty slot ─────────────────────────────
              if (!showFormationPicker) return null;
              const isDropTarget = pendingId !== null;
              return (
                <button
                  key={`${row.label}-${i}-empty`}
                  data-slot
                  onClick={e => { e.stopPropagation(); handleSlotClick(row.label, i); }}
                  className="absolute flex flex-col items-center gap-1 cursor-pointer -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <div
                    className="rounded-full border-2 transition-all"
                    style={{
                      width: 64,
                      height: 64,
                      borderStyle: "dashed",
                      borderColor: isDropTarget
                        ? "rgba(52,211,153,0.7)"
                        : "rgba(255,255,255,0.25)",
                      background: isDropTarget
                        ? "rgba(52,211,153,0.1)"
                        : "rgba(0,0,0,0.15)",
                    }}
                  />
                  <span className="text-white/20 text-[11px]">
                    {row.label}
                  </span>
                </button>
              );
            }
          });
        })}

        {/* Formation picker */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: "84%", top: "87%" }}
        >
          {showFormationPicker ? (
            <div className="relative">
              <select
                value={selectedFormation}
                onChange={e => handleFormationChange(e.target.value)}
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
              {pitchRows.map(r => r.slotIds.filter(Boolean).length).join("–")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
