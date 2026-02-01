import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    TWITTER_BEARER_TOKEN = os.getenv('TWITTER_BEARER_TOKEN')
    PERSPECTIVE_API_KEY = os.getenv('PERSPECTIVE_API_KEY')
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/convosense')
    # Mock mode for dev/demo if keys are missing
    MOCK_MODE = os.getenv('MOCK_MODE', 'True').lower() == 'true'
