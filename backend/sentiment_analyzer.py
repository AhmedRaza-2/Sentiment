from transformers import pipeline
import torch

class SentimentAnalyzer:
    def __init__(self):
        print("🧠 Loading sentiment analysis model (this takes 30-60 seconds first time)...")
        
        try:
            # Use smaller, faster model
            self.analyzer = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device=0 if torch.cuda.is_available() else -1,
                truncation=True,
                max_length=512
            )
            print("✅ Sentiment analyzer ready (model cached for future use)")
        except Exception as e:
            print(f"❌ Failed to load sentiment model: {e}")
            self.analyzer = None
    
    def analyze(self, text):
        """Analyze sentiment of a single text"""
        if not self.analyzer:
            return {'sentiment': 'NEUTRAL', 'confidence': 0.0}
        
        try:
            result = self.analyzer(text[:512])[0]
            sentiment = result['label']
            confidence = round(result['score'], 4)
            
            # If confidence is low (< 0.65), classify as NEUTRAL
            if confidence < 0.65:
                sentiment = 'NEUTRAL'
            
            return {
                'sentiment': sentiment,
                'confidence': confidence
            }
        except Exception as e:
            print(f"❌ Sentiment analysis error: {e}")
            return {'sentiment': 'NEUTRAL', 'confidence': 0.0}
    
    def analyze_batch(self, texts):
        """Analyze sentiment for multiple texts - OPTIMIZED"""
        if not self.analyzer:
            return [{'sentiment': 'NEUTRAL', 'confidence': 0.0}] * len(texts)
        
        try:
            # Truncate all texts
            truncated_texts = [text[:512] for text in texts]
            
            # Batch process for speed (process 8 at a time)
            batch_size = 8
            results = []
            
            for i in range(0, len(truncated_texts), batch_size):
                batch = truncated_texts[i:i + batch_size]
                batch_results = self.analyzer(batch)
                results.extend(batch_results)
            
            formatted_results = []
            for result in results:
                sentiment = result['label']
                confidence = round(result['score'], 4)
                
                # Apply neutral detection (same as analyze method)
                if confidence < 0.65:
                    sentiment = 'NEUTRAL'
                
                formatted_results.append({
                    'sentiment': sentiment,
                    'confidence': confidence
                })
            
            return formatted_results
            
        except Exception as e:
            print(f"❌ Batch sentiment analysis error: {e}")
            return [{'sentiment': 'NEUTRAL', 'confidence': 0.0}] * len(texts)
    
    def get_overall_sentiment(self, sentiments):
        """Calculate overall sentiment statistics"""
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