import { Router } from "express";
import {
  viewProfile, editProfile, setVisibility, regenerateFriendCode,
  viewSoloGallery, exportSoloGallery,
} from "@game-platform/player";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/:id", async (req: AuthedRequest, res) => {
  try {
    res.json(await viewProfile(req.accountId!, (req.params.id as string)));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.patch("/", async (req: AuthedRequest, res) => {
  res.json(await editProfile(req.accountId!, req.body));
});

router.patch("/visibility", async (req: AuthedRequest, res) => {
  res.json(await setVisibility(req.accountId!, req.body.level));
});

router.post("/friend-code/regenerate", async (req: AuthedRequest, res) => {
  res.json(await regenerateFriendCode(req.accountId!));
});

router.get("/:id/solo-gallery", async (req, res) => {
  const appId = req.query.appId as string | undefined;
  res.json(await viewSoloGallery((req.params.id as string), appId));
});

router.get("/solo-gallery/export", async (req: AuthedRequest, res) => {
  const appId = req.query.appId as string | undefined;
  res.json(await exportSoloGallery(req.accountId!, appId));
});

export default router;
