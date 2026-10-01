import { GetCurrentAuthUserResponse } from "@workspace/api-zod";
import { Router, type IRouter, type Request, type Response } from "express";
import * as oidc from "openid-client";
import { isClerkAuthEnabled } from "../lib/authProvider";
import { upsertAuthUser } from "../lib/authUser";
import {
  clearSession,
  createSession,
  getOidcConfig,
  getSessionId,
  ISSUER_URL,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const router: IRouter = Router();
const OIDC_COOKIE_TTL = 10 * 60 * 1000;

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  return `${proto}://${host}`;
}

function safeReturnTo(value: unknown): string {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
    ? value
    : "/";
}

function setCookie(res: Response, name: string, value: string, maxAge: number) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

async function upsertUser(claims: Record<string, unknown>) {
  return upsertAuthUser({
    id: claims.sub as string,
    email: (claims.email as string) || null,
    firstName: (claims.first_name as string) || null,
    lastName: (claims.last_name as string) || null,
    profileImageUrl: (claims.profile_image_url || claims.picture) as
      | string
      | null,
  });
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.get("/login", async (req: Request, res: Response) => {
  if (isClerkAuthEnabled()) {
    const signInUrl = new URL("/sign-in", getOrigin(req));
    signInUrl.searchParams.set(
      "redirect_url",
      safeReturnTo(req.query.returnTo),
    );
    res.redirect(signInUrl.href);
    return;
  }

  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;
  const state = oidc.randomState();
  const nonce = oidc.randomNonce();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

  const redirectTo = oidc.buildAuthorizationUrl(config, {
    redirect_uri: callbackUrl,
    scope: "openid email profile offline_access",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "login consent",
    state,
    nonce,
  });

  setCookie(res, "code_verifier", codeVerifier, OIDC_COOKIE_TTL);
  setCookie(res, "nonce", nonce, OIDC_COOKIE_TTL);
  setCookie(res, "state", state, OIDC_COOKIE_TTL);
  setCookie(
    res,
    "return_to",
    safeReturnTo(req.query.returnTo),
    OIDC_COOKIE_TTL,
  );
  res.redirect(redirectTo.href);
});

router.get("/callback", async (req: Request, res: Response) => {
  if (isClerkAuthEnabled()) {
    res.redirect("/sign-in");
    return;
  }

  const codeVerifier = req.cookies?.code_verifier;
  const expectedState = req.cookies?.state;
  const nonce = req.cookies?.nonce;
  if (!codeVerifier || !expectedState) {
    res.redirect("/api/login");
    return;
  }

  try {
    const currentUrl = new URL(`${getOrigin(req)}${req.originalUrl}`);
    const tokens = await oidc.authorizationCodeGrant(await getOidcConfig(), currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedNonce: nonce,
      expectedState,
      idTokenExpected: true,
    });
    const claims = tokens.claims();
    if (!claims) throw new Error("No claims in ID token");

    const user = await upsertUser(claims as unknown as Record<string, unknown>);
    const now = Math.floor(Date.now() / 1000);
    const session: SessionData = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      },
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
    };

    const sid = await createSession(session);
    res.cookie(SESSION_COOKIE, sid, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL,
    });
    res.clearCookie("code_verifier", { path: "/" });
    res.clearCookie("nonce", { path: "/" });
    res.clearCookie("state", { path: "/" });
    const returnTo = safeReturnTo(req.cookies?.return_to);
    res.clearCookie("return_to", { path: "/" });
    res.redirect(returnTo);
  } catch (error) {
    req.log.warn({ err: error }, "Browser login failed");
    res.redirect("/api/login");
  }
});

router.get("/logout", async (req: Request, res: Response) => {
  if (isClerkAuthEnabled()) {
    const signOutUrl = new URL("/sign-out", getOrigin(req));
    signOutUrl.searchParams.set(
      "redirect_url",
      safeReturnTo(req.query.returnTo),
    );
    res.redirect(signOutUrl.href);
    return;
  }

  const sid = getSessionId(req);
  await clearSession(res, sid);
  const config = await getOidcConfig();
  const returnTo = safeReturnTo(req.query.returnTo);
  const postLogoutRedirectUri = new URL(returnTo, `${getOrigin(req)}/`).href;
  const endSessionUrl = oidc.buildEndSessionUrl(config, {
    client_id: process.env.REPL_ID!,
    post_logout_redirect_uri: postLogoutRedirectUri,
  });
  res.redirect(endSessionUrl.href);
});

export default router;