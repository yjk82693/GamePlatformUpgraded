import { Router } from "express";
import { getGameSummary, getAchievementProgress, getAchievementGroupDetail } from "@game-platform/player";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/summary/:appId", async (req: AuthedRequest, res) => {
  res.json(await getGameSummary(req.accountId!, req.params.appId as string));
});

router.get("/achievements/:appId/progress", async (req: AuthedRequest, res) => {
  res.json(await getAchievementProgress(req.accountId!, req.params.appId as string));
});

router.get("/achievements/group/:groupId", async (req: AuthedRequest, res) => {
  try {
    res.json(await getAchievementGroupDetail(req.accountId!, req.params.groupId as string));
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

export default router;
