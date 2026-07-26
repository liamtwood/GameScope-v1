import { useState } from "react";

// ── colour tokens ────────────────────────────────────────────────────────────
const C = {
  bg:    "#080808",
  panel: "#151515",
  line:  "#2a2a2a",
  txt:   "#f4f4f4",
  dim:   "#8f8f8f",
  dim2:  "#6a6a6a",
  cyan:  "#29c5f6",
  tgt:   "#ff5a7a",
  gold:  "#ffd23f",
  good:  "#3ddc84",
};

const GRP_COLOR: Record<string, string> = {
  defend:      "#ff5a7a",
  progression: "#29c5f6",
  attack:      "#ffd23f",
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
    { key: "finishing",        label: "Finishing",        group: "attack",      playerScore: 74, targetScore: 88 },
    { key: "distribution",     label: "Retention",        group: "progression", playerScore: 82, targetScore: 91 },
    { key: "transition",       label: "Pressing",         group: "defend",      playerScore: 79, targetScore: 87 },
    { key: "ground_defence",   label: "Def. Work",        group: "defend",      playerScore: 70, targetScore: 82 },
  ],
  metrics: [
    { dimension: "take_on",         label: "Take-ons",             subLabel: "success rate",    volume: { value: "7.1", unit: "/90", percentile: 94, target: "7.5" }, efficiency: { value: "62", unit: "%", percentile: 80 }, trend: [74,78,80,82,86,88,91] },
    { dimension: "take_on",         label: "Progressive carries",  subLabel: "into final third", volume: { value: "6.5", unit: "/90", percentile: 88, target: "7.0" }, efficiency: { value: "48", unit: "%", percentile: 74 }, trend: [68,71,74,76,79,82,88] },
    { dimension: "take_on",         label: "Fouls won",            subLabel: "",                volume: { value: "2.3", unit: "/90", percentile: 85, target: "2.6" }, efficiency: null, trend: [72,75,76,79,81,83,85] },
    { dimension: "chance_creation", label: "Key passes",           subLabel: "",                volume: { value: "2.2", unit: "/90", percentile: 78, target: "2.8" }, efficiency: null, trend: [60,64,66,70,72,75,78] },
    { dimension: "chance_creation", label: "Expected assists (xA)",subLabel: "",                volume: { value: "0.24",unit: "/90", percentile: 71, target: "0.32" }, efficiency: null, trend: [52,56,58,62,65,68,71] },
    { dimension: "crossing",        label: "Crosses completed",    subLabel: "accuracy",        volume: { value: "1.8", unit: "/90", percentile: 68, target: "2.4" }, efficiency: { value: "28", unit: "%", percentile: 62 }, trend: [48,52,55,58,62,65,68] },
    { dimension: "chance_creation", label: "Passes into box",      subLabel: "",                volume: { value: "2.6", unit: "/90", percentile: 74, target: "3.1" }, efficiency: null, trend: [58,62,65,68,70,72,74] },
    { dimension: "finishing",       label: "Shots",                subLabel: "on-target %",     volume: { value: "2.8", unit: "/90", percentile: 80, target: "3.2" }, efficiency: { value: "51", unit: "%", percentile: 76 }, trend: [64,68,70,73,75,78,80] },
    { dimension: "finishing",       label: "xG (non-pen)",         subLabel: "per shot",        volume: { value: "0.30",unit: "/90", percentile: 77, target: "0.36" }, efficiency: { value: "0.11", unit: "", percentile: 72 }, trend: [58,62,65,68,71,74,77] },
    { dimension: "finishing",       label: "Non-penalty goals",    subLabel: "",                volume: { value: "0.35",unit: "/90", percentile: 82, target: "0.42" }, efficiency: null, trend: [64,68,70,74,76,79,82] },
    { dimension: "transition",      label: "Pressures",            subLabel: "press success",   volume: { value: "18.0",unit: "/90", percentile: 79, target: "21.0" }, efficiency: { value: "34", unit: "%", percentile: 72 }, trend: [62,66,68,70,74,76,79] },
    { dimension: "transition",      label: "Ball recoveries",      subLabel: "",                volume: { value: "4.0", unit: "/90", percentile: 74, target: "4.8" }, efficiency: null, trend: [60,64,66,68,70,72,74] },
    { dimension: "ground_defence",  label: "Counterpress regains", subLabel: "",                volume: { value: "1.7", unit: "/90", percentile: 68, target: "2.1" }, efficiency: null, trend: [54,58,60,62,64,66,68] },
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
    events: [
      { type: "take_on_won",  x: 17, y: 58 },
      { type: "take_on_won",  x: 22, y: 70 },
      { type: "take_on_won",  x: 19, y: 80 },
      { type: "take_on_won",  x: 25, y: 86 },
      { type: "take_on_won",  x: 14, y: 62 },
      { type: "take_on_won",  x: 28, y: 74 },
      { type: "take_on_lost", x: 20, y: 52, x2: undefined, y2: undefined },
      { type: "take_on_lost", x: 16, y: 67, x2: undefined, y2: undefined },
      { type: "cross",        x: 26, y: 90, x2: 55, y2: 92 },
      { type: "cross",        x: 22, y: 84, x2: 50, y2: 91 },
    ],
  },
  matchSample: {
    label: "2023 World Cup Final vs Spain (90 mins)",
    stats: [
      { label: "Shots",      value: 4 },
      { label: "On target",  value: 2 },
      { label: "Crosses",    value: 2 },
      { label: "Goals",      value: 0 },
      { label: "Assists",    value: 0 },
      { label: "Fouls won",  value: 1 },
      { label: "Yellow",     value: 1 },
    ],
  },
};

