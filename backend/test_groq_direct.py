import requests
import json

# The API key that worked in the previous test
API_KEY = "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"

# API endpoint
url = "https://api.groq.com/openai/v1/chat/completions"

# Headers
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Test data
data = {
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 10
}

print("Making test request to Groq API...")
print(f"URL: {url}")
print(f"Headers: {json.dumps(headers, indent=2)}")
print(f"Data: {json.dumps(data, indent=2)}")

# Make the request
response = requests.post(url, headers=headers, json=data, verify=False)

print(f"\nResponse Status Code: {response.status_code}")
print(f"Response Text: {response.text}")

# If successful, try a more complex request
if response.status_code == 200:
    print("\nTrying a more complex request...")
    complex_data = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant."
            },
            {
                "role": "user",
                "content": "Write a short poem about programming."
            }
        ],
        "max_tokens": 100
    }
    
    complex_response = requests.post(url, headers=headers, json=complex_data, verify=False)
    print(f"\nComplex Response Status Code: {complex_response.status_code}")
    print(f"Complex Response Text: {complex_response.text}") 