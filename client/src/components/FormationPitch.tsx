import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ChevronDown, Save, Check } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const toTitleCase = (s: string) =>
  s.replace(/\S+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

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
  { label: "4-3-3",     gk: 1, def: 4, mid: 3, fwd: 3 },
  { label: "4-4-2",     gk: 1, def: 4, mid: 4, fwd: 2 },
  { label: "4-2-3-1",   gk: 1, def: 4, mid: 5, fwd: 1 },
  { label: "4-5-1",     gk: 1, def: 4, mid: 5, fwd: 1 },
  { label: "4-1-4-1",   gk: 1, def: 4, mid: 5, fwd: 1 },
  { label: "4-3-2-1",   gk: 1, def: 4, mid: 5, fwd: 1 },
  { label: "4-2-4",     gk: 1, def: 4, mid: 2, fwd: 4 },
  { label: "4-1-2-1-2", gk: 1, def: 4, mid: 4, fwd: 2 },
  { label: "4-2-2-2",   gk: 1, def: 4, mid: 4, fwd: 2 },
  { label: "3-5-2",     gk: 1, def: 3, mid: 5, fwd: 2 },
  { label: "3-4-3",     gk: 1, def: 3, mid: 4, fwd: 3 },
  { label: "5-3-2",     gk: 1, def: 5, mid: 3, fwd: 2 },
  { label: "5-4-1",     gk: 1, def: 5, mid: 4, fwd: 1 },
] as const;

// ── Standard jersey numbering per slot, left → right ─────────────────────────
// Used by buildSlots to order the initial placement in the conventional way.
// Players whose jersey isn't listed fall through to ascending-number ordering.
const FORMATION_SLOT_ORDER: Partial<Record<string, Partial<Record<RowKey, number[]>>>> = {
  "4-3-3":     { GK:[1], DEF:[3,4,5,2], MID:[6,8,10],       FWD:[11,9,7] },
  "4-4-2":     { GK:[1], DEF:[3,4,5,2], MID:[11,6,8,7],     FWD:[10,9] },
  "4-2-3-1":   { GK:[1], DEF:[3,4,5,2], MID:[11,6,8,7,10],  FWD:[9] },
  "4-5-1":     { GK:[1], DEF:[3,4,5,2], MID:[11,6,8,10,7],  FWD:[9] },
  "4-1-4-1":   { GK:[1], DEF:[3,4,5,2], MID:[11,6,8,7,10],  FWD:[9] },
  "4-3-2-1":   { GK:[1], DEF:[3,4,5,2], MID:[11,6,8,7,10],  FWD:[9] },
  "4-2-4":     { GK:[1], DEF:[3,4,5,2], MID:[6,8],           FWD:[11,10,9,7] },
  "4-1-2-1-2": { GK:[1], DEF:[3,4,5,2], MID:[6,11,7,10],    FWD:[9,8] },
  "4-2-2-2":   { GK:[1], DEF:[3,4,5,2], MID:[6,8,11,7],     FWD:[10,9] },
  "3-5-2":     { GK:[1], DEF:[3,4,2],   MID:[11,6,5,8,7],   FWD:[10,9] },
  "3-4-3":     { GK:[1], DEF:[3,4,2],   MID:[11,6,8,7],     FWD:[10,9,5] },
  "5-3-2":     { GK:[1], DEF:[3,4,5,6,2], MID:[11,8,7],     FWD:[10,9] },
  "5-4-1":     { GK:[1], DEF:[3,4,5,6,2], MID:[11,8,10,7],  FWD:[9] },
};

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

// ── Formation-specific x/y position hints ─────────────────────────────────────
// xs: left-to-right x% for each slot in that row
// ys: optional per-slot y% offset from the row's base y (positive = deeper/lower)
type RowPositionHint = { xs: number[]; ys?: number[] };

