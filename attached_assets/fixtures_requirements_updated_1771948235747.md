# Fixtures Requirements - GameScope (UPDATED)

> **Changes from original marked with:**
> - 🆕 NEW — Brand new FR or AC
> - ✏️ UPDATED — Existing FR/AC with expanded description
> - ⚠️ DISCREPANCY — Conflict between requirements and build

---

## Pages

### P-005: Fixtures
- **Section**: team
- **Route**: `/fixtures`
- **Overview**: The Fixtures page is the central hub for managing all team matches. You can schedule fixtures in the future and add fixtures that have already completed. Click the Add Fixture button and then provide the Opposition and the Date and Time.

### P-006: View Fixture Detail
- **Section**: team
- **Route**: `/fixtures/:id`
- **Overview**: Detailed view of a single fixture. When you open a fixture, the detail page is organised into tabs: Fixture Details, Match Report, Line-Ups, Videos, Statistics, Spider Charts, and GameScope Analysis.

### P-029: View Fixture
- **Section**: team
- **Route**: `/team/dashboard/fixture`
- **Overview**: Quick view of fixture details from dashboard.

---

## EPIC-005: Fixtures (Page: P-005)
**Status**: defined
**Overview**: The Fixtures page is the central hub for managing all team matches. You can schedule fixtures in the future and add fixtures that have already completed.

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
**Description**: Collapsible filter panel. Use the Filter button to narrow down fixtures by Season, Competition, Status (All / Completed / Scheduled), or Location (All / Home / Away). Filters combine together, so you can for example show only Completed Home fixtures in the League.

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

### FR-012: Add/Edit Fixture ✏️ UPDATED
**Description**: Form for creating and editing fixtures with the following fields:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Opposition | Autocomplete | Yes | Select from previous opponents or click + to add new (see FR-023) |
| Date | Date Picker | Yes | DD Mon YYYY format |
| Time Slot | Dropdown | No | Morning, Afternoon, or Evening — automatically sets kick-off time (Morning = 10:00, Afternoon = 15:00, Evening = 20:00). Time can be manually adjusted after selection |
| Competition | Dropdown | Yes | Select from previous competitions or click + to add new (see FR-024). Default: None |
| Type | Toggle | Yes | Home or Away — defines where the match is played |
| Home Score | Number | No | Edit mode only — enter after match is completed |
| Away Score | Number | No | Edit mode only — enter after match is completed |
| Status | Dropdown | Yes | See status options below |

**Fixture Status Options** 🆕

| Status | Description |
|--------|-------------|
| Scheduled | Upcoming fixture |
| In Progress | Match is currently being played |
| Completed | Match has been played |
| Postponed | Match delayed to a later date |
| Cancelled | Match will not be played |
| No Contest | Match voided or abandoned |

**Auto-calculated fields:** For completed fixtures, the system automatically calculates the result (Win, Loss, or Draw) and updates the Win Rate and Goal Difference on the Fixtures list page.

**Inline Opposition Creation:** Opponents can be added on the fly during fixture creation. See FR-023 for opponent fields and FR-050/051 for logo management.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-037 | Form validates fields | Form validates all required fields | new |
| AC-038 | Inline opposition creation | Opposition can be created inline during fixture creation | new |
| AC-039 | Edit mode pre-populates | Edit mode pre-populates all fields | new |
| AC-040 | Success message on save | Success message displays after database confirms save | new |
| AC-072 | Time Slot sets kick-off 🆕 | Selecting Morning/Afternoon/Evening auto-sets kick-off to 10:00/15:00/20:00 respectively | new |
| AC-073 | Time manually adjustable 🆕 | Kick-off time can be manually adjusted after Time Slot selection | new |
| AC-074 | All 6 statuses available 🆕 | Status dropdown offers all 6 options: Scheduled, In Progress, Completed, Postponed, Cancelled, No Contest | new |
| AC-075 | Result auto-calculated 🆕 | System calculates Win/Loss/Draw from scores and updates list page stats | new |

### FR-013: Delete Fixture
**Description**: To delete a fixture, click the Delete button on the fixture card or from the Fixture Detail page. A confirmation dialog will ask you to confirm. Deleting a fixture removes it from the list but any associated videos and match statistics are preserved for historical records.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-041 | Delete confirmation dialog | Delete shows confirmation dialog | new |
| AC-042 | Deleted fixture removed | Deleted fixture removed from list | new |
| AC-043 | Videos preserved | Associated videos and match statistics preserved for historical records | new |

