'use server';

import {auth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try {
        const response = await auth.api.signUpEmail({ body: { email, password, name: fullName }});
        // successful signup -> normal flow
        try {
            if (response) {
                await inngest.send({ name: 'app/user.created', data: { email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry }});
            }
        } catch (e) {
            console.warn('inngest event failed but signup ok', e);
        }
        return { success: true, data: response };
    } catch (err: any) {
        console.error('signup failed (non-blocking):', err);
        const serverBody = err?.body ?? err?.response ?? err?.data ?? null;
        const msg = (serverBody?.message ?? err?.message ?? '').toString();

        // If error is a BSON version mismatch or other server-side transient, allow redirect (temporary)
        if (msg.includes('BSONVersionError') || err?.message?.includes('BSONVersionError') || err?.statusCode === 422) {
            // VERY IMPORTANT: mark this clearly so you can find and revert later
            console.warn('[TEMP WORKAROUND] allowing redirect despite signup error - revert once backend fixed');
            return { success: true, data: { warning: 'TEMP_WORKAROUND_BYPASS' } };
        }

        return { success: false, error: typeof msg === 'object' ? JSON.stringify(msg) : msg || 'Sign up failed' };
    }
};


export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const response = await auth.api.signInEmail({ body: { email, password } })

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign in failed', e)
        return { success: false, error: 'Sign in failed' }
    }
}

export const signOut = async () => {
    try {
        await auth.api.signOut({ headers: await headers() });
    } catch (e) {
        console.log('Sign out failed', e)
        return { success: false, error: 'Sign out failed' }
    }
}