# Fixtures Requirements - GameScope (UPDATED)

> **Changes from original marked with:**
> - NEW — Brand new FR or AC
> - UPDATED — Existing FR/AC with expanded description
> - DISCREPANCY — Conflict between requirements and build

---

## Pages

### P-005: Fixtures
- **Section**: team
- **Route**: `/fixtures`
- **Overview**: The Fixtures page is the central hub for managing all team matches. You can schedule fixtures in the future and add fixtures that have already completed.

### P-006: View Fixture Detail
- **Section**: team
- **Route**: `/fixtures/:id`
- **Overview**: Detailed view of a single fixture. Organised into tabs: Fixture Details, Match Report, Line-Ups, Videos, Statistics, Spider Charts, and GameScope Analysis.

### P-029: View Fixture
- **Section**: team
- **Route**: `/team/dashboard/fixture`
- **Overview**: Quick view of fixture details from dashboard.

---

## EPIC-005: Fixtures (Page: P-005)
**Status**: defined
**Overview**: The Fixtures page is the central hub for managing all team matches.

### FR-008: Fixtures List View
**Description**: The Fixtures page shows summary statistics at the top as a 4-column grid: Total Fixtures, Win Rate, Goal Difference, and active Competitions. Fixtures are displayed as cards showing the opposition, date, competition, location badge (HOME in green or AWAY in blue), and the result or status. Click any fixture card to open the Fixture Detail page.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-028 | Statistics cards values | All 4 statistics cards display with correct values | new |
| AC-029 | Win Rate icon reflects performance | Win Rate icon reflects performance (green/red/gray) | new |

### FR-009: Control Bar
**Description**: Left: Enable Filter button, Search input. Right: Add Fixture button, Import CSV button, Settings button. Use the Search bar to quickly find fixtures by opponent name, venue, or competition.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-030 | Search filters fixtures | Search filters fixtures by opponent, venue, competition | new |
| AC-031 | Buttons trigger actions | All buttons trigger correct actions | new |

### FR-010: Filter Panel
**Description**: Collapsible filter panel. Use the Filter button to narrow down fixtures by Season, Competition, Status (All / Completed / Scheduled), or Location (All / Home / Away). Filters combine together.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-032 | Filters work independently | All filters work independently | new |
| AC-033 | Filters combine with AND | Filters combine with AND logic | new |
| AC-034 | Filter panel toggle | Filter panel expands/collapses correctly | new |

### FR-011: FixtureCard Component
**Description**: Each fixture card displays: Opposition logo/avatar, Opponent name, Date/time, Competition name, Location Badge (HOME in green or AWAY in blue), Result/Status (Completed: Score + W/L/D badge, Scheduled: SCHEDULED badge), and action icons for Video, Stats, Edit, and Delete.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-035 | FixtureCard elements | Fixture cards display all required elements | new |
| AC-036 | Card navigation | Clicking card navigates to fixture detail | new |

### FR-012: Add/Edit Fixture (UPDATED)
**Description**: Form for creating and editing fixtures. Fields: Opposition (autocomplete with inline + to add new), Date (DD Mon YYYY), Time Slot (Morning=10:00, Afternoon=15:00, Evening=20:00 with manual override), Competition (dropdown with + to add new, default None), Type (Home/Away toggle), Home Score (edit mode only), Away Score (edit mode only), Status (Scheduled, In Progress, Completed, Postponed, Cancelled, No Contest). Auto-calculates result (Win/Loss/Draw) and updates Win Rate and Goal Difference.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-037 | Form validates fields | Form validates all required fields | new |
| AC-038 | Inline opposition creation | Opposition can be created inline during fixture creation | new |
| AC-039 | Edit mode pre-populates | Edit mode pre-populates all fields | new |
| AC-040 | Success message on save | Success message displays after database confirms save | new |
| AC-181 | Time Slot sets kick-off (NEW) | Selecting Morning/Afternoon/Evening auto-sets kick-off to 10:00/15:00/20:00 respectively | new |
| AC-182 | Time manually adjustable (NEW) | Kick-off time can be manually adjusted after Time Slot selection | new |
| AC-183 | All 6 statuses available (NEW) | Status dropdown offers all 6 options: Scheduled, In Progress, Completed, Postponed, Cancelled, No Contest | new |
| AC-184 | Result auto-calculated (NEW) | System calculates Win/Loss/Draw from scores and updates list page stats | new |

