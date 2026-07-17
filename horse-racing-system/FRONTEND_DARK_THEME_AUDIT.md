# Frontend Dark Theme Audit

## Result

The active production routes use the shared EquiX dark design tokens. A final source scan found no literal `background: white/#fff` or `color: black/#000` in active CSS.

## Corrections

- Notifications: rebuilt cards, buttons, labels, skeleton, error, empty, focus, read/unread, and mobile states using semantic dark tokens.
- Quick Login: five dark role buttons with red/green accents, disabled/loading states, and no light card.
- Password Reset: replaced the isolated purple/light page and globally leaking `.form-*`/`.btn` overrides with page-scoped dark styles.
- Global controls: aligned autofill, select options, disabled controls, and focus-visible behavior with the dark palette.
- Removed the publicly routed `/test` endpoint workbench and its white CSS.
- Removed the unused mock horse list.

## Runtime review

Desktop Quick Login, every role dashboard, Notifications unread/read/empty states, and a 390x844 responsive Notifications viewport were captured from the real Vite/Spring/SQL Server runtime. The final browser console regression contained no errors.
