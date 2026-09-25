import type { Action, Target } from "@game-platform/commons";
import { createProduct, updateProduct, authorNotice } from "@game-platform/distributor";

// The dispatch table is the other half of the safety boundary: even an
// APPROVED HeldCall can only ever trigger a function explicitly wired up
// here. Adding a new catalog entry (catalog.ts) does nothing until a
// matching dispatcher is registered below.
type Dispatcher = (actorId: string, targetId: string, payload: any) => Promise<unknown>;

const DISPATCH_TABLE: Record<string, Dispatcher> = {
  "CREATE:PRODUCT": (actorId, targetId, payload) =>
    createProduct(actorId, { appId: targetId, ...payload }),

  "UPDATE:PRODUCT": (actorId, targetId, payload) =>
    updateProduct(actorId, targetId, payload),

  "CREATE:NOTIFICATION_SETTING": (actorId, targetId, payload) =>
    authorNotice(actorId, targetId, payload.content, payload.audience, payload.schedule),
};

export function getDispatcher(action: Action, targetType: Target): Dispatcher | undefined {
  return DISPATCH_TABLE[`${action}:${targetType}`];
}
