import { Router } from "express";
import { viewWallet } from "@game-platform/player";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthedRequest, res) => {
  const result = await viewWallet(req.accountId!, req.accountId!);
  res.json({
    cash: result.cash.toString(),
    coins: {
      gold: result.coins.gold.toString(),
      silver: result.coins.silver.toString(),
    },
  });
});

export default router;
