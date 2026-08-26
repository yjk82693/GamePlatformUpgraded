import { Router } from "express";
import { addTask, assignTask, setPriority, completeTask, listTasks } from "@game-platform/coop";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/", async (req: AuthedRequest, res) => {
  try {
    const { scope, title, priority, due } = req.body;
    res.json(await addTask(req.accountId!, scope, title, priority, due ? new Date(due) : undefined));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/:id/assign", async (req: AuthedRequest, res) => {
  try {
    res.json(await assignTask(req.accountId!, req.params.id as string, req.body.assigneeId));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.patch("/:id/priority", async (req: AuthedRequest, res) => {
  res.json(await setPriority(req.accountId!, req.params.id as string, req.body.priority));
});

router.post("/:id/complete", async (req: AuthedRequest, res) => {
  try {
    res.json(await completeTask(req.accountId!, req.params.id as string));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get("/", async (req: AuthedRequest, res) => {
  const scope = req.query.scope as string;
  const assigneeId = req.query.assigneeId as string | undefined;
  res.json(await listTasks(scope, assigneeId ? { assigneeId } : undefined));
});

export default router;
