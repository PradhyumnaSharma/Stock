import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { removeFromWatchlist } from '@/lib/actions/watchlist.actions';

export async function POST(request: Request) {
    const formData = await request.formData();
    const symbol = formData.get('symbol') as string;

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) redirect('/sign-in');
    const email = session?.user?.email;

    if (!email) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await removeFromWatchlist(email, symbol);

    if (success) {
        return Response.json({ success: true });
    } else {
        return Response.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
    }
}