import { useState, useEffect, useCallback } from "react";
import { MatchScoreBanner } from "@/components/match-score-banner";
import { useClub } from "@/contexts/club-context";

// ── colour tokens (light theme) ───────────────────────────────────────────────
const C = {
  bg:    "#f4f6f8",
  panel: "#ffffff",
  line:  "#e2e6ea",
  txt:   "#111111",
  dim:   "#5a6473",
  dim2:  "#9aa3ae",
  cyan:  "#0891b2",
  tgt:   "#e11d48",
  gold:  "#b45309",
  good:  "#16a34a",
};

const GRP_COLOR: Record<string, string> = {
  defend:      "#e11d48",
  progression: "#0891b2",
  attack:      "#b45309",
};

// ── demo data (Lauren Hemp, illustrative — replace with live API) ────────────
const DEMO = {
  player: { jersey: 11, position: "Left Winger", foot: "Left", age: 23.1, minutes: 2340 },
  pathwayTarget: { name: "World Class Standard", team: "Top 5% / 90 mins", position: "Left Winger" },
  index: {
    overallPctOfTarget: 84,
    roleLabel: "Elite direct wide threat",
    verdict:
      "Hemp's take-on volume and ball progression are in the top 5% globally. The gap to the world-class benchmark is final-third end product — crossing accuracy and xA/90.",
  },
  dimensions: [
    { key: "take_on",          label: "1v1 / Take-on",    group: "progression", playerScore: 91, targetScore: 97 },
    { key: "ball_progression", label: "Ball Progression", group: "progression", playerScore: 88, targetScore: 95 },
    { key: "crossing",         label: "Crossing",         group: "attack",      playerScore: 72, targetScore: 92 },
    { key: "chance_creation",  label: "Chance Creation",  group: "attack",      playerScore: 78, targetScore: 94 },
    { key: "finishing",        label: "Finishing",         group: "attack",      playerScore: 74, targetScore: 88 },
    { key: "distribution",     label: "Retention",         group: "progression", playerScore: 82, targetScore: 91 },
    { key: "transition",       label: "Pressing",          group: "defend",      playerScore: 79, targetScore: 87 },
    { key: "ground_defence",   label: "Def. Work",         group: "defend",      playerScore: 70, targetScore: 82 },
  ],
  metrics: [
    { dimension: "take_on",         label: "Take-ons",             subLabel: "success rate",     volume: { value: "7.1",  unit: "/90", percentile: 94, target: "7.5"  }, efficiency: { value: "62",   unit: "%", percentile: 80 }, trend: [74,78,80,82,86,88,91] },
    { dimension: "take_on",         label: "Progressive carries",  subLabel: "into final third", volume: { value: "6.5",  unit: "/90", percentile: 88, target: "7.0"  }, efficiency: { value: "48",   unit: "%", percentile: 74 }, trend: [68,71,74,76,79,82,88] },
    { dimension: "take_on",         label: "Fouls won",            subLabel: "",                 volume: { value: "2.3",  unit: "/90", percentile: 85, target: "2.6"  }, efficiency: null, trend: [72,75,76,79,81,83,85] },
    { dimension: "chance_creation", label: "Key passes",           subLabel: "",                 volume: { value: "2.2",  unit: "/90", percentile: 78, target: "2.8"  }, efficiency: null, trend: [60,64,66,70,72,75,78] },
    { dimension: "chance_creation", label: "Expected assists (xA)",subLabel: "",                 volume: { value: "0.24", unit: "/90", percentile: 71, target: "0.32" }, efficiency: null, trend: [52,56,58,62,65,68,71] },
    { dimension: "crossing",        label: "Crosses completed",    subLabel: "accuracy",         volume: { value: "1.8",  unit: "/90", percentile: 68, target: "2.4"  }, efficiency: { value: "28",   unit: "%", percentile: 62 }, trend: [48,52,55,58,62,65,68] },
    { dimension: "chance_creation", label: "Passes into box",      subLabel: "",                 volume: { value: "2.6",  unit: "/90", percentile: 74, target: "3.1"  }, efficiency: null, trend: [58,62,65,68,70,72,74] },
    { dimension: "finishing",       label: "Shots",                subLabel: "on-target %",      volume: { value: "2.8",  unit: "/90", percentile: 80, target: "3.2"  }, efficiency: { value: "51",   unit: "%", percentile: 76 }, trend: [64,68,70,73,75,78,80] },
    { dimension: "finishing",       label: "xG (non-pen)",         subLabel: "per shot",         volume: { value: "0.30", unit: "/90", percentile: 77, target: "0.36" }, efficiency: { value: "0.11", unit: "",  percentile: 72 }, trend: [58,62,65,68,71,74,77] },
    { dimension: "finishing",       label: "Non-penalty goals",    subLabel: "",                 volume: { value: "0.35", unit: "/90", percentile: 82, target: "0.42" }, efficiency: null, trend: [64,68,70,74,76,79,82] },
    { dimension: "transition",      label: "Pressures",            subLabel: "press success",    volume: { value: "18.0", unit: "/90", percentile: 79, target: "21.0" }, efficiency: { value: "34",   unit: "%", percentile: 72 }, trend: [62,66,68,70,74,76,79] },
    { dimension: "transition",      label: "Ball recoveries",      subLabel: "",                 volume: { value: "4.0",  unit: "/90", percentile: 74, target: "4.8"  }, efficiency: null, trend: [60,64,66,68,70,72,74] },
    { dimension: "ground_defence",  label: "Counterpress regains", subLabel: "",                 volume: { value: "1.7",  unit: "/90", percentile: 68, target: "2.1"  }, efficiency: null, trend: [54,58,60,62,64,66,68] },
  ],
  trajectory: {
    labels: ["GW1-5","GW6-10","GW11-15","GW16-20","GW21-25","Now"],
    pctOfTarget: [68, 72, 75, 79, 82, 84],
  },
  focus: {
    superpower: {
      title: "1v1 & Ball Carrying",
      note: "Take-on volume (7.1/90, 94th pctile) and progressive carries are world-class metrics. Program: continue feeding isolation situations and sharpen the decision after the beat — converting carries into goals and assists is the next level.",
    },
    blockers: [
      { title: "Crossing accuracy", pctOfTarget: 78, reason: "Completed crosses (1.8/90) are below top-5% standard (2.4). Accuracy 28% — improving delivery quality after winning the wide duel is the highest-leverage development area." },
      { title: "Defensive work-rate vs elite standard", pctOfTarget: 85, reason: "Pressures and counterpress regains are strong but lag the world-class benchmark. Modern elite wide players defend from the front." },
    ],
  },
  pitch: {
    // StatsBomb coords (x: 0-120 own→opp goal, y: 0-80 top→bottom)
    // → component coords: comp_x = y_sb/80*100, comp_y = x_sb/120*100
    events: [
      // Dribbles (real locations from WWC Final event data)
      { type: "take_on_won",  x:  9, y: 21 },   // min 9  [25.3, 7.2]
      { type: "take_on_won",  x:  3, y: 27 },   // min 9  [32.4, 2.4]
      { type: "take_on_lost", x:  5, y: 28 },   // min 39 [34.1, 4.3]
      // Crosses (all incomplete — no cross found the target)
      { type: "cross", x: 72, y: 94, x2: 52, y2: 95 },  // min 44 [113,57.7]→[114.3,41.7]
      { type: "cross", x: 19, y: 93, x2: 55, y2: 92 },  // min 74 [111.7,14.8]→[110.7,44.2]
      { type: "cross", x: 85, y: 94, x2: 45, y2: 95 },  // min 102 [112.3,68.3]→[114.1,36.3]
      // Shots
      { type: "shot_on",  x: 70, y: 90 },  // min 4  [107.9, 56.3] Saved xG 0.038
      { type: "shot_on",  x: 67, y: 89 },  // min 19 [107.3, 53.5] Saved xG 0.090
      { type: "shot_off", x: 42, y: 93 },  // min 53 [111.3, 33.6] Off T  xG 0.151
    ],
  },
  matchSample: {
    label: "2023 World Cup Final vs Spain (90 mins)",
    stats: [
      { label: "Shots",        value: 3 },
      { label: "On target",    value: 2 },
      { label: "xG",           value: "0.28" },
      { label: "Dribbles",     value: "2/3" },
      { label: "Crosses",      value: 3 },
      { label: "Key pass",     value: 1 },
      { label: "Fouls won",    value: 3 },
      { label: "Pressures",    value: 31 },
      { label: "Ball rec.",    value: 5 },
      { label: "Goals",        value: 0 },
      { label: "Assists",      value: 0 },
    ],
  },
};

