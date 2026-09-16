<div align="center">

<h1>TruthRouter AI</h1>

<p><strong>Every product has a flaw. We route you to it.</strong></p>

<p>An AI consumer review search engine that reads public buyer consensus and returns one <strong>Honest AI Consensus Verdict</strong>, with the real pitfalls stated before the praise.</p>

<p>
<img alt="PHP" src="https://img.shields.io/badge/PHP-8.1%2B-777BB4?style=for-the-badge&logo=php&logoColor=white">
<img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white">
<img alt="cURL" src="https://img.shields.io/badge/cURL-native-073551?style=for-the-badge&logo=curl&logoColor=white">
<img alt="License" src="https://img.shields.io/badge/License-MIT-1B39FF?style=for-the-badge">
</p>

<p>
<img alt="Build" src="https://img.shields.io/badge/build-passing-22C55E?style=flat-square">
<img alt="Dependencies" src="https://img.shields.io/badge/dependencies-zero-0E1420?style=flat-square">
<img alt="Files" src="https://img.shields.io/badge/core%20files-2-5A6678?style=flat-square">
<img alt="SEO" src="https://img.shields.io/badge/schema.org-structured%20data-B45309?style=flat-square">
<img alt="Responsive" src="https://img.shields.io/badge/responsive-mobile%20first-5A6678?style=flat-square">
<img alt="PRs" src="https://img.shields.io/badge/PRs-welcome-1B39FF?style=flat-square">
<img alt="Maintained" src="https://img.shields.io/badge/maintained-yes-22C55E?style=flat-square">
</p>

<p><sub>A product of <strong>Novatratech SMC Private Limited</strong></sub></p>

</div>

---

## Demo

<div align="center">

<!-- Drop your video here. GitHub plays MP4 and MOV inline when you drag the file
     into a README edit box or an issue comment, then paste the generated URL below.
     Replace the src with that URL. Keep the file under 10MB for inline playback. -->

https://github.com/YOUR_USERNAME/truthrouter-ai/assets/000000/your-demo-video.mp4

<sub>Searching a product, running the verdict, and a head to head comparison.</sub>

</div>

---

## What it does

TruthRouter AI takes any product name and returns a single verdict built from public buyer consensus rather than a star average. It weights long term ownership reports over launch week impressions, discounts incentivised and template reviews, and leads with the failure pattern that shows up after the return window has already closed.

Type two products with `vs` and the engine switches to a head to head layout automatically, with a comparison table and a paired pitfall breakdown for each side.

## Features

| | |
|---|---|
| **Verdict engine** | Single product and head to head comparison modes, selected automatically from the query |
| **Comparison parser** | Detects `vs`, `versus`, `compared to`, `against`, `between` and `or`, and strips lead-ins like `which is better` |
| **Prompt architecture** | Two full system prompts with fixed evidence rules, voice rules and output structure, built through token replacement |
| **Pure HTML output** | The model returns styled HTML only, no markdown, no code fences, no post-processing guesswork |
| **Output sanitiser** | Tag allow list, event handler stripping, `javascript:` and `data:` URI neutralising, forced `rel="nofollow noopener"` |
| **Input security** | Unicode safe character allow list, length clamping, tag stripping, control character removal |
| **Rate limiting** | Session bound sliding window, 25 requests per hour by default |
| **Disk cache** | Six hour verdict cache keyed by query, model and mode, so repeat searches never re-bill the API |
| **Resilient parsing** | Accepts `content` blocks, `choices[].message.content`, `output_text` and flat shapes without assuming block order |
| **Error handling** | Every transport, timeout, 429, non-2xx, malformed JSON and empty body case renders a directed error card |
| **SEO layer** | Organization, WebSite with SearchAction, WebPage and FAQPage structured data, canonical URLs, Open Graph and Twitter cards, dynamic per-query meta |
| **Live trust stats** | Reads from the analytics store and degrades to deterministic daily drift when the store is cold |
| **Accessibility** | Skip link, visible focus rings, reduced motion respected, labelled search landmarks |

## Stack

Pure PHP 8.1 with no framework, no Composer and no build step. Tailwind CSS via CDN with an inline theme config. Native cURL for the model call. Two files, one deploy.

## Quick start

```bash
git clone https://github.com/YOUR_USERNAME/truthrouter-ai.git
cd truthrouter-ai
php -S localhost:8000
```

Open `http://localhost:8000` and run a search.

## Configuration

