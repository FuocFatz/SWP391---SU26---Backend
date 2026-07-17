# EquiX Second-Pass Fix Report

## Backend and contracts

- Restored a safe tracked datasource contract and retained the ignored `application-local.properties` runtime profile.
- Added `ProfileUpdateRequest` and `PATCH /api/v1/auth/me`; only `fullName` and `phone` are mutable. Email, username, role, status, points, and credentials remain server-controlled.
- Added phone/avatar to the auth response so an immediate Profile save cannot erase fields omitted from login state.
- Added `RaceEntryResponse` for public race participants without exposing passwords or unrelated user fields.
- Restricted the new public permission to `GET /api/races/{id}/registrations`; all mutation endpoints retain role checks.
- Accepted legacy `APPROVED` rows in the assigned-referee check while auditing their true prior state.
- Standardized new predictions as `ACTIVE`.
- Added owner display names to the horse leaderboard.
- Backfilled missing notification read timestamps with an idempotent SQL migration and runtime guard.

## Frontend and role workflows

- Added real Admin entity pages for Accounts, Tournaments, Horses, Jockeys, Referees, Results, and Guesses.
- Added distinct Owner routes for horses, jockey/race pairing, pairings, races, and leaderboard.
- Added distinct Jockey routes for invitations, horse/race assignments, and achievements.
- Added distinct Referee routes for assigned races, race monitor/checks, and reports.
- Added distinct Spectator routes for race guessing, saved guesses, and leaderboard.
- Added complete authenticated mobile navigation for all five roles.
- Replaced hard-coded Home, Leaderboard, RaceCard, and Race Detail data with live API contracts.
- Implemented Profile save states and safe read-only identity fields.
- Repaired public FAQ/Footer/Contact/Privacy navigation and accessibility landmarks.

## Regression tests added

- Profile update preserves email, role, and account status.
- Legacy read notification receives a missing `readAt` timestamp.
- Legacy `APPROVED` registration is accepted by the assigned Referee.
- Prediction persistence returns `ACTIVE`.

## Compatibility migration

`docs/database/migrations/V20260716_03_legacy_notification_read_at.sql` is narrow and idempotent. The applied run affected 3 rows; a second run affects 0 rows.
