import type { Diagnostics, Fundamentals, Quote, Sentiment, Position } from "../types";

// Minimal external quote fetcher with graceful fallback
async function fetchYahooQuote(symbol: string): Promise<Quote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const item = json?.quoteResponse?.result?.[0];
    if (!item) return null;
    return {
      symbol,
      price: Number(item.regularMarketPrice ?? item.bid ?? item.ask ?? 0),
      currency: item.currency || "USD",
      time: new Date().toISOString(),
    };
  } catch (e) {
    console.warn("Quote fetch failed; using fallback.", e);
    return null;
  }
}

function fallbackQuote(symbol: string): Quote {
  // simple deterministic price for demo
  const base = Math.abs(symbol.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 50) + 20;
  return {
    symbol,
    price: Number(base.toFixed(2)),
    currency: "USD",
    time: new Date().toISOString(),
  };
}

export async function getQuote(symbol: string): Promise<Quote> {
  const live = await fetchYahooQuote(symbol);
  return live ?? fallbackQuote(symbol);
}

export function getFundamentals(symbol: string): Fundamentals {
  // minimal tri-state health model; realistic numbers optional
  const hash = Math.abs(symbol.split("").reduce((acc, c) => acc * 31 + c.charCodeAt(0), 7)) % 100;
  const health = hash > 66 ? "healthy" : hash > 33 ? "subhealthy" : "crisis";
  return {
    symbol,
    roe: Number(((hash % 20) - 5).toFixed(2)),
    debtRatio: Number(((hash % 60) / 100).toFixed(2)),
    revenueYoY: Number((((hash % 40) - 10) / 10).toFixed(2)),
    health,
    comment:
      health === "healthy"
        ? "基本面良好，成長與盈利穩健。"
        : health === "subhealthy"
        ? "基本面一般，需關注負債與盈利質量。"
        : "基本面偏弱，短期風險較高。",
  };
}

export function getSentiment(symbol: string): Sentiment {
  const hash = Math.abs(symbol.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 200) - 100; // -100..100
  return {
    symbol,
    score: Number((hash / 100).toFixed(2)),
    popularity: Math.abs(hash),
    summary: hash >= 0 ? "市場偏樂觀/貪婪" : "市場偏悲觀/恐懼",
  };
}

export async function getDiagnostics(position: Position): Promise<Diagnostics> {
  const [quote, fundamentals, sentiment] = await Promise.all([
    getQuote(position.symbol),
    Promise.resolve(getFundamentals(position.symbol)),
    Promise.resolve(getSentiment(position.symbol)),
  ]);
  return {
    symbol: position.symbol,
    quote,
    fundamentals,
    sentiment,
    position,
  };
}