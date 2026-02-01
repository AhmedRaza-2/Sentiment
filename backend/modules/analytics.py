from gensim import corpora, models
from transformers import pipeline
import requests
import random
import os

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

    def perform_lda(self, cleaned_texts, num_topics=3):
        if not cleaned_texts:
            return []
        
        # Tokenize for Gensim
        tokenized_data = [text.split() for text in cleaned_texts if text]
        if not tokenized_data: return []

        dictionary = corpora.Dictionary(tokenized_data)
        corpus = [dictionary.doc2bow(text) for text in tokenized_data]
        
        # Simple LDA
        lda_model = models.LdaModel(corpus, num_topics=num_topics, id2word=dictionary, passes=10)
        
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
