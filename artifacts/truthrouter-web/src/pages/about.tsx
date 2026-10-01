import { DocumentHead } from '@/components/DocumentHead';
import { TR_BRAND, TR_OWNER, TR_ENGINEER } from '@/lib/constants';

export default function About() {
  const pageTitle = `About ${TR_BRAND} | ${TR_OWNER}`;
  const pageDescription = `What ${TR_BRAND} is, how it produces a verdict, and who builds and owns the project.`;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-14 sm:px-8">
      <DocumentHead title={pageTitle} description={pageDescription} />
      
      <p className="text-[13px] font-medium text-slate2">Company</p>
      <h1 className="mt-2 font-display text-[36px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[44px]">About Us</h1>

      <div className="prose prose-slate mt-8 max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-slate2">
        <p>{TR_BRAND} is a small, independent product research project. Instead of writing traditional review articles, it takes a product name, gathers the publicly available signal on it — buyer reviews, forum threads, teardown notes, long-term ownership reports — and asks an AI model to summarise the recurring pitfalls in plain language.</p>

        <p>The project is built and owned by {TR_OWNER}, with engineering by <a href="https://github.com/rabeeanaseer" target="_blank" rel="noopener noreferrer">{TR_ENGINEER}</a>. It runs without a traditional database: each verdict is generated on demand and cached briefly so repeat searches load fast.</p>

        <section className="not-prose my-10 rounded-2xl border border-ink/12 bg-surface p-6 sm:p-8">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-verdict">About the author</p>
          <h2 className="mt-3 font-display text-[26px] font-bold tracking-tight">{TR_ENGINEER}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate2">
            Rabeea is the founder of NovatraTech. Her public GitHub profile describes her work as building AI systems, scalable SaaS products, and monetized digital platforms. She is based in Rawalpindi, Punjab, Pakistan.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="https://github.com/rabeeanaseer"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-xl bg-ink px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-verdict"
            >
              View GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/rabeea-naseer-045b4a337/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-xl border border-ink/15 px-4 py-2.5 text-[14px] font-semibold text-ink hover:border-verdict hover:text-verdict"
            >
              View LinkedIn
            </a>
          </div>
        </section>

        <h2>What a verdict is, and is not</h2>
        <p>A verdict is a summary of publicly available opinion, produced by an AI model. It is not a lab test, not a certification, and not personalised advice. Model outputs can be wrong or incomplete, and you should treat every verdict as a starting point for your own research rather than a final answer.</p>

        <h2>No sponsorships</h2>
        <p>{TR_BRAND} does not accept payment from manufacturers or retailers to influence a result, and carries no affiliate links that change based on verdict outcome.</p>
      </div>
    </main>
  );
}
