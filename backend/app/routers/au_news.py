"""
Anna University News Scraper Router
Fetches latest news from multiple Anna University sources.
Results are cached in-memory for 10 minutes to stay fresh.
"""

from fastapi import APIRouter, Depends
from app.middleware.auth import get_current_user
from datetime import datetime, timedelta
import httpx
import re
from typing import List, Dict

router = APIRouter()

# In-memory cache
_au_news_cache: List[Dict] = []
_au_news_cache_time: datetime = datetime.min

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


def clean_text(text: str) -> str:
    """Remove HTML tags and clean whitespace."""
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'&lt;', '<', text)
    text = re.sub(r'&gt;', '>', text)
    text = re.sub(r'&#\d+;', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def categorize(title: str) -> str:
    """Smart categorization based on keywords."""
    lower = title.lower()
    if any(w in lower for w in ['exam', 'result', 'mark', 'grade', 'revaluation', 'arrear', 'coe', 'hall ticket', 'time table', 'timetable']):
        return "Examinations"
    elif any(w in lower for w in ['admission', 'counselling', 'counseling', 'seat', 'cutoff', 'rank']):
        return "Admissions"
    elif any(w in lower for w in ['research', 'phd', 'thesis', 'scholar', 'fellowship']):
        return "Research"
    elif any(w in lower for w in ['workshop', 'seminar', 'conference', 'symposium', 'hackathon', 'webinar', 'event']):
        return "Events"
    elif any(w in lower for w in ['circular', 'notice', 'order', 'regulation', 'amendment']):
        return "Circulars"
    elif any(w in lower for w in ['placement', 'recruit', 'career', 'internship', 'job']):
        return "Placements"
    elif any(w in lower for w in ['scholarship', 'fee', 'payment', 'tuition']):
        return "Finance"
    return "General"


def make_full_url(link: str, base: str) -> str:
    """Convert relative URL to absolute."""
    if not link:
        return base
    if link.startswith('http'):
        return link
    if link.startswith('//'):
        return 'https:' + link
    if link.startswith('/'):
        # Extract domain from base
        from urllib.parse import urlparse
        parsed = urlparse(base)
        return f"{parsed.scheme}://{parsed.netloc}{link}"
    return f"{base.rstrip('/')}/{link.lstrip('./')}"


async def scrape_main_site(client: httpx.AsyncClient) -> List[Dict]:
    """Scrape from main Anna University website."""
    items = []
    try:
        response = await client.get("https://www.annauniv.edu/", headers=HEADERS, timeout=15.0)
        if response.status_code == 200:
            html = response.text

            # Extract all links with text
            link_pattern = re.findall(
                r'<a\s+[^>]*href=["\']([^"\']*)["\'][^>]*>(.*?)</a>',
                html, re.DOTALL | re.IGNORECASE
            )

            for link, text in link_pattern:
                clean = clean_text(text)
                if len(clean) > 15 and not clean.startswith(('Home', 'About', 'Contact', 'Login', 'http', 'www', 'Click', 'More', 'Read')):
                    items.append({
                        "title": clean[:250],
                        "link": make_full_url(link, "https://www.annauniv.edu/"),
                        "category": categorize(clean),
                        "date": datetime.utcnow().strftime("%Y-%m-%d"),
                        "source": "Anna University - Main",
                        "is_new": True
                    })

            # Also look for marquee/scrolling content (common in AU website)
            marquee_pattern = re.findall(
                r'<marquee[^>]*>(.*?)</marquee>',
                html, re.DOTALL | re.IGNORECASE
            )
            for marquee_content in marquee_pattern:
                inner_links = re.findall(
                    r'<a\s+[^>]*href=["\']([^"\']*)["\'][^>]*>(.*?)</a>',
                    marquee_content, re.DOTALL | re.IGNORECASE
                )
                for link, text in inner_links:
                    clean = clean_text(text)
                    if len(clean) > 10:
                        items.append({
                            "title": f"📢 {clean[:250]}",
                            "link": make_full_url(link, "https://www.annauniv.edu/"),
                            "category": categorize(clean),
                            "date": datetime.utcnow().strftime("%Y-%m-%d"),
                            "source": "Anna University - Breaking",
                            "is_new": True
                        })

    except Exception as e:
        print(f"Error scraping AU main site: {e}")
    return items


async def scrape_coe_site(client: httpx.AsyncClient) -> List[Dict]:
    """Scrape from Anna University COE (Controller of Examinations) portal."""
    items = []
    try:
        response = await client.get("https://coe1.annauniv.edu/home/index.php", headers=HEADERS, timeout=15.0)
        if response.status_code == 200:
            html = response.text

            link_pattern = re.findall(
                r'<a\s+[^>]*href=["\']([^"\']*)["\'][^>]*>(.*?)</a>',
                html, re.DOTALL | re.IGNORECASE
            )

            for link, text in link_pattern:
                clean = clean_text(text)
                if len(clean) > 12 and not clean.startswith(('Home', 'About', 'Contact', 'Login')):
                    items.append({
                        "title": clean[:250],
                        "link": make_full_url(link, "https://coe1.annauniv.edu/"),
                        "category": "Examinations",
                        "date": datetime.utcnow().strftime("%Y-%m-%d"),
                        "source": "Anna University - COE",
                        "is_new": True
                    })
    except Exception as e:
        print(f"Error scraping COE site: {e}")
    return items


async def scrape_registrar_exams(client: httpx.AsyncClient) -> List[Dict]:
    """Scrape from Anna University Registrar exam page."""
    items = []
    try:
        response = await client.get("https://www.annauniv.edu/registrar/exams.php", headers=HEADERS, timeout=15.0)
        if response.status_code == 200:
            html = response.text

            link_pattern = re.findall(
                r'<a\s+[^>]*href=["\']([^"\']*)["\'][^>]*>(.*?)</a>',
                html, re.DOTALL | re.IGNORECASE
            )

            for link, text in link_pattern:
                clean = clean_text(text)
                if len(clean) > 12:
                    items.append({
                        "title": clean[:250],
                        "link": make_full_url(link, "https://www.annauniv.edu/registrar/"),
                        "category": "Examinations",
                        "date": datetime.utcnow().strftime("%Y-%m-%d"),
                        "source": "Anna University - Registrar",
                        "is_new": True
                    })
    except Exception as e:
        print(f"Error scraping registrar exams: {e}")
    return items


async def scrape_notifications(client: httpx.AsyncClient) -> List[Dict]:
    """Scrape latest notifications page."""
    items = []
    try:
        # Try the notifications/circulars page
        for url in [
            "https://www.annauniv.edu/latest_notifications.php",
            "https://www.annauniv.edu/notification.php",
            "https://www.annauniv.edu/important_announcements.php",
        ]:
            try:
                response = await client.get(url, headers=HEADERS, timeout=10.0)
                if response.status_code == 200:
                    html = response.text

                    link_pattern = re.findall(
                        r'<a\s+[^>]*href=["\']([^"\']*)["\'][^>]*>(.*?)</a>',
                        html, re.DOTALL | re.IGNORECASE
                    )

                    for link, text in link_pattern:
                        clean = clean_text(text)
                        if len(clean) > 12:
                            items.append({
                                "title": clean[:250],
                                "link": make_full_url(link, "https://www.annauniv.edu/"),
                                "category": categorize(clean),
                                "date": datetime.utcnow().strftime("%Y-%m-%d"),
                                "source": "Anna University - Notifications",
                                "is_new": True
                            })
            except:
                continue
    except Exception as e:
        print(f"Error scraping notifications: {e}")
    return items


async def fetch_all_au_news() -> List[Dict]:
    """Fetch news from all AU sources concurrently."""
    all_items = []

    async with httpx.AsyncClient(follow_redirects=True, verify=False) as client:
        # Scrape all sources
        import asyncio
        results = await asyncio.gather(
            scrape_main_site(client),
            scrape_coe_site(client),
            scrape_registrar_exams(client),
            scrape_notifications(client),
            return_exceptions=True,
        )

        for result in results:
            if isinstance(result, list):
                all_items.extend(result)

    # Deduplicate by title (normalized)
    unique_items = []
    seen_titles = set()
    for item in all_items:
        normalized = item["title"].lower().strip()
        # Skip very short or navigation-like items
        if len(normalized) < 10:
            continue
        if normalized in seen_titles:
            continue
        # Skip common navigation items
        skip_words = ['home', 'about us', 'contact', 'site map', 'disclaimer', 'feedback',
                      'right to information', 'anti ragging', 'rti', 'login', 'webmail',
                      'click here', 'read more', 'view all', 'back']
        if any(normalized == w or normalized.startswith(w + ' ') for w in skip_words):
            continue
        seen_titles.add(normalized)
        unique_items.append(item)

    # Sort by source priority: Breaking > Notifications > Main > COE > Registrar
    source_priority = {
        "Anna University - Breaking": 0,
        "Anna University - Notifications": 1,
        "Anna University - Main": 2,
        "Anna University - COE": 3,
        "Anna University - Registrar": 4,
    }
    unique_items.sort(key=lambda x: source_priority.get(x.get("source", ""), 5))

    return unique_items[:50]  # Limit to 50 items


@router.get("")
async def get_au_news(user=Depends(get_current_user)):
    """Get latest Anna University news. Cached for 10 minutes to stay fresh."""
    global _au_news_cache, _au_news_cache_time

    now = datetime.utcnow()
    if now - _au_news_cache_time > timedelta(minutes=10) or not _au_news_cache:
        _au_news_cache = await fetch_all_au_news()
        _au_news_cache_time = now

    return _au_news_cache
