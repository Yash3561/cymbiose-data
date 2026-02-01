"""
Cymbiose KB Crawler - Windows Compatible Version
Uses httpx + BeautifulSoup for web scraping
Gemini API for AI-powered clinical tag extraction
"""
import os
import json
import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

# Gemini API Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

app = FastAPI(title="Cymbiose KB Crawler")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScrapeRequest(BaseModel):
    url: str
    tags: List[str] = []

class ContentChunk(BaseModel):
    index: int
    content: str
    token_estimate: int
    heading: Optional[str] = None

class ScrapeResponse(BaseModel):
    url: str
    title: str
    markdown: str
    chunks: List[ContentChunk]
    suggested_tags: Dict[str, List[str]]
    quality_score: int
    quality_reason: str
    metadata: dict

# Clinical taxonomy for tag extraction
CLINICAL_TAG_PROMPT = """You are a clinical psychology expert. Analyze the following mental health content and extract relevant clinical tags.

Return a JSON object with these categories:
- modality: Treatment approaches (e.g., CBT, DBT, ACT, EMDR, Psychodynamic, Mindfulness, Family Therapy, Group Therapy)
- population: Target demographics (e.g., Adults, Adolescents, Children, Elderly, Veterans, LGBTQ+, Couples, Families)
- risk_factors: Risk indicators or concerns (e.g., Suicidal Ideation, Self-Harm, Substance Use, Trauma, Anxiety, Depression, PTSD)
- cultural_context: Cultural considerations (e.g., Multicultural, Indigenous, Latino/Hispanic, Asian American, African American, Immigrant)
- intervention_type: Type of intervention (e.g., Assessment, Treatment, Prevention, Crisis, Psychoeducation)

Only include tags that are clearly relevant to the content. Return 2-5 tags per category maximum.
If a category isn't relevant, return an empty array.

IMPORTANT: Return ONLY valid JSON, no markdown formatting or explanation.

Content to analyze:
{content}

JSON Response:"""

async def extract_tags_with_gemini(content: str) -> Dict[str, List[str]]:
    """Use Gemini API to extract clinical tags from content"""
    
    if not GEMINI_API_KEY:
        print("⚠️ No Gemini API key configured")
        return {
            "modality": [],
            "population": [],
            "risk_factors": [],
            "cultural_context": [],
            "intervention_type": []
        }
    
    try:
        # Truncate content to fit in context window
        truncated_content = content[:8000]
        
        prompt = CLINICAL_TAG_PROMPT.format(content=truncated_content)
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                json={
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }],
                    "generationConfig": {
                        "temperature": 0.3,
                        "maxOutputTokens": 1024
                    }
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                print(f"❌ Gemini API error: {response.status_code} - {response.text}")
                return {"modality": [], "population": [], "risk_factors": []}
            
            data = response.json()
            
            # Extract text from Gemini response
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            
            # Clean up response - remove markdown code blocks if present
            text = text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            
            # Parse JSON
            tags = json.loads(text)
            
            print(f"🏷️ Gemini extracted tags: {tags}")
            
            # Ensure all expected keys exist
            return {
                "modality": tags.get("modality", [])[:5],
                "population": tags.get("population", [])[:5],
                "risk_factors": tags.get("risk_factors", [])[:5],
                "cultural_context": tags.get("cultural_context", [])[:5],
                "intervention_type": tags.get("intervention_type", [])[:5]
            }
            
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse Gemini response as JSON: {e}")
        return {"modality": [], "population": [], "risk_factors": [], "cultural_context": [], "intervention_type": []}
    except Exception as e:
        print(f"❌ Gemini extraction error: {e}")
        import traceback
        traceback.print_exc()
        return {"modality": [], "population": [], "risk_factors": [], "cultural_context": [], "intervention_type": []}


