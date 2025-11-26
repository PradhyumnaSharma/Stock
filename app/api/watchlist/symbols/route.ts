// app/api/watchlist/symbols/route.ts
import { auth } from "@/lib/better-auth/auth";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { headers } from "next/headers";

export async function GET() {
    // Get incoming request headers
    const requestHeaders = await headers();

    // Use better-auth's getSession API with headers
    const session = await auth.api.getSession({
        headers: requestHeaders,
    });

    if (!session?.user?.email) {
        return Response.json([], { status: 401 });
    }

    const symbols = await getWatchlistSymbolsByEmail(session.user.email);
    return Response.json(symbols);
}