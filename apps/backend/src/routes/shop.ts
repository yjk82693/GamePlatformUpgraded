import { Router } from "express";
import {
  browseShop, browseGames, getLibrary, addToLibrary,
  viewProduct, viewReviews, purchase, topup,
  verifyReceipt, restorePurchases, writeReview, viewOwnTransactions,
  tryDemo, claimDemoReward, redeemCode,
} from "@game-platform/player";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Topup Center — in-game currency/items for games already in the library
router.get("/browse", async (req: AuthedRequest, res) => {
  const { categoryId, appId } = req.query;
  const filter: { categoryId?: string; appId?: string } = {};
  if (typeof categoryId === "string") filter.categoryId = categoryId;
  if (typeof appId === "string") filter.appId = appId;
  res.json(await browseShop(req.accountId!, filter));
});

// Store — Steam-style game browser
router.get("/games", async (req: AuthedRequest, res) => {
  res.json(await browseGames(req.accountId!));
});

// Library — games explicitly added
router.get("/library", async (req: AuthedRequest, res) => {
  res.json(await getLibrary(req.accountId!));
});

router.post("/library/add", async (req: AuthedRequest, res) => {
  try {
    res.json(await addToLibrary(req.accountId!, req.body.appId));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get("/products/:id", async (req: AuthedRequest, res) => {
  res.json(await viewProduct(req.accountId!, req.params.id as string));
});

router.get("/products/:id/reviews", async (req, res) => {
  res.json(await viewReviews(req.params.id as string));
});

router.post("/purchase", async (req: AuthedRequest, res) => {
  try {
    const { productId, payWith } = req.body;
    res.json(await purchase(req.accountId!, productId, payWith));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post("/topup", async (req: AuthedRequest, res) => {
  const { amountCents } = req.body;
  await topup(req.accountId!, BigInt(amountCents));
  res.status(204).send();
});

router.get("/receipts/:receiptId", async (req: AuthedRequest, res) => {
  try {
    res.json(await verifyReceipt(req.accountId!, req.params.receiptId as string));
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

router.get("/restore", async (req: AuthedRequest, res) => {
  res.json(await restorePurchases(req.accountId!));
});

router.post("/reviews", async (req: AuthedRequest, res) => {
  try {
    const { productId, rating, body } = req.body;
    res.json(await writeReview(req.accountId!, productId, rating, body));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get("/transactions", async (req: AuthedRequest, res) => {
  res.json(await viewOwnTransactions(req.accountId!));
});

router.get("/demos/:id", async (req, res) => {
  try {
    res.json(await tryDemo(req.params.id as string));
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

router.post("/demos/:id/claim", async (req: AuthedRequest, res) => {
  try {
    await claimDemoReward(req.accountId!, req.params.id as string, req.body.answers);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post("/redeem", async (req: AuthedRequest, res) => {
  try {
    res.json(await redeemCode(req.accountId!, req.body.code));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
