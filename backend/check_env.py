import os
from pathlib import Path
from dotenv import load_dotenv

def check_env_file(path):
    print(f"\nChecking .env file at: {path}")
    if path.exists():
        print(f"File exists: Yes")
        load_dotenv(path)
        api_key = os.getenv("GROQ_API_KEY")
        print(f"GROQ_API_KEY found: {'Yes' if api_key else 'No'}")
        if api_key:
            print(f"API Key length: {len(api_key)}")
            print(f"API Key starts with 'gsk_': {api_key.startswith('gsk_')}")
            print(f"API Key first 10 chars: {api_key[:10]}")
    else:
        print(f"File exists: No")

# Get the root directory
root_dir = Path(__file__).parent.parent
backend_dir = Path(__file__).parent

# Check both .env files
print("Checking environment files...")
check_env_file(root_dir / '.env')  # Root .env
check_env_file(backend_dir / '.env')  # Backend .env

# Print current working directory
print(f"\nCurrent working directory: {os.getcwd()}")

# Print all environment variables (excluding sensitive data)
print("\nAll environment variables:")
for key, value in os.environ.items():
    if 'KEY' not in key.upper():  # Don't print API keys
        print(f"{key}: {value}") 