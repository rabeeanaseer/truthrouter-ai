import { DocumentHead } from '@/components/DocumentHead';
import { TR_BRAND } from '@/lib/constants';

export default function SourcingStandards() {
  const pageTitle = `Sourcing standards | ${TR_BRAND}`;
  const pageDescription = `What ${TR_BRAND} weighs, and what it discounts, when assembling a verdict.`;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-14 sm:px-8">
      <DocumentHead title={pageTitle} description={pageDescription} />
      
      <p className="text-[13px] font-medium text-slate2">Legal</p>
      <h1 className="mt-2 font-display text-[36px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[44px]">Sourcing standards</h1>

      <div className="prose prose-slate mt-8 max-w-none prose-headings:font-display prose-headings:font-bold prose-p:leading-relaxed prose-p:text-slate2 prose-li:text-slate2">
        <p>Every verdict is produced by instructing the model behind {TR_BRAND} to follow a fixed set of evidence rules. This page states them plainly, rather than leaving them implicit.</p>

        <h2>Weighted toward</h2>
        <ul>
          <li>Verified purchase reviews and long-term owner threads, especially those written months after purchase.</li>
          <li>Independent teardown and repair reports.</li>
          <li>Warranty claim and return-reason patterns where publicly discussed.</li>
          <li>Independent lab or third-party testing.</li>
        </ul>

        <h2>Discounted or excluded</h2>
        <ul>
          <li>Reviews that show signs of incentivised or template posting.</li>
          <li>Launch-window hype and pre-release press impressions written before meaningful real-world use.</li>
          <li>Sponsored content of any kind.</li>
        </ul>

        <h2>When evidence conflicts</h2>
        <p>The model is instructed to say so rather than manufacture a clean answer, and to avoid stating a specification, price or date it isn't confident about.</p>

        <h2>Known limitations</h2>
        <p>The model works from publicly available text, not from hands-on testing performed by {TR_BRAND} itself, and its knowledge of very recent products may be incomplete. Treat every verdict as a starting point for your own research.</p>
      </div>
    </main>
  );
}
