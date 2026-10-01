import { type ReactNode, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { publishClerkAuthUser } from '@workspace/replit-auth-web';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Route,
  Switch,
  useLocation,
  useSearch,
  Router as WouterRouter,
} from 'wouter';

import { PageShell } from '@/components/layout/PageShell';
import { ScrollManager } from '@/components/ScrollManager';
import Home from '@/pages/home';
import Review from '@/pages/review';
import About from '@/pages/about';
import EditorialIndependence from '@/pages/editorial-independence';
import SourcingStandards from '@/pages/sourcing-standards';
import ReportAVerdict from '@/pages/report-a-verdict';
import Careers from '@/pages/careers';
import Press from '@/pages/press';
import Privacy from '@/pages/privacy';
import Terms from '@/pages/terms';
import BlogIndex from '@/pages/blog';
import BlogPost from '@/pages/blog-post';
import Pricing from '@/pages/pricing';
import Account from '@/pages/account';
import NotFound from '@/pages/not-found';

const externalClerkAuth = import.meta.env.VITE_AUTH_PROVIDER === 'clerk';
if (externalClerkAuth && !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    'Set VITE_CLERK_PUBLISHABLE_KEY from your own Clerk application for Clerk auth.',
  );
}
const clerkPubKey = externalClerkAuth
  ? import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!
  : publishableKeyFromHost(
      window.location.hostname,
      import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
    );
const clerkProxyUrl = externalClerkAuth
  ? undefined
  : import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#1B39FF',
    colorForeground: '#0E1420',
    colorMutedForeground: '#5A6678',
    colorDanger: '#B45309',
    colorBackground: '#FFFFFF',
    colorInput: '#F1F3F8',
    colorInputForeground: '#0E1420',
    colorNeutral: '#D8DDE7',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'font-display text-ink',
    headerSubtitle: 'text-slate2',
    socialButtonsBlockButtonText: 'text-ink',
    formFieldLabel: 'text-ink',
    footerActionLink: 'text-verdict',
    footerActionText: 'text-slate2',
    dividerText: 'text-slate2',
    alertText: 'text-pitfall',
    logoBox: 'h-12',
    logoImage: 'h-12 w-12 rounded-xl',
    socialButtonsBlockButton: 'border-ink/15 bg-white hover:bg-surface',
    formButtonPrimary: 'bg-ink hover:bg-verdict',
    formFieldInput: 'border-ink/15 bg-surface text-ink',
    footerAction: 'text-slate2',
    dividerLine: 'bg-ink/10',
    alert: 'border-pitfall/20 bg-pitfall/5',
    otpCodeFieldInput: 'border-ink/15 bg-surface text-ink',
    formFieldRow: 'text-ink',
    main: 'bg-white',
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function SignInPage() {
  const redirectUrl = getSafeRedirectUrl(useSearch());

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface px-4 py-10">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up${getRedirectQuery(redirectUrl)}`}
        forceRedirectUrl={redirectUrl}
      />
    </div>
  );
}

function SignUpPage() {
  const redirectUrl = getSafeRedirectUrl(useSearch());

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface px-4 py-10">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in${getRedirectQuery(redirectUrl)}`}
        forceRedirectUrl={redirectUrl}
      />
    </div>
  );
}

function getSafeRedirectUrl(searchString: string): string | undefined {
  const candidate = new URLSearchParams(searchString).get('redirect_url');
  return candidate?.startsWith('/') && !candidate.startsWith('//')
    ? candidate
    : undefined;
}

function getRedirectQuery(redirectUrl: string | undefined): string {
  return redirectUrl ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : '';
}

function SignOutPage() {
  const { signOut } = useClerk();
  const redirectUrl =
    getSafeRedirectUrl(useSearch()) ?? (basePath || '/');

  useEffect(() => {
    void signOut({ redirectUrl });
  }, [redirectUrl, signOut]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface px-4 py-10">
      <p role="status" className="text-[15px] font-medium text-slate2">
        Signing out…
      </p>
    </div>
  );
}

function SiteRouter() {
  return (
    <RoutedErrorBoundary>
      <PageShell>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/review" component={Review} />
          <Route path="/about" component={About} />
          <Route path="/editorial-independence" component={EditorialIndependence} />
          <Route path="/sourcing-standards" component={SourcingStandards} />
          <Route path="/report-a-verdict" component={ReportAVerdict} />
          <Route path="/careers" component={Careers} />
          <Route path="/press" component={Press} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/blog" component={BlogIndex} />
          <Route path="/blog/:slug" component={BlogPost} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/account" component={Account} />
          <Route component={NotFound} />
        </Switch>
      </PageShell>
    </RoutedErrorBoundary>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route
        path="/sign-out/*?"
        component={externalClerkAuth ? SignOutPage : NotFound}
      />
      <Route component={SiteRouter} />
    </Switch>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const { user, isLoaded } = useUser();
  const currentQueryClient = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const nextUserId = user?.id ?? null;
      if (
        previousUserId.current !== undefined &&
        previousUserId.current !== nextUserId
      ) {
        currentQueryClient.clear();
      }
      previousUserId.current = nextUserId;
    });
    return unsubscribe;
  }, [addListener, currentQueryClient]);

  useEffect(() => {
    if (!externalClerkAuth || !isLoaded) return;

    publishClerkAuthUser(
      user
        ? {
            id: user.id,
            email:
              user.primaryEmailAddress?.emailAddress ??
              user.emailAddresses[0]?.emailAddress ??
              null,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.imageUrl,
          }
        : null,
    );
  }, [isLoaded, user]);

  return null;
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProvider
        publishableKey={clerkPubKey}
        proxyUrl={clerkProxyUrl}
        appearance={clerkAppearance}
        signInUrl={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        localization={{
          signIn: {
            start: {
              title: 'Welcome back',
              subtitle: 'Sign in to access your subscriber account',
            },
          },
          signUp: {
            start: {
              title: 'Create your account',
              subtitle: 'Create an account after your subscription is confirmed',
            },
          },
        }}
        routerPush={(to) => {
          window.history.pushState({}, '', stripBase(to));
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
        routerReplace={(to) => {
          window.history.replaceState({}, '', stripBase(to));
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ClerkQueryClientCacheInvalidator />
            <ScrollManager />
            <Router />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </WouterRouter>
  );
}

export default App;
