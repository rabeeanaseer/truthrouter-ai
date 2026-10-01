import { DocumentHead } from '@/components/DocumentHead';
import { TR_BRAND, TR_OWNER } from '@/lib/constants';

export default function Careers() {
  const pageTitle = `Careers | ${TR_BRAND}`;
  const pageDescription = `There are no open roles at ${TR_BRAND} right now, but here is how to reach us.`;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-14 sm:px-8">
      <DocumentHead title={pageTitle} description={pageDescription} />
      
      <p className="text-[13px] font-medium text-slate2">Company</p>
      <h1 className="mt-2 font-display text-[36px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[44px]">Careers</h1>

      <div className="prose prose-slate mt-8 max-w-none prose-headings:font-display prose-headings:font-bold prose-p:leading-relaxed prose-p:text-slate2">
        <p>{TR_BRAND} is currently a small project run by {TR_OWNER}, and there are no open positions listed at the moment.</p>
        <p>If you'd like to get in touch about contributing, reach out through <a href="https://github.com/rabeeanaseer" target="_blank" rel="noopener noreferrer">GitHub</a> or <a href="https://www.linkedin.com/in/rabeea-naseer-045b4a337/" target="_blank" rel="noopener noreferrer">LinkedIn</a>, and check back here for updates.</p>
      </div>
    </main>
  );
}
