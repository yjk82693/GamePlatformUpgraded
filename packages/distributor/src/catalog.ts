import { prisma, requirePermission } from "@game-platform/commons";

export async function createProduct(
  actorId: string,
  data: { appId: string; name: string; priceCents?: number; priceCoins?: number; categoryId?: string }
) {
  await requirePermission(actorId, "CREATE", "PRODUCT");
  return prisma.product.create({
    data: { ...data, enabled: false },
  });
}

export async function updateProduct(
  actorId: string,
  productId: string,
  data: { name?: string; priceCents?: number; priceCoins?: number; categoryId?: string }
) {
  await requirePermission(actorId, "UPDATE", "PRODUCT");
  return prisma.product.update({ where: { id: productId }, data });
}

export async function deleteProduct(actorId: string, productId: string) {
  await requirePermission(actorId, "DELETE", "PRODUCT");
  const owned = await prisma.entitlement.findFirst({ where: { productId } });
  if (owned) {
    return prisma.product.update({ where: { id: productId }, data: { enabled: false } });
  }
  return prisma.product.delete({ where: { id: productId } });
}

export async function enableItem(actorId: string, productId: string) {
  await requirePermission(actorId, "UPDATE", "PRODUCT");
  return prisma.product.update({ where: { id: productId }, data: { enabled: true } });
}

export async function disableItem(actorId: string, productId: string) {
  await requirePermission(actorId, "UPDATE", "PRODUCT");
  return prisma.product.update({ where: { id: productId }, data: { enabled: false } });
}

export async function manageCategory(actorId: string, data: { id?: string; name: string }) {
  await requirePermission(actorId, "UPDATE", "CATEGORY");
  if (data.id) {
    return prisma.category.update({ where: { id: data.id }, data: { name: data.name } });
  }
  return prisma.category.create({ data: { name: data.name } });
}

export async function listProductsForApp(actorId: string, appId: string) {
  await requirePermission(actorId, "READ", "PRODUCT");
  return prisma.product.findMany({
    where: { appId },
    orderBy: { name: "asc" },
  });
}
