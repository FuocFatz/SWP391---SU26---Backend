# EquiX Second-Pass Audit

Date: 2026-07-16

Branch: `codex/equix-second-pass-stabilization`

Baseline: `1fc2436`

## Outcome

The second pass audited the full React/Spring Boot/SQL Server runtime, all 13 mapped JPA entities, the 19 existing EquiX tables, public routes, five authenticated roles, notifications, Quick Login, responsive navigation, and the legacy data contract. Twenty actionable regressions were confirmed and fixed: 1 P0, 13 P1, and 6 P2. No P0/P1 defect remains open.

## Protected runtime

- Existing SQL Server database: `EquiX`; no reset, truncate, table rebuild, or bulk normalization was used.
- Existing business rows were preserved. Two temporary notification rows used for E2E were deleted by exact title and user after testing; the notification row count returned to 11.
- The idempotent notification compatibility migration repaired only 3 rows where `is_read = 1 AND read_at IS NULL`.
- Local credentials remain in ignored local files. Tracked configuration contains environment placeholders only.

## Entity and table coverage

Mapped JPA entities audited: `User`, `Horse`, `Tournament`, `Race`, `RaceRegistration`, `JockeyInvitation`, `PairingContract`, `RaceResult`, `RaceNote`, `Prediction`, `Notification`, `AuditLog`, and `PasswordResetToken`.

Additional legacy tables inspected: `achievements`, `jockey_achievements`, `jockey_profiles`, `reward_history`, `reward_types`, and `system_settings`.

## Verification result

- Backend clean tests: 15 passed, 0 failed, 0 errors, 0 skipped.
- Backend package: passed.
- Frontend lint: passed.
- Frontend production build: passed, 83 modules transformed.
- Runtime: Spring Boot used default profile `local`, connected to SQL Server 16.0, initialized 13 repositories, and started on port 9090.
- Browser E2E: Guest plus Admin, Horse Owner, Jockey, Referee, and Spectator passed.
- Browser console: 0 warnings/errors during the final E2E run.
- Runtime logs: 0 backend error matches and 0 frontend error matches.
- Screenshots: 15 evidence files in `docs/demo-screenshots/second-pass/`.

## Final database snapshot

| Table | Rows |
|---|---:|
| users | 83 |
| horses | 24 |
| tournaments | 13 |
| races | 14 |
| race_registrations | 24 |
| jockey_invitations | 9 |
| pairing_contracts | 0 |
| race_results | 9 |
| race_notes | 0 |
| predictions | 9 |
| notifications | 11 |
| audit_logs | 53 |
| password_reset_tokens | 16 |

## Reports

See the nine companion `EQUIX_SECOND_PASS_*` reports and `EQUIX_LEGACY_DATABASE_COMPATIBILITY_REPORT.md` for the failure matrix, fixes, security, E2E, UI, screenshots, remaining debt, and final acceptance record.
