# python-service/swissvotes_csv.py
"""
Swissvotes CSV Data Service
Fetches and caches the official Swissvotes dataset for Swiss federal votes.
Production-ready for Infomaniak deployment.
"""

import os
import pandas as pd
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json

# Configuration - use environment variables for production
CSV_URL = os.environ.get('SWISSVOTES_CSV_URL', "https://swissvotes.ch/page/dataset/swissvotes_dataset.csv")
DATA_DIR = os.environ.get('SWISSVOTES_DATA_DIR', os.path.join(os.path.dirname(__file__), "data"))
CACHE_FILE = os.path.join(DATA_DIR, "swissvotes_cache.csv")
CACHE_META_FILE = os.path.join(DATA_DIR, "swissvotes_cache_meta.json")
CACHE_MAX_AGE_DAYS = int(os.environ.get('SWISSVOTES_CACHE_DAYS', 7))  # Weekly refresh

# Party code mappings (from CODEBOOK)
PARTY_CODES = {
    1: "Ja",
    2: "Nein",
    3: "Keine Parole",
    4: "Stimmfreigabe (Leer)",
    5: "Stimmfreigabe",
    66: "Vorlage 1 (Initiative)",
    67: "Vorlage 2 (Gegenentwurf)",
    8: "Gegenentwurf",
    9: "Keine Parole / Nein"
}

# Rechtsform mappings
RECHTSFORM_CODES = {
    1: "Obligatorisches Referendum",
    2: "Fakultatives Referendum",
    3: "Volksinitiative",
    4: "Direkter Gegenentwurf",
    5: "Stichfrage"
}

# Federal Council position
BR_POS_CODES = {
    1: "Empfehlung: Ja",
    2: "Empfehlung: Nein",
    8: "Gegenentwurf",
    9: "Keine Empfehlung"
}

# Main party columns
MAIN_PARTIES = [
    ("p-fdp", "FDP"),
    ("p-sps", "SP"),
    ("p-svp", "SVP"),
    ("p-mitte", "Mitte"),
    ("p-gps", "Grüne"),
    ("p-glp", "GLP"),
    ("p-evp", "EVP"),
]

os.makedirs(DATA_DIR, exist_ok=True)


def _get_cache_age() -> Optional[float]:
    """Get cache age in days, or None if no cache exists."""
    if not os.path.exists(CACHE_META_FILE):
        return None
    try:
        with open(CACHE_META_FILE, 'r') as f:
            meta = json.load(f)
        cached_time = datetime.fromisoformat(meta['cached_at'])
        age = datetime.now() - cached_time
        return age.total_seconds() / 86400  # Convert to days
    except Exception:
        return None


def _update_cache_meta():
    """Update cache metadata with current timestamp."""
    with open(CACHE_META_FILE, 'w') as f:
        json.dump({'cached_at': datetime.now().isoformat()}, f)


def fetch_csv(force_refresh: bool = False) -> pd.DataFrame:
    """
    Fetch Swissvotes CSV with caching.

    Args:
        force_refresh: If True, ignore cache and fetch fresh data

    Returns:
        pandas DataFrame with all vote data
    """
    cache_age = _get_cache_age()

    # Use cache if valid and not forcing refresh
    if not force_refresh and cache_age is not None and cache_age < CACHE_MAX_AGE_DAYS:
        if os.path.exists(CACHE_FILE):
            try:
                df = pd.read_csv(CACHE_FILE, sep=';', encoding='utf-8-sig', low_memory=False)
                print(f"[SwissvotesCSV] Using cached data ({cache_age:.1f} days old)")
                return df
            except Exception as e:
                print(f"[SwissvotesCSV] Cache read error: {e}, fetching fresh data")

    # Fetch fresh data
    print(f"[SwissvotesCSV] Fetching fresh data from {CSV_URL}")
    try:
        response = requests.get(CSV_URL, timeout=60)
        response.raise_for_status()

        # Save to cache
        with open(CACHE_FILE, 'wb') as f:
            f.write(response.content)
        _update_cache_meta()

        df = pd.read_csv(CACHE_FILE, sep=';', encoding='utf-8-sig', low_memory=False)
        print(f"[SwissvotesCSV] Cached {len(df)} votes")
        return df
    except Exception as e:
        print(f"[SwissvotesCSV] Fetch error: {e}")
        # Fall back to cache if available
        if os.path.exists(CACHE_FILE):
            print("[SwissvotesCSV] Falling back to stale cache")
            return pd.read_csv(CACHE_FILE, sep=';', encoding='utf-8-sig', low_memory=False)
        raise


def _parse_date(date_str: str) -> Optional[datetime]:
    """Parse date string in DD.MM.YYYY format."""
    try:
        return datetime.strptime(str(date_str), '%d.%m.%Y')
    except:
        return None


def _format_party_parole(code) -> str:
    """Convert party parole code to human-readable text."""
    try:
        code_int = int(float(code))
        return PARTY_CODES.get(code_int, "")
    except:
        return ""