const METRIC_GROUPS = [
  { key: "take_on",         label: "1v1 & Carrying",        grp: "progression" },
  { key: "chance_creation", label: "Chance Creation",        grp: "attack" },
  { key: "crossing",        label: "Crossing",               grp: "attack" },
  { key: "finishing",       label: "Finishing",              grp: "attack" },
  { key: "transition",      label: "Transition & Defending", grp: "defend" },
  { key: "ground_defence",  label: "Defensive Work",         grp: "defend" },
];

// ── Reference fixture ────────────────────────────────────────────────────────
const REFERENCE_FIXTURE_ID = "c6a7fa2f-d625-4422-9bb6-090cf44410dc";

// Standout moments — eventKey is the real StatsBomb event UUID stored in highlightsTimestamps
// Tag these events in the Match Events tab (Watch Video → mark the timestamp) to enable Watch buttons
const STANDOUT_MOMENTS = [
  {
    eventKey:    "4d11233b-219f-4526-977f-2247792f6ff7", // Hemp shot min 15:11 — Post (crossbar), tagged at video 3:43
    minute:      15,
    label:       "Crossbar — driven shot strikes the post",
    description: "Hemp's driven effort strikes the crossbar; England's clearest chance of the opening period (xG 0.12). Originally misattributed to Daly in source data — corrected.",
  },
  {
    eventKey:    "9b5907d2-95c9-4e6c-823a-c5e3039aa9aa", // Hemp through-ball min 75:04 — shot assist to James
    minute:      75,
    label:       "Shot assist — through-ball releasing Lauren James",
    description: "Incisive through-ball from the left channel releasing James in behind the Spanish defence; the resulting shot was narrowly off target.",
  },
];

