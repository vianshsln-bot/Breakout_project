"""
elevenlabs_router.py
----------------------
FastAPI router for ElevenLabs API integration using the official ElevenLabs Python SDK.
Provides REST endpoints for Agents, Knowledge Base, Phone Numbers, Workspace, 
Conversations, and Secrets management.

All routes include comprehensive error handling and documentation.
This router is designed to be included in a FastAPI application (no main app here).

Installation:
    pip install fastapi elevenlabs python-dotenv

Usage:
    from fastapi import FastAPI
    from elevenlabs_router import router
    
    app = FastAPI()
    app.include_router(router, prefix="/elevenlabs", tags=["ElevenLabs"])
"""

from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body, UploadFile, File
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional, List
import os

from backend.config.eleven_labs import ElevenLabsClient, ElevenLabsError

# Initialize router

router = APIRouter(prefix="/ElevenLabs", tags=["ElevenLabs"])

# ================== DEPENDENCY ==================

def get_client() -> ElevenLabsClient:
    """
    Dependency to provide ElevenLabsClient instance.
    
    Raises:
        HTTPException: If client initialization fails
    """
    try:
        return ElevenLabsClient()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize ElevenLabs client: {str(e)}"
        )


# ================== PYDANTIC MODELS ==================

class AgentCreateRequest(BaseModel):
    """Request model for creating an agent"""
    name: str = Field(..., description="Agent name")
    conversation_config: Dict[str, Any] = Field(..., description="Agent conversation configuration")
    tags: Optional[List[str]] = Field(None, description="Tags for organization")
    # description: Optional[str] = Field(None, description="Agent description")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Customer Support Bot",
                "conversation_config": {
                    "agent": {
                        "prompt": {
                            "prompt": "You are a helpful customer support agent.",
                            "llm": "gpt-4o",
                            "temperature": 0.7
                        },
                        "first_message": "Hello! How can I help you today?",
                        "language": "en"
                    },
                    "tts": {
                        "model_id": "eleven_turbo_v2_5",
                        "voice_id": "cjVigY5qzO86Huf0OWal"
                    }
                },
                "tags": ["support", "customer-service"]
            }
        }


class AgentUpdateRequest(BaseModel):
    """Request model for updating an agent"""
    name: Optional[str] = Field(None, description="Updated agent name")
    conversation_config: Optional[Dict[str, Any]] = Field(None, description="Updated conversation config")
    tags: Optional[List[str]] = Field(None, description="Updated tags")
    # description: Optional[str] = Field(None, description="Updated description")


class KBFromURLRequest(BaseModel):
    """Request model for creating KB document from URL"""
    url: str = Field(..., description="URL to import")
    name: Optional[str] = Field(None, description="Document name")
    description: Optional[str] = Field(None, description="Document description")


class KBFromTextRequest(BaseModel):
    """Request model for creating KB document from text"""
    text: str = Field(..., description="Text content")
    name: str = Field(..., description="Document name")
    description: Optional[str] = Field(None, description="Document description")


class PhoneNumberUpdateRequest(BaseModel):
    """Request model for updating phone number"""
    label: Optional[str] = Field(None, description="Phone number label")
    agent_id: Optional[str] = Field(None, description="Agent to assign")


class SecretCreateRequest(BaseModel):
    """Request model for creating a secret"""
    name: str = Field(..., description="Secret name")
    value: str = Field(..., description="Secret value")


# ================== AGENTS ENDPOINTS ==================

