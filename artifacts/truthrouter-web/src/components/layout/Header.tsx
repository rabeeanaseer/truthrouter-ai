import { Link } from 'wouter';
import { useAuth } from '@workspace/replit-auth-web';

export function Header() {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="TruthRouter AI home">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-ink" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7h6l4 10h6"></path><path d="M14 7h6"></path>
            </svg>
          </span>
          <span className="font-display text-[19px] font-extrabold leading-none tracking-tight">
            TruthRouter<span className="text-verdict"> AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-[14px] font-medium text-slate2 md:flex" aria-label="Primary">
          <Link href="/#how" className="transition-colors hover:text-ink">How the verdict works</Link>
          <Link href="/#trending" className="transition-colors hover:text-ink">Trending verdicts</Link>
          <Link href="/pricing" className="transition-colors hover:text-ink">Pricing</Link>
          <Link href="/blog" className="transition-colors hover:text-ink">Blog</Link>
          <Link href="/about" className="transition-colors hover:text-ink">About Us</Link>
        </nav>

        <div className="flex items-center gap-3">
          {!isLoading && isAuthenticated ? (
            <>
              <span className="hidden text-[13px] text-slate2 sm:inline">
                {user?.firstName || user?.email}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-[10px] border border-ink/12 px-3 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:border-verdict/40 hover:text-verdict"
              >
                Log out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => login(window.location.pathname)}
              className="rounded-[10px] border border-ink/12 px-3 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:border-verdict/40 hover:text-verdict"
            >
              Sign in
            </button>
          )}
          <Link href="/#search" className="rounded-[10px] bg-ink px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-verdict">
            Get a verdict
          </Link>
        </div>
      </div>
    </header>
  );
}
