# Room recovery — October 6, 2026

Implemented in Codex after reviewing the September Claude review packets and the acceptance brief. This pass keeps the original five-action cake puzzle and its balance. It does not implement the later loading-rule, report, clue or replayability proposals.

## Behavior

- Each planning round has a server-owned two-minute deadline. The host can grant one extra minute per round, or reveal after a 30-second grace period. Missing plans become two visible Wait actions. Already locked moves are preserved, and events explain the waits.
- A connected player can take over after 45 seconds without contact from the host. Lobby-only departures/removals free seats; a leaving host transfers hosting. Taking over during a mission preserves the roster and plans.
- Resume credentials are saved per seat in localStorage. Active seats stay separate per tab in sessionStorage. New tabs show a chooser instead of silently selecting a raccoon. Credentials remain on the same browser and are never placed in links or reports.
- Expired rooms, revoked seats and older room versions stop reconnection and show a useful message. Temporary network failures keep reconnecting without discarding the seat or current draft.
- The reveal footer reads the displayed beat. Beat one no longer announces an outcome that happens on beat two.

No database schema migration is needed: room state remains in the existing D1 JSON column. The room payload version changes, and older rooms ask the player to create a new room rather than changing committed plans in place. Access settings remain private.

## Validation

- 27 deterministic tests pass, covering the original six game scenarios, saved-seat storage, permissions, deadline/commit races, version conflicts, stale commands, host takeover races, replay completion and reveal text.
- TypeScript passed after the saved-seat type check was corrected.
- The real local API/D1 check passed: concurrent commits and clean delivery, duplicate commit handling, host-only controls, seat revocation, room closure, takeover after an actual 45-second absence, and an actual two-minute deadline followed by a full rescue timer.
- Two in-app browser tabs created/joined a room, staged separate plans, reloaded and closed/reopened the committed host seat, selected it from a two-seat chooser, and completed a clean win. The first reveal beat showed only its current outcome. A second round exercised the extra minute and early reveal with a visible Wait action. Removing a seat returned that tab to the join screen with a clear message.
- At 375px viewport width, the page had no horizontal overflow and both action selection and host controls worked. No console warnings/errors were recorded in either tested tab. This was a browser viewport check, not a test on a physical phone.
- The optional WebMCP draft-staging tool worked in the in-app browser and left submission to the visible Commit control.
- [Desktop capture](screenshots/room-recovery.jpg) and [phone-width capture](screenshots/room-recovery-mobile.jpg) document the local test. Production build and private publication are separate release checks; their results belong to the release/PR record.

These checks exercise the implementation; they do not establish enjoyment, replayability, public access or contest eligibility. The four-player one-beat solution, field-note coverage and incident-report improvements remain separate design work.