// ── VideoModal ────────────────────────────────────────────────────────────────
function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return m ? m[1] : null;
}

function VideoModal({ url, seekTo, onClose }: { url: string; seekTo: number; onClose: () => void }) {
  const ytId = extractYouTubeId(url);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const embedSrc = ytId
    ? `https://www.youtube.com/embed/${ytId}?enablejsapi=1&autoplay=1&start=${Math.floor(seekTo)}`
    : url;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.82)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#0f172a", borderRadius: 14, overflow: "hidden",
          width: "min(860px, 92vw)", boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
        }}
      >
        {/* Modal header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, letterSpacing: 0.5 }}>
            ▶ MATCH CLIP · {Math.floor(seekTo / 60)}:{String(Math.floor(seekTo % 60)).padStart(2, "0")}
          </span>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 6, color: "#94a3b8", cursor: "pointer", fontSize: 16, padding: "2px 9px", lineHeight: 1.4 }}
          >
            ✕
          </button>
        </div>
        {/* Video */}
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
          <iframe
            src={embedSrc}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            allow="autoplay; fullscreen"
            allowFullScreen
            title="Match clip"
          />
        </div>
        <div style={{ padding: "8px 16px 12px", fontSize: 11, color: "#475569" }}>
          Click outside or press Esc to close
        </div>
      </div>
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function CircularGauge({ pct }: { pct: number }) {
  const r = 48, cx = 60, cy = 60, circ = 2 * Math.PI * r;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.line} strokeWidth={10} />
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke={C.cyan} strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${(circ * pct) / 100} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy + 10} fill={C.cyan} fontSize={26} fontWeight={800}
        textAnchor="middle" dominantBaseline="middle" fontFamily="inherit">
        {pct}%
      </text>
    </svg>
  );
}

