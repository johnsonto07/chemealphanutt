# Lecture Attendance

Attendance challenge site for three people. Next.js (App Router) + Supabase + Vercel.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the Supabase URL and anon key.
3. Run each file in `supabase/migrations/` in order in the Supabase SQL Editor.
4. `npm run dev` and open http://localhost:3000

## Deployment

Vercel deploys `main` automatically. It needs `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` set in the Vercel project's Environment Variables,
and the Vercel URL plus `/auth/callback` added to Supabase's Redirect URLs.
