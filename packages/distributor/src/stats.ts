import { prisma, requirePermission } from "@game-platform/commons";
import type { Prisma } from "@game-platform/commons";

export interface MetricQuery {
  metric: string;
  xAxis: string;
  yAxis: string;
  period?: string;
}

export async function getMetric(actorId: string, query: MetricQuery) {
  await requirePermission(actorId, "READ", "ANALYTICS");
  const analytics = await prisma.analytics.findFirst({ where: { name: query.metric } });
  if (!analytics) return { metric: query.metric, values: [] };
  const metrics = await prisma.metric.findMany({ where: { analyticsId: analytics.id } });
  return { metric: query.metric, values: metrics };
}

export async function loadDashboard(actorId: string, dashboardId: string) {
  await requirePermission(actorId, "READ", "ANALYTICS");
  return prisma.widget.findMany({
    where: { dashboardId },
    orderBy: { position: "asc" },
  });
}

export async function exportPdf(actorId: string, dashboardId: string) {
  await requirePermission(actorId, "EXPORT", "ANALYTICS");
  const widgets = await loadDashboard(actorId, dashboardId);
  // real PDF rendering is out of scope here; return the raw data a
  // renderer would consume
  return { dashboardId, widgets };
}

export async function addWidget(
  actorId: string,
  dashboardId: string,
  config: {
    mode: "DEFAULT" | "EXPLORE";
    type: string;
    xAxis: string;
    yAxis: string;
    query: Prisma.InputJsonValue;
  }
) {
  await requirePermission(actorId, "UPDATE", "ANALYTICS");
  const last = await prisma.widget.findFirst({
    where: { dashboardId },
    orderBy: { position: "desc" },
  });
  const position = (last?.position ?? -1) + 1;
  return prisma.widget.create({
    data: {
      dashboardId,
      mode: config.mode,
      type: config.type,
      xAxis: config.mode === "DEFAULT" ? "TIME" : config.xAxis,
      yAxis: config.yAxis,
      query: config.query,
      position,
    },
  });
}

export async function editWidget(
  actorId: string,
  widgetId: string,
  config: Partial<{ type: string; xAxis: string; yAxis: string; query: Prisma.InputJsonValue }>
) {
  await requirePermission(actorId, "UPDATE", "ANALYTICS");
  return prisma.widget.update({ where: { id: widgetId }, data: config });
}

export async function removeWidget(actorId: string, widgetId: string) {
  await requirePermission(actorId, "UPDATE", "ANALYTICS");
  const widget = await prisma.widget.findUnique({ where: { id: widgetId } });
  if (!widget) return;
  await prisma.widget.delete({ where: { id: widgetId } });
  const remaining = await prisma.widget.findMany({
    where: { dashboardId: widget.dashboardId },
    orderBy: { position: "asc" },
  });
  await Promise.all(
    remaining.map((w, i) => prisma.widget.update({ where: { id: w.id }, data: { position: i } }))
  );
}

export async function listWidgets(actorId: string, dashboardId: string) {
  await requirePermission(actorId, "READ", "ANALYTICS");
  return prisma.widget.findMany({ where: { dashboardId }, orderBy: { position: "asc" } });
}

export async function reorderWidget(actorId: string, order: { widgetId: string; position: number }[]) {
  await requirePermission(actorId, "UPDATE", "ANALYTICS");
  await Promise.all(
    order.map((o) => prisma.widget.update({ where: { id: o.widgetId }, data: { position: o.position } }))
  );
}

export async function analyzeDashboard(actorId: string, dashboardId: string) {
  await requirePermission(actorId, "READ", "ANALYTICS");
  const widgets = await loadDashboard(actorId, dashboardId);
  // this is the hook where Phase 2's AI coordinator would call an LLM to
  // narrate the widget data in plain language; grounded strictly in the
  // real aggregates returned above, no fabricated numbers. Left as a
  // structural stub here since Phase 2 hasn't been built yet.
  return {
    dashboardId,
    widgetCount: widgets.length,
    narrative: null,
  };
}
