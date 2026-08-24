import { Router } from "express";
import { listTickets, claimTicket, replyTicket, markSolved } from "@game-platform/distributor";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthedRequest, res) => {
  try {
    const status = req.query.status as "OPEN" | "SOLVED" | undefined;
    res.json(await listTickets(req.accountId!, status ? { status } : undefined));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/:id/claim", async (req: AuthedRequest, res) => {
  try {
    res.json(await claimTicket(req.accountId!, req.params.id as string));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post("/:id/reply", async (req: AuthedRequest, res) => {
  try {
    res.json(await replyTicket(req.accountId!, req.params.id as string, req.body.body));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/:id/solve", async (req: AuthedRequest, res) => {
  try {
    res.json(await markSolved(req.accountId!, req.params.id as string));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
