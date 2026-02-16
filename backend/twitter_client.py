import os
import tweepy
from dotenv import load_dotenv
import random
from datetime import datetime, timedelta

load_dotenv()

class TwitterClient:
    def __init__(self):
        # Check if Mock Mode is enabled
        self.mock_mode = os.getenv('MOCK_MODE', 'False').lower() == 'true'
        
        if self.mock_mode:
            print("⚠️  Running in MOCK MODE (High-Fidelity Simulator)")
            return
        
        # Real Twitter API initialization
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
    
    def search_tweets(self, query, max_results=100):
        """
        Search for recent tweets using Twitter API v2 or generate mock data
        """
        # If Mock Mode, generate fake tweets
        if self.mock_mode:
            return self._generate_mock_tweets(query, max_results)
        
        # Real Twitter API call
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
    
    def _generate_mock_tweets(self, query, max_results=100):
        """Generate realistic mock tweets with diverse sentiments"""
        print(f"🎭 Generating {max_results} high-quality mock tweets for: '{query}'")
        
        # POSITIVE templates (40%)
        positive_templates = [
            f"Really excited about {query}! This is absolutely amazing! 🎉",
            f"Just discovered {query} and I'm loving every bit of it! Highly recommend 👍",
            f"{query} is fantastic! Best thing I've experienced in a while! ⭐",
            f"Can't stop talking about {query}! Everyone should try this! 💯",
            f"Wow! {query} exceeded all my expectations! Simply incredible! 🚀",
            f"{query} is a game changer! So impressed with the results! 🔥",
            f"Absolutely thrilled with {query}! Worth every penny! 💎",
            f"Best decision ever to get involved with {query}! Love it! ❤️",
            f"{query} has completely transformed my perspective! Amazing! ✨",
            f"Highly satisfied with {query}! Would recommend to everyone! 🌟",
            f"This is exactly what I needed! {query} is perfect! 👌",
            f"Incredible experience with {query}! Can't believe how good it is! 😍"
        ]
        
        # NEGATIVE templates (30%)
        negative_templates = [
            f"Not impressed with {query} at all. Very disappointing experience 😞",
            f"{query} is completely overrated. Total waste of time and money 👎",
            f"Terrible experience with {query}. Would NOT recommend to anyone ❌",
            f"Really frustrated with {query}. Needs major improvements ASAP 😤",
            f"{query} failed to deliver on promises. Such a letdown 💔",
            f"Regret getting involved with {query}. Poor quality overall 😠",
            f"{query} is a disaster. Save your money and avoid this! ⚠️",
            f"Extremely disappointed with {query}. Not worth it at all 😔",
            f"Had high hopes for {query} but it's just terrible 😡",
            f"Worst experience ever with {query}. Avoid at all costs! 🚫"
        ]
        
        # NEUTRAL templates (25%)
        neutral_templates = [
            f"Just heard about {query}. Anyone have real experience with this?",
            f"Considering {query} for my project. What are your honest thoughts?",
            f"Saw an interesting article about {query} today. Mixed reviews though.",
            f"{query} seems to be trending lately. What's all the hype about?",
            f"Looking into {query} options. Still undecided, need more info.",
            f"Anyone using {query}? Would love to hear pros and cons.",
            f"{query} came up in discussion. Seems like it has potential.",
            f"Researching {query} right now. Any recommendations or warnings?",
            f"Noticed {query} is getting attention. Worth investigating?",
            f"Curious about {query}. Has anyone tried it yet?",
            f"Thinking about {query}. Not sure if it's right for me.",
            f"Heard mixed things about {query}. Need more data to decide."
        ]
        
        # TOXIC templates (5% - for realistic testing)
        toxic_templates = [
            f"People who support {query} are complete idiots! Bunch of morons!",
            f"{query} is absolute garbage and anyone who likes it is stupid!",
            f"I hate everything about {query}! This is total BS!",
            f"{query} supporters are the worst! Can't stand these people!",
            f"Anyone defending {query} needs to get their head checked! Pathetic!"
        ]
        
        # Weighted distribution
        all_templates = (
            positive_templates * 4 +  # 40%
            negative_templates * 3 +  # 30%
            neutral_templates * 2 +   # 25%
            toxic_templates           # 5%
        )
        
        mock_tweets = []
        for i in range(max_results):
            template = random.choice(all_templates)
            created_time = datetime.now() - timedelta(hours=random.randint(1, 168))  # Last week
            
            mock_tweet = {
                'id': str(1234567890000000000 + i),
                'text': template,
                'created_at': created_time.isoformat(),
                'author': {
                    'id': str(987654321 + i),
                    'username': f'user_{random.randint(1000, 9999)}',
                    'name': f'Demo User {i+1}',
                    'verified': random.choice([True, False, False, False])  # 25% verified
                },
                'metrics': {
                    'likes': random.randint(5, 1000),
                    'retweets': random.randint(1, 200),
                    'replies': random.randint(0, 100),
                    'quotes': random.randint(0, 50)
                },
                'lang': 'en'
            }
            mock_tweets.append(mock_tweet)
        
        print(f"✅ Generated {len(mock_tweets)} realistic mock tweets")
        print(f"   Distribution: ~40% Positive, ~30% Negative, ~25% Neutral, ~5% Toxic")
        return mock_tweets