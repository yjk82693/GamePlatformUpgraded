import { Router } from "express";
import { createDocument, listDocuments, openDocument, saveDocument, shareDocument, listVersions, requestRollback, approveRollback } from "@game-platform/coop";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/documents", async (req: AuthedRequest, res) => {
  try {
    const { workspaceId, path, blobRef } = req.body;
    res.json(await createDocument(req.accountId!, workspaceId, path, blobRef));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.get("/documents", async (req: AuthedRequest, res) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    const path = req.query.path as string | undefined;
    res.json(await listDocuments(req.accountId!, workspaceId, path));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.get("/documents/:id", async (req: AuthedRequest, res) => {
  try {
    res.json(await openDocument(req.accountId!, req.params.id as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/documents/:id/save", async (req: AuthedRequest, res) => {
  try {
    res.json(await saveDocument(req.accountId!, req.params.id as string, req.body.blobRef));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/documents/:id/share", async (req: AuthedRequest, res) => {
  try {
    const { memberId, access } = req.body;
    res.json(await shareDocument(req.accountId!, req.params.id as string, memberId, access));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.get("/documents/:id/versions", async (req: AuthedRequest, res) => {
  res.json(await listVersions(req.params.id as string));
});

router.post("/documents/:id/rollback", async (req: AuthedRequest, res) => {
  try {
    res.json(await requestRollback(req.accountId!, req.params.id as string, req.body.targetVersion));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/rollback/:requestId/approve", async (req: AuthedRequest, res) => {
  try {
    res.json(await approveRollback(req.accountId!, req.params.requestId as string));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
