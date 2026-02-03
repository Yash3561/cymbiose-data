
# Cymbiose KB Builder 🧬

A Clinical Knowledge Base Builder powered by RAG (Retrieval Augmented Generation), Gemini 2.5 Flash, and Supabase.

## 🚀 Features

*   **Knowledge Acquisition**: Auto-Crawler & URL Scraper to ingest clinical data from the web.
*   **Vector Database**:  Uses `pgvector` on Supabase to store semantic embeddings of all content.
*   **RAG Chat Assistant**:
    *   **Context-Aware**: Retrieves relevant clinical chunks to answer queries accurately.
    *   **Powered by Gemini 2.5 Flash**: Low latency, high intelligence.
    *   **Trustworthy**: Refuses to answer if data is missing (no hallucination).
*   **Dashboard**: Manage entries, view tags, and monitor KB statistics.

## 🛠️ Tech Stack

*   **Frontend**: Next.js 14, Tailwind CSS (Dark Mode), React Markdown.
*   **Backend**: Next.js API Routes (Serverless).
*   **Database**: Supabase (PostgreSQL + pgvector).
*   **AI**: Google Gemini API (`text-embedding-004` & `gemini-2.5-flash`).
*   **Crawler**: Python (FastAPI/Uvicorn) - *Separate Service*.

## 📦 Installation & Setup

### 1. Environment Variables
Create a `.env` file in the root:

```env
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-anon-key]"
GEMINI_API_KEY="[your-gemini-key]"
```

### 2. Database Setup
Ensure your Supabase instance has `vector` extension enabled and the `KBChunk` table has an `embedding` column (vector(768)).

### 3. Run Development Server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 💬 How to Use

1.  **Add Data**: Go to **URL Scraper**, enter a clinical URL (e.g., Healthline article), and scrape.
2.  **Process**: The system automatically chunks and generates embeddings (or use `scripts/process-embeddings.js` for batch).
3.  **Chat**: Go to **Chat Assistant**. Ask questions like:
    *   *"What are the symptoms of [condition]?"*
    *   *"Summarize the article on [topic]."*

## 🧪 Verification
The system uses Gemini 2.5 Flash. You can verify model availability by running:
`node scripts/check-models.js`

## 🔧 Troubleshooting: "Redirected to localhost"

If you are deployed on Vercel but get redirected back to `localhost:3000` after login, you need to update your **Supabase Auth Settings**:

1.  Go to **Supabase Dashboard** > **Authentication** > **URL Configuration**.
2.  **Site URL**: Set this to your Vercel URL (e.g., `https://cymbiose-kb-builder.vercel.app`).
3.  **Redirect URLs**: Add your Vercel callback URL:
    *   `https://cymbiose-kb-builder.vercel.app/auth/callback`
    *   `https://[your-project].vercel.app/auth/callback`
4.  Save changes.

