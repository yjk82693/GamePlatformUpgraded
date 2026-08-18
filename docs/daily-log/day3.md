# Day 3 — Moved Prisma into commons, wired backend, fixed workspace config

## Decision
commons should own the DB contract directly rather than apps/backend owning Prisma and commons hand-mirroring types — this matches Phase 0's own framing of commons as "the contract" and "only the brain touches the DB."

## Move

    mv apps/backend/prisma packages/commons/prisma
    mv apps/backend/prisma.config.ts packages/commons/prisma.config.ts
    mv apps/backend/.env packages/commons/.env

Updated the generator block in schema.prisma:

    generator client {
      provider = "prisma-client-js"
      output   = "../src/generated/prisma"
    }

    cd packages/commons
    npx prisma generate

→ Generated Prisma Client v7.9.1 to ./src/generated/prisma.

Created src/db.ts as the single export point:

    export { PrismaClient } from "./generated/prisma";
    export * from "./generated/prisma";

## Debugging chain to get commons building clean

1. npm run build scope-crept into the entire monorepo — errors surfaced in apps/frontend/src/App.tsx, apps/frontend/src/main.tsx, and prisma.config.ts, none of which should have been touched by commons' build. Root cause: packages/commons/tsconfig.json didn't exist, so tsc fell back to the root tsconfig.json with no include restriction. Fixed by creating:

       {
         "extends": "../../tsconfig.json",
         "compilerOptions": { "rootDir": "src", "outDir": "dist" },
         "include": ["src"]
       }

2. src/db.ts error: "ECMAScript imports and exports cannot be written in a CommonJS file under verbatimModuleSyntax" — packages/commons/package.json had no "type": "module" field (defaults to CommonJS). Fixed by adding "type": "module".

3. Same error persisted after that — turned out to be a second, separate issue: nodenext module resolution requires explicit file extensions on relative imports. Fixed db.ts to import from "./generated/prisma/index.js" (.js, not extensionless — points at the real compiled file Prisma generates, even though nothing here is hand-written TS).

4. Stray leaked build output — src/db.js, src/db.d.ts, src/index.js, src/index.d.ts (plus .map files) were sitting directly in src/, left over from an early npm run build that ran before outDir was configured. Deleted:

       rm src/db.js src/db.js.map src/db.d.ts src/db.d.ts.map
       rm src/index.js src/index.js.map src/index.d.ts src/index.d.ts.map

5. Editor-only red squiggly on prisma.config.ts: "Cannot find name 'process'" — not a real build error (this file is excluded from tsc's scope by tsconfig.json's include), just the VS Code language server missing Node types. Fixed:

       npm install --save-dev @types/node

6. Root cause of every earlier npm install --workspace=... failure, going back to Day 1: the root package.json never actually had a "workspaces" field. Fixed by adding:

       "workspaces": ["packages/*", "apps/*"]

   then running npm install at the repo root, then successfully running:

       npm install @game-platform/commons --workspace=apps/backend

7. apps/backend/src/index.ts didn't exist — the Day 1 placeholder step (echo "console.log('backend placeholder');" > src/index.ts) never actually ran there. Created it:

       import { PrismaClient } from "@game-platform/commons";
       const prisma = new PrismaClient();
       console.log("backend placeholder — Prisma wired via @game-platform/commons");

   Also missing apps/backend/tsconfig.json — created with the same pattern as commons. Added "type": "module" and "build"/"start" scripts to apps/backend/package.json.

8. Build failed: "Module '@game-platform/commons' has no exported member 'PrismaClient'" — packages/commons/src/index.ts was still the Day 1 placeholder (export {};), never updated to actually re-export db.ts. Fixed:

       export * from "./db.js";

   Rebuilt commons, then apps/backend built clean.

## Result
npm run build passes clean in both packages/commons and apps/backend. apps/backend now imports PrismaClient from @game-platform/commons instead of owning its own Prisma setup.

## Left for later (not urgent)
- apps/backend/package.json still lists @prisma/client and prisma as direct dependencies from before the move — dead weight, safe to prune.
- apps/backend still has .agents/, .claude/, .windsurf/, skills-lock.json — leftovers from when npx prisma init originally scaffolded skills there.
