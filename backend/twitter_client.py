import os
import tweepy
from dotenv import load_dotenv

load_dotenv()

class TwitterClient:
    def __init__(self):
        self.bearer_token = os.getenv('TWITTER_BEARER_TOKEN')
        self.api_key = os.getenv('TWITTER_API_KEY')
        self.api_secret = os.getenv('TWITTER_API_SECRET')
        
        if not self.bearer_token:
            raise ValueError("❌ TWITTER_BEARER_TOKEN not found in .env")
        
        # Initialize Tweepy Client
        self.client = tweepy.Client(
            bearer_token=self.bearer_token,
            consumer_key=self.api_key,
            consumer_secret=self.api_secret,
            wait_on_rate_limit=True
        )
        
        print("✅ Twitter Client initialized successfully")
    
    def search_tweets(self, query, max_results=10):
        """
        Search for recent tweets using Twitter API v2
        """
        try:
            print(f"🔍 Searching Twitter for: '{query}'")
            
            # Add -is:retweet to get original tweets only
            search_query = f"{query} -is:retweet lang:en"
            
            # Search recent tweets
            tweets = self.client.search_recent_tweets(
                query=search_query,
                max_results=min(max_results, 100),  # Max 100 for recent search
                tweet_fields=['created_at', 'public_metrics', 'author_id', 'lang'],
                expansions=['author_id'],
                user_fields=['username', 'name', 'verified']
            )
            
            if not tweets.data:
                print(f"⚠️ No tweets found for '{query}'")
                return []
            
            # Format tweets
            formatted_tweets = []
            users = {user.id: user for user in tweets.includes.get('users', [])} if tweets.includes else {}
            
            for tweet in tweets.data:
                author = users.get(tweet.author_id)
                
                formatted_tweet = {
                    'id': str(tweet.id),
                    'text': tweet.text,
                    'created_at': str(tweet.created_at),
                    'author': {
                        'id': str(tweet.author_id),
                        'username': author.username if author else 'unknown',
                        'name': author.name if author else 'Unknown',
                        'verified': getattr(author, 'verified', False) if author else False
                    },
                    'metrics': {
                        'likes': tweet.public_metrics.get('like_count', 0),
                        'retweets': tweet.public_metrics.get('retweet_count', 0),
                        'replies': tweet.public_metrics.get('reply_count', 0),
                        'quotes': tweet.public_metrics.get('quote_count', 0)
                    },
                    'lang': tweet.lang
                }
                
                formatted_tweets.append(formatted_tweet)
            
            print(f"✅ Found {len(formatted_tweets)} tweets")
            return formatted_tweets
            
        except tweepy.TweepyException as e:
            print(f"❌ Twitter API Error: {e}")
            return []
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return []