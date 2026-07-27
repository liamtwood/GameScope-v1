import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

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
}

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

export function FormationPitch({ players, clubPrimary = "#CC4125", onPlayerClick }: FormationPitchProps) {
  const [, setLocation] = useLocation();

  const handleClick = (id: string) => {
    if (onPlayerClick) {
      onPlayerClick(id);
    } else {
      setLocation(`/players/${id}?source=profiles`);
    }
  };

  // Only fit players
  const fitPlayers = players.filter(p => p.fitnessStatus === "Fit");

  const fitByPos = {
    GK:  fitPlayers.filter(p => getPositionCategory(p.position ?? "MID") === "GK"),
    DEF: fitPlayers.filter(p => getPositionCategory(p.position ?? "MID") === "DEF"),
    MID: fitPlayers.filter(p => getPositionCategory(p.position ?? "MID") === "MID"),
    FWD: fitPlayers.filter(p => getPositionCategory(p.position ?? "MID") === "FWD"),
  };

  // All star players start — no fixed cap
  const formationGK  = fitByPos.GK.filter(p => p.starPlayer).sort(byJersey);
  const formationDEF = fitByPos.DEF.filter(p => p.starPlayer).sort(byJersey);
  const formationMID = fitByPos.MID.filter(p => p.starPlayer).sort(byJersey);
  const formationFWD = fitByPos.FWD.filter(p => p.starPlayer).sort(byJersey);

  const starterIds = new Set(
    [...formationGK, ...formationDEF, ...formationMID, ...formationFWD].map(p => p.id)
  );

  // All non-starters go to bench regardless of fitness
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

  const noStarters = formationGK.length + formationDEF.length + formationMID.length + formationFWD.length === 0;

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
            <p className="text-white/40 text-sm">
              No star players — mark players as ⭐ to populate the lineup
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

        {/* Formation label */}
        <div className="absolute bottom-3 right-4 text-white/40 text-xs font-mono">
          {formationLabel}
        </div>
      </div>
    </div>
  );
}
