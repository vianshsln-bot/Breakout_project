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

from datetime import UTC, datetime
from enum import Enum
from io import BytesIO
import json
from fastapi import APIRouter, Depends, HTTPException, Request, status, Query, Body, UploadFile, File
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional, List
import os

import hmac
from hashlib import sha256

import requests
from backend.config.eleven_labs import ElevenLabsClient, ElevenLabsError
from backend.config.supabase_client import supabase
# Initialize router

router = APIRouter(prefix="/ElevenLabs")

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


class ModelName(str, Enum):
    e5_mistral_7b_instruct = "e5_mistral_7b_instruct"
    multilingual_e5_large_instruct = "multilingual_e5_large_instruct"

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

@router.post("/Knowledge-base/",
             tags=["Knowledge Base"],
             summary="Compute Rag Index",
             description="Computing Rag Index for given knowledge base document")
async def compute_rag_index(
    document_id : str,
    model : ModelName,
    client: ElevenLabsClient = Depends(get_client),
):
    try:
        print("hiello")
        return client.compute_rag_index(document_id,model)
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

# @router.get(
#     "/conversations",
#     tags=["Conversations"],
#     summary="List conversations",
#     description="Retrieve all conversations with optional filtering by agent"
# )
# async def list_conversations(
#     page_size: Optional[int] = Query(None, description="Conversations per page"),
#     cursor: Optional[str] = Query(None, description="Pagination cursor"),
#     agent_id: Optional[str] = Query(None, description="Filter by agent ID"),
#     client: ElevenLabsClient = Depends(get_client),
# ):
#     """
#     List all conversations.
    
#     Args:
#         page_size: Conversations per page
#         cursor: Pagination cursor
#         agent_id: Filter by agent ID
        
#     Returns:
#         Dictionary with conversations list
#     """
#     try:
#         return client.list_conversations(
#             agent_id=agent_id,
#             page_size=page_size,
#             cursor=cursor
#         )
#     except ElevenLabsError as e:
#         raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
#     except Exception as e:
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# @router.get(
#     "/conversations/{conversation_id}",
#     tags=["Conversations"],
#     summary="Get conversation details",
#     description="Retrieve detailed conversation with transcript"
# )
# async def get_conversation(
#     conversation_id: str,
#     client: ElevenLabsClient = Depends(get_client),
# ):
#     """
#     Get conversation by ID.
    
#     Args:
#         conversation_id: Conversation ID
        
#     Returns:
#         Conversation object with transcript
#     """
#     try:
#         return client.get_conversation(conversation_id)
#     except ElevenLabsError as e:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
#     except Exception as e:
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# @router.delete(
#     "/conversations/{conversation_id}",
#     tags=["Conversations"],
#     status_code=status.HTTP_204_NO_CONTENT,
#     summary="Delete conversation",
#     description="Delete a conversation"
# )
# async def delete_conversation(
#     conversation_id: str,
#     client: ElevenLabsClient = Depends(get_client),
# ):
#     """
#     Delete conversation.
    
#     Args:
#         conversation_id: Conversation ID
#     """
#     try:
#         client.delete_conversation(conversation_id)
#         return {"message": "Conversation deleted successfully"}
#     except ElevenLabsError as e:
#         raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
#     except Exception as e:
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# @router.get(
#     "/conversations/{conversation_id}/signed-url",
#     tags=["Conversations"],
#     summary="Get conversation signed URL",
#     description="Get a signed URL for conversation access"
# )
# async def get_conversation_signed_url(
#     conversation_id: str,
#     client: ElevenLabsClient = Depends(get_client),
# ):
#     """
#     Get signed URL for conversation.
    
#     Args:
#         conversation_id: Conversation ID
        
#     Returns:
#         Signed URL string
#     """
#     try:
#         url = client.get_conversation_signed_url(conversation_id)
#         return {"signed_url": url}
#     except ElevenLabsError as e:
#         raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
#     except Exception as e:
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ================== SECRETS ENDPOINTS ==================

