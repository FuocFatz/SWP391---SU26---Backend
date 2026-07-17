# EquiX Second-Pass UI Polish Report

## Data integrity in the UI

- Home statistics, featured races, live banner, and Top Performers now come from current APIs.
- Leaderboard podium/table use real horse, owner, race, win, top-three, and point values.
- Race cards no longer invent participant counts, IDs, dates, types, or statuses.
- Public race detail renders the safe backend entry DTO: lane, horse, jockey, owner, and status.
- All race type/status comparisons tolerate the uppercase legacy database format.

## Navigation and responsive behavior

- Every sidebar route now has section-specific content.
- Authenticated mobile navigation exposes the correct role routes plus Notifications, Profile, and Logout.
- Mobile toggle has an accessible dynamic label.
- FAQ, Privacy, Contact, and Account Access links resolve to real routes/anchors.
- The Footer now identifies SQL Server and renders clean Unicode copyright/dash characters.

## Actions and feedback

- Referee checks disappear after completion instead of allowing a guaranteed conflict.
- Profile Save has loading, success, and error feedback; email and role are visibly immutable.
- Notification mark-one, mark-all, refresh, unread badges, and durable read states are visible and tested.
- Public prediction form appears only for a Spectator and respects locked race states.
- Empty, loading, and error states use the existing dark theme rather than light inline cards.

## Accessibility cleanup

- Removed the nested `main` landmark on Notifications.
- Added named mobile navigation control and safe avatar initials.
- Forms keep associated labels or accessible names; action buttons have role-specific text.

## Responsive evidence

The 311-577 px runtime viewport was used to verify mobile menu content, notification layout, Referee actions, Jockey invitations, and Spectator guesses. The full screenshot list is in `EQUIX_SECOND_PASS_SCREENSHOT_INDEX.md`.
