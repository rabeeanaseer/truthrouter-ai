import { and, desc, eq, sql } from "drizzle-orm";
import {
  db,
  subscriptionsTable,
  usersTable,
  verdictUsageTable,
} from "@workspace/db";

export const PLAN_LIMITS = {
  free: 10,
  plus: 100,
  unlimited: null,
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

function utcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function monthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function nextMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

function getPeriod(plan: Plan, now: Date) {
  if (plan === "free") {
    return { key: "lifetime", start: "1970-01-01", resetsAt: null };
  }
  const start = monthStart(now);
  return {
    key: utcDate(start).slice(0, 7),
    start: utcDate(start),
    resetsAt: nextMonthStart(now).toISOString(),
  };
}

export async function getPlanForUser(userId: string): Promise<Plan> {
  const [subscription] = await db
    .select({ plan: subscriptionsTable.plan })
    .from(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.userId, userId),
        eq(subscriptionsTable.status, "active"),
      ),
    )
    .orderBy(desc(subscriptionsTable.activatedAt), desc(subscriptionsTable.id))
    .limit(1);

  return subscription?.plan === "plus" || subscription?.plan === "unlimited"
    ? subscription.plan
    : "free";
}

export async function ensureQuotaUser(userId: string): Promise<void> {
  if (!userId.startsWith("anonymous:")) return;

  await db
    .insert(usersTable)
    .values({ id: userId })
    .onConflictDoNothing({ target: usersTable.id });
}

export async function getQuotaStatus(userId: string) {
  const now = new Date();
  const plan = await getPlanForUser(userId);
  const period = getPeriod(plan, now);
  const [usage] = await db
    .select({ used: verdictUsageTable.used })
    .from(verdictUsageTable)
    .where(
      and(
        eq(verdictUsageTable.userId, userId),
        eq(verdictUsageTable.periodKey, period.key),
      ),
    )
    .limit(1);
  const used = usage?.used ?? 0;
  const limit = PLAN_LIMITS[plan];

  return {
    plan,
    used,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - used),
    periodStart: period.start,
    resetsAt: period.resetsAt,
  };
}

export async function reserveVerdict(userId: string): Promise<Plan | null> {
  const plan = await getPlanForUser(userId);
  const limit = PLAN_LIMITS[plan];
  if (limit === null) return plan;

  const period = getPeriod(plan, new Date());
  const [usage] = await db
    .insert(verdictUsageTable)
    .values({
      userId,
      periodKey: period.key,
      used: 1,
    })
    .onConflictDoUpdate({
      target: [verdictUsageTable.userId, verdictUsageTable.periodKey],
      set: {
        used: sql`${verdictUsageTable.used} + 1`,
        updatedAt: new Date(),
      },
      where: sql`${verdictUsageTable.used} < ${limit}`,
    })
    .returning({ used: verdictUsageTable.used });

  return usage ? plan : null;
}

export async function releaseVerdict(userId: string, plan: Plan): Promise<void> {
  if (PLAN_LIMITS[plan] === null) return;
  const period = getPeriod(plan, new Date());
  await db
    .update(verdictUsageTable)
    .set({
      used: sql`GREATEST(${verdictUsageTable.used} - 1, 0)`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(verdictUsageTable.userId, userId),
        eq(verdictUsageTable.periodKey, period.key),
      ),
    );
}