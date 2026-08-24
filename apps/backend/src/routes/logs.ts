import { Router } from "express";
import { queryLog, exportCsv, viewDlq } from "@game-platform/distributor";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthedRequest, res) => {
  try {
    res.json(await queryLog(req.accountId!, req.query));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.get("/export", async (req: AuthedRequest, res) => {
  try {
    const csv = await exportCsv(req.accountId!, req.query);
    res.type("text/csv").send(csv);
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.get("/dlq", async (req: AuthedRequest, res) => {
  try {
    res.json(await viewDlq(req.accountId!));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

export default router;
