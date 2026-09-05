import { Router } from "express";
import { createProduct, updateProduct, deleteProduct, enableItem, disableItem, manageCategory, listProductsForApp, listAppsForOrg } from "@game-platform/distributor";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/apps", async (req: AuthedRequest, res) => {
  try {
    res.json(await listAppsForOrg(req.accountId!));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.get("/products/app/:appId", async (req: AuthedRequest, res) => {
  try {
    res.json(await listProductsForApp(req.accountId!, req.params.appId as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/products", async (req: AuthedRequest, res) => {
  try {
    res.json(await createProduct(req.accountId!, req.body));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.patch("/products/:id", async (req: AuthedRequest, res) => {
  try {
    res.json(await updateProduct(req.accountId!, req.params.id as string, req.body));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.delete("/products/:id", async (req: AuthedRequest, res) => {
  try {
    await deleteProduct(req.accountId!, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/products/:id/enable", async (req: AuthedRequest, res) => {
  try {
    res.json(await enableItem(req.accountId!, req.params.id as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/products/:id/disable", async (req: AuthedRequest, res) => {
  try {
    res.json(await disableItem(req.accountId!, req.params.id as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/categories", async (req: AuthedRequest, res) => {
  try {
    res.json(await manageCategory(req.accountId!, req.body));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

export default router;
