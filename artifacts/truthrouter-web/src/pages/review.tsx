import { useEffect, useState } from 'react';
import { useSearch, Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { DocumentHead } from '@/components/DocumentHead';
import { TR_BRAND, TR_KEYWORD, TR_OWNER } from '@/lib/constants';
import {
  getGetAccountQuotaQueryKey,
  useCreateVerdict,
  useGetAccountQuota,
} from '@workspace/api-client-react';
import { useAuth } from '@workspace/replit-auth-web';
import { useSearchSubmit } from '@/hooks/use-search-submit';

export default function Review() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const q = searchParams.get('q') || '';
  
  const { handleSearch } = useSearchSubmit();
  const [queryInput, setQueryInput] = useState(q);
  const [scanStage, setScanStage] = useState(0);
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const queryClient = useQueryClient();
  const quota = useGetAccountQuota({
    query: {
      enabled: isAuthenticated,
      queryKey: getGetAccountQuotaQueryKey(),
    },
  });

  const {
    mutate: createVerdict,
    data: verdict,
    error,
    isPending,
  } = useCreateVerdict({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: getGetAccountQuotaQueryKey(),
        });
      },
    },
  });

  useEffect(() => {
    if (!isPending) {
      setScanStage(0);
      return;
    }

    const timer = window.setInterval(() => {
      setScanStage((current) => (current + 1) % 4);
    }, 2200);

    return () => window.clearInterval(timer);
  }, [isPending]);

  useEffect(() => {
    if (q && !authLoading) {
      setQueryInput(q);
      createVerdict({ data: { query: q } });
    }
  }, [q, authLoading, createVerdict]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearch(queryInput);
  };

  const isComparison = q.toLowerCase().includes(' vs ');
  const [left, right] = isComparison ? q.split(/\s+vs\s+/i) : [q, ''];

  const pageTitle = q 
    ? `${q} ${TR_KEYWORD} | ${TR_BRAND}` 
    : `${TR_KEYWORD} | ${TR_BRAND}`;
    
  const pageDescription = q
    ? `The Honest AI Consensus Verdict on ${q}, with the real pitfalls owners report, assembled by TruthRouter AI from public buyer consensus.`
    : `Run any product through TruthRouter AI for the Honest AI Consensus Verdict and the pitfalls that surface after the return window closes.`;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
      <DocumentHead title={pageTitle} description={pageDescription} />

      <form onSubmit={handleSubmit} role="search" aria-label={`${TR_KEYWORD} search`} className="rounded-2xl border border-ink/12 bg-white p-2 shadow-[0_18px_44px_-30px_rgba(14,20,32,0.5)] focus-within:border-verdict/50 transition-colors">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-xl bg-surface px-4 py-3">
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.2-3.2"></path>
            </svg>
            <label htmlFor="q" className="sr-only">Product to run through {TR_BRAND}</label>
            <input 
              id="q" 
              name="q" 
              type="search" 
              required 
              maxLength={180} 
              autoComplete="off" 
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Name a product, or put two head to head with vs"
              className="w-full border-0 bg-transparent p-0 text-[16px] font-medium text-ink placeholder:font-normal placeholder:text-slate2/70 focus:ring-0 outline-none"
            />
          </div>
          <button type="submit" className="rounded-xl bg-verdict px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-ink">
            Run the verdict
          </button>
        </div>
      </form>

      {isAuthenticated && quota.data && (
        <section className="mt-5 flex flex-col gap-3 rounded-2xl border border-verdict/15 bg-verdict/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-verdict">
              {quota.data.plan} plan
            </p>
            <p className="mt-1 text-[15px] text-ink">
              {quota.data.remaining === null
                ? 'Unlimited verdicts available'
                : `${quota.data.remaining} ${quota.data.plan === 'free' ? 'reviews remaining' : 'reviews remaining this month'}`}
            </p>
          </div>
          {quota.data.plan !== 'unlimited' && (
            <Link
              href="/pricing"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-ink px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-verdict"
            >
              Upgrade your plan
            </Link>
          )}
        </section>
      )}

      {q && (
        <div className="mt-9">
          <p className="text-[13px] font-medium text-slate2">{isComparison ? 'Head to head verdict' : 'Single product verdict'}</p>
          <h1 className="mt-2 font-display text-[32px] font-extrabold leading-[1.08] tracking-[-0.025em] sm:text-[42px]">
            {isComparison ? (
              <>{left} against {right}</>
            ) : (
              <>{q}</>
            )}
          </h1>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-slate2">
            The {TR_KEYWORD} below was assembled by {TR_BRAND} from public buyer reports, owner threads and independent testing, with the recurring pitfalls stated first.
          </p>
        </div>
      )}

      {isPending && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-verdict/20 bg-ink p-6 text-white shadow-[0_24px_70px_-40px_rgba(27,57,255,0.8)] sm:p-9">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-verdict/20 text-verdict">
              <span className="h-3 w-3 animate-pulse rounded-full bg-verdict" />
            </span>
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/60">
                Live review synthesis
              </p>
              <h2 className="mt-1 font-display text-[23px] font-bold sm:text-[28px]">
                Scanning 100s of public review signals
              </h2>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-white/70">
            {[
              'Finding recurring owner themes and long-term trade-offs.',
              'Comparing common pain points across buyer discussions.',
              'Ranking the strongest consensus signals and hidden pitfalls.',
              'Writing a direct recommendation for your use case.',
            ][scanStage]}
          </p>
          <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-verdict transition-all duration-700"
              style={{ width: `${25 + scanStage * 22}%` }}
            />
          </div>
        </div>
      )}

      {error && !isPending && (
        <section className="mt-8 rounded-2xl border border-pitfall/25 bg-pitfall/5 p-6" role="alert">
          <h2 className="font-display text-[20px] font-bold text-pitfall">The verdict did not run</h2>
          <p className="mt-2 text-[16px] leading-relaxed text-ink/80">
            {error instanceof Error && error.message
              ? error.message
              : 'There was a problem generating the verdict. Run the search again.'}
          </p>
          <p className="mt-4 text-[15px] text-slate2">Try the full product name with its model year, or put two products head to head using vs.</p>
          {!isAuthenticated && /10 free reviews|sign in to continue/i.test(error instanceof Error ? error.message : '') ? (
            <button
              type="button"
              onClick={() => login(`/review?q=${encodeURIComponent(q)}`)}
              className="mt-5 inline-flex rounded-xl bg-verdict px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-ink"
            >
              Sign in to continue
            </button>
          ) : (
            <Link href="/" className="mt-5 inline-flex rounded-xl bg-ink px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-verdict">Back to search</Link>
          )}
        </section>
      )}

      {verdict && !isPending && !error && (
        <>
          <article className="tr-output mt-8 rounded-2xl border border-ink/12 bg-white p-6 sm:p-9">
            <h2>{verdict.title}</h2>
            
            <p><strong>Verdict:</strong> {verdict.verdict}</p>
            <p className="text-xl mt-4 mb-2"><strong>Summary</strong></p>
            <p>{verdict.summary}</p>

            {verdict.pitfalls && verdict.pitfalls.length > 0 && (
              <>
                <h3>Hidden Pitfalls</h3>
                <ul>
                  {verdict.pitfalls.map((pitfall, idx) => (
                    <li key={idx}>{pitfall}</li>
                  ))}
                </ul>
              </>
            )}

            {verdict.evidence && verdict.evidence.length > 0 && (
              <>
                <h3>Evidence &amp; Consensus</h3>
                <ul>
                  {verdict.evidence.map((evidence, idx) => (
                    <li key={idx}>{evidence}</li>
                  ))}
                </ul>
              </>
            )}

            {verdict.sourceStatus && (
              <section className="mt-8 rounded-2xl border border-verdict/15 bg-verdict/[0.04] p-5 sm:p-6">
                <h3 className="!mt-0">Popular review signals</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-slate2">
                  Recurring buyer themes are model-generated paraphrases for clarity, not direct quotations or verified ratings.
                </p>
                {verdict.popularReviews.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {verdict.popularReviews.map((review, idx) => (
                      <li key={idx} className="flex gap-3 text-[15px] leading-relaxed">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-verdict" />
                        <span>{review}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-[15px] text-slate2">
                    No review themes were returned for this verdict.
                  </p>
                )}

                <div className="mt-6 border-t border-verdict/15 pt-5">
                  <h4 className="font-display text-[17px] font-bold text-ink">Live public sources</h4>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate2">
                    These links are fetched separately for independent checking. They provide context for the query and are not proof that every theme above appears in every source.
                  </p>
                  {verdict.sourceStatus === 'available' ? (
                    <ul className="mt-4 space-y-3">
                      {verdict.sources.map((source) => (
                        <li key={source.url} className="rounded-xl border border-ink/10 bg-white p-3">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-verdict hover:text-ink"
                          >
                            {source.title}
                          </a>
                          <p className="mt-1 text-[13px] text-slate2">
                            {source.publisher} · {formatSourceDate(source.publishedAt)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 rounded-xl border border-ink/10 bg-white p-3 text-[14px] text-slate2" role="status">
                      {verdict.sourceStatusMessage}
                    </p>
                  )}
                </div>
              </section>
            )}

            <h3>Recommendation</h3>
            <p>{verdict.recommendation}</p>
            
            <hr />
            <small>Generated by {verdict.model} with {verdict.confidence}% confidence.</small>
          </article>

          <section className="mt-6 rounded-2xl bg-surface p-6 sm:p-8">
            <h2 className="font-display text-[19px] font-bold">How to read this verdict</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-slate2">
              An {TR_KEYWORD} weights long term ownership over launch impressions, discounts incentivised reviews, and reports the failure pattern rather than the average score. {TR_BRAND} takes no payment from any manufacturer or retailer, and {TR_OWNER} funds the platform directly.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-slate2">
              Treat this as research toward your own decision rather than purchase advice, and confirm current pricing, warranty terms and regional model differences before you buy.
            </p>
          </section>
        </>
      )}

    </main>
  );
}

function formatSourceDate(value: string | null): string {
  if (!value) return 'Date unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}
