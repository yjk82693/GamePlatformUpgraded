import { Router } from "express";
import { createBoard, configureBoard, openSeason, closeSeason, registerTerms, activateTerms, generateCode, batchGenerate, trackRedemptions, revokeCode, listBoardsForApp, listTerms, listRedeemCodes, listMultiplayerApps } from "@game-platform/distributor";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/apps/multiplayer", async (req: AuthedRequest, res) => {
  try {
    res.json(await listMultiplayerApps(req.accountId!));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.get("/boards/app/:appId", async (req: AuthedRequest, res) => {
  try {
    res.json(await listBoardsForApp(req.accountId!, req.params.appId as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/boards", async (req: AuthedRequest, res) => {
  try {
    const { appId, name } = req.body;
    res.json(await createBoard(req.accountId!, appId, name));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.patch("/boards/:id", async (req: AuthedRequest, res) => {
  try {
    res.json(await configureBoard(req.accountId!, req.params.id as string, req.body));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/boards/:id/open-season", async (req: AuthedRequest, res) => {
  try {
    res.json(await openSeason(req.accountId!, req.params.id as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/boards/:id/close-season", async (req: AuthedRequest, res) => {
  try {
    res.json(await closeSeason(req.accountId!, req.params.id as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.get("/terms", async (req: AuthedRequest, res) => {
  try {
    res.json(await listTerms(req.accountId!));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/terms", async (req: AuthedRequest, res) => {
  try {
    const { content, version, effectiveDate } = req.body;
    res.json(await registerTerms(req.accountId!, content, version, new Date(effectiveDate)));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/terms/:version/activate", async (req: AuthedRequest, res) => {
  try {
    res.json(await activateTerms(req.accountId!, req.params.version as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.get("/redeem-codes", async (req: AuthedRequest, res) => {
  try {
    res.json(await listRedeemCodes(req.accountId!));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/redeem-codes", async (req: AuthedRequest, res) => {
  try {
    const { reward, usesLeft, expiry } = req.body;
    res.json(await generateCode(req.accountId!, reward, usesLeft, expiry ? new Date(expiry) : undefined));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/redeem-codes/batch", async (req: AuthedRequest, res) => {
  try {
    const { reward, count, usesLeft, expiry } = req.body;
    res.json(await batchGenerate(req.accountId!, reward, count, usesLeft, expiry ? new Date(expiry) : undefined));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.get("/redeem-codes/:id/redemptions", async (req: AuthedRequest, res) => {
  try {
    res.json(await trackRedemptions(req.accountId!, req.params.id as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/redeem-codes/:id/revoke", async (req: AuthedRequest, res) => {
  try {
    res.json(await revokeCode(req.accountId!, req.params.id as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

export default router;
