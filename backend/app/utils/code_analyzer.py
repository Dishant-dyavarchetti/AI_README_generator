import ast
import os
import asyncio
from typing import List, Dict, Any
from app.core.models import FunctionDetail, FileDetail
from concurrent.futures import ThreadPoolExecutor, TimeoutError

# Create a thread pool for CPU-bound operations
executor = ThreadPoolExecutor(max_workers=2)  # Reduced workers

def analyze_python_file(file_path: str) -> List[FunctionDetail]:
    """Analyze a Python file and extract function information."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        tree = ast.parse(content)
        functions = []
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                # Get function docstring
                docstring = ast.get_docstring(node) or ""
                
                # Get parameters
                params = [arg.arg for arg in node.args.args]
                
                # Get return type annotation if available
                return_type = None
                if node.returns:
                    return_type = ast.unparse(node.returns)
                
                functions.append(FunctionDetail(
                    name=node.name,
                    description=docstring,
                    parameters=params,
                    return_type=return_type
                ))
        
        return functions
    except Exception as e:
        print(f"Error analyzing file {file_path}: {str(e)}")
        return []

async def get_file_structure(root_path: str, max_depth: int = 2) -> List[FileDetail]:  # Reduced max_depth
    """Get the structure of the project directory with a maximum depth."""
    file_structure = []
    
    async def process_directory(current_path: str, current_depth: int):
        if current_depth > max_depth:
            return
            
        try:
            entries = os.listdir(current_path)
            for entry in entries:
                if entry.startswith('.') or entry in ['venv', 'env', '__pycache__', 'node_modules']:  # Skip more directories
                    continue
                    
                full_path = os.path.join(current_path, entry)
                rel_path = os.path.relpath(full_path, root_path)
                
                if os.path.isdir(full_path):
                    file_structure.append(FileDetail(
                        path=rel_path,
                        type='directory'
                    ))
                    await process_directory(full_path, current_depth + 1)
                else:
                    functions = []
                    if entry.endswith('.py'):
                        # Run Python file analysis in thread pool
                        loop = asyncio.get_event_loop()
                        functions = await loop.run_in_executor(
                            executor,
                            analyze_python_file,
                            full_path
                        )
                    
                    file_structure.append(FileDetail(
                        path=rel_path,
                        type='file',
                        functions=functions
                    ))
        except Exception as e:
            print(f"Error processing directory {current_path}: {str(e)}")
    
    try:
        await asyncio.wait_for(process_directory(root_path, 0), timeout=15.0)  # Reduced timeout
    except asyncio.TimeoutError:
        print(f"Directory analysis timed out for {root_path}")
    except Exception as e:
        print(f"Error in get_file_structure: {str(e)}")
    
    return file_structure

async def detect_tech_stack(root_path: str) -> List[str]:
    """Detect the technology stack used in the project."""
    tech_stack = set()
    
    # Check for common configuration files
    config_files = {
        'requirements.txt': 'Python',
        'package.json': 'Node.js',
        'pom.xml': 'Java',
        'build.gradle': 'Java',
        'Cargo.toml': 'Rust',
        'go.mod': 'Go',
        'Gemfile': 'Ruby',
        'composer.json': 'PHP',
        'Dockerfile': 'Docker',
        'docker-compose.yml': 'Docker',
        '.env': 'Environment Variables'
    }
    
    try:
        # Check root directory for config files
        for file_name, tech in config_files.items():
            if os.path.exists(os.path.join(root_path, file_name)):
                tech_stack.add(tech)
        
        # Check file extensions in first level only
        for entry in os.listdir(root_path):
            if entry.startswith('.'):
                continue
                
            full_path = os.path.join(root_path, entry)
            if os.path.isfile(full_path):
                ext = os.path.splitext(entry)[1].lower()
                if ext in ['.py']:
                    tech_stack.add('Python')
                elif ext in ['.js', '.jsx', '.ts', '.tsx']:
                    tech_stack.add('JavaScript/TypeScript')
                elif ext in ['.java']:
                    tech_stack.add('Java')
                elif ext in ['.go']:
                    tech_stack.add('Go')
                elif ext in ['.rs']:
                    tech_stack.add('Rust')
                elif ext in ['.rb']:
                    tech_stack.add('Ruby')
                elif ext in ['.php']:
                    tech_stack.add('PHP')
    except Exception as e:
        print(f"Error in detect_tech_stack: {str(e)}")
    
    return list(tech_stack) 