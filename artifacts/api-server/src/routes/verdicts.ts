import { Router, type IRouter } from "express";
import {
  CreateVerdictBody,
  CreateVerdictResponse,
  GetProviderStatusResponse,
  GetTrendingVerdictsResponse,
} from "@workspace/api-zod";
import {
  ensureQuotaUser,
  releaseVerdict,
  reserveVerdict,
} from "../lib/quota";
import { getAnonymousQuotaUserId } from "../lib/anonymousVisitor";

const router: IRouter = Router();

const XAI_MODEL = process.env.XAI_MODEL?.trim() || "grok-4.6";
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_REVIEW_SOURCES = 5;
const SOURCE_SEARCH_TIMEOUT_MS = 8_000;
const rateLimitBuckets = new Map<
  string,
  { count: number; resetAt: number }
>();

type XaiResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: { message?: string } | string;
};

type ModelVerdict = {
  title?: unknown;
  summary?: unknown;
  verdict?: unknown;
  confidence?: unknown;
  recommendation?: unknown;
  pitfalls?: unknown;
  evidence?: unknown;
  popularReviews?: unknown;
};

type ReviewSource = {
  title: string;
  publisher: string;
  url: string;
  publishedAt: string | null;
};

type ReviewSourceLookup = {
  sources: ReviewSource[];
  status: "available" | "unavailable";
  message: string;
  failed: boolean;
};

function getProviderError(payload: XaiResponse): string | null {
  if (typeof payload.error === "string") return payload.error;
  if (
    payload.error &&
    typeof payload.error === "object" &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }
  return null;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .trim();
}

function readXmlTag(item: string, tag: string): string {
  const match = item.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"),
  );
  return match ? decodeXml(match[1]) : "";
}

function parseReviewSources(xml: string): ReviewSource[] {
  const seenUrls = new Set<string>();
  const sources: ReviewSource[] = [];

  for (const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const item = match[1];
    const title = readXmlTag(item, "title");
    const publisher = readXmlTag(item, "source");
    const url = readXmlTag(item, "link");
    const publishedAtText = readXmlTag(item, "pubDate");

    if (!title || !publisher || !url || seenUrls.has(url)) continue;

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      continue;
    }

    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.username ||
      parsedUrl.password
    ) {
      continue;
    }

    const publishedDate = publishedAtText
      ? new Date(publishedAtText)
      : undefined;

    sources.push({
      title: title.slice(0, 240),
      publisher: publisher.slice(0, 120),
      url: parsedUrl.toString(),
      publishedAt:
        publishedDate && !Number.isNaN(publishedDate.getTime())
          ? publishedDate.toISOString()
          : null,
    });
    seenUrls.add(url);

    if (sources.length >= MAX_REVIEW_SOURCES) break;
  }

  return sources;
}

async function fetchReviewSources(query: string): Promise<ReviewSourceLookup> {
  const searchUrl = new URL("https://news.google.com/rss/search");
  searchUrl.searchParams.set("q", `${query} review`);
  searchUrl.searchParams.set("hl", "en-US");
  searchUrl.searchParams.set("gl", "US");
  searchUrl.searchParams.set("ceid", "US:en");

  try {
    const response = await fetch(searchUrl, {
      headers: {
        accept: "application/rss+xml, application/xml, text/xml",
        "user-agent": "TruthRouter/1.0",
      },
      signal: AbortSignal.timeout(SOURCE_SEARCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        sources: [],
        status: "unavailable",
        message: "Live public sources are unavailable right now.",
        failed: true,
      };
    }

    const sources = parseReviewSources(
      (await response.text()).slice(0, 1_000_000),
    );
    if (sources.length === 0) {
      return {
        sources,
        status: "unavailable",
        message: "No current public review sources were found for this query.",
        failed: false,
      };
    }

    return {
      sources,
      status: "available",
      message: "Live public review links found for this query.",
      failed: false,
    };
  } catch {
    return {
      sources: [],
      status: "unavailable",
      message: "Live public sources are unavailable right now.",
      failed: true,
    };
  }
}

function parseModelJson(text: string): ModelVerdict {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new Error("xAI returned a response that was not JSON.");
  }

  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as ModelVerdict;
}

