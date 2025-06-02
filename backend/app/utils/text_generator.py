import os
import logging
import requests
from typing import Dict, Any
from dotenv import load_dotenv
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TextGenerator:
    def __init__(self):
        # Load environment variables from the root directory
        root_dir = Path(__file__).parent.parent.parent.parent
        env_path = root_dir / '.env'
        logger.info(f"Loading .env from: {env_path}")
        
        if not env_path.exists():
            raise ValueError(f".env file not found at {env_path}")
            
        load_dotenv(env_path, override=True)  # Use override=True to ensure we use this .env file
        self.api_key = os.getenv("GROQ_API_KEY")
        
        if not self.api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set")
            
        logger.info(f"GROQ_API_KEY loaded: {'Yes' if self.api_key else 'No'}")
        logger.info(f"GROQ_API_KEY length: {len(self.api_key) if self.api_key else 0}")
        logger.info(f"GROQ_API_KEY starts with 'gsk_': {self.api_key.startswith('gsk_') if self.api_key else False}")
        
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "llama-3.3-70b-versatile"

    def generate_readme(self, prompt: str) -> str:
        """Generate README content using Groq API."""
        try:
            # Format the messages for the chat completion
            messages = [
                {
                    "role": "system",
                    "content": """You are a professional README generator. Create comprehensive, well-structured README files in markdown format. Follow these guidelines:
1. Use emojis for section headers
2. Include badges for technologies, version, and status
3. Write clear, concise descriptions
4. Structure content with proper markdown formatting
5. Include detailed setup instructions
6. Add visual elements like screenshots or diagrams when mentioned
7. Use code blocks for commands and configuration
8. Include contact information and social links
9. Add a license section
10. Make it visually appealing with proper spacing and organization"""
                },
                {
                    "role": "user",
                    "content": f"""Write a professional README.md file for the following project:

{prompt}

Write three versions:
1. Professional (formal, detailed with badges, emojis, and comprehensive sections)
2. Modern (developer-friendly with a focus on quick setup and usage)
3. Minimal (concise but complete with essential information)

Each version should include:
- Title with badges (build status, version, etc.)
- Description with emojis
- Features list
- Tech stack with badges
- Installation and setup instructions
- Usage guide
- Screenshots/demo section
- Contributing guidelines
- License information
- Contact details

Use proper markdown formatting:
- # for main headers
- ## for subheaders
- ``` for code blocks
- - for lists
- ** for bold text
- _ for italics
- [text](url) for links

Format as:
Option 1: [Professional]
[content]

Option 2: [Modern]
[content]

Option 3: [Minimal]
[content]"""
                }
            ]

            # Make the API request
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 8192,  # Increased for longer responses
                "top_p": 0.95,
                "stream": False
            }

            logger.info(f"Sending request to Groq API with model: {self.model}")
            logger.info(f"Request URL: {self.api_url}")
            logger.info(f"Request headers: {headers}")
            
            response = requests.post(self.api_url, headers=headers, json=data, verify=False)
            
            if response.status_code != 200:
                logger.error(f"Groq API error: {response.status_code} - {response.text}")
                raise Exception(f"Groq API error: {response.status_code} - {response.text}")
            
            # Extract the generated text from the response
            response_data = response.json()
            if "choices" not in response_data or not response_data["choices"]:
                raise Exception("Invalid response format from Groq API")
                
            generated_text = response_data["choices"][0]["message"]["content"]
            logger.info("Successfully generated README using Groq API")
            
            return generated_text

        except Exception as e:
            logger.error(f"Error generating README: {str(e)}")
            raise Exception(f"Failed to generate README: {str(e)}")

# Create a singleton instance
text_generator = TextGenerator() 