### FR-013: Delete Fixture
**Description**: To delete a fixture, click the Delete button on the fixture card or from the Fixture Detail page. A confirmation dialog will ask you to confirm. Deleting a fixture removes it from the list but any associated videos and match statistics are preserved for historical records.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-041 | Delete confirmation dialog | Delete shows confirmation dialog | new |
| AC-042 | Deleted fixture removed | Deleted fixture removed from list | new |
| AC-043 | Videos preserved | Associated videos and match statistics preserved for historical records | new |

### FR-022: Import Fixtures from Excel/CSV
**Description**: Bulk import fixtures using the Import CSV button. Preview data with colour-coded validation (green for valid, red for errors, yellow for warnings) before importing.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-066 | Import file types | Import accepts .csv and .xlsx files | new |
| AC-067 | Preview validation status | Preview shows validation status per row with colour coding | new |
| AC-068 | Import valid only | Import Valid Only skips error rows | new |

### FR-059: Opponent Management (NEW)
**Description**: Opponents can be added on the fly by coaches during fixture creation, stored at club level for reuse across teams. Fields: Team Name (required), Short Name (max 5 chars), Logo (auto background removal), Primary Colour (result banner background), Secondary Colour (result banner text). Visibility toggle hides from dropdown while preserving history. No delete — use visibility. Rename cascades to all linked fixtures.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-185 | Inline creation from fixture form | Opponents can be created inline via + button during fixture creation | new |
| AC-186 | Club-level reuse | Opponents created by any coach are available to all teams in the club | new |
| AC-187 | Logo background removal | System automatically removes background from uploaded logos | new |
| AC-188 | Primary colour on banner | Opponent primary colour is used for the result banner background | new |
| AC-189 | Secondary colour on text | Opponent secondary colour is used for the result banner text | new |
| AC-190 | Rename cascades | Renaming an opponent updates the name across all linked fixtures | new |
| AC-191 | Cannot delete opponent | Opponents cannot be deleted; only hidden via visibility toggle | new |
| AC-192 | Hidden opponents excluded from dropdown | Hidden opponents do not appear in Opposition dropdown for new/edit fixture | new |
| AC-193 | Hidden opponents preserved on fixtures | Existing fixtures retain their opponent assignment when opponent is hidden | new |

> DISCREPANCY: FR-052 in EPIC-013 (Settings) defines soft delete for opposition. The current build does NOT allow opponent deletion. FR-052 should be updated to reflect that opponents cannot be deleted, only hidden via visibility toggle.

### FR-060: Competition Management (NEW)
**Description**: Settings cog button opens Competition management. Actions: Search (filter by name), Add (type name + click Add), Visible (toggle on/off — hidden excluded from dropdown), Edit (rename via edit icon), Delete (remove with confirmation — fixtures set to no competition). Club-level scope.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-194 | Search filters competitions | Search bar filters competitions by name | new |
| AC-195 | Add new competition | New competition can be created with name and + Add button | new |
| AC-196 | Visibility toggle | Hidden competitions don't appear in Competition dropdown for new/edit fixture | new |
| AC-197 | Hidden competitions preserved | Existing fixtures retain their competition assignment when competition is hidden | new |
| AC-198 | Edit renames competition | Competition can be renamed via edit icon | new |
| AC-199 | Delete removes competition | Competition can be deleted via delete icon with confirmation | new |
| AC-200 | Delete sets fixtures to none | Fixtures assigned to a deleted competition are set to no competition | new |
| AC-201 | Club-level scope | Competition changes apply across all teams within the club | new |
| AC-202 | Unlimited competitions | No limit on number of competitions that can be created | new |

### Epic-Level Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-203 | Handles 500+ fixtures | Fixtures page handles 500+ fixtures without performance issues | new |
| AC-204 | Database confirmation | All fixture operations confirm with database before showing success | new |
| AC-205 | Data persists refresh | Fixture data persists after page refresh | new |

---

## EPIC-009: View Fixture Detail (Page: P-006)
**Status**: defined
**Overview**: When you open a fixture, the detail page is organised into tabs for different aspects of match data.

