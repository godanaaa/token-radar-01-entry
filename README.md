# Token Radar

[![make.fun bounty](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01) [![rank](https://make.fun/badge/token-radar-01/godanaaa/token-radar-01-entry/rank.svg)](https://make.fun/bounty/token-radar-01) [![reward](https://make.fun/badge/token-radar-01/godanaaa/token-radar-01-entry/reward.svg)](https://make.fun/bounty/token-radar-01)

Token Radar ranks protocols with no recorded token by an implied value derived from TVL, seven-day TVL change, tracking tenure, chain breadth and category. It uses a frozen DefiLlama snapshot; a ranking is a research lead, not a claim that a protocol will launch a token or distribute rewards. The dashboard includes filters, sortable columns and a protocol detail view with a concrete, costed activity plan.

## Run

Use Node 22 or newer, with no package installation:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts --input /path/to/snapshot.json
```

`--input` may name the snapshot file or its containing directory. The default input is `/input/snapshot.json`, and the default output directory is `/output`. The program writes `board.json`, `dashboard/` with its local data, `screenshots/`, and the scorer dossier. It expects exactly three coordinator-provided screenshots in the repo's `screenshots/` directory.
