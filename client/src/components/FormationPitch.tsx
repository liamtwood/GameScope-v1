import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ChevronDown } from "lucide-react";

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
  /** Override click handler — defaults to navigating to /players/:id?source=profiles */
  onPlayerClick?: (id: string) => void;
  /** Show the formation dropdown picker (lineup pages only) */
  showFormationPicker?: boolean;
}

// ── Formations ──────────────────────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────────────────
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

// Sort: starred first, then fit, then by jersey number
const byPriority = (a: Player, b: Player) => {
  if (a.starPlayer !== b.starPlayer) return a.starPlayer ? -1 : 1;
  const aFit = a.fitnessStatus === "Fit" ? 0 : 1;
  const bFit = b.fitnessStatus === "Fit" ? 0 : 1;
  if (aFit !== bFit) return aFit - bFit;
  return (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999);
};

const byJersey = (a: Player, b: Player) =>
  (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999);

// Pick the top `count` players from a group
const pickTop = (group: Player[], count: number) =>
  [...group].sort(byPriority).slice(0, count);

export function FormationPitch({
  players,
  clubPrimary = "#CC4125",
  onPlayerClick,
  showFormationPicker = false,
}: FormationPitchProps) {
  const [, setLocation] = useLocation();
  const [selectedFormation, setSelectedFormation] = useState<typeof FORMATIONS[number]["label"]>("4-3-3");
  const [initialized, setInitialized] = useState(false);

  const handleClick = (id: string) => {
    if (onPlayerClick) {
      onPlayerClick(id);
    } else {
      setLocation(`/players/${id}?source=profiles`);
    }
  };

  // ── Group all players by position ────────────────────────────────────────
  const byPos = {
    GK:  players.filter(p => getPositionCategory(p.position ?? "MID") === "GK"),
    DEF: players.filter(p => getPositionCategory(p.position ?? "MID") === "DEF"),
    MID: players.filter(p => getPositionCategory(p.position ?? "MID") === "MID"),
    FWD: players.filter(p => getPositionCategory(p.position ?? "MID") === "FWD"),
  };

  // ── Star players (always stay on pitch, never moved to subs) ─────────────
  const starGKs  = byPos.GK.filter(p => p.starPlayer).sort(byJersey);
  const starDEFs = byPos.DEF.filter(p => p.starPlayer).sort(byJersey);
  const starMIDs = byPos.MID.filter(p => p.starPlayer).sort(byJersey);
  const starFWDs = byPos.FWD.filter(p => p.starPlayer).sort(byJersey);

  // ── Detect formation from star counts and initialise the dropdown once ───
  useEffect(() => {
    if (!initialized && players.length > 0) {
      const detected = FORMATIONS.find(
        f => f.def === starDEFs.length && f.mid === starMIDs.length && f.fwd === starFWDs.length
      );
      if (detected) setSelectedFormation(detected.label);
      setInitialized(true);
    }
  }, [players.length, initialized, starDEFs.length, starMIDs.length, starFWDs.length]);

  // ── Pick starters ────────────────────────────────────────────────────────
  let formationGK: Player[];
  let formationDEF: Player[];
  let formationMID: Player[];
  let formationFWD: Player[];

  if (showFormationPicker) {
    // Stars always start. Formation change only adds/removes non-star fill players.
    const fmt = FORMATIONS.find(f => f.label === selectedFormation) ?? FORMATIONS[0];
    const nonStarGKs  = byPos.GK.filter(p => !p.starPlayer).sort(byJersey);
    const nonStarDEFs = byPos.DEF.filter(p => !p.starPlayer).sort(byJersey);
    const nonStarMIDs = byPos.MID.filter(p => !p.starPlayer).sort(byJersey);
    const nonStarFWDs = byPos.FWD.filter(p => !p.starPlayer).sort(byJersey);
    formationGK  = [...starGKs,  ...nonStarGKs.slice(0,  Math.max(0, 1       - starGKs.length))];
    formationDEF = [...starDEFs, ...nonStarDEFs.slice(0, Math.max(0, fmt.def - starDEFs.length))];
    formationMID = [...starMIDs, ...nonStarMIDs.slice(0, Math.max(0, fmt.mid - starMIDs.length))];
    formationFWD = [...starFWDs, ...nonStarFWDs.slice(0, Math.max(0, fmt.fwd - starFWDs.length))];
  } else {
    // Auto (Player Profiles) mode: only fit star players start
    formationGK  = byPos.GK.filter(p => p.fitnessStatus === "Fit" && p.starPlayer).sort(byJersey);
    formationDEF = byPos.DEF.filter(p => p.fitnessStatus === "Fit" && p.starPlayer).sort(byJersey);
    formationMID = byPos.MID.filter(p => p.fitnessStatus === "Fit" && p.starPlayer).sort(byJersey);
    formationFWD = byPos.FWD.filter(p => p.fitnessStatus === "Fit" && p.starPlayer).sort(byJersey);
  }

  const starterIds = new Set(
    [...formationGK, ...formationDEF, ...formationMID, ...formationFWD].map(p => p.id)
  );

  // All non-starters go to bench
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
    formationGK.length,
    formationDEF.length,
    formationMID.length,
    formationFWD.length,
  ].join("–");

  const noStarters =
    formationGK.length + formationDEF.length + formationMID.length + formationFWD.length === 0;

  return (
    <div className="flex gap-0 rounded-xl overflow-hidden" style={{ minHeight: 600 }}>
      {/* ── Left: Substitutes panel ───────────────────────── */}
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
        <div className="space-y-4 overflow-y-auto">
          {(["GK", "DEF", "MID", "FWD"] as const).map(pos => {
            const group = subsGrouped[pos];
            if (group.length === 0) return null;
            return (
              <div key={pos}>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1 px-1">
                  {pos}
                </p>
                <div className="space-y-1">
                  {group.map(player => (
                    <button
                      key={player.id}
                      onClick={() => handleClick(player.id)}
                      className="w-full flex items-center gap-2 text-left group hover:bg-white/5 rounded px-1 py-0.5 transition-colors"
                    >
                      <span className="text-white/40 text-xs w-5 text-right shrink-0">
                        {player.jerseyNumber ?? "–"}
                      </span>
                      <span className="text-white/80 text-xs leading-tight group-hover:text-white transition-colors">
                        {player.firstName}{" "}
                        <span className="font-bold uppercase">{player.lastName}</span>
                      </span>
                      {player.starPlayer && (
                        <Star className="h-2.5 w-2.5 text-orange-400 fill-orange-400 shrink-0 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right: Pitch ─────────────────────────────────── */}
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

        {/* Empty state */}
        {noStarters && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/40 text-sm text-center px-8">
              {showFormationPicker
                ? "No players found — add players to the squad first"
                : "No star players — mark players as ⭐ to populate the lineup"}
            </p>
          </div>
        )}

        {/* Players */}
        {starterRows.map(row =>
          row.players.map((player, i) => {
            const pos = row.positions[i];
            if (!pos) return null;
            const isGK = row.label === "GK";
            return (
              <button
                key={player.id}
                onClick={() => handleClick(player.id)}
                className="absolute flex flex-col items-center gap-1 group cursor-pointer -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <div className="relative">
                  <Avatar
                    className="border-2 shadow-lg transition-all group-hover:scale-110"
                    style={{
                      width: 64,
                      height: 64,
                      borderColor: isGK ? "#f59e0b" : "rgba(255,255,255,0.7)",
                    }}
                  >
                    {player.avatarPath && (
                      <AvatarImage
                        src={player.avatarPath}
                        alt={`${player.firstName} ${player.lastName}`}
                      />
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

        {/* Formation label / picker — bottom-right at penalty-spot depth */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: "84%", top: "87%" }}
        >
          {showFormationPicker ? (
            <div className="relative">
              <select
                value={selectedFormation}
                onChange={e => setSelectedFormation(e.target.value as typeof selectedFormation)}
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
