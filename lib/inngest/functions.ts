import { inngest } from '@/lib/inngest/client';
import { NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT } from '@/lib/inngest/prompts';
import { sendNewsSummaryEmail, sendWelcomeEmail } from '@/lib/nodemailer';
import { getAllUsersForNewsEmail } from '@/lib/actions/user.actions';
import { getWatchlistSymbolsByEmail } from '@/lib/actions/watchlist.actions';
import { getNews } from '@/lib/actions/finnhub.actions';
import { getFormattedTodayDate } from '@/lib/utils';
import type { UserForNewsEmail, MarketNewsArticle } from '@/lib/types';


export const sendSignUpEmail = inngest.createFunction({ id: 'sign-up-email' }, { event: 'app/user.created' }, async ({ event, step }) => {
    const userProfile = `\n - Country: ${event.data.country}\n - Investment goals: ${event.data.investmentGoals}\n - Risk tolerance: ${event.data.riskTolerance}\n - Preferred industry: ${event.data.preferredIndustry}\n `;


    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile);


    const response = await step.ai.infer('generate-welcome-intro', {
        model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
        body: {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }],
                },
            ],
        },
    });


    await step.run('send-welcome-email', async () => {
        const part = response.candidates?.[0]?.content?.parts?.[0];
        const introText =
            (part && 'text' in part ? part.text : null) ||
            'Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.';


        const {
            data: { email, name },
        } = event;


        return await sendWelcomeEmail({ email, name, intro: introText });
    });


    return {
        success: true,
        message: 'Welcome email sent successfully',
    };
});


// @ts-ignore
export const sendDailyNewsSummary = inngest.createFunction(
    { id: 'daily-news-summary' },
    [{ event: 'app/send.daily.news' }, { cron: '0 12 * * *' }],
);