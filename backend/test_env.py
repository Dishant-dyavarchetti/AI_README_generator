import os
from dotenv import load_dotenv
import sys

# Print current working directory
print(f"Current working directory: {os.getcwd()}")

# Try to load .env from different locations
env_paths = [
    '.env',  # Current directory
    '../.env',  # Parent directory
    os.path.join(os.path.dirname(__file__), '.env'),  # Script directory
    os.path.join(os.path.dirname(__file__), '..', '.env')  # Parent of script directory
]

for path in env_paths:
    print(f"\nTrying to load .env from: {path}")
    if os.path.exists(path):
        print(f"File exists at {path}")
        load_dotenv(path)
        api_key = os.getenv("GROQ_API_KEY")
        print(f"GROQ_API_KEY loaded: {'Yes' if api_key else 'No'}")
        print(f"GROQ_API_KEY length: {len(api_key) if api_key else 0}")
        print(f"GROQ_API_KEY starts with 'gsk_': {api_key.startswith('gsk_') if api_key else False}")
        print(f"GROQ_API_KEY first 10 chars: {api_key[:10] if api_key else 'None'}")
    else:
        print(f"File does not exist at {path}")

# Print all environment variables (excluding sensitive data)
print("\nAll environment variables:")
for key, value in os.environ.items():
    if 'KEY' not in key.upper():  # Don't print API keys
        print(f"{key}: {value}") 