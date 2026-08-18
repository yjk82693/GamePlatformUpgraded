# Day 1 — Scaffold + npm workspaces monorepo

## Decision
Rebuilding the game platform from scratch as a deliberate revision pass, unifying lessons from AIPortfolio, the earlier gamebase-clone project, and Studio OS. Chose an npm workspaces monorepo, structured around the Phase 0-2 design docs:

    packages/{commons, player, distributor, coop, ai-coordinator}
    apps/{backend, frontend}

`commons` is the shared contract (Phase 0). `player`/`distributor`/`coop` (1A/1B/1C) depend on it. `ai-coordinator` (Phase 2) depends on all three product packages.

## Commands run

Root init:

    mkdir game-platform && cd game-platform
    git init
    npm init -y

Root package.json edited to add:

    "workspaces": ["packages/*", "apps/*"]

(This step was actually missed here and not caught until Day 3 — see Day 3 notes.)

Root TypeScript base config:

    npm install -D typescript
    npx tsc --init

All package/app subdirectories created in one pass:

    mkdir -p packages/commons/src packages/player/src packages/distributor/src packages/coop/src packages/ai-coordinator/src apps/backend/src apps/frontend/src docs/daily-log

Per-package init (repeated for commons, player, distributor, coop, ai-coordinator):

    cd packages/<name>
    npm init -y
    npm pkg set name="@game-platform/<name>" main="dist/index.js" types="dist/index.d.ts"
    cd ../..

Placeholder entrypoint per package:

    echo "export {};" > packages/<name>/src/index.ts

Per-package tsconfig.json:

    {
      "extends": "../../tsconfig.json",
      "compilerOptions": { "rootDir": "src", "outDir": "dist" },
      "include": ["src"]
    }

Backend setup (apps/backend):

    npm init -y
    npm pkg set name="@game-platform/backend" main="dist/index.js"
    npm install express
    npm install -D typescript @types/express @types/node tsx

Frontend setup (apps/frontend) via Vite:

    cd apps/frontend
    rmdir src
    npm create vite@latest . -- --template react-ts
    cd ../..
    npm install

## Git

Created root .gitignore:

    node_modules/
    dist/
    .env
    *.log

Pushed to GitHub: https://github.com/yjk82693/GamePlatformUpgraded.git

## Lesson learned
`git add .` only stages the *current* directory when run from inside a subfolder — not the whole repo. This is why the first commit/push only included `apps/backend` (was run from inside that folder). Decided this subfolder-scoped style is actually preferred — commit each part of the monorepo individually going forward, rather than one big commit.
