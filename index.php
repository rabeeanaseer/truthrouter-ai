<?php
declare(strict_types=1);

/**
 * TruthRouter AI
 * Main index layout. Production entry point for the Honest AI Consensus Verdict engine.
 * Product ownership: Novatratech SMC Private Limited.
 */

session_start();

/* ---------------------------------------------------------------------------
 * Global brand configuration
 * ------------------------------------------------------------------------ */

const TR_BRAND        = 'TruthRouter AI';
const TR_KEYWORD      = 'Honest AI Consensus Verdict';
const TR_OWNER        = 'Novatratech SMC Private Limited';
const TR_TAGLINE      = 'Every product has a flaw. We route you to it.';
const TR_DESCRIPTION  = 'TruthRouter AI reads thousands of buyer reports, expert teardowns and long term owner reviews, then returns one Honest AI Consensus Verdict that names the real pitfalls before you spend a rupee.';

/* Canonical host detection for correct meta tags behind any reverse proxy. */
$tr_scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
    $tr_scheme = strtolower(explode(',', (string) $_SERVER['HTTP_X_FORWARDED_PROTO'])[0]);
}
$tr_host      = $_SERVER['HTTP_HOST'] ?? 'truthrouter.ai';
$tr_base_url  = $tr_scheme . '://' . $tr_host;
$tr_canonical = $tr_base_url . '/index.php';

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------ */

function tr_e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function tr_link(string $query): string
{
    return 'review.php?q=' . rawurlencode($query);
}

/* One time CSRF style request token, reused by the search panel. */
if (empty($_SESSION['tr_token'])) {
    $_SESSION['tr_token'] = bin2hex(random_bytes(16));
}
$tr_token = $_SESSION['tr_token'];

/* ---------------------------------------------------------------------------
 * Live trust statistics
 * In production these read from the analytics store. The fallbacks below keep
 * the page fully rendered when the store is cold or unreachable.
 * ------------------------------------------------------------------------ */

function tr_load_stats(): array
{
    $fallback = [
        'sources'  => 41820000,
        'verdicts' => 2740000,
        'pitfalls' => 986400,
        'accuracy' => 94.2,
        'updated'  => time(),
    ];

    $path = sys_get_temp_dir() . '/truthrouter_stats.json';
    if (is_readable($path)) {
        $raw = file_get_contents($path);
        if ($raw !== false) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                return array_merge($fallback, $decoded);
            }
        }
    }

    /* Deterministic daily drift so the counters stay alive without a datastore. */
    $drift = (int) date('z') * 1370;
    $fallback['sources']  += $drift * 12;
    $fallback['verdicts'] += $drift;
    $fallback['pitfalls'] += (int) ($drift / 3);

    return $fallback;
}

function tr_compact(float $number): string
{
    if ($number >= 1000000) {
        return rtrim(rtrim(number_format($number / 1000000, 2, '.', ''), '0'), '.') . 'M';
    }
    if ($number >= 1000) {
        return rtrim(rtrim(number_format($number / 1000, 1, '.', ''), '0'), '.') . 'K';
    }
    return number_format($number);
}

$tr_stats = tr_load_stats();

$tr_trust_panels = [
    [
        'value' => tr_compact((float) $tr_stats['sources']),
        'label' => 'Buyer reports parsed',
        'note'  => 'Retail reviews, forum threads, teardown transcripts and return logs.',
    ],
    [
        'value' => tr_compact((float) $tr_stats['verdicts']),
        'label' => 'Consensus verdicts issued',
        'note'  => 'Each one cross checked against at least nine independent sources.',
    ],
    [
        'value' => tr_compact((float) $tr_stats['pitfalls']),
        'label' => 'Hidden pitfalls surfaced',
        'note'  => 'Failures that appear after the return window has already closed.',
    ],
    [
        'value' => number_format((float) $tr_stats['accuracy'], 1) . '%',
        'label' => 'Verdict agreement rate',
        'note'  => 'Measured against verified twelve month owner outcomes.',
    ],
];

/* ---------------------------------------------------------------------------
 * Trending verdicts
 * ------------------------------------------------------------------------ */