### FR-014: Fixture Detail Header
**Description**: Match Header with both team logos, team names with score (if completed), date, time, venue, competition, and status badge. Navigation: Back button, Edit Fixture button, Delete button.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-044 | Match header displays | Match header displays both team logos and names | new |
| AC-045 | Score completed only | Score displays only for completed fixtures | new |
| AC-046 | Back button navigation | Back button returns to Fixtures list | new |
| AC-047 | Edit/Delete visibility | Edit/Delete buttons visible for authorized users | new |

### FR-015: Match Report Tab
**Description**: Match Report and Attendance displayed (read only) on Match Video page. Editable on Edit Fixture page. Includes scoreboard with goal scorers, key facts, event timeline, and export options.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-048 | Match report renders | Match header and event timeline render correctly | new |
| AC-049 | Export produces valid files | Export produces valid PDF/HTML with all match data | new |

### FR-016: Line-Ups Tab
**Description**: Set Home and Away line-ups. Select players for Starting XI and Substitutes. Assign formations (e.g. 4-4-2, 4-3-3), record substitutions with timestamps. Player status tags: Captain, Yellow Card, Red Card, Injured.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-050 | Formation display | Formation display matches stored metadata | new |
| AC-051 | Substitution rules | Substitution log enforces player availability rules | new |

### FR-017: Videos Tab
**Description**: Video management for this fixture. Upload files or provide links. Multiple videos supported (e.g. different camera angles). Each video gets a camera label. Built-in player with play/pause, speed (0.5x, 1x, 2x), fullscreen. Videos also accessible from Match Video page in read-only mode.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-052 | Video upload with label | Add Video allows file upload with camera label assignment | new |
| AC-053 | AI processing trigger | Process All Videos triggers AI analysis and shows progress | new |
| AC-054 | JSON validation | Upload JSON Events validates format before import | new |
| AC-055 | Edit/Delete confirmation | Edit/Delete actions work with confirmation | new |

### FR-018: Upload Data Tab
**Description**: File upload for statistics, events, tracking data with validation. Dev feature — not user-facing until backend analysis is added.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-056 | Invalid files rejected | Invalid files rejected with specific row/field errors | new |
| AC-057 | Upload with audit trail | Upload completes within 60 seconds with audit trail | new |

### FR-019: Statistics Tab
**Description**: Side-by-side comparison of both teams' match statistics. Categories: Attack (Goals, Shots Attempted, Shots on Target, Runs into Boxes, Corners, Dangerous Crosses), Possession (Ball Possession, Dribbles, Penetrating Dribbles, Take Ons, First Touch Success), Technical (Passes Attempted, Passes Success, Passing Success Rate, Passing Distance and Velocity).

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-058 | Category tabs display | All 3 category tabs display with correct metrics | new |
| AC-059 | Period filter updates | Period filter updates all metrics coherently | new |
| AC-060 | Stats render speed | Stats render within 100ms of filter change | new |

### FR-020: Spider Charts Tab
**Description**: Statistics visualised as Spider Charts (radar charts) for quick visual comparison. Three charts: Attack, Possession, Technical with normalised values.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-061 | Charts render correctly | All three charts render correctly | new |
| AC-062 | Chart metrics normalized | Each chart displays 6+ metrics with normalized values | new |
| AC-063 | Tooltips show values | Tooltips show actual metric values on hover | new |

### FR-021: AI Analysis Tab
**Description**: GameScope Analysis brings together all match insights. AI-generated match summaries, tactical themes, and recommendations (coming soon).

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-064 | AI narrative generation | AI generates coherent narrative from match data | new |
| AC-065 | Tactical themes supported | Tactical themes are supported by specific events/stats | new |

### Epic-Level Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-206 | Page load under 2s | Fixture detail page loads in under 2 seconds | new |

---

## Test Cases

No test cases currently defined for Fixtures pages.

---

## Change Summary