# Content screening prompt for quality filtering
CONTENT_SCREENING_PROMPT = """You are a clinical psychology content screening expert. Evaluate whether the following web content is appropriate for inclusion in a clinical mental health knowledge base.

Evaluate these criteria:
1. **Clinical Relevance** (Is this about mental health, therapy, psychology, or related clinical topics?)
2. **Source Quality** (Does it appear to be from a reputable source - academic, government, professional organization?)
3. **Evidence-Based** (Does it reference research, cite sources, or use evidence-based language?)
4. **Cultural Sensitivity** (Is the content culturally aware and inclusive, not biased toward one demographic?)
5. **Harmful Content** (Any misinformation, stigmatizing language, or potentially harmful advice?)

Return a JSON object with:
- "approved": true/false (should this be included in the knowledge base?)
- "quality_score": 1-5 (1=poor, 5=excellent clinical quality)
- "reason": Short explanation of your decision (max 100 chars)
- "flags": Array of any concerns ["misinformation", "bias", "low_quality", "off_topic", "stigmatizing"]
- "cultural_diversity_score": 1-5 (1=narrow perspective, 5=diverse/inclusive)
- "demographics_covered": Array like ["Adults", "Adolescents", "LGBTQ+", "Multicultural", etc.]

IMPORTANT: Return ONLY valid JSON, no markdown formatting.

Content to screen:
{content}

JSON Response:"""

async def screen_content_with_gemini(title: str, content: str, url: str) -> Dict:
    """Use Gemini to screen content for clinical appropriateness and quality"""
    
    if not GEMINI_API_KEY:
        # No API key - approve with default score
        return {
            "approved": True,
            "quality_score": 3,
            "reason": "No AI screening available",
            "flags": [],
            "cultural_diversity_score": 3,
            "demographics_covered": []
        }
    
    try:
        # Prepare content for screening
        content_sample = f"Title: {title}\nURL: {url}\n\nContent:\n{content[:6000]}"
        
        prompt = CONTENT_SCREENING_PROMPT.format(content=content_sample)
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.2,
                        "maxOutputTokens": 512
                    }
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                print(f"❌ Gemini screening error: {response.status_code}")
                return {"approved": True, "quality_score": 3, "reason": "Screening failed", "flags": []}
            
            data = response.json()
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            
            # Clean up response
            text = text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            
            result = json.loads(text)
            
            print(f"🔍 AI Screening: {'✅ Approved' if result.get('approved') else '❌ Rejected'} | Score: {result.get('quality_score')}/5 | {result.get('reason', '')}")
            
            return {
                "approved": result.get("approved", True),
                "quality_score": result.get("quality_score", 3),
                "reason": result.get("reason", "")[:200],
                "flags": result.get("flags", []),
                "cultural_diversity_score": result.get("cultural_diversity_score", 3),
                "demographics_covered": result.get("demographics_covered", [])
            }
            
    except Exception as e:
        print(f"❌ Content screening error: {e}")
        # On error, approve with caution score
        return {"approved": True, "quality_score": 2, "reason": f"Screening error: {str(e)[:50]}", "flags": ["screening_failed"]}


def chunk_content(markdown: str, max_tokens: int = 500) -> List[Dict]:
    """Split content into chunks optimized for RAG (targeting ~500 tokens per chunk)"""
    chunks = []
    current_chunk = []
    current_tokens = 0
    current_heading = None
    
    # Rough token estimate: ~4 chars per token
    def estimate_tokens(text: str) -> int:
        return len(text) // 4
    
    lines = markdown.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if this is a heading
        if line.startswith('#'):
            # If we have content, save the current chunk
            if current_chunk and current_tokens > 100:
                chunks.append({
                    "index": len(chunks),
                    "content": '\n'.join(current_chunk),
                    "token_estimate": current_tokens,
                    "heading": current_heading
                })
                current_chunk = []
                current_tokens = 0
            
            # Extract heading text
            current_heading = line.lstrip('#').strip()
            current_chunk.append(line)
            current_tokens += estimate_tokens(line)
        else:
            line_tokens = estimate_tokens(line)
            
            # If adding this line exceeds max, save current chunk
            if current_tokens + line_tokens > max_tokens and current_chunk:
                chunks.append({
                    "index": len(chunks),
                    "content": '\n'.join(current_chunk),
                    "token_estimate": current_tokens,
                    "heading": current_heading
                })
                current_chunk = []
                current_tokens = 0
            
            current_chunk.append(line)
            current_tokens += line_tokens
    
    # Don't forget the last chunk
    if current_chunk:
        chunks.append({
            "index": len(chunks),
            "content": '\n'.join(current_chunk),
            "token_estimate": current_tokens,
            "heading": current_heading
        })
    
    print(f"📦 Created {len(chunks)} chunks from content")
    return chunks


