import { PrismaClient } from "./generated/prisma/index.js";

export { PrismaClient };
export * from "./generated/prisma/index.js";

export const prisma = new PrismaClient();
