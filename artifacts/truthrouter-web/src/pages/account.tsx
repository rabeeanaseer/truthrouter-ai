import { useUser, useClerk } from '@clerk/react';
import { Link } from 'wouter';
import { DocumentHead } from '@/components/DocumentHead';
import { TR_BRAND } from '@/lib/constants';

const WHATSAPP_NUMBER = '923225194889';
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function Account() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const plan = typeof user?.publicMetadata?.plan === 'string' ? user.publicMetadata.plan : '';
  const isActivated = plan === 'plus' || plan === 'unlimited';

  if (!isLoaded) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-14 sm:px-8">
        <div className="h-10 w-1/2 animate-pulse rounded-lg bg-surface" />
        <div className="mt-6 h-32 animate-pulse rounded-2xl bg-surface" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 pb-20 pt-14 text-center sm:px-8">
        <DocumentHead title={`Subscriber Login | ${TR_BRAND}`} description="Sign in to access your TruthRouter subscriber account." />
        <h1 className="font-display text-[38px] font-extrabold tracking-tight">Subscriber access</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-slate2">
          This account area is for Plus and Unlimited subscribers after manual WhatsApp activation.
        </p>
        <Link href="/sign-in" className="mt-7 inline-flex rounded-xl bg-ink px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-verdict">
          Sign in
        </Link>
      </main>
    );
  }

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    'Hi, I have created my TruthRouter account and need my paid subscription activated.',
  )}`;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-14 sm:px-8">
      <DocumentHead title={`Your Account | ${TR_BRAND}`} description="Manage your TruthRouter subscriber account." />
      <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-verdict">Subscriber account</p>
      <h1 className="mt-3 font-display text-[38px] font-extrabold tracking-tight sm:text-[48px]">
        Welcome{user.firstName ? `, ${user.firstName}` : ''}.
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-slate2">
        {user.primaryEmailAddress?.emailAddress}
      </p>

      <section className="mt-9 rounded-2xl border border-ink/12 bg-white p-6 sm:p-8">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-slate2">Plan status</p>
        <h2 className="mt-3 font-display text-[26px] font-bold">
          {isActivated ? `${plan === 'plus' ? 'Plus' : 'Unlimited'} activated` : 'Waiting for activation'}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-slate2">
          {isActivated
            ? 'Your account is ready for the review allowance attached to your plan.'
            : 'After you subscribe through WhatsApp, send us this account confirmation so we can activate your selected plan.'}
        </p>
        {!isActivated && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex rounded-xl bg-ink px-5 py-3.5 text-[15px] font-semibold text-white hover:bg-verdict"
          >
            Send activation request on WhatsApp
          </a>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/pricing" className="rounded-xl border border-ink/15 px-5 py-3 text-[15px] font-semibold text-ink hover:border-verdict hover:text-verdict">
          View plans
        </Link>
        <button
          type="button"
          onClick={() => signOut({ redirectUrl: basePath || '/' })}
          className="rounded-xl border border-ink/15 px-5 py-3 text-[15px] font-semibold text-slate2 hover:border-ink hover:text-ink"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}