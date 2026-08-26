import { Router } from "express";
import { createStaffThread, sendMessage, listMessages, fetchSince, addParticipant, removeParticipant } from "@game-platform/coop";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/threads", async (req: AuthedRequest, res) => {
  try {
    const { kind, participantIds } = req.body;
    res.json(await createStaffThread(kind, participantIds));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post("/threads/:id/messages", async (req: AuthedRequest, res) => {
  try {
    res.json(await sendMessage(req.params.id as string, req.accountId!, req.body.body));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.get("/threads/:id/messages", async (req: AuthedRequest, res) => {
  const cursor = req.query.cursor as string | undefined;
  res.json(await listMessages(req.params.id as string, cursor ? new Date(cursor) : undefined));
});

router.get("/threads/:id/messages/since/:afterId", async (req: AuthedRequest, res) => {
  res.json(await fetchSince(req.params.id as string, req.params.afterId as string));
});

router.post("/threads/:id/participants", async (req: AuthedRequest, res) => {
  res.json(await addParticipant(req.params.id as string, req.body.accountId));
});

router.delete("/threads/:id/participants/:accountId", async (req: AuthedRequest, res) => {
  await removeParticipant(req.params.id as string, req.params.accountId as string);
  res.status(204).send();
});

export default router;
