import type { AuthUser } from "@workspace/api-zod";
import { type NextFunction, type Request, type Response } from "express";
import * as oidc from "openid-client";
import { clerkClient, getAuth } from "@clerk/express";
import { isClerkAuthEnabled } from "../lib/authProvider";
import { upsertAuthUser } from "../lib/authUser";
import {
  clearSession,
  getOidcConfig,
  getSession,
  getSessionId,
  updateSession,
  type SessionData,
} from "../lib/auth";

declare global {
  namespace Express {
    interface User extends AuthUser {}
    interface Request {
      isAuthenticated(): this is AuthedRequest;
      user?: User | undefined;
    }
    interface AuthedRequest {
      user: User;
    }
  }
}

async function refreshIfExpired(
  sid: string,
  session: SessionData,
): Promise<SessionData | null> {
  const now = Math.floor(Date.now() / 1000);
  if (!session.expires_at || now <= session.expires_at) return session;
  if (!session.refresh_token) return null;

  try {
    const tokens = await oidc.refreshTokenGrant(
      await getOidcConfig(),
      session.refresh_token,
    );
    session.access_token = tokens.access_token;
    session.refresh_token = tokens.refresh_token ?? session.refresh_token;
    session.expires_at = tokens.expiresIn()
      ? now + tokens.expiresIn()!
      : session.expires_at;
    await updateSession(sid, session);
    return session;
  } catch {
    return null;
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request["isAuthenticated"];

  if (isClerkAuthEnabled()) {
    const { userId } = getAuth(req);
    if (!userId) {
      next();
      return;
    }

    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      req.user = await upsertAuthUser({
        id: clerkUser.id,
        email:
          clerkUser.primaryEmailAddress?.emailAddress ??
          clerkUser.emailAddresses[0]?.emailAddress ??
          null,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        profileImageUrl: clerkUser.imageUrl,
      });
    } catch (error) {
      req.log.error({ err: error, userId }, "Failed to load Clerk user");
      res.status(503).json({
        error: "Your account could not be loaded. Please try again.",
        code: "AUTH_PROFILE_UNAVAILABLE",
      });
      return;
    }

    next();
    return;
  }

  const sid = getSessionId(req);
  if (!sid) {
    next();
    return;
  }

  const session = await getSession(sid);
  if (!session?.user?.id) {
    await clearSession(res, sid);
    next();
    return;
  }

  const refreshed = await refreshIfExpired(sid, session);
  if (!refreshed) {
    await clearSession(res, sid);
    next();
    return;
  }

  req.user = refreshed.user;
  next();
}