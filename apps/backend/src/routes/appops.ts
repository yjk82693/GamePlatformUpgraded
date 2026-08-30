import { Router } from "express";
import { publishBuild, maintenanceMode, authorNotice, configureLiveEvent, createBuild, listBuildsForApp } from "@game-platform/distributor";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/builds/app/:appId", async (req: AuthedRequest, res) => {
  try {
    res.json(await listBuildsForApp(req.accountId!, req.params.appId as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/builds", async (req: AuthedRequest, res) => {
  try {
    const { appId, version, checksum } = req.body;
    res.json(await createBuild(req.accountId!, appId, version, checksum));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/builds/:id/publish", async (req: AuthedRequest, res) => {
  try {
    res.json(await publishBuild(req.accountId!, req.params.id as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/apps/:id/maintenance", async (req: AuthedRequest, res) => {
  try {
    res.json(await maintenanceMode(req.accountId!, req.params.id as string, req.body.on));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/apps/:id/notices", async (req: AuthedRequest, res) => {
  try {
    const { content, audience, schedule } = req.body;
    res.json(await authorNotice(req.accountId!, req.params.id as string, content, audience, schedule ? new Date(schedule) : undefined));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/apps/:id/live-events", async (req: AuthedRequest, res) => {
  try {
    const { config, startsAt, endsAt } = req.body;
    res.json(await configureLiveEvent(req.accountId!, req.params.id as string, config, new Date(startsAt), new Date(endsAt)));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

export default router;
