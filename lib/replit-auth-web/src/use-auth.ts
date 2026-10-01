import { useCallback, useEffect, useState } from "react";
import type { AuthUser } from "@workspace/api-client-react";
export type { AuthUser };

export const AUTH_USER_UPDATED_EVENT = "truthrouter:auth-user-updated";
const AUTH_PROVIDER = import.meta.env.VITE_AUTH_PROVIDER;
const CLERK_AUTH_ENABLED = AUTH_PROVIDER === "clerk";

let clerkAuthUser: AuthUser | null = null;
let clerkAuthLoaded = false;

export function publishClerkAuthUser(user: AuthUser | null): void {
  clerkAuthUser = user;
  clerkAuthLoaded = true;
  window.dispatchEvent(
    new CustomEvent(AUTH_USER_UPDATED_EVENT, { detail: clerkAuthUser }),
  );
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (returnTo?: string) => void;
  logout: () => void;
}

function getBasePath() {
  return window.location.pathname || "/";
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(() =>
    CLERK_AUTH_ENABLED ? clerkAuthUser : null,
  );
  const [isLoading, setIsLoading] = useState(
    !CLERK_AUTH_ENABLED || !clerkAuthLoaded,
  );

  useEffect(() => {
    if (CLERK_AUTH_ENABLED) {
      const handleClerkUserUpdate = (event: Event) => {
        const detail = (event as CustomEvent<AuthUser | null>).detail;
        setUser(detail ?? null);
        setIsLoading(false);
      };

      window.addEventListener(AUTH_USER_UPDATED_EVENT, handleClerkUserUpdate);
      if (clerkAuthLoaded) {
        setUser(clerkAuthUser);
        setIsLoading(false);
      }
      return () => {
        window.removeEventListener(
          AUTH_USER_UPDATED_EVENT,
          handleClerkUserUpdate,
        );
      };
    }

    let cancelled = false;
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as { user: AuthUser | null };
        if (!cancelled) setUser(data.user ?? null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((returnTo?: string) => {
    if (CLERK_AUTH_ENABLED) {
      const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
      const signInUrl = new URL(
        `${basePath}/sign-in`,
        window.location.origin,
      );
      signInUrl.searchParams.set("redirect_url", returnTo ?? getBasePath());
      window.location.href = signInUrl.href;
      return;
    }

    window.location.href = `/api/login?returnTo=${encodeURIComponent(returnTo ?? getBasePath())}`;
  }, []);

  const logout = useCallback(() => {
    if (CLERK_AUTH_ENABLED) {
      const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
      const signOutUrl = new URL(
        `${basePath}/sign-out`,
        window.location.origin,
      );
      signOutUrl.searchParams.set("redirect_url", getBasePath());
      window.location.href = signOutUrl.href;
      return;
    }

    window.location.href = `/api/logout?returnTo=${encodeURIComponent(getBasePath())}`;
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}