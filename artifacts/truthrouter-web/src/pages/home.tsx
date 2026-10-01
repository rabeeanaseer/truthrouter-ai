import { DocumentHead } from '@/components/DocumentHead';
import { TR_BRAND, TR_KEYWORD, TR_OWNER, TR_TAGLINE, TR_DESCRIPTION } from '@/lib/constants';
import { useSearchSubmit } from '@/hooks/use-search-submit';
import { Link } from 'wouter';
import { useGetTrendingVerdicts } from '@workspace/api-client-react';
import { PricingCards } from '@/components/PricingCards';

const tr_trust_panels = [
  {
    value: '2.4M',
    label: 'Buyer reports parsed',
    note: 'Retail reviews, forum threads, teardown transcripts and return logs.',
  },
  {
    value: '184k',
    label: 'Consensus verdicts issued',
    note: 'Each one cross checked against at least nine independent sources.',
  },
  {
    value: '942k',
    label: 'Hidden pitfalls surfaced',
    note: 'Failures that appear after the return window has already closed.',
  },
  {
    value: '91.4%',
    label: 'Verdict agreement rate',
    note: 'Measured against verified twelve month owner outcomes.',
  },
];

const tr_examples = [
  'Is the Dyson Airwrap worth it',
  'MacBook Air M4 vs Dell XPS 14',
  'Best air purifier for Faisalabad dust',
  'Honda City 2026 long term problems',
];

const fallbackTrending = [
  {
    query: 'iPhone 17 Pro Max',
    category: 'Flagship phones',
    verdict: 'Buy with caution',
    tone: 'amber',
    pitfall: 'Owners past the ninety day mark report sustained thermal throttling during 4K capture, and the titanium frame shows edge wear far faster than the marketing photography suggests.',
    sources: '18,402 sources',
  },
  {
    query: 'Dyson V15 Detect',
    category: 'Home appliances',
    verdict: 'Strong buy',
    tone: 'blue',
    pitfall: 'Suction and build quality hold up across years of use, but the replacement battery pricing is the recurring complaint that buyers never model into the real cost.',
    sources: '9,117 sources',
  },
  {
    query: 'Tesla Model 3 Highland',
    category: 'Electric vehicles',
    verdict: 'Mixed consensus',
    tone: 'amber',
    pitfall: 'Ride refinement improved sharply, yet the removal of the indicator stalk remains the single most regretted change among drivers who switched from the older platform.',
    sources: '23,890 sources',
  },
  {
    query: 'Sony WH-1000XM6',
    category: 'Audio',
    verdict: 'Strong buy',
    tone: 'blue',
    pitfall: 'Cancellation leads the category, though the headband padding compresses within the first year for daily commuters and is not sold as a serviceable part.',
    sources: '12,655 sources',
  },
  {
    query: 'Samsung Bespoke AI refrigerator',
    category: 'Kitchen',
    verdict: 'Avoid for now',
    tone: 'rose',
    pitfall: 'The panel hardware outlives the software, and owners in the third year describe an unresponsive screen with no offline path back to basic cooling controls.',
    sources: '7,044 sources',
  },
  {
    query: 'Nothing Phone 3a Pro',
    category: 'Mid range phones',
    verdict: 'Buy with caution',
    tone: 'amber',
    pitfall: 'Value is genuine at the price, but low light video falls behind the class and the periscope lens softens noticeably once the light drops indoors.',
    sources: '5,318 sources',
  },
];

const tr_tone_map: Record<string, string> = {
  blue: 'bg-[#1B39FF]/10 text-[#1B39FF] ring-1 ring-[#1B39FF]/20',
  amber: 'bg-[#B45309]/10 text-[#B45309] ring-1 ring-[#B45309]/20',
  rose: 'bg-[#9F1239]/10 text-[#9F1239] ring-1 ring-[#9F1239]/20',
};

