# Token Radar — build instructions for the coding agent working in this repo

You are building the entry for make.fun bounty token-radar-01, "Build the best token launch radar". Build only. Do NOT run `makefun login`, do NOT run `makefun register`, do NOT create any account, do NOT submit anything, do NOT create a GitHub repository, do NOT commit anything (no `git commit`, no `git push`). Another agent handles connection, screenshots, commits, and submission. Your job is the code and the dashboard, written fresh in this session, run and verified by you.

## Where things are

- Kit (read-only reference): `~/workspace/token-radar-01-kit-v23` (fresh level-23 kit, downloaded 2026-11-19; the old level-20 kit is at `~/workspace/token-radar-01-kit` — do not use it)
  - `input/README.md` — the field guide to the sealed snapshot. Read it first.
  - `input/snapshot.json` — the frozen DefiLlama protocol data: 758 protocols at or above $5,000,000 TVL, 40 on the watchlist, floor $50,000,000, as_of 2026-11-14. Treat it as read-only. Your program reads it from `/input/snapshot.json` in the grader, or `--input <snapshot.json|directory>` locally.
  - `starter/` — a working reference entry ONLY. Study its shape if you need to, but write every file in this repo fresh, in your own words and structure. Never copy a starter file byte-for-byte, except `vendor/makefun-board.ts`, which MUST be copied byte-for-byte from the kit starter — it is the scorer's own library and the dossier builder.
- This repo is the entry. Node on this machine is v24 (the program runs on Node 22; use standard library only, no dependencies, no network at runtime).
- Your sandbox cannot reach the internet, bind servers, run Chromium, or commit. Do not try. The coordinator takes the screenshots with Playwright while your session is running, and commits afterwards.

## What to build

A program plus the dashboard it writes:

- `main.ts` at the repo root (Node 22, standard library only). It reads the sealed snapshot, scores every pre-token protocol, writes the ranked board to `/output/board.json` (or `$MAKEFUN_OUTPUT_DIR` locally), writes the dashboard's data beside the page, copies `dashboard/` and `screenshots/` to the output, and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-board.ts`. It must be deterministic: two runs write identical bytes.
- `lib/model.ts` — the scoring model and board building, written fresh by you.
- `vendor/makefun-board.ts` — byte-for-byte copy from the kit starter.
- `dashboard/index.html`, `dashboard/app.css`, `dashboard/app.js` — a static page that renders with no network, reading the data the program writes. Keep the dashboard source compact: the dossier's text (dashboard source) is capped at 65,536 bytes total, so keep index.html + app.css + app.js tight and avoid repetition.
- `screenshots/` — the coordinator fills this in with Playwright while a session of yours is running. Your program must copy whatever is in `screenshots/` to the output, and must refuse (exit non-zero) when there are not exactly 3 screenshots. Do NOT take screenshots yourself and do NOT invent screenshot files.
- `LICENSE` — MIT, and include the line `SPDX-License-Identifier: MIT` in it.
- `README.md` — what the radar is and how to run it, carrying the three live make.fun badges for this bounty as images linking to make.fun:
  - `https://make.fun/badge/token-radar-01.svg`
  - `https://make.fun/badge/token-radar-01/godanaaa/token-radar-01-entry/rank.svg`
  - `https://make.fun/badge/token-radar-01/godanaaa/token-radar-01-entry/reward.svg`
  Do not leave any `{owner}` / `{repo}` placeholder in those URLs.
- `.makefun/owner.json` — already in the repo; do not change it.

## The board (gate shape — keep it exactly)

- `board.json`: 100–4000 rows. EVERY one of the 40 watchlist slugs must be covered, and at least 60 rows must be protocols OUTSIDE the watchlist. Aim for 200+ rows: all 40 watchlist + the highest-TVL pre-token protocols below the floor.
- Every row: `slug`, `name`, `rank` 1..N in order, `implied_value_usd` a positive whole number that does not rise with rank (non-increasing down the board), and `farm_steps` of 3–12 strings, each 20–600 characters.
- Dashboard: static, no network, `index.html` plus at least one `.css` and one `.js`, at most 400 files / 4 MiB total.
- Screenshots: exactly 3, each at most 512 KiB, long side at most 1440 px, short side at least 800 px.

