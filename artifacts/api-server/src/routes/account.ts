import { ActivateUserPlanBody, GetAccountQuotaResponse } from "@workspace/api-zod";
import { db, subscriptionsTable, usersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { getQuotaStatus } from "../lib/quota";

const router: IRouter = Router();

function isAdministrator(user: Express.User): boolean {
  const ids = new Set(
    (process.env.ADMIN_USER_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  const emails = new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
  return (
    ids.has(user.id) ||
    (user.email ? emails.has(user.email.toLowerCase()) : false)
  );
}

router.get("/account/quota", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({
      error: "Sign in to view your review allowance.",
      code: "AUTH_REQUIRED",
    });
    return;
  }

  res.json(GetAccountQuotaResponse.parse(await getQuotaStatus(req.user.id)));
});

router.post("/admin/users/:userId/plan", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({
      error: "Sign in required.",
      code: "AUTH_REQUIRED",
    });
    return;
  }
  if (!isAdministrator(req.user)) {
    res.status(403).json({
      error: "Administrator access required.",
      code: "ADMIN_REQUIRED",
    });
    return;
  }

  const parsed = ActivateUserPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Choose Plus or Unlimited.",
      code: "INVALID_PLAN",
    });
    return;
  }

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, req.params.userId))
    .limit(1);
  if (!user) {
    res.status(404).json({
      error: "User account not found.",
      code: "USER_NOT_FOUND",
    });
    return;
  }

  const now = new Date();
  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  )
    .toISOString()
    .slice(0, 10);

  await db
    .update(subscriptionsTable)
    .set({ status: "inactive" })
    .where(
      and(
        eq(subscriptionsTable.userId, user.id),
        eq(subscriptionsTable.status, "active"),
      ),
    );
  await db.insert(subscriptionsTable).values({
    userId: user.id,
    plan: parsed.data.plan,
    status: "active",
    currentPeriodStart: periodStart,
    notes: "Activated after WhatsApp subscription confirmation.",
  });

  res.json(GetAccountQuotaResponse.parse(await getQuotaStatus(user.id)));
});

export default router;