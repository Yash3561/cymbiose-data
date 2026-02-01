"""
Cymbiose KB Crawler - Windows Compatible Version
Uses httpx + BeautifulSoup for web scraping
"""
import os
import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

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

class ScrapeResponse(BaseModel):
    url: str
    title: str
    markdown: str
    suggested_tags: Dict[str, List[str]]
    metadata: dict

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
    return {"status": "ok", "service": "cymbiose-crawler"}

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
            
            return ScrapeResponse(
                url=request.url,
                title=title,
                markdown=markdown[:20000],  # Limit size
                suggested_tags={
                    "modality": [],
                    "population": [],
                    "risk_factors": []
                },
                metadata={
                    "content_length": len(markdown),
                    "status_code": response.status_code,
                    "raw_html_size": len(response.text)
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
    uvicorn.run(app, host="0.0.0.0", port=8001)
