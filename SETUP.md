# MCAT Master — Setup Guide

## Step 1: Install Node.js

Download from https://nodejs.org → choose **LTS version (22.x)**
After installing, open a new terminal and verify:
```
node --version   # should print v22.x.x
npm --version    # should print 10.x.x
```

---

## Step 2: Install Dependencies

```bash
cd "C:\Users\casie\Documents\mcat-master"
npm install
```

---

## Step 3: Set Up Supabase

1. Go to https://supabase.com → create new project called `mcat-master`
2. Go to **Settings → API** → copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
3. Open `.env.local` and paste the values in

### Run the Database Migration
In Supabase dashboard → **SQL Editor** → paste the contents of:
`supabase/migrations/001_initial_schema.sql`
Click **Run**. This creates all tables, RLS policies, and the helper function.

### Enable Google OAuth (optional)
1. Go to **Authentication → Providers → Google**
2. Create OAuth credentials at https://console.cloud.google.com
3. Paste Client ID and Secret into Supabase
4. Add `http://localhost:3000/auth/callback` as an authorized redirect URI

---

## Step 4: Set Up Resend (for email notifications)

1. Go to https://resend.com → create free account
2. Go to **API Keys** → create new key → paste as `RESEND_API_KEY` in `.env.local`
3. (Optional) Add and verify your domain for custom `from` address

---

## Step 5: Run Locally

```bash
npm run dev
```

Open http://localhost:3000

---

## Step 6: Import Your Flashcards

First install the import script dependencies:
```bash
npm install adm-zip
```

Then run the import:
```bash
# If you have both HTML and DOCX files:
npx ts-node scripts/import-flashcards.ts \
  --html "path/to/your/flashcards.html" \
  --docx "path/to/your/flashcards.docx"

# HTML only:
npx ts-node scripts/import-flashcards.ts --html "path/to/flashcards.html"

# DOCX only:
npx ts-node scripts/import-flashcards.ts --docx "path/to/flashcards.docx"
```

Verify in Supabase → Table Editor → flashcards → should show ~968 rows.

---

## Step 7: Deploy to Vercel

1. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial MCAT Master build"
   gh repo create mcat-master --public
   git push -u origin main
   ```

2. Go to https://vercel.com → Import GitHub repo
3. Add all environment variables from `.env.local` in Vercel project settings
4. Update `NEXT_PUBLIC_APP_URL` to your Vercel URL (e.g., `https://mcat-master.vercel.app`)
5. Deploy!

---

## File Structure Reference

```
src/
├── app/
│   ├── page.tsx                    ← Landing page
│   ├── (auth)/
│   │   ├── login/page.tsx          ← Sign in
│   │   ├── signup/page.tsx         ← Create account
│   │   └── callback/route.ts       ← OAuth callback
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx      ← Home dashboard
│   │   ├── study/page.tsx          ← Flashcard study mode
│   │   ├── quiz/page.tsx           ← Quiz mode
│   │   ├── progress/page.tsx       ← Analytics + achievements
│   │   └── settings/page.tsx       ← Profile + notification prefs
│   └── api/
│       ├── cards/route.ts          ← Fetch due cards
│       ├── progress/route.ts       ← Record SM-2 progress + XP
│       ├── quiz/route.ts           ← Quiz generation + save
│       └── cron/daily-email/route.ts  ← Daily reminder cron
├── components/
│   ├── flashcard/
│   │   ├── FlashCard.tsx           ← 3D flip card
│   │   ├── StudySession.tsx        ← Full study flow
│   │   └── RatingButtons.tsx       ← Know it / Almost / Didn't Know
│   ├── quiz/
│   │   ├── QuizQuestion.tsx        ← MC question with timer
│   │   └── QuizResults.tsx         ← Score screen
│   ├── dashboard/
│   │   ├── StreakCard.tsx
│   │   ├── XPBar.tsx
│   │   ├── DueCardsWidget.tsx
│   │   ├── WeeklyChart.tsx
│   │   └── SectionProgress.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── TopNav.tsx
├── lib/
│   ├── supabase/client.ts + server.ts + middleware.ts
│   ├── sm2.ts                      ← Spaced repetition algorithm
│   ├── xp.ts                       ← XP + leveling
│   └── email.ts                    ← Resend email templates
└── types/index.ts                  ← All TypeScript types
```

---

## Troubleshooting

**"Cannot find module" errors** → Run `npm install`

**Supabase auth errors** → Check `.env.local` has correct URL and anon key

**Import script fails** → Make sure `SUPABASE_SERVICE_ROLE_KEY` is set (not just anon key)

**Cards not showing in study mode** → Check RLS policies ran correctly in SQL editor

**Email not sending** → Verify `RESEND_API_KEY` is set and Resend account is active
