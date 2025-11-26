"use server";

import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";

export async function getWatchlistSymbolsByEmail(
    email: string
): Promise<string[]> {
    if (!email) return [];

    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error("MongoDB connection not found");

        const user = await db
            .collection("user")
            .findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

        if (!user) return [];

        const userId = (user.id as string) || String(user._id || "");
        if (!userId) return [];

        const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
        return items.map((i) => String(i.symbol));
    } catch (err) {
        console.error("getWatchlistSymbolsByEmail error:", err);
        return [];
    }
}

export async function removeFromWatchlist(
    email: string,
    symbol: string
): Promise<boolean> {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error("DB not connected");

        const user = await db
            .collection("user")
            .findOne<{ id?: string; _id?: unknown }>({ email });
        if (!user) return false;

        const userId = (user.id as string) || String(user._id || "");
        if (!userId) return false;

        const result = await Watchlist.deleteOne({
            userId,
            symbol: symbol.toUpperCase(),
        });
        return result.deletedCount > 0;
    } catch (err) {
        console.error("removeFromWatchlist error:", err);
        return false;
    }
}

export async function addToWatchlist(
    email: string,
    symbol: string,
    company: string
): Promise<boolean> {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error("MongoDB connection not found");

        const user = await db
            .collection("user")
            .findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

        if (!user) {
            console.error("User not found for email:", email);
            return false;
        }

        const userId = (user.id as string) || String(user._id || "");
        if (!userId) {
            console.error("User ID not found");
            return false;
        }

        const result = await Watchlist.findOneAndUpdate(
            { userId, symbol: symbol.toUpperCase() },
            {
                $setOnInsert: {
                    userId,
                    symbol: symbol.toUpperCase(),
                    company: company.trim(),
                    addedAt: new Date(),
                },
            },
            { upsert: true, new: true }
        );

        return !!result;
    } catch (err) {
        console.error("addToWatchlist error:", err);
        return false;
    }
}

export async function isInWatchlist(
    email: string,
    symbol: string
): Promise<boolean> {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) return false;

        const user = await db
            .collection("user")
            .findOne<{ id?: string; _id?: unknown }>({ email });
        if (!user) return false;

        const userId = (user.id as string) || String(user._id || "");
        if (!userId) return false;

        const exists = await Watchlist.exists({
            userId,
            symbol: symbol.toUpperCase(),
        });
        return !!exists;
    } catch (err) {
        console.error("isInWatchlist error:", err);
        return false;
    }
}