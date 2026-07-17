# Quick Login Fix Report

## Root cause

The UI passed a raw role string such as `"ADMIN"` into the normal login method, while `POST /api/v1/auth/login` requires a JSON `LoginRequest` containing `email` and `password`. The old AuthContext also had mock role/session behavior, so a UI role could diverge from the authenticated backend identity.

## Fix

- Quick Login is rendered only when `VITE_ENABLE_QUICK_LOGIN=true`.
- Each role reads its email/password from the ten documented `VITE_DEMO_*` environment variables.
- Every button calls the same real endpoint as the normal form with `{ email, password }`.
- No bypass endpoint, frontend JWT construction, password bypass, or raw role request remains.
- The active role receives a spinner; all form and Quick Login controls are disabled during the request, preventing double submission.
- JWT and the backend `/api/v1/auth/me` response establish identity. Refresh restores the session through `/me`; logout clears it and protected navigation redirects to `/login`.
- `.env.local` and secret-bearing patterns are ignored. Both `.env.example` files contain placeholders only.
- The optional demo seeder runs only under the `demo` profile, takes credentials from environment variables, BCrypt-hashes passwords, and never logs them.

## Runtime evidence

| Role | Login | `/auth/me` | Role | Browser redirect |
|---|---:|---:|---|---|
| ADMIN | 200 | 200 | ADMIN | `/dashboard` |
| HORSE_OWNER | 200 | 200 | HORSE_OWNER | `/dashboard` |
| JOCKEY | 200 | 200 | JOCKEY | `/dashboard` |
| REFEREE | 200 | 200 | REFEREE | `/dashboard` |
| SPECTATOR | 200 | 200 | SPECTATOR | `/dashboard` |

All five existing database accounts were `VERIFIED`, non-deleted, and authenticated using the normal password verifier. Pending owner/jockey login remains blocked. Public Admin/Referee registration remains blocked.

## Screenshots

- `docs/demo-screenshots/quick-login/quick-login-five-roles.png`
- `docs/demo-screenshots/quick-login/quick-login-loading.png`
- `docs/demo-screenshots/quick-login/quick-login-admin-success.png`
- `docs/demo-screenshots/quick-login/quick-login-owner-success.png`
- `docs/demo-screenshots/quick-login/quick-login-jockey-success.png`
- `docs/demo-screenshots/quick-login/quick-login-referee-success.png`
- `docs/demo-screenshots/quick-login/quick-login-spectator-success.png`
