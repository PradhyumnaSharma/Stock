// app/watchlist/actions.ts
'use server';

import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { addToWatchlist as dbAdd, removeFromWatchlist as dbRemove } from '@/lib/actions/watchlist.actions';
import { revalidatePath } from 'next/cache';

export async function addToWatchlist(symbol: string, company: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    const email = session?.user?.email;
    if (!email) throw new Error('Unauthorized');

    await dbAdd(email, symbol, company);
    revalidatePath('/watchlist');
}

export async function removeFromWatchlist(symbol: string) {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) redirect('/sign-in');
    const email = session?.user?.email;
    if (!email) throw new Error('Unauthorized');

    await dbRemove(email, symbol);
    revalidatePath('/watchlist');
}