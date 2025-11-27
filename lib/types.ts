export interface UserForNewsEmail {
    email: string;
    name?: string;
    watchlist?: string[];
    country?: string;
    investmentGoals?: string;
    riskTolerance?: string;
    preferredIndustry?: string;
}


export interface MarketNewsArticle {
    title?: string; // optional to avoid mismatches when API omits title
    url?: string;
    source?: string;
    publishedAt?: string;
}


export interface Quote {
    c: number; // current price
    d: number; // change
    dp: number; // percent change
    h: number;
    l: number;
    o: number;
    pc: number;
}


export interface Profile {
    name?: string;
    marketCapitalization?: number; // Finnhub: marketCapitalization
    peRatio?: number; // Finnhub: peRatio
}