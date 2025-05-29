from pydantic import BaseModel, Field
from typing import List, Optional

class FunctionDetail(BaseModel):
    name: str
    description: str
    parameters: Optional[List[str]] = []
    return_type: Optional[str] = None

class FileDetail(BaseModel):
    path: str
    type: str  # 'file' or 'directory'
    content: Optional[str] = None
    functions: Optional[List[FunctionDetail]] = []

class ProjectDetails(BaseModel):
    project_name: str
    description: str
    tech_stack: List[str]
    deployment_url: Optional[str] = None
    file_structure: List[FileDetail]
    functions: List[FunctionDetail]
    author_name: Optional[str] = None
    author_email: Optional[str] = None
    github_username: Optional[str] = None

class ReadmeVariant(BaseModel):
    content: str
    style: str

class READMEResponse(BaseModel):
    readme_variants: List[ReadmeVariant]
    metadata: Optional[dict] = Field(default_factory=dict) 