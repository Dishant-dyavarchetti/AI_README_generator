import os
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

# Get API key
api_key = os.getenv("GROQ_API_KEY")
print(f"API Key loaded: {'Yes' if api_key else 'No'}")
print(f"API Key length: {len(api_key) if api_key else 0}")
print(f"API Key starts with 'gsk_': {api_key.startswith('gsk_') if api_key else False}")

# Test request
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
response = requests.post(
    "https://api.groq.com/openai/v1/chat/completions",
    headers=headers,
    json=data,
    verify=False
)

print(f"\nResponse Status Code: {response.status_code}")
print(f"Response Text: {response.text}") 