# python-service/pdf_extractor.py
"""
PDF Extractor for Swissvotes documents.
Downloads and extracts text from official vote PDFs.
Production-ready for Infomaniak deployment.
"""

import os
import json
import hashlib
import requests
import pdfplumber
from typing import Dict, Optional, List
from datetime import datetime
import tempfile

# Configuration - use environment variables for production
DATA_DIR = os.environ.get('SWISSVOTES_DATA_DIR', os.path.join(os.path.dirname(__file__), "data"))
PDF_CACHE_DIR = os.path.join(DATA_DIR, "pdf_cache")
PDF_META_FILE = os.path.join(DATA_DIR, "pdf_cache_meta.json")
os.makedirs(PDF_CACHE_DIR, exist_ok=True)

# Document types available on Swissvotes
PDF_DOC_TYPES = {
    "abstimmungstext": "Abstimmungstext (Gesetzestext)",
    "botschaft": "Botschaft des Bundesrats",
    "vorpruefung": "Vorprüfung",
    "zustandekommen": "Zustandekommen",
}

# Languages
LANGUAGES = ["de", "fr"]


def _get_pdf_url(anr: str, doc_type: str, lang: str = "de") -> str:
    """Construct PDF URL for a vote document."""
    return f"https://swissvotes.ch/vote/{anr}/{doc_type}-{lang}.pdf"


def _get_cache_path(anr: str, doc_type: str, lang: str = "de") -> str:
    """Get local cache path for extracted PDF text."""
    safe_anr = anr.replace(".", "_")
    return os.path.join(PDF_CACHE_DIR, f"{safe_anr}_{doc_type}_{lang}.txt")


