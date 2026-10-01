import { DocumentHead } from '@/components/DocumentHead';
import { TR_BRAND } from '@/lib/constants';
import { blogPosts } from '@/lib/blog-data';
import { Link } from 'wouter';

export default function BlogIndex() {
  const pageTitle = `Editorial Blog | ${TR_BRAND}`;
  const pageDescription = `Research, methodologies, and insights into consumer product longevity from ${TR_BRAND}.`;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 pb-20 pt-14 sm:px-8">
      <DocumentHead title={pageTitle} description={pageDescription} />
      
      <p className="text-[13px] font-medium text-slate2">Editorial</p>
      <h1 className="mt-2 font-display text-[36px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[44px]">Research &amp; Insights</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-slate2 max-w-2xl">
        Articles on how we evaluate products, the traps of modern consumer electronics, and how to look past the marketing.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
        {blogPosts.map((post) => (
          <article key={post.slug} className="group relative flex flex-col rounded-2xl border border-ink/12 bg-white p-6 transition-colors hover:border-verdict/40">
            <p className="text-[13px] font-medium text-slate2">
              {new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h2 className="mt-3 font-display text-[22px] font-bold leading-tight tracking-tight text-ink">
              <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 focus:outline-none">
                {post.title}
              </Link>
            </h2>
            <p className="mt-3 flex-1 text-[15px] leading-relaxed text-slate2">
              {post.summary}
            </p>
            <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-4">
              <span className="text-[14px] font-semibold text-verdict group-hover:text-ink transition-colors">Read article</span>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