const FORMATION_POSITIONS: Partial<Record<string, Partial<Record<RowKey, RowPositionHint>>>> = {
  "4-3-3": {
    FWD: { xs: [20, 50, 80] },
  },
  "4-4-2": {
    FWD: { xs: [33, 67] },
  },
  "4-2-3-1": {
    MID: { xs: [17, 38, 50, 62, 83], ys: [4, 4, 0, 4, 4] }, // 2 DMs deeper, 3 AMs higher
  },
  "4-1-4-1": {
    MID: { xs: [17, 33, 50, 67, 83], ys: [5, 0, 0, 0, 5] }, // single DM deeper
  },
  "4-3-2-1": {
    MID: { xs: [20, 38, 50, 62, 80], ys: [3, 3, 0, 3, 3] },
  },
  "3-5-2": {
    FWD: { xs: [35, 65] },                                    // two strikers close together
    MID: { xs: [8, 28, 50, 72, 92], ys: [0, 0, 6, 0, 0] },   // wingers + CMs + DM deeper
    DEF: { xs: [27, 50, 73] },                                 // 3 CBs compressed, not edge-to-edge
  },
  "3-4-3": {
    DEF: { xs: [27, 50, 73] },
    MID: { xs: [20, 40, 60, 80] },
  },
  "5-3-2": {
    DEF: { xs: [10, 27, 50, 73, 90] },                        // back five spread wide
    FWD: { xs: [35, 65] },
  },
  "5-4-1": {
    DEF: { xs: [10, 27, 50, 73, 90] },
  },
  // Diamond: DM sits deep-centre, two wide mids level, AM pushes high-centre
  "4-1-2-1-2": {
    FWD: { xs: [35, 65] },
    MID: { xs: [50, 22, 78, 50], ys: [6, 0, 0, -6] },
  },
  // Box: two DMs lower, two AMs higher
  "4-2-2-2": {
    FWD: { xs: [35, 65] },
    MID: { xs: [33, 67, 33, 67], ys: [5, 5, -5, -5] },
  },
};

