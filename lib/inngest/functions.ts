import { inngest } from "@/lib/inngest/client";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "@/lib/inngest/prompts";
import {sendNewsSummaryEmail, sendWelcomeEmail} from "@/lib/nodemailer";
import {
  getAllUsersForNewsEmail,
  type NewsEmailUser,
} from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";

export const sendSignUpEmail = inngest.createFunction(
    { id: "send-signup-email" },
    { event: "app/user.created" },
    async ({ event, step }) => {
        const data = event.data as Partial<{
            email: string;
            name: string;
            country: string;
            investmentGoals: string;
            riskTolerance: string;
            preferredIndustry: string;
        }>;

        if (!data.email || !data.name) {
            return {
                success: false,
                message: "Missing required user data (email or name)",
            };
        }

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
            "{{userProfile}}",
            JSON.stringify(data, null, 2)
        );

        const intro = await step.run("generate-welcome-intro", async () => {
            try {
                const response = await step.ai.infer(`welcome-intro-${data.email}`, {
                    model: step.ai.models.gemini({
                        model: "gemini-2.5-flash-lite",
                    }),
                    body: {
                        contents: [
                            {
                                role: "user",
                                parts: [{ text: prompt }],
                            },
                        ],
                    },
                });

                const part = response.candidates?.[0]?.content?.parts?.[0];
                const text = (part && "text" in part ? part.text : null) || null;

                return text;
            } catch (e) {
                console.error("Failed to generate welcome email intro:", data.email, e);
                return null;
            }
        });

        await step.run("send-welcome-email", async () => {
            await sendWelcomeEmail({
                email: data.email!,
                name: data.name!,
                intro:
                    intro ||
                    `<p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">Thanks for joining Signalist. Your dashboard is ready with watchlists, news, and alerts to help you stay on top of the market without the noise.</p>`,
            });
        });

        return {
            success: true,
            message: "Welcome email sent successfully!",
        };
    }
);


export const sendDailyNewsSummary = inngest.createFunction(
    { id: "daily-news-summary" },
    [{ event: "app/send.daily.news" }, { cron: "* * * * *" }],
    async ({ step }) => {
        const users = await step.run("get-all-users", getAllUsersForNewsEmail);

        if (!users || users.length === 0) {
            return {
                success: false,
                message: "No users found for news email",
            };
        }

        const perUserNews = await step.run("fetch-user-news", async () => {
            const rows: Array<{
                user: NewsEmailUser;
                symbols: string[];
                news: MarketNewsArticle[];
            }> = [];

            for (const user of users) {
                const symbols = await getWatchlistSymbolsByEmail(user.email);

                let news: MarketNewsArticle[] = [];

                try {
                    news = await getNews(symbols);
                } catch (e) {
                    console.error("Error fetching news for user:", user.email, e);
                    news = [];
                }

                if (!news || news.length === 0) {
                    try {
                        news = await getNews();
                    } catch (e) {
                        console.error(
                            "Error fetching general news for user:",
                            user.email,
                            e
                        );
                        news = [];
                    }
                }

                rows.push({
                    user,
                    symbols,
                    news: (news || []).slice(0, 6),
                });
            }

            return rows;
        });

        const summaries: Array<{
            user: NewsEmailUser;
            newsContent: string | null;
            articleCount: number;
        }> = [];

        for (const { user, news } of perUserNews) {
            if (!news || news.length === 0) {
                summaries.push({
                    user,
                    newsContent: null,
                    articleCount: 0,
                });
                continue;
            }

            const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
                "{{newsData}}",
                JSON.stringify(news, null, 2)
            );

            try {
                const response = await step.ai.infer(
                    `summarize-news-${user.id}`,
                    {
                        model: step.ai.models.gemini({
                            model: "gemini-2.5-flash-lite",
                        }),
                        body: {
                            contents: [
                                {
                                    role: "user",
                                    parts: [{ text: prompt }],
                                },
                            ],
                        },
                    }
                );

                const part =
                    response.candidates?.[0]?.content?.parts?.[0];

                const newsContent =
                    (part && "text" in part ? part.text : null) || null;

                summaries.push({
                    user,
                    newsContent,
                    articleCount: news.length,
                });
            } catch (e) {
                console.error(
                    "Failed to summarize news for:",
                    user.email,
                    e
                );

                summaries.push({
                    user,
                    newsContent: null,
                    articleCount: news.length,
                });
            }
        }

        await step.run("send-news-emails", async () => {
            await Promise.all(
                summaries.map(async ({ user, newsContent }) => {
                    if (!newsContent) return false;

                    return await sendNewsSummaryEmail({
                        email: user.email,
                        date: getFormattedTodayDate(),
                        newsContent,
                    });
                })
            );
        });

        return {
            success: true,
            message:
                "Daily news summary emails sent successfully!",
        };
    }
);