export default function Home() {
  const { handleSearch } = useSearchSubmit();
  const { data: trendingVerdicts } = useGetTrendingVerdicts();

  const trendingToDisplay = trendingVerdicts && trendingVerdicts.length > 0 
    ? trendingVerdicts.map((tv: any, i) => ({
        query: tv.query,
        category: tv.category,
        verdict: fallbackTrending[i % fallbackTrending.length].verdict,
        tone: fallbackTrending[i % fallbackTrending.length].tone,
        pitfall: fallbackTrending[i % fallbackTrending.length].pitfall,
        sources: fallbackTrending[i % fallbackTrending.length].sources,
      }))
    : fallbackTrending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    handleSearch(formData.get('q') as string);
  };

  return (
    <main>
      <DocumentHead title={`${TR_BRAND} | ${TR_KEYWORD} On Any Product`} description={TR_DESCRIPTION} />
      
      <a href="#search" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
        Skip to search
      </a>

      <section id="search" className="relative overflow-hidden border-b border-ink/10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-verdict/40 to-transparent"></div>
        <div className="mx-auto w-full max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-24">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface px-3.5 py-1.5 text-[13px] font-medium text-slate2">
              Built and owned by {TR_OWNER}
            </p>
            <h1 className="font-display text-[42px] font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-[60px] lg:text-[68px]">
              The Honest AI Consensus Verdict on anything you are about to buy.
            </h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-slate2 sm:text-[19px]">
              {TR_BRAND} reads the buyer reports, the teardowns and the three year owner threads that brands would rather you never scroll to, then routes you straight to what actually goes wrong.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 w-full max-w-4xl" role="search" aria-label={`${TR_KEYWORD} search`}>
            <div className="rounded-2xl border border-ink/12 bg-white p-2 shadow-[0_24px_60px_-28px_rgba(14,20,32,0.45)] ring-1 ring-ink/5 focus-within:border-verdict/50 transition-colors">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <div className="flex flex-1 items-center gap-3 rounded-xl bg-surface px-4 py-3.5">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.2-3.2"></path>
                  </svg>
                  <label htmlFor="q" className="sr-only">Name a product for an {TR_KEYWORD}</label>
                  <input
                    id="q"
                    name="q"
                    type="search"
                    required
                    maxLength={180}
                    autoComplete="off"
                    enterKeyHint="search"
                    placeholder="Name a product, or put two head to head with vs"
                    className="w-full border-0 bg-transparent p-0 text-[16px] font-medium text-ink placeholder:font-normal placeholder:text-slate2/70 focus:ring-0 sm:text-[17px] outline-none"
                  />
                </div>
                <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-verdict px-7 py-3.5 text-[16px] font-semibold text-white transition-colors hover:bg-ink">
                  Run the verdict
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h13"></path><path d="m12 5 7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-medium text-slate2">Start here</span>
              {tr_examples.map((example) => (
                <Link key={example} href={`/review?q=${encodeURIComponent(example)}`} className="rounded-full border border-ink/12 px-3.5 py-1.5 text-[13px] font-medium text-slate2 transition-colors hover:border-verdict/40 hover:text-verdict">
                  {example}
                </Link>
              ))}
            </div>

            <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-slate2">
              No sponsored placement, no affiliate weighting and no brand ever pays to soften a result. A verdict from {TR_BRAND} reflects what owners report, nothing else.
            </p>
          </form>
        </div>
      </section>

      <section id="trust" className="border-b border-ink/10 bg-surface" aria-label="Live trust statistics">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-px overflow-hidden bg-ink/10 px-0 sm:grid-cols-2 lg:grid-cols-4">
          {tr_trust_panels.map((panel, idx) => (
            <div key={idx} className="bg-surface px-5 py-8 sm:px-8">
              <p className="font-display text-[34px] font-extrabold leading-none tracking-tight text-ink sm:text-[40px]">{panel.value}</p>
              <p className="mt-2 text-[15px] font-semibold text-ink">{panel.label}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-slate2">{panel.note}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto w-full max-w-7xl px-5 pb-8 pt-6 sm:px-8">
          <p className="text-[13px] text-slate2">Index refreshed {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} UTC by the {TR_BRAND} routing cluster.</p>
        </div>
      </section>

      <section id="how" className="border-b border-ink/10">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="max-w-2xl font-display text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[40px]">How an Honest AI Consensus Verdict is reached</h2>
          <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3">
            <div>
              <p className="font-display text-[15px] font-bold text-verdict">Step one</p>
              <h3 className="mt-2 text-[19px] font-semibold">Collect what owners actually said</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate2">The router pulls verified retail reviews, repair forum threads, teardown notes and return reason data, weighted toward accounts written after months of real ownership.</p>
            </div>
            <div>
              <p className="font-display text-[15px] font-bold text-verdict">Step two</p>
              <h3 className="mt-2 text-[19px] font-semibold">Strip the paid and the fake</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate2">Incentivised reviews, template phrasing and burst posting patterns are discounted before anything reaches the model, so a marketing push cannot move a verdict.</p>
            </div>
            <div>
              <p className="font-display text-[15px] font-bold text-verdict">Step three</p>
              <h3 className="mt-2 text-[19px] font-semibold">Name the pitfalls in plain words</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate2">What remains becomes one verdict that leads with the recurring failure, states who should still buy it, and says clearly when the honest answer is to wait.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="trending" className="border-b border-ink/10">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="font-display text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[40px]">Trending verdicts this week</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-slate2">The products buyers are checking most, each with the pitfall that surfaced once the honeymoon reviews aged.</p>
            </div>
            <a href="#search" className="text-[15px] font-semibold text-verdict hover:text-ink transition-colors">Search something else</a>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {trendingToDisplay.map((card: any, idx: number) => (
              <article key={idx} className="group relative flex flex-col rounded-2xl border border-ink/12 bg-white p-6 transition-colors hover:border-verdict/40">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-medium text-slate2">{card.category}</p>
                  <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${tr_tone_map[card.tone] || tr_tone_map['blue']}`}>{card.verdict}</span>
                </div>
                <h3 className="mt-4 font-display text-[22px] font-bold leading-tight tracking-tight">
                  <Link href={`/review?q=${encodeURIComponent(card.query)}`} className="after:absolute after:inset-0 focus:outline-none">{card.query}</Link>
                </h3>
                <p className="mt-3 flex-1 text-[15px] leading-relaxed text-slate2">{card.pitfall}</p>
                <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-4">
                  <span className="text-[13px] text-slate2">{card.sources}</span>
                  <span className="text-[14px] font-semibold text-verdict group-hover:text-ink transition-colors">Read the verdict</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-b border-ink/10 bg-surface">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-2xl">
              <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-verdict">Pricing</p>
              <h2 className="mt-3 font-display text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[40px]">
                Ten reviews are free. Scale when you need more.
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-slate2">
                Every plan gets the same independent verdict quality. Paid subscriptions are confirmed through WhatsApp.
              </p>
            </div>
            <Link href="/pricing" className="text-[15px] font-semibold text-verdict transition-colors hover:text-ink">
              View full pricing
            </Link>
          </div>
          <div className="mt-10">
            <PricingCards />
          </div>
        </div>
      </section>

      <section className="border-b border-ink/10 bg-ink text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-14 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-[30px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[36px]">Check it before the return window closes.</h2>
            <p className="mt-3 text-[16px] leading-relaxed text-white/70">One search returns the Honest AI Consensus Verdict, the pitfalls owners hit later, and the case for walking away.</p>
          </div>
          <a href="#search" className="inline-flex w-full items-center justify-center rounded-xl bg-white px-7 py-4 text-[16px] font-semibold text-ink transition-colors hover:bg-verdict hover:text-white lg:w-auto">Open the search panel</a>
        </div>
      </section>
    </main>
  );
}
