# Cake Caper

A first playable experiment for a cooperative raccoon heist. The working title is **Cake Caper — A Woodland Council Operation**.

Players share a room code, discuss two actions each, commit privately, and watch both beats resolve together. A coordinated first plan can succeed. A mistake changes the board and leaves one recovery plan. The incident report is computed from the actual event log.

## Play

1. Open the game in two independent browser tabs or devices.
2. Create a room with a nickname. A second player joins with the six-letter code.
3. The host starts the mission. Every player selects one action for each of two beats and commits.
4. Once all players commit, the server resolves the actions and all players see the same replay.
5. Recover the cake on the second plan if needed. The host can return the crew to the lobby for another try.

The local address is only reachable on this Mac. A private Sites deployment is for the owner; it is not yet the public, login-free competition entry.

## The five actions

- **Open cooler:** hold its spring-loaded lid open for one beat.
- **Carry cake:** load the cake, or retrieve it from the grass.
- **Brace wagon:** control a teammate's push on the same beat.
- **Push wagon:** deliver the loaded cake when braced; otherwise the wagon rolls down the slope and spills its contents.
- **Distract dog:** let a teammate recover a fallen cake while the awake dog is occupied.

A clean two-player plan: player one chooses Open then Brace; player two chooses Carry then Push.

A recoverable mistake: player one chooses Open then Distract; player two chooses Carry then Push. The second plan can pair Distract with Carry, then Brace with Push.

This is a deterministic rules experiment, not a general physics simulation. Spatial transitions illustrate resolved actions. There is one backyard, one cake, one wagon, one dog, 2–4 human players, and at most two planning cycles. The first test is whether the rules, consequences, and rescue make sense. Its long-term replayability and fun still need human playtesting.

## Local development

Requires Node 22.13 or newer. Dependencies are already installed in this checkout.

```sh
npm run dev -- --host 127.0.0.1
```

The development server prints its local URL. D1 migrations have been applied to this checkout's `.wrangler/state`.

For a fresh checkout:

```sh
npm run install:ci
npm run db:generate
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_sour_mysterio.sql
npm run dev -- --host 127.0.0.1
```

Run checks:

```sh
node --test tests/game.test.mjs
npx tsc --noEmit
npm run build
```

## How it works

- `lib/game.ts`: simultaneous action rules, event log, replay timing, and report.
- `app/api/room/route.ts`: authenticated per-player room actions, validation, and public views.
- `db/rooms.ts`: authoritative D1 state with optimistic version checks to avoid lost simultaneous commits.
- `app/game.tsx`: lobby, two-beat planner, synchronized reveal, and incident report.
- `app/board.tsx`: the game board and animated pieces.

Player session tokens are kept in sessionStorage so reloading the same tab reconnects. Other players' uncommitted/committed plans and all session tokens are omitted from public views until the reveal. Rooms expire after 24 hours; expired data is no longer accessible, but automatic database deletion is not implemented. A lost browser session cannot reclaim its slot; the host can return the remaining crew to the lobby or create a new room.

## Cost and artwork

Playing and generating reports use fixed game rules; no model API is called. Hosting and storage are separate platform resources. One original raccoon asset was generated with the built-in image-generation tool and is stored at `public/raccoon.png`. Its exact prompt is in `docs/raccoon-art-prompt.txt`.

## Competition boundary

This is a private prototype and design experiment, not a submitted contest entry. Public access, broader testing, final polish, and the Handshake submission package remain separate later steps. The mission's ChatGPT Work walkthrough and final requirements should be checked before entry.
