import { Link } from 'wouter';
import { useAuth } from '@workspace/replit-auth-web';

const WHATSAPP_NUMBER = '923225194889';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For occasional buying decisions and product checks.',
    allowance: 'Up to 10 reviews',
    features: [
      '10 AI consensus verdicts',
      'Product and head-to-head comparisons',
      'Pitfalls, evidence, and recommendations',
      'No card required',
    ],
    cta: 'Start for free',
    href: '/#search',
    featured: false,
  },
  {
    name: 'Plus',
    price: '$5',
    period: 'per month',
    description: 'For regular shoppers, researchers, and small teams.',
    allowance: 'Up to 100 reviews',
    features: [
      '100 AI consensus verdicts each month',
      'Product and head-to-head comparisons',
      'Pitfalls, evidence, and recommendations',
      'Subscription support on WhatsApp',
    ],
    cta: 'Subscribe to Plus',
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      'Hi, I want to subscribe to TruthRouter Plus for $5 per month with up to 100 reviews.',
    )}`,
    featured: true,
  },
  {
    name: 'Unlimited',
    price: '$11',
    period: 'per month',
    description: 'For power users who need verdicts without a monthly cap.',
    allowance: 'Unlimited reviews',
    features: [
      'Unlimited AI consensus verdicts',
      'Product and head-to-head comparisons',
      'Pitfalls, evidence, and recommendations',
      'Priority subscription support on WhatsApp',
    ],
    cta: 'Subscribe to Unlimited',
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      'Hi, I want to subscribe to TruthRouter Unlimited for $11 per month with unlimited reviews.',
    )}`,
    featured: false,
  },
];

export function PricingCards() {
  const { isAuthenticated, login } = useAuth();

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {plans.map((plan) => {
        const cardClass = plan.featured
          ? 'border-verdict bg-ink text-white shadow-[0_28px_70px_-36px_rgba(27,57,255,0.65)]'
          : 'border-ink/12 bg-white text-ink';
        const mutedClass = plan.featured ? 'text-white/68' : 'text-slate2';
        const lineClass = plan.featured ? 'border-white/12' : 'border-ink/10';
        const buttonClass = plan.featured
          ? 'bg-verdict text-white hover:bg-white hover:text-ink'
          : 'bg-ink text-white hover:bg-verdict';

        return (
          <article
            key={plan.name}
            className={`relative flex flex-col rounded-2xl border p-6 sm:p-8 ${cardClass}`}
          >
            {plan.featured && (
              <span className="absolute right-6 top-6 rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white ring-1 ring-white/15">
                Most popular
              </span>
            )}
            <p className={`text-[14px] font-semibold ${plan.featured ? 'text-white' : 'text-verdict'}`}>
              {plan.name}
            </p>
            <div className="mt-5 flex items-end gap-2">
              <span className="font-display text-[46px] font-extrabold leading-none tracking-tight">
                {plan.price}
              </span>
              <span className={`pb-1 text-[14px] ${mutedClass}`}>{plan.period}</span>
            </div>
            <p className={`mt-4 min-h-12 text-[15px] leading-relaxed ${mutedClass}`}>
              {plan.description}
            </p>
            <p className={`mt-6 border-y py-4 text-[17px] font-bold ${lineClass}`}>
              {plan.allowance}
            </p>
            <ul className={`mt-6 flex-1 space-y-3 text-[14px] leading-relaxed ${mutedClass}`}>
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-3">
                  <svg
                    viewBox="0 0 20 20"
                    className={`mt-0.5 h-4 w-4 shrink-0 ${plan.featured ? 'text-white' : 'text-verdict'}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="m4 10 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {plan.name === 'Free' ? (
              <Link
                href={plan.href}
                className={`mt-8 inline-flex items-center justify-center rounded-xl px-5 py-3.5 text-[15px] font-semibold transition-colors ${buttonClass}`}
              >
                {plan.cta}
              </Link>
            ) : (
              <a
                href={plan.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => {
                  if (!isAuthenticated) {
                    event.preventDefault();
                    login('/pricing');
                  }
                }}
                className={`mt-8 inline-flex items-center justify-center rounded-xl px-5 py-3.5 text-[15px] font-semibold transition-colors ${buttonClass}`}
              >
                {plan.cta}
              </a>
            )}
          </article>
        );
      })}
    </div>
  );
}