### New Items Added
| Type | FM ID | Title | Source |
|------|-------|-------|--------|
| FR | FR-059 | Opponent Management | User guide — "Adding a New Opponent" + "Opponent Settings" |
| FR | FR-060 | Competition Management | User guide — "Competition Settings" |
| AC | AC-181 | Time Slot sets kick-off | User guide — "Time Slot" field description |
| AC | AC-182 | Time manually adjustable | User guide — "You can still manually adjust" |
| AC | AC-183 | All 6 statuses available | User guide — "Status" field description |
| AC | AC-184 | Result auto-calculated | User guide — "automatically calculate the result" |
| AC | AC-185 | Inline creation from fixture form | User guide — "added on the fly" |
| AC | AC-186 | Club-level reuse | User guide — "reused by any team in the club" |
| AC | AC-187 | Logo background removal | User guide — "automatically remove the background" |
| AC | AC-188 | Primary colour on banner | User guide — "result banner background" |
| AC | AC-189 | Secondary colour on text | User guide — "result banner text" |
| AC | AC-190 | Rename cascades | User guide — "update the name across all existing fixtures" |
| AC | AC-191 | Cannot delete opponent | User guide — "cannot be deleted" |
| AC | AC-192 | Hidden opponents excluded | User guide — "won't appear in the Opposition dropdown" |
| AC | AC-193 | Hidden opponents preserved | User guide — "keep for historical fixture records" |
| AC | AC-194 | Search filters competitions | User guide — "search bar to filter competitions" |
| AC | AC-195 | Add new competition | User guide — "click + Add to create it" |
| AC | AC-196 | Visibility toggle | User guide — "hidden competitions won't appear" |
| AC | AC-197 | Hidden competitions preserved | User guide — derived from visibility behaviour |
| AC | AC-198 | Edit renames competition | User guide — "edit icon to rename" |
| AC | AC-199 | Delete removes competition | User guide — "delete icon to remove" |
| AC | AC-200 | Delete sets fixtures to none | User guide — "set to no competition" |
| AC | AC-201 | Club-level scope | User guide — "apply across all teams within the club" |
| AC | AC-202 | Unlimited competitions | User guide — "as many competitions as you need" |
| AC | AC-203 | Handles 500+ fixtures | Epic-level performance requirement |
| AC | AC-204 | Database confirmation | Epic-level data integrity requirement |
| AC | AC-205 | Data persists refresh | Epic-level persistence requirement |
| AC | AC-206 | Page load under 2s | Epic-level performance requirement |

### Items Updated (Expanded Descriptions)
| Type | ID | What Changed |
|------|----|-------------|
| FR | FR-012 | Added Time Slot field, 6 fixture statuses, auto-calculated results |
| FR | FR-008 | Expanded description from user guide |
| FR | FR-009 | Expanded description from user guide |
| FR | FR-010 | Expanded description from user guide |
| FR | FR-011 | Expanded description from user guide |
| FR | FR-013 | Expanded description from user guide |
| FR | FR-017 | Expanded description (camera labels, playback, read-only access) |
| FR | FR-019 | Expanded description with specific metric categories |
| FR | FR-020 | Expanded description from user guide |
| FR | FR-021 | Expanded description from user guide |

### Discrepancies Identified
| Issue | Location | Resolution Needed |
|-------|----------|-------------------|
| Opponent delete | FR-052 (EPIC-013) says soft delete allowed; build and user guide say no delete | Update FR-052 to remove delete, replace with visibility toggle |

### ID Mapping (Document IDs → FM Database IDs)
> The original document used IDs that conflicted with existing Squad items. Remapped as follows:

| Doc ID | FM ID | Reason |
|--------|-------|--------|
| FR-023 | FR-059 | FR-023 already used for Squad List View |
| FR-024 | FR-060 | FR-024 already used for Add Player |
| AC-072–AC-075 | AC-181–AC-184 | AC-072–075 already used for Squad ACs |
| AC-076–AC-084 | AC-185–AC-193 | AC-076–084 already used for Squad ACs |
| AC-085–AC-093 | AC-194–AC-202 | AC-085–093 already used for Squad ACs |
| AC-069–AC-071 | AC-203–AC-205 | AC-069–071 already used for other items |
| AC-110 | AC-206 | AC-110 already used for another item |

### Totals
| Type | Original | Updated | Delta |
|------|:--------:|:-------:|:-----:|
| Pages | 3 | 3 | — |
| Epics | 2 | 2 | — |
| Functional Requirements | 15 | 17 | +2 |
| Acceptance Criteria | 44 | 70 | +26 |
| Test Cases | 0 | 0 | — |
| **Total Items** | **64** | **92** | **+28** |
