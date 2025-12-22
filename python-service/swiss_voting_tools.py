# python-service/swiss_voting_tools.py
"""
Swiss Voting Tools - Data access for Swiss federal votes.
Now powered by Swissvotes CSV dataset (with web scraping fallback).
"""

import os
import time
import json
from typing import Dict, List
from datetime import datetime

# Import CSV service
from swissvotes_csv import (
    fetch_csv,
    get_upcoming_votes,
    get_vote_by_id,
    search_votes,
    get_vote_context_for_llm,
    get_all_upcoming_context_for_llm,
    row_to_vote_dict
)

# --- Setup ---
BASE = "https://swissvotes.ch"
OUT_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(OUT_DIR, exist_ok=True)


# --- API Wrapper Functions (backward compatible) ---

def get_upcoming_initiatives(lang: str = 'de') -> List[Dict]:
    """
    Get all upcoming votes with details.
    Now uses CSV data instead of web scraping.
    """
    return get_upcoming_votes(lang)


def get_vote_by_id_legacy(vote_id: str, lang: str = 'de') -> Dict:
    """Get detailed information for a specific vote."""
    vote = get_vote_by_id(vote_id, lang)
    return vote if vote else {}


def get_brochure_text(vote_id: str, lang: str = 'de') -> str:
    """
    Get comprehensive vote information for chatbot context.
    Returns rich formatted text for LLM consumption.
    """
    return get_vote_context_for_llm(vote_id, lang)


def search_votes_by_keyword(keyword: str, include_historical: bool = False) -> List[Dict]:
    """
    Search votes by keyword.
    Set include_historical=True to search past votes as well.
    """
    return search_votes(keyword, include_historical=include_historical)


def get_all_upcoming_context(lang: str = 'de', include_pdfs: bool = True) -> str:
    """Get comprehensive context for all upcoming votes."""
    return get_all_upcoming_context_for_llm(lang, include_pdfs=include_pdfs)


def get_historical_votes(year: int = None, rechtsform: int = None, lang: str = 'de') -> List[Dict]:
    """
    Get historical votes with optional filtering.

    Args:
        year: Filter by year (e.g., 2024)
        rechtsform: Filter by type (3=Volksinitiative)
        lang: Language code

    Returns:
        List of vote dictionaries
    """
    df = fetch_csv()
    results = []

    for _, row in df.iterrows():
        # Parse date
        try:
            date = datetime.strptime(str(row.get('datum', '')), '%d.%m.%Y')
        except:
            continue

        # Check if it's a past vote (has result)
        volkja = row.get('volkja', '')
        if volkja == '' or (hasattr(volkja, '__iter__') and not volkja):
            continue  # Skip upcoming votes

        # Year filter
        if year and date.year != year:
            continue

        # Rechtsform filter
        if rechtsform:
            try:
                if int(float(row.get('rechtsform', 0))) != rechtsform:
                    continue
            except:
                continue

        results.append(row_to_vote_dict(row, lang))

    # Sort by date descending
    results.sort(key=lambda x: datetime.strptime(x['abstimmungsdatum'], '%d.%m.%Y'), reverse=True)
    return results


def refresh_cache(include_pdfs: bool = True):
    """
    Force refresh the CSV cache and optionally refresh PDFs.

    Args:
        include_pdfs: If True, also clears and re-fetches all PDFs (default True)
    """
    fetch_csv(force_refresh=True)

    if include_pdfs:
        from pdf_extractor import clear_pdf_cache
        clear_pdf_cache()
        # Re-fetch PDFs for all languages
        prefetch_upcoming_pdfs('de')
        prefetch_upcoming_pdfs('fr')
        prefetch_upcoming_pdfs('it')


def prefetch_upcoming_pdfs(lang: str = 'de'):
    """Pre-fetch and cache all PDFs for upcoming votes."""
    from pdf_extractor import prefetch_pdfs_for_upcoming
    upcoming = get_upcoming_initiatives(lang)
    prefetch_pdfs_for_upcoming(upcoming, lang)


def get_pdf_stats():
    """Get statistics about cached PDFs."""
    from pdf_extractor import get_cached_pdf_stats
    return get_cached_pdf_stats()


# --- Step 4: Build dataset (for backward compatibility) ---
def build_dataset() -> Dict:
    """Build dataset structure (backward compatible)."""
    initiatives = get_upcoming_initiatives()
    return {
        "metadata": {
            "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "data_version": "2.0",
            "data_source": "swissvotes_csv",
            "sources": [BASE, "https://www.admin.ch"]
        },
        "federal_initiatives": initiatives,
        "usage_metrics": {}
    }


# --- CLI ---
if __name__ == "__main__":
    print("Fetching Swiss voting data from CSV...")
    data = build_dataset()
    out = os.path.join(OUT_DIR, "current_initiatives.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ Wrote {len(data['federal_initiatives'])} upcoming votes to current_initiatives.json")

    # Show upcoming votes
    print("\n📋 Upcoming votes:")
    for vote in data['federal_initiatives']:
        print(f"  - {vote['abstimmungsdatum']}: {vote['title_de']}")
