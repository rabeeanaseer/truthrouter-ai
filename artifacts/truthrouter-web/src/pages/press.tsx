import { DocumentHead } from '@/components/DocumentHead';
import { TR_BRAND, TR_OWNER } from '@/lib/constants';

export default function Press() {
  const pageTitle = `Press enquiries | ${TR_BRAND}`;
  const pageDescription = `How to reach ${TR_BRAND} for press and media enquiries.`;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-14 sm:px-8">
      <DocumentHead title={pageTitle} description={pageDescription} />
      
      <p className="text-[13px] font-medium text-slate2">Company</p>
      <h1 className="mt-2 font-display text-[36px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[44px]">Press enquiries</h1>

      <div className="prose prose-slate mt-8 max-w-none prose-headings:font-display prose-headings:font-bold prose-p:leading-relaxed prose-p:text-slate2">
        <p>For interview requests, data questions about how verdicts are produced, or anything else related to {TR_BRAND} and {TR_OWNER}, get in touch through <a href="https://github.com/rabeeanaseer" target="_blank" rel="noopener noreferrer">GitHub</a> or <a href="https://www.linkedin.com/in/rabeea-naseer-045b4a337/" target="_blank" rel="noopener noreferrer">LinkedIn</a>.</p>
        <p>Please include the specific verdict or feature you're asking about, and a way to reach you back.</p>
      </div>
    </main>
  );
}