TruthRouter AI ships wired to **Claude Opus 5** through an agent router endpoint, using the Anthropic Messages API shape. Set your credentials as environment variables rather than editing the source, so a key never reaches your Git history.

```bash
export AGENT_ROUTER_API_KEY="sk-ant-your-real-key"
export AGENT_ROUTER_API_SECRET="your-signing-secret"
```

The legacy `TRUTHROUTER_API_KEY` and `TRUTHROUTER_API_SECRET` names are still read as a fallback, so older deployments keep working on upgrade.

```php
const TR_API_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const TR_API_MODEL    = 'claude-opus-5';
const TR_API_VERSION  = '2023-06-01';
const TR_TPL_AUTH_HEADER = 'x-api-key: {{TR_API_KEY}}';
```

The key rides in the `x-api-key` header rather than a Bearer token, and `anthropic-version` is sent alongside it inside `tr_call_consensus_api`. Swap `TR_API_ENDPOINT` for your own agent router URL if you are proxying the request rather than calling Anthropic directly, the payload shape and header names stay the same as long as the router speaks the Messages API.

**Switching to OpenAI or OpenRouter instead**

```php
const TR_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const TR_API_MODEL    = 'gpt-4.1';
const TR_TPL_AUTH_HEADER = 'Authorization: Bearer {{TR_API_KEY}}';
```

Move the system prompt into the messages array and delete the top level `system` key.

```php
'messages' => [
    ['role' => 'system', 'content' => $systemPrompt],
    ['role' => 'user',   'content' => $userPrompt],
],
```

### Tunables

| Constant | Default | Purpose |
|---|---|---|
| `TR_MAX_QUERY_LEN` | `180` | Hard clamp on query length |
| `TR_RATE_LIMIT` | `25` | Requests per session per window |
| `TR_RATE_WINDOW` | `3600` | Rate limit window in seconds |
| `TR_CACHE_TTL` | `21600` | Verdict cache lifetime in seconds |
| `TR_API_TIMEOUT` | `45` | Total cURL timeout |
| `TR_API_CONNECT` | `10` | Connection timeout |

## File map

```
truthrouter-ai/
├── index.php     Landing page, sticky nav, search panel, trust stats, trending grid, footer
├── README.md
└── review.php    Verdict engine, input security, rate limit, cache, cURL call, sanitiser, render
```

## How a verdict is produced

The query is sanitised, then checked against the rate limiter and the disk cache. If nothing is cached, the comparison parser decides which of the two system prompts to build. Credentials are injected into the header templates through `str_replace`, and the secret signs the prompt body with HMAC SHA-256 instead of being transmitted raw. The response is parsed by block type rather than position, passed through the tag allow list sanitiser, written to the cache and rendered inside the responsive verdict container.

## Deployment

Any PHP 8.1 host with the cURL extension enabled. Upload both files, set the two environment variables, and confirm the system temp directory is writable so the verdict cache can persist. Behind a reverse proxy the canonical URL builder already reads `X-Forwarded-Proto`, so no extra configuration is needed for correct `https` meta tags.

Clear stale results after changing providers by deleting the `truthrouter_cache` folder inside your system temp directory.

## Roadmap

Persistent verdict store with a permalink per product. Source citation panel showing which communities fed the consensus. Regional pricing and warranty awareness. Sitemap generation from the verdict index. Verdict correction workflow with public revision history.

## Disclaimer

Verdicts are research summaries assembled from public buyer reports. They are not purchase advice. Confirm current pricing, warranty terms and regional model differences before buying. TruthRouter AI accepts no payment from manufacturers or retailers.

## License

Released under the MIT License. See `LICENSE` for the full text.

## Author

<div align="center">

<img alt="Author" src="https://img.shields.io/badge/Author-Rabeea%20Naseer-0E1420?style=for-the-badge">

**Rabeea Naseer**

<p>
<a href="https://github.com/rabeeanaseer"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-rabeeanaseer-181717?style=flat-square&logo=github&logoColor=white"></a>
<a href="https://www.linkedin.com/in/rabeea-naseer-045b4a337/"><img alt="LinkedIn" src="https://img.shields.io/badge/LinkedIn-Rabeea%20Naseer-0A66C2?style=flat-square&logo=linkedin&logoColor=white"></a>
</p>

</div>

Built and engineered by Rabeea Naseer for Novatratech SMC Private Limited. Issues, feature requests and pull requests are welcome through the GitHub profile linked above.

<div align="center">
<sub>Built and maintained by <strong>Novatratech SMC Private Limited</strong></sub>
</div>
