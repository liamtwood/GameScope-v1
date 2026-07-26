# Replit build prompt — GameScope "Player Profile 2.0" (Performance tab)

Paste this into Replit's AI agent. It assumes GameScope's existing React app with the current Player Profile detail page (Bio / Attack / Passing / Defense / Videos tabs) and the existing team-level Spider Charts pattern (radar + metrics table). This adds a new **Performance** tab to the player profile.

---

## Goal

Add a **Performance** tab to the Player Profile detail page that reframes a player's stats as a *development-vs-pathway* view for academy coaches/analysts. Every metric is shown per-90, paired volume + efficiency, and benchmarked against a **first-team pathway target** (a first-team player in the same position). Reuse the app's existing radar+table concept, but in the **dark "PlayerCam" broadcast style** (not the current light stat-cards).

## Audience & framing

Academy coaches/analysts. The page answers: *how far is this player from first-team standard, on which dimensions, is the gap closing, and what should we work on?* Lead with strengths (superpower + must-fix blockers), not a flat list of deficits.

## Visual style (match the PlayerCam decks)

- Background `#080808`, panels `#151515`, borders `#2a2a2a`, text `#f4f4f4`, muted `#8f8f8f`.
- Accent (subject player) cyan `#29c5f6`. Pathway target magenta/pink `#ff5a7a`. Attacking-phase highlight gold `#ffd23f`. Positive trend green `#3ddc84`.
- Dense, TV-graphic feel. Rounded 14px cards. Sans-serif.

## Components (top → bottom)

1. **Header / verdict strip** — player photo, name, jersey, position, foot, age, minutes; a chip naming the **pathway target** player; a circular gauge showing **overall % of first-team target**; a one-line role label + verdict sentence.

2. **Comparison toggle** — `vs First-Team Target` (default) · `vs Age Peers` · `vs Own Trajectory`. Switches what the radar/bars compare against.

3. **Performance radar** (comparison style) — subject player's filled shape (cyan) overlaid on the target's outline (magenta). Axes = the **position's headline dimensions** (8 for a winger). Each axis label carries a small dot coloured by phase (defend `#ff5a7a` / progression `#29c5f6` / attack `#ffd23f`). Scores are 0–100 (percentile-vs-position).

4. **Development focus panel** (strengths-led) — a highlighted **Superpower** card (the top dimension, with a "protect & sharpen" coaching note) + a short **Must-fix blockers** list (1–3 items, each with "% of target" and a one-line reason). *Add a config flag `focusMode: 'strengths-led' | 'gap-led'` — gap-led just ranks the largest deficits instead.*

5. **Position-tailored metric table** — grouped by dimension. Each row: metric name, **Volume /90** (value + percentile bar + target value), **Efficiency** (value + percentile bar, or "—" if none), and a **trend sparkline**. Only show metrics relevant to the player's position (see tailoring below).

6. **Trajectory chart** — line of "% of first-team target" across recent match-windows, with a dashed reference line at the target, showing the gap closing.

7. **Left/attacking activity map** — a half-pitch rendered from event **x/y** coordinates: plot the player's take-ons (won/lost), carries, crosses, or (for defenders) ball-wins and progressive passes. This is the differentiator vs the current tables.

8. **Match-context strip** (optional) — a single-match line for reference.

## Position tailoring (core logic)

Each position has a **dimension weighting** deciding which dimensions are headline (radar + top) vs hidden. Drive this from config, not hardcoded per component:

```
DIMENSIONS = ['ball_progression','distribution','chance_creation','take_on',
              'finishing','aerial_attack','aerial_defence','ground_defence','transition']
```

Headline sets (● headline shown on radar):
- **Winger:** take_on, ball_progression, chance_creation, finishing, transition, distribution, ground_defence (+ a "crossing" sub-metric of chance_creation)
- **Full-back:** ground_defence, ball_progression, chance_creation, transition, aerial_defence
- **Centre-back:** aerial_defence, ground_defence, ball_progression, distribution
- **Central mid:** distribution, ball_progression, transition, ground_defence, chance_creation
- **Centre-forward:** finishing, aerial_attack, chance_creation, take_on, transition
- **Goalkeeper:** separate GK dimension set (shot_stopping, short_distribution, long_distribution, claiming, sweeping, one_v_one)

Each dimension is a **composite** of raw per-90 metrics (see the reporting framework doc). Compute a 0–100 percentile per dimension from the underlying metrics vs the position cohort.

## Data model

Consume a JSON payload per player (see `example_data.json`). Shape:

```jsonc
{
  "player": { "id","name","jersey","position","foot","age","minutes","photoUrl" },
  "pathwayTarget": { "name","team","position" },
  "index": { "overallPctOfTarget": 0-100, "roleLabel","verdict" },
  "dimensions": [ { "key","label","group":"defend|progression|attack",
                    "playerScore":0-100, "targetScore":0-100 } ],
  "metrics": [ { "dimension","label","subLabel",
                 "volume": {"value","unit","percentile","target"},
                 "efficiency": {"value","unit","percentile"} | null,
                 "trend": [numbers] } ],
  "trajectory": { "labels":[...], "pctOfTarget":[...], "targetLine": 90 },
  "focus": { "mode":"strengths-led",
             "superpower": {"dimension","title","note"},
             "blockers": [ {"title","pctOfTarget","reason"} ] },
  "pitch": { "events":[ {"type":"take_on_won|take_on_lost|cross|carry|ball_win",
                          "x":0-100,"y":0-100,"x2","y2"} ] },
  "matchSample": { "label", "stats":[ {"label","value"} ] }
}
```

Percentiles and dimension scores are computed server-side from event data; the front end just renders. Keep all thresholds/weights in config so the model can be tuned without code changes.

## Interactions

- Comparison toggle re-fetches/re-renders against the chosen benchmark.
- Fixture filter (reuse the existing "This Season / single fixture" dropdown) applies to all metrics.
- Hover a metric bar → tooltip with raw counts and sample size (minutes). **Grey out / flag any metric under a minimum-minutes threshold** ("small sample").
- (Stretch) click a metric or a pitch event → jump to the tagged video clips (reuse Videos tab linkage).

## Acceptance

- New Performance tab renders from the JSON payload with no console errors.
- Radar overlays player vs target; changing position changes which axes appear.
- Metric table groups by dimension and hides non-relevant metrics for the position.
- Trajectory and pitch map render from the payload.
- `focusMode` flag switches strengths-led ↔ gap-led.
- Dark PlayerCam theme throughout; matches the provided mockup HTML.

## Reference files

- `gamescope_player_profile_mockup.html` — the visual target (build to this look).
- `example_data.json` — a working payload (academy winger vs Lauren Hemp).
- `player_profile_reporting_framework.md` — dimension definitions, position weighting, metric lists.