@router.get(
    "/agents",
    tags=["Agents"],
    summary="List all agents",
    description="Retrieve a paginated list of all agents in the workspace"
)
async def list_agents(
    page_size: Optional[int] = Query(None, description="Number of agents per page"),
    cursor: Optional[str] = Query(None, description="Pagination cursor"),
    client: ElevenLabsClient = Depends(get_client),
):
    """
    List all agents with pagination support.
    
    Args:
        page_size: Number of agents to return per page
        cursor: Pagination cursor from previous response
        
    Returns:
        Dictionary containing agents list and pagination info
    """
    try:
        return client.list_agents(page_size=page_size, cursor=cursor)
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/agents",
    tags=["Agents"],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new agent",
    description="Create a new conversational AI agent with specified configuration"
)
async def create_agent(
    req: AgentCreateRequest,
    client: ElevenLabsClient = Depends(get_client),
):
    """
    Create a new agent with conversation configuration.
    
    Args:
        req: Agent creation request with name, conversation_config, tags, description
        
    Returns:
        Created agent object with agent_id
    """
    try:
        return client.create_agent(
            name=req.name,
            conversation_config=req.conversation_config,
            tags=req.tags
        )
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/agents/{agent_id}",
    tags=["Agents"],
    summary="Get agent details",
    description="Retrieve detailed configuration for a specific agent"
)
async def get_agent(
    agent_id: str,
    client: ElevenLabsClient = Depends(get_client),
):
    """
    Get agent configuration by ID.
    
    Args:
        agent_id: Agent ID
        
    Returns:
        Agent configuration object
    """
    try:
        return client.get_agent(agent_id)
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch(
    "/agents/{agent_id}",
    tags=["Agents"],
    summary="Update agent"
)
async def update_agent(
    agent_id: str,
    req: AgentUpdateRequest,
    client: ElevenLabsClient = Depends(get_client),
):
    """
    Update agent configuration.
    
    Args:
        agent_id: Agent ID
        req: Fields to update
        
    Returns:
        Updated agent object
    """
    try:
        return client.update_agent(
            agent_id=agent_id,
            name=req.name,
            conversation_config=req.conversation_config,
            tags=req.tags
        )
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete(
    "/agents/{agent_id}",
    tags=["Agents"],
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete agent"
)
async def delete_agent(
    agent_id: str,
    client: ElevenLabsClient = Depends(get_client),
):
    """
    Delete an agent by ID.
    
    Args:
        agent_id: Agent ID
    """
    try:
        client.delete_agent(agent_id)
        return {"message": "Agent deleted successfully"}
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ================== KNOWLEDGE BASE ENDPOINTS ==================

@router.get(
    "/knowledge-base",
    tags=["Knowledge Base"],
    summary="List knowledge base documents"
)
async def list_kb_documents(
    page_size: Optional[int] = Query(None, description="Documents per page"),
    cursor: Optional[str] = Query(None, description="Pagination cursor"),
    client: ElevenLabsClient = Depends(get_client),
):
    """
    List all knowledge base documents.
    
    Args:
        page_size: Number of documents per page
        cursor: Pagination cursor
        
    Returns:
        Dictionary with documents list and pagination info
    """
    try:
        return client.list_knowledge_base_documents(page_size=page_size, cursor=cursor)
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/knowledge-base/from-url",
    tags=["Knowledge Base"],
    status_code=status.HTTP_201_CREATED,
    summary="Create document from URL"
)
async def create_kb_document_from_url(
    req: KBFromURLRequest,
    client: ElevenLabsClient = Depends(get_client),
):
    """
    Create knowledge base document from URL.
    
    Args:
        req: Request with URL, name, and description
        
    Returns:
        Created document object
    """
    try:
        return client.create_knowledge_base_document_from_url(
            url=req.url,
            name=req.name
        )
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/knowledge-base/from-text",
    tags=["Knowledge Base"],
    status_code=status.HTTP_201_CREATED,
    summary="Create document from text"
)
async def create_kb_document_from_text(
    req: KBFromTextRequest,
    client: ElevenLabsClient = Depends(get_client),
):
    """
    Create knowledge base document from text.
    
    Args:
        req: Request with text, name
        
    Returns:
        Created document object
    """
    try:
        return client.create_knowledge_base_document_from_text(
            text=req.text,
            name=req.name
        )
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/knowledge-base/from-file",
    tags=["Knowledge Base"],
    status_code=status.HTTP_201_CREATED,
    summary="Create document from file",
    description="Upload a file to create a knowledge base document (PDF, DOCX, TXT, HTML, EPUB)"
)

async def create_kb_document_from_file(
    file: UploadFile = File(..., description="File to upload"),
    name: Optional[str] = Query(None, description="Document name"),
    client: ElevenLabsClient = Depends(get_client),
):
    """
    Create knowledge base document from uploaded file.
    
    Args:
        file: Uploaded file
        name: Document name
        
    Returns:
        Created document object
    """
    content = await file.read()

    # Ensure correct type
    allowed_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/epub+zip",
        "text/plain",
        "text/html"
    ]

    if file.content_type not in allowed_types:
        return {
            "error": f"Unsupported file type: {file.content_type}. "
                     f"Allowed types are {allowed_types}"
        }

    # Wrap file content in BytesIO for ElevenLabs
    buffer = BytesIO(content)
    buffer.name = file.filename  
    response = client.create_knowledge_base_document_from_file(buffer,buffer.name)
    
    return {"message": "Uploaded successfully", "response": response}

