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
            return self._default_response(text)
        
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
                print(f"⚠️ Perspective API error: {response.status_code} - Using fallback detection")
                return self._default_response(text)
                
        except Exception as e:
            print(f"❌ Toxicity detection error: {e} - Using fallback detection")
            return self._default_response(text)
    
    def _default_response(self, text=""):
        """Fallback toxicity detection using keyword matching"""
        if not text:
            return {
                'toxicity': 0.0,
                'severe_toxicity': 0.0,
                'identity_attack': 0.0,
                'insult': 0.0,
                'profanity': 0.0,
                'threat': 0.0,
                'is_toxic': False
            }
        
        # Keyword-based toxicity detection (fallback)
        text_lower = text.lower()
        
        # Expanded keyword lists with more realistic patterns
        toxic_keywords = [
            'idiot', 'stupid', 'moron', 'hate', 'garbage', 'pathetic', 
            'worst', 'terrible', 'awful', 'disgusting', 'bs', 'crap',
            'suck', 'useless', 'worthless', 'trash', 'junk', 'horrible',
            'dumb', 'ridiculous', 'absurd', 'nonsense', 'shame', 'disaster',
            'failure', 'failed', 'scam', 'fake', 'lie', 'lies', 'lying',
            'corrupt', 'corruption', 'evil', 'wrong', 'bad', 'worse'
        ]
        severe_keywords = ['kill', 'die', 'death', 'threat', 'attack', 'destroy', 'harm', 'violence']
        insult_keywords = [
            'idiot', 'stupid', 'moron', 'dumb', 'fool', 'loser',
            'clown', 'joke', 'failure', 'incompetent', 'ignorant'
        ]
        profanity_keywords = ['damn', 'hell', 'crap', 'bs', 'wtf', 'shit', 'fuck']
        
        # Negative sentiment indicators (strong negative words)
        negative_indicators = ['not', 'never', 'no', 'dont', "don't", 'cant', "can't", 'wont', "won't"]
        
        # Count matches (check if word exists as substring)
        toxic_count = sum(1 for word in toxic_keywords if word in text_lower)
        severe_count = sum(1 for word in severe_keywords if word in text_lower)
        insult_count = sum(1 for word in insult_keywords if word in text_lower)
        profanity_count = sum(1 for word in profanity_keywords if word in text_lower)
        negative_count = sum(1 for word in negative_indicators if word in text_lower)
        
        # Boost toxicity if multiple negative indicators + toxic words
        toxicity_boost = 0.1 if (negative_count >= 2 and toxic_count >= 1) else 0
        
        # Calculate scores (0.0 - 1.0) with adjusted thresholds
        toxicity_score = min((toxic_count * 0.15) + toxicity_boost, 1.0)
        severe_score = min(severe_count * 0.5, 1.0)
        insult_score = min(insult_count * 0.25, 1.0)
        profanity_score = min(profanity_count * 0.4, 1.0)
        
        # Overall toxicity (weighted average)
        overall_toxicity = max(toxicity_score, insult_score, profanity_score * 0.8)
        
        return {
            'toxicity': round(overall_toxicity, 4),
            'severe_toxicity': round(severe_score, 4),
            'identity_attack': 0.0,
            'insult': round(insult_score, 4),
            'profanity': round(profanity_score, 4),
            'threat': round(severe_score, 4),
            'is_toxic': overall_toxicity > 0.3  # Lower threshold (30%)
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