import { DocumentHead } from '@/components/DocumentHead';
import { TR_BRAND } from '@/lib/constants';
import { blogPosts } from '@/lib/blog-data';
import { useRoute } from 'wouter';
import NotFound from '@/pages/not-found';
import { Link } from 'wouter';

export default function BlogPost() {
  const [, params] = useRoute('/blog/:slug');
  const slug = params?.slug;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return <NotFound />;
  }

  const pageTitle = `${post.title} | Editorial | ${TR_BRAND}`;
  const pageDescription = post.summary;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-14 sm:px-8">
      <DocumentHead title={pageTitle} description={pageDescription} />
      
      <div className="mb-8">
        <Link href="/blog" className="inline-flex items-center gap-2 text-[14px] font-medium text-slate2 hover:text-verdict transition-colors">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back to Blog
        </Link>
      </div>

      <p className="text-[13px] font-medium text-slate2">
        {new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      <h1 className="mt-2 font-display text-[36px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[44px]">{post.title}</h1>
      <p className="mt-4 text-[18px] leading-relaxed text-slate2 font-medium">
        {post.summary}
      </p>

      <div 
        className="prose prose-slate mt-10 max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-slate2 prose-a:text-verdict hover:prose-a:text-ink"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </main>
  );
}
