from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from datetime import datetime
import traceback

# Import our modules
from twitter_client import TwitterClient
from sentiment_analyzer import SentimentAnalyzer
from toxicity_detector import ToxicityDetector

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:3001"])
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Initialize services GLOBALLY (load once)
print("\n" + "="*60)
print("🚀 INITIALIZING CONVOSENSE BACKEND")
print("="*60)

# MongoDB
MONGO_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
DATABASE_NAME = os.getenv('DATABASE_NAME', 'convosense')

try:
    mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = mongo_client[DATABASE_NAME]
    mongo_client.server_info()
    print(f"✅ MongoDB connected: {DATABASE_NAME}")
except Exception as e:
    print(f"⚠️  MongoDB connection failed: {e}")
    print(f"⚠️  Continuing without database...")
    db = None

# Initialize AI services - THESE LOAD ONCE AT STARTUP
twitter_client = None
sentiment_analyzer = None
toxicity_detector = None

try:
    print("🐦 Initializing Twitter client...")
    twitter_client = TwitterClient()
    print("✅ Twitter client ready")
except Exception as e:
    print(f"❌ Twitter client failed: {e}")

try:
    print("🧠 Loading sentiment analysis model (this may take 30-60 seconds)...")
    sentiment_analyzer = SentimentAnalyzer()
    print("✅ Sentiment analyzer ready")
except Exception as e:
    print(f"❌ Sentiment analyzer failed: {e}")

try:
    print("⚠️  Initializing toxicity detector...")
    toxicity_detector = ToxicityDetector()
    print("✅ Toxicity detector ready")
except Exception as e:
    print(f"❌ Toxicity detector failed: {e}")

print("="*60 + "\n")

# Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "database": "connected" if db is not None else "disconnected",
        "services": {
            "twitter": "ready" if twitter_client else "unavailable",
            "sentiment": "ready" if sentiment_analyzer else "unavailable",
            "toxicity": "ready" if toxicity_detector else "unavailable"
        }
    }), 200