### FR-022: Import Fixtures from Excel/CSV
**Description**: Bulk import fixtures using the Import CSV button. Prepare a CSV or Excel file with columns for Date, Opposition, Competition, Location, Time, Kick Off, and Score. The system will preview data with colour-coded validation (green for valid, red for errors, yellow for warnings) before importing. You can choose to import only the valid rows or fix errors first.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-066 | Import file types | Import accepts .csv and .xlsx files | new |
| AC-067 | Preview validation status | Preview shows validation status per row with colour coding | new |
| AC-068 | Import valid only | Import Valid Only skips error rows | new |

### FR-023: Opponent Management 🆕
**Description**: Opponents can be added on the fly by coaches during fixture creation (via FR-012), but the system stores them at the club level so they can be reused by any team in the club. This saves time — once an opponent and their logo have been added by one coach, every other team can pick them straight from the dropdown.

When adding a new opponent, you can set the following:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Team Name | Text | Yes | |
| Short Name | Text | No | Max 5 characters |
| Logo | Image upload | No | Displayed on fixture cards and match header. System automatically removes the background on upload |
| Primary Colour | Colour picker | No | Used for the result banner background |
| Secondary Colour | Colour picker | No | Used for the result banner text |

**Visibility:** Opponents can be toggled Visible or Hidden from Settings (see FR-025). Hidden opponents won't appear in the Opposition dropdown when creating or editing fixtures but remain assigned to existing fixtures. Useful for opponents you no longer play against but want to keep for historical records.

**Club-level scope:** Opponents are managed at the club level and shared across all teams within the club.

**No delete:** Opponents cannot be deleted as they are linked to existing fixture history. Use the Visible toggle to hide any opponents you no longer need.

⚠️ **DISCREPANCY NOTE:** FR-052 in EPIC-013 (Settings) defines soft delete for opposition. The current build does NOT allow opponent deletion. FR-052 should be updated to reflect that opponents cannot be deleted, only hidden via visibility toggle.

**Rename cascade:** Renaming an opponent will update the name across all existing fixtures linked to that opponent.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-076 | Inline creation from fixture form 🆕 | Opponents can be created inline via + button during fixture creation | new |
| AC-077 | Club-level reuse 🆕 | Opponents created by any coach are available to all teams in the club | new |
| AC-078 | Logo background removal 🆕 | System automatically removes background from uploaded logos | new |
| AC-079 | Primary colour on banner 🆕 | Opponent primary colour is used for the result banner background | new |
| AC-080 | Secondary colour on text 🆕 | Opponent secondary colour is used for the result banner text | new |
| AC-081 | Rename cascades 🆕 | Renaming an opponent updates the name across all linked fixtures | new |
| AC-082 | Cannot delete opponent 🆕 | Opponents cannot be deleted; only hidden via visibility toggle | new |
| AC-083 | Hidden opponents excluded from dropdown 🆕 | Hidden opponents do not appear in Opposition dropdown for new/edit fixture | new |
| AC-084 | Hidden opponents preserved on fixtures 🆕 | Existing fixtures retain their opponent assignment when opponent is hidden | new |

### FR-024: Competition Management 🆕
**Description**: Click the Settings (cog) button on the Fixtures page to manage Competitions. You can create as many competitions as you need — for example League, Cup, Friendly, Tournament, or any custom name that suits your setup.

| Action | Description |
|--------|-------------|
| Search | Use the search bar to filter competitions by name |
| Add | Type a new competition name and click + Add to create it |
| Visible | Toggle a competition on or off — hidden competitions won't appear in the Competition dropdown when creating or editing fixtures. Useful when you join a new league and want the old one to stop being picked going forward |
| Edit | Click the edit icon to rename a competition |
| Delete | Click the delete icon to remove a competition. Any fixtures previously assigned to that competition will be set to no competition |

