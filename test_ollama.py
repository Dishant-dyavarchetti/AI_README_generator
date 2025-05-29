import subprocess
import json
import time
import sys
import os

def check_ollama_service():
    """Check if Ollama service is running."""
    try:
        subprocess.run(
            ["ollama", "list"],
            capture_output=True,
            text=True,
            encoding='utf-8',
            check=True,
            timeout=5
        )
        return True
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return False

def ensure_model_available(model_name="mistral"):
    """Ensure the specified model is available, pull it if needed."""
    # First check if Ollama service is running
    if not check_ollama_service():
        print("Error: Ollama service is not running!")
        print("Please start Ollama by running 'ollama serve' in a separate terminal")
        sys.exit(1)

    print(f"Checking if {model_name} is available...")
    try:
        # Check available models
        check_result = subprocess.run(
            ["ollama", "list"],
            capture_output=True,
            text=True,
            encoding='utf-8',
            check=True
        )
        print("Available models:", check_result.stdout)

        # If model is not available, pull it
        if model_name not in check_result.stdout:
            print(f"\nPulling {model_name} model...")
            try:
                # Try pulling with the official model name
                subprocess.run(
                    ["ollama", "pull", model_name],
                    check=True,
                    capture_output=True,
                    text=True,
                    encoding='utf-8'
                )
                print(f"{model_name} model pulled successfully")
            except subprocess.CalledProcessError as e:
                print(f"Error pulling model: {e}")
                print("Error output:", e.stderr)
                raise
        else:
            print(f"{model_name} model is already available")
    except subprocess.CalledProcessError as e:
        print(f"Error checking/pulling model: {e}")
        raise

def test_ollama_readme():
    # First ensure the model is available
    ensure_model_available()

    # Test data with some optional fields missing
    test_data = {
        "project_name": "Test Project",
        "description": "A test project for README generation",
        "tech_stack": "Python",
        "features": "README generation",
        # Optional fields that might be missing
        "installation": None,  # Not provided
        "usage": None,        # Not provided
        "deployment_link": None,  # Not provided
        "author_name": "Test Author",
        "author_email": None,  # Not provided
        "github_username": None  # Not provided
    }

    # Build a more concise prompt
    prompt = f"""Create a simple README.md for a project with these details:
Project: {test_data['project_name']}
Description: {test_data['description']}
Tech Stack: {test_data['tech_stack']}
Features: {test_data['features']}
Author: {test_data['author_name']}

Instructions:
1. Keep it brief and focused
2. Use markdown formatting
3. Only include sections with provided information"""

    print("\nTesting Ollama README generation...")
    print("\nSending prompt to Ollama...")
    
    try:
        print("\nRunning model with prompt...")
        start_time = time.time()
        
        # Run ollama command with a 3-minute timeout and proper encoding
        result = subprocess.run(
            ["ollama", "run", "mistral", prompt],
            capture_output=True,
            text=True,
            encoding='utf-8',  # Force UTF-8 encoding
            check=True,
            timeout=180  # 3 minutes timeout
        )
        
        end_time = time.time()
        print(f"\nGeneration completed in {end_time - start_time:.2f} seconds")
        
        print("\nGenerated README:")
        print("=" * 80)
        print(result.stdout)
        print("=" * 80)
        
        # Save the generated README to a file
        with open("test_readme.md", "w", encoding="utf-8") as f:
            f.write(result.stdout)
        print("\nREADME saved to test_readme.md")
        
    except subprocess.TimeoutExpired:
        print("Error: Ollama took too long to respond (over 3 minutes)")
        print("Try these solutions:")
        print("1. Make sure Ollama is running (run 'ollama serve' in a separate terminal)")
        print("2. Check your system resources (CPU, memory)")
        print("3. Try running with a smaller model")
    except subprocess.CalledProcessError as e:
        print(f"Error running Ollama: {e}")
        print("Error output:", e.stderr)
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    test_ollama_readme() 