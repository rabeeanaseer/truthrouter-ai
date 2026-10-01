import { DocumentHead } from '@/components/DocumentHead';
import { TR_BRAND } from '@/lib/constants';
import { Link } from 'wouter';

export default function Privacy() {
  const pageTitle = `Privacy policy | ${TR_BRAND}`;
  const pageDescription = `What ${TR_BRAND} stores about your visit and your search queries, and what it does not.`;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-14 sm:px-8">
      <DocumentHead title={pageTitle} description={pageDescription} />
      
      <p className="text-[13px] font-medium text-slate2">Legal</p>
      <h1 className="mt-2 font-display text-[36px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[44px]">Privacy policy</h1>
      <p className="mt-3 text-[14px] text-slate2">Last updated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <div className="prose prose-slate mt-8 max-w-none prose-headings:font-display prose-headings:font-bold prose-p:leading-relaxed prose-p:text-slate2 prose-li:text-slate2">
        <p>{TR_BRAND} is built to run without a traditional user database. This page explains, plainly, what does and doesn't get stored.</p>

        <h2>Search queries</h2>
        <p>When you run a search, the product name you type is sent to an AI model so a verdict can be generated. The resulting verdict is cached on the server for a short period so identical searches load quickly without calling the model again. The cache key is a hash of the query text, not tied to your identity.</p>

        <h2>Session data</h2>
        <p>A short-lived session token is used to apply a fair-use rate limit. Nothing in the session is linked to a name, email or account, because there are no accounts.</p>

        <h2>Server logs</h2>
        <p>Like most web servers, the hosting environment may log standard request metadata (IP address, user agent, timestamp, requested URL) for security and abuse prevention. These logs are not used for advertising or sold to third parties.</p>

        <h2>Third parties</h2>
        <p>Search queries are sent to our configured AI provider to generate a verdict. Fonts are loaded from Google Fonts; they may see your IP address as a normal side effect of serving those files, under their own privacy terms.</p>

        <h2>Your choices</h2>
        <ul>
          <li>Clearing cookies for this site removes your session, including the rate-limit counter.</li>
          <li>You can use the site without providing any personal information beyond the product name you search for.</li>
        </ul>

        <h2>Contact</h2>
        <p>Questions about this policy can be sent through the channels listed on the <Link href="/press">press enquiries</Link> page.</p>
      </div>
    </main>
  );
}