# @router.get(
#     "/secrets",
#     tags=["Secrets"],
#     summary="List secrets",
#     description="Retrieve all workspace secrets (values not included)"
# )
# async def list_secrets(
#     client: ElevenLabsClient = Depends(get_client)
# ):
#     """
#     List all workspace secrets.
    
#     Returns:
#         List of secret objects (without values)
#     """
#     try:
#         return {"secrets": client.list_secrets()}
#     except ElevenLabsError as e:
#         raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
#     except Exception as e:
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# @router.post(
#     "/secrets",
#     tags=["Secrets"],
#     status_code=status.HTTP_201_CREATED,
#     summary="Create secret",
#     description="Create a new workspace secret for tools"
# )
# async def create_secret(
#     req: SecretCreateRequest,
#     client: ElevenLabsClient = Depends(get_client),
# ):
#     """
#     Create a workspace secret.
    
#     Args:
#         req: Secret name and value
        
#     Returns:
#         Created secret object
#     """
#     try:
#         return client.create_secret(name=req.name, value=req.value)
#     except ElevenLabsError as e:
#         raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
#     except Exception as e:
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# @router.delete(
#     "/secrets/{secret_id}",
#     tags=["Secrets"],
#     status_code=status.HTTP_204_NO_CONTENT,
#     summary="Delete secret",
#     description="Delete a workspace secret"
# )
# async def delete_secret(
#     secret_id: str,
#     client: ElevenLabsClient = Depends(get_client),
# ):
#     """
#     Delete a secret.
    
#     Args:
#         secret_id: Secret ID
#     """
#     try:
#         client.delete_secret(secret_id)
#         return {"message": "Secret deleted successfully"}
#     except ElevenLabsError as e:
#         raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
#     except Exception as e:
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))




# ================= POST CALL WEBHOOK UPDATES ===================================

# ===================================
# WEBHOOK PAYLOAD STRUCTURE
# ===================================
# {
#   "type": "conversation.ended",
#   "event_timestamp": "2025-10-26T13:52:14.000Z",
#   "data": {
#     "conversation_id": "conv_7201k8gba9swf6brhqps1ymdn0wh",
#     "agent_id": "agent_1401k8ds8fene6b8sxff74yv7tbg",
#     "status": "done",
#     "transcript": [...],
#     "analysis": {
#       "evaluation_criteria_results": {},
#       "data_collection_results": {},
#       "call_successful": "success",
#       "transcript_summary": "..."
#     },
#     "metadata": {...}
#   }
# }

def extract_transcript_text(transcript_array: list) -> str:
    """Combine all transcript messages into single string"""
    try:
        messages = []
        for turn in transcript_array:
            if turn.get("message"):
                role = turn.get("role", "unknown")
                message = turn.get("message")
                messages.append(f"{role}: {message}")
        return "\n".join(messages)
    except Exception as e:
        print(f"❌ Error extracting transcript: {e}")
        return ""


