from transformers import pipeline
import time

print("Attempting to load sentiment model...")
start = time.time()
try:
    analyzer = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
    print(f"Model loaded in {time.time() - start:.2f} seconds.")
    result = analyzer("This is a great test!")
    print(f"Result: {result}")
except Exception as e:
    print(f"Error: {e}")
