from fastapi import APIRouter, HTTPException
from app.core.models import ProjectDetails, READMEResponse, ReadmeVariant
from app.utils.code_analyzer import get_file_structure, detect_tech_stack
from app.utils.text_generator import text_generator
from pydantic import BaseModel
import os
import asyncio

router = APIRouter()

class ProjectPath(BaseModel):
    project_path: str

@router.post("/generate-readme", response_model=READMEResponse)
async def generate_readme_endpoint(project: ProjectDetails):
    """
    Generate README files based on project details.
    """
    try:
        # Build the prompt
        prompt = f"""Generate 3 different README.md files for a project with the following details:

Project Name: {project.project_name}
Description: {project.description}
Tech Stack: {', '.join(project.tech_stack)}
Deployment URL: {project.deployment_url if project.deployment_url else 'Not provided'}
File Structure:
{chr(10).join(['- ' + file.path for file in project.file_structure])}
Author: {project.author_name if project.author_name else 'Not provided'}

Contact details: Include the author email ({project.author_email if project.author_email else 'Not provided'}) and GitHub username ({project.github_username if project.github_username else 'Not provided'}) if provided in a 'Contact' or 'Author' section.

Generate 3 different versions:
1. Professional and formal
2. Modern and developer-friendly
3. Minimal and clean

Each version should be complete and use proper markdown formatting. Return them clearly separated as 'Option 1:', 'Option 2:', and 'Option 3:'.
"""

        # Generate README using local model
        try:
            readme_text = text_generator.generate_readme(prompt)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Text generation error: {str(e)}")

        # Split the response into different options
        options = readme_text.split("Option ")
        readme_variants = []
        styles = ["Professional", "Modern", "Minimal"]
        for i, option in enumerate(options[1:]):  # Skip the first empty split
            clean_option = option[2:].strip() if len(option) > 2 else option.strip()
            style = styles[i] if i < len(styles) else f"Style {i+1}"
            readme_variants.append(ReadmeVariant(content=clean_option, style=style))
        # Ensure we always return 3 variants
        while len(readme_variants) < 3:
            readme_variants.append(ReadmeVariant(content="", style=styles[len(readme_variants)] if len(readme_variants) < len(styles) else f"Style {len(readme_variants)+1}"))
        return READMEResponse(
            readme_variants=readme_variants,
            metadata={
                "project_name": project.project_name,
                "tech_stack": project.tech_stack,
                "num_functions": len(project.functions),
                "num_files": len(project.file_structure)
            }
        )
    except Exception as e:
        print(f"Error in generate_readme_endpoint: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-project")
async def analyze_project(project: ProjectPath):
    """
    Analyze a project directory and return its structure and details.
    """
    try:
        if not os.path.exists(project.project_path):
            raise HTTPException(status_code=404, detail="Project path not found")
        
        # Get file structure and tech stack concurrently
        file_structure, tech_stack = await asyncio.gather(
            get_file_structure(project.project_path),
            detect_tech_stack(project.project_path)
        )
        
        return {
            "file_structure": file_structure,
            "tech_stack": tech_stack
        }
    except Exception as e:
        print(f"Error in analyze_project endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 