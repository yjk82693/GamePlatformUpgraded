import { Router } from "express";
import { listAllVersions, addComment, listComments } from "@game-platform/coop";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const workspaceId = (req.query.workspaceId as string) ?? "default";
  res.json(await listAllVersions(workspaceId));
});

router.get("/:documentId/:version/comments", async (req, res) => {
  res.json(await listComments(req.params.documentId as string, Number(req.params.version)));
});

router.post("/:documentId/:version/comments", async (req: AuthedRequest, res) => {
  try {
    const { body, parentId } = req.body;
    res.json(await addComment(req.accountId!, req.params.documentId as string, Number(req.params.version), body, parentId));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
