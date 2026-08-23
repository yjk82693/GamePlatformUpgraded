import { Router } from "express";
import {
  addFriend, acceptFriend, rejectFriend, cancelRequest,
  removeFriend, listFriends, sendDm,
} from "@game-platform/player";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/friends", async (req: AuthedRequest, res) => {
  try {
    res.json(await addFriend(req.accountId!, req.body.friendCode));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post("/friends/:id/accept", async (req: AuthedRequest, res) => {
  try {
    res.json(await acceptFriend(req.accountId!, (req.params.id as string)));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post("/friends/:id/reject", async (req: AuthedRequest, res) => {
  try {
    await rejectFriend(req.accountId!, (req.params.id as string));
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post("/friends/:id/cancel", async (req: AuthedRequest, res) => {
  try {
    await cancelRequest(req.accountId!, (req.params.id as string));
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.delete("/friends/:id", async (req: AuthedRequest, res) => {
  await removeFriend(req.accountId!, (req.params.id as string));
  res.status(204).send();
});

router.get("/friends", async (req: AuthedRequest, res) => {
  res.json(await listFriends(req.accountId!));
});

router.post("/messages", async (req: AuthedRequest, res) => {
  try {
    const { friendId, body } = req.body;
    res.json(await sendDm(req.accountId!, friendId, body));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
