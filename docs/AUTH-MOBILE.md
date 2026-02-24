# Auth & redirects for mobile (disallowed_useragent fix)

If users see a **disallowed_useragent** error on mobile, it usually means sign-in or Stripe Checkout was opened in an **in-app browser** (e.g. from a link in Instagram, Facebook, or another app). Both Clerk and Stripe can block these for security.

## 1. Use a single canonical app URL (External browser redirects)

- **Netlify:** Set **`NEXT_PUBLIC_APP_URL`** to your production URL (e.g. `https://velodoc.app`) with no trailing slash.
- All redirects (Clerk sign-in/sign-up, Stripe success/cancel, QuickBooks callback) use this URL when set, so mobile redirects land on the same origin.

## 2. Clerk (sign-in / sign-up)

- In **Clerk Dashboard** → **Configure** → **Paths**, set:
  - **Sign-in URL** to `/sign-in`
  - **Sign-up URL** to `/sign-up`
  - **After sign-in URL** to `/dashboard` (or full URL `https://velodoc.app/dashboard`)
- Under **Allowed redirect URLs**, add:
  - `https://velodoc.app/*` (or your production domain)
  - `https://velodoc.app/dashboard`
  - `https://velodoc.app/success`
- If your plan supports it, ensure **External** or mobile browser redirects are not blocked (some plans have “Block in-app browsers” or similar; allow external browser redirects for mobile).

## 3. Stripe Checkout (mobile)

- Checkout uses **full redirect** (`window.location.href = url`), so the user leaves your site and returns via `success_url`.
- **Stripe Dashboard** → **Settings** → **Checkout** (or **Customer portal**): ensure **Success URL** and **Cancel URL** match what the app sends (from `NEXT_PUBLIC_APP_URL`), e.g. `https://velodoc.app/success` and `https://velodoc.app`.
- If the error appears only in an **in-app browser**, ask users to **open the link in Safari/Chrome** (e.g. “Open in browser”) so Stripe runs in an allowed user agent.

## 4. Supabase (if you add Supabase Auth later)

- For Supabase Auth redirects (e.g. magic link, OAuth), set **Site URL** and **Redirect URLs** in **Supabase Dashboard** → **Authentication** → **URL configuration** to the same production URL (e.g. `https://velodoc.app` and `https://velodoc.app/**`).
- Use **NEXT_PUBLIC_APP_URL** when building redirect URIs in code so mobile and desktop use the same base URL.

## 5. QuickBooks OAuth

- **QUICKBOOKS_REDIRECT_URI** in Netlify should match Intuit Portal (e.g. `https://velodoc.app/api/auth/callback/quickbooks`). The callback route uses **NEXT_PUBLIC_APP_URL** when building redirects so mobile redirects are consistent.
