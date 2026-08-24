import { Router } from "express";
import { inviteMember, grantRole, revokeRole, resetMemberPassword, sanctionMember, unsanctionMember, kickMember } from "@game-platform/distributor";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/invite", async (req: AuthedRequest, res) => {
  try {
    const { email, scope } = req.body;
    res.json(await inviteMember(req.accountId!, email, scope));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/:memberId/roles/:roleId", async (req: AuthedRequest, res) => {
  try {
    res.json(await grantRole(req.accountId!, req.params.memberId as string, req.params.roleId as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.delete("/:memberId/roles/:roleId", async (req: AuthedRequest, res) => {
  try {
    await revokeRole(req.accountId!, req.params.memberId as string, req.params.roleId as string);
    res.status(204).send();
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/:accountId/reset-password", async (req: AuthedRequest, res) => {
  try {
    res.json(await resetMemberPassword(req.accountId!, req.params.accountId as string));
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/:accountId/suspend", async (req: AuthedRequest, res) => {
  try {
    await sanctionMember(req.accountId!, req.params.accountId as string);
    res.status(204).send();
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/:accountId/unsuspend", async (req: AuthedRequest, res) => {
  try {
    await unsanctionMember(req.accountId!, req.params.accountId as string);
    res.status(204).send();
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

router.post("/:accountId/kick", async (req: AuthedRequest, res) => {
  try {
    await kickMember(req.accountId!, req.params.accountId as string, req.body.appId);
    res.status(204).send();
  } catch (err) {
    res.status(403).json({ error: (err as Error).message });
  }
});

export default router;
