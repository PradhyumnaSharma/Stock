import nodemailer from 'nodemailer';
import { WELCOME_EMAIL_TEMPLATE, NEWS_SUMMARY_EMAIL_TEMPLATE } from '@/lib/nodemailer/templates';

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    },
});

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replace('{{name}}', name).replace('{{intro}}', intro);

    const mailOptions = {
        from: `"Finsight" <workwithpd1@gmail.com>`,
        to: email,
        subject: `Welcome to Finsight - your stock market toolkit is ready!`,
        text: 'Thanks for joining Finsight',
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};

export const sendNewsSummaryEmail = async ({
                                               email,
                                               date,
                                               newsContent,
                                           }: {
    email: string;
    date: string;
    newsContent: string;
}): Promise<void> => {
    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE.replace('{{date}}', date).replace('{{newsContent}}', newsContent);

    const mailOptions = {
        from: `"Finsight News" <workwithpd1@gmail.com>`,
        to: email,
        subject: `📈 Daily Market Highlights - ${date}`,
        text: `Today's market Highlights from Finsight`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};