import type { Action, Target } from "@game-platform/commons";

export interface CatalogEntry {
  operation: string;
  action: Action;
  targetType: Target;
  description: string;
}

// The whitelist of operations the AI coordinator is ever permitted to
// propose. "operation" is the real dispatch key (matched 1:1 against
// dispatch.ts). action/targetType are only for the audit record on
// HeldCall and are NOT guaranteed unique on their own — several
// operations legitimately share the same permission action+targetType
// (e.g. all three ticket operations below are UPDATE:SETTING), which is
// exactly why dispatch keys on operation, never on (action, targetType).
export const AI_FUNCTION_CATALOG: CatalogEntry[] = [
  { operation: "product.create", action: "CREATE", targetType: "PRODUCT", description: "Propose creating a new in-game product" },
  { operation: "product.update", action: "UPDATE", targetType: "PRODUCT", description: "Propose updating an existing product" },
  { operation: "product.delete", action: "DELETE", targetType: "PRODUCT", description: "Propose removing a product" },
  { operation: "notice.create", action: "CREATE", targetType: "NOTIFICATION_SETTING", description: "Propose an author notice to players" },
  { operation: "app.maintenance", action: "UPDATE", targetType: "APP", description: "Propose toggling maintenance mode for a game" },
  { operation: "transaction.refund_request", action: "REFUND", targetType: "TRANSACTION", description: "Propose requesting a refund for a transaction (a separate human still approves the refund itself)" },
  { operation: "ticket.claim", action: "UPDATE", targetType: "SETTING", description: "Propose claiming a support ticket" },
  { operation: "ticket.reply", action: "UPDATE", targetType: "SETTING", description: "Propose replying to a support ticket" },
  { operation: "ticket.solve", action: "UPDATE", targetType: "SETTING", description: "Propose marking a support ticket solved" },
];

export function getCatalogEntry(operation: string): CatalogEntry | undefined {
  return AI_FUNCTION_CATALOG.find((e) => e.operation === operation);
}
