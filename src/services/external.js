import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';

const marketClient = axios.create({
  timeout: 8000,
  headers: {
    'User-Agent': 'StockFlowPro/1.0',
    Accept: 'application/json, text/plain, */*',
  },
});

function normalizeSymbol(symbol) {
  return String(symbol || '').trim().toUpperCase();
}

function isEmptyFinnhubQuote(payload) {
  return payload && [payload.c, payload.o, payload.h, payload.l, payload.pc].every((value) => Number(value) === 0);
}

function formatQuote(symbol, provider, payload) {
  return {
    symbol,
    provider,
    current: Number(payload.current || 0) || null,
    open: Number(payload.open || 0) || null,
    high: Number(payload.high || 0) || null,
    low: Number(payload.low || 0) || null,
    prevClose: Number(payload.prevClose || 0) || null,
    timestamp: payload.timestamp || Date.now(),
  };
}

async function fetchFinnhubQuote(symbol) {
  if (!process.env.FINNHUB_KEY) {
    return null;
  }

  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${process.env.FINNHUB_KEY}`;
  const { data } = await marketClient.get(url);
  if (isEmptyFinnhubQuote(data)) {
    return null;
  }

  return formatQuote(symbol, 'FINNHUB', {
    current: data.c,
    open: data.o,
    high: data.h,
    low: data.l,
    prevClose: data.pc,
    timestamp: data.t,
  });
}

async function fetchYahooQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  const { data } = await marketClient.get(url);
  const result = data?.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  const lastIndex = Math.max(0, (quote?.close?.length || 1) - 1);

  if (!result || !quote) {
    return null;
  }

  return formatQuote(symbol, 'YAHOO', {
    current: quote.close?.[lastIndex] ?? result.meta?.regularMarketPrice,
    open: quote.open?.[lastIndex],
    high: quote.high?.[lastIndex],
    low: quote.low?.[lastIndex],
    prevClose: result.meta?.chartPreviousClose,
    timestamp: result.timestamp?.[lastIndex],
  });
}

async function fetchAlphaQuote(symbol) {
  if (!process.env.ALPHA_KEY) {
    return null;
  }

  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${process.env.ALPHA_KEY}`;
  const { data } = await marketClient.get(url);
  const quote = data?.['Global Quote'];

  if (!quote?.['05. price']) {
    return null;
  }

  return formatQuote(symbol, 'ALPHA_VANTAGE', {
    current: quote['05. price'],
    open: quote['02. open'],
    high: quote['03. high'],
    low: quote['04. low'],
    prevClose: quote['08. previous close'],
    timestamp: Date.now(),
  });
}

export async function fetchQuote(symbol) {
  const normalizedSymbol = normalizeSymbol(symbol);
  if (!normalizedSymbol) {
    throw new ApiError(400, 'Symbol is required');
  }

  const providers = [fetchFinnhubQuote, fetchYahooQuote, fetchAlphaQuote];

  for (const provider of providers) {
    try {
      const quote = await provider(normalizedSymbol);
      if (quote) {
        return quote;
      }
    } catch (error) {
      console.error(`Quote provider failed for ${normalizedSymbol}:`, error.message);
    }
  }

  throw new ApiError(502, `Unable to fetch quote for ${normalizedSymbol}`);
}

export async function fetchChart(symbol, range = '1mo') {
  const normalizedSymbol = normalizeSymbol(symbol);
  if (!normalizedSymbol) {
    throw new ApiError(400, 'Symbol is required');
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalizedSymbol)}?interval=1d&range=${encodeURIComponent(range)}`;
  const { data } = await marketClient.get(url);
  const result = data?.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  const timestamps = Array.isArray(result?.timestamp) ? result.timestamp : [];
  const closes = Array.isArray(quote?.close) ? quote.close : [];

  return timestamps
    .map((timestamp, index) => ({
      time: timestamp,
      close: closes[index] ?? null,
    }))
    .filter((point) => Number.isFinite(Number(point.close)));
}

export async function searchMarket(query) {
  const normalizedQuery = normalizeSymbol(query);
  if (!normalizedQuery) {
    return [];
  }

  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(normalizedQuery)}&quotesCount=20&newsCount=0`;
  const { data } = await marketClient.get(url);
  const quotes = Array.isArray(data?.quotes) ? data.quotes : [];

  return quotes
    .map((item) => ({
      symbol: item.symbol,
      shortname: item.shortname || item.longname || item.symbol,
      exchange: item.exchangeDisplay || '',
      type: item.quoteType || '',
    }))
    .filter((item) => item.symbol?.toUpperCase().includes(normalizedQuery))
    .slice(0, 12);
}

export async function fetchNewsFeed({ q = '', country = 'us', category = 'business', pageSize = 20 } = {}) {
  if (!process.env.NEWSAPI_KEY) {
    throw new ApiError(500, 'NEWSAPI_KEY is not configured');
  }

  const query = String(q || '').trim();
  let url = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&pageSize=${pageSize}&apiKey=${process.env.NEWSAPI_KEY}`;

  if (query) {
    url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize}&apiKey=${process.env.NEWSAPI_KEY}`;
  }

  const { data } = await marketClient.get(url);
  return data;
}