@app.route('/api/users/create', methods=['POST'])
def create_user():
    try:
        if db is None:
            return jsonify({"message": "Database unavailable, user not saved"}), 200
            
        data = request.json
        
        # Check if user exists
        existing_user = db.users.find_one({"uid": data.get('uid')})
        if existing_user:
            return jsonify({"message": "User already exists"}), 200
        
        # Create new user
        user_data = {
            "uid": data.get('uid'),
            "email": data.get('email'),
            "displayName": data.get('displayName'),
            "createdAt": data.get('createdAt', datetime.now().isoformat())
        }
        
        db.users.insert_one(user_data)
        print(f"✅ User created: {data.get('email')}")
        
        return jsonify({"message": "User created successfully"}), 201
        
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/<uid>', methods=['GET'])
def get_user(uid):
    try:
        if db is None:
            return jsonify({"error": "Database not connected"}), 500
            
        user = db.users.find_one({"uid": uid}, {"_id": 0})
        
        if user:
            return jsonify(user), 200
        else:
            return jsonify({"error": "User not found"}), 404
            
    except Exception as e:
        print(f"❌ Error fetching user: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_tweets():
    try:
        data = request.json
        query = data.get('query', '')
        max_tweets = min(data.get('max_tweets', 10), 20)  # REDUCED to 20 max
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        if not twitter_client:
            return jsonify({"error": "Twitter service unavailable"}), 503
        
        print(f"\n{'='*60}")
        print(f"🔍 Starting analysis for: '{query}'")
        print(f"{'='*60}\n")
        
        # Step 1: Fetch tweets (5%)
        socketio.emit('analysis_update', {
            'status': 'fetching',
            'message': f'🐦 Fetching tweets for "{query}"...',
            'progress': 5
        })
        
        tweets = twitter_client.search_tweets(query, max_results=max_tweets)
        
        if not tweets:
            socketio.emit('analysis_error', {
                'error': 'No tweets found for this query'
            })
            return jsonify({
                "error": "No tweets found",
                "query": query,
                "suggestion": "Try a different keyword or hashtag"
            }), 404
        
        socketio.emit('analysis_update', {
            'status': 'fetched',
            'message': f'✅ Found {len(tweets)} tweets',
            'progress': 20
        })
        
        # Step 2: Analyze sentiment (70% of work)
        socketio.emit('analysis_update', {
            'status': 'analyzing_sentiment',
            'message': f'🧠 Analyzing sentiment for {len(tweets)} tweets...',
            'progress': 30
        })
        
        if sentiment_analyzer:
            tweet_texts = [tweet['text'] for tweet in tweets]
            sentiments = sentiment_analyzer.analyze_batch(tweet_texts)
            overall_sentiment = sentiment_analyzer.get_overall_sentiment(sentiments)
            print(f"✅ Sentiment analysis complete")
        else:
            sentiments = [{'sentiment': 'NEUTRAL', 'confidence': 0.0}] * len(tweets)
            overall_sentiment = {
                'positive': 0, 'negative': 0, 'neutral': len(tweets),
                'positive_percentage': 0, 'negative_percentage': 0, 'neutral_percentage': 100,
                'total': len(tweets)
            }
        
        socketio.emit('analysis_update', {
            'status': 'sentiment_done',
            'message': '✅ Sentiment analysis complete',
            'progress': 70
        })
        
        # Step 3: Detect toxicity (only first 5 tweets to save time)
        socketio.emit('analysis_update', {
            'status': 'detecting_toxicity',
            'message': '⚠️  Detecting toxic content...',
            'progress': 80
        })
        
        toxicity_results = []
        if toxicity_detector and toxicity_detector.api_key:
            # Only analyze first 5 tweets (API is slow)
            sample_size = min(5, len(tweets))
            toxicity_sample = [tweet['text'] for tweet in tweets[:sample_size]]
            toxicity_results_sample = toxicity_detector.analyze_batch(toxicity_sample)
            
            # Fill rest with default
            toxicity_results = toxicity_results_sample + [
                toxicity_detector._default_response() for _ in range(len(tweets) - sample_size)
            ]
            print(f"✅ Toxicity detection complete (analyzed {sample_size} tweets)")
        else:
            toxicity_results = [
                {'toxicity': 0.0, 'is_toxic': False} for _ in tweets
            ]
        
        socketio.emit('analysis_update', {
            'status': 'toxicity_done',
            'message': '✅ Toxicity detection complete',
            'progress': 90
        })
        
        # Step 4: Combine results
        analyzed_tweets = []
        for i, tweet in enumerate(tweets):
            analyzed_tweets.append({
                **tweet,
                'sentiment': sentiments[i],
                'toxicity': toxicity_results[i]
            })
        
        # Step 5: Calculate statistics
        toxic_count = sum(1 for t in toxicity_results if t.get('is_toxic', False))
        
        result = {
            'query': query,
            'timestamp': datetime.now().isoformat(),
            'tweets_analyzed': len(analyzed_tweets),
            'sentiment': overall_sentiment,
            'toxicity': {
                'toxic_count': toxic_count,
                'clean_count': len(analyzed_tweets) - toxic_count,
                'toxicity_rate': round((toxic_count / len(analyzed_tweets)) * 100, 2) if analyzed_tweets else 0
            },
            'tweets': analyzed_tweets
        }
        
        # Step 6: Save to MongoDB
        if db is not None:
            try:
                db.analyses.insert_one({
                    **result,
                    'created_at': datetime.now()
                })
                print("✅ Analysis saved to database")
            except Exception as e:
                print(f"⚠️ Failed to save to database: {e}")
        
        # Step 7: Send final results
        socketio.emit('analysis_complete', {
            **result,
            'progress': 100
        })
        
        print(f"\n{'='*60}")
        print(f"✅ Analysis complete for: '{query}'")
        print(f"   Tweets: {result['tweets_analyzed']}")
        print(f"   Positive: {overall_sentiment['positive']} ({overall_sentiment['positive_percentage']}%)")
        print(f"   Negative: {overall_sentiment['negative']} ({overall_sentiment['negative_percentage']}%)")
        print(f"   Neutral: {overall_sentiment['neutral']} ({overall_sentiment['neutral_percentage']}%)")
        print(f"   Toxic: {toxic_count} ({result['toxicity']['toxicity_rate']}%)")
        print(f"{'='*60}\n")
        
        return jsonify(result), 200
        
    except Exception as e:
        error_msg = str(e)
        traceback.print_exc()
        print(f"❌ Analysis error: {error_msg}")
        socketio.emit('analysis_error', {'error': error_msg})
        return jsonify({"error": error_msg}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    """Get analysis history"""
    try:
        if db is None:
            return jsonify([]), 200
        
        analyses = list(db.analyses.find(
            {},
            {'_id': 0}
        ).sort('created_at', -1).limit(20))
        
        return jsonify(analyses), 200
    except Exception as e:
        print(f"❌ Error fetching history: {e}")
        return jsonify({"error": str(e)}), 500

# Socket.IO events
@socketio.on('connect')
def handle_connect():
    print('✅ Client connected')
    emit('connection_response', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    print('❌ Client disconnected')

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🧠 CONVOSENSE BACKEND SERVER READY")
    print("="*60)
    print(f"📊 Database: {DATABASE_NAME}")
    print(f"🔗 MongoDB: {'Connected' if db is not None else 'Disconnected'}")
    print(f"🐦 Twitter API: {'Ready' if twitter_client else 'Unavailable'}")
    print(f"🧠 Sentiment Analysis: {'Ready' if sentiment_analyzer else 'Unavailable'}")
    print(f"⚠️  Toxicity Detection: {'Ready' if toxicity_detector else 'Unavailable'}")
    print(f"🌐 Server: http://localhost:5003")
    print("="*60 + "\n")
    
    socketio.run(app, debug=True, host='0.0.0.0', port=5003, allow_unsafe_werkzeug=True)
