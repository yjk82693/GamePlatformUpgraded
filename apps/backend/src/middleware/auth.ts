import type { Request, Response, NextFunction } from "express";
import { validateSession } from "@game-platform/commons";

export interface AuthedRequest extends Request {
  accountId?: string;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing token" });
    return;
  }
  const token = header.slice(7);
  try {
    req.accountId = await validateSession(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}
