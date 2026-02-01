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

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Cymbiose KB Crawler on http://localhost:8001")
    print(f"🔑 Gemini API: {'Configured' if GEMINI_API_KEY else 'Not configured'}")
    uvicorn.run(app, host="0.0.0.0", port=8001)
