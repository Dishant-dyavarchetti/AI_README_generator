import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test analyze-project endpoint
def test_analyze_project():
    url = "http://localhost:8000/api/analyze-project"
    # Using query parameter instead of request body
    params = {"project_path": "."}
    response = requests.post(url, params=params)
    print("Analyze Project Response:")
    print(json.dumps(response.json(), indent=2))

# Test generate-readme endpoint
def test_generate_readme():
    url = "http://localhost:8000/api/generate-readme"
    data = {
        "project_name": "Test Project",
        "description": "A test project for README generation",
        "tech_stack": ["Python", "FastAPI"],
        "deployment_url": "http://example.com",
        "file_structure": [
            {
                "path": "main.py",
                "type": "file",
                "functions": [
                    {
                        "name": "main",
                        "description": "Main function"
                    }
                ]
            }
        ],
        "functions": [
            {
                "name": "main",
                "description": "Main function"
            }
        ],
        "author_name": "Test Author",
        "author_email": "test@example.com",
        "github_username": "testuser"
    }
    response = requests.post(url, json=data)
    print("\nGenerate README Response:")
    print(json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    print("Testing API endpoints...")
    test_analyze_project()
    test_generate_readme() 