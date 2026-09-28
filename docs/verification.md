# Prototype verification — September 28, 2026

Verified locally before publication:

- Six rule tests passed: clean first-plan win, spill and recovery, guarded cake and safe retreat, independence from player ordering, hidden plans and session tokens, and invalid plan rejection.
- TypeScript checking passed.
- Two independent Chrome browser contexts created and joined one room through the actual interface.
- Both submitted actions concurrently and saw the same board state.
- The second player reloaded between plans and rejoined the same session.
- Both completed a rescue and received matching report facts and findings.
- A replay from the same room completed a clean win with zero spills.
- No browser page errors were emitted during the scenario.
- The report was checked at 375px width without horizontal overflow.
- Original artwork was inspected and has a transparent background.

The first automation pass exposed a form hydration race; nickname/code inputs now wait for client initialization before accepting edits. A test assertion was narrowed to compare report content, since the host correctly has a replay control that the guest does not.

The game exposes optional read-room and stage-draft WebMCP tools. The test browser does not support document.modelContext, so validation in a native WebMCP context was unavailable. This does not affect ordinary play.

These checks establish the small prototype's behavior, not its enjoyment, replayability, production load capacity, or contest eligibility. Real group playtesting remains necessary. Online publishing is verified separately through the Sites deployment status.
