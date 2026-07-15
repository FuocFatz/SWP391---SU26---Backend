# EquiX Remaining Blockers

The priority Quick Login and Notification defects are closed. The following items prevent an honest 100% or production-ready claim.

## B1 — Production email transport

Password reset tokens are securely generated, hashed, expire, are one-time, use the configured frontend URL, and are never logged. The current `LoggingEmailService` intentionally logs only a masked delivery request; it does not deliver mail. Configure a transactional SMTP/provider adapter before production.

## B2 — Authoritative live/provisional race pipeline

Duration ranges and randomized snapshots exist, assigned-referee start is enforced, and Admin cannot bypass the report. A server-owned countdown/push stream and persisted provisional finishing order before referee review are still needed for a fully authoritative live race (R12/R22).

## B3 — Deadline automation and report revision operations

Request-time cutoffs and minimum participant gates are enforced. A scheduled deadline worker that closes registration, flags fewer than six pairs, and supports the documented Admin revision loop should be added for unattended operations (R05 and section 14.3).

## B4 — Production reward/disqualification UX assets

The backend enforces a disqualification reason and sends tier-specific official reward notifications. The Admin UI still needs an explicit confirmation dialog for disqualification, and first-place merchandise links/contact plus voucher/coupon catalogs need production-owned data and redemption integrations (R13/R23).
