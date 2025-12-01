# GameScope Requirements Specification

Generated: December 1, 2025

---

## Table of Contents
1. [Page Requirements](#page-requirements)
2. [Data Models](#data-models)
3. [Test Cases](#test-cases)
4. [Change Log](#change-log)

---

## Page Requirements

### LANDING / LOGIN (Pre-auth)

#### Landing Page
**Route:** `/`  
**Section:** home  
**Overview:** Public landing page showcasing GameScope features and capabilities.

**Functional Requirements:**
| ID | Title | Description |
|----|-------|-------------|
| LAND-FR-1 | Feature Showcase | Display key features of GameScope including video analysis, team management, and statistics. |
| LAND-FR-2 | Call to Action | Prominent login/signup buttons directing users to authentication. |

**Acceptance Criteria:**
- [LAND-AC-1] Landing page loads with feature highlights
- [LAND-AC-2] Login button navigates to login page

---

#### Login
**Route:** `/login`  
**Section:** home  
**Overview:** User authentication page for accessing the application.

**Functional Requirements:**
| ID | Title | Description |
|----|-------|-------------|
| LOG-FR-1 | Authentication | Allow users to log in with credentials or SSO. |
| LOG-FR-2 | Error Handling | Display clear error messages for failed login attempts. |

**Acceptance Criteria:**
- [LOG-AC-1] Valid credentials grant access to the application
- [LOG-AC-2] Invalid credentials show appropriate error message

---

### HOME SECTION

#### Home
**Route:** `/home`  
**Section:** home  
**Overview:** Team selection hub where users choose which team to manage before accessing team-specific features.

**Functional Requirements:**
| ID | Title | Description |
|----|-------|-------------|
| HOME-FR-1 | Team Selection | Display all available teams for the current club. Allow users to select a team to work with. |
| HOME-FR-2 | Club Branding | Display current club logo and colors throughout the interface. |

**Acceptance Criteria:**
- [HOME-AC-1] All teams for the current club are displayed
- [HOME-AC-2] Selecting a team navigates to team dashboard

---

### TEAM SECTION

#### Dashboard
**Route:** `/dashboard`  
**Section:** team  
**Overview:** Overview of team performance, upcoming fixtures, and key metrics at a glance.

**Functional Requirements:**
| ID | Title | Description |
|----|-------|-------------|
| DASH-FR-1 | Quick Stats | Display key team statistics including wins, losses, draws, and goal difference. |
| DASH-FR-2 | Upcoming Fixtures | Show next 3-5 scheduled matches with opponent, date, and venue. |
| DASH-FR-3 | Recent Results | Display last 5 match results with scores. |
| DASH-FR-4 | Squad Overview | Show total players, availability status, and position breakdown. |

**Acceptance Criteria:**
- [DASH-AC-1] Dashboard loads with current team data
- [DASH-AC-2] Stats reflect actual team performance from fixtures
- [DASH-AC-3] Upcoming fixtures show correct dates and opponents
- [DASH-AC-4] Recent results display accurate scores

---

#### Fixtures
**Route:** `/fixtures`  
**Section:** team  
**Overview:** Manage team fixtures, schedules, and match planning with video upload capabilities.

**Functional Requirements:**
| ID | Title | Description |
|----|-------|-------------|
| FIX-FR-1 | Tab Navigation | Navigate between Season, Planning, Videos, and Logos tabs. |
| FIX-FR-2 | Fixture Creation | Single-screen fixture creation with inline opponent and competition management. |
| FIX-FR-3 | Competition Management | Create and manage competitions on-the-fly during fixture creation. |
| FIX-FR-4 | Excel Import | Import fixtures from Excel files with automatic field mapping. |

**Acceptance Criteria:**
- [FIX-AC-1] Fixtures can be created with opponent, date, venue, and competition
- [FIX-AC-2] Fixtures can be edited and scores updated
- [FIX-AC-3] Tab state persists during navigation

##### Tab: Season
**Overview:** View and manage all fixtures for the current season.

| ID | Title | Description |
|----|-------|-------------|
| FIX-SEA-FR-1 | Fixture List | Display all fixtures in a table with sortable columns. |
| FIX-SEA-FR-2 | Competition Filter | Filter fixtures by competition type. |
| FIX-SEA-FR-3 | Quick Actions | Edit, delete, and view fixture details from the list. |
| FIX-SEA-FR-4 | Score Display | Show match scores for completed fixtures. |

**Acceptance Criteria:**
- [FIX-SEA-AC-1] All fixtures display in chronological order
- [FIX-SEA-AC-2] Filtering by competition works correctly
- [FIX-SEA-AC-3] Fixture status badges display correctly

##### Tab: Planning
**Overview:** Calendar view of upcoming fixtures for match planning.

| ID | Title | Description |
|----|-------|-------------|
| FIX-PLN-FR-1 | Calendar View | Display fixtures in a monthly calendar format. |
| FIX-PLN-FR-2 | Month Navigation | Navigate between months to view different periods. |
| FIX-PLN-FR-3 | Fixture Preview | Click on a date to see fixture details. |

**Acceptance Criteria:**
- [FIX-PLN-AC-1] Calendar displays correct dates and fixtures
- [FIX-PLN-AC-2] Month navigation updates the view

##### Tab: Videos
**Overview:** Upload and manage match videos for fixtures.

| ID | Title | Description |
|----|-------|-------------|
| FIX-VID-FR-1 | Video Upload | Upload match videos and associate with fixtures. |
| FIX-VID-FR-2 | Camera Angles | Support multiple camera angles per fixture with labels. |
| FIX-VID-FR-3 | Video Preview | Preview uploaded videos before saving. |
| FIX-VID-FR-4 | Video Delete | Remove videos from fixtures. |

**Acceptance Criteria:**
- [FIX-VID-AC-1] Videos can be uploaded successfully
- [FIX-VID-AC-2] Multiple camera angles supported per fixture
- [FIX-VID-AC-3] Video labels display correctly

##### Tab: Logos
**Overview:** Manage team logos with background removal capabilities.

| ID | Title | Description |
|----|-------|-------------|
| FIX-LOG-FR-1 | Logo Display | Show all team logos in a grid view. |
| FIX-LOG-FR-2 | Background Removal | Remove backgrounds from logos using smart, color-based, or manual modes. |
| FIX-LOG-FR-3 | Theme Controls | Individual light/dark theme toggles per logo container. |
| FIX-LOG-FR-4 | Image Comparison | Side-by-side view of original vs processed logos. |

**Acceptance Criteria:**
- [FIX-LOG-AC-1] Logos display correctly in containers
- [FIX-LOG-AC-2] Background removal works with different modes
- [FIX-LOG-AC-3] Theme controls persist in localStorage

---

#### View Fixture
**Route:** `/fixtures/:id`  
**Parent:** Fixtures  
**Section:** team  
**Overview:** Detailed view of a single fixture with match information, lineup, and video management.

**Functional Requirements:**
| ID | Title | Description |
|----|-------|-------------|
| FIXD-FR-1 | Match Header | Display both team logos, names, and score (if completed). |
| FIXD-FR-2 | Match Details | Show date, time, venue, competition, and match status. |
| FIXD-FR-3 | Video Management | Upload, view, and delete match videos for this fixture. |
| FIXD-FR-4 | Match Report | View and edit match report text. |
| FIXD-FR-5 | Navigation | Quick access to watch video and analysis pages. |

**Acceptance Criteria:**
- [FIXD-AC-1] All fixture details display correctly
- [FIXD-AC-2] Videos can be uploaded and managed
- [FIXD-AC-3] Match report can be edited and saved
- [FIXD-AC-4] Navigation to video pages works correctly

---

#### Fixture Analysis
**Route:** `/analysis/:fixtureId`  
**Parent:** View Fixture  
**Section:** team  
**Overview:** Detailed tactical analysis of a specific fixture with formation and player statistics.

**Functional Requirements:**
| ID | Title | Description |
|----|-------|-------------|
| ANL-FR-1 | Formation Display | Visual representation of team formation during the match. |
| ANL-FR-2 | Player Statistics | Individual player performance metrics for the match. |
| ANL-FR-3 | Tactical Insights | Heat maps, passing networks, and tactical breakdowns. |

**Acceptance Criteria:**
- [ANL-AC-1] Formation displays correctly for both teams
- [ANL-AC-2] Player stats are accurate and complete
- [ANL-AC-3] Tactical visualizations render correctly

---

#### Statistics
**Route:** `/statistics`  
**Section:** team  
**Overview:** Comprehensive team and player statistics across all fixtures.

**Functional Requirements:**
| ID | Title | Description |
|----|-------|-------------|
| STAT-FR-1 | Team Overview | Display overall team performance metrics (wins, losses, goals, clean sheets). |
| STAT-FR-2 | Player Rankings | Leaderboards for top scorers, assisters, and appearances. |
| STAT-FR-3 | Trend Analysis | Performance trends over time with charts and graphs. |
| STAT-FR-4 | Competition Breakdown | Statistics filtered by competition. |

**Acceptance Criteria:**
- [STAT-AC-1] Team statistics are accurate based on fixture data
- [STAT-AC-2] Player rankings reflect actual performance
- [STAT-AC-3] Charts render correctly with accurate data

---

#### Squad Management
**Route:** `/squad`  
**Section:** team  
**Overview:** Manage team roster, player information, and squad composition.

**Functional Requirements:**
| ID | Title | Description |
|----|-------|-------------|
| SQD-FR-1 | Player List | Display all players in the squad with photos, names, numbers, and positions. |
| SQD-FR-2 | Position Filtering | Filter players by position (GK, DEF, MID, FWD). |
| SQD-FR-3 | Player Details | Click to view detailed player information. |
| SQD-FR-4 | Add/Edit Players | Create new players or edit existing player details. |
| SQD-FR-5 | Excel/JSON Import | Import player data from Excel or JSON files. |

**Acceptance Criteria:**
- [SQD-AC-1] All squad players display with correct information
- [SQD-AC-2] Position filter correctly groups players
- [SQD-AC-3] Player profiles are accessible and complete
- [SQD-AC-4] Excel import correctly populates player data

---

#### View Squad Member
**Route:** `/players/:id`  
**Parent:** Squad Management  
**Section:** team  
**Overview:** Detailed profile view for individual players with statistics and personal information.

**Functional Requirements:**
| ID | Title | Description |
|----|-------|-------------|
| PLYD-FR-1 | Player Header | Display player photo, name, number, and position. |
| PLYD-FR-2 | Personal Information | Show height, weight, date of birth, nationality. |
| PLYD-FR-3 | Season Statistics | Display appearances, goals, assists, minutes played. |
| PLYD-FR-4 | Edit Profile | Ability to edit player details. |

**Acceptance Criteria:**
- [PLYD-AC-1] All player details display correctly
- [PLYD-AC-2] Statistics reflect actual performance data
- [PLYD-AC-3] Profile edits save successfully

---

#### Match Videos
**Route:** `/videos`  
**Section:** team  
**Overview:** Browse, filter, and access match video recordings organized by competition.

**Functional Requirements:**
| ID | Title | Description |
|----|-------|-------------|
| VID-FR-1 | View Mode Selection | Users can switch between Tile Mode and Watch Mode. Selected view mode persists in localStorage. |
| VID-FR-2 | Filtering | Competition dropdown to filter fixtures by competition (or 'All Competitions'). Keyword search field to filter fixtures by opponent name (case-insensitive). |
| VID-FR-3 | Sorting | Toggle button to switch between earliest-first and latest-first display. Visual indicator (arrow up/down) shows current sort order. |
| VID-FR-4 | Video Preview Display | Shows club logo on the left, score in center, opponent logo on the right. Play button overlay in center. Shows 'No video' indicator when video unavailable. |
| VID-FR-5 | Tile Mode Cards | Grid layout (1-3 columns based on screen size). Grouped by competition with match count. Card footer shows date and Home/Away badge. |
| VID-FR-6 | Watch Mode | Horizontal scrolling fixture selector. Larger video preview with match details. Match report and attendance display (when available). |

**Acceptance Criteria:**
- [VID-AC-1] Selecting a competition filters fixtures to only that competition
- [VID-AC-2] Typing in search field immediately filters fixtures by opponent name
- [VID-AC-3] Both team logos display correctly (fallback to initials if no logo)
- [VID-AC-4] Score displays correctly based on home/away fixture type
- [VID-AC-5] Clicking any fixture card navigates to Watch Match Video page
- [VID-AC-6] View mode preference persists across page refreshes

---

#### Watch Match Video
**Route:** `/watch-match-video`  
**Parent:** Match Videos  
**Section:** team  
**Overview:** Full match analysis page with video player, events, statistics, and reporting.

**Functional Requirements:**
| ID | Title | Description |
|----|-------|-------------|
| WMV-FR-1 | Match Score Banner | Displays both team logos, names, and final score. Shows match date and venue type. |
| WMV-FR-2 | Camera Selector | Dropdown labeled 'Choose Camera:' in Video Player tab header. Lists all uploaded videos for the fixture by their label/name. Switching camera loads the selected video. |
| WMV-FR-3 | Video Player Tab | Supports YouTube, Google Drive, direct video files, and FIFA Plus links. FIFA Plus videos show external link button (cannot embed). Native video controls for direct video files. |
| WMV-FR-4 | Match Events Tab | Displays match events in tabular format. Linked to video timestamps when available. |
| WMV-FR-5 | Team Statistics Tab | Comparison metrics between teams. Visual stat bars/comparisons. |
| WMV-FR-6 | Spider Charts Tab | Multi-category radar charts comparing team performance. Categories: Attack, Defense, Possession, Technical. |
| WMV-FR-7 | Match Report Tab | Displays written match report text. Shows attendance figures when available. |

**Acceptance Criteria:**
- [WMV-AC-1] Camera selector shows all uploaded video names for the fixture
- [WMV-AC-2] Changing camera selection loads the corresponding video
- [WMV-AC-3] YouTube videos embed and play correctly
- [WMV-AC-4] Google Drive videos embed correctly
- [WMV-AC-5] Direct video files play with native controls
- [WMV-AC-6] FIFA Plus links show 'Open in FIFA Plus' button
- [WMV-AC-7] Back button returns to Match Video listing page
- [WMV-AC-8] All five tabs display appropriate content when selected

---

#### Video Analysis
**Route:** `/match-analysis`  
**Section:** team  
**Overview:** Advanced video analysis with event data synchronization and interactive playback.

**Functional Requirements:**
| ID | Title | Description |
|----|-------|-------------|
| MA-FR-1 | Video Player | Full video player with playback controls and timeline scrubbing. |
| MA-FR-2 | Event Data Upload | Upload JSON event data files for each video. Display filename when uploaded. |
| MA-FR-3 | Event Synchronization | Events sync with video playback. Current event highlighted based on video timestamp. |
| MA-FR-4 | Event List View | Scrollable list of events with timestamp, type, and player information. |
| MA-FR-5 | Event Filtering | Filter events by type (Pass, Shot, Tackle, etc.) and team. |
| MA-FR-6 | Click-to-Seek | Clicking an event jumps video to that timestamp. |

**Acceptance Criteria:**
- [MA-AC-1] JSON event files can be uploaded and parsed
- [MA-AC-2] Uploaded filename displays in the UI
- [MA-AC-3] Events update as video plays (previous/current/next)
- [MA-AC-4] Clicking an event seeks video to correct timestamp
- [MA-AC-5] Event filters work correctly

---

#### Player Profiles
**Route:** `/player-profiles`  
**Section:** team  
**Overview:** Comprehensive player profile cards with detailed statistics and performance data.

**Functional Requirements:**
| ID | Title | Description |
|----|-------|-------------|
| PP-FR-1 | Profile Cards | Display player cards with photo, name, position, and key stats. |
| PP-FR-2 | Stat Comparison | Compare multiple players side by side. |
| PP-FR-3 | Performance Trends | Charts showing player performance over time. |

**Acceptance Criteria:**
- [PP-AC-1] All player profiles display with complete information
- [PP-AC-2] Comparison view works correctly

---

### CLUB SECTION

#### Teams
**Route:** `/teams`  
**Section:** club  
**Overview:** Manage multiple teams within the club organization.

**Functional Requirements:**
| ID | Title | Description |
|----|-------|-------------|
| TM-FR-1 | Team List | Display all teams in the club with name, age group, and gender. |
| TM-FR-2 | Add Team | Create new teams with name, age group, gender, and coach assignment. |
| TM-FR-3 | Edit Team | Modify team details and settings. |

**Acceptance Criteria:**
- [TM-AC-1] All club teams are displayed
- [TM-AC-2] New teams can be created
- [TM-AC-3] Team details can be edited

---

#### Club Users
**Route:** `/users`  
**Section:** club  
**Overview:** Manage users who have access to the club's features and data.

**Functional Requirements:**
| ID | Title | Description |
|----|-------|-------------|
| CU-FR-1 | User List | Display all users with access to this club. |
| CU-FR-2 | Role Management | Assign roles (Admin, Coach, Player) to users. |
| CU-FR-3 | Invite Users | Send invitations to new users. |

**Acceptance Criteria:**
- [CU-AC-1] All club users are displayed with their roles
- [CU-AC-2] Roles can be changed
- [CU-AC-3] Invitations can be sent

---

#### Club Management
**Route:** `/club-management`  
**Section:** club  
**Overview:** Manage club details, branding, and organizational settings.

**Functional Requirements:**
| ID | Title | Description |
|----|-------|-------------|
| CM-FR-1 | Club Details | Edit club name, short name, and description. |
| CM-FR-2 | Branding | Upload club logo and set primary/secondary colors. |
| CM-FR-3 | Contact Information | Manage club address and contact details. |

**Acceptance Criteria:**
- [CM-AC-1] Club details can be edited and saved
- [CM-AC-2] Logo upload works correctly
- [CM-AC-3] Color changes apply throughout the app

---

### DEVOPS SECTION

#### Requirements Center
**Route:** `/requirements`  
**Section:** devops  
**Overview:** Central hub for managing all application requirements, test cases, and development tracking.

**Functional Requirements:**
| ID | Title | Description |
|----|-------|-------------|
| REQ-FR-1 | Hierarchical View | Display pages in a tree structure showing parent-child relationships (e.g., TEAM > Fixtures > View Fixture). |
| REQ-FR-2 | Page Detail Panel | Slide-out panel showing full page requirements when selected. |
| REQ-FR-3 | Data Models | Display all data models with field specifications. |
| REQ-FR-4 | Test Cases | Track test execution results with pass/fail status. |
| REQ-FR-5 | Change Log | Record of all changes with type (added, removed, changed, fixed). |
| REQ-FR-6 | Work Items | Unified work item tracking (Epochs, Epics, Features, Stories, Bugs, etc.). |

**Acceptance Criteria:**
- [REQ-AC-1] All pages display in correct hierarchy
- [REQ-AC-2] Clicking a page shows its requirements
- [REQ-AC-3] Data models show all fields with types and constraints
- [REQ-AC-4] Test cases show execution status
- [REQ-AC-5] Change log entries are sortable by date

---

## Data Models

### Club
**Description:** Represents a sports club organization that contains multiple teams.

| Field | Type | Mandatory | Default | Values | Description |
|-------|------|-----------|---------|--------|-------------|
| id | UUID | Yes | Auto-generated | - | Unique identifier |
| name | Text | Yes | - | - | Full club name |
| shortName | Text | Yes | PSC | - | Abbreviated club name |
| owner | Text | Yes | - | - | Club owner name |
| logoPath | Text | No | - | - | Path to club logo |
| address | Text | No | - | - | Street address |
| city | Text | No | - | - | City |
| state | Text | No | - | - | State/Province |
| country | Text | No | - | - | Country |
| phone | Text | No | - | - | Contact phone |
| email | Text | No | - | - | Contact email |
| website | Text | No | - | - | Website URL |
| colors | JSONB | No | - | - | Primary and secondary colors |
| timezone | Text | No | UTC | - | Club timezone |
| seasonStartMonth | Varchar(20) | No | August | - | Default season start |
| createdAt | Timestamp | No | Now | - | Record creation time |
| updatedAt | Timestamp | No | Now | - | Last update time |

---

### Team
**Description:** Represents a team within a club organization.

| Field | Type | Mandatory | Default | Values | Description |
|-------|------|-----------|---------|--------|-------------|
| id | UUID | Yes | Auto-generated | - | Unique identifier |
| clubId | UUID (FK) | Yes | - | - | Reference to parent club |
| name | Text | Yes | - | - | Full team name |
| shortName | Varchar(10) | Yes | - | - | Abbreviated team name |
| status | Varchar(20) | Yes | ACTIVE | ACTIVE, INACTIVE, ARCHIVED | Team status |
| ageGroup | Text | No | - | - | Age category (e.g., U18, College) |
| gender | Varchar(20) | No | - | Men, Women, Mixed | Team gender category |
| seasonStartMonth | Varchar(20) | No | inherit | - | When season starts |
| colors | JSONB | No | - | - | Primary and secondary colors |
| createdAt | Timestamp | No | Now | - | Record creation time |
| updatedAt | Timestamp | No | Now | - | Last update time |

---

### Fixture
**Description:** Represents a scheduled or completed match between the team and an opponent.

| Field | Type | Mandatory | Default | Values | Description |
|-------|------|-----------|---------|--------|-------------|
| id | UUID | Yes | Auto-generated | - | Unique identifier |
| teamId | UUID (FK) | Yes | - | - | Reference to the team playing |
| opponent | Text | Yes | - | - | Name of the opposing team |
| oppositionTeamId | UUID (FK) | No | - | - | Reference to opposition team record |
| date | Timestamp | Yes | - | - | Date and time of the match |
| venue | Text | Yes | - | - | Location where match is played |
| type | Varchar(20) | Yes | - | HOME, AWAY, NEUTRAL | Match venue type |
| status | Varchar(20) | Yes | SCHEDULED | SCHEDULED, COMPLETED, CANCELLED, NO_CONTEST | Current match status |
| homeScore | Integer | No | - | - | Goals scored by home team |
| awayScore | Integer | No | - | - | Goals scored by away team |
| competitionId | UUID (FK) | No | - | - | Reference to competition |
| notes | Text | No | - | - | Additional match notes |
| report | Text | No | - | - | Match report text |
| attendance | Integer | No | - | - | Number of attendees |
| hasVideo | Boolean | No | false | - | Whether match has video |
| videoLinks | JSONB | No | - | - | Array of video link objects |
| createdAt | Timestamp | No | Now | - | Record creation time |
| updatedAt | Timestamp | No | Now | - | Last update time |

---

### User (Player/Coach/Admin)
**Description:** Represents a user in the system who can be a player, coach, admin, or parent.

| Field | Type | Mandatory | Default | Values | Description |
|-------|------|-----------|---------|--------|-------------|
| id | UUID | Yes | Auto-generated | - | Unique identifier |
| username | Text | No | - | - | Login username (unique) |
| password | Text | No | - | - | Hashed password |
| firstName | Text | Yes | - | - | First name |
| lastName | Text | Yes | - | - | Last name |
| shirtName | Text | No | - | - | Name on jersey |
| dateOfBirth | Timestamp | No | - | - | Date of birth |
| gender | Varchar(10) | No | - | Male, Female, Other | Gender |
| avatarPath | Text | No | - | - | Profile photo path |
| headshotPath | Text | No | - | - | Headshot photo path |
| height | Text | No | - | - | Height (e.g., 5-7) |
| hometown | Text | No | - | - | Hometown |
| classYear | Varchar(20) | No | - | Freshman, Sophomore, Junior, Senior | Academic year |
| email | Text | No | - | - | Email address |
| phone | Text | No | - | - | Phone number |
| role | Varchar(20) | Yes | Player | Player, Coach, Admin, Parent | User role |
| status | Varchar(20) | No | Draft | Draft, Active, Suspended, Retired | Account status |
| createdAt | Timestamp | No | Now | - | Record creation time |
| updatedAt | Timestamp | No | Now | - | Last update time |

---

### User Team Assignment
**Description:** Links users to teams with team-specific information like jersey number and position.

| Field | Type | Mandatory | Default | Values | Description |
|-------|------|-----------|---------|--------|-------------|
| id | UUID | Yes | Auto-generated | - | Unique identifier |
| userId | UUID (FK) | Yes | - | - | Reference to user |
| teamId | UUID (FK) | Yes | - | - | Reference to team |
| jerseyNumber | Integer | No | - | - | Player jersey number |
| position | Varchar(20) | Yes | - | GK, CB, LB, RB, CDM, CM, CAM, LM, RM, LW, RW, ST, CF | Playing position |
| starPlayer | Boolean | No | false | - | Key player flag |
| fitnessStatus | Varchar(20) | No | Fit | Fit, Injured, Retired | Current fitness |
| joinedAt | Timestamp | No | Now | - | When joined team |
| leftAt | Timestamp | No | - | - | When left team |
| createdAt | Timestamp | No | Now | - | Record creation time |
| updatedAt | Timestamp | No | Now | - | Last update time |

---

### Competition
**Description:** Represents a league, tournament, or cup competition.

| Field | Type | Mandatory | Default | Values | Description |
|-------|------|-----------|---------|--------|-------------|
| id | UUID | Yes | Auto-generated | - | Unique identifier |
| name | Text | Yes | - | - | Competition name (unique) |
| shortName | Varchar(10) | No | - | - | Abbreviated name |
| logoPath | Text | No | - | - | Path to competition logo |
| seasonStartMonth | Varchar(20) | No | inherit | - | Season start month |
| createdAt | Timestamp | No | Now | - | Record creation time |
| updatedAt | Timestamp | No | Now | - | Last update time |

---

### Opposition Team
**Description:** Represents an opposing team that can be played against in fixtures.

| Field | Type | Mandatory | Default | Values | Description |
|-------|------|-----------|---------|--------|-------------|
| id | UUID | Yes | Auto-generated | - | Unique identifier |
| name | Text | Yes | - | - | Team name (unique) |
| shortName | Varchar(10) | No | - | - | Abbreviated name |
| logoPath | Text | No | - | - | Path to team logo |
| websiteUrl | Text | No | - | - | Team website |
| colors | JSONB | No | - | - | Primary and secondary colors |
| createdAt | Timestamp | No | Now | - | Record creation time |
| updatedAt | Timestamp | No | Now | - | Last update time |

---

### Work Item
**Description:** Unified tracking for all work item types (Epochs, Epics, Features, Stories, Bugs, etc.).

| Field | Type | Mandatory | Default | Values | Description |
|-------|------|-----------|---------|--------|-------------|
| id | Varchar | Yes | - | - | Format: TYPE-NNN (e.g., STORY-001) |
| type | Varchar(20) | Yes | - | epoch, epic, feature, story, bug, enhancement, test_case, question, action_item | Work item type |
| parentId | Varchar | No | - | - | For hierarchy (story → feature → epic → epoch) |
| title | Text | Yes | - | - | Work item title |
| description | Text | Yes | - | - | Detailed description |
| status | Varchar(20) | Yes | open | draft, open, in_progress, resolved, closed, passed, failed, partial, blocked | Current status |
| priority | Varchar(20) | No | - | low, medium, high, critical | Priority level |
| area | Varchar(50) | No | - | - | Related area (squad, fixtures, video, etc.) |
| steps | JSONB | No | - | - | Test steps (for test cases) |
| expectedResult | Text | No | - | - | Expected outcome |
| actualResult | Text | No | - | - | Actual outcome |
| convertedFrom | Varchar | No | - | - | Original ID if converted from another type |
| createdAt | Timestamp | No | Now | - | Record creation time |
| updatedAt | Timestamp | No | Now | - | Last update time |

---

### Work Item Link
**Description:** Many-to-many links between work items for traceability.

| Field | Type | Mandatory | Default | Values | Description |
|-------|------|-----------|---------|--------|-------------|
| id | Varchar | Yes | Auto-generated | - | Unique identifier |
| sourceId | Varchar | Yes | - | - | Source work item ID |
| targetId | Varchar | Yes | - | - | Target work item ID |
| linkType | Varchar(20) | Yes | - | traces_to, blocks, duplicates, relates_to, parent_of | Type of relationship |
| createdAt | Timestamp | No | Now | - | Record creation time |

---

## Test Cases

### TC-001: Create Club
**Objective:** Verify club creation workflow with all required fields  
**Component:** Clubs  
**Status:** PASSED  
**Date:** 2025-11-11  
**Tester:** Liam Wood

**Steps:**
1. Login to GameScope
2. Navigate to dev environment
3. Click on Clubs
4. Click Add Club
5. Enter club details: Club name: Newcastle, Short name: ufc, Owner name: [any], Primary color: Black, Secondary color: White, Phone number: [entered], Email: leam.wood@yahoo.com, Country: United Kingdom
6. Upload Newcastle United logo
7. Click Create Club

**Expected Result:** Club created with all details saved and displayed correctly  
**Actual Result:** Club created successfully. Name and country were correctly displayed and used for the filter.

---

### TC-002: Create Team
**Objective:** Create a team for Newcastle United club  
**Component:** Teams  
**Status:** FAILED  
**Associated Bug:** BUG-001  
**Date:** 2025-11-11  
**Tester:** Liam Wood

**Steps:**
1. Navigate to Teams section
2. Click Create Team
3. Enter team details: Team name: Under 18, Short name: u18, Head coach: x, Assistant coach: y, Gender: Male, Age group: U18, Season: 25-26
4. Click Create Team

**Expected Result:** Team created and displayed in teams list  
**Actual Result:** System displayed 'Team created successfully' message but team does not appear in the list. Attempted to create the same team again with identical information - received success message again without duplicate error, indicating the team is not being saved to the database.

---

### TC-003: Add User
**Objective:** Add a new user to the club with required fields  
**Component:** User Management  
**Status:** FAILED  
**Associated Bug:** BUG-002  
**Date:** 2025-11-11  
**Tester:** Liam Wood

**Steps:**
1. Navigate to Club → Club Users
2. Click Add User
3. Enter user details: First name: Liam, Last name: Wood, Short name: Wood, Email: leam.wood@yahoo.com, Password: [any], Gender: [selected]
4. Click Save

**Expected Result:** User created with only first name, last name, email, and password required. Other fields should be optional.  
**Actual Result:** Received 'Bad request exception' error. Testing revealed that 'short name' field is incorrectly required when it should be optional.

---

### TC-004: Delete User
**Objective:** Delete a user (Liam Wood) from the club  
**Component:** User Management  
**Status:** FAILED  
**Associated Bug:** BUG-003  
**Date:** 2025-11-11  
**Tester:** Liam Wood

**Steps:**
1. Navigate to Club → Club Users
2. Find user: Liam Wood
3. Click three dots menu
4. Click Delete User
5. Confirmation dialog appears
6. Click 'Yes, delete user'

**Expected Result:** User deleted from system permanently  
**Actual Result:** System displayed 'Liam Wood has been deleted successfully' but user was not actually deleted.

---

### TC-005: Verify User Deletion
**Objective:** Confirm user deletion by attempting to recreate the same user  
**Component:** User Management  
**Status:** FAILED  
**Associated Bug:** BUG-003  
**Date:** 2025-11-11  
**Tester:** Liam Wood

**Steps:**
1. Navigate to Club → Club Users
2. Click Add User
3. Enter same details as deleted user
4. Click Create User

**Expected Result:** User should be created successfully since previous user was deleted  
**Actual Result:** Received error: 'Email already exists' - confirming that the user was never actually deleted despite success message.

---

### TC-006: Multiple Users with Different Roles
**Objective:** Create multiple users with different roles and verify summary tabs display correct information  
**Component:** User Management  
**Status:** PARTIAL  
**Associated Bug:** BUG-004  
**Date:** 2025-11-11  
**Tester:** Liam Wood

**Steps:**
1. Create three users: Test 1: Player role, Test 2: Admin role, Test 3: Coach role
2. Check Club User Management summary tabs for accurate counts

**Expected Result:** Summary should show: Total users: 3, Role breakdown: 1 admin, 1 coach, 1 player  
**Actual Result:** Partial success: Total users shows 4 (incorrect), Role breakdown correct, Status counts correct.

---

### TC-007: Filter Users by Role
**Objective:** Verify filtering functionality for user roles and status  
**Component:** User Management  
**Status:** PASSED  
**Date:** 2025-11-11  
**Tester:** Liam Wood

**Steps:**
1. Click Enable Filter
2. Test role filters: Admin, Coach, Players, Sub Admin
3. Test status filter: Active

**Expected Result:** Filters should correctly display users matching selected criteria  
**Actual Result:** All filters work correctly. Users are properly filtered by role and status.

---

### TC-008: Change User Status
**Objective:** Change user status from Active to Suspended  
**Component:** User Management  
**Status:** FAILED  
**Associated Bug:** BUG-005  
**Date:** 2025-11-11  
**Tester:** Liam Wood

**Steps:**
1. Navigate to Club → Club Users
2. Click on Test 2 user (admin role)
3. Click Edit
4. Change Account Status from Active to Suspended
5. Click Save

**Expected Result:** User status changes to Suspended and summary reflects the change  
**Actual Result:** System displayed 'User details updated successfully' but the user's account status remains Active. No actual change was applied.

---

## Change Log

| ID | Date | Type | Area | Description |
|----|------|------|------|-------------|
| CL-001 | 2025-11-26 | Removed | Teams | Removed coach, assistant coach, and season fields from the Teams model as they are no longer needed. |
| CL-002 | 2025-11-26 | Added | DevOps | Added Requirements page with hierarchical page structure and slide-out detail panel. |
| CL-003 | 2025-11-26 | Added | All Pages | Added info icon in header bar to display page requirements dialog. |
| CL-004 | 2025-11-12 | Changed | Fixtures | Updated fixtures table to use competitionId foreign key instead of storing competition name as text. |
| CL-005 | 2025-11-12 | Changed | Logos | Migrated all logo uploads from filesystem to cloud object storage for production compatibility. |

---

## Screenshots

Screenshots of each page are captured separately and stored in the `docs/screenshots/` folder.

| Page | Route | Screenshot |
|------|-------|------------|
| Landing | / | See docs/screenshots/01-landing.png |
| Login | /login | See docs/screenshots/02-login.png |
| Home | /home | See docs/screenshots/03-home.png |
| Dashboard | /dashboard | See docs/screenshots/04-dashboard.png |
| Fixtures | /fixtures | See docs/screenshots/05-fixtures.png |
| Squad | /squad | See docs/screenshots/06-squad.png |
| Statistics | /statistics | See docs/screenshots/07-statistics.png |
| Videos | /videos | See docs/screenshots/08-videos.png |
| Requirements | /requirements | See docs/screenshots/09-requirements.png |
