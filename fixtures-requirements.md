# Fixtures Requirements - GameScope

## Pages

### P-005: Fixtures
- **Section**: team
- **Route**: `/fixtures`
- **Overview**: The Fixtures page is the central hub for managing all team matches, including scheduling, results, and video uploads.

### P-006: View Fixture Detail
- **Section**: team
- **Route**: `/fixtures/:id`
- **Overview**: Detailed view of a single fixture with match header, navigation actions, and tabbed content for different aspects of match data.

### P-029: View Fixture
- **Section**: team
- **Route**: `/team/dashboard/fixture`
- **Overview**: Quick view of fixture details from dashboard.

---

## EPIC-005: Fixtures (Page: P-005)
**Status**: defined
**Overview**: The Fixtures page is the central hub for managing all team matches, including scheduling, results, and video uploads.

### FR-008: Fixtures List View
**Description**: Statistics Cards (4-column grid): Total Fixtures, Win Rate, Goal Difference, Competitions.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-028 | Statistics cards values | All 4 statistics cards display with correct values | new |
| AC-029 | Win Rate icon reflects performance | Win Rate icon reflects performance (green/red/gray) | new |

### FR-009: Control Bar
**Description**: Left: Enable Filter button, Search input. Right: Add Fixture button, Import CSV button, Settings button.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-030 | Search filters fixtures | Search filters fixtures by opponent, venue, competition | new |
| AC-031 | Buttons trigger actions | All buttons trigger correct actions | new |

### FR-010: Filter Panel
**Description**: Collapsible filter panel: Season, Competition, Status, Location filters.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-032 | Filters work independently | All filters work independently | new |
| AC-033 | Filters combine with AND | Filters combine with AND logic | new |
| AC-034 | Filter panel toggle | Filter panel expands/collapses correctly | new |

### FR-011: FixtureCard Component
**Description**: Team Identity, Match Information, Location Badge, Result/Status, Actions.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-035 | FixtureCard elements | Fixture cards display all required elements | new |
| AC-036 | Card navigation | Clicking card navigates to fixture detail | new |

### FR-012: Add/Edit Fixture
**Description**: Form fields for creating and editing fixtures with inline opposition creation.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-037 | Form validates fields | Form validates all required fields | new |
| AC-038 | Inline opposition creation | Opposition can be created inline during fixture creation | new |
| AC-039 | Edit mode pre-populates | Edit mode pre-populates all fields | new |
| AC-040 | Success message on save | Success message displays after database confirms save | new |

### FR-013: Delete Fixture
**Description**: Soft delete with confirmation dialog. Associated videos preserved.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-041 | Delete confirmation dialog | Delete shows confirmation dialog | new |
| AC-042 | Deleted fixture removed | Deleted fixture removed from list | new |
| AC-043 | Videos preserved | Associated videos preserved | new |

### FR-022: Import Fixtures from Excel/CSV
**Description**: CSV Format with upload flow, validation, preview, import options.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-066 | Import file types | Import accepts .csv and .xlsx files | new |
| AC-067 | Preview validation status | Preview shows validation status per row | new |
| AC-068 | Import valid only | Import Valid Only skips error rows | new |

### Epic-Level Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-069 | Handles 500+ fixtures | Fixtures page handles 500+ fixtures without performance issues | new |
| AC-070 | Database confirmation | All fixture operations confirm with database before showing success | new |
| AC-071 | Data persists refresh | Fixture data persists after page refresh | new |

---

## EPIC-009: View Fixture Detail (Page: P-006)
**Status**: defined
**Overview**: Detailed view of a single fixture with match header, navigation actions, and tabbed content for different aspects of match data.

### FR-014: Fixture Detail Header
**Description**: Match Header with team logos, names, score, date/time/venue, navigation actions.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-044 | Match header displays | Match header displays both team logos and names | new |
| AC-045 | Score completed only | Score displays only for completed fixtures | new |
| AC-046 | Back button navigation | Back button returns to Fixtures list | new |
| AC-047 | Edit/Delete visibility | Edit/Delete buttons visible for authorized users | new |

### FR-015: Match Report Tab
**Description**: Scoreboard with goal scorers, key facts, event timeline, export options.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-048 | Match report renders | Match header and event timeline render correctly | new |
| AC-049 | Export produces valid files | Export produces valid PDF/HTML with all match data | new |

### FR-016: Line-Ups Tab
**Description**: Visual formation display with starting XI, substitutes, substitution log.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-050 | Formation display | Formation display matches stored metadata | new |
| AC-051 | Substitution rules | Substitution log enforces player availability rules | new |

### FR-017: Videos Tab
**Description**: Video management: Add, Process, View, Upload JSON Events, Edit, Delete.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-052 | Video upload with label | Add Video allows file upload with camera label assignment | new |
| AC-053 | AI processing trigger | Process All Videos triggers AI analysis and shows progress | new |
| AC-054 | JSON validation | Upload JSON Events validates format before import | new |
| AC-055 | Edit/Delete confirmation | Edit/Delete actions work with confirmation | new |

### FR-018: Upload Data Tab
**Description**: File upload for statistics, events, tracking data with validation.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-056 | Invalid files rejected | Invalid files rejected with specific row/field errors | new |
| AC-057 | Upload with audit trail | Upload completes within 60 seconds with audit trail | new |

### FR-019: Statistics Tab
**Description**: Side-by-side team comparison with metrics by category.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-058 | Category tabs display | All 5 category tabs display with correct metrics | new |
| AC-059 | Period filter updates | Period filter updates all metrics coherently | new |
| AC-060 | Stats render speed | Stats render within 100ms of filter change | new |

### FR-020: Spider Charts Tab
**Description**: Radar chart visualization of Attack, Possession, Technical metrics.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-061 | Charts render correctly | All three charts (Attack, Possession, Technical) render correctly | new |
| AC-062 | Chart metrics normalized | Each chart displays 6+ metrics with normalized values | new |
| AC-063 | Tooltips show values | Tooltips show actual metric values on hover | new |

### FR-021: AI Analysis Tab
**Description**: AI-generated match summary, tactical themes, recommendations.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-064 | AI narrative generation | AI generates coherent narrative from match data | new |
| AC-065 | Tactical themes supported | Tactical themes are supported by specific events/stats | new |

### Epic-Level Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-110 | Page load under 2s | Player profiles page loads in under 2 seconds | new |

---

## Test Cases

No test cases currently defined for Fixtures pages.

---

## Summary

| Type | Count |
|------|-------|
| Pages | 3 |
| Epics | 2 |
| Functional Requirements | 15 |
| Acceptance Criteria | 44 |
| Test Cases | 0 |
| **Total Items** | **64** |
