import { prisma, requirePermission, getMyOrgId, logAction } from "@game-platform/commons";

export async function createProduct(
  actorId: string,
  data: { appId: string; name: string; priceCents?: number; priceCoins?: number; categoryId?: string }
) {
  await requirePermission(actorId, "CREATE", "PRODUCT");
  const product = await prisma.product.create({
    data: { ...data, enabled: false },
  });
  await logAction(actorId, "CREATE", "PRODUCT", product.id, data, true);
  return product;
}

export async function updateProduct(
  actorId: string,
  productId: string,
  data: { name?: string; priceCents?: number; priceCoins?: number; categoryId?: string }
) {
  await requirePermission(actorId, "UPDATE", "PRODUCT");
  const product = await prisma.product.update({ where: { id: productId }, data });
  await logAction(actorId, "UPDATE", "PRODUCT", productId, data, true);
  return product;
}

export async function deleteProduct(actorId: string, productId: string) {
  await requirePermission(actorId, "DELETE", "PRODUCT");
  const owned = await prisma.entitlement.findFirst({ where: { productId } });
  let result;
  if (owned) {
    result = await prisma.product.update({ where: { id: productId }, data: { enabled: false } });
  } else {
    result = await prisma.product.delete({ where: { id: productId } });
  }
  await logAction(actorId, "DELETE", "PRODUCT", productId, undefined, true);
  return result;
}

export async function enableItem(actorId: string, productId: string) {
  await requirePermission(actorId, "UPDATE", "PRODUCT");
  const product = await prisma.product.update({ where: { id: productId }, data: { enabled: true } });
  await logAction(actorId, "UPDATE", "PRODUCT", productId, { enabled: true }, true);
  return product;
}

export async function disableItem(actorId: string, productId: string) {
  await requirePermission(actorId, "UPDATE", "PRODUCT");
  const product = await prisma.product.update({ where: { id: productId }, data: { enabled: false } });
  await logAction(actorId, "UPDATE", "PRODUCT", productId, { enabled: false }, true);
  return product;
}

export async function manageCategory(actorId: string, data: { id?: string; name: string }) {
  await requirePermission(actorId, "UPDATE", "CATEGORY");
  let category;
  if (data.id) {
    category = await prisma.category.update({ where: { id: data.id }, data: { name: data.name } });
  } else {
    category = await prisma.category.create({ data: { name: data.name } });
  }
  await logAction(actorId, "UPDATE", "CATEGORY", category.id, data, true);
  return category;
}

export async function listProductsForApp(actorId: string, appId: string) {
  await requirePermission(actorId, "READ", "PRODUCT");
  return prisma.product.findMany({
    where: { appId },
    orderBy: { name: "asc" },
  });
}

export async function listAppsForOrg(actorId: string) {
  const myOrgId = await getMyOrgId(actorId);
  await requirePermission(actorId, "READ", "PRODUCT", myOrgId ?? undefined);
  return prisma.app.findMany({
    where: { ...(myOrgId ? { ownerOrgId: myOrgId } : {}) },
    orderBy: { name: "asc" },
  });
}