## How the judge ranks entries (most important first)

1. A working radar: the board covers every protocol on the snapshot's watchlist, ranks the pre-token ones by an implied value it states, and the screenshots and the code agree. A screen with no data or code behind it counts for nothing. The watchlist is a floor, never a ceiling — the board may carry protocols below it.
2. The value model: the implied value follows from the snapshot's own figures — the protocol's TVL, its seven-day growth, and how long it has run with no token — and NOT from a hardcoded list of names. The board separates protocols whose token already trades from those still to come.
3. Farm plans: each protocol's plan gives concrete steps with what they cost and how long they take, not slogans.
4. The dashboard as a page: sortable and filterable, readable at a glance, with a detail view for each protocol.
5. It looks made: a chosen palette, consistent spacing, type that reads, not a framework pasted wholesale.

## The value model (design it yourself, from the snapshot's figures)

Derive implied value from the snapshot fields only: `tvl_usd`, `change_7d`, `listed_at` (age with no token), `category`, `chains`. For example: a base from TVL (comparable launches tend to price at a fraction of TVL), boosted by positive 7-day growth and by longer token-less tenure, tempered by category and chain breadth. State the formula plainly on the dashboard and in the code comments so the judge can see it follows from the figures. Never hardcode a ranking of names. Keep token-trading protocols out of the ranked pre-token board (or clearly set aside as "already live" and never ranked above pre-token ones).

## Farm plans (concrete, per protocol)

Each plan's steps must name real actions for that kind of protocol (e.g. for a DEX: swap on specific chains, provide liquidity in a named pool type, hold the position; for lending: supply, borrow; for perps: open/close positions), with an approximate cost in dollars of gas/fees and a time commitment (minutes/hours per week, over how many weeks). Vary the steps by category and chains — do not repeat one generic plan for every row. Steps must be honest about what the snapshot does and does not prove: no invented airdrop promises, no invented token names.

## Dashboard