def _get_party_paroles(row: pd.Series) -> List[str]:
    """Extract party paroles as formatted strings."""
    paroles = []
    for col, party_name in MAIN_PARTIES:
        if col in row and pd.notna(row[col]) and row[col] != '':
            parole = _format_party_parole(row[col])
            if parole:
                paroles.append(f"{party_name}: {parole}")
    return paroles


def row_to_vote_dict(row: pd.Series, lang: str = 'de') -> Dict:
    """
    Convert a CSV row to a vote dictionary with rich information.

    Args:
        row: pandas Series representing one vote
        lang: Language code ('de', 'fr', 'en')

    Returns:
        Dictionary with vote information
    """
    # Title based on language
    title_cols = {
        'de': 'titel_kurz_d',
        'fr': 'titel_kurz_f',
        'en': 'titel_kurz_e'
    }
    title_col = title_cols.get(lang, 'titel_kurz_d')

    # Get basic info
    anr = str(row.get('anr', ''))
    datum = str(row.get('datum', ''))

    # Determine if upcoming (no result yet)
    volkja = row.get('volkja', '')
    is_upcoming = pd.isna(volkja) or volkja == ''

    # Get rechtsform
    rechtsform_code = row.get('rechtsform', '')
    try:
        rechtsform = RECHTSFORM_CODES.get(int(float(rechtsform_code)), str(rechtsform_code))
    except:
        rechtsform = str(rechtsform_code)

    # Get Federal Council position
    br_pos_code = row.get('br-pos', '')
    try:
        br_pos = BR_POS_CODES.get(int(float(br_pos_code)), '')
    except:
        br_pos = ''

    # Build result dict
    result = {
        "vote_id": anr.split('.')[0],
        "anr": anr,
        "official_number": anr,
        "abstimmungsdatum": datum,
        "title_de": str(row.get('titel_kurz_d', '')),
        "title_fr": str(row.get('titel_kurz_f', '')),
        "title_en": str(row.get('titel_kurz_e', '')),
        "offizieller_titel": str(row.get('titel_off_d', '')),
        "schlagwort": str(row.get('stichwort', '')),
        "rechtsform": rechtsform,
        "rechtsform_code": rechtsform_code,
        "position_bundesrat": br_pos,
        "br_pos_code": br_pos_code,
        "parteiparolen": _get_party_paroles(row),
        "is_upcoming": is_upcoming,
        "details_url": f"https://swissvotes.ch/vote/{anr}",
        "abstimmungstext_pdf": f"https://swissvotes.ch/vote/{anr}/abstimmungstext-de.pdf" if anr else None,
        "botschaft_des_bundesrats_pdf": f"https://swissvotes.ch/vote/{anr}/botschaft-de.pdf" if anr else None,
    }

    # Add result data for past votes
    if not is_upcoming:
        try:
            result["volkja_proz"] = float(row.get('volkja-proz', 0))
            result["accepted"] = result["volkja_proz"] > 50
        except:
            pass
        try:
            result["kt_ja"] = int(float(row.get('kt-ja', 0)))
            result["kt_nein"] = int(float(row.get('kt-nein', 0)))
        except:
            pass
    else:
        # For upcoming: include poll prediction if available
        try:
            poll_pct = row.get('volkja-proz', '')
            if pd.notna(poll_pct) and poll_pct != '':
                result["poll_prediction_proz"] = float(poll_pct)
        except:
            pass

    # Policy areas
    for i, col in enumerate(['d1e1', 'd1e2', 'd1e3'], 1):
        if col in row and pd.notna(row[col]):
            result[f"policy_area_{i}"] = str(row[col])

    return result


def get_upcoming_votes(lang: str = 'de') -> List[Dict]:
    """Get all upcoming votes (future date, no result yet)."""
    df = fetch_csv()
    today = datetime.now()

    results = []
    for _, row in df.iterrows():
        date = _parse_date(row.get('datum', ''))
        volkja = row.get('volkja', '')

        # Upcoming = future date OR no result yet
        if date and (date > today or (pd.isna(volkja) or volkja == '')):
            if date > today:  # Only truly upcoming
                results.append(row_to_vote_dict(row, lang))

    # Sort by date
    results.sort(key=lambda x: _parse_date(x['abstimmungsdatum']) or datetime.max)
    return results


def get_vote_by_id(vote_id: str, lang: str = 'de') -> Optional[Dict]:
    """Get a specific vote by its ID (anr)."""
    df = fetch_csv()

    # Handle both "677" and "677.00" formats
    vote_id_clean = vote_id.split('.')[0]

    for _, row in df.iterrows():
        anr = str(row.get('anr', ''))
        if anr.split('.')[0] == vote_id_clean:
            return row_to_vote_dict(row, lang)

    return None


