# EquiX Second-Pass Failure Matrix

| ID | Severity | Failure | Fix | Status |
|---|---|---|---|---|
| F-001 | P0 | Tracked JDBC URL had a malformed `dbc:` prefix and embedded runtime credentials | Restored environment placeholders and default local profile | Fixed |
| F-002 | P1 | Admin sidebar sections did not render dedicated screens | Added `AdminSectionPage` and route/API-backed entity sections | Fixed |
| F-003 | P1 | Owner/Jockey/Referee/Spectator subroutes rendered the same full dashboard | Added section-aware role rendering for every sidebar route | Fixed |
| F-004 | P1 | Authenticated mobile users could not reach role routes | Added role-aware mobile navigation, Notifications, Profile, and Logout | Fixed |
| F-005 | P1 | Guest race detail could not read race registrations | Permitted public registration GET only | Fixed |
| F-006 | P1 | Race detail expected nested horse/jockey/owner objects not returned by the backend | Added safe `RaceEntryResponse` display DTO | Fixed |
| F-007 | P1 | Guest race detail fetched protected predictions and failed the whole page | Predictions now load only for Spectator/Admin sessions | Fixed |
| F-008 | P1 | Referee rejected legacy `APPROVED` registrations | `refereeCheck` accepts `READY_FOR_CHECK` and legacy `APPROVED`, preserving audit before-state | Fixed |
| F-009 | P1 | Referee Fit/Reject buttons stayed active after a check | Actions render only for checkable states; completed rows are read-only | Fixed |
| F-010 | P1 | New predictions used `OPEN` while legacy/runtime reports use `ACTIVE` | New and updated predictions now use `ACTIVE` | Fixed |
| F-011 | P1 | Profile Save and Change Photo controls were nonfunctional | Added safe profile PATCH; made email/role immutable; removed fake upload control | Fixed |
| F-012 | P1 | Public leaderboard and filters were hard-coded | Replaced with live horse leaderboard and owner names | Fixed |
| F-013 | P1 | Home race cards, live banner, stats, and leaderboard were demo data | Replaced with current API/SQL Server values | Fixed |
| F-014 | P1 | Race cards fabricated IDs, participants, dates, and unknown status labels | Removed fallbacks and normalized all race statuses/types | Fixed |
| F-015 | P2 | Race type filter did not match uppercase legacy values | Normalized filter comparisons and dark error/loading states | Fixed |
| F-016 | P2 | Three read notifications had null `read_at` | Backfill migration plus idempotent runtime repair | Fixed |
| F-017 | P2 | Footer had dead anchors, mojibake, and advertised MySQL | Replaced with real internal links, clean text, and SQL Server | Fixed |
| F-018 | P2 | FAQ link/page required by the public flow was absent | Added `/faq` and linked it from Navbar, Footer, and Home | Fixed |
| F-019 | P2 | Notifications nested a second `main` landmark inside dashboard layout | Replaced page root with a non-landmark container | Fixed |
| F-020 | P2 | Mobile toggle lacked an accessible name and avatars assumed a non-null name | Added dynamic aria-label and safe display fallback | Fixed |

## Totals

- Confirmed: 20
- Fixed: 20
- Open P0: 0
- Open P1: 0
- Non-blocking legacy debt: documented separately, not counted as fabricated failures.
