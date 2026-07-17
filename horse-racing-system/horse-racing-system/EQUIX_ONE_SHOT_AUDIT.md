# EquiX One-Shot Audit

Audit date: 2026-07-16 (Asia/Saigon)

Source of truth: `EquiX_Business_Logic_Definitive_v3.md`

Branch: `codex/equix-one-shot-completion`

## Outcome

The audit recorded 43 actionable findings. 39 are fixed and verified; 4 grouped blockers remain and are documented in `EQUIX_REMAINING_BLOCKERS.md`. This project is materially safer and functionally complete for the priority Quick Login and Notifications paths, but it is not represented as 100% production-ready.

| Area | Found | Fixed | Remaining |
|---|---:|---:|---:|
| Secrets, schema, and runtime configuration | 8 | 8 | 0 |
| Authentication and Quick Login | 6 | 6 | 0 |
| Notifications | 9 | 9 | 0 |
| Authorization and privacy boundaries | 5 | 5 | 0 |
| R01-R25 business workflows | 10 | 7 | 3 |
| Frontend dark theme and release hygiene | 4 | 4 | 0 |
| Production email delivery | 1 | 0 | 1 |
| **Total** | **43** | **39** | **4** |

## High-impact corrections

- Removed committed database/JWT defaults; production now requires environment variables and validates the SQL Server schema.
- Added isolated H2 `test`/`demo` profiles without changing the production database engine.
- Replaced raw-role Quick Login with the normal email/password login endpoint and real JWT session restore.
- Bound all private notification operations to the JWT principal, added DTO serialization, `read_at`, ownership checks, unread count, mark-one, and idempotent mark-all.
- Removed client-controlled owner/spectator identity from horse, invitation, registration, prediction, and notification decisions.
- Added the active pairing contract model and SQL Server filtered unique indexes for R01/R02.
- Enforced pairing-before-registration, exact seven-day registration cutoff, 6-18 participants, assigned-referee start, Standby guess locking, report-before-finalization, 10/6/4/2/1 standings, and 60/30/10 prize allocation notifications.
- Removed the production `/test` UI and unused mock horse page; corrected password-reset and Notifications dark styling.

## Verification

- Backend: clean Maven test suite passes (12 tests after the final duplicate-notification test), including authentication, notification ownership/idempotency, and business workflow integration.
- Frontend: ESLint passes; Vite production build passes.
- Real runtime: Spring Boot started against the existing SQL Server `EquiX` database with `ddl-auto=validate`.
- Real authentication: all five demo roles returned HTTP 200 for login and `/api/v1/auth/me`, with matching identity and role.
- Browser: all five Quick Login routes reached the correct dashboard; reload restored the session; logout returned protected navigation to `/login`.
- Notification browser regression ended with zero console errors.
- Runtime test rows and temporary SQL login/user were removed conditionally after evidence capture. Existing application data was not reset.

## Data safety

No database, table, user race data, horse data, prediction, reward, or existing notification was bulk-deleted. Applied migrations are additive. Test cleanup targeted only rows carrying the `CODEX_E2E_...` marker and one explicitly named temporary spectator.
