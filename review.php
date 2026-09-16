<?php
declare(strict_types=1);

/**
 * TruthRouter AI
 * review.php  Verdict engine.
 *
 * Secures the inbound query, calls the consensus model over cURL using token
 * placeholders resolved at request time, instructs the model to return clean
 * HTML only, splits comparison queries into a two column verdict, sanitises
 * the model output and renders it inside the responsive shell.
 *
 * Product ownership: Novatratech SMC Private Limited.
 */

session_start();
mb_internal_encoding('UTF-8');

/* ===========================================================================
 * 1. Configuration
 * ======================================================================== */

const TR_BRAND    = 'TruthRouter AI';
const TR_KEYWORD  = 'Honest AI Consensus Verdict';
const TR_OWNER    = 'Novatratech SMC Private Limited';

/* Live consensus endpoint, routed through the agent router to Claude Opus 5. */
const TR_API_ENDPOINT   = 'https://api.anthropic.com/v1/messages';
const TR_API_MODEL      = 'claude-opus-5';
const TR_API_VERSION    = '2023-06-01';
const TR_API_TIMEOUT    = 45;
const TR_API_CONNECT    = 10;
const TR_MAX_QUERY_LEN  = 180;
const TR_MIN_QUERY_LEN  = 2;
const TR_RATE_LIMIT     = 25;      /* requests per window, per session */
const TR_RATE_WINDOW    = 3600;    /* window length in seconds */
const TR_CACHE_TTL      = 21600;   /* six hours */

/*
 * Secrets never sit inline. They are read from the environment and injected
 * into token placeholders below. Set these on the server, never in source:
 *
 *   export AGENT_ROUTER_API_KEY="sk-ant-your-real-key"
 *   export AGENT_ROUTER_API_SECRET="your-signing-secret"
 *
 * The legacy TRUTHROUTER_API_KEY / TRUTHROUTER_API_SECRET names are kept as a
 * fallback so existing deployments do not break on upgrade.
 */
$TR_API_KEY    = (string) (getenv('AGENT_ROUTER_API_KEY') ?: getenv('TRUTHROUTER_API_KEY') ?: 'sk-mock-agentrouter-000000000000');
$TR_API_SECRET = (string) (getenv('AGENT_ROUTER_API_SECRET') ?: getenv('TRUTHROUTER_API_SECRET') ?: 'rs-mock-agentrouter-000000000000');

/* Header and payload templates using safe replacement tokens. Anthropic style
 * auth: the key rides in x-api-key, not a Bearer token. */
const TR_TPL_AUTH_HEADER   = 'x-api-key: {{TR_API_KEY}}';
const TR_TPL_SIGN_HEADER   = 'X-TruthRouter-Signature: {{TR_API_SECRET}}';
const TR_TPL_CLIENT_HEADER = 'X-TruthRouter-Client: {{TR_BRAND}}/1.0';

header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');

/* ===========================================================================
 * 2. Helpers
 * ======================================================================== */

function tr_e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Normalises and secures raw user input before it ever reaches the model.
 */
function tr_secure_query(string $raw): string
{
    $clean = strip_tags($raw);
    $clean = str_replace(["\r", "\n", "\t", "\0"], ' ', $clean);
    $clean = preg_replace('/[^\p{L}\p{N}\s\.\,\'\&\+\-\/\(\)\:\?]/u', ' ', $clean) ?? '';
    $clean = preg_replace('/\s+/u', ' ', $clean) ?? '';
    $clean = trim($clean);

    if (mb_strlen($clean) > TR_MAX_QUERY_LEN) {
        $clean = mb_substr($clean, 0, TR_MAX_QUERY_LEN);
    }

    return $clean;
}

/**
 * Session bound rate limiting so a single visitor cannot drain the model budget.
 */
