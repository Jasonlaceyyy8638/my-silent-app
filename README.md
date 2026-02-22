# Clean Your Data Silently

A Micro-SaaS landing page that lets users upload PDF invoices and extract **Vendor Name**, **Total Amount**, and **Date** using AI (OpenAI). Dark mode by default, no login or database.

## Stack

- **Next.js** (App Router)
- **Tailwind CSS**
- **Lucide Icons**
- **OpenAI** (GPT-4o-mini) for extraction
- **pdf-parse** for PDF text extraction
- **Chatbase** (optional) — floating chat bubble for user questions

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set your OpenAI API key**

   Copy `.env.example` to `.env` and add your key:

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

   Get a key from [OpenAI API keys](https://platform.openai.com/api-keys).

3. **(Optional) Add Chatbase chat bubble**

   In `.env`, set your Chatbase chatbot ID (from [Chatbase Dashboard](https://www.chatbase.co/dashboard) → Deploy → Chat widget → Embed):

   ```
   NEXT_PUBLIC_CHATBASE_CHATBOT_ID=your-chatbot-id
   ```

   The floating chat bubble appears in the bottom right and handles user questions via your Chatbase agent.

4. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Open the landing page.
2. Drag & drop a PDF invoice (or click to browse).
3. The app extracts vendor name, total amount, and date and adds a row to the table.
4. Use **Download as CSV** to export all extracted rows.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — run ESLint
