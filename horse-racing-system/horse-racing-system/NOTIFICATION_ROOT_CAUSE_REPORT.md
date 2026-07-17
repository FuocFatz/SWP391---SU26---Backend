# Notification Root Cause Report

## Why Mark One failed

The failure was a cross-layer defect, not a single button problem:

1. The entity fields were not explicitly mapped to the real SQL Server columns (`category`, `is_read`), and the database had no `read_at` column.
2. The old mark-one endpoint loaded a notification only by ID and returned a mutable entity. It neither derived ownership from the authenticated principal nor protected another user's row.
3. The list endpoint accepted client-controlled `userId`, allowing data-scope confusion.
4. The frontend caught the request error only in the console, leaving the card visually unchanged. Its closure-based state update could also become stale.
5. The deployed/runtime behavior reported for Mark All did not match the audited source, which contained no mark-all endpoint. That source/runtime drift made the two controls appear inconsistent. A bulk update path also avoids the entity load/save mapping that broke mark-one.

## Endpoint contract: before and after

| Operation | Before | After |
|---|---|---|
| List | `GET /api/notifications?userId={clientValue}` | `GET /api/notifications` (JWT principal) |
| Count | absent | `GET /api/notifications/unread-count` |
| Mark one | `PATCH /api/notifications/{id}/read`, ID-only entity save | same URL, principal-scoped, DTO response, idempotent |
| Mark all | absent in audited source | `PATCH /api/notifications/read-all`, scoped bulk update |

## Frontend behavior: before and after

- Before: passed `user.id`, swallowed errors, patched a captured array, did not update the shared header count, and had no explicit action state.
- After: sends no user ID, guards concurrent actions, updates only the returned ID, updates shared unread count outside the React state updater, surfaces errors, disables in-flight controls, and uses a single bulk request for mark-all.

## Persistence and security

- Migration `V20260716_01_notification_read_at.sql` added nullable `read_at` without resetting data.
- Mark-one persists `is_read=1` and a non-null `read_at`.
- Mark-all updates only unread rows belonging to the current principal and is idempotent.
- Cross-user mark-one returns 404 to avoid disclosing whether another user's notification exists.
- `NotificationResponse` omits `userId` and JPA internals, preventing serialization/proxy leakage.
- `createIfAbsent` plus an integration test prevents duplicate business notifications.

## Visual correction

White cards and ambiguous square controls were replaced with dark semantic surfaces, red unread rail/dot, green read indicator, explicit action labels, focus rings, skeleton/error/empty states, and a responsive mobile layout.