function tr_rate_limit_ok(): bool
{
    $now = time();
    if (!isset($_SESSION['tr_hits']) || !is_array($_SESSION['tr_hits'])) {
        $_SESSION['tr_hits'] = [];
    }

    $_SESSION['tr_hits'] = array_values(array_filter(
        $_SESSION['tr_hits'],
        static fn($stamp): bool => is_int($stamp) && ($now - $stamp) < TR_RATE_WINDOW
    ));

    if (count($_SESSION['tr_hits']) >= TR_RATE_LIMIT) {
        return false;
    }

    $_SESSION['tr_hits'][] = $now;
    return true;
}

function tr_cache_dir(): string
{
    $dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'truthrouter_cache';
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    return $dir;
}

function tr_cache_get(string $key): ?string
{
    $file = tr_cache_dir() . DIRECTORY_SEPARATOR . $key . '.html';
    if (!is_readable($file)) {
        return null;
    }
    if ((time() - (int) filemtime($file)) > TR_CACHE_TTL) {
        @unlink($file);
        return null;
    }
    $data = file_get_contents($file);
    return ($data === false || $data === '') ? null : $data;
}

function tr_cache_put(string $key, string $html): void
{
    $file = tr_cache_dir() . DIRECTORY_SEPARATOR . $key . '.html';
    @file_put_contents($file, $html, LOCK_EX);
}

/**
 * Detects a comparison request and returns the two sides when present.
 */
function tr_split_comparison(string $query): array
{
    $keywords = ['\bvs\.?\b', '\bversus\b', '\bcompared to\b', '\bcompare\b', '\bor\b', '\bagainst\b', '\bbetween\b'];
    $pattern  = '/\s(?:' . implode('|', $keywords) . ')\s/i';

    $lead = preg_replace('/^\s*(compare|comparison of|which is better|difference between)\s+/i', '', $query) ?? $query;
    $lead = trim($lead);

    $parts = preg_split($pattern, $lead, 2);
    if (!is_array($parts) || count($parts) !== 2) {
        return ['is_comparison' => false, 'left' => $query, 'right' => ''];
    }

    $left  = trim((string) $parts[0], " \t,.");
    $right = trim((string) $parts[1], " \t,.?");

    if (mb_strlen($left) < 2 || mb_strlen($right) < 2) {
        return ['is_comparison' => false, 'left' => $query, 'right' => ''];
    }

    return ['is_comparison' => true, 'left' => $left, 'right' => $right];
}

/**
 * Allow list sanitiser for model authored HTML.
 */
function tr_sanitize_html(string $html): string
{
    $html = preg_replace('#<\s*(script|style|iframe|object|embed|form|link|meta|base)\b[^>]*>.*?<\s*/\s*\1\s*>#is', '', $html) ?? '';
    $html = preg_replace('#<\s*(script|style|iframe|object|embed|form|link|meta|base)\b[^>]*/?>#is', '', $html) ?? '';

    $allowed = '<div><section><article><header><p><span><h2><h3><h4><h5><strong><b><em><i><ul><ol><li><table><thead><tbody><tr><th><td><br><hr><small><blockquote><a>';
    $html = strip_tags($html, $allowed);

    $html = preg_replace('#\s+on[a-z]+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)#is', '', $html) ?? '';
    $html = preg_replace('#\s+(href|src)\s*=\s*("|\')\s*(javascript|data|vbscript)\s*:[^"\']*\2#is', ' href="#"', $html) ?? '';
    $html = preg_replace('#<a\b#i', '<a rel="nofollow noopener" target="_blank"', $html) ?? '';
    $html = preg_replace('#```(?:html)?#i', '', $html) ?? '';

    return trim($html);
}

/**
 * Builds the system prompt with token replacement rather than interpolation.
 */
