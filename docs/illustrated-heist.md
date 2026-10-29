# Illustrated heist field view — October 28, 2026

The player request was to add appealing little game graphics while retaining the corner progress map and the existing flow. The chosen direction combines the original warm raccoon artwork with clear game-like action cues. The reported unbraced wagon incident supplied the key example: make a spill visible as well as explaining it in text.

## Changes

- Added a lightweight, responsive backyard scene with original SVG scenery, cooler, wagon, cake and dog. Reused `public/raccoon.png`; no external assets, dependencies or image generation were needed.
- Raccoons move toward their revealed jobs. The lid opens for an opening action, a brace gets a visible cue, an unsecured wagon tilts, and a spilled cake tumbles onto the grass. Success and safe retreat receive distinct captions.
- The existing board remains as a miniature progress map in the upper-right corner. Both views use the same displayed beat, not the resolved future board.
- Illustrations use only public board state and revealed actions/events. Hidden plans remain hidden. An empty runaway wagon does not show a cake spill.
- The desktop reveal scrolls the field view into view after committing; mobile still returns to the planner at the next planning phase.
- Kept the original resolution rules, replay duration, planning deadlines, room recovery, server API, schema and hosting identity. Existing reduced-motion styles suppress transitions and animations; descriptive text and event history remain available.

## Verification

- 37 deterministic tests pass, including new presentation regressions for future-frame leakage, an actual spill versus an empty runaway, and persistent planning/result states without stale action effects.
- TypeScript and whitespace checks pass.
- Local two-player browser walkthrough: Open/Distract + Carry/Push spills a loaded wagon; Distract/Brace + Carry/Push recovers and delivers it. Both players receive the successful result with one spill and one recovery.
- Local four-player browser walkthrough: two Open/Brace plans plus two Carry/Push plans deliver the cake. Checked all four raccoons and the automatic desktop reveal focus.
- Inspected 320px and 375px layouts. The illustrated view and corner map fit without horizontal page overflow. Adjusted the dog position and successful cake position after visual inspection so the map and crew do not cover them.
- No console errors in the checked mobile session.

Publication details and screenshots are recorded in the chat workspace release record. These checks establish rendering and game-state consistency, not a claim about how new human players will rate the artwork.