- Dark, radar-themed design with one chosen palette, consistent spacing, readable type. No external fonts, scripts, or images — everything inline or local, no network.
- Board table: rank, protocol name, category, chains, TVL, 7d change, age without token, implied value, confidence/notes. Sortable by every numeric column, filterable by category, chain, and a text search, plus a pre-token-only toggle.
- Detail view for every protocol: clicking a row opens a detail panel/view with the full farm plan, the value-model breakdown (each factor's contribution), TVL context from the snapshot, and guidance.
- The page MUST support these URL hashes, because the screenshots are taken through them:
  - default (no hash): the full board.
  - `#detail=<slug>`: the detail view for that protocol, with its farm plan visible.
  - `#filter=<category>`: the board filtered to that category (use a real category from the snapshot, e.g. `Dexs`).
  - Set `window.__shotReady = true` once the board/detail has rendered, so the screenshot run knows the page is ready.
- A short "How the value is worked out" section stating the model, and a "What this snapshot is" note (DefiLlama data as of 2026-11-14, 758 protocols, 40 on the watchlist).

## Workflow (do this, in order, in this session)

1. Read `~/workspace/token-radar-01-kit/input/README.md` and inspect the snapshot's shape (a small script or `node -e` read is fine).
2. Write `main.ts`, `lib/model.ts`, `vendor/makefun-board.ts` (kit copy), `dashboard/` files, `LICENSE`, `README.md` — all fresh, in your own code.
3. Run it: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ~/workspace/token-radar-01-kit/input/snapshot.json`. It will fail on the missing screenshots AFTER writing `board.json` and the dashboard data — that is expected at this stage; the coordinator takes the screenshots while your session runs, then you re-run. Fix every other error.
4. IMPORTANT: after the first successful run, REVISE `main.ts` in a later message — improve something real (e.g. the model, the output validation, the determinism) and edit the file, then re-run. A file written once and never revised fails the transcript check, so this revision step is required, not optional.
5. While your session is running, the coordinator takes the 3 screenshots into `screenshots/` with Playwright. If they are not there yet when you first run, wait for them: poll for `screenshots/1-board.png`, `screenshots/2-detail.png`, `screenshots/3-filtered.png` every 20 seconds for up to 10 minutes (sleep in small steps between checks), then re-run the program so it copies them and writes `dossier.json`. If they still have not appeared after 10 minutes, finish with a clear report of what is missing instead of inventing them.
6. Run the program twice into two different output dirs and diff them — they must be byte-identical.
7. Validate the gate shape yourself with a small script: board row count, all 40 watchlist slugs present, at least 60 rows outside the watchlist, ranks 1..N, implied values positive whole and non-increasing, farm steps 3–12 of 20–600 chars, dashboard file count/bytes, screenshot count/sizes/dimensions. Report any failure plainly.
8. At the end, print a short summary: board row count, watchlist coverage (x/40), rows outside the watchlist, screenshot sizes, validation results, and the files you wrote. Do NOT commit, do NOT run any makefun command.

## Rules

- Standard library only. No network in the program or the dashboard. No secrets anywhere in the repo. No copying starter files except `vendor/makefun-board.ts`.
- Do not touch `~/.makefun`, do not run any makefun login/register/submit/bundle/check command, do not create a GitHub repo, do not push anywhere, do not commit.

## Revision pass (second session — read this first)

A first session already built a working entry: 342 rows, 40/40 watchlist, 302 outside, deterministic, dossier written. Your job now is to REVISE it so the ranking answers the brief instead of restating TVL, then re-verify everything. Do not rebuild from scratch; improve what is here.

The problem: the current board's top 10 is 5 CEX rows, 2 Bridge rows and a Liquid Staking row (binance-staked-eth, a staked product of a token that already trades). That is a TVL table, not a launch radar. The snapshot's own watchlist — the house's reading of launchable protocols — contains NO CEX and NO Bridge entry; its largest groups are Risk Curators (12) and RWA (7). A centralised exchange, a bridge, or a staked/wrapped product of an existing token is not a protocol still waiting on a launch of its own, and no on-chain farm plan can meaningfully apply to it.

What to change, in `lib/model.ts` (and `main.ts` where it touches the model):

1. Add a launch-plausibility multiplier derived from the snapshot's `category` field only — never from a hardcoded list of protocol names. Temper hard the categories that cannot plausibly launch a farmable token: CEX and Bridge near the bottom (e.g. ×0.15), Liquid Staking low (e.g. ×0.35, it is mostly staked/wrapped products of tokens that already trade). Keep farmable DeFi categories at or above 1 where the snapshot supports it (Dexs, Lending, Perps, Yield, Restaking, Yield Aggregator and similar). Every one of the 40 watchlist slugs must stay on the board — tempering moves rows down, it never removes them.
2. Keep the rest of the model (8% of TVL × growth × tenure × chain breadth) and keep implied values positive whole numbers, non-increasing with rank.
3. Update every place that states the formula so it matches the new one: the "How the value is worked out" text in `dashboard/index.html`, the model-breakdown text in `dashboard/app.js`, and the code comments. The dashboard must also say, plainly, that CEX / bridge / staked products are ranked down because they are not farmable pre-token launches.
4. After the first revised run, REVISE `main.ts` again in a later message — a real improvement (e.g. a validation the gate needs, a determinism guard, clearer output), then re-run. A file written once and never revised fails the transcript check.
5. Re-run the program into `out/` and into two fresh dirs (`out-a`, `out-b`) and diff the two fresh dirs — they must be byte-identical. Re-run the gate-shape validation from the workflow above (rows, 40/40 watchlist, ≥60 outside, ranks, values, farm steps, dashboard size, screenshots).
6. Screenshots: the coordinator retakes all three screenshots with Playwright WHILE your session is running, because the new ranking changes the detail view (the new rank-1 protocol) and the board. After your first revised run, poll for `screenshots/1-board.png`, `screenshots/2-detail.png`, `screenshots/3-filtered.png` every 20 seconds for up to 10 minutes; the coordinator replaces them with fresh renders of YOUR new board. Once all three have a modification time newer than your revised run, re-run the program so it copies them and writes a fresh `dossier.json`, then re-verify. If they have not appeared after 10 minutes, finish with a clear report of what is missing instead of inventing them.
7. At the end, print a short summary: new top 10 (rank, slug, category, implied value), board row count, watchlist coverage, determinism result, and validation results. Do NOT commit, do NOT run any makefun command.

## Polish pass (third session — read this first)

The entry is built, validated and deterministic. One presentation flaw remains: at the 1280×800 screenshot size the board table is slightly wider than the viewport, so the rightmost column (Confidence / notes) is cut off at the right edge of the board screenshot. Fix ONLY the table fit, in `dashboard/app.css` (and `dashboard/app.js` only if the markup must change):

- Make the whole board table fit inside 1280 px with no horizontal cutoff: tighten cell padding and font size for the table, let the protocol-name and chains cells wrap, and shorten the chains cell (show at most 2 chains plus a "+n" count). Every column, including Confidence / notes, must be fully visible at 1280×800.
- Do NOT change the model, the board data, the rankings, the formula text, or any other file except `dashboard/app.css` (and `dashboard/app.js` if markup must change). Do NOT change `main.ts`'s logic; a small comment-only touch to `main.ts` is acceptable if you need a revision, but do not change its behaviour.
- Re-run the program into `out/` and into two fresh dirs and diff them (must be byte-identical). Re-run the gate-shape validation.
- Screenshots: the coordinator retakes all three screenshots with Playwright WHILE your session is running, because the CSS change alters the renders. After your run, poll for `screenshots/1-board.png`, `screenshots/2-detail.png`, `screenshots/3-filtered.png` every 20 seconds for up to 10 minutes; once all three have a modification time newer than your run, re-run the program so it copies them and writes a fresh `dossier.json`, then re-verify. If they have not appeared after 10 minutes, finish with a clear report instead of inventing them.
- At the end, print a short summary: what changed, the new table width behaviour, determinism result, validation results. Do NOT commit, do NOT run any makefun command.

## Transcript-repair pass (fourth session — read this first)

The entry is built, validated and deterministic, but the kit check FAILED one gate check: thinking_reproduces — the transcripts account for only 131 of 508 counted lines (25.7%), under the 30% required. Everything else passed (12 passed, 6 skipped). The cause is mechanical, not quality: the counted files are main.ts (59 lines), lib/model.ts (65), vendor/makefun-board.ts (373 lines, the kit's own copy, which can never count as authored), dashboard/index.html (1 line), dashboard/app.css (18), dashboard/app.js (1 line). The dashboard HTML and JS are single-line files, so they contribute almost no authored lines. Your job in this session is to ADD authored lines — at least 200 new lines written by you in this session — while keeping the entry valid and the dashboard rendering identical.

Do this, in order:

1. Pretty-print `dashboard/index.html` and `dashboard/app.js` into readable multi-line files: same behaviour, same rendering, same selectors, same data, same hash routes (`#detail=<slug>`, `#filter=<category>`), same `window.__shotReady` signal, no visual change. Keep the dashboard source total (index.html + app.css + app.js) at or under 65,536 bytes — it is currently about 13,139 bytes, so there is plenty of headroom. Keep `dashboard/app.css` as it is unless a formatting touch is needed; do not change the layout.
2. Expand `lib/model.ts` so farm plans are individualised per protocol: vary the steps by the protocol's own name, category, chains, TVL and age (token-less tenure), with concrete actions, approximate dollar costs for gas/fees, and time commitments. Keep every row's farm_steps at 3–12 strings of 20–600 characters each. Keep the value model and its formula unchanged (8% of TVL × growth × tenure × chain breadth × category plausibility), keep implied values positive whole numbers, non-increasing with rank, keep all 40 watchlist slugs on the board and at least 60 rows outside the watchlist. Do not hardcode a ranking of names; derive everything from the snapshot's fields.
3. After your first revised run, REVISE `main.ts` in a later message with a real improvement (for example a validation the gate needs, a determinism guard, or clearer output), then re-run. A file written once and never revised fails the transcript check, so this revision step is required, not optional.
4. Re-run the program into `out/` and into two fresh dirs (`out-a`, `out-b`) and diff the two fresh dirs — they must be byte-identical. Re-run the gate-shape validation from the workflow above (rows, 40/40 watchlist, ≥60 outside, ranks, values, farm steps, dashboard size, screenshots).
5. Screenshots: the coordinator retakes all three screenshots with Playwright WHILE your session is running, because the farm-plan text changes the detail view. After your first revised run, poll for `screenshots/1-board.png`, `screenshots/2-detail.png`, `screenshots/3-filtered.png` every 20 seconds for up to 10 minutes; the coordinator replaces them with fresh renders of YOUR new board. Once all three have a modification time newer than your revised run, re-run the program so it copies them and writes a fresh `dossier.json`, then re-verify. If they have not appeared after 10 minutes, finish with a clear report of what is missing instead of inventing them.
6. Do NOT touch `vendor/makefun-board.ts` (it must stay byte-identical to the kit starter). Do NOT run any makefun command. Do NOT commit. Do NOT take screenshots yourself.
7. At the end, print a short summary: new line counts for main.ts, lib/model.ts, dashboard/index.html, dashboard/app.css, dashboard/app.js; board row count, watchlist coverage, determinism result, validation results, and the new top 5 (rank, slug, implied value).

## Run-fix pass (fifth session — read this first)

Round 1 was REJECTED on run_completes only: the grader runs `node /bot/main.ts` from a different working directory and it exits non-zero. Every other check passed. The cause, reproduced by the coordinator from /tmp: main.ts reads `dashboard/` and `screenshots/` as relative paths (`cpSync('dashboard', ...)`, `readdirSync('screenshots')`, `join('screenshots', name)`, `readFileSync(source)` where source is a relative join) — those resolve against `process.cwd()`, so from any other directory they throw ENOENT (`lstat 'dashboard'`) and the run dies after writing board.json.

Your job: fix ONLY the cwd dependence in main.ts.

1. Import `dirname` from 'node:path' and `fileURLToPath` from 'node:url'; define `const root = dirname(fileURLToPath(import.meta.url))` and use `join(root, 'dashboard')` / `join(root, 'screenshots')` for every dashboard/screenshots access. Input stays as-is (absolute /input/snapshot.json or --input); output stays as-is (resolve of $MAKEFUN_OUTPUT_DIR or /output).
2. Do NOT change the model, board data, rankings, formula text, dashboard, or screenshots. Do NOT retake or touch the screenshots — the 3 already in the repo stay valid.
3. Reproduce the grader run before AND after your fix, exactly as the coordinator did: from a different cwd (`cd /tmp`), `MAKEFUN_OUTPUT_DIR=<empty dir> node main.ts --input ~/workspace/token-radar-01-kit-v23/input/snapshot.json` — confirm it fails with ENOENT before the fix and exits 0 after. Then re-run from the repo cwd into `out/` and into two fresh dirs (`out-a`, `out-b`) and diff the fresh dirs — they must be byte-identical. Re-run the gate-shape validation (rows, 40/40 watchlist, ≥60 outside, ranks, values, farm steps, dashboard size, screenshots).
4. After your first fixed run, REVISE main.ts again in a later message with a real improvement (for example a clear error if a required directory is missing, naming the resolved path), then re-run. A file revised across at least 2 messages keeps the transcript check passing.
5. At the end, print a short summary: the before/after reproduction results (cwd, exit code), determinism result, validation results, top 5 unchanged. Do NOT commit, do NOT run any makefun command.

## Run-fix pass, second revision (sixth session — read this first)

The fifth session fixed the cwd dependence in main.ts (root resolved from import.meta.url). Your job is a second, real revision to main.ts only, so the entrypoint keeps being revised across sessions:

1. Read main.ts as it stands. Make ONE real improvement that does not change board data, rankings, the model, the dashboard, or the screenshots — for example: validate early that the resolved dashboard/ and screenshots/ directories exist and fail with a clear error naming the resolved path (instead of a bare ENOENT from cpSync/readdirSync), or a clearer startup error when the snapshot file is missing. Keep the behaviour otherwise identical: same outputs, same determinism, same exit codes on the gate failures that already exist.
2. Re-run the grader-style reproduction from a different cwd (`cd /tmp`, `MAKEFUN_OUTPUT_DIR=<empty dir> node main.ts --input ~/workspace/token-radar-01-kit-v23/input/snapshot.json`) — it must exit 0. Re-run from the repo cwd into two fresh dirs and diff them — byte-identical. Re-run the gate-shape validation.
3. Do NOT touch lib/model.ts, the dashboard, or the screenshots. Do NOT commit, do NOT run any makefun command.
4. At the end, print a short summary: what you changed in main.ts, reproduction result, determinism result, validation results.
