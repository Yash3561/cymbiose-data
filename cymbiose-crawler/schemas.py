from pydantic import BaseModel
from typing import List, Optional, Dict

class ScrapeRequest(BaseModel):
    url: str
    tags: List[str] = [] # Optional hint tags

class ScrapeResponse(BaseModel):
    url: str
    title: str
    markdown: str
    suggested_tags: Dict[str, List[str]]
    metadata: dict