async def score_content_quality(content: str, url: str) -> tuple:
    """Use Gemini to score content quality 1-5"""
    
    if not GEMINI_API_KEY:
        return 3, "No AI scoring available"
    
    try:
        prompt = f"""Rate the quality of this clinical/mental health content on a scale of 1-5:

5 = Peer-reviewed, clinical guidelines, authoritative medical source
4 = Professional medical content from reputable organization
3 = General health information, moderate quality
2 = Blog/opinion with some clinical value
1 = Low quality, unverified, or off-topic content

URL: {url}
Content preview: {content[:2000]}

Respond with JSON only: {{"score": <1-5>, "reason": "<brief explanation>"}}"""

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.2, "maxOutputTokens": 256}
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                return 3, "Scoring unavailable"
            
            data = response.json()
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            
            # Clean and parse
            text = text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            text = text.strip()
            
            result = json.loads(text)
            score = max(1, min(5, int(result.get("score", 3))))
            reason = result.get("reason", "Quality assessed")[:200]
            
            print(f"⭐ Quality score: {score}/5 - {reason}")
            return score, reason
            
    except Exception as e:
        print(f"❌ Quality scoring error: {e}")
        return 3, "Scoring error"


def html_to_markdown(soup: BeautifulSoup) -> str:
    """Convert HTML to readable markdown - preserves document order"""
    # Remove unwanted elements
    for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'form', 'noscript', 'iframe', 'button', 'svg']):
        tag.decompose()
    
    # Get main content area
    main_content = soup.find('main') or soup.find('article') or soup.find('[role="main"]') or soup.find('body') or soup
    
    lines = []
    seen_texts = set()  # Avoid duplicates
    
    # Process elements in document order
    for element in main_content.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li']):
        text = element.get_text(strip=True)
        
        # Skip empty, too short, or duplicate text
        if not text or len(text) < 15 or text in seen_texts:
            continue
        
        seen_texts.add(text)
        
        if element.name.startswith('h'):
            level = int(element.name[1])
            lines.append(f"\n{'#' * level} {text}\n")
        elif element.name == 'li':
            lines.append(f"- {text}")
        else:  # paragraph
            lines.append(f"\n{text}\n")
    
    # Fallback: get plain text if nothing found
    if not lines:
        text = main_content.get_text(separator='\n', strip=True)
        for line in text.split('\n'):
            line = line.strip()
            if line and len(line) > 20 and line not in seen_texts:
                lines.append(line)
                seen_texts.add(line)
    
    return "\n".join(lines)

@app.get("/health")
async def health():
    return {
        "status": "ok", 
        "service": "cymbiose-crawler",
        "gemini_configured": bool(GEMINI_API_KEY)
    }

@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_url(request: ScrapeRequest):
    print(f"\n🕷️ Scraping: {request.url}")
    
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "DNT": "1",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1",
                "Cache-Control": "max-age=0",
            }
            response = await client.get(request.url, headers=headers)
            response.raise_for_status()
            
            print(f"📄 Response: {response.status_code}, {len(response.text)} bytes")
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract title
            title = "No Title"
            if soup.title and soup.title.string:
                title = soup.title.string.strip()
            elif soup.find('h1'):
                title = soup.find('h1').get_text(strip=True)
            
            # Convert to markdown
            markdown = html_to_markdown(soup)
            
            print(f"✅ Scraped: {title[:50]}... ({len(markdown)} chars)")
            
            # Extract tags using Gemini AI
            print("🤖 Extracting clinical tags with Gemini AI...")
            suggested_tags = await extract_tags_with_gemini(markdown)
            
            # Chunk content for RAG
            print("📦 Chunking content for RAG...")
            chunks = chunk_content(markdown)
            
            # Score content quality
            print("⭐ Scoring content quality...")
            quality_score, quality_reason = await score_content_quality(markdown, request.url)
            
            return ScrapeResponse(
                url=request.url,
                title=title,
                markdown=markdown[:20000],  # Limit size
                chunks=chunks,
                suggested_tags=suggested_tags,
                quality_score=quality_score,
                quality_reason=quality_reason,
                metadata={
                    "content_length": len(markdown),
                    "status_code": response.status_code,
                    "raw_html_size": len(response.text),
                    "chunk_count": len(chunks),
                    "ai_tagged": bool(GEMINI_API_KEY)
                }
            )
            
    except httpx.HTTPStatusError as e:
        print(f"❌ HTTP Error: {e}")
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ==================== AUTO-CRAWLER SYSTEM ====================

import asyncio
import re
from urllib.parse import urljoin, urlparse
from datetime import datetime
from collections import deque
import threading

# In-memory storage for crawl jobs (in production, use Redis or database)
crawl_jobs: Dict[str, dict] = {}
crawl_locks: Dict[str, threading.Event] = {}

