from transformers import pipeline
import torch

class SentimentAnalyzer:
    def __init__(self):
        print("🧠 Loading sentiment analysis model...")
        
        try:
            # Use distilbert for faster inference
            self.analyzer = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device=0 if torch.cuda.is_available() else -1
            )
            print("✅ Sentiment analyzer ready")
        except Exception as e:
            print(f"❌ Failed to load sentiment model: {e}")
            self.analyzer = None
    
    def analyze(self, text):
        """
        Analyze sentiment of a single text
        """
        if not self.analyzer:
            return {'sentiment': 'NEUTRAL', 'confidence': 0.0}
        
        try:
            # Truncate text to 512 tokens (BERT limit)
            result = self.analyzer(text[:512])[0]
            
            return {
                'sentiment': result['label'],
                'confidence': round(result['score'], 4)
            }
        except Exception as e:
            print(f"❌ Sentiment analysis error: {e}")
            return {'sentiment': 'NEUTRAL', 'confidence': 0.0}
    
    def analyze_batch(self, texts):
        """
        Analyze sentiment for multiple texts at once
        """
        if not self.analyzer:
            return [{'sentiment': 'NEUTRAL', 'confidence': 0.0}] * len(texts)
        
        try:
            # Truncate all texts
            truncated_texts = [text[:512] for text in texts]
            results = self.analyzer(truncated_texts)
            
            formatted_results = []
            for result in results:
                formatted_results.append({
                    'sentiment': result['label'],
                    'confidence': round(result['score'], 4)
                })
            
            return formatted_results
            
        except Exception as e:
            print(f"❌ Batch sentiment analysis error: {e}")
            return [{'sentiment': 'NEUTRAL', 'confidence': 0.0}] * len(texts)
    
    def get_overall_sentiment(self, sentiments):
        """
        Calculate overall sentiment statistics
        """
        positive = sum(1 for s in sentiments if s['sentiment'] == 'POSITIVE')
        negative = sum(1 for s in sentiments if s['sentiment'] == 'NEGATIVE')
        neutral = len(sentiments) - positive - negative
        
        total = len(sentiments) if len(sentiments) > 0 else 1
        
        return {
            'positive': positive,
            'negative': negative,
            'neutral': neutral,
            'positive_percentage': round((positive / total) * 100, 2),
            'negative_percentage': round((negative / total) * 100, 2),
            'neutral_percentage': round((neutral / total) * 100, 2),
            'total': total
        }