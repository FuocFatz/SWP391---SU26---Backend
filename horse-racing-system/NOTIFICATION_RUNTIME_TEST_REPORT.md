# Notification Runtime Test Report

Runtime target: Spring Boot on port 9090, existing SQL Server `EquiX`, schema mode `validate`.

## HTTP and database evidence

| Check | Result |
|---|---|
| Authenticated list is scoped to current user | PASS |
| Initial test unread badge | 4 |
| Mark one | HTTP 200; badge 4 → 3 |
| Mark already-read one | HTTP 200; idempotent |
| Cross-user mark-one | HTTP 404; foreign row unchanged |
| Mark all | HTTP 200; remaining unread → 0 |
| Mark all again | updated count 0 |
| Persistence | 4/4 marker rows had `is_read=1`; 4/4 had non-null `read_at` |
| DTO | `userId` absent; no `ByteBuddyInterceptor` output |
| Browser console after regression | 0 errors |

The browser regression also caught and fixed a React warning caused by updating AuthContext from inside a `setNotifications` updater. The final mark-one run had a clean console.

## Automated coverage

- mark own notification
- reject another user's notification
- already-read idempotency
- current-user-only bulk update
- bulk idempotency
- DTO serialization
- list scoping
- duplicate event prevention

## Screenshots

- `docs/demo-screenshots/notifications/notifications-unread-dark.png`
- `docs/demo-screenshots/notifications/notification-mark-one-success.png`
- `docs/demo-screenshots/notifications/notifications-read-state.png`
- `docs/demo-screenshots/notifications/notifications-mark-all-success.png`
- `docs/demo-screenshots/notifications/notifications-empty-state.png`
- `docs/demo-screenshots/notifications/notifications-mobile.png`

Test marker rows and the temporary empty-state spectator were removed conditionally after capture.
