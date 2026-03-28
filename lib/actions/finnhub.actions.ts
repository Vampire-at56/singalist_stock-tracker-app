'use server';

import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import { cache } from 'react';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
    const options: RequestInit & { next?: { revalidate?: number } } = revalidateSeconds
        ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } }
        : { cache: 'no-store' };

    const res = await fetch(url, options);
    // Per requirements: throw on non-200 responses (not just non-2xx).
    if (res.status !== 200) {
        const text = await res.text().catch(() => '');
        throw new Error(`Fetch failed ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
}

export { fetchJSON };

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
    try {
        const range = getDateRange(5);
        const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
        if (!token) {
            throw new Error('FINNHUB API key is not configured');
        }

        const cleanSymbols = (symbols || [])
            .map((s) => s?.trim().toUpperCase())
            .filter((s): s is string => Boolean(s));

        const maxArticles = 6;

        // If we have symbols, try company news (round-robin), then fall back to general.
        if (cleanSymbols.length > 0) {
            type SymbolNewsState = { articles: RawNewsArticle[]; nextIndex: number };
            const perSymbol = new Map<string, SymbolNewsState>();
            const used = new Set<string>();
            const collected: MarketNewsArticle[] = [];

            for (let round = 0; round < maxArticles; round++) {
                const sym = cleanSymbols[round % cleanSymbols.length];
                let state = perSymbol.get(sym);

                if (!state) {
                    try {
                        const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${range.from}&to=${range.to}&token=${token}`;
                        const raw = await fetchJSON<RawNewsArticle[]>(url, 300);
                        state = { articles: (raw || []).filter(validateArticle), nextIndex: 0 };
                    } catch (e) {
                        console.error('Error fetching company news for', sym, e);
                        state = { articles: [], nextIndex: 0 };
                    }
                    perSymbol.set(sym, state);
                }

                // Take one valid article per round for this symbol.
                while (state.nextIndex < state.articles.length) {
                    const art = state.articles[state.nextIndex];
                    state.nextIndex += 1;
                    if (!validateArticle(art)) continue;

                    const key = `${art.id}|${art.url}|${art.headline}`;
                    if (used.has(key)) continue;
                    used.add(key);

                    collected.push(formatArticle(art, true, sym, round));
                    break;
                }
            }

            if (collected.length > 0) {
                collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
                return collected.slice(0, maxArticles);
            }
        }

        // General market news fallback or when no symbols provided
        const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
        const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

        const seenIds = new Set<number>();
        const seenUrls = new Set<string>();
        const seenHeadlines = new Set<string>();

        const unique: RawNewsArticle[] = [];
        for (const art of general || []) {
            if (!validateArticle(art)) continue;

            const id = typeof art.id === 'number' ? art.id : -1;
            const url = typeof art.url === 'string' ? art.url.trim() : '';
            const headline = typeof art.headline === 'string' ? art.headline.trim() : '';

            // Deduplicate by id OR url OR headline.
            if ((id !== -1 && seenIds.has(id)) || (url && seenUrls.has(url)) || (headline && seenHeadlines.has(headline))) continue;
            if (id !== -1) seenIds.add(id);
            if (url) seenUrls.add(url);
            if (headline) seenHeadlines.add(headline);

            unique.push(art);
            if (unique.length >= maxArticles) break;
        }

        const formatted = unique.map((a, idx) => formatArticle(a, false, undefined, idx));
        return formatted;
    } catch (err) {
        console.error('getNews error:', err);
        throw new Error('Failed to fetch news');
    }
}

export const searchStocks = cache(async (query?: string) => {
    try {
        const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
        if (!token) {
            // If no token, log and return empty to avoid throwing per requirements
            console.error('Error in stock search:', new Error('FINNHUB API key is not configured'));
            return [];
        }

        const trimmedQuery = typeof query === 'string' ? query.trim() : '';

        type FinnhubProfile2Response = {
            name?: string;
            exchange?: string;
        };

        type FinnhubSearchResultWithExchange = FinnhubSearchResult & { exchange: string };
        type CombinedSearchResult = FinnhubSearchResult | FinnhubSearchResultWithExchange;

        let results: CombinedSearchResult[] = [];

        if (!trimmedQuery) {
            const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);

            const profiles = await Promise.all(
                top.map(async (sym) => {
                    const symbol = sym.trim().toUpperCase();
                    const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${token}`;
                    const profile = await fetchJSON<FinnhubProfile2Response>(url, 3600);

                    const nameFromProfile = profile?.name?.trim();
                    const description = nameFromProfile ? nameFromProfile : symbol;
                    const exchange = profile?.exchange?.trim() ? profile.exchange.trim() : 'US';

                    const r: FinnhubSearchResultWithExchange = {
                        symbol,
                        description,
                        displaySymbol: symbol,
                        type: 'Common Stock',
                        exchange,
                    };
                    return r;
                })
            );

            results = profiles;
        } else {
            const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmedQuery)}&token=${token}`;
            const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
            results = Array.isArray(data.result) ? data.result : [];
        }

        return results
            .map((r) => {
                const symbol = r.symbol.trim().toUpperCase();
                if (!symbol) return null;

                const name = r.description;
                const exchange = r.displaySymbol?.trim() ? r.displaySymbol.trim() : 'US';
                const type = r.type?.trim() ? r.type.trim() : 'Stock';

                const item: StockWithWatchlistStatus = {
                    symbol,
                    name,
                    exchange,
                    type,
                    isInWatchlist: false,
                };
                return item;
            })
            .filter((x): x is StockWithWatchlistStatus => x !== null)
            .slice(0, 15);
    } catch (err) {
        console.error('Error in stock search:', err);
        return [];
    }
});
