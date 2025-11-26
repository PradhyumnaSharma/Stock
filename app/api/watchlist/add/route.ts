import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { addToWatchlist } from '@/lib/actions/watchlist.actions';

export async function POST(request: Request) {
    const formData = await request.formData();
    const symbol = formData.get('symbol') as string;
    const company = formData.get('company') as string;

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) redirect('/sign-in');
    const email = session?.user?.email;

    if (!email) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await addToWatchlist(email, symbol, company);

    if (success) {
        return Response.json({ success: true });
    } else {
        return Response.json({ error: 'Failed to add to watchlist' }, { status: 500 });
    }
}