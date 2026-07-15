-- Safe, idempotent compatibility repair for legacy notifications.
-- Rows already marked as read should carry the timestamp expected by the runtime contract.
UPDATE notifications
SET read_at = COALESCE(created_at, SYSDATETIME())
WHERE is_read = 1
  AND read_at IS NULL;
