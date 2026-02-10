import os
import tweepy
import requests
from dotenv import load_dotenv

load_dotenv()

def diagnose_twitter_api():
    """Complete Twitter API Diagnostics"""
    
    bearer_token = os.getenv('TWITTER_BEARER_TOKEN')
    api_key = os.getenv('TWITTER_API_KEY')
    api_secret = os.getenv('TWITTER_API_SECRET')
    
    print("=" * 60)
    print("🔍 TWITTER API COMPLETE DIAGNOSTICS")
    print("=" * 60)
    
    # Step 1: Check if credentials exist
    print("\n📋 Step 1: Checking Credentials...")
    print(f"Bearer Token: {'✅ Present' if bearer_token else '❌ Missing'}")
    print(f"API Key: {'✅ Present' if api_key else '❌ Missing'}")
    print(f"API Secret: {'✅ Present' if api_secret else '❌ Missing'}")
    
    if not bearer_token:
        print("\n❌ FATAL: Bearer Token missing!")
        return
    
    # Step 2: Test Bearer Token Format
    print("\n📋 Step 2: Validating Bearer Token Format...")
    if bearer_token.startswith('AAAA'):
        print("✅ Token format looks valid (starts with AAAA)")
    else:
        print("⚠️  Token format unusual (doesn't start with AAAA)")
    
    print(f"Token Length: {len(bearer_token)} chars")
    print(f"Token Preview: {bearer_token[:15]}...{bearer_token[-10:]}")
    
    # Step 3: Direct API Call (No Tweepy)
    print("\n📋 Step 3: Testing Direct API Call (Bypass Tweepy)...")
    headers = {
        'Authorization': f'Bearer {bearer_token}',
        'User-Agent': 'v2RecentSearchPython'
    }
    
    # Test 1: Search endpoint with minimal params
    url = 'https://api.twitter.com/2/tweets/search/recent'
    params = {
        'query': 'python',
        'max_results': 10
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ SUCCESS! Found {len(data.get('data', []))} tweets")
            print(f"Sample tweet: {data['data'][0]['text'][:100] if data.get('data') else 'N/A'}")
        elif response.status_code == 401:
            print("❌ 401 Unauthorized")
            print(f"Error: {response.json()}")
            print("\n🔍 DIAGNOSIS: Bearer Token is INVALID or EXPIRED!")
            print("   → Solution: Regenerate Bearer Token in Twitter Developer Portal")
        elif response.status_code == 403:
            print("❌ 403 Forbidden")
            print(f"Error: {response.json()}")
            print("\n🔍 DIAGNOSIS: Your Twitter Plan doesn't allow Search!")
            print("   → Current Plan: FREE TIER")
            print("   → Required Plan: BASIC ($100/month)")
        elif response.status_code == 429:
            print("❌ 429 Rate Limited")
            print("\n🔍 DIAGNOSIS: Too many requests!")
        else:
            print(f"❌ Unexpected Status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request Failed: {e}")
    
    # Step 4: Test with Tweepy Client
    print("\n📋 Step 4: Testing with Tweepy Client...")
    try:
        client = tweepy.Client(bearer_token=bearer_token, wait_on_rate_limit=True)
        print("✅ Tweepy Client initialized")
        
        # Try to get user info (requires User Context, not Bearer)
        try:
            me = client.get_me()
            print(f"✅ User Info: @{me.data.username}")
        except Exception as e:
            print(f"⚠️  get_me() failed (expected with Bearer Token only): {e}")
        
        # Try search
        try:
            tweets = client.search_recent_tweets(query="python", max_results=10)
            if tweets.data:
                print(f"✅ Search Success: {len(tweets.data)} tweets")
            else:
                print("⚠️  Search returned 0 results")
        except tweepy.Forbidden as e:
            print(f"❌ Tweepy Forbidden: {e}")
        except tweepy.Unauthorized as e:
            print(f"❌ Tweepy Unauthorized: {e}")
        except Exception as e:
            print(f"❌ Tweepy Error: {e}")
            
    except Exception as e:
        print(f"❌ Tweepy Client Failed: {e}")
    
    # Step 5: Check API Plan
    print("\n📋 Step 5: Detecting API Plan...")
    plan_url = "https://api.twitter.com/2/tweets/search/recent"
    
    response = requests.get(
        plan_url,
        headers={'Authorization': f'Bearer {bearer_token}'},
        params={'query': 'test', 'max_results': 10}
    )
    
    if response.status_code == 403:
        error_data = response.json()
        if 'Free' in str(error_data) or 'upgrade' in str(error_data).lower():
            print("🔍 CONFIRMED: FREE TIER (Cannot Search Tweets)")
        else:
            print(f"⚠️  Forbidden but not Free tier: {error_data}")
    elif response.status_code == 401:
        print("🔍 CONFIRMED: Token is INVALID/EXPIRED")
    elif response.status_code == 200:
        print("✅ CONFIRMED: You have BASIC or PRO tier!")
    
    # Final Diagnosis
    print("\n" + "=" * 60)
    print("📊 FINAL DIAGNOSIS")
    print("=" * 60)
    
    if response.status_code == 401:
        print("❌ PROBLEM: Bearer Token is INVALID or EXPIRED")
        print("\n🔧 SOLUTION:")
        print("1. Go to https://developer.twitter.com/en/portal/dashboard")
        print("2. Select your app")
        print("3. Go to 'Keys and tokens'")
        print("4. Click 'Regenerate' on Bearer Token")
        print("5. Copy NEW token to .env file")
        print("6. Restart backend")
    
    elif response.status_code == 403:
        print("❌ PROBLEM: FREE TIER - Cannot Search Tweets")
        print("\n🔧 SOLUTIONS:")
        print("Option 1: Upgrade to BASIC tier ($100/month)")
        print("Option 2: Use MOCK_MODE=True (FREE, perfect for development)")
        print("Option 3: Apply for Academic Research access (may take weeks)")
        print("\n💡 RECOMMENDED: Set MOCK_MODE=True in .env")
    
    elif response.status_code == 200:
        print("✅ SUCCESS: Your API is working!")
        print("You can use MOCK_MODE=False")
    
    else:
        print(f"⚠️  UNKNOWN STATUS: {response.status_code}")
        print("Try regenerating your Bearer Token")
    
    print("=" * 60)

if __name__ == "__main__":
    diagnose_twitter_api()