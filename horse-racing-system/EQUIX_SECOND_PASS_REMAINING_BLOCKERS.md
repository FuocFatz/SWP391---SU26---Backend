# EquiX Second-Pass Remaining Blockers

## Release blockers

- P0 blockers: 0
- P1 blockers: 0
- Required screenshot/report blockers: 0

## Non-blocking legacy data debt

1. Twenty-four historical registrations have no `pairing_contract_id`. Runtime dissolution is null-safe, but reconstructing contracts requires business-approved historical evidence.
2. Fourteen stored historical registration deadlines differ from the exact start-minus-seven-days rule. Runtime decisions compute the exact deadline; historical values were not rewritten.
3. Three historical references have semantic role mismatches: prediction 7 spectator, race 16 referee, and registration 6 jockey. They remain visible through defensive display fallbacks and require owner-approved reassignment.

## Environment notes

- Quick Login is intentionally local/demo-only and depends on ignored `.env.local` values.
- The app defaults to the ignored `local` Spring profile for the workstation runtime. Deployment must supply datasource and JWT environment values or an appropriate profile.

These items are explicitly not fabricated as four blockers and do not prevent the verified local release from starting or passing the tested flows.