function tr_build_system_prompt(bool $isComparison): string
{
    $base = <<<'PROMPT'
You are the consensus engine behind {{BRAND}}, a consumer research platform owned by {{OWNER}}.
Your single job is to produce the {{KEYWORD}} for the product a buyer names.

Evidence rules.
Weigh verified purchase reviews, long term owner threads, repair and teardown reports, warranty and return patterns, and independent lab testing. Discount incentivised reviews, launch window hype, press day impressions and anything written before the product was used for a meaningful period. Where the evidence genuinely conflicts, say so instead of inventing a clean answer. Never state a specification you are not confident about, and never invent prices, dates or review counts. Prefer the failures that appear after the return window has closed, because those are what a buyer cannot discover alone.

Voice rules.
Write plainly for a buyer with no technical background. Lead with the pitfall, not the praise. State clearly who should buy it, who should not, and when waiting is the honest answer. No marketing adjectives, no hedging filler, no apologies.

Output rules.
Return pure HTML only. No markdown, no code fences, no backticks, no commentary before or after the HTML.
Use only these tags: div, section, h2, h3, h4, p, span, ul, ol, li, table, thead, tbody, tr, th, td, strong, em, hr, small.
Style exclusively with inline Tailwind utility classes. Use text-[#0E1420] for body ink, text-[#5A6678] for secondary text, text-[#1B39FF] for the verdict accent, text-[#B45309] for pitfall emphasis, bg-[#F1F3F8] for panels, and border-[#0E1420]/12 for borders. Use rounded-2xl for panels and keep every block responsive with grid-cols-1 on small screens.
Do not output html, head, body, script, style or img tags.
PROMPT;

    $single = <<<'PROMPT'

Structure for a single product verdict.
Open with a section containing an h2 holding the product name, then one short paragraph stating the {{KEYWORD}} in a single sentence.
Follow with a verdict panel showing the call in strong text, one of Strong buy, Buy with caution, Mixed consensus, or Avoid for now, plus a one line reason and a plain language confidence note.
Then a section titled What owners actually report, holding four to six list items, each naming a concrete recurring experience.
Then a section titled The real pitfalls, holding three to six list items. Each item begins with a short bold failure name, then one sentence describing when it shows up and how often it is reported.
Then a section titled Who should buy it and who should not, holding two short paragraphs.
Then a section titled Better paths, listing two or three alternatives with one line each on why the alternative answers the pitfall.
Close with a small paragraph noting the verdict reflects the aggregate of public buyer reports read by {{BRAND}} and is research, not purchase advice.
PROMPT;

    $compare = <<<'PROMPT'

Structure for a head to head comparison.
The buyer has named two products. Cover both with equal rigour and never favour one because it is better known.
Open with a section containing an h2 naming both products, then one paragraph stating the {{KEYWORD}} on the matchup in a single sentence.
Then a comparison table with a header row and rows covering build and reliability, everyday performance, the pitfall owners hit most, running and repair cost, and software or support life. Keep every cell to one short sentence.
Then two sections side by side inside a div using grid grid-cols-1 md:grid-cols-2 gap-5, one for each product, each holding an h3 with the product name, a short verdict line, and a list of three to five specific pitfalls drawn from owner reports.
Then a section titled The deciding factor, holding one paragraph naming the single difference that should settle the choice for most buyers, and a second paragraph naming the buyer for whom the opposite choice is correct.
Close with a small paragraph noting the verdict reflects the aggregate of public buyer reports read by {{BRAND}} and is research, not purchase advice.
PROMPT;

    $template = $base . ($isComparison ? $compare : $single);

    return str_replace(
        ['{{BRAND}}', '{{KEYWORD}}', '{{OWNER}}'],
        [TR_BRAND, TR_KEYWORD, TR_OWNER],
        $template
    );
}

function tr_build_user_prompt(array $split, string $query): string
{
    if ($split['is_comparison']) {
        $template = 'Produce the {{KEYWORD}} comparing {{LEFT}} against {{RIGHT}}. Break down the real pitfalls of each based on web consensus, then state which one a typical buyer should choose and why.';
        return str_replace(
            ['{{KEYWORD}}', '{{LEFT}}', '{{RIGHT}}'],
            [TR_KEYWORD, $split['left'], $split['right']],
            $template
        );
    }

    $template = 'Produce the {{KEYWORD}} for {{QUERY}}. Break down the real pitfalls based on web consensus, and state plainly whether it is worth buying today.';
    return str_replace(['{{KEYWORD}}', '{{QUERY}}'], [TR_KEYWORD, $query], $template);
}

/**
 * Calls the consensus endpoint over cURL and returns the raw model HTML.
 *
 * @return array{ok:bool, html:string, error:string, status:int}
 */
function tr_call_consensus_api(string $systemPrompt, string $userPrompt, string $apiKey, string $apiSecret): array
{
    $headers = [
        str_replace('{{TR_API_KEY}}', $apiKey, TR_TPL_AUTH_HEADER),
        str_replace('{{TR_API_SECRET}}', hash_hmac('sha256', $userPrompt, $apiSecret), TR_TPL_SIGN_HEADER),
        str_replace('{{TR_BRAND}}', TR_BRAND, TR_TPL_CLIENT_HEADER),
        'anthropic-version: ' . TR_API_VERSION,
        'Content-Type: application/json',
        'Accept: application/json',
    ];

    $payload = [
        'model'       => TR_API_MODEL,
        'max_tokens'  => 2600,
        'temperature' => 0.2,
        'system'      => $systemPrompt,
        'messages'    => [
            ['role' => 'user', 'content' => $userPrompt],
        ],
    ];

    $body = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($body === false) {
        return ['ok' => false, 'html' => '', 'error' => 'The request could not be encoded. Try a shorter product name.', 'status' => 0];
    }

    $ch = curl_init(TR_API_ENDPOINT);
    if ($ch === false) {
        return ['ok' => false, 'html' => '', 'error' => 'The routing client failed to start. Refresh and try again.', 'status' => 0];
    }

    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => TR_API_TIMEOUT,
        CURLOPT_CONNECTTIMEOUT => TR_API_CONNECT,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_ENCODING       => '',
        CURLOPT_USERAGENT      => TR_BRAND . ' Consensus Router/1.0',
    ]);

    $response = curl_exec($ch);
    $status   = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($response === false || $response === '') {
        $detail = $curlErr !== '' ? $curlErr : 'no response body';
        error_log('[TruthRouter] transport failure: ' . $detail);
        return ['ok' => false, 'html' => '', 'error' => 'The consensus router did not respond. Run the search again in a moment.', 'status' => $status];
    }

    if ($status === 429) {
        return ['ok' => false, 'html' => '', 'error' => 'The router is at capacity right now. Wait a minute and run the verdict again.', 'status' => $status];
    }

    if ($status < 200 || $status >= 300) {
        error_log('[TruthRouter] upstream status ' . $status);
        return ['ok' => false, 'html' => '', 'error' => 'The consensus router returned an error for this query. Try naming the product more specifically.', 'status' => $status];
    }

    $decoded = json_decode((string) $response, true);
    if (!is_array($decoded)) {
        return ['ok' => false, 'html' => '', 'error' => 'The router reply could not be read. Run the search again.', 'status' => $status];
    }

    /* Accept the common response shapes without assuming block ordering. */
    $html = '';
    if (isset($decoded['content']) && is_array($decoded['content'])) {
        foreach ($decoded['content'] as $block) {
            if (is_array($block) && ($block['type'] ?? '') === 'text' && isset($block['text'])) {
                $html .= (string) $block['text'];
            }
        }
    }
    if ($html === '' && isset($decoded['choices'][0]['message']['content'])) {
        $html = (string) $decoded['choices'][0]['message']['content'];
    }
    if ($html === '' && isset($decoded['output_text'])) {
        $html = (string) $decoded['output_text'];
    }
    if ($html === '' && isset($decoded['verdict_html'])) {
        $html = (string) $decoded['verdict_html'];
    }

    if (trim($html) === '') {
        return ['ok' => false, 'html' => '', 'error' => 'No consensus could be assembled for that query. Try the full product name with its model year.', 'status' => $status];
    }

    return ['ok' => true, 'html' => $html, 'error' => '', 'status' => $status];
}

