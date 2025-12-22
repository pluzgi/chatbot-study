import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from swiss_voting_tools import (
    get_upcoming_initiatives,
    get_vote_by_id_legacy,
    get_brochure_text,
    search_votes_by_keyword,
    get_all_upcoming_context,
    get_historical_votes,
    refresh_cache,
    prefetch_upcoming_pdfs,
    get_pdf_stats
)

app = Flask(__name__)
CORS(app)

# Production startup: prefetch data if enabled
PREFETCH_ON_STARTUP = os.environ.get('SWISSVOTES_PREFETCH_ON_STARTUP', 'false').lower() == 'true'


@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'data_source': 'swissvotes_csv'})


@app.route('/api/initiatives/upcoming')
def upcoming():
    """Get all upcoming votes with full details."""
    try:
        lang = request.args.get('lang', 'de')
        data = get_upcoming_initiatives(lang)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/initiatives/upcoming/context')
def upcoming_context():
    """
    Get comprehensive context for all upcoming votes.
    Formatted for LLM consumption - ideal for chatbot system prompts.
    Query params:
        - lang: Language (de, fr, en)
        - include_pdfs: Include PDF content (default: false for faster response)
    """
    try:
        lang = request.args.get('lang', 'de')
        include_pdfs = request.args.get('include_pdfs', 'false').lower() == 'true'
        context = get_all_upcoming_context(lang, include_pdfs=include_pdfs)
        return jsonify({
            'context': context,
            'lang': lang,
            'include_pdfs': include_pdfs
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/initiatives/<vote_id>')
def get_vote(vote_id):
    """Get detailed information for a specific vote."""
    try:
        lang = request.args.get('lang', 'de')
        vote = get_vote_by_id_legacy(vote_id, lang)
        brochure = get_brochure_text(vote_id, lang)
        return jsonify({
            'vote': vote,
            'brochure': brochure
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/initiatives/<vote_id>/context')
def get_vote_context(vote_id):
    """
    Get comprehensive context for a specific vote.
    Formatted for LLM consumption.
    """
    try:
        lang = request.args.get('lang', 'de')
        context = get_brochure_text(vote_id, lang)
        return jsonify({
            'context': context,
            'vote_id': vote_id,
            'lang': lang
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/initiatives/search')
def search():
    """Search votes by keyword."""
    try:
        keyword = request.args.get('q', '')
        include_historical = request.args.get('historical', 'false').lower() == 'true'
        results = search_votes_by_keyword(keyword, include_historical=include_historical)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/initiatives/historical')
def historical():
    """
    Get historical votes with optional filtering.
    Query params:
        - year: Filter by year (e.g., 2024)
        - type: Filter by rechtsform (3=Volksinitiative)
        - lang: Language (de, fr, en)
    """
    try:
        year = request.args.get('year', type=int)
        rechtsform = request.args.get('type', type=int)
        lang = request.args.get('lang', 'de')
        results = get_historical_votes(year=year, rechtsform=rechtsform, lang=lang)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/cache/refresh', methods=['POST'])
def cache_refresh():
    """Force refresh the CSV cache."""
    try:
        refresh_cache()
        return jsonify({'status': 'ok', 'message': 'Cache refreshed'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/pdf/prefetch', methods=['POST'])
def pdf_prefetch():
    """
    Pre-fetch and cache all PDFs for upcoming votes.
    This may take several minutes depending on the number of votes.
    """
    try:
        lang = request.args.get('lang', 'de')
        prefetch_upcoming_pdfs(lang)
        stats = get_pdf_stats()
        return jsonify({
            'status': 'ok',
            'message': 'PDF prefetch complete',
            'stats': stats
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/pdf/stats')
def pdf_stats():
    """Get statistics about cached PDFs."""
    try:
        stats = get_pdf_stats()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def startup_prefetch():
    """Run prefetch on startup if enabled via environment variable."""
    if PREFETCH_ON_STARTUP:
        print("[Startup] SWISSVOTES_PREFETCH_ON_STARTUP is enabled")
        print("[Startup] Refreshing CSV cache...")
        try:
            refresh_cache()
            print("[Startup] CSV cache refreshed")
        except Exception as e:
            print(f"[Startup] CSV refresh failed: {e}")

        print("[Startup] Prefetching PDFs for upcoming votes (DE, FR, IT)...")
        try:
            prefetch_upcoming_pdfs('de')
            prefetch_upcoming_pdfs('fr')
            prefetch_upcoming_pdfs('it')
            stats = get_pdf_stats()
            print(f"[Startup] PDF prefetch complete: {stats}")
        except Exception as e:
            print(f"[Startup] PDF prefetch failed: {e}")
    else:
        print("[Startup] Prefetch disabled. Set SWISSVOTES_PREFETCH_ON_STARTUP=true to enable.")


# Run prefetch when module is imported (for gunicorn/WSGI)
startup_prefetch()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
