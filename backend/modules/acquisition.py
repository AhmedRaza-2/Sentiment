import tweepy
import random
from datetime import datetime

class DataAcquisition:
    def __init__(self, bearer_token, mock_mode=True):
        self.mock_mode = mock_mode
        self.client = None
        if not mock_mode and bearer_token:
            try:
                self.client = tweepy.Client(bearer_token=bearer_token)
            except Exception as e:
                print(f"Failed to initialize Tweepy: {e}")
                self.mock_mode = True

    def fetch_tweets(self, query, max_results=10):
        if self.mock_mode or not self.client:
            return self._generate_mock_tweets(query, max_results)
        
        try:
            # Note: Tweepy search_recent_tweets requires valid token
            response = self.client.search_recent_tweets(
                query=query, 
                max_results=max_results, 
                tweet_fields=['created_at', 'author_id', 'lang']
            )
            if response.data:
                return [tweet.data for tweet in response.data]
            return []
        except Exception as e:
            print(f"Error fetching real tweets: {e}")
            return self._generate_mock_tweets(query, max_results)

    def _generate_mock_tweets(self, query, count):
        mock_templates = [
            "I love the new {query}! It's amazing.",
            "The {query} is okay, but could be better.",
            "Terrible experience with {query}. Avoid it!",
            "Just saw some news about {query}. Interesting.",
            "{query} is definitely trending today.",
            "Anyone else using {query}? I have some questions.",
            "Wow, {query} is a game changer in the industry.",
            "Not sure how I feel about the latest {query} update.",
            "The community around {query} is so toxic lately.",
            "Support for {query} has been great so far."
        ]
        
        results = []
        for i in range(count):
            template = random.choice(mock_templates)
            results.append({
                "id": str(random.randint(10**15, 10**16)),
                "text": template.format(query=query),
                "created_at": datetime.now().isoformat(),
                "author_id": str(random.randint(10**8, 10**9)),
                "lang": "en"
            })
        return results
