# EquiX Second-Pass Role E2E Report

Runtime: React/Vite `http://localhost:5173`, Spring Boot `http://localhost:9090`, existing SQL Server `EquiX`.

## Role matrix

| Actor | Scenarios executed | Result |
|---|---|---|
| Guest | Home live data, Races, Leaderboard, FAQ, race 8 detail with 8 named entries | Pass |
| Admin | Quick Login, dashboard, mobile role menu, Accounts section with real 83-user data | Pass |
| Horse Owner | Quick Login, dashboard, My Horses isolated section, Profile save with immutable identity fields | Pass |
| Jockey | Quick Login, Invitations isolated section with real pending rows | Pass |
| Referee | Quick Login, Race Monitor, selected `Giai Ao Lang`, completed check shown read-only | Pass |
| Spectator | Quick Login, My Guesses isolated section, notification flow, mobile role menu | Pass |

## Notification flow

Two uniquely named temporary notifications were inserted for the active demo Spectator, then:

1. Notification Center loaded both as unread and navbar badge showed 2.
2. Mark-one changed one card to read and reduced the count to 1.
3. Mark-all changed the remaining card and reduced the badge to 0.
4. Refresh preserved the read state.
5. The two temporary rows were deleted by exact key; database notification count returned to 11.

## Referee legacy behavior

- Browser UI showed no Fit/Reject action for an existing `CLEARED_TO_RACE` row; it displayed `Check completed`.
- Integration test confirmed a legacy `APPROVED` row transitions to `CLEARED_TO_RACE` for the assigned Referee and records `APPROVED` as the audit before-value.

## Route isolation assertions

- `/dashboard/horses` shows Owner horse creation/list and does not show Available Races.
- `/dashboard/invitations` shows Jockey invitations and does not show Race Assignments.
- `/dashboard/guesses` shows Spectator history and does not show the Race Guess form.
- `/dashboard/monitor` shows Referee race control/check state.
- `/dashboard/accounts` shows Admin Account Management rather than the root dashboard.

## Runtime cleanliness

- Browser console error/warning entries: 0.
- Backend error-pattern matches: 0.
- Frontend error-pattern matches: 0.