const METRIC_GROUPS = [
  { key: "take_on",         label: "1v1 & Carrying",         grp: "progression" },
  { key: "chance_creation", label: "Chance Creation",         grp: "attack" },
  { key: "crossing",        label: "Crossing",                grp: "attack" },
  { key: "finishing",       label: "Finishing",               grp: "attack" },
  { key: "transition",      label: "Transition & Defending",  grp: "defend" },
  { key: "ground_defence",  label: "Defensive Work",          grp: "defend" },
];

// ── sub-components ────────────────────────────────────────────────────────────

function CircularGauge({ pct }: { pct: number }) {
  const r = 48, cx = 60, cy = 60, circ = 2 * Math.PI * r;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#242424" strokeWidth={10} />
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
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon
          key={f}
          points={Array.from({ length: N }, (_, i) => pt(i, R * f).map(v => v.toFixed(1)).join(",")).join(" ")}
          fill="none" stroke={C.line} strokeWidth={1}
        />
      ))}
      {/* Spokes */}
      {Array.from({ length: N }, (_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke={C.line} strokeWidth={1} />;
      })}
      {/* Target outline (dashed magenta) */}
      <polygon
        points={polyPts(dims.map(d => d.targetScore))}
        fill="none" stroke={C.tgt} strokeWidth={1.8} strokeDasharray="5 3" strokeLinejoin="round"
      />
      {/* Player fill */}
      <polygon
        points={polyPts(dims.map(d => d.playerScore))}
        fill={C.cyan} fillOpacity={0.22} stroke={C.cyan} strokeWidth={2} strokeLinejoin="round"
      />
      {/* Player dots */}
      {dims.map((d, i) => {
        const [x, y] = pt(i, (R * d.playerScore) / 100);
        return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={3} fill={C.cyan} />;
      })}
      {/* Labels + phase dots */}
      {dims.map((d, i) => {
        const [lx, ly] = pt(i, R + 22);
        const [dx, dy] = pt(i, R + 8);
        const anchor = lx < CX - 8 ? "end" : lx > CX + 8 ? "start" : "middle";
        return (
          <g key={i}>
            <circle cx={dx.toFixed(1)} cy={dy.toFixed(1)} r={3.5} fill={GRP_COLOR[d.group] ?? C.dim} />
            <text x={lx.toFixed(1)} y={ly.toFixed(1)} fill="#a6a6a6" fontSize={9.5}
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
        if (ev.type === "cross" && ev.x2 != null && ev.y2 != null) {
          const x2 = px(ev.x2 as number), y2 = py(ev.y2 as number);
          return (
            <g key={i}>
              <line x1={x} y1={y} x2={x2} y2={y2} stroke={C.gold} strokeWidth={1.6} strokeDasharray="3 3" />
              <circle cx={x} cy={y} r={3} fill={C.gold} />
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
  const data = DEMO;

  const s: Record<string, React.CSSProperties> = {
    card:    { background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 },
    sectionLabel: { fontSize: 11, letterSpacing: 1.5, color: C.dim2, textTransform: "uppercase", margin: "28px 0 6px", fontWeight: 700 },
    cardLabel:    { fontSize: 11, letterSpacing: 1, color: C.dim, fontWeight: 700, textTransform: "uppercase" },
    tag:     { fontSize: 11, border: `1px solid ${C.line}`, borderRadius: 6, padding: "4px 9px", color: C.dim, background: "#111" },
    tagTgt:  { fontSize: 11, border: `1px solid ${C.tgt}`, borderRadius: 6, padding: "4px 9px", color: "#ffd0da", background: "#111" },
  };

  return (
    <div style={{ background: C.bg, color: C.txt, fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif", minHeight: 600, padding: "24px 28px 56px" }}>

      {/* ── Hero ── */}
      <div style={{ display: "flex", gap: 22, alignItems: "center", background: "linear-gradient(100deg,#161616 0%,#0e0e0e 60%)", border: `1px solid ${C.line}`, borderRadius: 16, padding: "22px 24px" }}>
        {player?.photoURL ? (
          <img src={player.photoURL} alt="" style={{ width: 88, height: 88, borderRadius: 14, objectFit: "cover", border: `1px solid #2f2f2f`, flexShrink: 0 }} />
        ) : (
          <div style={{ width: 88, height: 88, borderRadius: 14, background: "#232323", border: `1px solid #2f2f2f`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#555" }}>
            {player?.firstName?.[0]}{player?.lastName?.[0]}
          </div>
        )}

        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          <div style={{ fontSize: 10, color: C.dim, fontWeight: 600, letterSpacing: 2, marginBottom: 4 }}>OVERALL · DEVELOPMENT PROFILE</div>
          <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.1 }}>
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
            <span style={s.tagTgt}>Benchmark <b style={{ color: C.tgt }}>{data.pathwayTarget.name}</b></span>
          </div>
          <div style={{ marginTop: 12, fontSize: 13.5, color: "#d7d7d7", lineHeight: 1.55 }}>
            <span style={{ color: C.cyan, fontWeight: 700 }}>{data.index.roleLabel}. </span>
            {data.index.verdict}
          </div>
        </div>

        <div style={{ flexShrink: 0, textAlign: "center" }}>
          <CircularGauge pct={data.index.overallPctOfTarget} />
          <div style={{ fontSize: 10, color: C.dim, letterSpacing: 1, marginTop: 5, maxWidth: 110 }}>OVERALL VS BENCHMARK</div>
        </div>
      </div>

      {/* ── Compare toggle ── */}
      <div style={{ display: "flex", margin: "18px 0 4px", border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden", width: "fit-content" }}>
        {([ ["target", `vs ${data.pathwayTarget.name}`], ["peers", "vs Age Peers"], ["trajectory", "vs Own Trajectory"] ] as const).map(([k, label]) => (
          <button key={k} onClick={() => setCompareMode(k)} style={{
            background: compareMode === k ? C.cyan : "transparent",
            color: compareMode === k ? "#062430" : C.dim,
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
            <span><span style={{ display: "inline-block", width: 11, height: 11, borderRadius: 2, background: C.cyan, marginRight: 6, verticalAlign: "middle" }} />{player?.firstName ?? "Player"}</span>
            <span><span style={{ display: "inline-block", width: 11, height: 11, borderRadius: 2, background: C.tgt, marginRight: 6, verticalAlign: "middle" }} />{data.pathwayTarget.name}</span>
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
          <div style={{ border: `1px solid ${C.cyan}`, borderRadius: 12, padding: 14, background: "linear-gradient(180deg,rgba(41,197,246,.10),rgba(41,197,246,0))", marginTop: 10 }}>
            <div style={{ fontSize: 11, color: C.cyan, letterSpacing: 1, fontWeight: 700 }}>★ SUPERPOWER — PROTECT &amp; SHARPEN</div>
            <div style={{ fontSize: 17, fontWeight: 800, margin: "4px 0 7px" }}>{data.focus.superpower.title}</div>
            <div style={{ fontSize: 12.5, color: "#cfcfcf", lineHeight: 1.5 }}>{data.focus.superpower.note}</div>
          </div>

          {/* Blockers */}
          <div style={{ fontSize: 11, letterSpacing: 1, color: C.dim, fontWeight: 700, textTransform: "uppercase", margin: "16px 0 2px" }}>Must-fix blockers</div>
          {data.focus.blockers.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "11px 0", borderBottom: i < data.focus.blockers.length - 1 ? `1px solid ${C.line}` : "none" }}>
              <div style={{ flexShrink: 0, width: 8, height: 8, borderRadius: "50%", background: C.tgt, marginTop: 5 }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>
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
        {/* Header row */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.1fr 1fr 58px", gap: 12, fontSize: 10, letterSpacing: 1, color: C.dim2, textTransform: "uppercase", paddingBottom: 6, borderBottom: `1px solid ${C.line}`, marginBottom: 2 }}>
          <span>Metric</span><span>Volume /90</span><span>Efficiency</span><span>Trend</span>
        </div>

        {METRIC_GROUPS.map(grp => {
          const rows = data.metrics.filter(m => m.dimension === grp.key);
          if (!rows.length) return null;
          return (
            <div key={grp.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: "#dcdcdc", margin: "14px 0 8px" }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: GRP_COLOR[grp.grp], display: "inline-block", flexShrink: 0 }} />
                {grp.label}
              </div>
              {rows.map((row, ri) => (
                <div key={ri} style={{ display: "grid", gridTemplateColumns: "1.5fr 1.1fr 1fr 58px", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #202020" }}>
                  {/* Name */}
                  <div style={{ fontSize: 13 }}>
                    {row.label}
                    {row.subLabel && <div style={{ color: C.dim2, fontSize: 10.5, marginTop: 2 }}>{row.subLabel}</div>}
                  </div>

                  {/* Volume */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                      {row.volume.value}
                      <span style={{ fontSize: 10, color: C.dim, fontWeight: 400 }}> {row.volume.unit} · {row.volume.percentile}th · tgt {row.volume.target}</span>
                    </div>
                    <div style={{ height: 6, background: "#242424", borderRadius: 4, marginTop: 4, position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", inset: 0, width: `${row.volume.percentile}%`, borderRadius: 4, background: C.cyan }} />
                    </div>
                  </div>

                  {/* Efficiency */}
                  {row.efficiency ? (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>
                        {row.efficiency.value}{row.efficiency.unit}
                        <span style={{ fontSize: 10, color: C.dim, fontWeight: 400 }}> {row.efficiency.percentile}th</span>
                      </div>
                      <div style={{ height: 6, background: "#242424", borderRadius: 4, marginTop: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${row.efficiency.percentile}%`, borderRadius: 4, background: GRP_COLOR[grp.grp] }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: C.dim2, fontSize: 14 }}>—</div>
                  )}

                  {/* Sparkline */}
                  <SparkLine data={row.trend} />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* ── Trajectory + Pitch ── */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 20 }}>

        {/* Trajectory */}
        <div style={{ ...s.card, flex: "1 1 340px", minWidth: 300 }}>
          <div style={{ ...s.cardLabel, marginBottom: 8 }}>Trajectory · gap to benchmark closing</div>
          <TrajectoryChart traj={data.trajectory} />
          <div style={{ fontSize: 12, color: C.dim, marginTop: 10, lineHeight: 1.7 }}>
            Last 3 windows: {data.trajectory.pctOfTarget.slice(-3).join("% → ")}% of benchmark.{" "}
            <b style={{ color: C.good }}>+{data.trajectory.pctOfTarget[data.trajectory.pctOfTarget.length - 1] - data.trajectory.pctOfTarget[0]} pts</b> since season start.
          </div>
        </div>

        {/* Pitch map */}
        <div style={{ ...s.card, flex: "1 1 280px", minWidth: 260 }}>
          <div style={{ ...s.cardLabel, marginBottom: 8 }}>Left-wing activity map · from event x/y</div>
          <PitchMap events={data.pitch.events} />
          <div style={{ display: "flex", gap: 14, fontSize: 11, color: C.dim, marginTop: 8, flexWrap: "wrap" }}>
            {[["#29c5f6","Take-on won"],["#555","Take-on lost"],["#ffd23f","Cross"]].map(([bg, label]) => (
              <span key={label}><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: bg, marginRight: 5, verticalAlign: "middle" }} />{label}</span>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: C.dim, lineHeight: 1.5, marginTop: 8 }}>
            Where she wins her 1v1s and progresses — concentrated in the left channel. Coordinates sourced from match event data.
          </div>
        </div>
      </div>

      {/* ── Match context ── */}
      <div style={{ ...s.card, marginTop: 20 }}>
        <div style={{ ...s.cardLabel, marginBottom: 10 }}>Reference · {data.matchSample.label}</div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
          {data.matchSample.stats.map(stat => (
            <div key={stat.label} style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.1, color: C.txt }}>{stat.value}</span>
              <span style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{stat.label}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, background: "rgba(255,210,63,.08)", border: "1px solid rgba(255,210,63,.28)", color: "#ffe08a", fontSize: 11.5, borderRadius: 10, padding: "9px 14px", lineHeight: 1.5 }}>
          ⚠ Illustrative data — percentiles and dimension scores are demonstration values. Connect real season event data to compute live percentiles vs position cohort.
        </div>
      </div>

    </div>
  );
}