const rowPositions = (count: number, y: number, hint?: RowPositionHint) => {
  if (count === 0) return [];
  if (hint?.xs && hint.xs.length === count) {
    return hint.xs.map((x, i) => ({ x, y: y + (hint.ys?.[i] ?? 0) }));
  }
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
 * Reconstruct exact Slots from row-index-encoded roles ("starter-DEF-2").
 * Returns null when the data uses the old "starter" format (pre-encoding).
 */
function reconstructSlotsFromRoles(
  squadPlayers: Array<{ id: string; role: string }>,
  formationLabel: string
): Slots | null {
  const hasEncoding = squadPlayers.some(p => /^starter-(GK|DEF|MID|FWD)-\d+$/.test(p.role));
  if (!hasEncoding) return null;

  const f = getFormationConfig(formationLabel);
  const slots: Slots = {
    GK:  Array<string | null>(f.gk).fill(null),
    DEF: Array<string | null>(f.def).fill(null),
    MID: Array<string | null>(f.mid).fill(null),
    FWD: Array<string | null>(f.fwd).fill(null),
  };

  for (const p of squadPlayers) {
    const m = p.role.match(/^starter-(GK|DEF|MID|FWD)-(\d+)$/);
    if (!m) continue;
    const row = m[1] as RowKey;
    const idx = parseInt(m[2], 10);
    if (idx < slots[row].length) slots[row][idx] = p.id;
  }

  return slots;
}

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
    const order = FORMATION_SLOT_ORDER[formationLabel]?.[key] ?? [];
    const bySlotOrder = (a: Player, b: Player) => {
      const ai = order.indexOf(a.jerseyNumber ?? -1);
      const bi = order.indexOf(b.jerseyNumber ?? -1);
      if (ai === -1 && bi === -1) return (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    };
    // Stars (or saved starters) first, then non-stars to fill remaining slots —
    // both groups sorted left-to-right by the formation's conventional numbering.
    const starters = rows[key].filter(isStarter).sort(bySlotOrder);
    const fillers  = rows[key].filter(p => !isStarter(p)).sort(bySlotOrder);
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
 *
 * Flatten the current 11 starters into a single left-to-right array
 * (GK → DEF → MID → FWD), then slice that array into the new formation's
 * buckets. This preserves positional order across formation changes — e.g.
 * the rightmost defender naturally becomes the first (left wingback) midfielder
 * when switching from a 4-back to a 3-5-2 — without any displaced-pool logic.
 */
function resizeSlots(current: Slots, newLabel: string): Slots {
  const f = getFormationConfig(newLabel);

  // 1. Flatten: ordered list of all current pitch occupants, nulls removed
  const flat = [
    ...current.GK,
    ...current.DEF,
    ...current.MID,
    ...current.FWD,
  ].filter(Boolean) as string[];

  // 2. Slice into new buckets; pad short rows with null
  const take = (start: number, count: number): Array<string | null> => {
    const chunk = flat.slice(start, start + count);
    while (chunk.length < count) chunk.push(null);
    return chunk as Array<string | null>;
  };

  return {
    GK:  take(0,                    f.gk),
    DEF: take(f.gk,                 f.def),
    MID: take(f.gk + f.def,         f.mid),
    FWD: take(f.gk + f.def + f.mid, f.fwd),
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
    slots: { GK: string[]; DEF: string[]; MID: string[]; FWD: string[] } | null;
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
        setSelectedFormation(formation);
        if (squadData.slots) {
          // New format: full slot layout saved as JSON — reconstruct directly.
          // Pad each row to the formation's slot count so empty positions render.
          const f = getFormationConfig(formation);
          const pad = (ids: string[], count: number): Array<string | null> => {
            const result: Array<string | null> = ids.slice(0, count);
            while (result.length < count) result.push(null);
            return result;
          };
          setSlots({
            GK:  pad(squadData.slots.GK,  f.gk),
            DEF: pad(squadData.slots.DEF, f.def),
            MID: pad(squadData.slots.MID, f.mid),
            FWD: pad(squadData.slots.FWD, f.fwd),
          });
        } else {
          // Fallback: old saves — bucket starters by position attribute
          const savedStarters = new Set(
            squadData.players.filter(p => p.role === "starter").map(p => p.id)
          );
          players.filter(p => p.starPlayer).forEach(p => savedStarters.add(p.id));
          setSlots(buildSlots(players, formation, savedStarters));
        }
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
    // Send the full slot layout as JSON so reload can reconstruct exact positions.
    const payload = {
      players: players.map(p => ({ userId: p.id, role: onPitch.has(p.id) ? "starter" : "sub" })),
      formation: selectedFormation,
      // Filter nulls so stored arrays contain only player IDs
      slots: {
        GK:  slots.GK.filter(Boolean)  as string[],
        DEF: slots.DEF.filter(Boolean) as string[],
        MID: slots.MID.filter(Boolean) as string[],
        FWD: slots.FWD.filter(Boolean) as string[],
      },
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
      { label: "FWD", slotIds: byPos.FWD.map(p => p.id), y: 22 },
      { label: "MID", slotIds: byPos.MID.map(p => p.id), y: 43 },
      { label: "DEF", slotIds: byPos.DEF.map(p => p.id), y: 65 },
      { label: "GK",  slotIds: byPos.GK.map(p => p.id),  y: 85 },
    ];
  } else {
    pitchRows = [];
  }

  const totalOnPitch = pitchRows.reduce((s, r) => s + r.slotIds.filter(Boolean).length, 0);
  const pendingIsOnBench = pendingId !== null && !pitchIds.has(pendingId);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex gap-3 p-3 rounded-2xl glass-border-animated"
      style={{
        minHeight: 600,
        background: `linear-gradient(135deg, ${clubPrimary} 0%, #000000 100%) padding-box, conic-gradient(from var(--border-angle), transparent 0%, ${clubPrimary}ee 8%, ${clubPrimary}66 14%, transparent 22%, transparent 78%, ${clubPrimary}44 86%, ${clubPrimary}22 90%, transparent 100%) border-box`,
        border: "1.5px solid transparent",
      }}
      onClick={e => {
        // Clicking the backdrop (not a slot/button) deselects
        if ((e.target as HTMLElement).closest("[data-slot], [data-sub]") === null) {
          setPendingId(null);
        }
      }}
    >
      {/* ── Substitutes panel ──────────────────────────────── */}
      <div
        className="w-52 shrink-0 flex flex-col p-4 rounded-xl overflow-hidden"
        style={{
          background: `linear-gradient(rgba(255,255,255,0.07), rgba(255,255,255,0.07)) padding-box, linear-gradient(180deg, ${clubPrimary}60 0%, ${clubPrimary}15 40%, transparent 100%) border-box`,
          border: "1px solid transparent",
          backdropFilter: "blur(12px)",
        }}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-3 text-white/50">
          Substitutes
        </p>
        {benchPlayers.length === 0 && (
          <p className="text-white/40 text-xs italic">None</p>
        )}
        <div className="space-y-4 overflow-y-auto flex-1">
          {(["GK", "DEF", "MID", "FWD"] as RowKey[]).map(pos => {
            const group = subsGrouped[pos];
            if (group.length === 0) return null;
            const posLabel: Record<RowKey, string> = { GK: "Goalkeeper", DEF: "Defender", MID: "Midfielder", FWD: "Forward" };
            return (
              <div key={pos}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 px-1 text-white/30">
                  {posLabel[pos]}
                </p>
                <div className="space-y-0.5">
                  {group.map(player => {
                    const isSel = pendingId === player.id;
                    return (
                      <button
                        key={player.id}
                        data-sub
                        onClick={e => { e.stopPropagation(); handleSubClick(player.id); }}
                        className={`w-full flex items-center gap-2 text-left rounded-md px-2 py-1 transition-all ${
                          isSel
                            ? "bg-white/15 ring-1 ring-white/25"
                            : "hover:bg-white/8"
                        }`}
                      >
                        <span className="text-white/40 text-xs w-5 text-right shrink-0 tabular-nums">
                          {player.jerseyNumber ?? "–"}
                        </span>
                        <span className={`text-xs leading-tight transition-colors ${isSel ? "text-white font-semibold" : "text-white/80"}`}>
                          {player.firstName}{" "}
                          <span className="font-semibold">{player.lastName}</span>
                        </span>
                        {player.starPlayer && (
                          <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400 shrink-0 ml-auto" />
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
                  ? "bg-white/15 text-white hover:bg-white/20 border border-white/20"
                  : "bg-white/5 text-white/30 cursor-default"
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
        className="relative flex-1 rounded-xl overflow-hidden"
        style={{
          minHeight: 600,
          background: `linear-gradient(rgba(255,255,255,0.07), rgba(255,255,255,0.07)) padding-box, linear-gradient(180deg, ${clubPrimary}60 0%, ${clubPrimary}15 40%, transparent 100%) border-box`,
          border: "1px solid transparent",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Pitch markings */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="pitchFill" cx="50%" cy="40%" r="75%">
              <stop offset="0%" stopColor="#1e2d3e" />
              <stop offset="100%" stopColor="#0c1520" />
            </radialGradient>
          </defs>


          {/* ── Lines — no outer border box; internal markings define the pitch ── */}
          {/* Halfway line */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.16)" strokeWidth="0.7" />
          {/* Centre circle */}
          <ellipse cx="50%" cy="50%" rx="9%" ry="11%" stroke="rgba(255,255,255,0.14)" strokeWidth="0.7" fill="none" />
          {/* Centre spot */}
          <circle cx="50%" cy="50%" r="1.5" fill="rgba(255,255,255,0.28)" />
          {/* Top penalty area */}
          <rect x="28%" y="0" width="44%" height="17%" stroke="rgba(255,255,255,0.13)" strokeWidth="0.65" fill="none" />
          {/* Top goal area */}
          <rect x="38%" y="0" width="24%" height="7%"  stroke="rgba(255,255,255,0.09)" strokeWidth="0.55" fill="none" />
          {/* Bottom penalty area */}
          <rect x="28%" y="83%" width="44%" height="17%" stroke="rgba(255,255,255,0.13)" strokeWidth="0.65" fill="none" />
          {/* Bottom goal area */}
          <rect x="38%" y="93%" width="24%" height="7%"  stroke="rgba(255,255,255,0.09)" strokeWidth="0.55" fill="none" />
          {/* Penalty spots */}
          <circle cx="50%" cy="11%" r="1.5" fill="rgba(255,255,255,0.22)" />
          <circle cx="50%" cy="89%" r="1.5" fill="rgba(255,255,255,0.22)" />
        </svg>

        {/* Hint pill — bottom left */}
        {showFormationPicker && slots && (
          <div className="absolute bottom-3 left-3 z-10 pointer-events-none w-24">
            <div
              className="flex items-start gap-1.5 px-3 py-1.5 rounded-2xl text-white/40 text-[10px] tracking-wide leading-snug"
              style={{
                background: `linear-gradient(rgba(255,255,255,0.06), rgba(255,255,255,0.06)) padding-box, linear-gradient(180deg, ${clubPrimary}55 0%, transparent 100%) border-box`,
                border: "1px solid transparent",
                backdropFilter: "blur(8px)",
              }}
            >
              <span className="text-[8px] opacity-60 mt-px shrink-0">✦</span>
              <span>
                {pendingId
                  ? pendingIsOnBench
                    ? "Tap a pitch player to bring them on"
                    : "Tap another player or slot to swap"
                  : "Tap a player to move, or pick a sub first"}
              </span>
            </div>
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
          const hint = FORMATION_POSITIONS[selectedFormation]?.[row.label as RowKey];
          const positions = rowPositions(row.slotIds.length, row.y, hint);
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
                      className="border transition-all group-hover:scale-105"
                      style={{
                        width: 64,
                        height: 64,
                        borderColor: isPending
                          ? "#34d399"
                          : isTarget
                          ? "rgba(52,211,153,0.45)"
                          : isGK ? "rgba(245,158,11,0.45)" : "rgba(255,255,255,0.25)",
                        boxShadow: isPending
                          ? "0 0 0 2px rgba(52,211,153,0.35), 0 2px 12px rgba(0,0,0,0.5)"
                          : "0 2px 10px rgba(0,0,0,0.45)",
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
                        className="absolute -bottom-1 -right-1 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold border border-white/20 shadow-sm"
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
                    className="text-white/80 text-[11px] font-medium text-center leading-tight px-1.5 rounded-lg"
                    style={{
                      maxWidth: 72,
                      textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                      background: "rgba(0,0,0,0.20)",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {toTitleCase(player.lastName ?? "")}
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

        {/* Formation picker — bottom right, pill-styled */}
        <div className="absolute bottom-3 right-3 z-10">
          {showFormationPicker ? (
            <div className="relative">
              <select
                value={selectedFormation}
                onChange={e => handleFormationChange(e.target.value)}
                className="appearance-none text-white/40 text-[10px] tracking-wide cursor-pointer focus:outline-none pr-5 pl-3 py-1.5 rounded-2xl"
                style={{
                  background: `linear-gradient(rgba(255,255,255,0.06), rgba(255,255,255,0.06)) padding-box, linear-gradient(180deg, ${clubPrimary}55 0%, transparent 100%) border-box`,
                  border: "1px solid transparent",
                  backdropFilter: "blur(8px)",
                }}
              >
                {FORMATIONS.map(f => (
                  <option key={f.label} value={f.label} className="bg-gray-900 text-white">
                    {f.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/30 pointer-events-none" />
            </div>
          ) : (
            <span className="text-white/40 text-[10px] font-mono pointer-events-none">
              {pitchRows.map(r => r.slotIds.filter(Boolean).length).join("–")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