def extract_call_analysis(webhook_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract call analysis data from ElevenLabs webhook payload
    Both sentiment_score and emotional_score are now 0.0-1.0 range
    """
    try:
        data = webhook_payload.get("data", {})
        analysis = data.get("analysis", {})
        metadata = data.get("metadata", {})
        
        # Get evaluation results (from your 6 criteria)
        eval_results = analysis.get("evaluation_criteria_results", {})
        
        # Get data collection results (from your 3 data fields)
        collected_data = analysis.get("data_collection_results", {})
        
        # Extract transcript
        transcript_array = data.get("transcript", [])
        transcript_text = extract_transcript_text(transcript_array)
        
        # MAPPING: evaluation_criteria_results → database fields
        booking_successful_eval = eval_results.get("booking_successful", {})
        booking_success = (booking_successful_eval.get("result") == "success")
        
        human_transfer_eval = eval_results.get("human_transfer_needed", {})
        human_agent_flag = (human_transfer_eval.get("result") == "failure")
        human_intervention_reason = ""
        if human_agent_flag:
            human_intervention_reason = human_transfer_eval.get("rationale", "")[:100]
        
        ai_detected_eval = eval_results.get("ai_detected_by_customer", {})
        ai_detected_flag = (ai_detected_eval.get("result") == "failure")
        
        inquiry_resolved_eval = eval_results.get("inquiry_resolved", {})
        product_inquiry_resolved = (inquiry_resolved_eval.get("result") == "success")
        
        conversation_topic_eval = eval_results.get("out_of_scope", {})
        out_of_scope = (conversation_topic_eval.get("result") == "failure")
        
        conversation_completed_eval = eval_results.get("conversation_completed", {})
        failed_conversation_reason = ""
        if conversation_completed_eval.get("result") == "failure":
            failed_conversation_reason = conversation_completed_eval.get("rationale", "")[:100]
        
        # MAPPING: data_collection_results → database fields
        # Both sentiment_score and emotional_score are now 0.0-1.0 from ElevenLabs
        
        sentiment_data = collected_data.get("sentiment_score", {})
        sentiment_score = sentiment_data.get("value")
        
        emotional_data = collected_data.get("emotional_score", {})
        emotional_score = emotional_data.get("value")
        
        customer_rating_data = collected_data.get("customer_satisfaction_rating", {})
        customer_rating = customer_rating_data.get("value")
        
        customer_type_data = collected_data.get("customer_type", {})
        customer_type = customer_type_data.get("value")
        
        customer_id_data = collected_data.get("customer_id",{})
        customer_id = customer_id_data.get("value")

        call_intent_data= collected_data.get("call_intent",{})
        call_intent = call_intent_data.get("value") 

        # Metadata - safe extraction with defaults
        call_duration = metadata.get("call_duration_secs", 0) if metadata else 0
        cost = metadata.get("cost", 0) if metadata else 0
        summary = analysis.get("transcript_summary", "") if analysis else ""
        
        # Safe normalization for sentiment_score (0.0-1.0 range)
        if sentiment_score is not None and isinstance(sentiment_score, (int, float)):
            # Clamp to 0.0-1.0 range
            sentiment_score = max(0.0, min(1.0, float(sentiment_score)))
        else:
            sentiment_score = 0.5  # Default neutral
        
        # Safe normalization for emotional_score (0.0-1.0 range)
        if emotional_score is not None and isinstance(emotional_score, (int, float)):
            # Clamp to 0.0-1.0 range
            emotional_score = max(0.0, min(1.0, float(emotional_score)))
        else:
            emotional_score = 0.5  # Default moderate
        
        # Safe normalization for customer_rating (handle None/null)
        if customer_rating is None or not isinstance(customer_rating, (int, float)):
            customer_rating = 3  # Default neutral
        
        return {
            "conv_id": data.get("conversation_id"),
            "customer_rating": customer_rating,
            "human_agent_flag": human_agent_flag,
            "ai_detected_flag": ai_detected_flag,
            "summary": summary,
            "sentiment_score": sentiment_score,  # Now 0.0-1.0
            "emotional_score": emotional_score,  # Now 0.0-1.0
            "human_intervention_reason": human_intervention_reason,
            "failed_conversation_reason": failed_conversation_reason,
            "out_of_scope": out_of_scope,
            "transcript": transcript_text,
            "booking_successful": booking_success,
            "product_inquiry_resolved": product_inquiry_resolved,
            "agent_id": data.get("agent_id"),
            "duration": call_duration,
            "cost": cost,
            "status": data.get("status"),
            "customer_type": customer_type,
            "customer_id":customer_id,
            "call_intent":call_intent
        }
        
    except Exception as e:
        print(f"❌ Error extracting call analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return {}

@router.post("/elevenlabs/post-call")
async def elevenlabs_webhook(request: Request, client: ElevenLabsClient = Depends(get_client)):
    """
    Handle ElevenLabs post-call webhook
    
    Payload structure:
    {
        "type": "post_call_transcription",
        "event_timestamp": "...",
        "data": { ... webhook data ... }
    }
    """
    try:
        # Step 1: Get RAW body
        payload_body = await request.body()  # bytes

        # Step 2: Get signature header
        signature_header = request.headers.get("elevenlabs-signature")

        if not signature_header:
            return {"status": "error", "message": "Invalid request: Cannot authorize"}

        # Step 3: Verify signature (with raw bytes!)
        if not client.verify_elevenlabs_signature(
            payload_body=payload_body,
            signature_header=signature_header
        ):
            return {"status": "error", "message": "Invalid signature"}

        # Step 4: NOW parse JSON
        webhook_payload = json.loads(payload_body)
        
        # Optional: Forward to webhook.site for debugging
        # requests.post("https://webhook.site/cd1995bf-d2c7-4f5d-88f7-0d649c83e07e", json=webhook_payload)
        
        # Log compact version
        print("\n" + "="*80)
        print("🔔 ELEVENLABS WEBHOOK RECEIVED")
        print("="*80)
        print(f"Type: {webhook_payload.get('type')}")
        print(f"Timestamp: {webhook_payload.get('event_timestamp')}")
        print(f"Conversation ID: {webhook_payload.get('data', {}).get('conversation_id')}")
        print("="*80 + "\n")
        
        # Extract the 'data' field
        data = webhook_payload.get("data", {})
        
        if not data:
            return {"status": "error", "message": "Missing 'data' field in webhook"}
        
        # Extract call analysis
        call_analysis = extract_call_analysis(webhook_payload)
        
        if not call_analysis:
            return {"status": "error", "message": "Failed to extract call analysis"}
        
        conv_id = call_analysis["conv_id"]
        
        # Step 1: Check if already exists
        existing = (
            supabase.table("call")
            .select("conv_id")
            .eq("conv_id", conv_id)
            .execute()
        )
        
        if existing.data:
            print(f"⏭️ Conversation {conv_id} already processed. Skipping...")
            return {
                "status": "skipped",
                "conversation_id": conv_id,
                "reason": "Already exists in database"
            }
        
        # Step 2: Save to call table
        call_response = supabase.table("call").insert({
            "conv_id": conv_id,
            "customer_id": call_analysis.get("customer_id",""),
            "call_intent": call_analysis.get("summary", ""),
            "transcript": call_analysis.get("transcript", ""),
            "duration" : call_analysis.get("duration"),
            "call_intent":call_analysis.get("call_intent"),
            "credits_consumed":call_analysis.get("cost"),
            "date_time": datetime.now(UTC).isoformat()
        }).execute()
        
        if not call_response.data:
            print(f"❌ Failed to save call: {conv_id}")
            return {"status": "error", "message": "Failed to save call"}
        
        # call_id = call_response.data[0]["id"]
        # print(f"✅ Call saved: {call_id}")
        
        # Step 3: Save to call_analysis table
        # Ensure scores are properly formatted as floats
        sentiment_score = call_analysis.get("sentiment_score", 0.5)
        emotional_score = call_analysis.get("emotional_score", 0.5)
        
        # Convert to float and clamp to 0.0-1.0 range as final safety check
        sentiment_score = max(0.0, min(1.0, float(sentiment_score)))
        emotional_score = max(0.0, min(1.0, float(emotional_score)))
        
        analysis_response = supabase.table("call_analysis").insert({
            "conv_id": conv_id,
            "customer_rating": call_analysis.get("customer_rating", 3),
            "human_agent_flag": call_analysis.get("human_agent_flag", False),
            "ai_detect_flag": call_analysis.get("ai_detected_flag", False),
            "summary": call_analysis.get("summary", ""),
            "sentiment_score": sentiment_score,  # 0.0-1.0 range
            "emotional_score": emotional_score,  # 0.0-1.0 range
            "human_intervention_reason": call_analysis.get("human_intervention_reason", ""),
            "failed_conversation_reason": call_analysis.get("failed_conversation_reason", ""),
            "out_of_scope": call_analysis.get("out_of_scope", False)
        }).execute()
        
        if not analysis_response.data:
            print(f"❌ Failed to save call analysis: {conv_id}")
            return {"status": "error", "message": "Failed to save call analysis"}
        
        # Enhanced success response with more details
        print(f"📊 Scores - Sentiment: {sentiment_score:.2f}, Emotional: {emotional_score:.2f}")
        
        return {
            "status": "success",
            "conversation_id": conv_id,
            "summary": call_analysis.get("summary", "")[:50],
            "customer_type": call_analysis.get("customer_type"),
            "sentiment_score": sentiment_score,
            "emotional_score": emotional_score
        }
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in webhook: {str(e)}")
        return {"status": "error", "message": "Invalid JSON"}
        
    except Exception as e:
        print(f"❌ Error processing webhook: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}



# ================== HEALTH CHECK ==================

# @router.get(
#     "/health",
#     tags=["Health"],
#     summary="Health check",
#     description="Check if the ElevenLabs service is accessible"
# )
# async def health_check(client: ElevenLabsClient = Depends(get_client)):
#     """
#     Health check endpoint to verify ElevenLabs connectivity.
    
#     Returns:
#         Health status and agent count
#     """
#     try:
#         count = client.count_agents()
#         return {
#             "status": "healthy",
#             "service": "ElevenLabs API",
#             "agent_count": count
#         }
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
#             detail=f"ElevenLabs service unavailable: {str(e)}"
#         )
    




# Test the extraction
# if __name__ == "__main__":
    print("="*80)
    print("🧪 TESTING CALL ANALYSIS EXTRACTION (0-1 RANGE)")
    print("="*80)
    
    # Load the JSON file
    with open("backend/routers/check.json", "r") as f:
        webhook_payload = json.load(f)
    
    print(f"\n✅ Loaded JSON file successfully")
    print(f"Webhook Type: {webhook_payload.get('type')}")
    print(f"Conversation ID: {webhook_payload.get('data', {}).get('conversation_id')}")
    
    # Extract call analysis
    print("\n" + "="*80)
    print("📊 EXTRACTING CALL ANALYSIS")
    print("="*80)
    
    result = extract_call_analysis(webhook_payload)
    
    if result:
        print("\n✅ Extraction successful!\n")
        
        # Print formatted results
        print("📋 CALL TABLE DATA:")
        print(f"  conv_id: {result['conv_id']}")
        print(f"  call_intent: {result['summary'][:100]}")
        print(f"  duration: {result['duration']} seconds")
        print(f"  cost: {result['cost']}")
        print(f"  status: {result['status']}")
        
        print("\n📊 CALL_ANALYSIS TABLE DATA:")
        print(f"  conv_id: {result['conv_id']}")
        print(f"  customer_rating: {result['customer_rating']}")
        print(f"  human_agent_flag: {result['human_agent_flag']}")
        print(f"  ai_detected_flag: {result['ai_detected_flag']}")
        print(f"  sentiment_score: {result['sentiment_score']:.2f} (0.0-1.0 range)")
        print(f"  emotional_score: {result['emotional_score']:.2f} (0.0-1.0 range)")
        print(f"  out_of_scope: {result['out_of_scope']}")
        print(f"  booking_successful: {result['booking_successful']}")
        print(f"  product_inquiry_resolved: {result['product_inquiry_resolved']}")
        print(f"  customer_type: {result['customer_type']}")
        
        print("\n📝 TRANSCRIPT:")
        print(result['transcript'])
        
        print("\n📄 SUMMARY:")
        print(result['summary'])
        
        if result['human_intervention_reason']:
            print(f"\n⚠️ Human Intervention Reason: {result['human_intervention_reason']}")
        
        if result['failed_conversation_reason']:
            print(f"\n❌ Failed Conversation Reason: {result['failed_conversation_reason']}")
        
        print("\n" + "="*80)
        print("📤 SUPABASE INSERT PREVIEW")
        print("="*80)
        
        print("\n✅ CALL TABLE INSERT:")
        call_insert = {
            "conv_id": result['conv_id'],
            "call_intent": result['summary'][:100],
            "transcript": result['transcript'],
            "date_time": "2025-11-02T18:50:00+05:30"  # Example timestamp
        }
        print(json.dumps(call_insert, indent=2))
        
        print("\n✅ CALL_ANALYSIS TABLE INSERT:")
        analysis_insert = {
            "conv_id": result['conv_id'],
            "customer_rating": result['customer_rating'],
            "human_agent_flag": result['human_agent_flag'],
            "ai_detect_flag": result['ai_detected_flag'],
            "summary": result['summary'],
            "sentiment_score": result['sentiment_score'],
            "emotional_score": result['emotional_score'],
            "human_intervention_reason": result['human_intervention_reason'],
            "failed_conversation_reason": result['failed_conversation_reason'],
            "out_of_scope": result['out_of_scope']
        }
        print(json.dumps(analysis_insert, indent=2))
        
        print("\n" + "="*80)
        print("✅ TEST COMPLETED SUCCESSFULLY")
        print("="*80)
        
    else:
        print("\n❌ Extraction failed - check errors above")
    print("="*80)
    print("🧪 TESTING CALL ANALYSIS EXTRACTION")
    print("="*80)
    
    # Load the JSON file
    with open("backend/routers/check.json", "r") as f:
        webhook_payload = json.load(f)
    
    print(f"\n✅ Loaded JSON file successfully")
    print(f"Webhook Type: {webhook_payload.get('type')}")
    print(f"Conversation ID: {webhook_payload.get('data', {}).get('conversation_id')}")
    
    # Extract call analysis
    print("\n" + "="*80)
    print("📊 EXTRACTING CALL ANALYSIS")
    print("="*80)
    
    result = extract_call_analysis(webhook_payload)
    
    if result:
        print("\n✅ Extraction successful!\n")
        
        # Print formatted results
        print("📋 CALL TABLE DATA:")
        print(f"  conv_id: {result['conv_id']}")
        print(f"  call_intent: {result['summary']}")
        print(f"  duration: {result['duration']} seconds {type(result['duration'])}")
        print(f"  cost: {result['cost']} creds {type(result['cost'])}")
        print(f"  status: {result['status']}")
        
        print("\n📊 CALL_ANALYSIS TABLE DATA:")
        print(f"  conv_id: {result['conv_id']}")
        print(f"  customer_rating: {result['customer_rating']}")
        print(f"  human_agent_flag: {result['human_agent_flag']}")
        print(f"  ai_detected_flag: {result['ai_detected_flag']}")
        print(f"  sentiment_score: {result['sentiment_score']}")
        print(f"  emotional_score: {result['emotional_score']}")
        print(f"  out_of_scope: {result['out_of_scope']}")
        print(f"  booking_successful: {result['booking_successful']}")
        print(f"  product_inquiry_resolved: {result['product_inquiry_resolved']}")
        print(f"  customer_type: {result['customer_type']}")
        
        print("\n📝 TRANSCRIPT:")
        print(result['transcript'])
        
        print("\n📄 SUMMARY:")
        print(result['summary'])
        
        if result['human_intervention_reason']:
            print(f"\n⚠️ Human Intervention Reason: {result['human_intervention_reason']}")
        
        if result['failed_conversation_reason']:
            print(f"\n❌ Failed Conversation Reason: {result['failed_conversation_reason']}")
        
        print("\n" + "="*80)
        print("✅ TEST COMPLETED SUCCESSFULLY")
        print("="*80)
        
    else:
        print("\n❌ Extraction failed - check errors above")