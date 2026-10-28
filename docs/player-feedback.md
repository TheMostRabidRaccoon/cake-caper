# Playtest-driven onboarding and feedback

## Reported problem

Two human players understood the objective but experimented with actions without understanding the simultaneous helper requirement. Their reported first plan was Open/Carry and Open/Push. Both held the lid on beat 1; neither held it when carrying on beat 2. The second plan alternated Push and Distract while the cake remained in the cooler. The event log incorrectly claimed the cake was reachable whenever the awake dog was distracted.

## Changes

- Explain the two simultaneous beats directly in the lobby and planner, including that the cooler closes after each beat.
- Show each action's requirements before selection. Action cards have readable full-width descriptions, stable radio names, and programmatic description associations.
- Keep the thematic character field note available in an expandable planner section so the repeated clue does not crowd out controls on phones.
- Give the second plan a briefing based on the current cake location and the previous public events. For the reported attempt: the lid opened, but nobody carried while it was open. Other briefings cover loaded cake and dropped cake with an awake or sleeping dog. No hidden teammate plans are read.
- Correct distraction messages for cake in the cooler, wagon, grass, or home. Only dropped cake gets the collection message. Unbraced pushes identify an empty wagon and distinguish waking a dog from an already-awake dog. Carrying feedback also distinguishes cake home from cake in the wagon.

The five action IDs, resolution order, puzzle outcomes, deadlines, room schema, Site identity, database binding, and access policy are unchanged. Existing logged events are historical and are not rewritten; new resolutions use the corrected messages. Reload the page to receive the new planner.

## Checks

34 deterministic tests passed, including four new cases: the exact reported two-plan sequence, alternate second-plan board states, truthful distraction text/event counts for every cake location, and a successful corrected second plan after the reported mistake. TypeScript and whitespace checks passed.

Local browser verification used two distinct seats. The updated radio controls accepted the reported first plan, showed the personalized second-plan briefing, and the same second-plan moves produced truthful cooler/empty-wagon/already-awake-dog feedback. An earlier UI inspection ran past the deadline and correctly finished with Wait actions; it was reset before the complete sequence was replayed.

The 375px planner and second-plan explanation were visually inspected. A 320px layout and hosted-release checks are recorded in the release handoff alongside screenshots. Browser verification is not evidence that new human players now understand the rules; that requires another unaided playtest.
