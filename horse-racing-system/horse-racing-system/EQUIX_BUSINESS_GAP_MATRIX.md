# EquiX Business Gap Matrix

Status reflects implemented and verified behavior, not aspirational design.

| Rule | Status | Evidence / remaining gap |
|---|---|---|
| R01 | PASS | Active jockey pairing protected in service and filtered unique SQL index. |
| R02 | PASS | Active horse pairing protected in service and filtered unique SQL index. |
| R03 | PASS | Registration requires an active pairing contract. |
| R04 | PASS | Registration refuses requests at/after race start minus exactly seven days. |
| R05 | PARTIAL | 6-18 validated and start/Standby require six cleared pairs; no background deadline scheduler automatically flags undersubscribed races. |
| R06 | PASS | One row per spectator/race; a pre-Standby edit replaces that row. |
| R07 | PASS | Standby locks stored guesses and later writes are rejected transactionally. |
| R08 | PASS | Public Admin/Referee registration rejected; Admin-only referee creation. |
| R09 | PASS | Owner/Jockey register as pending and cannot authenticate until approved. |
| R10 | PASS | Spectator registers verified and receives a real JWT immediately. |
| R11 | PASS | Only the assigned Referee can start, and only from Standby. |
| R12 | PARTIAL | Referee report then Admin finalization is enforced; authoritative provisional result persistence before the report remains incomplete. |
| R13 | PARTIAL | API requires a written disqualification reason and notifies the pair; generic Admin result UI lacks the requested confirmation dialog. |
| R14 | PASS | Participant withdrawal limited to 3-7 days; Admin can handle exceptions. |
| R15 | PASS | Official top-three allocations computed 60/30/10 with remainder-safe arithmetic and notifications. |
| R16 | PASS | Guess rewards settle only in Admin finalization. |
| R17 | PASS | Pairing dissolves only on official finalization or authorized withdrawal. |
| R18 | PASS | Random duration ranges implemented for Sprint/Mile/Medium/Long. |
| R19 | PASS | Create/update forces Turf. |
| R20 | PASS | One assigned referee and overlapping same-date time windows rejected. |
| R21 | PASS | Horse training/stat fields do not affect simulation position. |
| R22 | PARTIAL | Positions are randomized, but an authoritative server countdown/push stream is not implemented. |
| R23 | PARTIAL | Correct tier-specific notifications exist; production merchandise assets/contact catalog and redemption integration remain external. |
| R24 | PASS | Any non-negative prize pool accepted, including zero. |
| R25 | PASS | Standings, allocations, pairing release, and rewards occur only at Admin finalization. |

Summary: 20 PASS, 5 PARTIAL. The partial items are grouped into three business blockers in `EQUIX_REMAINING_BLOCKERS.md`.
