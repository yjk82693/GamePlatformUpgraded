import crypto from "node:crypto";
import { prisma } from "@game-platform/commons";

function signedDeliveryUrl(buildId: string): string {
  // placeholder signing — real implementation would generate a
  // time-limited, signed URL against actual storage (S3, GCS, etc.)
  const token = crypto.randomBytes(16).toString("hex");
  return `https://cdn.example.com/builds/${buildId}?token=${token}`;
}

export async function requestDownload(playerId: string, appId: string) {
  const owns = await prisma.entitlement.findFirst({
    where: { accountId: playerId, product: { appId } },
  });
  if (!owns) throw new Error("Not owned");

  const build = await prisma.build.findFirst({
    where: { appId, published: true },
    orderBy: { id: "desc" },
  });
  if (!build) throw new Error("No published build");

  return {
    url: signedDeliveryUrl(build.id),
    version: build.version,
    checksum: build.checksum,
  };
}

export function verifyChecksum(fileHashHex: string, expectedChecksum: string): boolean {
  return fileHashHex === expectedChecksum;
}

export function launch(appId: string) {
  // opens the runtime — actual execution is client-side (browser/hosted),
  // this is a stub marking the intent to launch
  return { appId, launched: true };
}

export async function checkUpdate(appId: string, installedVersion: string) {
  const build = await prisma.build.findFirst({
    where: { appId, published: true },
    orderBy: { id: "desc" },
  });
  if (!build) return { updateAvailable: false };
  return { updateAvailable: build.version !== installedVersion };
}
