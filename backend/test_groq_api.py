import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key
api_key = os.getenv("GROQ_API_KEY")
print(f"API Key loaded: {'Yes' if api_key else 'No'}")
print(f"API Key length: {len(api_key) if api_key else 0}")
print(f"API Key starts with 'gsk_': {api_key.startswith('gsk_') if api_key else False}")

# Make a test request
url = "https://api.groq.com/openai/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}
data = {
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 10
}

print("\nMaking test request to Groq API...")
print(f"URL: {url}")
print(f"Headers: {headers}")
print(f"Data: {data}")

response = requests.post(url, headers=headers, json=data, verify=False)
print(f"\nResponse Status Code: {response.status_code}")
print(f"Response Text: {response.text}") 