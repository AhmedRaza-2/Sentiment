from gensim import corpora, models
from transformers import pipeline
import requests
import random
import os
import re

class AnalyticsEngine:
    def __init__(self, perspective_key=None):
        self.perspective_key = perspective_key
        # We'll use a fast model for sentiment
        # nlptown/bert-base-multilingual-uncased-sentiment gives 1-5 stars
        print("Loading Sentiment Analysis model...")
        try:
            self.sentiment_analyzer = pipeline(
                "sentiment-analysis", 
                model="distilbert-base-uncased-finetuned-sst-2-english"
            )
        except Exception as e:
            print(f"Error loading sentiment model: {e}")
            self.sentiment_analyzer = None
        
        # Define comprehensive stopwords list
        self.stopwords = set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
            'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
            'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
            'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
            'them', 'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how',
            'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
            'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
            'very', 's', 't', 'just', 'now', 'amp', 'rt', 'via'
        ])

    def _preprocess_text(self, text):
        """Clean and preprocess text for topic modeling"""
        # Convert to lowercase
        text = text.lower()
        # Remove URLs
        text = re.sub(r'http\S+|www\S+|https\S+', '', text)
        # Remove mentions
        text = re.sub(r'@\w+', '', text)
        # Remove hashtag symbols but keep the word
        text = re.sub(r'#', '', text)
        # Remove special characters and numbers
        text = re.sub(r'[^a-z\s]', '', text)
        # Split into words
        words = text.split()
        # Filter stopwords and short words
        words = [w for w in words if w not in self.stopwords and len(w) > 2]
        return ' '.join(words)

    def perform_lda(self, cleaned_texts, num_topics=3):
        if not cleaned_texts:
            return []
        
        # Preprocess all texts
        processed_texts = [self._preprocess_text(text) for text in cleaned_texts]
        
        # Tokenize for Gensim
        tokenized_data = [text.split() for text in processed_texts if text.strip()]
        if not tokenized_data: return []

        dictionary = corpora.Dictionary(tokenized_data)
        # Filter extremes to remove very rare and very common words
        dictionary.filter_extremes(no_below=2, no_above=0.5)
        corpus = [dictionary.doc2bow(text) for text in tokenized_data]
        
        if not corpus or not any(corpus):
            return []
        
        # Simple LDA
        lda_model = models.LdaModel(corpus, num_topics=num_topics, id2word=dictionary, passes=10, random_state=42)
        
        topics = []
        for idx, topic in lda_model.print_topics(-1):
            topics.append({"id": idx, "words": topic})
        return topics

    def analyze_sentiment(self, text):
        if not self.sentiment_analyzer:
            return {"label": "NEUTRAL", "score": 0.5}
            
        try:
            result = self.sentiment_analyzer(text)[0]
            # SST-2 returns POSITIVE/NEGATIVE
            return {"label": result['label'], "score": result['score']}
        except:
            return {"label": "NEUTRAL", "score": 0.5}

    def get_toxicity_score(self, text):
        """
        Calls Perspective API or simulates if key is missing/error
        """
        if not self.perspective_key or self.perspective_key == "YOUR_KEY_HERE":
            return self._simulate_toxicity(text)
        
        url = f"https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key={self.perspective_key}"
        data = {
            "comment": {"text": text},
            "languages": ["en"],
            "requestedAttributes": {"TOXICITY": {}}
        }
        try:
            r = requests.post(url, json=data, timeout=5)
            if r.status_code == 200:
                res = r.json()
                return res['attributeScores']['TOXICITY']['summaryScore']['value']
            return self._simulate_toxicity(text)
        except:
            return self._simulate_toxicity(text)

    def _simulate_toxicity(self, text):
        # Mock logic based on keywords
        words = text.lower().split()
        toxic_keywords = ["bad", "toxic", "hate", "stupid", "angry", "terrible", "garbage"]
        base = random.uniform(0.01, 0.1)
        hits = sum(1 for w in words if w in toxic_keywords)
        score = base + (hits * 0.2)
        return min(score, 1.0)
