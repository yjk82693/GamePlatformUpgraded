import { Router } from "express";
import { requestDownload, checkUpdate } from "@game-platform/player";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/:appId", async (req: AuthedRequest, res) => {
  try {
    res.json(await requestDownload(req.accountId!, (req.params.appId as string)));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.get("/:appId/update", async (req, res) => {
  const installedVersion = req.query.installedVersion as string;
  res.json(await checkUpdate((req.params.appId as string), installedVersion));
});

export default router;
