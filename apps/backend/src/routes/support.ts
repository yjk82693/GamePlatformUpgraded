import { Router } from "express";
import { createTicket, listTickets, viewTicket, replyTicket } from "@game-platform/player";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/", async (req: AuthedRequest, res) => {
  try {
    const { appId, subject, body } = req.body;
    res.json(await createTicket(req.accountId!, appId, subject, body));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get("/", async (req: AuthedRequest, res) => {
  res.json(await listTickets(req.accountId!));
});

router.get("/:id", async (req: AuthedRequest, res) => {
  try {
    res.json(await viewTicket(req.accountId!, (req.params.id as string)));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/:id/reply", async (req: AuthedRequest, res) => {
  try {
    res.json(await replyTicket(req.accountId!, (req.params.id as string), req.body.body));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

export default router;
