# EquiX Second-Pass Security Report

## Authentication and configuration

- JWT login and `/api/v1/auth/me` use the real authenticated principal.
- Quick Login calls the same secure login endpoint and remains controlled by ignored local frontend environment settings.
- Tracked datasource configuration uses environment placeholders; no credential-like literal was found in tracked application/frontend source.
- Local `application-local.properties` and `.env.local` are confirmed ignored.

## Authorization checks

| Endpoint/area | Access contract |
|---|---|
| Public race list/detail/results/leaderboards | Guest GET allowed |
| Public race registrations | Guest GET allowed through safe DTO only |
| Race registration/invitation | Horse Owner mutation only |
| Invitation response | Jockey mutation only |
| Referee check/start/complete/report | Referee only; assignment verified in service |
| Admin accounts/race status/results | Admin only |
| Predictions | Spectator mutation; Admin or owning Spectator read scope |
| Notifications | Authenticated and current-user scoped |
| Profile update | Authenticated current user; safe fields only |

## Client trust boundaries

- Client-supplied owner, spectator, role, status, email, reward points, and password fields are ignored or not accepted by the relevant mutation DTO.
- Public race entry responses expose display names and workflow fields, not password hashes, email addresses, phone numbers, or tokens.
- Notification mark-one verifies notification ownership and returns 404 for another user.
- Profile integration testing confirmed a payload containing fake `ADMIN`/`PENDING` values cannot change role or status.

## Scan and runtime result

- Source secret-like hits: 0.
- Dead `href="#"`, TODO/FIXME, and not-implemented hits: 0.
- Browser console warnings/errors: 0.
- Backend runtime security/SQL error matches: 0.

No open P0/P1 security defect was found after the fixes.