@router.get(
    "/knowledge-base/{document_id}",
    tags=["Knowledge Base"],
    summary="Get document details",
    description="Retrieve details for a specific knowledge base document"
)
async def get_kb_document(
    document_id: str,
    client: ElevenLabsClient = Depends(get_client),
):
    """
    Get knowledge base document by ID.
    
    Args:
        document_id: Document ID
        
    Returns:
        Document object
    """
    try:
        return client.get_knowledge_base_document(document_id)
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete(
    "/knowledge-base/{document_id}",
    tags=["Knowledge Base"],
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete document",
    description="Delete a knowledge base document"
)
async def delete_kb_document(
    document_id: str,
    client: ElevenLabsClient = Depends(get_client),
):
    """
    Delete knowledge base document.
    
    Args:
        document_id: Document ID
    """
    try:
        client.delete_knowledge_base_document(document_id)
        return {"message": "Document deleted successfully"}
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ================== PHONE NUMBERS ENDPOINTS ==================

@router.get(
    "/phone-numbers",
    tags=["Phone Numbers"],
    summary="List phone numbers",
    description="Retrieve all imported phone numbers"
)
async def list_phone_numbers(
    page_size: Optional[int] = Query(None, description="Numbers per page"),
    cursor: Optional[str] = Query(None, description="Pagination cursor"),
    client: ElevenLabsClient = Depends(get_client),
):
    """
    List all phone numbers.
    
    Args:
        page_size: Numbers per page
        cursor: Pagination cursor
        
    Returns:
        Dictionary with phone numbers list
    """
    try:
        return client.list_phone_numbers(page_size=page_size, cursor=cursor)
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/phone-numbers/{phone_number_id}",
    tags=["Phone Numbers"],
    summary="Get phone number details",
    description="Retrieve details for a specific phone number"
)
async def get_phone_number(
    phone_number_id: str,
    client: ElevenLabsClient = Depends(get_client),
):
    """
    Get phone number by ID.
    
    Args:
        phone_number_id: Phone number ID
        
    Returns:
        Phone number object
    """
    try:
        return client.get_phone_number(phone_number_id)
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch(
    "/phone-numbers/{phone_number_id}",
    tags=["Phone Numbers"],
    summary="Update phone number",
    description="Update phone number configuration"
)
async def update_phone_number(
    phone_number_id: str,
    req: PhoneNumberUpdateRequest,
    client: ElevenLabsClient = Depends(get_client),
):
    """
    Update phone number configuration.
    
    Args:
        phone_number_id: Phone number ID
        req: Fields to update
        
    Returns:
        Updated phone number object
    """
    try:
        update_data = req.dict(exclude_none=True)
        return client.update_phone_number(phone_number_id, **update_data)
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete(
    "/phone-numbers/{phone_number_id}",
    tags=["Phone Numbers"],
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete phone number",
    description="Delete a phone number"
)
async def delete_phone_number(
    phone_number_id: str,
    client: ElevenLabsClient = Depends(get_client),
):
    """
    Delete phone number.
    
    Args:
        phone_number_id: Phone number ID
    """
    try:
        client.delete_phone_number(phone_number_id)
        return {"message": "Phone number deleted successfully"}
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ================== WORKSPACE ENDPOINTS ==================

@router.get(
    "/workspace/settings",
    tags=["Workspace"],
    summary="Get workspace settings",
    description="Retrieve workspace configuration"
)
async def get_workspace_settings(
    client: ElevenLabsClient = Depends(get_client)
):
    """
    Get workspace settings.
    
    Returns:
        Workspace settings object
    """
    try:
        return client.get_workspace_settings()
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch(
    "/workspace/settings",
    tags=["Workspace"],
    summary="Update workspace settings",
    description="Update workspace configuration"
)
async def update_workspace_settings(
    payload: Dict[str, Any] = Body(...),
    client: ElevenLabsClient = Depends(get_client),
):
    """
    Update workspace settings.
    
    Args:
        payload: Settings to update
        
    Returns:
        Updated workspace settings
    """
    try:
        return client.update_workspace_settings(**payload)
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/workspace/dashboard/settings",
    tags=["Workspace"],
    summary="Get dashboard settings",
    description="Retrieve workspace dashboard configuration"
)
async def get_dashboard_settings(
    client: ElevenLabsClient = Depends(get_client)
):
    """
    Get dashboard settings.
    
    Returns:
        Dashboard settings object
    """
    try:
        return client.get_dashboard_settings()
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ================== CONVERSATIONS ENDPOINTS ==================