def _load_cache_meta() -> Dict:
    """Load PDF cache metadata."""
    if os.path.exists(PDF_META_FILE):
        try:
            with open(PDF_META_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {}


def _save_cache_meta(meta: Dict):
    """Save PDF cache metadata."""
    with open(PDF_META_FILE, 'w') as f:
        json.dump(meta, f, indent=2)


def _is_cached(anr: str, doc_type: str, lang: str = "de") -> bool:
    """Check if PDF text is already cached."""
    cache_path = _get_cache_path(anr, doc_type, lang)
    return os.path.exists(cache_path)


def download_and_extract_pdf(anr: str, doc_type: str, lang: str = "de", force: bool = False) -> Optional[str]:
    """
    Download a PDF from Swissvotes and extract its text.

    Args:
        anr: Vote number (e.g., "682.1")
        doc_type: Document type (abstimmungstext, botschaft, vorpruefung, zustandekommen)
        lang: Language (de, fr)
        force: Force re-download even if cached

    Returns:
        Extracted text or None if PDF not available
    """
    cache_path = _get_cache_path(anr, doc_type, lang)

    # Return cached version if available
    if not force and os.path.exists(cache_path):
        try:
            with open(cache_path, 'r', encoding='utf-8') as f:
                return f.read()
        except:
            pass

    # Download PDF
    url = _get_pdf_url(anr, doc_type, lang)
    print(f"[PDFExtractor] Downloading {url}")

    try:
        response = requests.get(url, timeout=30)
        if response.status_code != 200:
            print(f"[PDFExtractor] PDF not found: {url} (status {response.status_code})")
            return None

        # Check if it's actually a PDF
        content_type = response.headers.get('content-type', '')
        if 'pdf' not in content_type.lower() and not response.content[:4] == b'%PDF':
            print(f"[PDFExtractor] Not a PDF: {url}")
            return None

    except Exception as e:
        print(f"[PDFExtractor] Download error: {e}")
        return None

    # Extract text from PDF
    try:
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            tmp.write(response.content)
            tmp_path = tmp.name

        text_parts = []
        with pdfplumber.open(tmp_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)

        os.unlink(tmp_path)

        if not text_parts:
            print(f"[PDFExtractor] No text extracted from {url}")
            return None

        text = "\n\n".join(text_parts)

        # Cache the extracted text
        with open(cache_path, 'w', encoding='utf-8') as f:
            f.write(text)

        # Update metadata
        meta = _load_cache_meta()
        meta[f"{anr}_{doc_type}_{lang}"] = {
            "cached_at": datetime.now().isoformat(),
            "url": url,
            "size": len(text)
        }
        _save_cache_meta(meta)

        print(f"[PDFExtractor] Extracted {len(text)} chars from {doc_type}")
        return text

    except Exception as e:
        print(f"[PDFExtractor] Extraction error: {e}")
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        return None


def get_all_pdfs_for_vote(anr: str, lang: str = "de") -> Dict[str, Optional[str]]:
    """
    Get all available PDF texts for a vote.

    Args:
        anr: Vote number
        lang: Language

    Returns:
        Dict mapping doc_type to extracted text (or None if not available)
    """
    results = {}
    for doc_type in PDF_DOC_TYPES.keys():
        results[doc_type] = download_and_extract_pdf(anr, doc_type, lang)
    return results


def get_vote_pdf_context(anr: str, lang: str = "de", max_chars_per_doc: int = 5000) -> str:
    """
    Get formatted PDF context for a vote, suitable for LLM consumption.

    Args:
        anr: Vote number
        lang: Language
        max_chars_per_doc: Maximum characters to include per document (to limit context size)

    Returns:
        Formatted string with all available PDF content
    """
    pdfs = get_all_pdfs_for_vote(anr, lang)

    sections = []
    for doc_type, text in pdfs.items():
        if text:
            doc_name = PDF_DOC_TYPES.get(doc_type, doc_type)
            # Truncate if too long
            if len(text) > max_chars_per_doc:
                text = text[:max_chars_per_doc] + "\n[... Text gekürzt ...]"
            sections.append(f"--- {doc_name} ---\n{text}")

    if not sections:
        return ""

    return "\n\n".join(sections)


def prefetch_pdfs_for_upcoming(upcoming_votes: List[Dict], lang: str = "de"):
    """
    Pre-fetch and cache PDFs for all upcoming votes.

    Args:
        upcoming_votes: List of vote dictionaries with 'anr' field
        lang: Language to fetch
    """
    print(f"[PDFExtractor] Pre-fetching PDFs for {len(upcoming_votes)} upcoming votes...")

    for vote in upcoming_votes:
        anr = vote.get('anr')
        if not anr:
            continue

        print(f"[PDFExtractor] Fetching PDFs for vote {anr}...")
        for doc_type in PDF_DOC_TYPES.keys():
            if not _is_cached(anr, doc_type, lang):
                download_and_extract_pdf(anr, doc_type, lang)

    print("[PDFExtractor] Pre-fetch complete.")


def get_cached_pdf_stats() -> Dict:
    """Get statistics about cached PDFs."""
    meta = _load_cache_meta()

    if not meta:
        return {"cached_documents": 0, "total_size": 0}

    total_size = sum(entry.get('size', 0) for entry in meta.values())

    return {
        "cached_documents": len(meta),
        "total_size": total_size,
        "total_size_mb": round(total_size / 1024 / 1024, 2)
    }


def clear_pdf_cache():
    """
    Clear all cached PDF text files.
    Called when CSV data is refreshed to ensure PDFs are re-fetched.
    """
    print("[PDFExtractor] Clearing PDF cache...")

    # Remove all .txt files in cache directory
    if os.path.exists(PDF_CACHE_DIR):
        for filename in os.listdir(PDF_CACHE_DIR):
            if filename.endswith('.txt'):
                filepath = os.path.join(PDF_CACHE_DIR, filename)
                try:
                    os.remove(filepath)
                except Exception as e:
                    print(f"[PDFExtractor] Failed to remove {filename}: {e}")

    # Clear metadata
    if os.path.exists(PDF_META_FILE):
        try:
            os.remove(PDF_META_FILE)
        except Exception as e:
            print(f"[PDFExtractor] Failed to remove metadata: {e}")

    print("[PDFExtractor] PDF cache cleared.")