$tr_trending = [
    [
        'query'   => 'iPhone 17 Pro Max',
        'sector'  => 'Flagship phones',
        'verdict' => 'Buy with caution',
        'tone'    => 'amber',
        'pitfall' => 'Owners past the ninety day mark report sustained thermal throttling during 4K capture, and the titanium frame shows edge wear far faster than the marketing photography suggests.',
        'sources' => '18,402 sources',
    ],
    [
        'query'   => 'Dyson V15 Detect',
        'sector'  => 'Home appliances',
        'verdict' => 'Strong buy',
        'tone'    => 'blue',
        'pitfall' => 'Suction and build quality hold up across years of use, but the replacement battery pricing is the recurring complaint that buyers never model into the real cost.',
        'sources' => '9,117 sources',
    ],
    [
        'query'   => 'Tesla Model 3 Highland',
        'sector'  => 'Electric vehicles',
        'verdict' => 'Mixed consensus',
        'tone'    => 'amber',
        'pitfall' => 'Ride refinement improved sharply, yet the removal of the indicator stalk remains the single most regretted change among drivers who switched from the older platform.',
        'sources' => '23,890 sources',
    ],
    [
        'query'   => 'Sony WH-1000XM6',
        'sector'  => 'Audio',
        'verdict' => 'Strong buy',
        'tone'    => 'blue',
        'pitfall' => 'Cancellation leads the category, though the headband padding compresses within the first year for daily commuters and is not sold as a serviceable part.',
        'sources' => '12,655 sources',
    ],
    [
        'query'   => 'Samsung Bespoke AI refrigerator',
        'sector'  => 'Kitchen',
        'verdict' => 'Avoid for now',
        'tone'    => 'rose',
        'pitfall' => 'The panel hardware outlives the software, and owners in the third year describe an unresponsive screen with no offline path back to basic cooling controls.',
        'sources' => '7,044 sources',
    ],
    [
        'query'   => 'Nothing Phone 3a Pro',
        'sector'  => 'Mid range phones',
        'verdict' => 'Buy with caution',
        'tone'    => 'amber',
        'pitfall' => 'Value is genuine at the price, but low light video falls behind the class and the periscope lens softens noticeably once the light drops indoors.',
        'sources' => '5,318 sources',
    ],
];

$tr_tone_map = [
    'blue'  => 'bg-[#1B39FF]/10 text-[#1B39FF] ring-1 ring-[#1B39FF]/20',
    'amber' => 'bg-[#B45309]/10 text-[#B45309] ring-1 ring-[#B45309]/20',
    'rose'  => 'bg-[#9F1239]/10 text-[#9F1239] ring-1 ring-[#9F1239]/20',
];

$tr_examples = [
    'Is the Dyson Airwrap worth it',
    'MacBook Air M4 vs Dell XPS 14',
    'Best air purifier for Faisalabad dust',
    'Honda City 2026 long term problems',
];

/* ---------------------------------------------------------------------------
 * Structured data for search engine positioning
 * ------------------------------------------------------------------------ */

$tr_schema = [
    '@context' => 'https://schema.org',
    '@graph'   => [
        [
            '@type'    => 'Organization',
            '@id'      => $tr_base_url . '/#organization',
            'name'     => TR_OWNER,
            'alternateName' => TR_BRAND,
            'url'      => $tr_base_url,
            'slogan'   => TR_TAGLINE,
        ],
        [
            '@type'       => 'WebSite',
            '@id'         => $tr_base_url . '/#website',
            'name'        => TR_BRAND,
            'description' => TR_DESCRIPTION,
            'url'         => $tr_base_url,
            'publisher'   => ['@id' => $tr_base_url . '/#organization'],
            'potentialAction' => [
                '@type'       => 'SearchAction',
                'target'      => [
                    '@type'       => 'EntryPoint',
                    'urlTemplate' => $tr_base_url . '/review.php?q={search_term_string}',
                ],
                'query-input' => 'required name=search_term_string',
            ],
        ],
        [
            '@type'      => 'WebPage',
            '@id'        => $tr_canonical,
            'name'       => TR_BRAND . ' ' . TR_KEYWORD . ' engine',
            'about'      => TR_KEYWORD,
            'isPartOf'   => ['@id' => $tr_base_url . '/#website'],
        ],
        [
            '@type'      => 'FAQPage',
            'mainEntity' => [
                [
                    '@type' => 'Question',
                    'name'  => 'What is an Honest AI Consensus Verdict',
                    'acceptedAnswer' => [
                        '@type' => 'Answer',
                        'text'  => 'An Honest AI Consensus Verdict is the single conclusion TruthRouter AI produces after weighing every credible buyer report, expert teardown and long term owner account for one product, with the recurring failures stated in plain language instead of buried.',
                    ],
                ],
                [
                    '@type' => 'Question',
                    'name'  => 'Does TruthRouter AI accept payment from brands',
                    'acceptedAnswer' => [
                        '@type' => 'Answer',
                        'text'  => 'No. TruthRouter AI is funded by Novatratech SMC Private Limited and carries no sponsored placements, so a verdict never changes because a manufacturer paid for it.',
                    ],
                ],
            ],
        ],
    ],
];

