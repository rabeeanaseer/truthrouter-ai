import { Link } from 'wouter';
import { DocumentHead } from '@/components/DocumentHead';
import { PricingCards } from '@/components/PricingCards';
import { TR_BRAND } from '@/lib/constants';

export default function Pricing() {
  return (
    <main>
      <DocumentHead
        title={`Simple Pricing | ${TR_BRAND}`}
        description="Choose a TruthRouter plan for 10, 100, or unlimited AI product verdicts."
      />
      <section className="border-b border-ink/10">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-verdict">
              Simple pricing
            </p>
            <h1 className="mt-4 font-display text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[56px]">
              Pay for the number of decisions you make.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-slate2">
              Start with ten free reviews. Upgrade when you need more, with no sponsored
              recommendations and no affiliate weighting at any level.
            </p>
          </div>
          <div className="mt-12">
            <PricingCards />
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-[14px] leading-relaxed text-slate2">
            Paid subscriptions are confirmed and activated manually through WhatsApp.
            Select a plan and send the prefilled message to our team.
            <br />
            Already activated?{' '}
            <Link href="/sign-in" className="font-semibold text-verdict hover:text-ink">
              Sign in to your subscriber account.
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}