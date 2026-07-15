# EquiX Legacy Database Compatibility Report

## Compatibility status

The application starts against the existing SQL Server `EquiX` schema with Hibernate validation, 13 repository interfaces, and no schema reset. Runtime logs contain no SQL error, missing-column error, permission denial, or failed DML message.

## Verified legacy contracts

| Contract | Result |
|---|---|
| User roles/statuses | Existing ADMIN, HORSE_OWNER, JOCKEY, REFEREE, SPECTATOR and PENDING/VERIFIED values load |
| Race statuses | DRAFT, REGISTRATION_OPEN, REGISTRATION_CLOSED, COMPLETED, REPORT_READY, OFFICIAL load |
| Race types/surface | Legacy uppercase types and `Turf` render correctly |
| Registration statuses | APPROVED is treated as the legacy ready-for-referee state |
| Prediction status | Existing `ACTIVE` rows remain compatible; new rows now use `ACTIVE` |
| Notification contract | channel/title/message/is_read null gaps: 0; read timestamp gaps after migration: 0 |
| Unique pairing indexes | `ux_pairing_active_horse` and `ux_pairing_active_jockey` remain present |
| Duplicate active pairs | 0 |
| Duplicate spectator/race predictions | 0 |
| Invalid negative wager/reward/prize values | 0 |
| Invalid race participant limits | 0 |

## Narrow migration applied

The compatibility script updated exactly the three rows that were already read but had no `read_at`. Total notification rows remained 11 after E2E cleanup.

## Preserved legacy debt

- All 24 existing registrations have `pairing_contract_id = NULL`. The service handles this defensively when dissolving pairings; no synthetic contracts were invented.
- Stored deadlines on 14 legacy races do not exactly equal race start minus seven days. Runtime eligibility computes the exact deadline from date/time, avoiding a risky historical rewrite.
- Three semantic identity mismatches remain in historical references: prediction 7 points to a Horse Owner, race 16 points to an Admin referee ID, and registration 6 points to a Horse Owner jockey ID. They are reported, rendered defensively, and not mass-reassigned without business authority.

These are data-normalization tasks, not current startup or tested-route blockers.