**Club-level scope:** Competitions are managed at the club level, so any changes apply across all teams within the club.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-085 | Search filters competitions 🆕 | Search bar filters competitions by name | new |
| AC-086 | Add new competition 🆕 | New competition can be created with name and + Add button | new |
| AC-087 | Visibility toggle 🆕 | Hidden competitions don't appear in Competition dropdown for new/edit fixture | new |
| AC-088 | Hidden competitions preserved 🆕 | Existing fixtures retain their competition assignment when competition is hidden | new |
| AC-089 | Edit renames competition 🆕 | Competition can be renamed via edit icon | new |
| AC-090 | Delete removes competition 🆕 | Competition can be deleted via delete icon with confirmation | new |
| AC-091 | Delete sets fixtures to none 🆕 | Fixtures assigned to a deleted competition are set to no competition | new |
| AC-092 | Club-level scope 🆕 | Competition changes apply across all teams within the club | new |
| AC-093 | Unlimited competitions 🆕 | No limit on number of competitions that can be created | new |

### Epic-Level Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-069 | Handles 500+ fixtures | Fixtures page handles 500+ fixtures without performance issues | new |
| AC-070 | Database confirmation | All fixture operations confirm with database before showing success | new |
| AC-071 | Data persists refresh | Fixture data persists after page refresh | new |

---

## EPIC-009: View Fixture Detail (Page: P-006)
**Status**: defined
**Overview**: When you open a fixture, the detail page is organised into tabs for different aspects of match data: Fixture Details, Match Report, Line-Ups, Videos, Statistics, Spider Charts, and GameScope Analysis.

### FR-014: Fixture Detail Header
**Description**: Match Header with both team logos, team names with score (if completed), date, time, venue, competition, and status badge. Navigation actions include Back button, Edit Fixture button, and Delete button.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-044 | Match header displays | Match header displays both team logos and names | new |
| AC-045 | Score completed only | Score displays only for completed fixtures | new |
| AC-046 | Back button navigation | Back button returns to Fixtures list | new |
| AC-047 | Edit/Delete visibility | Edit/Delete buttons visible for authorized users | new |

### FR-015: Match Report Tab
**Description**: The Match Report and Attendance are displayed (read only) on the Match Video page. You can edit these fields on the Edit Fixture page. Includes scoreboard with goal scorers, key facts (venue, date, time, officials, attendance), event timeline, and export options.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-048 | Match report renders | Match header and event timeline render correctly | new |
| AC-049 | Export produces valid files | Export produces valid PDF/HTML with all match data | new |

### FR-016: Line-Ups Tab
**Description**: The Line-Ups tabs allow you to set the Home and Away line-ups for each fixture. Select players from the squad for the Starting XI and Substitutes. You can assign formations (e.g. 4-4-2, 4-3-3) and record substitutions with timestamps. Player status tags such as Captain, Yellow Card, Red Card, and Injured can be applied to individual players.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-050 | Formation display | Formation display matches stored metadata | new |
| AC-051 | Substitution rules | Substitution log enforces player availability rules | new |

### FR-017: Videos Tab
**Description**: Video management for this fixture. You can provide video footage of any training session or game for analysis. Either upload a file or provide a link. You can upload multiple videos — for example from different camera angles or different time points in the match. Each video can be given a camera label to help identify it, such as "1st Half, Half Way Line" or "2nd Half, Behind Goal". Once uploaded, videos can be viewed directly in the built-in video player with playback controls including play/pause, speed adjustment (0.5x, 1x, 2x), and fullscreen mode. Videos uploaded here are also accessible from the Match Video page in read-only mode.

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
**Description**: Side-by-side comparison of both teams' match statistics, organised into categories: Attack (Goals, Shots Attempted, Shots on Target, Runs into Boxes, Corners, Dangerous Crosses), Possession (Ball Possession, Dribbles, Penetrating Dribbles, Take Ons, First Touch Success), and Technical (Passes Attempted, Passes Success, Passing Success Rate, Passing Distance and Velocity).

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-058 | Category tabs display | All 3 category tabs display with correct metrics | new |
| AC-059 | Period filter updates | Period filter updates all metrics coherently | new |
| AC-060 | Stats render speed | Stats render within 100ms of filter change | new |

### FR-020: Spider Charts Tab
**Description**: Statistics are also visualised as Spider Charts (radar charts) for a quick visual comparison between the two teams. Three charts covering Attack, Possession, and Technical metrics with normalised values.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-061 | Charts render correctly | All three charts (Attack, Possession, Technical) render correctly | new |
| AC-062 | Chart metrics normalized | Each chart displays 6+ metrics with normalized values | new |
| AC-063 | Tooltips show values | Tooltips show actual metric values on hover | new |

