from pymongo import MongoClient
import os
import firebase_admin
from firebase_admin import credentials, auth
from datetime import datetime

class PersistenceManager:
    def __init__(self):
        # Setup MongoDB
        mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/convosense')
        try:
            self.client = MongoClient(mongo_uri)
            self.db = self.client.get_database()
            self.reports = self.db.reports
            self.users = self.db.users
            print("Connected to MongoDB")
        except Exception as e:
            print(f"MongoDB Connection Error: {e}")
            self.db = None

        # Setup Firebase Admin
        try:
            cred = credentials.Certificate("serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
            print("Firebase Admin Initialized")
        except Exception as e:
            print(f"Firebase Admin Error (or already initialized): {e}")

    def verify_token(self, id_token):
        try:
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except Exception as e:
            print(f"Token Verification Failed: {e}")
            return None

    def save_user(self, user_data):
        if not self.db: return
        try:
            # Upsert user based on uid
            self.users.update_one(
                {"uid": user_data['uid']},
                {"$set": user_data},
                upsert=True
            )
        except Exception as e:
            print(f"Error saving user: {e}")

    def save_analysis(self, query, data, uid=None):
        if not self.db: return None
        
        record = {
            "query": query,
            "timestamp": datetime.utcnow(),
            "uid": uid,  # Link to user if logged in
            "stats": data.get('stats'),
            "topics": data.get('topics'),
            "toxicity_summary": [
                {"text": t['text'], "score": t['toxicity']} 
                for t in data.get('tweets', [])[:5] # Store top 5 toxic for summary
            ]
        }
        
        try:
            result = self.reports.insert_one(record)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error saving analysis to Mongo: {e}")
            return None