/* ===========================================================================
 * 3. Request handling
 * ======================================================================== */

$rawQuery   = isset($_GET['q']) ? (string) $_GET['q'] : '';
$query      = tr_secure_query($rawQuery);
$split      = ['is_comparison' => false, 'left' => $query, 'right' => ''];
$verdictHtml = '';
$errorText   = '';
$fromCache   = false;

if ($query === '') {
    $errorText = 'Name a product to run a verdict on. A model number or model year makes the result sharper.';
} elseif (mb_strlen($query) < TR_MIN_QUERY_LEN) {
    $errorText = 'That query is too short to route. Type the full product name.';
} elseif (!tr_rate_limit_ok()) {
    $errorText = 'You have reached the hourly search limit for this session. The counter resets within the hour.';
} else {
    $split    = tr_split_comparison($query);
    $cacheKey = hash('sha256', mb_strtolower($query) . '|' . TR_API_MODEL . '|' . ($split['is_comparison'] ? 'cmp' : 'one'));

    $cached = tr_cache_get($cacheKey);
    if ($cached !== null) {
        $verdictHtml = $cached;
        $fromCache   = true;
    } else {
        $result = tr_call_consensus_api(
            tr_build_system_prompt((bool) $split['is_comparison']),
            tr_build_user_prompt($split, $query),
            $TR_API_KEY,
            $TR_API_SECRET
        );

        if ($result['ok']) {
            $verdictHtml = tr_sanitize_html($result['html']);
            if ($verdictHtml === '') {
                $errorText = 'The verdict came back empty after safety filtering. Run the search again.';
            } else {
                tr_cache_put($cacheKey, $verdictHtml);
            }
        } else {
            $errorText = $result['error'];
        }
    }
}

