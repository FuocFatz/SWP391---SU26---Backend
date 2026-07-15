# EquiX Role E2E Report

## Authentication runtime

All checks used the real `POST /api/v1/auth/login` and bearer JWT against SQL Server data.

| Role | Login | `/api/v1/auth/me` | Identity/role | UI dashboard |
|---|---:|---:|---|---|
| ADMIN | 200 | 200 | match | PASS |
| HORSE_OWNER | 200 | 200 | match | PASS |
| JOCKEY | 200 | 200 | match | PASS |
| REFEREE | 200 | 200 | match | PASS |
| SPECTATOR | 200 | 200 | match | PASS |

Refresh retained the authenticated Admin session through `/me`. Logout cleared the session; a direct protected `/dashboard` navigation returned to `/login`.

## Role workflow surface

- Admin: user/race/horse summaries, tournament/referee assignment fields, registration approval, safe lifecycle actions, and report-ready finalization.
- Horse Owner: own horses only; pairing invitation precedes pair registration; registration and withdrawal actions use JWT identity.
- Jockey: only own invitations and assignments; only the intended jockey can accept/decline.
- Referee: assigned races only; pre-race checks, Standby start, completion, simulation view, and report submission; no Admin finalization control.
- Spectator: race Guess terminology, own guess list, one replaceable guess before Standby, locked afterward, and official tier notification.

Service integration tests exercise pairing-before-registration, spoofed owner/spectator ID rejection, guess replacement/locking, and report-before-official finalization. Browser dashboard loading used real backend data and ended without unexpected console errors.