def search_votes(keyword: str, lang: str = 'de', include_historical: bool = True) -> List[Dict]:
    """
    Search votes by keyword.

    Args:
        keyword: Search term
        lang: Language for results
        include_historical: If False, only return upcoming votes

    Returns:
        List of matching votes
    """
    df = fetch_csv()
    keyword_lower = keyword.lower()
    today = datetime.now()

    results = []
    for _, row in df.iterrows():
        # Search in relevant text fields
        searchable = ' '.join([
            str(row.get('titel_kurz_d', '')),
            str(row.get('titel_kurz_f', '')),
            str(row.get('titel_kurz_e', '')),
            str(row.get('titel_off_d', '')),
            str(row.get('stichwort', '')),
        ]).lower()

        if keyword_lower in searchable:
            date = _parse_date(row.get('datum', ''))
            is_upcoming = date and date > today

            if include_historical or is_upcoming:
                results.append(row_to_vote_dict(row, lang))

    # Sort: upcoming first, then by date descending
    results.sort(key=lambda x: (
        0 if x.get('is_upcoming') else 1,
        _parse_date(x['abstimmungsdatum']) or datetime.min
    ), reverse=True)

    return results


def get_vote_context_for_llm(vote_id: str, lang: str = 'de', include_pdfs: bool = True) -> str:
    """
    Get comprehensive context for a vote, formatted for LLM consumption.
    Includes extracted text from all available PDF documents.

    Args:
        vote_id: Vote ID (anr)
        lang: Language code
        include_pdfs: Whether to include PDF content (default True)

    Returns:
        Formatted string with all relevant vote information including PDF content
    """
    from pdf_extractor import get_vote_pdf_context

    vote = get_vote_by_id(vote_id, lang)
    if not vote:
        return ""

    lines = []

    # Title and basic info
    title = vote.get(f'title_{lang}') or vote.get('title_de', '')
    lines.append(f"=== {title} ===")
    lines.append(f"Abstimmungsdatum: {vote['abstimmungsdatum']}")
    lines.append(f"Rechtsform: {vote['rechtsform']}")

    if vote.get('offizieller_titel'):
        lines.append(f"Offizieller Titel: {vote['offizieller_titel']}")

    # Federal Council position
    if vote.get('position_bundesrat'):
        lines.append(f"\nPosition des Bundesrats: {vote['position_bundesrat']}")

    # Party paroles
    if vote.get('parteiparolen'):
        lines.append("\nParteiparolen:")
        for parole in vote['parteiparolen']:
            lines.append(f"  - {parole}")

    # Result or poll prediction
    if vote.get('is_upcoming'):
        lines.append(f"\nStatus: Noch nicht abgestimmt")
        if vote.get('poll_prediction_proz'):
            lines.append(f"Umfrageprognose: {vote['poll_prediction_proz']:.1f}% Ja")
    else:
        if vote.get('volkja_proz'):
            result = "Angenommen" if vote.get('accepted') else "Abgelehnt"
            lines.append(f"\nResultat: {result} ({vote['volkja_proz']:.1f}% Ja)")
        if vote.get('kt_ja') is not None:
            lines.append(f"Stände: {vote['kt_ja']} Ja, {vote.get('kt_nein', 0)} Nein")

    # Links
    lines.append(f"\nMehr Infos: {vote['details_url']}")

    # Add PDF content if requested
    if include_pdfs:
        pdf_context = get_vote_pdf_context(vote_id, lang)
        if pdf_context:
            lines.append(f"\n\n=== DOKUMENTE ===\n{pdf_context}")

    return "\n".join(lines)


def get_all_upcoming_context_for_llm(lang: str = 'de', include_pdfs: bool = True) -> str:
    """
    Get comprehensive context for all upcoming votes, formatted for LLM.
    Includes extracted text from all available PDF documents.

    Args:
        lang: Language code
        include_pdfs: Whether to include PDF content (default True)

    Returns:
        Formatted string with all upcoming vote information including PDF content
    """
    from pdf_extractor import get_vote_pdf_context

    votes = get_upcoming_votes(lang)

    if not votes:
        return "Keine anstehenden Abstimmungen gefunden."

    sections = []
    for vote in votes:
        lines = []
        title = vote.get(f'title_{lang}') or vote.get('title_de', '')
        lines.append(f"=== {title} ===")
        lines.append(f"Abstimmungsdatum: {vote['abstimmungsdatum']}")
        lines.append(f"Rechtsform: {vote['rechtsform']}")

        if vote.get('offizieller_titel'):
            lines.append(f"Offizieller Titel: {vote['offizieller_titel']}")

        if vote.get('position_bundesrat'):
            lines.append(f"\nPosition des Bundesrats: {vote['position_bundesrat']}")

        if vote.get('parteiparolen'):
            lines.append("\nParteiparolen:")
            for parole in vote['parteiparolen']:
                lines.append(f"  - {parole}")

        if vote.get('poll_prediction_proz'):
            lines.append(f"\nUmfrageprognose: {vote['poll_prediction_proz']:.1f}% Ja")

        lines.append(f"\nMehr Infos: {vote['details_url']}")

        # Add PDF content if requested
        if include_pdfs:
            anr = vote.get('anr')
            if anr:
                pdf_context = get_vote_pdf_context(anr, lang)
                if pdf_context:
                    lines.append(f"\n--- DOKUMENTE ---\n{pdf_context}")

        sections.append("\n".join(lines))

    return "\n\n".join(sections)