function SparkLine({ data }: { data: number[] }) {
  const w = 56, h = 22;
  const mn = Math.min(...data), mx = Math.max(...data), rng = (mx - mn) || 1;
  const pts = data
    .map((v, i) => `${((i * w) / (data.length - 1)).toFixed(1)},${(h - 2 - ((v - mn) / rng) * (h - 4)).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={C.good} strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
}

function RadarChart({ dims }: { dims: typeof DEMO.dimensions }) {
  const W = 340, H = 320, CX = W / 2, CY = H / 2, R = 110, N = dims.length;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / N;
  const pt = (i: number, rr: number): [number, number] => [
    CX + rr * Math.cos(ang(i)),
    CY + rr * Math.sin(ang(i)),
  ];
  const polyPts = (scores: number[]) =>
    scores.map((s, i) => pt(i, (R * s) / 100).map(v => v.toFixed(1)).join(",")).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon
          key={f}
          points={Array.from({ length: N }, (_, i) => pt(i, R * f).map(v => v.toFixed(1)).join(",")).join(" ")}
          fill="none" stroke={C.line} strokeWidth={1}
        />
      ))}
      {Array.from({ length: N }, (_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke={C.line} strokeWidth={1} />;
      })}
      <polygon
        points={polyPts(dims.map(d => d.targetScore))}
        fill="none" stroke={C.tgt} strokeWidth={1.8} strokeDasharray="5 3" strokeLinejoin="round"
      />
      <polygon
        points={polyPts(dims.map(d => d.playerScore))}
        fill={C.cyan} fillOpacity={0.18} stroke={C.cyan} strokeWidth={2} strokeLinejoin="round"
      />
      {dims.map((d, i) => {
        const [x, y] = pt(i, (R * d.playerScore) / 100);
        return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={3} fill={C.cyan} />;
      })}
      {dims.map((d, i) => {
        const [lx, ly] = pt(i, R + 22);
        const [dx, dy] = pt(i, R + 8);
        const anchor = lx < CX - 8 ? "end" : lx > CX + 8 ? "start" : "middle";
        return (
          <g key={i}>
            <circle cx={dx.toFixed(1)} cy={dy.toFixed(1)} r={3.5} fill={GRP_COLOR[d.group] ?? C.dim} />
            <text x={lx.toFixed(1)} y={ly.toFixed(1)} fill={C.dim} fontSize={9.5}
              textAnchor={anchor} dominantBaseline="middle" fontFamily="inherit">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function TrajectoryChart({ traj }: { traj: typeof DEMO.trajectory }) {
  const W = 360, H = 160, pad = 36;
  const { labels, pctOfTarget: pts } = traj;
  const mn = 60, mx = 108;
  const fy = (v: number) => H - pad - ((v - mn) / (mx - mn)) * (H - pad - 12);
  const fx = (i: number) => pad + (i * (W - pad - 12)) / (pts.length - 1);
  const polyPts = pts.map((v, i) => `${fx(i).toFixed(1)},${fy(v).toFixed(1)}`).join(" ");
  const targetY = fy(100);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <line x1={pad} y1={H - pad} x2={W - 10} y2={H - pad} stroke={C.line} />
      <line x1={pad} y1={targetY} x2={W - 10} y2={targetY} stroke={C.tgt} strokeWidth={1} strokeDasharray="4 4" />
      <text x={W - 12} y={targetY - 5} fill={C.tgt} fontSize={9} textAnchor="end" fontFamily="inherit">
        world-class target
      </text>
      <polyline points={polyPts} fill="none" stroke={C.cyan} strokeWidth={2.5} strokeLinejoin="round" />
      {pts.map((v, i) => (
        <g key={i}>
          <circle cx={fx(i).toFixed(1)} cy={fy(v).toFixed(1)} r={3.5} fill={C.cyan} />
          <text x={fx(i).toFixed(1)} y={H - pad + 14} fill={C.dim2} fontSize={9} textAnchor="middle" fontFamily="inherit">
            {labels[i]}
          </text>
        </g>
      ))}
      <text
        x={fx(pts.length - 1).toFixed(1)}
        y={(fy(pts[pts.length - 1]) - 10).toFixed(1)}
        fill={C.good} fontSize={12} fontWeight={700} textAnchor="middle" fontFamily="inherit"
      >
        {pts[pts.length - 1]}%
      </text>
    </svg>
  );
}

function PitchMap({ events }: { events: typeof DEMO.pitch.events }) {
  const W = 230, H = 270;
  const px = (x: number) => 8 + (x / 100) * (W - 16);
  const py = (y: number) => H - 8 - (y / 100) * (H - 16);
  const penW = 110, penX = (W - 110) / 2;
  const sixW = 50, sixX = (W - 50) / 2;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", maxWidth: 260, margin: "0 auto" }}>
      <rect x={8} y={8} width={W - 16} height={H - 16} fill="#0d160d" stroke="#2f4a2f" strokeWidth={1.5} rx={4} />
      <line x1={8} y1={H / 2} x2={W - 8} y2={H / 2} stroke="#1e321e" strokeWidth={1} />
      <rect x={penX} y={8} width={penW} height={50} fill="none" stroke="#2f4a2f" strokeWidth={1} />
      <rect x={sixX} y={8} width={sixW} height={18} fill="none" stroke="#2f4a2f" strokeWidth={1} />
      {events.map((ev, i) => {
        const x = px(ev.x), y = py(ev.y);
        if (ev.type === "take_on_won") return <circle key={i} cx={x} cy={y} r={5} fill={C.cyan} fillOpacity={0.9} />;
        if (ev.type === "take_on_lost") return <circle key={i} cx={x} cy={y} r={5} fill="#555" />;
        if (ev.type === "shot_on")  return <circle key={i} cx={x} cy={y} r={5.5} fill={C.good} fillOpacity={0.9} />;
        if (ev.type === "shot_off") return <circle key={i} cx={x} cy={y} r={5.5} fill={C.tgt} fillOpacity={0.7} />;
        if (ev.type === "cross" && ev.x2 != null && ev.y2 != null) {
          const x2 = px(ev.x2 as number), y2 = py(ev.y2 as number);
          return (
            <g key={i}>
              <line x1={x} y1={y} x2={x2} y2={y2} stroke="#d97706" strokeWidth={1.6} strokeDasharray="3 3" />
              <circle cx={x} cy={y} r={3} fill="#d97706" />
            </g>
          );
        }
        return null;
      })}
      <text x={14} y={H - 12} fill="#3a5a3a" fontSize={9} fontFamily="inherit">ATTACKING ↑ · left channel</text>
    </svg>
  );
}

// ── main export ───────────────────────────────────────────────────────────────

export function PlayerOverallTab({ player }: { player: any }) {
  const [compareMode, setCompareMode] = useState<"target" | "peers" | "trajectory">("target");
  const [highlightsTimestamps, setHighlightsTimestamps] = useState<Record<string, number>>({});
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [watchModal, setWatchModal] = useState<{ url: string; seekTo: number } | null>(null);
  const [refFixture, setRefFixture] = useState<any>(null);
  const [refOppositionLogoPath, setRefOppositionLogoPath] = useState<string | null>(null);
  const [refOppositionColor, setRefOppositionColor] = useState<string>("#6b7280");
  const { selectedClub } = useClub();
  const clubColor = (selectedClub?.primaryColor as any)?.primary ?? "#dc2626";
  const clubLogoPath = selectedClub?.logoPath ?? null;
  const clubName = selectedClub?.name ?? "Team";
  const data = DEMO;

  // Fetch live highlight timestamps + video URL for the reference fixture
  useEffect(() => {
    // Timestamps
    fetch(`/api/fixtures/${REFERENCE_FIXTURE_ID}/match-events`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.highlightsTimestamps) setHighlightsTimestamps(d.highlightsTimestamps);
      })
      .catch(() => {});

    // Video links
    fetch(`/api/fixtures/${REFERENCE_FIXTURE_ID}/videos`)
      .then(r => r.ok ? r.json() : null)
      .then((videos: any[]) => {
        if (Array.isArray(videos) && videos.length > 0) {
          // Prefer a YouTube video; fall back to first entry
          const yt = videos.find((v: any) => /youtube|youtu\.be/i.test(v.url ?? ""));
          setVideoUrl((yt ?? videos[0]).url ?? null);
        }
      })
      .catch(() => {});

    // Reference fixture object (for MatchScoreBanner)
    fetch(`/api/fixture/${REFERENCE_FIXTURE_ID}`)
      .then(r => r.ok ? r.json() : null)
      .then(f => { if (f) setRefFixture(f); })
      .catch(() => {});

    // Spain opposition team logo
    fetch("/api/opposition-teams")
      .then(r => r.ok ? r.json() : null)
      .then((teams: any[]) => {
        if (!Array.isArray(teams)) return;
        const spain = teams.find((t: any) => t.id === "78511573-6425-47b0-90ad-015c186f4c69");
        if (spain?.logoPath) setRefOppositionLogoPath(spain.logoPath);
        const spainColor = (spain?.colors as any)?.primary;
        if (spainColor) setRefOppositionColor(spainColor);
      })
      .catch(() => {});
  }, []);

  const handleWatch = useCallback((eventKey: string) => {
    const ts = highlightsTimestamps[eventKey];
    if (ts == null || !videoUrl) return;
    setWatchModal({ url: videoUrl, seekTo: ts });
  }, [highlightsTimestamps, videoUrl]);

  const s: Record<string, React.CSSProperties> = {
    card:         { background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
    sectionLabel: { fontSize: 11, letterSpacing: 1.5, color: C.dim2, textTransform: "uppercase", margin: "28px 0 6px", fontWeight: 700 },
    cardLabel:    { fontSize: 11, letterSpacing: 1, color: C.dim, fontWeight: 700, textTransform: "uppercase" },
    tag:          { fontSize: 11, border: `1px solid ${C.line}`, borderRadius: 6, padding: "4px 9px", color: C.dim, background: C.bg },
    tagTgt:       { fontSize: 11, border: `1px solid ${C.tgt}`, borderRadius: 6, padding: "4px 9px", color: C.tgt, background: "#fff0f3" },
  };

  return (
    <>
    <div style={{ background: C.bg, color: C.txt, fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif", minHeight: 600, padding: "24px 28px 56px" }}>

      {/* ── Hero ── */}
      <div style={{ display: "flex", gap: 22, alignItems: "center", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

        {/* Round player photo */}
        {player?.avatarPath ? (
          <img
            src={player.avatarPath}
            alt=""
            style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: `3px solid ${C.line}`, flexShrink: 0 }}
          />
        ) : (
          <div style={{ width: 88, height: 88, borderRadius: "50%", background: C.line, border: `3px solid ${C.line}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: C.dim }}>
            {player?.firstName?.[0]}{player?.lastName?.[0]}
          </div>
        )}

        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          <div style={{ fontSize: 10, color: C.dim2, fontWeight: 600, letterSpacing: 2, marginBottom: 4 }}>OVERALL · DEVELOPMENT PROFILE</div>
          <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.1, color: C.txt }}>
            {player?.firstName} {player?.lastName}{" "}
            <span style={{ fontSize: 15, color: C.dim, fontWeight: 600 }}>#{data.player.jersey}</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {[
              ["Position", data.player.position],
              ["Foot", data.player.foot],
              ["Age", String(data.player.age)],
              ["Minutes", data.player.minutes.toLocaleString()],
            ].map(([k, v]) => (
              <span key={k} style={s.tag}>{k} <b style={{ color: C.txt }}>{v}</b></span>
            ))}
            <span style={s.tagTgt}>Benchmark <b>{data.pathwayTarget.name}</b></span>
          </div>
          <div style={{ marginTop: 12, fontSize: 13.5, color: C.dim, lineHeight: 1.55 }}>
            <span style={{ color: C.cyan, fontWeight: 700 }}>{data.index.roleLabel}. </span>
            {data.index.verdict}
          </div>
        </div>

        <div style={{ flexShrink: 0, textAlign: "center" }}>
          <CircularGauge pct={data.index.overallPctOfTarget} />
          <div style={{ fontSize: 10, color: C.dim2, letterSpacing: 1, marginTop: 5, maxWidth: 110 }}>OVERALL VS BENCHMARK</div>
        </div>
      </div>

      {/* ── Compare toggle ── */}
      <div style={{ display: "flex", margin: "18px 0 4px", border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden", width: "fit-content", background: C.panel, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {([ ["target", `vs ${data.pathwayTarget.name}`], ["peers", "vs Age Peers"], ["trajectory", "vs Own Trajectory"] ] as const).map(([k, label]) => (
          <button key={k} onClick={() => setCompareMode(k)} style={{
            background: compareMode === k ? "#3663ae" : "transparent",
            color: compareMode === k ? "#ffffff" : C.dim,
            border: "none", padding: "9px 16px", fontSize: 12,
            cursor: "pointer", fontWeight: compareMode === k ? 700 : 400,
            fontFamily: "inherit", letterSpacing: 0.3,
          }}>{label}</button>
        ))}
      </div>

      {/* ── Radar + Focus ── */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 14 }}>

        {/* Radar card */}
        <div style={{ ...s.card, flex: "1 1 340px", minWidth: 300 }}>
          <div style={{ ...s.cardLabel, marginBottom: 6 }}>Performance Profile</div>
          <RadarChart dims={data.dimensions} />
          <div style={{ display: "flex", gap: 18, justifyContent: "center", fontSize: 11, color: C.dim, marginTop: 4 }}>
            <span><span style={{ display: "inline-block", width: 11, height: 11, borderRadius: 2, background: C.cyan, marginRight: 6, verticalAlign: "middle", opacity: 0.5 }} />{player?.firstName ?? "Player"}</span>
            <span><span style={{ display: "inline-block", width: 11, height: 3, borderRadius: 0, background: C.tgt, marginRight: 6, verticalAlign: "middle" }} />{data.pathwayTarget.name}</span>
          </div>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", fontSize: 10, color: C.dim2, marginTop: 6 }}>
            {(["defend", "progression", "attack"] as const).map(g => (
              <span key={g}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: GRP_COLOR[g], marginRight: 4, verticalAlign: "middle" }} />{g}</span>
            ))}
          </div>
        </div>

        {/* Focus card */}
        <div style={{ ...s.card, flex: "1 1 340px", minWidth: 300 }}>
          <div style={{ ...s.cardLabel, marginBottom: 0 }}>
            Development Focus · <span style={{ color: C.cyan }}>Strengths-led</span>
          </div>

          {/* Superpower */}
          <div style={{ border: `1px solid ${C.cyan}`, borderRadius: 12, padding: 14, background: `rgba(8,145,178,0.06)`, marginTop: 10 }}>
            <div style={{ fontSize: 11, color: C.cyan, letterSpacing: 1, fontWeight: 700 }}>★ SUPERPOWER — PROTECT &amp; SHARPEN</div>
            <div style={{ fontSize: 17, fontWeight: 800, margin: "4px 0 7px", color: C.txt }}>{data.focus.superpower.title}</div>
            <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.5 }}>{data.focus.superpower.note}</div>
          </div>

          {/* Blockers */}
          <div style={{ fontSize: 11, letterSpacing: 1, color: C.dim2, fontWeight: 700, textTransform: "uppercase", margin: "16px 0 2px" }}>Must-fix blockers</div>
          {data.focus.blockers.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "11px 0", borderBottom: i < data.focus.blockers.length - 1 ? `1px solid ${C.line}` : "none" }}>
              <div style={{ flexShrink: 0, width: 8, height: 8, borderRadius: "50%", background: C.tgt, marginTop: 5 }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.txt }}>
                  {b.title} <span style={{ fontSize: 11, color: C.tgt, fontWeight: 700 }}>· {b.pctOfTarget}% of target</span>
                </div>
                <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.45, marginTop: 2 }}>{b.reason}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Metrics table ── */}
      <div style={s.sectionLabel as React.CSSProperties}>Position-tailored metrics · per 90 · volume + efficiency</div>
      <div style={{ ...s.card }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.1fr 1fr 58px", gap: 12, fontSize: 10, letterSpacing: 1, color: C.dim2, textTransform: "uppercase", paddingBottom: 6, borderBottom: `1px solid ${C.line}`, marginBottom: 2 }}>
          <span>Metric</span><span>Volume /90</span><span>Efficiency</span><span>Trend</span>
        </div>

        {METRIC_GROUPS.map(grp => {
          const rows = data.metrics.filter(m => m.dimension === grp.key);
          if (!rows.length) return null;
          return (
            <div key={grp.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: C.txt, margin: "14px 0 8px" }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: GRP_COLOR[grp.grp], display: "inline-block", flexShrink: 0 }} />
                {grp.label}
              </div>
              {rows.map((row, ri) => (
                <div key={ri} style={{ display: "grid", gridTemplateColumns: "1.5fr 1.1fr 1fr 58px", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
                  <div style={{ fontSize: 13, color: C.txt }}>
                    {row.label}
                    {row.subLabel && <div style={{ color: C.dim2, fontSize: 10.5, marginTop: 2 }}>{row.subLabel}</div>}
                  </div>

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>
                      {row.volume.value}
                      <span style={{ fontSize: 10, color: C.dim, fontWeight: 400 }}> {row.volume.unit} · {row.volume.percentile}th · tgt {row.volume.target}</span>
                    </div>
                    <div style={{ height: 6, background: C.line, borderRadius: 4, marginTop: 4, position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", inset: 0, width: `${row.volume.percentile}%`, borderRadius: 4, background: C.cyan }} />
                    </div>
                  </div>

                  {row.efficiency ? (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>
                        {row.efficiency.value}{row.efficiency.unit}
                        <span style={{ fontSize: 10, color: C.dim, fontWeight: 400 }}> {row.efficiency.percentile}th</span>
                      </div>
                      <div style={{ height: 6, background: C.line, borderRadius: 4, marginTop: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${row.efficiency.percentile}%`, borderRadius: 4, background: GRP_COLOR[grp.grp] }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: C.dim2, fontSize: 14 }}>—</div>
                  )}

                  <SparkLine data={row.trend} />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* ── Trajectory (full width) ── */}
      <div style={{ ...s.card, marginTop: 20 }}>
        <div style={{ ...s.cardLabel, marginBottom: 8 }}>Trajectory · gap to benchmark closing</div>
        <TrajectoryChart traj={data.trajectory} />
        <div style={{ fontSize: 12, color: C.dim, marginTop: 10, lineHeight: 1.7 }}>
          Last 3 windows: {data.trajectory.pctOfTarget.slice(-3).join("% → ")}% of benchmark.{" "}
          <b style={{ color: C.good }}>+{data.trajectory.pctOfTarget[data.trajectory.pctOfTarget.length - 1] - data.trajectory.pctOfTarget[0]} pts</b> since season start.
        </div>
      </div>

      {/* ── Reference match ── */}
      <div style={s.sectionLabel as React.CSSProperties}>Reference match · 2023 World Cup Final vs Spain</div>
      <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>

        {/* ── Standard fixture banner ── */}
        {refFixture && (
          <div style={{ padding: "16px 16px 0" }}>
            <MatchScoreBanner
              fixture={refFixture}
              teamLogoPath={clubLogoPath ?? undefined}
              opponentLogoPath={refOppositionLogoPath ?? undefined}
              polkStateColor="#3663ae"
              oppositionColor={refOppositionColor}
              primaryColor="#3663ae"
              clubName={clubName}
            />
          </div>
        )}

        {/* ── Meta row: competition + StatsBomb badge ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 20px 14px", flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, background: "#3663ae", color: "#fff", borderRadius: 4, padding: "2px 8px", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>2023 WWC Final</span>
          <span style={{ fontSize: 10, color: C.dim2 }}>20 Aug 2023 · Stadium Australia · 90 mins</span>
          <span style={{ fontSize: 10, background: "rgba(22,163,74,0.15)", color: "#16a34a", borderRadius: 5, padding: "3px 9px", fontWeight: 700 }}>✓ StatsBomb</span>
        </div>

        {/* ── Stats + Pitch map side-by-side ── */}
        <div style={{ display: "flex", alignItems: "flex-start", borderTop: `1px solid ${C.line}` }}>

          {/* Three stat columns */}
          <div style={{ flex: "1 1 auto", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "18px 20px 4px" }}>

            {/* Attacking */}
            <div style={{ paddingRight: 16, borderRight: `1px solid ${C.line}` }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2, color: C.gold, textTransform: "uppercase", marginBottom: 14, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, display: "inline-block" }} />
                Attacking
              </div>

              {/* Shots + dot cluster */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: C.txt, lineHeight: 1 }}>3</span>
                  <svg width={40} height={14} viewBox="0 0 40 14" style={{ display: "block" }}>
                    <circle cx={7}  cy={7} r={6} fill={C.good} />
                    <circle cx={20} cy={7} r={6} fill={C.good} />
                    <circle cx={33} cy={7} r={6} fill="none" stroke={C.tgt} strokeWidth={1.8} />
                  </svg>
                </div>
                <div style={{ fontSize: 10.5, color: C.dim, marginTop: 3 }}>Shots · 2 on target</div>
              </div>

              {/* xG */}
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: C.txt, lineHeight: 1 }}>0.28</span>
                <div style={{ fontSize: 10.5, color: C.dim, marginTop: 3 }}>xG total</div>
              </div>

              {/* Dribbles with ratio bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: C.txt, lineHeight: 1 }}>2</span>
                  <span style={{ fontSize: 12, color: C.dim, fontWeight: 500 }}>/ 3</span>
                </div>
                <div style={{ height: 5, background: C.line, borderRadius: 3, marginTop: 5, overflow: "hidden", maxWidth: 48 }}>
                  <div style={{ height: "100%", width: "66%", background: C.cyan, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 10.5, color: C.dim, marginTop: 3 }}>Dribbles won</div>
              </div>

              {/* Key pass */}
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: C.txt, lineHeight: 1 }}>1</span>
                <div style={{ fontSize: 10.5, color: C.dim, marginTop: 3 }}>Key pass</div>
              </div>
            </div>

            {/* Passing & Crossing */}
            <div style={{ padding: "0 16px", borderRight: `1px solid ${C.line}` }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2, color: C.cyan, textTransform: "uppercase", marginBottom: 14, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.cyan, display: "inline-block" }} />
                Passing
              </div>

              {/* Pass accuracy bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: C.txt, lineHeight: 1 }}>58</span>
                  <span style={{ fontSize: 13, color: C.dim, fontWeight: 600 }}>%</span>
                </div>
                <div style={{ height: 5, background: C.line, borderRadius: 3, marginTop: 5, overflow: "hidden", maxWidth: 56 }}>
                  <div style={{ height: "100%", width: "58%", background: C.cyan, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 10.5, color: C.dim, marginTop: 3 }}>Pass acc. · 11/19</div>
              </div>

              {/* Crosses */}
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: C.txt, lineHeight: 1 }}>3</span>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                  <span style={{ fontSize: 10.5, color: C.dim }}>Crosses ·</span>
                  <span style={{ fontSize: 10.5, color: C.tgt, fontWeight: 600 }}>0 complete</span>
                </div>
              </div>

              {/* Fouls won */}
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: C.txt, lineHeight: 1 }}>3</span>
                <div style={{ fontSize: 10.5, color: C.dim, marginTop: 3 }}>Fouls won</div>
              </div>
            </div>

            {/* Defensive */}
            <div style={{ paddingLeft: 16 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2, color: C.tgt, textTransform: "uppercase", marginBottom: 14, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.tgt, display: "inline-block" }} />
                Defensive
              </div>

              {/* Pressures */}
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: C.txt, lineHeight: 1 }}>31</span>
                <div style={{ fontSize: 10.5, color: C.dim, marginTop: 3 }}>Pressures</div>
              </div>

              {/* Ball recoveries */}
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: C.txt, lineHeight: 1 }}>5</span>
                <div style={{ fontSize: 10.5, color: C.dim, marginTop: 3 }}>Ball rec.</div>
              </div>

              {/* Goals + Assists */}
              <div style={{ display: "flex", gap: 14, marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 22, fontWeight: 800, color: C.dim2, lineHeight: 1 }}>0</span>
                  <div style={{ fontSize: 10.5, color: C.dim, marginTop: 3 }}>Goals</div>
                </div>
                <div>
                  <span style={{ fontSize: 22, fontWeight: 800, color: C.dim2, lineHeight: 1 }}>0</span>
                  <div style={{ fontSize: 10.5, color: C.dim, marginTop: 3 }}>Assists</div>
                </div>
              </div>
            </div>
          </div>{/* end three stat columns */}

          {/* ── Pitch map ── */}
          <div style={{ flexShrink: 0, borderLeft: `1px solid ${C.line}`, padding: "18px 20px" }}>
            <div style={{ ...s.cardLabel, marginBottom: 8 }}>Activity map · real x/y</div>
            <PitchMap events={data.pitch.events} />
            <div style={{ display: "flex", gap: 8, fontSize: 10, color: C.dim, marginTop: 8, flexWrap: "wrap" }}>
              {([
                ["#0891b2", "Dribble ✓"],
                ["#555",    "Dribble ✗"],
                ["#16a34a", "Shot on"],
                ["#e11d48", "Shot off"],
                ["#d97706", "Cross"],
              ] as [string, string][]).map(([bg, label]) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: bg, display: "inline-block", flexShrink: 0 }} />
                  {label}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 10.5, color: C.dim2, lineHeight: 1.5, marginTop: 6 }}>
              Dribbles in own half reflect England's defensive shape. All 3 crosses aimed at the far post.
            </div>
          </div>

        </div>{/* end stats + pitch map flex row */}

        {/* ── Standout moments ── */}
        <div style={{ margin: "14px 20px 18px" }}>
          {STANDOUT_MOMENTS.map((moment, idx) => {
            const ts = highlightsTimestamps[moment.eventKey];
            const hasTimestamp = ts != null;
            const canWatch = hasTimestamp && videoUrl != null;

            return (
              <div
                key={moment.eventKey}
                style={{
                  borderLeft: `3px solid ${C.gold}`,
                  borderRadius: "0 10px 10px 0",
                  background: `rgba(180,83,9,0.06)`,
                  padding: "10px 14px",
                  marginBottom: idx < STANDOUT_MOMENTS.length - 1 ? 10 : 0,
                }}
              >
                {/* Row: badges + Watch button */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, background: "#3663ae", color: "#fff", borderRadius: 4, padding: "2px 7px", fontWeight: 700, letterSpacing: 0.3 }}>
                    MIN {moment.minute}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: 0.8, textTransform: "uppercase", flex: "1 1 auto" }}>
                    ★ Standout action
                  </span>
                  {/* Watch button — only shown when fixture has a video */}
                  {videoUrl && (
                    <button
                      onClick={() => canWatch && handleWatch(moment.eventKey)}
                      title={canWatch ? `Jump to ${Math.floor(ts / 60)}:${String(Math.floor(ts % 60)).padStart(2, "0")}` : "Timestamp not yet tagged in Match Events tab"}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: canWatch ? "rgba(8,145,178,0.12)" : "rgba(0,0,0,0.06)",
                        border: `1px solid ${canWatch ? C.cyan : C.line}`,
                        borderRadius: 20, padding: "3px 11px",
                        fontSize: 10.5, fontWeight: 700,
                        color: canWatch ? C.cyan : C.dim2,
                        cursor: canWatch ? "pointer" : "not-allowed",
                        flexShrink: 0, letterSpacing: 0.3,
                        transition: "background 0.15s, border-color 0.15s",
                      }}
                      onMouseEnter={e => {
                        if (canWatch) (e.currentTarget as HTMLButtonElement).style.background = "rgba(8,145,178,0.22)";
                      }}
                      onMouseLeave={e => {
                        if (canWatch) (e.currentTarget as HTMLButtonElement).style.background = "rgba(8,145,178,0.12)";
                      }}
                    >
                      ▶ Watch
                      {!canWatch && (
                        <span style={{ fontSize: 9, color: C.dim2, fontWeight: 400 }}> · untagged</span>
                      )}
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>{moment.label}</div>
                <div style={{ fontSize: 11.5, color: C.dim, marginTop: 4, lineHeight: 1.5 }}>{moment.description}</div>
              </div>
            );
          })}
        </div>

      </div>{/* end unified reference card */}

    </div>

    {/* Video modal */}
    {watchModal && (
      <VideoModal
        url={watchModal.url}
        seekTo={watchModal.seekTo}
        onClose={() => setWatchModal(null)}
      />
    )}
    </>
  );
}
