import { Router } from "express";
import { getMetric, loadDashboard, exportPdf, addWidget, editWidget, removeWidget, listWidgets, reorderWidget, analyzeDashboard, getOrCreateDashboard } from "@game-platform/distributor";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/dashboard", async (req: AuthedRequest, res) => {
  try {
    res.json(await getOrCreateDashboard(req.accountId!));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/metric", async (req: AuthedRequest, res) => {
  try {
    res.json(await getMetric(req.accountId!, req.body));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.get("/dashboards/:id", async (req: AuthedRequest, res) => {
  try {
    res.json(await loadDashboard(req.accountId!, req.params.id as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.get("/dashboards/:id/export", async (req: AuthedRequest, res) => {
  try {
    res.json(await exportPdf(req.accountId!, req.params.id as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/dashboards/:id/widgets", async (req: AuthedRequest, res) => {
  try {
    res.json(await addWidget(req.accountId!, req.params.id as string, req.body));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.patch("/widgets/:id", async (req: AuthedRequest, res) => {
  try {
    res.json(await editWidget(req.accountId!, req.params.id as string, req.body));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.delete("/widgets/:id", async (req: AuthedRequest, res) => {
  try {
    await removeWidget(req.accountId!, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.get("/dashboards/:id/widgets", async (req: AuthedRequest, res) => {
  try {
    res.json(await listWidgets(req.accountId!, req.params.id as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/widgets/reorder", async (req: AuthedRequest, res) => {
  try {
    res.json(await reorderWidget(req.accountId!, req.body.order));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.get("/dashboards/:id/analyze", async (req: AuthedRequest, res) => {
  try {
    res.json(await analyzeDashboard(req.accountId!, req.params.id as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

export default router;