class CrawlRequest(BaseModel):
    seed_url: str
    max_depth: int = 3
    max_urls: int = 50
    same_domain_only: bool = True
    include_patterns: List[str] = []
    exclude_patterns: List[str] = [r"\.pdf$", r"\.jpg$", r"\.png$", r"login", r"signup", r"cart"]

class CrawlJobStatus(BaseModel):
    id: str
    seed_url: str
    status: str  # pending, running, paused, completed, failed
    max_depth: int
    urls_found: int
    urls_scraped: int
    urls_failed: int
    urls_pending: int
    current_url: Optional[str]
    started_at: Optional[str]
    completed_at: Optional[str]
    scraped_urls: List[dict]
    error: Optional[str]

def extract_links(html: str, base_url: str, same_domain: bool = True) -> List[str]:
    """Extract all valid links from HTML content"""
    soup = BeautifulSoup(html, "html.parser")
    links = set()
    base_domain = urlparse(base_url).netloc
    
    for a_tag in soup.find_all("a", href=True):
        href = a_tag["href"]
        
        # Skip empty, javascript, mailto, tel links
        if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue
        
        # Convert relative URLs to absolute
        full_url = urljoin(base_url, href)
        parsed = urlparse(full_url)
        
        # Only HTTP/HTTPS
        if parsed.scheme not in ("http", "https"):
            continue
        
        # Same domain check
        if same_domain and parsed.netloc != base_domain:
            continue
        
        # Normalize URL (remove fragments, trailing slashes)
        normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        if parsed.query:
            normalized += f"?{parsed.query}"
        normalized = normalized.rstrip("/")
        
        links.add(normalized)
    
    return list(links)

def should_crawl_url(url: str, exclude_patterns: List[str], include_patterns: List[str]) -> bool:
    """Check if URL should be crawled based on patterns"""
    # Check exclude patterns
    for pattern in exclude_patterns:
        if re.search(pattern, url, re.IGNORECASE):
            return False
    
    # If include patterns specified, URL must match at least one
    if include_patterns:
        for pattern in include_patterns:
            if re.search(pattern, url, re.IGNORECASE):
                return True
        return False
    
    return True

async def crawl_worker(job_id: str):
    """Background worker to process crawl job"""
    job = crawl_jobs.get(job_id)
    if not job:
        return
    
    job["status"] = "running"
    job["started_at"] = datetime.now().isoformat()
    
    queue = deque([(job["seed_url"], 0)])  # (url, depth)
    visited = set()
    stop_event = crawl_locks.get(job_id)
    
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        while queue and len(visited) < job["max_urls"]:
            # Check if stopped
            if stop_event and stop_event.is_set():
                job["status"] = "paused"
                return
            
            url, depth = queue.popleft()
            
            if url in visited:
                continue
            
            visited.add(url)
            job["current_url"] = url
            job["urls_pending"] = len(queue)
            
            # Rate limiting - 1 request per second
            await asyncio.sleep(1.0)
            
            try:
                print(f"🔍 Crawling [{depth}]: {url}")
                
                response = await client.get(url, headers={
                    "User-Agent": "Cymbiose-KB-Crawler/1.0 (Clinical Knowledge Base Builder)"
                })
                response.raise_for_status()
                
                html = response.text
                content_type = response.headers.get("content-type", "")
                
                # Only process HTML pages
                if "text/html" not in content_type:
                    job["urls_failed"] += 1
                    continue
                
                # Extract and parse content
                soup = BeautifulSoup(html, "html.parser")
                title = soup.title.string if soup.title else url
                text_content = soup.get_text()
                text_length = len(text_content)
                
                # AI-powered content screening
                screening_result = await screen_content_with_gemini(
                    title=title[:200] if title else url,
                    content=text_content,
                    url=url
                )
                
                # Skip rejected content
                if not screening_result.get("approved", True):
                    print(f"🚫 Rejected: {url} | Reason: {screening_result.get('reason', 'Unknown')}")
                    job["urls_failed"] += 1
                    job["scraped_urls"].append({
                        "url": url,
                        "title": f"[REJECTED] {title[:100] if title else url}",
                        "depth": depth,
                        "quality_score": 0,
                        "content_length": text_length,
                        "rejected": True,
                        "rejection_reason": screening_result.get("reason", "Did not pass AI screening"),
                        "flags": screening_result.get("flags", []),
                        "scraped_at": datetime.now().isoformat()
                    })
                    continue
                
                quality = screening_result.get("quality_score", 3)
                
                # Add to scraped results with screening metadata
                job["scraped_urls"].append({
                    "url": url,
                    "title": title[:200] if title else url,
                    "depth": depth,
                    "quality_score": quality,
                    "cultural_diversity_score": screening_result.get("cultural_diversity_score", 3),
                    "demographics_covered": screening_result.get("demographics_covered", []),
                    "content_length": text_length,
                    "ai_screening_reason": screening_result.get("reason", ""),
                    "flags": screening_result.get("flags", []),
                    "scraped_at": datetime.now().isoformat()
                })
                job["urls_scraped"] += 1
                
                # Discover new links if not at max depth
                if depth < job["max_depth"]:
                    new_links = extract_links(html, url, job["same_domain_only"])
                    
                    for link in new_links:
                        if link not in visited and should_crawl_url(link, job["exclude_patterns"], job["include_patterns"]):
                            queue.append((link, depth + 1))
                            job["urls_found"] += 1
                
            except Exception as e:
                print(f"❌ Failed to crawl {url}: {e}")
                job["urls_failed"] += 1
                job["scraped_urls"].append({
                    "url": url,
                    "title": f"Failed: {str(e)[:100]}",
                    "depth": depth,
                    "quality_score": 0,
                    "error": str(e)[:200],
                    "scraped_at": datetime.now().isoformat()
                })
    
    job["status"] = "completed"
    job["completed_at"] = datetime.now().isoformat()
    job["current_url"] = None
    job["urls_pending"] = 0
    print(f"✅ Crawl job {job_id} completed: {job['urls_scraped']} URLs scraped")

