import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

# Downloader helper
def setup_nltk():
    try:
        nltk.data.find('corpora/stopwords')
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        nltk.download('stopwords')
        nltk.download('punkt')
        nltk.download('punkt_tab')

class Preprocessor:
    def __init__(self):
        setup_nltk()
        self.stop_words = set(stopwords.words('english'))

    def clean_text(self, text):
        if not text:
            return ""
        # 1. Remove URLs
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
        # 2. Remove User Mentions (@user)
        text = re.sub(r'\@\w+', '', text)
        # 3. Remove Special Characters and Emojis (keep alphabets and spaces)
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        # 4. Tokenization and Lowercasing
        tokens = word_tokenize(text.lower())
        # 5. Stopword removal
        filtered_tokens = [w for w in tokens if w not in self.stop_words and len(w) > 2]
        
        return " ".join(filtered_tokens)

    def process_batch(self, tweets):
        """
        Receives a list of tweet dictionaries and adds a 'clean_text' field
        """
        processed = []
        for tweet in tweets:
            # We clone to avoid mutating original list if needed
            new_tweet = tweet.copy()
            new_tweet['clean_text'] = self.clean_text(new_tweet.get('text', ''))
            processed.append(new_tweet)
        return processed
