import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface DailyDigestData {
  to: string;
  displayName: string;
  dueCards: number;
  streak: number;
  weakestTopic: string;
  weakestTopicAccuracy: number;
}

export async function sendDailyDigest(data: DailyDigestData) {
  const { to, displayName, dueCards, streak, weakestTopic, weakestTopicAccuracy } = data;

  const streakEmoji = streak >= 7 ? "🔥" : streak >= 3 ? "✨" : "📚";

  await resend.emails.send({
    from: "MCAT Master <noreply@mcatmaster.app>",
    to,
    subject: `${dueCards} cards due today | ${streakEmoji} ${streak}-day streak`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Daily MCAT Digest</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🧠 MCAT Master</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Good morning, ${displayName}!</p>
            </div>

            <!-- Stats -->
            <div style="padding: 32px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">

              <div style="background: #eff6ff; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #2563eb;">${dueCards}</div>
                <div style="color: #64748b; font-size: 14px; margin-top: 4px;">Cards Due Today</div>
              </div>

              <div style="background: #fff7ed; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #ea580c;">${streakEmoji} ${streak}</div>
                <div style="color: #64748b; font-size: 14px; margin-top: 4px;">Day Streak</div>
              </div>

              <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #16a34a;">${Math.round(weakestTopicAccuracy)}%</div>
                <div style="color: #64748b; font-size: 14px; margin-top: 4px;">Weakest Topic</div>
              </div>

            </div>

            <!-- Weak topic callout -->
            <div style="margin: 0 32px; padding: 16px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px;">
              <p style="margin: 0; color: #991b1b; font-weight: 500;">
                📉 Focus area: <strong>${weakestTopic}</strong> (${Math.round(weakestTopicAccuracy)}% accuracy)
              </p>
              <p style="margin: 8px 0 0; color: #b91c1c; font-size: 14px;">
                Spend extra time on this topic today to boost your score!
              </p>
            </div>

            <!-- CTA -->
            <div style="padding: 32px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/study"
                 style="display: inline-block; background: #2563eb; color: white; text-decoration: none;
                        padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                Start Studying →
              </a>
              <p style="color: #94a3b8; font-size: 13px; margin-top: 16px;">
                You're doing great. Keep it up! 💪
              </p>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                MCAT Master ·
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #94a3b8;">
                  Manage notifications
                </a>
              </p>
            </div>

          </div>
        </body>
      </html>
    `,
  });
}
