import { DocumentHead } from '@/components/DocumentHead';
import { TR_BRAND, TR_OWNER } from '@/lib/constants';
import { Link } from 'wouter';

export default function EditorialIndependence() {
  const pageTitle = `Editorial independence | ${TR_BRAND}`;
  const pageDescription = `How ${TR_BRAND} keeps verdicts free of sponsorship and manufacturer influence.`;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-14 sm:px-8">
      <DocumentHead title={pageTitle} description={pageDescription} />
      
      <p className="text-[13px] font-medium text-slate2">Company</p>
      <h1 className="mt-2 font-display text-[36px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[44px]">Editorial independence</h1>

      <div className="prose prose-slate mt-8 max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-slate2 prose-li:text-slate2">
        <p>{TR_BRAND} is funded directly by {TR_OWNER}. No manufacturer, retailer or brand pays to appear, to be excluded, or to change how a verdict reads.</p>

        <h2>What this means in practice</h2>
        <ul>
          <li>No sponsored placements and no "featured" slots sold to brands.</li>
          <li>No affiliate link that changes commission based on which way a verdict leans.</li>
          <li>The prompt that instructs the model explicitly asks it to lead with pitfalls, not praise, and to say when the evidence is mixed rather than manufacture a clean answer.</li>
        </ul>

        <h2>Limits worth being upfront about</h2>
        <p>Independence from sponsorship does not make a verdict infallible. The underlying model can misread sources, miss recent developments, or reflect biases present in the public reviews it draws on. If something reads wrong, use the <Link href="/report-a-verdict">report a wrong verdict</Link> page to flag it.</p>
      </div>
    </main>
  );
}
