import { Router } from "express";
import { submitScore, viewRankings, myRank, searchPlayer, viewAchievements, getGameMode, listBoardsForApp, viewAchievementsForApp } from "@game-platform/player";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/:boardId/score", async (req: AuthedRequest, res) => {
  try {
    res.json(await submitScore(req.accountId!, req.params.boardId as string, req.body.value));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get("/:boardId", async (req: AuthedRequest, res) => {
  const scope = (req.query.scope as "GLOBAL" | "FRIENDS") ?? "GLOBAL";
  res.json(await viewRankings(req.params.boardId as string, scope, req.accountId));
});

router.get("/:boardId/my-rank", async (req: AuthedRequest, res) => {
  res.json({ rank: await myRank(req.accountId!, req.params.boardId as string) });
});

router.get("/players/search", async (req, res) => {
  res.json(await searchPlayer(req.query.q as string));
});

router.get("/achievements", async (req: AuthedRequest, res) => {
  res.json(await viewAchievements(req.accountId!));
});

router.get("/mode/:appId", async (req: AuthedRequest, res) => {
  res.json({ mode: await getGameMode(req.params.appId as string) });
});

router.get("/boards/:appId", async (req: AuthedRequest, res) => {
  res.json(await listBoardsForApp(req.params.appId as string));
});

router.get("/achievements/:appId", async (req: AuthedRequest, res) => {
  res.json(await viewAchievementsForApp(req.accountId!, req.params.appId as string));
});

export default router;
