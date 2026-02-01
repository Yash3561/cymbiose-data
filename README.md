# Cymbiose Knowledge Base System

A clinical knowledge base (KB) builder and web scraping system designed for mental health therapy content acquisition and organization.

## 🏗️ Architecture

```
Cymbiose_Data/
├── cymbiose-kb-builder/     # Next.js 15 web application
└── cymbiose-crawler/        # Python FastAPI scraping service
```

## 📦 Components

### 1. KB Builder (`cymbiose-kb-builder/`)
A Next.js dashboard for managing a clinical knowledge base with:
- **Dashboard** - Overview statistics and recent entries
- **KB Catalog** - Browse, search, and filter all entries
- **URL Scraper** - AI-powered web scraping with content extraction
- **Add Entry** - Manual entry creation with clinical tagging
- **Export KB** - Export data in JSON/Markdown/CSV formats

**Tech Stack:** Next.js 15, React 19, Prisma ORM, PostgreSQL (Neon), TailwindCSS

### 2. Crawler Service (`cymbiose-crawler/`)
A Python microservice for intelligent web scraping:
- HTTP-based content fetching with bot detection avoidance
- HTML to Markdown conversion
- Clean content extraction for RAG pipelines

**Tech Stack:** Python 3.12, FastAPI, httpx, BeautifulSoup4

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL database (or use Neon cloud)

### 1. Set up the KB Builder

```bash
cd cymbiose-kb-builder
npm install
cp .env.example .env  # Add your DATABASE_URL
npx prisma generate
npx prisma db push
npm run dev
```

### 2. Set up the Crawler Service

```bash
cd cymbiose-crawler
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

### 3. Access the Application

- **KB Builder:** http://localhost:3000
- **Crawler API:** http://localhost:8001/docs

## 📋 Environment Variables

### KB Builder (`.env`)
```
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
```

### Crawler (`.env`)
```
GEMINI_API_KEY="your-gemini-api-key"  # Optional: for AI tagging
```

## 🔧 Development

### Run Both Services

**Terminal 1 - KB Builder:**
```bash
cd cymbiose-kb-builder && npm run dev
```

**Terminal 2 - Crawler:**
```bash
cd cymbiose-crawler && .\venv\Scripts\activate && uvicorn main:app --port 8001
```

## 📝 Features

- ✅ Web scraping with Markdown output
- ✅ Clinical tagging system (Modality, Population, Risk Factors)
- ✅ Full-text search and filtering
- ✅ PostgreSQL persistence with Prisma
- ✅ Export to JSON/Markdown/CSV
- 🔜 AI-powered tag suggestions (Gemini)
- 🔜 Batch URL import

## 📄 License

MIT

---

Built for Cymbiose AI - Clinical Knowledge Infrastructure