$pageTitle = $query !== ''
    ? $query . ' ' . TR_KEYWORD . ' | ' . TR_BRAND
    : TR_KEYWORD . ' | ' . TR_BRAND;

$pageDescription = $query !== ''
    ? 'The Honest AI Consensus Verdict on ' . $query . ', with the real pitfalls owners report, assembled by TruthRouter AI from public buyer consensus.'
    : 'Run any product through TruthRouter AI for the Honest AI Consensus Verdict and the pitfalls that surface after the return window closes.';
?>
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= tr_e($pageTitle) ?></title>
<meta name="description" content="<?= tr_e($pageDescription) ?>">
<meta name="robots" content="<?= $verdictHtml !== '' ? 'index, follow' : 'noindex, follow' ?>">
<meta property="og:title" content="<?= tr_e($pageTitle) ?>">
<meta property="og:description" content="<?= tr_e($pageDescription) ?>">
<meta property="og:type" content="article">
<meta name="theme-color" content="#0E1420">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: { ink: '#0E1420', slate2: '#5A6678', verdict: '#1B39FF', pitfall: '#B45309', surface: '#F1F3F8' },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  }
};
</script>
<style>
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
  :focus-visible { outline: 3px solid #1B39FF; outline-offset: 3px; }
  .tr-output h2 { font-family: '"Bricolage Grotesque"', sans-serif; font-size: 30px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.12; color: #0E1420; margin-top: 0; }
  .tr-output h3 { font-size: 20px; font-weight: 700; color: #0E1420; margin-top: 28px; }
  .tr-output h4 { font-size: 17px; font-weight: 600; color: #0E1420; margin-top: 20px; }
  .tr-output p { font-size: 16px; line-height: 1.7; color: #5A6678; margin-top: 12px; }
  .tr-output ul, .tr-output ol { margin-top: 14px; padding-left: 20px; }
  .tr-output ul { list-style: disc; }
  .tr-output ol { list-style: decimal; }
  .tr-output li { font-size: 16px; line-height: 1.7; color: #5A6678; margin-top: 8px; }
  .tr-output li strong, .tr-output p strong { color: #0E1420; font-weight: 600; }
  .tr-output section { margin-top: 34px; }
  .tr-output hr { margin: 28px 0; border-color: rgba(14,20,32,0.12); }
  .tr-output table { width: 100%; border-collapse: collapse; margin-top: 18px; display: block; overflow-x: auto; }
  .tr-output th, .tr-output td { border: 1px solid rgba(14,20,32,0.12); padding: 12px 14px; text-align: left; font-size: 15px; line-height: 1.6; color: #5A6678; vertical-align: top; }
  .tr-output th { background: #F1F3F8; color: #0E1420; font-weight: 600; }
  .tr-output a { color: #1B39FF; text-decoration: underline; }
  .tr-output small { font-size: 13px; color: #5A6678; }
</style>
</head>
<body class="bg-white font-sans text-ink antialiased selection:bg-verdict selection:text-white">

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
    <a href="index.php" class="rounded-[10px] border border-ink/12 px-4 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:border-verdict/40 hover:text-verdict">New search</a>
  </div>
</header>

<main class="mx-auto w-full max-w-4xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">

  <form action="review.php" method="get" role="search" aria-label="<?= tr_e(TR_KEYWORD) ?> search" class="rounded-2xl border border-ink/12 bg-white p-2 shadow-[0_18px_44px_-30px_rgba(14,20,32,0.5)] focus-within:border-verdict/50">
    <div class="flex flex-col gap-2 sm:flex-row">
      <div class="flex flex-1 items-center gap-3 rounded-xl bg-surface px-4 py-3">
        <svg viewBox="0 0 24 24" class="h-5 w-5 shrink-0 text-slate2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.2-3.2"></path>
        </svg>
        <label for="q" class="sr-only">Product to run through <?= tr_e(TR_BRAND) ?></label>
        <input id="q" name="q" type="search" required maxlength="<?= (int) TR_MAX_QUERY_LEN ?>" autocomplete="off" value="<?= tr_e($query) ?>"
               placeholder="Name a product, or put two head to head with vs"
               class="w-full border-0 bg-transparent p-0 text-[16px] font-medium text-ink placeholder:font-normal placeholder:text-slate2/70 focus:ring-0">
      </div>
      <button type="submit" class="rounded-xl bg-verdict px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-ink">Run the verdict</button>
    </div>
  </form>

  <?php if ($query !== ''): ?>
    <div class="mt-9">
      <p class="text-[13px] font-medium text-slate2"><?= $split['is_comparison'] ? 'Head to head verdict' : 'Single product verdict' ?></p>
      <h1 class="mt-2 font-display text-[32px] font-extrabold leading-[1.08] tracking-[-0.025em] sm:text-[42px]">
        <?php if ($split['is_comparison']): ?>
          <?= tr_e($split['left']) ?> against <?= tr_e($split['right']) ?>
        <?php else: ?>
          <?= tr_e($query) ?>
        <?php endif; ?>
      </h1>
      <p class="mt-3 max-w-2xl text-[16px] leading-relaxed text-slate2">
        The <?= tr_e(TR_KEYWORD) ?> below was assembled by <?= tr_e(TR_BRAND) ?> from public buyer reports, owner threads and independent testing, with the recurring pitfalls stated first.
      </p>
      <?php if ($fromCache): ?>
        <p class="mt-3 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-[13px] font-medium text-slate2">Served from the verdict index, refreshed within the last six hours</p>
      <?php endif; ?>
    </div>
  <?php endif; ?>

  <?php if ($errorText !== ''): ?>
    <section class="mt-8 rounded-2xl border border-pitfall/25 bg-pitfall/5 p-6" role="alert">
      <h2 class="font-display text-[20px] font-bold text-pitfall">The verdict did not run</h2>
      <p class="mt-2 text-[16px] leading-relaxed text-ink/80"><?= tr_e($errorText) ?></p>
      <p class="mt-4 text-[15px] text-slate2">Try the full product name with its model year, or put two products head to head using vs.</p>
      <a href="index.php" class="mt-5 inline-flex rounded-xl bg-ink px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-verdict">Back to search</a>
    </section>
  <?php endif; ?>

  <?php if ($verdictHtml !== ''): ?>
    <article class="tr-output mt-8 rounded-2xl border border-ink/12 bg-white p-6 sm:p-9">
      <?= $verdictHtml ?>
    </article>

    <section class="mt-6 rounded-2xl bg-surface p-6 sm:p-8">
      <h2 class="font-display text-[19px] font-bold">How to read this verdict</h2>
      <p class="mt-2 text-[15px] leading-relaxed text-slate2">
        An <?= tr_e(TR_KEYWORD) ?> weights long term ownership over launch impressions, discounts incentivised reviews, and reports the failure pattern rather than the average score. <?= tr_e(TR_BRAND) ?> takes no payment from any manufacturer or retailer, and <?= tr_e(TR_OWNER) ?> funds the platform directly.
      </p>
      <p class="mt-3 text-[15px] leading-relaxed text-slate2">Treat this as research toward your own decision rather than purchase advice, and confirm current pricing, warranty terms and regional model differences before you buy.</p>
    </section>
  <?php endif; ?>

</main>

<footer class="border-t border-ink/10 bg-white">
  <div class="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8">
    <div class="grid grid-cols-2 gap-10 md:grid-cols-4">
      <div class="col-span-2">
        <span class="font-display text-[18px] font-extrabold tracking-tight">TruthRouter<span class="text-verdict"> AI</span></span>
        <p class="mt-3 max-w-sm text-[15px] leading-relaxed text-slate2">Every product has a flaw. We route you to it. Independent consumer research delivering the Honest AI Consensus Verdict.</p>
        <p class="mt-4 text-[14px] font-medium text-ink">A product of <?= tr_e(TR_OWNER) ?></p>
      </div>
      <div>
        <h2 class="text-[14px] font-semibold text-ink">Product</h2>
        <p class="mt-4 text-[15px] text-slate2"><a class="hover:text-verdict" href="index.php">Verdict search</a></p>
        <p class="mt-2.5 text-[15px] text-slate2"><a class="hover:text-verdict" href="index.php#trending">Trending verdicts</a></p>
        <p class="mt-2.5 text-[15px] text-slate2"><a class="hover:text-verdict" href="index.php#how">Verdict method</a></p>
      </div>
      <div>
        <h2 class="text-[14px] font-semibold text-ink">Legal</h2>
        <p class="mt-4 text-[15px] text-slate2"><a class="hover:text-verdict" href="#">Privacy policy</a></p>
        <p class="mt-2.5 text-[15px] text-slate2"><a class="hover:text-verdict" href="#">Terms of use</a></p>
        <p class="mt-2.5 text-[15px] text-slate2"><a class="hover:text-verdict" href="#">Report a wrong verdict</a></p>
      </div>
    </div>
    <div class="mt-12 flex flex-col gap-2 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-[13px] text-slate2">Copyright <?= tr_e(date('Y')) ?> <?= tr_e(TR_OWNER) ?>. <?= tr_e(TR_BRAND) ?> and the Honest AI Consensus Verdict are products of <?= tr_e(TR_OWNER) ?>. All rights reserved.</p>
      <p class="text-[13px] text-slate2">Engineered by <a class="font-medium text-ink hover:text-verdict" href="https://github.com/rabeeanaseer" target="_blank" rel="noopener">Rabeea Naseer</a></p>
    </div>
  </div>
</footer>

</body>
</html>
