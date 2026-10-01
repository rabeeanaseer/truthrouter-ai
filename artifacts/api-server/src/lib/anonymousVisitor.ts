import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";

const COOKIE_NAME = "tr_free_visitor";
const COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
const VISITOR_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function secret(): string {
  const configuredSecret = process.env.SESSION_SECRET;
  if (
    (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") &&
    !configuredSecret
  ) {
    throw new Error("SESSION_SECRET must be set in deployed environments.");
  }
  return configuredSecret || "truthrouter-development-session-secret";
}

function signature(visitorId: string): string {
  return createHmac("sha256", secret()).update(visitorId).digest("base64url");
}

function validToken(token: unknown): string | null {
  if (typeof token !== "string") return null;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;

  const visitorId = token.slice(0, separator);
  const received = token.slice(separator + 1);
  if (!VISITOR_ID_PATTERN.test(visitorId)) return null;

  const expected = signature(visitorId);
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    return null;
  }

  return visitorId;
}

export function getAnonymousQuotaUserId(req: Request, res: Response): string {
  let visitorId = validToken(req.cookies?.[COOKIE_NAME]);

  if (!visitorId) {
    visitorId = randomUUID();
    res.cookie(COOKIE_NAME, `${visitorId}.${signature(visitorId)}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE_MS,
    });
  }

  return `anonymous:${visitorId}`;
}