# Club & Settings Requirements - GameScope

## Pages

### P-011: Club Management
- **Section**: club
- **Route**: `/club-management`
- **Overview**: Edit club details, branding, and owner assignment. This is the Edit Club functionality.

### P-012: Club Users
- **Section**: club
- **Route**: `/users`
- **Overview**: Manage all users within the club context, including role assignment and team membership.

### P-013: Settings
- **Section**: club
- **Route**: `/settings`
- **Overview**: Club settings and team logo management. Unified interface for managing all team logos within the club context.

---

## EPIC-011: Club Management (Page: P-011)
**Status**: defined
**Overview**: Edit club details, branding, and owner assignment. This is the Edit Club functionality.

### FR-048: Club Details Form
**Description**: Basic Information, Club Owner, Branding fields.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-150 | Club Name uniqueness | Club Name uniqueness checked across all clubs | new |
| AC-151 | Short Name limit | Short Name limited to 5 characters | new |

### FR-049: Auto-Create Admin User
**Description**: Creates admin user when owner details provided.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-154 | Admin user created | Admin user created when owner details provided | new |

### Test Cases
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| TC-001 | Create Club | Test club creation functionality | passed |

---

## EPIC-012: Club Users (Page: P-012)
**Status**: defined
**Overview**: Manage all users within the club context, including role assignment and team membership.

### FR-038: User List View
**Description**: Summary Cards and User Table with search, filter, sort.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-113 | Counts are accurate | Player and match counts are accurate | new |
| AC-114 | Form validates fields | Form validates all required fields | new |
| AC-122 | User list displays all | User list displays all club users | new |

#### Test Cases
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| TC-006 | Multiple Users with Different Roles | Test multiple users with different roles | partial |
| TC-007 | Filter Users by Role | Test user filtering by role | passed |

#### Bugs
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| BUG-004 | Multiple Users with Different Roles issue | Issues with multiple users having different roles | open |

### FR-039: Add User
**Description**: Form fields for creating users with email uniqueness.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-115 | Short name limit | Short name limited to 10 characters | new |
| AC-116 | Status defaults ACTIVE | Status defaults to ACTIVE | new |
| AC-125 | Form validates fields | Form validates all required fields | new |
| AC-126 | Email uniqueness validated | Email uniqueness validated | new |

#### Test Cases
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| TC-003 | Add User | Test add user functionality | failed |

#### Bugs
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| BUG-002 | Add User fails | User creation is not working correctly | open |

### FR-040: Edit User
**Description**: Same as Add User, pre-populated with existing data.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-117 | Success toast | Success toast on creation | new |
| AC-118 | Dialog closes on success | Dialog closes on success | new |
| AC-119 | Edit pre-populates fields | Edit dialog pre-populates all fields | new |
| AC-120 | Delete impact summary | Delete shows confirmation with impact summary | new |
| AC-121 | Deleted team removed | Deleted team removed from grid | new |
| AC-129 | Edit pre-populates fields | Edit dialog pre-populates all fields | new |
| AC-130 | Changes persist | Changes persist after save | new |
| AC-131 | Delete visibility | Delete button visible only to Admin users | new |

#### Test Cases
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| TC-008 | Change User Status | Test changing user status | failed |

#### Bugs
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| BUG-005 | Change User Status fails | User status change is not working correctly | open |

### FR-041: Delete User
**Description**: Soft delete with confirmation and restrictions.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-123 | Search filters by name/email | Search filters by name and email | new |
| AC-124 | Filters work independently | Filters work independently and combine | new |
| AC-132 | Delete confirmation dialog | Delete shows confirmation dialog | new |
| AC-133 | Cannot delete self | Cannot delete yourself (current logged-in user) | new |
| AC-134 | User removed from list | User removed from list after deletion | new |

#### Test Cases
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| TC-004 | Delete User | Test delete user functionality | failed |
| TC-005 | Verify User Deletion | Verify user is properly deleted | failed |

#### Bugs
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| BUG-003 | Delete User fails | User deletion is not working correctly | open |

### Epic-Level Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-148 | Page load under 2s | User pages load in under 2 seconds | new |
| AC-149 | Database confirmation | All user operations confirm with database before showing success | new |

---

## EPIC-013: Settings (Page: P-013)
**Status**: defined
**Overview**: Club settings and team logo management. Unified interface for managing all team logos within the club context.

### FR-050: Logo Grid View
**Description**: Page Header, unified grid of Club and Opposition Teams.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-155 | Unified grid display | Both Club Teams and Opposition Teams display in unified grid | new |
| AC-156 | Initials avatar display | Teams without logos display initials avatar | new |
| AC-157 | Card opens edit dialog | Clicking card opens edit dialog | new |

### FR-051: Edit Logo Dialog
**Description**: Team name, Short Name, Logo Upload, Color pickers, Background Removal.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-152 | Logo format/size | Logo accepts JPG/PNG only, max 2MB | new |
| AC-153 | Color preview squares | Color preview squares display correctly | new |
| AC-158 | Club Team read-only | Club Team names are read-only | new |
| AC-159 | Opposition Team editable | Opposition Team names are editable | new |
| AC-160 | Background removal modes | Background removal modes work correctly | new |

### FR-052: Delete Opposition Logo
**Description**: Soft delete with confirmation showing fixture count.

#### Acceptance Criteria
| ID | Title | Description | Status |
|----|-------|-------------|--------|
| AC-161 | Preview processed image | Preview shows processed image | new |
| AC-162 | Delete confirmation with count | Delete shows confirmation with fixture count | new |
| AC-163 | Deleted opposition removed | Deleted opposition removed from grid | new |
| AC-164 | Historical fixtures preserved | Historical fixtures still show opponent name | new |

---

## Summary

| Type | Count |
|------|-------|
| Pages | 3 |
| Epics | 3 |
| Functional Requirements | 9 |
| Acceptance Criteria | 42 |
| Test Cases | 8 |
| Bugs | 4 |
| **Total Items** | **69** |

### Test Case Status
| Status | Count |
|--------|-------|
| Passed | 2 |
| Failed | 4 |
| Partial | 1 |

### Bug Status
| Status | Count |
|--------|-------|
| Open | 4 |
