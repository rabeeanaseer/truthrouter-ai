import { Link } from 'wouter';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-ink/10 bg-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <span className="font-display text-[20px] font-extrabold tracking-tight">TruthRouter<span className="text-verdict"> AI</span></span>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-slate2">Every product has a flaw. We route you to it. An independent consumer research project delivering the Honest AI Consensus Verdict on the products people are about to pay for.</p>
            <p className="mt-5 text-[14px] font-medium text-ink">A product of Novatratech SMC Private Limited</p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold text-ink">Product</h3>
            <p className="mt-4 text-[15px] text-slate2"><Link className="hover:text-verdict transition-colors" href="/#search">Verdict search</Link></p>
            <p className="mt-2.5 text-[15px] text-slate2"><Link className="hover:text-verdict transition-colors" href="/#trending">Trending verdicts</Link></p>
            <p className="mt-2.5 text-[15px] text-slate2"><Link className="hover:text-verdict transition-colors" href="/review?q=MacBook%20Air%20M4%20vs%20Dell%20XPS%2014">Head to head compare</Link></p>
            <p className="mt-2.5 text-[15px] text-slate2"><Link className="hover:text-verdict transition-colors" href="/#how">Verdict method</Link></p>
            <p className="mt-2.5 text-[15px] text-slate2"><Link className="hover:text-verdict transition-colors" href="/pricing">Pricing</Link></p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold text-ink">Company</h3>
            <p className="mt-4 text-[15px] text-slate2"><Link className="hover:text-verdict transition-colors" href="/about">About Us</Link></p>
            <p className="mt-2.5 text-[15px] text-slate2"><Link className="hover:text-verdict transition-colors" href="/editorial-independence">Editorial independence</Link></p>
            <p className="mt-2.5 text-[15px] text-slate2"><Link className="hover:text-verdict transition-colors" href="/careers">Careers</Link></p>
            <p className="mt-2.5 text-[15px] text-slate2"><Link className="hover:text-verdict transition-colors" href="/press">Press enquiries</Link></p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold text-ink">Legal &amp; More</h3>
            <p className="mt-4 text-[15px] text-slate2"><Link className="hover:text-verdict transition-colors" href="/privacy">Privacy policy</Link></p>
            <p className="mt-2.5 text-[15px] text-slate2"><Link className="hover:text-verdict transition-colors" href="/terms">Terms of use</Link></p>
            <p className="mt-2.5 text-[15px] text-slate2"><Link className="hover:text-verdict transition-colors" href="/sourcing-standards">Sourcing standards</Link></p>
            <p className="mt-2.5 text-[15px] text-slate2"><Link className="hover:text-verdict transition-colors" href="/report-a-verdict">Report a wrong verdict</Link></p>
            <p className="mt-2.5 text-[15px] text-slate2"><Link className="hover:text-verdict transition-colors" href="/blog">Editorial blog</Link></p>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-slate2">Copyright {currentYear} Novatratech SMC Private Limited. TruthRouter AI and the Honest AI Consensus Verdict are products of Novatratech SMC Private Limited. All rights reserved.</p>
          <p className="text-[13px] text-slate2">Verdicts are research summaries, not purchase advice.</p>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <p className="text-[13px] text-slate2">
            Engineered by <a className="font-medium text-ink hover:text-verdict" href="https://github.com/rabeeanaseer" target="_blank" rel="noopener noreferrer">Rabeea Naseer</a>
            <span className="mx-1.5 text-ink/20">&bull;</span>
            <a className="hover:text-verdict" href="https://github.com/rabeeanaseer" target="_blank" rel="noopener noreferrer">GitHub</a>
            <span className="mx-1.5 text-ink/20">&bull;</span>
            <a className="hover:text-verdict" href="https://www.linkedin.com/in/rabeea-naseer-045b4a337/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
