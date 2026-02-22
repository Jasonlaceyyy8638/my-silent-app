# VeloDoc

VeloDoc turns PDF invoices into structured data in seconds. **Sign in** to use the Architect (upload, extract, export). Credits are stored per user and purchased via Stripe.

## Stack

- **Next.js** (App Router)
- **Clerk** — authentication (sign in, protected dashboard)
- **Prisma + SQLite** — user credits per Clerk user ID
- **Stripe** — checkout and webhook to add credits
- **Tailwind CSS**, **Lucide Icons**
- **OpenAI** (GPT-4o-mini) for extraction
- **pdf-parse** for PDF text extraction
- **Chatbase** (optional) — floating chat bubble

## Setup

1. **Install dependencies**

   ```bash
   npm install --legacy-peer-deps
   ```

2. **Environment variables**

   Copy `.env.example` to `.env` and fill in:

   - **Clerk** — [dashboard.clerk.com](https://dashboard.clerk.com) → API Keys:  
     `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
   - **Database** — SQLite:  
     `DATABASE_URL="file:./dev.db"`
   - **OpenAI** — [platform.openai.com/api-keys](https://platform.openai.com/api-keys):  
     `OPENAI_API_KEY`
   - **Stripe** — [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys):  
     `STRIPE_SECRET_KEY`  
     For credits on purchase, add a webhook endpoint in Stripe pointing to `https://your-domain.com/api/webhooks/stripe` (event: `checkout.session.completed`) and set `STRIPE_WEBHOOK_SECRET`.
   - **App URL** (production):  
     `NEXT_PUBLIC_APP_URL=https://your-netlify-url.com`

3. **Database**

   ```bash
   npx prisma migrate dev
   ```

4. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Usage

- **Landing (/**):** Hero, pricing, “Buy Credits”. Sign in via header to access the dashboard.
- **Dashboard (/dashboard):** Protected. Upload PDFs, run Architect (1 credit per extraction), download CSV. Credits shown in the header.
- **Buy Credits:** Stripe Checkout; after payment, the webhook adds credits to the signed-in user’s Clerk ID.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — run ESLint
