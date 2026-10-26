# Public-playability pass — October 26, 2026

## Baseline and scope

Continues the existing `codex/round-rules-and-room-recovery` branch from `918ffce070a571c993c6ad9e7cfa5ca3e7dde392`, draft PR #1. The same Site project and D1 binding are retained. The cooperative five-action puzzle, two planning rounds, original artwork, server-owned deadlines, and room-recovery rules are unchanged.

## Changes

- **Joining:** copy an invitation URL containing only the room code. An invitation opens the join form first, with the code filled in. Names and codes submit with Enter; codes tolerate pasted spaces/lowercase. Saved-seat choices on invitations show only the target room. The form explains the separate-device and voice-call setup.
- **Mobile:** sticky links switch between board/crew and controls. Phase changes bring the replay board, next planner, or final report into view at widths up to 720px. Invitation forms precede the decorative introduction on phones. Report values wrap at narrow widths.
- **Connections:** room reads remain serial, time out after ten seconds, and refresh on visibility, focus, and online events. Wakeups during an active read coalesce into one immediate follow-up. Cleanup aborts old reads. Action requests also time out with a message that asks the player to check the refreshed room before retrying.
- **Feedback:** locked players see which teammates are still planning. Clean wins, rescues, and unsuccessful heists have distinct result explanations. Copy controls announce success. The reveal heading no longer implies every plan spilled the cake.

## Verification before publication

- **30/30 deterministic tests passed**, including all 27 existing game/recovery/storage cases and three new polling lifecycle cases (serial/coalesced refresh, stalled-request recovery, cancellation).
- **TypeScript check passed** after the final UI correction. `git diff --check` passed.
- **Real local API/D1 integration passed:** concurrent and duplicate commits, host permissions, single resolution, clean reveal, revoked seats, final-room closure, actual 45-second host absence/takeover, actual two-minute planning deadline, late commit rejection, visible waits, preservation of locked moves, and a full rescue-round timer.
- **Two-browser UI walkthrough passed:** create room, copy invitation, join, start, choose actions through the controls, lock, reload with the same committed plan, shared two-beat reveal, and matching clean-win reports.
- **Rescue walkthrough passed:** intentionally push without bracing, observe grass/slope/awake-dog state, close the second player's tab, explicitly resume that seat in a fresh tab, coordinate recovery, and finish with identical facts on both players: cake home, wagon home, 2/2 raccoons, one spill, one recovery, one successful distraction out of two attempts.
- **Connection interruption:** stopped the local preview server, observed the reconnecting banner with the current report retained, restarted the server, and observed the restored room and cleared banner. The development server's automatic reload means this check is not a measurement of the new online/visibility handler latency; the poller lifecycle is tested independently.
- **Responsive checks:** inspected the 375px mobile replay/result layouts and a 320px planner; DOM measurements showed no horizontal page overflow. At 375px the replay board and result panel each arrived about 70px below the sticky navigation after phase changes. Desktop and mobile showed the same game facts.
- **Clipboard:** verified the invite URL carried only `?room=...`, and the copied incident report matched the displayed clean-win result. A missing accessible name on the copy-report button was found and corrected during testing.
- No browser console errors were present before the deliberate server-interruption test. The development framework emitted context-provider warnings during hot reload; the tested flows continued correctly.

The production build is a required publication step. Deployment IDs, final source commit, public-access confirmation, and hosted smoke-test evidence are recorded in the accompanying release record after publication.

## Limits and administrative boundary

Browser walkthroughs used independent player seats/tabs on one Mac. Viewport emulation is not a physical-phone test; separate-device/cellular play and an unaided human playtest remain unverified. This pass does not establish load capacity or long-term replayability.

The user deliberately selected Work and documented a Work/Codex labeling discrepancy. Contest-tool eligibility remains unresolved and separate from development. No organizer has been contacted and no contest entry has been submitted by this pass.
