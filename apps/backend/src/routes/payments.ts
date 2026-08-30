import { Router } from "express";
import { configureMerchant, setPaymentMethod, issueRefund, approveRefund, viewSettlement, reconcile, payout, exportTransactions, listMerchants } from "@game-platform/distributor";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/merchants", async (req: AuthedRequest, res) => {
  try {
    res.json(await listMerchants(req.accountId!));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/merchants", async (req: AuthedRequest, res) => {
  try {
    res.json(await configureMerchant(req.accountId!, req.body));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/merchants/:id/methods", async (req: AuthedRequest, res) => {
  try {
    res.json(await setPaymentMethod(req.accountId!, req.params.id as string, req.body.type));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.get("/transactions", async (req: AuthedRequest, res) => {
  try {
    res.json(await exportTransactions(req.accountId!));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/transactions/:id/refund", async (req: AuthedRequest, res) => {
  try {
    res.json(await issueRefund(req.accountId!, req.params.id as string));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post("/transactions/:id/approve-refund", async (req: AuthedRequest, res) => {
  try {
    res.json(await approveRefund(req.accountId!, req.params.id as string));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get("/settlements/:period", async (req: AuthedRequest, res) => {
  try {
    res.json(await viewSettlement(req.accountId!, req.params.period as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.get("/reconcile/:period", async (req: AuthedRequest, res) => {
  try {
    res.json(await reconcile(req.accountId!, req.params.period as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/payouts", async (req: AuthedRequest, res) => {
  try {
    const { period, amount } = req.body;
    res.json(await payout(req.accountId!, period, BigInt(amount)));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

export default router;
