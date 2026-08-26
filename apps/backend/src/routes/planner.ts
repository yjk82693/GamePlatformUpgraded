import { Router } from "express";
import { createEvent, updateEvent, deleteEvent, listEvents, suggestSlot, remindersOnLoad } from "@game-platform/coop";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/events", async (req: AuthedRequest, res) => {
  try {
    const { scope, title, start, end } = req.body;
    res.json(await createEvent(req.accountId!, scope, title, new Date(start), new Date(end)));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.patch("/events/:id", async (req: AuthedRequest, res) => {
  try {
    const fields = { ...req.body };
    if (fields.start) fields.start = new Date(fields.start);
    if (fields.end) fields.end = new Date(fields.end);
    res.json(await updateEvent(req.accountId!, req.params.id as string, fields));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.delete("/events/:id", async (req: AuthedRequest, res) => {
  try {
    await deleteEvent(req.accountId!, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.get("/events", async (req: AuthedRequest, res) => {
  const start = new Date(req.query.start as string);
  const end = new Date(req.query.end as string);
  res.json(await listEvents(req.accountId!, { start, end }));
});

router.get("/suggest-slot", async (req: AuthedRequest, res) => {
  const priority = req.query.priority as "LOW" | "MEDIUM" | "HIGH";
  const duration = Number(req.query.durationMinutes);
  res.json(await suggestSlot(priority, duration));
});

router.get("/reminders", async (req: AuthedRequest, res) => {
  res.json(await remindersOnLoad(req.accountId!));
});

export default router;
