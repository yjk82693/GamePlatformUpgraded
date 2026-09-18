import type { Action, Target } from "@game-platform/commons";

// The whitelist of (action, targetType) pairs the AI coordinator is ever
// permitted to propose. This is the entire safety boundary of the
// delegated-proposer pattern: the AI cannot call any mutating function
// directly, and it cannot even propose an action outside this list.
export const AI_FUNCTION_CATALOG: { action: Action; targetType: Target; description: string }[] = [
  { action: "CREATE", targetType: "PRODUCT", description: "Propose creating a new in-game product" },
  { action: "UPDATE", targetType: "PRODUCT", description: "Propose updating an existing product" },
  { action: "CREATE", targetType: "NOTIFICATION_SETTING", description: "Propose an author notice to players" },
];

export function isActionAllowed(action: Action, targetType: Target): boolean {
  return AI_FUNCTION_CATALOG.some((entry) => entry.action === action && entry.targetType === targetType);
}
