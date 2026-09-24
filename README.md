# NexaAI — Production-Ready Full-Stack AI Chatbot

A Next.js + PostgreSQL + Prisma + Auth.js + Vercel AI SDK chatbot designed for Vercel deployment.

## Features
- Email/password authentication with secure bcrypt hashing
- Google OAuth through Auth.js
- PostgreSQL persistence with Prisma
- Per-user conversation authorization
- Streaming OpenAI responses
- Conversation history, creation, deletion and renaming APIs
- Zod validation
- Configurable rate limiting (in-memory fallback; swap to Upstash for distributed production limits)
- Responsive ChatGPT-style UI
- Markdown/GFM rendering
- Dark/light mode support
- Vercel-compatible architecture

## Stack
Next.js, React, TypeScript, Tailwind CSS, Auth.js, Prisma, PostgreSQL, Vercel AI SDK, OpenAI, Zod.

## Local setup
1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local`.
3. Create a Neon or Supabase PostgreSQL database and set `DATABASE_URL`.
4. Set `AUTH_SECRET` to a long random value.
5. Add `OPENAI_API_KEY`.
6. Optional: configure Google OAuth credentials.
7. Install dependencies:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000.

## Google OAuth
Create a Google OAuth web application. For local development use:
`http://localhost:3000/api/auth/callback/google`

For production replace the origin with your Vercel deployment URL.

## Vercel deployment
1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Add all variables from `.env.example` in Vercel Project Settings.
4. Use a hosted PostgreSQL provider such as Neon or Supabase.
5. Run the production migration before/at deployment with `npx prisma migrate deploy`.
6. Build command: `npm run build`.

## Production hardening
The included rate limiter is intentionally dependency-free for local use. For multi-instance Vercel production, replace `lib/rate-limit.ts` with an Upstash Redis implementation using `@upstash/redis` and configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

## Important
Never commit `.env` or `.env.local`. API keys must remain server-side.
