from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from config import Config
from modules.acquisition import DataAcquisition
from modules.preprocessing import Preprocessor
from modules.analytics import AnalyticsEngine
from modules.persistence import PersistenceManager
import threading

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize Modules
acquisition = DataAcquisition(app.config['TWITTER_BEARER_TOKEN'], app.config['MOCK_MODE'])
preprocessor = Preprocessor()
analytics = AnalyticsEngine(app.config['PERSPECTIVE_API_KEY'])
persistence = PersistenceManager()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok", 
        "mock_mode": app.config['MOCK_MODE'],
        "perspective_key": "Set" if app.config['PERSPECTIVE_API_KEY'] else "Missing"
    })

def run_background_analysis(query, sid):
    """
    Function to run the analysis pipeline and emit updates via SocketIO
    """
    try:
        emit_status(sid, "Fetching tweets...")
        tweets = acquisition.fetch_tweets(query, max_results=20)
        
        emit_status(sid, "Preprocessing text...")
        processed_tweets = preprocessor.process_batch(tweets)
        
        emit_status(sid, "Analyzing Sentiment & Toxicity...")
        results = []
        cleaned_texts = []
        
        for tweet in processed_tweets:
            sentiment = analytics.analyze_sentiment(tweet['text'])
            toxicity = analytics.get_toxicity_score(tweet['text'])
            
            tweet_result = {
                **tweet,
                "sentiment": sentiment,
                "toxicity": toxicity
            }
            results.append(tweet_result)
            if tweet['clean_text']:
                cleaned_texts.append(tweet['clean_text'])
        
        emit_status(sid, "Identifying Topics...")
        topics = analytics.perform_lda(cleaned_texts)
        
        # Final Result
        final_data = {
            "query": query,
            "tweets": results,
            "topics": topics,
            "stats": calculate_stats(results)
        }
        
        # Persist to disk
        persistence.save_analysis(query, final_data)
        
        socketio.emit('analysis_result', final_data, to=sid)
        
    except Exception as e:
        socketio.emit('error', {"message": str(e)}, to=sid)

@app.route('/api/user', methods=['POST'])
def save_user():
    data = request.json
    if not data or 'uid' not in data:
        return jsonify({"error": "Invalid user data"}), 400
    
    persistence.save_user(data)
    return jsonify({"status": "user saved"})

def emit_status(sid, message):
    socketio.emit('status_update', {"message": message}, to=sid)

def calculate_stats(results):
    if not results: return {}
    pos = sum(1 for r in results if r['sentiment']['label'] == 'POSITIVE')
    neg = sum(1 for r in results if r['sentiment']['label'] == 'NEGATIVE')
    avg_tox = sum(r['toxicity'] for r in results) / len(results)
    
    return {
        "total": len(results),
        "positive": pos,
        "negative": neg,
        "neutral": len(results) - pos - neg,
        "avg_toxicity": round(avg_tox, 2)
    }

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.json
    query = data.get('query', '')
    sid = data.get('sid') # Socket ID for targeted communication
    
    if not query:
        return jsonify({"error": "Query is required"}), 400
    
    # Run analysis in background thread to avoid blocking
    thread = threading.Thread(target=run_background_analysis, args=(query, sid))
    thread.start()
    
    return jsonify({
        "status": "started",
        "message": f"Analysis started for: {query}"
    })

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5003)