@router.get(
    "/conversations",
    tags=["Conversations"],
    summary="List conversations",
    description="Retrieve all conversations with optional filtering by agent"
)
async def list_conversations(
    page_size: Optional[int] = Query(None, description="Conversations per page"),
    cursor: Optional[str] = Query(None, description="Pagination cursor"),
    agent_id: Optional[str] = Query(None, description="Filter by agent ID"),
    client: ElevenLabsClient = Depends(get_client),
):
    """
    List all conversations.
    
    Args:
        page_size: Conversations per page
        cursor: Pagination cursor
        agent_id: Filter by agent ID
        
    Returns:
        Dictionary with conversations list
    """
    try:
        return client.list_conversations(
            agent_id=agent_id,
            page_size=page_size,
            cursor=cursor
        )
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/conversations/{conversation_id}",
    tags=["Conversations"],
    summary="Get conversation details",
    description="Retrieve detailed conversation with transcript"
)
async def get_conversation(
    conversation_id: str,
    client: ElevenLabsClient = Depends(get_client),
):
    """
    Get conversation by ID.
    
    Args:
        conversation_id: Conversation ID
        
    Returns:
        Conversation object with transcript
    """
    try:
        return client.get_conversation(conversation_id)
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete(
    "/conversations/{conversation_id}",
    tags=["Conversations"],
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete conversation",
    description="Delete a conversation"
)
async def delete_conversation(
    conversation_id: str,
    client: ElevenLabsClient = Depends(get_client),
):
    """
    Delete conversation.
    
    Args:
        conversation_id: Conversation ID
    """
    try:
        client.delete_conversation(conversation_id)
        return {"message": "Conversation deleted successfully"}
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/conversations/{conversation_id}/signed-url",
    tags=["Conversations"],
    summary="Get conversation signed URL",
    description="Get a signed URL for conversation access"
)
async def get_conversation_signed_url(
    conversation_id: str,
    client: ElevenLabsClient = Depends(get_client),
):
    """
    Get signed URL for conversation.
    
    Args:
        conversation_id: Conversation ID
        
    Returns:
        Signed URL string
    """
    try:
        url = client.get_conversation_signed_url(conversation_id)
        return {"signed_url": url}
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ================== SECRETS ENDPOINTS ==================

@router.get(
    "/secrets",
    tags=["Secrets"],
    summary="List secrets",
    description="Retrieve all workspace secrets (values not included)"
)
async def list_secrets(
    client: ElevenLabsClient = Depends(get_client)
):
    """
    List all workspace secrets.
    
    Returns:
        List of secret objects (without values)
    """
    try:
        return {"secrets": client.list_secrets()}
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/secrets",
    tags=["Secrets"],
    status_code=status.HTTP_201_CREATED,
    summary="Create secret",
    description="Create a new workspace secret for tools"
)
async def create_secret(
    req: SecretCreateRequest,
    client: ElevenLabsClient = Depends(get_client),
):
    """
    Create a workspace secret.
    
    Args:
        req: Secret name and value
        
    Returns:
        Created secret object
    """
    try:
        return client.create_secret(name=req.name, value=req.value)
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete(
    "/secrets/{secret_id}",
    tags=["Secrets"],
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete secret",
    description="Delete a workspace secret"
)
async def delete_secret(
    secret_id: str,
    client: ElevenLabsClient = Depends(get_client),
):
    """
    Delete a secret.
    
    Args:
        secret_id: Secret ID
    """
    try:
        client.delete_secret(secret_id)
        return {"message": "Secret deleted successfully"}
    except ElevenLabsError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ================== HEALTH CHECK ==================

@router.get(
    "/health",
    tags=["Health"],
    summary="Health check",
    description="Check if the ElevenLabs service is accessible"
)
async def health_check(client: ElevenLabsClient = Depends(get_client)):
    """
    Health check endpoint to verify ElevenLabs connectivity.
    
    Returns:
        Health status and agent count
    """
    try:
        count = client.count_agents()
        return {
            "status": "healthy",
            "service": "ElevenLabs API",
            "agent_count": count
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ElevenLabs service unavailable: {str(e)}"
        )