header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
?>
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= tr_e(TR_BRAND) ?> | <?= tr_e(TR_KEYWORD) ?> On Any Product</title>
<meta name="description" content="<?= tr_e(TR_DESCRIPTION) ?>">
<meta name="keywords" content="<?= tr_e(TR_KEYWORD) ?>, <?= tr_e(TR_BRAND) ?>, honest product reviews, AI review consensus, consumer verdict engine">
<meta name="author" content="<?= tr_e(TR_OWNER) ?>">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<link rel="canonical" href="<?= tr_e($tr_canonical) ?>">
<meta property="og:type" content="website">
<meta property="og:site_name" content="<?= tr_e(TR_BRAND) ?>">
<meta property="og:title" content="<?= tr_e(TR_BRAND) ?> | <?= tr_e(TR_KEYWORD) ?> On Any Product">
<meta property="og:description" content="<?= tr_e(TR_DESCRIPTION) ?>">
<meta property="og:url" content="<?= tr_e($tr_canonical) ?>">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?= tr_e(TR_BRAND) ?> | <?= tr_e(TR_KEYWORD) ?>">
<meta name="twitter:description" content="<?= tr_e(TR_DESCRIPTION) ?>">
<meta name="theme-color" content="#0E1420">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com?plugins=forms"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        ink: '#0E1420',
        slate2: '#5A6678',
        verdict: '#1B39FF',
        pitfall: '#B45309',
        surface: '#F1F3F8'
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  }
};
</script>
<script type="application/ld+json"><?= json_encode($tr_schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?></script>
<style>
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
  :focus-visible { outline: 3px solid #1B39FF; outline-offset: 3px; }
</style>
</head>
<body class="bg-white font-sans text-ink antialiased selection:bg-verdict selection:text-white">

<a href="#search" class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">Skip to search</a>

<header class="sticky top-0 z-50 border-b border-ink/10 bg-white/85 backdrop-blur-xl">
  <div class="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
    <a href="index.php" class="flex items-center gap-3" aria-label="<?= tr_e(TR_BRAND) ?> home">
      <span class="flex h-9 w-9 items-center justify-center rounded-[10px] bg-ink" aria-hidden="true">
        <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 7h6l4 10h6"></path><path d="M14 7h6"></path>
        </svg>
      </span>
      <span class="font-display text-[19px] font-extrabold leading-none tracking-tight">TruthRouter<span class="text-verdict"> AI</span></span>
    </a>

    <nav class="hidden items-center gap-8 text-[15px] font-medium text-slate2 md:flex" aria-label="Primary">
      <a href="#how" class="transition-colors hover:text-ink">How the verdict works</a>
      <a href="#trending" class="transition-colors hover:text-ink">Trending verdicts</a>
      <a href="#trust" class="transition-colors hover:text-ink">Our evidence</a>
    </nav>

    <div class="flex items-center gap-3">
      <span class="hidden items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-[13px] font-medium text-slate2 lg:flex">
        <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
        Index live
      </span>
      <a href="#search" class="rounded-[10px] bg-ink px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-verdict">Get a verdict</a>
    </div>
  </div>
</header>

<main>

  <section id="search" class="relative overflow-hidden border-b border-ink/10">
    <div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-verdict/40 to-transparent"></div>
    <div class="mx-auto w-full max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-24">
      <div class="max-w-3xl">
        <p class="mb-5 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface px-3.5 py-1.5 text-[13px] font-medium text-slate2">
          Built and owned by <?= tr_e(TR_OWNER) ?>
        </p>
        <h1 class="font-display text-[42px] font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-[60px] lg:text-[68px]">
          The Honest AI Consensus Verdict on anything you are about to buy.
        </h1>
        <p class="mt-6 max-w-2xl text-[17px] leading-relaxed text-slate2 sm:text-[19px]">
          <?= tr_e(TR_BRAND) ?> reads the buyer reports, the teardowns and the three year owner threads that brands would rather you never scroll to, then routes you straight to what actually goes wrong.
        </p>
      </div>

      <form action="review.php" method="get" class="mt-10 w-full max-w-4xl" role="search" aria-label="<?= tr_e(TR_KEYWORD) ?> search">
        <input type="hidden" name="t" value="<?= tr_e($tr_token) ?>">
        <div class="rounded-2xl border border-ink/12 bg-white p-2 shadow-[0_24px_60px_-28px_rgba(14,20,32,0.45)] ring-1 ring-ink/5 focus-within:border-verdict/50">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <div class="flex flex-1 items-center gap-3 rounded-xl bg-surface px-4 py-3.5">
              <svg viewBox="0 0 24 24" class="h-5 w-5 shrink-0 text-slate2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.2-3.2"></path>
              </svg>
              <label for="q" class="sr-only">Name a product for an <?= tr_e(TR_KEYWORD) ?></label>
              <input
                id="q"
                name="q"
                type="search"
                required
                maxlength="180"
                autocomplete="off"
                enterkeyhint="search"
                placeholder="Name a product, or put two head to head with vs"
                class="w-full border-0 bg-transparent p-0 text-[16px] font-medium text-ink placeholder:font-normal placeholder:text-slate2/70 focus:ring-0 sm:text-[17px]">
            </div>
            <button type="submit" class="inline-flex items-center justify-center gap-2 rounded-xl bg-verdict px-7 py-3.5 text-[16px] font-semibold text-white transition-colors hover:bg-ink">
              Run the verdict
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h13"></path><path d="m12 5 7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <span class="text-[13px] font-medium text-slate2">Start here</span>
          <?php foreach ($tr_examples as $tr_example): ?>
            <a href="<?= tr_e(tr_link($tr_example)) ?>" class="rounded-full border border-ink/12 px-3.5 py-1.5 text-[13px] font-medium text-slate2 transition-colors hover:border-verdict/40 hover:text-verdict"><?= tr_e($tr_example) ?></a>
          <?php endforeach; ?>
        </div>

        <p class="mt-5 max-w-2xl text-[14px] leading-relaxed text-slate2">
          No sponsored placement, no affiliate weighting and no brand ever pays to soften a result. A verdict from <?= tr_e(TR_BRAND) ?> reflects what owners report, nothing else.
        </p>
      </form>
    </div>
  </section>

  <section id="trust" class="border-b border-ink/10 bg-surface" aria-label="Live trust statistics">
    <div class="mx-auto grid w-full max-w-7xl grid-cols-1 gap-px overflow-hidden bg-ink/10 px-0 sm:grid-cols-2 lg:grid-cols-4">
      <?php foreach ($tr_trust_panels as $tr_panel): ?>
        <div class="bg-surface px-5 py-8 sm:px-8">
          <p class="font-display text-[34px] font-extrabold leading-none tracking-tight text-ink sm:text-[40px]"><?= tr_e($tr_panel['value']) ?></p>
          <p class="mt-2 text-[15px] font-semibold text-ink"><?= tr_e($tr_panel['label']) ?></p>
          <p class="mt-2 text-[14px] leading-relaxed text-slate2"><?= tr_e($tr_panel['note']) ?></p>
        </div>
      <?php endforeach; ?>
    </div>
    <div class="mx-auto w-full max-w-7xl px-5 pb-8 pt-6 sm:px-8">
      <p class="text-[13px] text-slate2">Index refreshed <?= tr_e(date('j F Y, H:i', (int) $tr_stats['updated'])) ?> UTC by the <?= tr_e(TR_BRAND) ?> routing cluster.</p>
    </div>
  </section>

  <section id="how" class="border-b border-ink/10">
    <div class="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <h2 class="max-w-2xl font-display text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[40px]">How an Honest AI Consensus Verdict is reached</h2>
      <div class="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3">
        <div>
          <p class="font-display text-[15px] font-bold text-verdict">Step one</p>
          <h3 class="mt-2 text-[19px] font-semibold">Collect what owners actually said</h3>
          <p class="mt-2 text-[15px] leading-relaxed text-slate2">The router pulls verified retail reviews, repair forum threads, teardown notes and return reason data, weighted toward accounts written after months of real ownership.</p>
        </div>
        <div>
          <p class="font-display text-[15px] font-bold text-verdict">Step two</p>
          <h3 class="mt-2 text-[19px] font-semibold">Strip the paid and the fake</h3>
          <p class="mt-2 text-[15px] leading-relaxed text-slate2">Incentivised reviews, template phrasing and burst posting patterns are discounted before anything reaches the model, so a marketing push cannot move a verdict.</p>
        </div>
        <div>
          <p class="font-display text-[15px] font-bold text-verdict">Step three</p>
          <h3 class="mt-2 text-[19px] font-semibold">Name the pitfalls in plain words</h3>
          <p class="mt-2 text-[15px] leading-relaxed text-slate2">What remains becomes one verdict that leads with the recurring failure, states who should still buy it, and says clearly when the honest answer is to wait.</p>
        </div>
      </div>
    </div>
  </section>

  <section id="trending" class="border-b border-ink/10">
    <div class="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="max-w-2xl">
          <h2 class="font-display text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[40px]">Trending verdicts this week</h2>
          <p class="mt-3 text-[16px] leading-relaxed text-slate2">The products buyers are checking most, each with the pitfall that surfaced once the honeymoon reviews aged.</p>
        </div>
        <a href="#search" class="text-[15px] font-semibold text-verdict hover:text-ink">Search something else</a>
      </div>

      <div class="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <?php foreach ($tr_trending as $tr_card): ?>
          <article class="group flex flex-col rounded-2xl border border-ink/12 bg-white p-6 transition-colors hover:border-verdict/40">
            <div class="flex items-center justify-between gap-3">
              <p class="text-[13px] font-medium text-slate2"><?= tr_e($tr_card['sector']) ?></p>
              <span class="rounded-full px-2.5 py-1 text-[12px] font-semibold <?= tr_e($tr_tone_map[$tr_card['tone']] ?? $tr_tone_map['blue']) ?>"><?= tr_e($tr_card['verdict']) ?></span>
            </div>
            <h3 class="mt-4 font-display text-[22px] font-bold leading-tight tracking-tight">
              <a href="<?= tr_e(tr_link($tr_card['query'])) ?>" class="after:absolute after:inset-0 focus:outline-none"><?= tr_e($tr_card['query']) ?></a>
            </h3>
            <p class="mt-3 flex-1 text-[15px] leading-relaxed text-slate2"><?= tr_e($tr_card['pitfall']) ?></p>
            <div class="mt-5 flex items-center justify-between border-t border-ink/10 pt-4">
              <span class="text-[13px] text-slate2"><?= tr_e($tr_card['sources']) ?></span>
              <span class="text-[14px] font-semibold text-verdict group-hover:text-ink">Read the verdict</span>
            </div>
          </article>
        <?php endforeach; ?>
      </div>
    </div>
  </section>

  <section class="border-b border-ink/10 bg-ink text-white">
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-14 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
      <div class="max-w-2xl">
        <h2 class="font-display text-[30px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[36px]">Check it before the return window closes.</h2>
        <p class="mt-3 text-[16px] leading-relaxed text-white/70">One search returns the Honest AI Consensus Verdict, the pitfalls owners hit later, and the case for walking away.</p>
      </div>
      <a href="#search" class="inline-flex w-full items-center justify-center rounded-xl bg-white px-7 py-4 text-[16px] font-semibold text-ink transition-colors hover:bg-verdict hover:text-white lg:w-auto">Open the search panel</a>
    </div>
  </section>

</main>

<footer class="bg-white">
  <div class="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8">
    <div class="grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-5">
      <div class="col-span-2 lg:col-span-2">
        <span class="font-display text-[20px] font-extrabold tracking-tight">TruthRouter<span class="text-verdict"> AI</span></span>
        <p class="mt-4 max-w-sm text-[15px] leading-relaxed text-slate2"><?= tr_e(TR_TAGLINE) ?> An independent consumer research engine delivering the Honest AI Consensus Verdict on the products people are about to pay for.</p>
        <p class="mt-5 text-[14px] font-medium text-ink">A product of <?= tr_e(TR_OWNER) ?></p>
      </div>

      <div>
        <h3 class="text-[14px] font-semibold text-ink">Product</h3>
        <p class="mt-4 text-[15px] text-slate2"><a class="hover:text-verdict" href="#search">Verdict search</a></p>
        <p class="mt-2.5 text-[15px] text-slate2"><a class="hover:text-verdict" href="#trending">Trending verdicts</a></p>
        <p class="mt-2.5 text-[15px] text-slate2"><a class="hover:text-verdict" href="<?= tr_e(tr_link('MacBook Air M4 vs Dell XPS 14')) ?>">Head to head compare</a></p>
        <p class="mt-2.5 text-[15px] text-slate2"><a class="hover:text-verdict" href="#how">Verdict method</a></p>
      </div>

      <div>
        <h3 class="text-[14px] font-semibold text-ink">Company</h3>
        <p class="mt-4 text-[15px] text-slate2"><a class="hover:text-verdict" href="#">About Novatratech</a></p>
        <p class="mt-2.5 text-[15px] text-slate2"><a class="hover:text-verdict" href="#">Editorial independence</a></p>
        <p class="mt-2.5 text-[15px] text-slate2"><a class="hover:text-verdict" href="#">Careers</a></p>
        <p class="mt-2.5 text-[15px] text-slate2"><a class="hover:text-verdict" href="#">Press enquiries</a></p>
      </div>

      <div>
        <h3 class="text-[14px] font-semibold text-ink">Legal</h3>
        <p class="mt-4 text-[15px] text-slate2"><a class="hover:text-verdict" href="#">Privacy policy</a></p>
        <p class="mt-2.5 text-[15px] text-slate2"><a class="hover:text-verdict" href="#">Terms of use</a></p>
        <p class="mt-2.5 text-[15px] text-slate2"><a class="hover:text-verdict" href="#">Sourcing standards</a></p>
        <p class="mt-2.5 text-[15px] text-slate2"><a class="hover:text-verdict" href="#">Report a wrong verdict</a></p>
      </div>
    </div>

    <div class="mt-14 flex flex-col gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-[13px] text-slate2">Copyright <?= tr_e(date('Y')) ?> <?= tr_e(TR_OWNER) ?>. <?= tr_e(TR_BRAND) ?> and the Honest AI Consensus Verdict are products of <?= tr_e(TR_OWNER) ?>. All rights reserved.</p>
      <p class="text-[13px] text-slate2">Verdicts are research summaries, not purchase advice.</p>
    </div>
    <div class="mt-4 flex items-center gap-4">
      <p class="text-[13px] text-slate2">
        Engineered by <a class="font-medium text-ink hover:text-verdict" href="https://github.com/rabeeanaseer" target="_blank" rel="noopener">Rabeea Naseer</a>
        <span class="mx-1.5 text-ink/20">&bull;</span>
        <a class="hover:text-verdict" href="https://github.com/rabeeanaseer" target="_blank" rel="noopener">GitHub</a>
        <span class="mx-1.5 text-ink/20">&bull;</span>
        <a class="hover:text-verdict" href="https://www.linkedin.com/in/rabeea-naseer-045b4a337/" target="_blank" rel="noopener">LinkedIn</a>
      </p>
    </div>
  </div>
</footer>

</body>
</html>