@app.post("/crawl/start")
async def start_crawl(request: CrawlRequest):
    """Start a new crawl job"""
    import uuid
    job_id = str(uuid.uuid4())[:8]
    
    crawl_jobs[job_id] = {
        "id": job_id,
        "seed_url": str(request.seed_url),
        "status": "pending",
        "max_depth": request.max_depth,
        "max_urls": request.max_urls,
        "same_domain_only": request.same_domain_only,
        "include_patterns": request.include_patterns,
        "exclude_patterns": request.exclude_patterns,
        "urls_found": 1,
        "urls_scraped": 0,
        "urls_failed": 0,
        "urls_pending": 1,
        "current_url": None,
        "started_at": None,
        "completed_at": None,
        "scraped_urls": [],
        "error": None
    }
    
    crawl_locks[job_id] = threading.Event()
    
    # Start background task
    asyncio.create_task(crawl_worker(job_id))
    
    return {"job_id": job_id, "status": "started"}

@app.get("/crawl/jobs")
async def list_crawl_jobs():
    """List all crawl jobs"""
    return list(crawl_jobs.values())

@app.get("/crawl/jobs/{job_id}")
async def get_crawl_job(job_id: str):
    """Get status of a specific crawl job"""
    job = crawl_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.post("/crawl/jobs/{job_id}/stop")
async def stop_crawl_job(job_id: str):
    """Stop a running crawl job"""
    job = crawl_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    stop_event = crawl_locks.get(job_id)
    if stop_event:
        stop_event.set()
    
    return {"status": "stopping", "job_id": job_id}

@app.delete("/crawl/jobs/{job_id}")
async def delete_crawl_job(job_id: str):
    """Delete a crawl job"""
    if job_id in crawl_jobs:
        # Stop if running
        stop_event = crawl_locks.get(job_id)
        if stop_event:
            stop_event.set()
        
        del crawl_jobs[job_id]
        if job_id in crawl_locks:
            del crawl_locks[job_id]
        
        return {"status": "deleted", "job_id": job_id}
    
    raise HTTPException(status_code=404, detail="Job not found")

@app.get("/crawl/discover-links")
async def discover_links(url: str, same_domain: bool = True):
    """Discover all links from a single URL (preview)"""
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(url, headers={
                "User-Agent": "Cymbiose-KB-Crawler/1.0"
            })
            response.raise_for_status()
            
            links = extract_links(response.text, url, same_domain)
            
            return {
                "source_url": url,
                "links_found": len(links),
                "links": links[:100]  # Limit to first 100
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Cymbiose KB Crawler on http://localhost:8001")
    print(f"🔑 Gemini API: {'Configured' if GEMINI_API_KEY else 'Not configured'}")
    print("🕷️ Auto-Crawler: Enabled")
    uvicorn.run(app, host="0.0.0.0", port=8001)
