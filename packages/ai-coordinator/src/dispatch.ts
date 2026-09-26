import {
  createProduct,
  updateProduct,
  deleteProduct,
  authorNotice,
  maintenanceMode,
  issueRefund,
  claimTicket,
  replyTicket,
  markSolved,
} from "@game-platform/distributor";

type Dispatcher = (actorId: string, targetId: string, payload: any) => Promise<unknown>;

const DISPATCH_TABLE: Record<string, Dispatcher> = {
  "product.create": (actorId, targetId, payload) =>
    createProduct(actorId, { appId: targetId, ...payload }),

  "product.update": (actorId, targetId, payload) =>
    updateProduct(actorId, targetId, payload),

  "product.delete": (actorId, targetId) =>
    deleteProduct(actorId, targetId),

  "notice.create": (actorId, targetId, payload) =>
    authorNotice(actorId, targetId, payload.content, payload.audience, payload.schedule),

  "app.maintenance": (actorId, targetId, payload) =>
    maintenanceMode(actorId, targetId, payload.on),

  "transaction.refund_request": (actorId, targetId) =>
    issueRefund(actorId, targetId),

  "ticket.claim": (actorId, targetId) =>
    claimTicket(actorId, targetId),

  "ticket.reply": (actorId, targetId, payload) =>
    replyTicket(actorId, targetId, payload.body),

  "ticket.solve": (actorId, targetId) =>
    markSolved(actorId, targetId),
};

export function getDispatcher(operation: string): Dispatcher | undefined {
  return DISPATCH_TABLE[operation];
}
