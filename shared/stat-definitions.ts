/**
 * Stat Definitions Registry
 *
 * Maps every stat key to its category, display label, unit, and sort index.
 * The JSONB stats blobs in player_season_stats and player_match_logs stay flat;
 * this registry is what tells any display which keys belong to which category
 * and in what order.
 *
 * Adding a new derived stat (e.g. xG, xA) only requires a new entry here —
 * no DB migration or API change needed.
 */

export type StatCategory = 'attack' | 'passing' | 'defense' | 'physical' | 'possession';
export type StatUnit = 'count' | 'percent' | 'per90' | 'minutes' | 'meters' | 'km/h';

export interface StatDefinition {
  /** Flat key used in the JSONB stats blob */
  key: string;
  category: StatCategory;
  label: string;
  unit: StatUnit;
  /** Sort order within the category (lower = first) */
  index: number;
}

export const STAT_DEFINITIONS: StatDefinition[] = [
  // ── Attack ─────────────────────────────────────────────────────────────────
  { key: 'goals',               category: 'attack',     label: 'Goals',                  unit: 'count',   index: 0  },
  { key: 'assists',             category: 'attack',     label: 'Assists',                unit: 'count',   index: 1  },
  { key: 'g_a',                 category: 'attack',     label: 'Goals + Assists',        unit: 'count',   index: 2  },
  { key: 'g_minus_pk',          category: 'attack',     label: 'Non-PK Goals',           unit: 'count',   index: 3  },
  { key: 'pk',                  category: 'attack',     label: 'Penalties Scored',       unit: 'count',   index: 4  },
  { key: 'pk_att',              category: 'attack',     label: 'Penalties Attempted',    unit: 'count',   index: 5  },
  { key: 'shots',               category: 'attack',     label: 'Shots',                  unit: 'count',   index: 6  },
  { key: 'shots_on_target',     category: 'attack',     label: 'Shots on Target',        unit: 'count',   index: 7  },
  { key: 'crosses',             category: 'attack',     label: 'Crosses',                unit: 'count',   index: 8  },
  { key: 'own_goals',           category: 'attack',     label: 'Own Goals',              unit: 'count',   index: 9  },
  // xG and xA are placeholder slots — populated by Task #12 without any schema change
  { key: 'xg',                  category: 'attack',     label: 'xG',                     unit: 'per90',   index: 10 },
  { key: 'xa',                  category: 'attack',     label: 'xA',                     unit: 'per90',   index: 11 },
  { key: 'gls_per90',           category: 'attack',     label: 'Goals per 90',           unit: 'per90',   index: 12 },
  { key: 'ast_per90',           category: 'attack',     label: 'Assists per 90',         unit: 'per90',   index: 13 },
  { key: 'g_a_per90',           category: 'attack',     label: 'G+A per 90',             unit: 'per90',   index: 14 },
  { key: 'g_minus_pk_per90',    category: 'attack',     label: 'Non-PK Goals per 90',    unit: 'per90',   index: 15 },
  { key: 'g_a_minus_pk_per90',  category: 'attack',     label: 'G+A−PK per 90',          unit: 'per90',   index: 16 },

  // ── Passing ────────────────────────────────────────────────────────────────
  { key: 'passes_attempted',    category: 'passing',    label: 'Passes Attempted',       unit: 'count',   index: 0  },
  { key: 'passes_success',      category: 'passing',    label: 'Passes Completed',       unit: 'count',   index: 1  },
  { key: 'passing_success_rate',category: 'passing',    label: 'Pass Accuracy',          unit: 'percent', index: 2  },

  // ── Defense ────────────────────────────────────────────────────────────────
  { key: 'tackles_won',         category: 'defense',    label: 'Tackles Won',            unit: 'count',   index: 0  },
  { key: 'interceptions',       category: 'defense',    label: 'Interceptions',          unit: 'count',   index: 1  },
  { key: 'fouls_committed',     category: 'defense',    label: 'Fouls Committed',        unit: 'count',   index: 2  },
  { key: 'fouls_won',           category: 'defense',    label: 'Fouls Won',              unit: 'count',   index: 3  },
  { key: 'pressures',           category: 'defense',    label: 'Pressures',              unit: 'count',   index: 4  },
  { key: 'offsides',            category: 'defense',    label: 'Offsides',               unit: 'count',   index: 5  },
  { key: 'pk_won',              category: 'defense',    label: 'Penalties Won',          unit: 'count',   index: 6  },
  { key: 'pk_conceded',         category: 'defense',    label: 'Penalties Conceded',     unit: 'count',   index: 7  },
  { key: 'yellow_cards',        category: 'defense',    label: 'Yellow Cards',           unit: 'count',   index: 8  },
  { key: 'red_cards',           category: 'defense',    label: 'Red Cards',              unit: 'count',   index: 9  },

  // ── Physical ───────────────────────────────────────────────────────────────
  { key: 'min_played',          category: 'physical',   label: 'Minutes Played',         unit: 'minutes', index: 0  },
  { key: 'nineties',            category: 'physical',   label: '90s Played',             unit: 'count',   index: 1  },
  { key: 'total_distance',      category: 'physical',   label: 'Total Distance',         unit: 'meters',  index: 2  },
  { key: 'sprints_completed',   category: 'physical',   label: 'Sprints',                unit: 'count',   index: 3  },
  { key: 'high_intensity_runs', category: 'physical',   label: 'High-Intensity Runs',    unit: 'count',   index: 4  },

  // ── Possession ─────────────────────────────────────────────────────────────
  { key: 'mp',                        category: 'possession', label: 'Appearances',              unit: 'count',   index: 0  },
  { key: 'starts',                    category: 'possession', label: 'Starts',                   unit: 'count',   index: 1  },
  { key: 'dribbles',                  category: 'possession', label: 'Dribbles',                 unit: 'count',   index: 2  },
  { key: 'dribbles_successful',       category: 'possession', label: 'Successful Dribbles',      unit: 'count',   index: 3  },
  { key: 'take_ons',                  category: 'possession', label: 'Take-Ons',                 unit: 'count',   index: 4  },
  { key: 'first_touch_success',       category: 'possession', label: 'First Touch Success',      unit: 'count',   index: 5  },
  { key: 'first_touch_success_rate',  category: 'possession', label: 'First Touch Rate',         unit: 'percent', index: 6  },
];

/**
 * Helper: filter STAT_DEFINITIONS by category, sorted by index.
 * Use this in any display component to get the ordered list of keys to show.
 */
export function getStatsByCategory(category: StatCategory): StatDefinition[] {
  return STAT_DEFINITIONS
    .filter(s => s.category === category)
    .sort((a, b) => a.index - b.index);
}

/**
 * Helper: look up a single stat definition by key.
 */
export function getStatDefinition(key: string): StatDefinition | undefined {
  return STAT_DEFINITIONS.find(s => s.key === key);
}
