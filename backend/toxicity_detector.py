import os
import requests
from dotenv import load_dotenv
import time

load_dotenv()

class ToxicityDetector:
    def __init__(self):
        self.api_key = os.getenv('PERSPECTIVE_API_KEY')
        self.api_url = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze'
        
        if not self.api_key:
            print("⚠️ PERSPECTIVE_API_KEY not found - toxicity detection disabled")
        else:
            print("✅ Toxicity Detector initialized")
    
    def analyze(self, text):
        """
        Analyze toxicity using Google Perspective API
        """
        if not self.api_key:
            return self._default_response()
        
        try:
            params = {'key': self.api_key}
            
            data = {
                'comment': {'text': text[:20000]},  # API limit
                'languages': ['en'],
                'requestedAttributes': {
                    'TOXICITY': {},
                    'SEVERE_TOXICITY': {},
                    'IDENTITY_ATTACK': {},
                    'INSULT': {},
                    'PROFANITY': {},
                    'THREAT': {}
                }
            }
            
            response = requests.post(self.api_url, params=params, json=data, timeout=5)
            
            if response.status_code == 200:
                result = response.json()
                scores = result.get('attributeScores', {})
                
                toxicity_score = scores.get('TOXICITY', {}).get('summaryScore', {}).get('value', 0)
                
                return {
                    'toxicity': round(toxicity_score, 4),
                    'severe_toxicity': round(scores.get('SEVERE_TOXICITY', {}).get('summaryScore', {}).get('value', 0), 4),
                    'identity_attack': round(scores.get('IDENTITY_ATTACK', {}).get('summaryScore', {}).get('value', 0), 4),
                    'insult': round(scores.get('INSULT', {}).get('summaryScore', {}).get('value', 0), 4),
                    'profanity': round(scores.get('PROFANITY', {}).get('summaryScore', {}).get('value', 0), 4),
                    'threat': round(scores.get('THREAT', {}).get('summaryScore', {}).get('value', 0), 4),
                    'is_toxic': toxicity_score > 0.7
                }
            else:
                print(f"⚠️ Perspective API error: {response.status_code}")
                return self._default_response()
                
        except Exception as e:
            print(f"❌ Toxicity detection error: {e}")
            return self._default_response()
    
    def _default_response(self):
        return {
            'toxicity': 0.0,
            'severe_toxicity': 0.0,
            'identity_attack': 0.0,
            'insult': 0.0,
            'profanity': 0.0,
            'threat': 0.0,
            'is_toxic': False
        }
    
    def analyze_batch(self, texts):
        """
        Analyze toxicity for multiple texts with rate limiting
        """
        results = []
        for i, text in enumerate(texts):
            results.append(self.analyze(text))
            # Rate limit: 1 request per second for free tier
            if i < len(texts) - 1:
                time.sleep(1.1)
        return results