function isRateLimited(clientKey: string): boolean {
  const now = Date.now();
  const current = rateLimitBuckets.get(clientKey);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(clientKey, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX_REQUESTS;
}

router.get("/provider-status", (_req, res) => {
  res.json(
    GetProviderStatusResponse.parse({
      configured: Boolean(process.env.XAI_API_KEY),
      provider: "xAI Grok",
      model: XAI_MODEL,
    }),
  );
});

router.get("/trending-verdicts", (_req, res) => {
  res.json(
    GetTrendingVerdictsResponse.parse([
      { query: "iPhone Pro vs Samsung Galaxy Ultra", category: "Phones" },
      { query: "Best noise-cancelling headphones for travel", category: "Audio" },
      { query: "Robot vacuum worth buying for pet hair", category: "Home" },
      { query: "MacBook Air vs Windows ultrabook", category: "Laptops" },
    ]),
  );
});

router.post("/verdict", async (req, res): Promise<void> => {
  const parsed = CreateVerdictBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Enter a product or comparison between 2 and 180 characters.",
      code: "INVALID_QUERY",
    });
    return;
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    res.status(502).json({
      error: "xAI is not configured. Add XAI_API_KEY to the server environment.",
      code: "PROVIDER_NOT_CONFIGURED",
    });
    return;
  }

  const isAuthenticated = req.isAuthenticated();
  const quotaUserId = isAuthenticated
    ? req.user.id
    : getAnonymousQuotaUserId(req, res);

  await ensureQuotaUser(quotaUserId);

  if (isRateLimited(quotaUserId)) {
    res.status(429).json({
      error: "Too many verdict requests. Please wait ten minutes and try again.",
      code: "RATE_LIMITED",
    });
    return;
  }

  const reservedPlan = await reserveVerdict(quotaUserId);
  if (reservedPlan === null) {
    res.status(429).json({
      error: isAuthenticated
        ? "You have reached the review limit for your current plan."
        : "You have used your 10 free reviews. Sign in to continue.",
      code: isAuthenticated ? "PLAN_LIMIT_REACHED" : "ANONYMOUS_LIMIT_REACHED",
    });
    return;
  }

  try {
    const reviewSourcesPromise = fetchReviewSources(parsed.data.query);
    const providerResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: XAI_MODEL,
        temperature: 0.25,
        max_tokens: 1800,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are TruthRouter, an independent product-review analyst. Be direct, skeptical of marketing claims, balanced, and useful. Never claim to have browsed live sources. Return valid JSON only, with no markdown.",
          },
          {
            role: "user",
            content: `Give an honest buying verdict for: "${parsed.data.query}".

Return exactly one JSON object with:
- title: concise product or comparison title
- summary: 2-3 sentences explaining the key tradeoff
- verdict: a short decisive label such as "Worth it", "Skip it", or "It depends"
- confidence: integer from 0 to 100
- recommendation: direct advice for who should buy it and who should not
- pitfalls: array of 3-5 short drawbacks or caveats
- evidence: array of 3-5 concrete evaluation factors behind the verdict
- popularReviews: array of 3-5 concise paraphrases of recurring buyer review themes. Do not use quotation marks, invent reviewer names or ratings, or claim that you browsed live websites.`,
          },
        ],
      }),
      signal: AbortSignal.timeout(60_000),
    });

    const contentType = providerResponse.headers.get("content-type") ?? "";
    const raw = await providerResponse.text();

    if (!contentType.includes("application/json")) {
      req.log.warn(
        { status: providerResponse.status, contentType },
        "xAI returned a non-JSON response",
      );
      res.status(502).json({
        error: "xAI returned an unexpected non-JSON response.",
        code: "PROVIDER_RESPONSE_INVALID",
      });
      await releaseVerdict(quotaUserId, reservedPlan);
      return;
    }

    let payload: XaiResponse;
    try {
      payload = JSON.parse(raw) as XaiResponse;
    } catch {
      throw new Error("xAI returned invalid JSON.");
    }

    if (!providerResponse.ok) {
      const providerError =
        getProviderError(payload) ??
        `xAI returned HTTP ${providerResponse.status}.`;
      req.log.warn(
        { status: providerResponse.status },
        "xAI request failed",
      );
      res.status(502).json({
        error: providerError,
        code: "PROVIDER_ERROR",
      });
      await releaseVerdict(quotaUserId, reservedPlan);
      return;
    }

    const text = payload.choices
      ?.map((choice) => choice.message?.content)
      .filter((content): content is string => typeof content === "string")
      .join("\n");

    if (!text) {
      throw new Error("xAI returned no text content.");
    }

    const modelVerdict = parseModelJson(text);
    const reviewSources = await reviewSourcesPromise;
    if (reviewSources.failed) {
      req.log.warn(
        { query: parsed.data.query },
        "Live review source search was unavailable",
      );
    }
    const confidenceNumber =
      typeof modelVerdict.confidence === "number"
        ? Math.round(modelVerdict.confidence)
        : Number(modelVerdict.confidence);

    const verdict = CreateVerdictResponse.parse({
      query: parsed.data.query,
      title: asString(modelVerdict.title, parsed.data.query),
      summary: asString(
        modelVerdict.summary,
        "The model did not provide a full summary.",
      ),
      verdict: asString(modelVerdict.verdict, "It depends"),
      confidence: Number.isFinite(confidenceNumber)
        ? Math.min(100, Math.max(0, confidenceNumber))
        : 50,
      recommendation: asString(
        modelVerdict.recommendation,
        "Review the tradeoffs before buying.",
      ),
      pitfalls: asStringArray(modelVerdict.pitfalls),
      evidence: asStringArray(modelVerdict.evidence),
      popularReviews: asStringArray(modelVerdict.popularReviews),
      sources: reviewSources.sources,
      sourceStatus: reviewSources.status,
      sourceStatusMessage: reviewSources.message,
      generatedAt: new Date().toISOString(),
      model: XAI_MODEL,
    });

    res.json(verdict);
  } catch (error) {
    await releaseVerdict(quotaUserId, reservedPlan);
    req.log.error({ err: error }, "Failed to generate TruthRouter verdict");
    const isTimeout =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    res.status(502).json({
      error: isTimeout
        ? "xAI took too long to respond. Please try again."
        : "The AI response could not be processed. Please try again.",
      code: isTimeout ? "PROVIDER_TIMEOUT" : "PROVIDER_RESPONSE_INVALID",
    });
  }
});

export default router;