### FR-021: AI Analysis Tab
**Description**: The GameScope Analysis tab brings together all match insights in one place, including Fixture Details, Line-Ups, Videos, Statistics, Spider Charts, and AI Analysis. The AI Analysis provides AI-generated match summaries, tactical themes, and recommendations (coming soon).

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-064 | AI narrative generation | AI generates coherent narrative from match data | new |
| AC-065 | Tactical themes supported | Tactical themes are supported by specific events/stats | new |

### Epic-Level Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-110 | Page load under 2s | Fixture detail page loads in under 2 seconds | new |

---

## Test Cases

No test cases currently defined for Fixtures pages.

---

## Change Summary

### New Items Added

| Type | ID | Title | Source |
|------|----|-------|--------|
| FR | FR-023 | Opponent Management 🆕 | User guide — "Adding a New Opponent" + "Opponent Settings" |
| FR | FR-024 | Competition Management 🆕 | User guide — "Competition Settings" |
| AC | AC-072 | Time Slot sets kick-off 🆕 | User guide — "Time Slot" field description |
| AC | AC-073 | Time manually adjustable 🆕 | User guide — "You can still manually adjust" |
| AC | AC-074 | All 6 statuses available 🆕 | User guide — "Status" field description |
| AC | AC-075 | Result auto-calculated 🆕 | User guide — "automatically calculate the result" |
| AC | AC-076 | Inline creation from fixture form 🆕 | User guide — "added on the fly" |
| AC | AC-077 | Club-level reuse 🆕 | User guide — "reused by any team in the club" |
| AC | AC-078 | Logo background removal 🆕 | User guide — "automatically remove the background" |
| AC | AC-079 | Primary colour on banner 🆕 | User guide — "result banner background" |
| AC | AC-080 | Secondary colour on text 🆕 | User guide — "result banner text" |
| AC | AC-081 | Rename cascades 🆕 | User guide — "update the name across all existing fixtures" |
| AC | AC-082 | Cannot delete opponent 🆕 | User guide — "cannot be deleted" |
| AC | AC-083 | Hidden opponents excluded 🆕 | User guide — "won't appear in the Opposition dropdown" |
| AC | AC-084 | Hidden opponents preserved 🆕 | User guide — "keep for historical fixture records" |
| AC | AC-085 | Search filters competitions 🆕 | User guide — "search bar to filter competitions" |
| AC | AC-086 | Add new competition 🆕 | User guide — "click + Add to create it" |
| AC | AC-087 | Visibility toggle 🆕 | User guide — "hidden competitions won't appear" |
| AC | AC-088 | Hidden competitions preserved 🆕 | User guide — derived from visibility behaviour |
| AC | AC-089 | Edit renames competition 🆕 | User guide — "edit icon to rename" |
| AC | AC-090 | Delete removes competition 🆕 | User guide — "delete icon to remove" |
| AC | AC-091 | Delete sets fixtures to none 🆕 | User guide — "set to no competition" |
| AC | AC-092 | Club-level scope 🆕 | User guide — "apply across all teams within the club" |
| AC | AC-093 | Unlimited competitions 🆕 | User guide — "as many competitions as you need" |

### Items Updated

| Type | ID | What Changed |
|------|----|-------------|
| FR | FR-012 | Added Time Slot field, 6 fixture statuses, auto-calculated results |
| FR | FR-008 | Expanded description from user guide |
| FR | FR-009 | Expanded description from user guide |
| FR | FR-010 | Expanded description from user guide |
| FR | FR-011 | Expanded description from user guide |
| FR | FR-013 | Expanded description from user guide |
| FR | FR-017 | Expanded description from user guide (camera labels, playback, read-only access) |
| FR | FR-019 | Expanded description with specific metric categories from user guide |
| FR | FR-020 | Expanded description from user guide |
| FR | FR-021 | Expanded description from user guide |

### Discrepancies Identified

| Issue | Location | Resolution Needed |
|-------|----------|-------------------|
| Opponent delete | FR-052 (EPIC-013) says soft delete allowed; build and user guide say no delete | Update FR-052 to remove delete, replace with visibility toggle |

### Totals

| Type | Original | Updated | Delta |
|------|:--------:|:-------:|:-----:|
| Pages | 3 | 3 | — |
| Epics | 2 | 2 | — |
| Functional Requirements | 15 | 17 | +2 |
| Acceptance Criteria | 44 | 66 | +22 |
| Test Cases | 0 | 0 | — |
| **Total Items** | **64** | **88** | **+24** |
