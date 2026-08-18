# Day 2 — Full Prisma schema, all 5 clusters migrated

## Decision
Postgres over SQLite. Reasoning: three coordinated products (player, distributor, co-op) with concurrent writes, which SQLite's file-locking doesn't handle well.

## Setup commands

    pg_isready
    createdb game_platform_dev

(run inside apps/backend — Prisma was still living in the backend app on Day 2, moved to commons on Day 3)

    npm install prisma --save-dev
    npm install @prisma/client
    npx prisma init --datasource-provider postgresql

Scaffolded prisma/schema.prisma, prisma.config.ts, .env.

## Prisma 7 gotchas hit

.env is not auto-loaded in Prisma 7. Fixed with:

    npm install dotenv

and confirming prisma.config.ts has `import "dotenv/config";` at the top, reading `datasource.url` from `process.env["DATABASE_URL"]`.

Fixed the placeholder .env connection string to the real local one:

    DATABASE_URL="postgresql://yoojun0522@localhost:5432/game_platform_dev?schema=public"

Verified connection: `npx prisma db pull` → `P4001 introspected database was empty` — expected/correct for a brand-new empty DB, confirms connection worked.

The datasource block in schema.prisma can no longer contain a `url` line at all in Prisma 7 (P1012 error) — the URL only lives in prisma.config.ts now. Fixed by trimming the schema's datasource block to just `provider = "postgresql"`.

## Schema built cluster by cluster (matching Phase 0's table groupings), migrating after each

### Cluster 1 — Identity, structure, RBAC
Models: Account, Org, Project, AppService, App, AccountApp, Session, PlayerProfile, Member, Role, MemberRole, Permission, SecretKey, Setting
Enums: AccountStatus, AppStatus, Visibility, RoleLevel, Action, Target

    npx prisma migrate dev --name identity_rbac

Judgment call: Member has three optional FKs (orgId/projectId/appServiceId) since RoleLevel says membership can live at any of the three scopes — Prisma has no clean "one-of-three" polymorphic FK, so this is an app-level invariant, not schema-enforced.

### Cluster 2 — Commerce & wallet
Models: Wallet, CoinLedger, Category, Product, Item, Transaction, Merchant, PaymentMethod, PaymentService, Settlement, Payout, Review, Demo, DemoParticipation, RedeemCode, RedeemGrant, Build, Entitlement
Enum: TxnState

    npx prisma migrate dev --name commerce_wallet

Judgment call: Item modeled as belonging to Product (doc uses both without defining the relationship explicitly). RedeemCode.reward kept as Json (matches the doc's [{item_id, amount}] bundle shape) rather than normalized into a join table.

### Clusters 3-5 — combined into one migration
Decided to combine rather than do three separate migrate steps, since going one cluster at a time started to feel redundant this far in.

- Cluster 3 (Game profile, social, ranking): Friendship, Leaderboard, Score, AchievementGroup, Achievement, AchievementUnlock, GameStatus + enums FriendStatus, BoardScope, GameType
- Cluster 4 (Console-domain, engagement, support, legal): Analytics, Metric, Dashboard, Widget, NotificationSetting, Notice, Announcement, LiveEvent, Reminder, Terms, Consent, AuditLog, DeadLetter + enum WidgetMode
- Cluster 5 (Chat spine & co-op): ChatThread, ChatParticipant, ChatMessage, TicketMeta, CalendarEvent, Task, Document, DocumentVersion, DocumentShare, RollbackRequest + enums ChatKind, TicketStatus, TaskPriority, CalScope, RollbackStatus

Judgment call: Friendship needed two named relations (FriendshipRequester/FriendshipAddressee) since it has two separate FKs into Account, which Prisma requires disambiguating.

    npx prisma migrate dev --name game_profile_console_coop

## Result
Full Phase 0 schema (all 5 clusters, ~45 models) live in game_platform_dev.
