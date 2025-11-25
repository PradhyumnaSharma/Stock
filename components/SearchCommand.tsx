"use client";

import { useEffect, useState } from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandInput,
    CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Loader2, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchCommandProps {
    renderAs?: "button" | "text";
    label?: string;
    initialStocks?: StockWithWatchlistStatus[];
}

export default function SearchCommand({
                                          renderAs = "button",
                                          label = "Add stock",
                                          initialStocks = [],
                                      }: SearchCommandProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [stocks, setStocks] =
        useState<StockWithWatchlistStatus[]>(initialStocks);
    const [watchlistSymbols, setWatchlistSymbols] = useState<Set<string>>(
        new Set()
    );

    const isSearchMode = !!searchTerm.trim();
    const displayStocks = isSearchMode ? stocks : stocks.slice(0, 10);

    // 🔐 Fetch user's watchlist on mount
    useEffect(() => {
        const fetchWatchlist = async () => {
            try {
                const res = await fetch("/api/watchlist/symbols", {
                    method: "GET",
                    credentials: "include", // ✅ Sends session cookie
                });

                if (res.status === 401) {
                    // User not logged in — treat as empty watchlist
                    setWatchlistSymbols(new Set());
                    return;
                }

                if (res.ok) {
                    const symbols: string[] = await res.json();
                    setWatchlistSymbols(new Set(symbols));
                }
            } catch (err) {
                console.error("Failed to fetch watchlist:", err);
                setWatchlistSymbols(new Set());
            }
        };

        fetchWatchlist();
    }, []);

    // 🔄 Update stocks with watchlist status
    useEffect(() => {
        const updated = stocks.map((stock) => ({
            ...stock,
            isInWatchlist: watchlistSymbols.has(stock.symbol),
        }));
        setStocks(updated);
    }, [watchlistSymbols]);

    // ⌨️ Keyboard shortcut
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    // 🔍 Handle search
    const handleSearch = async () => {
        if (!isSearchMode) {
            // Re-apply watchlist status to initial stocks
            const withStatus = initialStocks.map((stock) => ({
                ...stock,
                isInWatchlist: watchlistSymbols.has(stock.symbol),
            }));
            setStocks(withStatus);
            return;
        }

        setLoading(true);
        try {
            const results = await searchStocks(searchTerm.trim());
            const withStatus = results.map((stock) => ({
                ...stock,
                isInWatchlist: watchlistSymbols.has(stock.symbol),
            }));
            setStocks(withStatus);
        } catch (err) {
            console.error("Search failed:", err);
            setStocks([]);
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = useDebounce(handleSearch, 300);

    useEffect(() => {
        debouncedSearch();
    }, [searchTerm]);

    // ⭐ Toggle watchlist
    const handleToggleWatchlist = async (symbol: string, company: string) => {
        const isCurrentlyIn = watchlistSymbols.has(symbol);
        const next = !isCurrentlyIn;

        // 🚀 Optimistic UI update
        setWatchlistSymbols((prev) => {
            const newSet = new Set(prev);
            if (next) {
                newSet.add(symbol);
            } else {
                newSet.delete(symbol);
            }
            return newSet;
        });

        // 📡 Sync with server
        try {
            const formData = new FormData();
            formData.append("symbol", symbol);
            formData.append("company", company);

            const url = next ? "/api/watchlist/add" : "/api/watchlist/remove";

            const res = await fetch(url, {
                method: "POST",
                body: formData,
                credentials: "include", // ✅ Critical for auth
            });

            if (!res.ok) {
                // ❌ Revert on error
                setWatchlistSymbols((prev) => {
                    const newSet = new Set(prev);
                    if (next) newSet.delete(symbol);
                    else newSet.add(symbol);
                    return newSet;
                });
                alert("Failed to update watchlist");
            }
        } catch (error) {
            console.error("Network error:", error);
            // ❌ Revert on network failure
            setWatchlistSymbols((prev) => {
                const newSet = new Set(prev);
                if (next) newSet.delete(symbol);
                else newSet.add(symbol);
                return newSet;
            });
        }
    };

    const handleSelectStock = () => {
        setOpen(false);
        setSearchTerm("");
    };

    return (
        <>
            {renderAs === "text" ? (
                <span
                    onClick={() => setOpen(true)}
                    className="search-text cursor-pointer"
                >
          {label}
        </span>
            ) : (
                <Button onClick={() => setOpen(true)} className="search-btn">
                    {label}
                </Button>
            )}

            <CommandDialog
                open={open}
                onOpenChange={setOpen}
                className="search-dialog"
            >
                <div className="search-field">
                    <CommandInput
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                        placeholder="Search stocks..."
                        className="search-input"
                    />
                    {loading && (
                        <Loader2 className="search-loader animate-spin text-gray-400" />
                    )}
                </div>

                <CommandList className="search-list">
                    {loading ? (
                        <CommandEmpty className="search-list-empty">
                            Loading stocks...
                        </CommandEmpty>
                    ) : displayStocks.length === 0 ? (
                        <div className="search-list-indicator px-4 py-6 text-center text-gray-400">
                            {isSearchMode ? "No results found" : "No stocks available"}
                        </div>
                    ) : (
                        <>
                            <div className="search-count px-4 py-2 bg-gray-800 text-sm font-medium">
                                {isSearchMode ? "Search results" : "Popular stocks"} (
                                {displayStocks.length})
                            </div>
                            <ul>
                                {displayStocks.map((stock) => (
                                    <li key={stock.symbol} className="search-item">
                                        <Link
                                            href={`/stocks/${stock.symbol}`}
                                            onClick={handleSelectStock}
                                            className="search-item-link flex items-center gap-3 w-full"
                                        >
                                            <TrendingUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="search-item-name font-medium truncate">
                                                    {stock.name}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate">
                                                    {stock.symbol} | {stock.exchange} | {stock.type}
                                                </div>
                                            </div>
                                            {/* ⭐ Star button — stops propagation */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleToggleWatchlist(stock.symbol, stock.name);
                                                }}
                                                className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                                                aria-label={
                                                    stock.isInWatchlist
                                                        ? `Remove ${stock.symbol} from watchlist`
                                                        : `Add ${stock.symbol} to watchlist`
                                                }
                                            >
                                                <Star
                                                    className="h-4 w-4"
                                                    fill={stock.isInWatchlist ? "#FACC15" : "none"}
                                                    stroke="#FACC15"
                                                    strokeWidth="1.5"
                                                />
                                            </button>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}