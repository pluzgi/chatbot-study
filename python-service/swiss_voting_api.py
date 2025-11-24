from flask import Flask, jsonify, request
from flask_cors import CORS
from swiss_voting_tools import (
    get_upcoming_initiatives,
    get_vote_by_id,
    get_brochure_text,
    search_votes_by_keyword
)

app = Flask(__name__)
CORS(app)

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

@app.route('/api/initiatives/upcoming')
def upcoming():
    try:
        data = get_upcoming_initiatives()
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/initiatives/<vote_id>')
def get_vote(vote_id):
    try:
        lang = request.args.get('lang', 'de')
        vote = get_vote_by_id(vote_id)
        brochure = get_brochure_text(vote_id, lang)
        return jsonify({
            'vote': vote,
            'brochure': brochure
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/initiatives/search')
def search():
    try:
        keyword = request.args.get('q', '')
        results = search_votes_by_keyword(keyword)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
