"""
eleven_labs.py
---------------
Wrapper around the official ElevenLabs Python SDK for Conversational AI Platform.
Provides convenient methods with comprehensive error handling for Agents, Knowledge Base,
Phone Numbers, Workspace, Conversations, and Secrets management.

Installation:
    pip install elevenlabs python-dotenv

Usage:
    from eleven_labs import ElevenLabsClient
    
    client = ElevenLabsClient()
    agents = client.list_agents()
"""

from hashlib import sha256
import hmac
import json
import time
from typing import Any, Dict, Optional, List, BinaryIO
import os
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs


class ElevenLabsError(Exception):
    """Custom exception for ElevenLabs operations"""
    pass


class ElevenLabsClient:
    """
    High-level wrapper for the official ElevenLabs Python SDK.
    
    This class provides convenient methods for working with:
    - Agents: Create, update, list, get, delete conversational AI agents
    - Knowledge Base: Manage documents for agent context
    - Phone Numbers: Import and manage Twilio/SIP trunk numbers
    - Workspace: Get and update workspace settings
    - Conversations: List and retrieve conversation details
    - Secrets: Manage API secrets for tools
    
    Authentication:
        Requires ELEVENLABS_API_KEY environment variable or passed to constructor.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        timeout: Optional[float] = 60.0,
    ):
        """
        Initialize ElevenLabs client wrapper.
        
        Args:
            api_key: ElevenLabs API key (defaults to ELEVENLABS_API_KEY env var)
            timeout: Request timeout in seconds (default: 60)
            
        Raises:
            ValueError: If API key is not provided
            ElevenLabsError: If client initialization fails
        """
        # Load environment variables from keys.env if exists
        load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), 'keys.env'))
        self.post_call_secret = os.getenv("POST_CALL_WEBHOOK_SECRET")
        self.api_key = api_key or os.getenv("ELEVENLABS_API_KEY")
        if not self.api_key:
            raise ValueError(
                "Missing ELEVENLABS_API_KEY. Provide via constructor or environment variable."
            )
        
        # Initialize official ElevenLabs client
        try:
            self.client = ElevenLabs(
                api_key=self.api_key,
                timeout=timeout,
            )
        except Exception as e:
            raise ElevenLabsError(f"Failed to initialize ElevenLabs client: {str(e)}") from e

    def _handle_error(self, e: Exception, operation: str) -> None:
        """
        Handle SDK errors and convert to ElevenLabsError.
        
        Args:
            e: Exception from SDK
            operation: Description of operation that failed
            
        Raises:
            ElevenLabsError: Wrapped error with context
        """
        error_message = f"Error during {operation}: {str(e)}"
        raise ElevenLabsError(error_message) from e

    # ================== AGENTS ==================

    def list_agents(
        self,
        page_size: Optional[int] = None,
        cursor: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List all agents in workspace.
        
        Args:
            page_size: Number of agents per page
            cursor: Pagination cursor from previous response
            
        Returns:
            Dictionary containing agents list and pagination info
            {
                "agents": [...],
                "next_cursor": str,
                "has_more": bool
            }
            
        Raises:
            ElevenLabsError: If API request fails
        """
        try:
            response = self.client.conversational_ai.agents.list(
                page_size=page_size,
                cursor=cursor,
            )
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, "listing agents")

    def create_agent(
        self,
        name: str,
        conversation_config: Dict[str, Any],
        tags: Optional[List[str]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Create a new conversational AI agent.
        
        Args:
            name: Agent name (required)
            conversation_config: Agent configuration (required) including:
                - agent: Dict with prompt, LLM, language settings
                    - prompt: Dict with "prompt", "llm", "temperature", "max_tokens"
                    - first_message: Initial greeting message
                    - language: Primary language code (e.g., "en", "es", "fr")
                    - languages: List of supported languages
                - tts: Dict with TTS voice settings
                    - model_id: TTS model ID (e.g., "eleven_turbo_v2_5")
                    - voice_id: Voice ID
                    - optimize_streaming_latency: 0-4 for latency optimization
                    - stability: 0.0-1.0 for voice stability
                    - similarity_boost: 0.0-1.0 for similarity to original voice
                - asr: Dict with speech recognition settings (optional)
                    - quality: "low" | "high"
                    - user_input_audio_format: Audio format specification
                - messages_config: Dict with message handling (optional)
            tags: List of tags for organization
            description: Agent description
            **kwargs: Additional agent configuration options
            
        Returns:
            Created agent object with agent_id
            {
                "agent_id": str,
                "name": str,
                "conversation_config": {...},
                "created_at": str,
                ...
            }
            
        Raises:
            ElevenLabsError: If agent creation fails
            
        Example:
            >>> agent = client.create_agent(
            ...     name="Support Bot",
            ...     conversation_config={
            ...         "agent": {
            ...             "prompt": {
            ...                 "prompt": "You are a helpful customer support agent.",
            ...                 "llm": "gpt-4o",
            ...                 "temperature": 0.7,
            ...                 "max_tokens": 1024
            ...             },
            ...             "first_message": "Hello! How can I assist you?",
            ...             "language": "en"
            ...         },
            ...         "tts": {
            ...             "model_id": "eleven_turbo_v2_5",
            ...             "voice_id": "cjVigY5qzO86Huf0OWal",
            ...             "stability": 0.5,
            ...             "similarity_boost": 0.75
            ...         }
            ...     },
            ...     tags=["support", "customer-service"],
            ...     description="Handles customer inquiries"
            ... )
        """
        try:
            response = self.client.conversational_ai.agents.create(
                name=name,
                conversation_config=conversation_config,
                tags=tags,
                **kwargs
            )
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, f"creating agent '{name}'")

    def get_agent(self, agent_id: str) -> Dict[str, Any]:
        """
        Get agent configuration by ID.
        
        Args:
            agent_id: Agent ID (required)
            
        Returns:
            Agent configuration object with all settings
            
        Raises:
            ElevenLabsError: If agent not found or request fails
        """
        try:
            response = self.client.conversational_ai.agents.get(agent_id=agent_id)
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, f"getting agent {agent_id}")

    def update_agent(
        self,
        agent_id: str,
        name: Optional[str] = None,
        conversation_config: Optional[Dict[str, Any]] = None,
        tags: Optional[List[str]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Update agent configuration.
        
        Args:
            agent_id: Agent ID (required)
            name: New agent name
            conversation_config: Updated conversation configuration
            tags: Updated tags list
            description: Updated description
            **kwargs: Additional fields to update
            
        Returns:
            Updated agent object
            
        Raises:
            ElevenLabsError: If update fails
        """
        try:
            response = self.client.conversational_ai.agents.update(
                agent_id=agent_id,
                name=name,
                conversation_config=conversation_config,
                tags=tags,
                **kwargs
            )
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, f"updating agent {agent_id}")

    def delete_agent(self, agent_id: str) -> None:
        """
        Delete an agent permanently.
        
        Args:
            agent_id: Agent ID (required)
            
        Raises:
            ElevenLabsError: If deletion fails
        """
        try:
            self.client.conversational_ai.agents.delete(agent_id=agent_id)
        except Exception as e:
            self._handle_error(e, f"deleting agent {agent_id}")


    # ================== KNOWLEDGE BASE ==================

    def list_knowledge_base_documents(
        self,
        page_size: Optional[int] = None,
        cursor: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List knowledge base documents.
        
        Args:
            page_size: Documents per page
            cursor: Pagination cursor from previous response
            
        Returns:
            Dictionary with documents list and pagination info
            {
                "documents": [...],
                "next_cursor": str,
                "has_more": bool
            }
            
        Raises:
            ElevenLabsError: If request fails
        """
        try:
            response = self.client.conversational_ai.knowledge_base.list(
                page_size=page_size,
                cursor=cursor,
            )
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, "listing knowledge base documents")

    def create_knowledge_base_document_from_url(
        self,
        url: str,
        name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create knowledge base document by scraping a URL.
        
        Args:
            url: URL to scrape (required)
            name: Document name (optional, defaults to page title)
            
        Returns:
            Created document object with document_id
            {
                "document_id": str,
                "name": str,
                "url": str,
                "size_bytes": int,
                "created_at": str,
                ...
            }
            
        Raises:
            ElevenLabsError: If document creation fails
        """
        try:
            response = self.client.conversational_ai.knowledge_base.documents.create_from_url(
                url=url,
                name=name
            )
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, f"creating knowledge base document from URL {url}")

    def create_knowledge_base_document_from_text(
        self,
        text: str,
        name: str
    ) -> Dict[str, Any]:
        """
        Create knowledge base document from raw text content.
        
        Args:
            text: Text content (required)
            name: Document name (required)
            
        Returns:
            Created document object with document_id
            
        Raises:
            ElevenLabsError: If document creation fails
        """
        try:
            response = self.client.conversational_ai.knowledge_base.documents.create_from_text(
                text=text,
                name=name
            )
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, f"creating knowledge base document from text")

    def create_knowledge_base_document_from_file(
        self,
        file: Any,  
        name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create knowledge base document from uploaded file.

        Accepts both file paths and file-like objects (BinaryIO, UploadFile.file, etc).

        Supported formats: PDF, TXT, DOCX, HTML, EPUB, MD

        Args:
            file: File path (string) or file-like object (required)
            name: Document name (optional, defaults to filename)
            description: Document description (optional)

        Returns:
            Created document object with document_id

        Raises:
            ElevenLabsError: If document creation fails
        """

        try:   
            response = self.client.conversational_ai.knowledge_base.documents.create_from_file(file=file,name = name)
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, "creating knowledge base document from file")


    def get_knowledge_base_document(self, document_id: str) -> Dict[str, Any]:
        """
        Get knowledge base document details.
        
        Args:
            document_id: Document ID (required)
            
        Returns:
            Document object with metadata
            
        Raises:
            ElevenLabsError: If document not found or request fails
        """
        try:
            response = self.client.conversational_ai.knowledge_base.documents.get(
                documentation_id=document_id
            )
            print(response)
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, f"getting knowledge base document {document_id}")

    def update_knowledge_base_document(
        self,
        document_id: str,
        name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update knowledge base document metadata.
        
        Args:
            document_id: Document ID (required)
            name: New document name
            
        Returns:
            Updated document object
            
        Raises:
            ElevenLabsError: If update fails
        """
        try:
            response = self.client.conversational_ai.knowledge_base.documents.update(
                documentation_id=document_id,
                name=name
            )
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, f"updating knowledge base document {document_id}")

    def delete_knowledge_base_document(self, document_id: str) -> None:
        """
        Delete knowledge base document.
        
        Args:
            document_id: Document ID (required)
            
        Raises:
            ElevenLabsError: If deletion fails
        """
        try:
            self.client.conversational_ai.knowledge_base.documents.delete(
                documentation_id=document_id
            )
        except Exception as e:
            self._handle_error(e, f"deleting knowledge base document {document_id}")

    def compute_rag_index(self,document_id: int,model: str):
        try :
            # print("this is it")
            response = self.client.conversational_ai.knowledge_base.document.compute_rag_index(
                documentation_id=document_id,
                model=model
            )
            
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e,f"Compute Rag Index Error :" ,e)
    
    # ================== PHONE NUMBERS ==================

    def list_phone_numbers(
        self,
        page_size: Optional[int] = None,
        cursor: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List all imported phone numbers.
        
        Args:
            page_size: Numbers per page
            cursor: Pagination cursor
            
        Returns:
            Dictionary with phone numbers list
            {
                "phone_numbers": [...],
                "next_cursor": str,
                "has_more": bool
            }
            
        Raises:
            ElevenLabsError: If request fails
        """
        try:
            response = self.client.conversational_ai.phone_numbers.list()
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, "listing phone numbers")

    def get_phone_number(self, phone_number_id: str) -> Dict[str, Any]:
        """
        Get phone number details.
        
        Args:
            phone_number_id: Phone number ID (required)
            
        Returns:
            Phone number object with configuration
            {
                "phone_number_id": str,
                "phone_number": str,
                "provider": "twilio" | "sip_trunk",
                "agent_id": str,
                ...
            }
            
        Raises:
            ElevenLabsError: If phone number not found or request fails
        """
        try:
            response = self.client.conversational_ai.phone_numbers.get(
                phone_number_id=phone_number_id
            )
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, f"getting phone number {phone_number_id}")

    def update_phone_number(
        self,
        phone_number_id: str,
        label: Optional[str] = None,
        agent_id: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Update phone number configuration.
        
        Args:
            phone_number_id: Phone number ID (required)
            label: Update label/name
            agent_id: Assign to agent
            **kwargs: Additional fields to update
            
        Returns:
            Updated phone number object
            
        Raises:
            ElevenLabsError: If update fails
        """
        try:
            update_data = {"label": label, "agent_id": agent_id, **kwargs}
            # Filter out None values
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            response = self.client.conversational_ai.phone_numbers.update(
                phone_number_id=phone_number_id,
                **update_data
            )
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, f"updating phone number {phone_number_id}")

    def delete_phone_number(self, phone_number_id: str) -> None:
        """
        Delete a phone number permanently.
        
        Args:
            phone_number_id: Phone number ID (required)
            
        Raises:
            ElevenLabsError: If deletion fails
        """
        try:
            self.client.conversational_ai.phone_numbers.delete(
                phone_number_id=phone_number_id
            )
        except Exception as e:
            self._handle_error(e, f"deleting phone number {phone_number_id}")

    # ================== WORKSPACE ==================

    def get_workspace_settings(self) -> Dict[str, Any]:
        """
        Get workspace settings and configuration.
        
        Returns:
            Workspace settings object
            {
                "workspace_id": str,
                "name": str,
                "settings": {...},
                ...
            }
            
        Raises:
            ElevenLabsError: If request fails
        """
        try:
            response = self.client.conversational_ai.settings.get()
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, "getting workspace settings")

    def update_workspace_settings(self, **kwargs) -> Dict[str, Any]:
        """
        Update workspace settings.
        
        Args:
            **kwargs: Settings fields to update
            
        Returns:
            Updated workspace settings
            
        Raises:
            ElevenLabsError: If update fails
        """
        try:
            response = self.client.conversational_ai.settings.update(**kwargs)
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, "updating workspace settings")

    def get_dashboard_settings(self) -> Dict[str, Any]:
        """
        Get workspace dashboard settings.
        
        Returns:
            Dashboard settings object
            
        Raises:
            ElevenLabsError: If request fails
        """
        try:
            response = self.client.conversational_ai.dashboard.settings.get()
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, "getting dashboard settings")

    def update_dashboard_settings(self, **kwargs) -> Dict[str, Any]:
        """
        Update workspace dashboard settings.
        
        Args:
            **kwargs: Dashboard settings to update
            
        Returns:
            Updated dashboard settings
            
        Raises:
            ElevenLabsError: If update fails
        """
        try:
            response = self.client.conversational_ai.dashboard.settings.update(**kwargs)
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, "updating dashboard settings")

    # ================== CONVERSATIONS ==================

    def list_conversations(
        self,
        agent_id: Optional[str] = None,
        page_size: Optional[int] = None,
        cursor: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List conversations across workspace or for specific agent.
        
        Args:
            agent_id: Filter by agent ID (optional)
            page_size: Conversations per page
            cursor: Pagination cursor
            
        Returns:
            Dictionary with conversations list
            {
                "conversations": [...],
                "next_cursor": str,
                "has_more": bool
            }
            
        Raises:
            ElevenLabsError: If request fails
        """
        try:
            response = self.client.conversational_ai.conversations.list(
                agent_id=agent_id,
                page_size=page_size,
                cursor=cursor,
            )
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, "listing conversations")

    def get_conversation(self, conversation_id: str) -> Dict[str, Any]:
        """
        Get conversation details including full transcript and analysis.
        
        Args:
            conversation_id: Conversation ID (required)
            
        Returns:
            Conversation object with:
            {
                "conversation_id": str,
                "agent_id": str,
                "transcript": [...],
                "analysis": {...},
                "call_duration": int,
                "status": str,
                "created_at": str,
                ...
            }
            
        Raises:
            ElevenLabsError: If conversation not found or request fails
        """
        try:
            response = self.client.conversational_ai.conversations.get(
                conversation_id=conversation_id
            )
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, f"getting conversation {conversation_id}")

    def delete_conversation(self, conversation_id: str) -> None:
        """
        Delete a conversation permanently.
        
        Args:
            conversation_id: Conversation ID (required)
            
        Raises:
            ElevenLabsError: If deletion fails
        """
        try:
            self.client.conversational_ai.conversations.delete(
                conversation_id=conversation_id
            )
        except Exception as e:
            self._handle_error(e, f"deleting conversation {conversation_id}")

    def get_conversation_signed_url(self, conversation_id: str) -> str:
        """
        Get a signed URL for accessing conversation details.
        
        Args:
            conversation_id: Conversation ID (required)
            
        Returns:
            Signed URL string (time-limited, for sharing)
            
        Raises:
            ElevenLabsError: If request fails
        """
        try:
            response = self.client.conversational_ai.conversations.get_signed_url(
                conversation_id=conversation_id
            )
            return response if isinstance(response, str) else response.url
        except Exception as e:
            self._handle_error(e, f"getting signed URL for conversation {conversation_id}")

    # ================== SECRETS ==================

    def list_secrets(self) -> List[Dict[str, Any]]:
        """
        List workspace secrets (for tools authentication).
        
        Note: Actual secret values are never returned for security.
        
        Returns:
            List of secret metadata objects
            [
                {
                    "secret_id": str,
                    "name": str,
                    "created_at": str,
                    ...
                }
            ]
            
        Raises:
            ElevenLabsError: If request fails
        """
        try:
            response = self.client.conversational_ai.secrets.list()
            if hasattr(response, 'model_dump'):
                return response.model_dump()
            return response if isinstance(response, list) else list(response)
        except Exception as e:
            self._handle_error(e, "listing secrets")

    def create_secret(self, name: str, value: str) -> Dict[str, Any]:
        """
        Create a workspace secret for use in tools and agents.
        
        Args:
            name: Secret name (required) - unique identifier
            value: Secret value (required) - API key, password, token, etc.
            
        Returns:
            Created secret metadata (without value)
            {
                "secret_id": str,
                "name": str,
                "created_at": str,
                ...
            }
            
        Raises:
            ElevenLabsError: If creation fails
        """
        try:
            response = self.client.conversational_ai.secrets.create(
                name=name,
                value=value,
            )
            return response.model_dump() if hasattr(response, 'model_dump') else response
        except Exception as e:
            self._handle_error(e, f"creating secret '{name}'")

    def delete_secret(self, secret_id: str) -> None:
        """
        Delete a workspace secret.
        
        Args:
            secret_id: Secret ID (required)
            
        Raises:
            ElevenLabsError: If deletion fails
        """
        try:
            self.client.conversational_ai.secrets.delete(secret_id=secret_id)
        except Exception as e:
            self._handle_error(e, f"deleting secret {secret_id}")

# ===== POST CALL WEBHOOOK CREATION ==========================

    def verify_elevenlabs_signature(
        self,
        payload_body: bytes,
        signature_header: str,
        timestamp_tolerance_seconds: int = 30 * 60  # 30 minutes default
    ) -> bool:
        """
        Verify ElevenLabs webhook signature and timestamp.
        
        Args:
            payload_body: Raw request body as bytes
            signature_header: Value from 'elevenlabs-signature' header
                             Format: "t=<timestamp>,v0=<signature>"
            secret: Secret key (your ElevenLabs API key)
            timestamp_tolerance_seconds: Max age of request in seconds (default 30 mins)
        
        Returns:
            True if signature is valid and timestamp is recent, False otherwise
        
        Raises:
            ValueError: If signature header format is invalid
        """
        try:
            # Step 1: Parse signature header
            # Format: "t=<timestamp>,v0=<hmac_signature>"
            parts = signature_header.split(",")
            
            if len(parts) != 2:
                print(f"❌ Invalid signature header format: {signature_header}")
                return False
            
            # Extract timestamp
            timestamp_part = parts[0]  # "t=1234567890"
            if not timestamp_part.startswith("t="):
                print(f"❌ Invalid timestamp format: {timestamp_part}")
                return False
            timestamp = timestamp_part[2:]
            
            # Extract HMAC signature
            signature_part = parts[1]  # "v0=abc123..."
            if not signature_part.startswith("v0="):
                print(f"❌ Invalid signature format: {signature_part}")
                return False
            hmac_signature = signature_part
            
            # Step 2: Validate timestamp (prevent replay attacks)
            try:
                timestamp_int = int(timestamp)
            except ValueError:
                print(f"❌ Timestamp is not a valid integer: {timestamp}")
                return False
            
            current_time = int(time.time())
            tolerance_threshold = current_time - timestamp_tolerance_seconds
            
            if timestamp_int < tolerance_threshold:
                print(f"❌ Timestamp too old: {timestamp} (current: {current_time}, tolerance: {tolerance_threshold})")
                return False
            
            # Timestamp in future (more than 1 minute) - also reject
            if timestamp_int > current_time + 60:
                print(f"❌ Timestamp in future: {timestamp}")
                return False
            
            # Step 3: Calculate HMAC signature
            # Format: "<timestamp>.<payload>"
            full_payload_to_sign = f"{timestamp}.{payload_body.decode('utf-8')}"
            
            mac = hmac.new(
                key=self.post_call_secret.encode("utf-8"),
                msg=full_payload_to_sign.encode("utf-8"),
                digestmod=sha256,
            )
            
            # Create expected signature in format "v0=<hex>"
            expected_digest = "v0=" + mac.hexdigest()
            
            # Step 4: Compare signatures (use constant-time comparison to prevent timing attacks)
            if not hmac.compare_digest(hmac_signature, expected_digest):
                print(f"❌ Signature mismatch")
                print(f"   Expected: {expected_digest}")
                print(f"   Received: {hmac_signature}")
                return False
            
            print(f"✅ Webhook signature verified successfully")
            return True
            
        except Exception as e:
            print(f"❌ Error verifying signature: {str(e)}")
            return False





# ================== TESTING ==================

if __name__ == "__main__":
    """
    Comprehensive test suite for ElevenLabs SDK wrapper.
    
    Prerequisites:
    - Set ELEVENLABS_API_KEY in environment or keys.env file
    - Have at least one agent in your workspace
    
    Run with: python eleven_labs.py
    
    """
    client = ElevenLabsClient()
    # client.test()
    print("=" * 80)
    print("ElevenLabs SDK Wrapper - Comprehensive Test Suite")
    print("=" * 80)
    print(json.dumps(client.get_conversation("conv_8301k92ccc2cf37r4cacfvq5ndgs"),indent=2))
    # try:
    #     # Initialize client
    #     print("\n[1] Initializing client...")
    #     client = ElevenLabsClient()
    #     print("✓ Client initialized successfully")
        
    #     # ========== WORKSPACE ==========
    #     print("\n" + "=" * 80)
    #     print("WORKSPACE SETTINGS")
    #     print("=" * 80)
        
    #     print("\n[2] Getting workspace settings...")
    #     try:
    #         workspace_settings = client.get_workspace_settings()
    #         print(f"✓ Workspace settings retrieved")
    #         print(f"   Keys: {list(workspace_settings.keys())[:5]}...")
    #     except ElevenLabsError as e:
    #         print(f"⚠ Workspace settings: {e}")
        
    #     # ========== AGENTS ==========
    #     print("\n" + "=" * 80)
    #     print("AGENTS")
    #     print("=" * 80)
        
    #     print("\n[3] Counting agents...")
    #     try:
    #         agent_count = client.count_agents()
    #         print(f"✓ Total agents: {agent_count}")
    #     except ElevenLabsError as e:
    #         print(f"⚠ Agent count: {e}")
    #         agent_count = 0
        
    #     print("\n[4] Listing agents...")
    #     try:
    #         agents_response = client.list_agents(page_size=10)
    #         agents = agents_response.get("agents", [])
    #         print(f"✓ Listed {len(agents)} agent(s)")
            
    #         if agents:
    #             agent = agents[0]
    #             agent_id = agent["agent_id"]
    #             print(f"   First agent: {agent.get('name', 'Unnamed')} (ID: {agent_id})")
                
    #             print(f"\n[5] Getting agent details...")
    #             agent_details = client.get_agent(agent_id)
    #             print(f"✓ Agent details retrieved")
    #             print(f"   Name: {agent_details.get('name')}")
    #         else:
    #             print("\n⚠ No agents found. Create an agent to test agent endpoints.")
    #     except ElevenLabsError as e:
    #         print(f"⚠ Agent operations: {e}")
        
    #     # ========== KNOWLEDGE BASE ==========
    #     print("\n" + "=" * 80)
    #     print("KNOWLEDGE BASE")
    #     print("=" * 80)
        
    #     print("\n[6] Listing knowledge base documents...")
    #     try:
    #         kb_response = client.list_knowledge_base_documents(page_size=10)
    #         documents = kb_response.get("documents", [])
    #         print(f"✓ Found {len(documents)} document(s)")
            
    #         if documents:
    #             doc = documents[0]
    #             doc_id = doc["document_id"]
    #             print(f"   First document: {doc.get('name', 'Unnamed')} (ID: {doc_id})")
                
    #             print(f"\n[7] Getting document details...")
    #             doc_details = client.get_knowledge_base_document(doc_id)
    #             print(f"✓ Document details retrieved")
    #             print(f"   Name: {doc_details.get('name')}")
    #     except ElevenLabsError as e:
    #         print(f"⚠ Knowledge base: {e}")
        
    #     # ========== PHONE NUMBERS ==========
    #     print("\n" + "=" * 80)
    #     print("PHONE NUMBERS")
    #     print("=" * 80)
        
    #     print("\n[8] Listing phone numbers...")
    #     try:
    #         phone_response = client.list_phone_numbers(page_size=10)
    #         phone_numbers = phone_response.get("phone_numbers", [])
    #         print(f"✓ Found {len(phone_numbers)} phone number(s)")
            
    #         if phone_numbers:
    #             phone = phone_numbers[0]
    #             phone_id = phone["phone_number_id"]
    #             print(f"   First number: {phone.get('phone_number', 'N/A')} (ID: {phone_id})")
    #     except ElevenLabsError as e:
    #         print(f"⚠ Phone numbers: {e}")
        
    #     # ========== CONVERSATIONS ==========
    #     print("\n" + "=" * 80)
    #     print("CONVERSATIONS")
    #     print("=" * 80)
        
    #     print("\n[9] Listing conversations...")
    #     try:
    #         conv_response = client.list_conversations(page_size=10)
    #         conversations = conv_response.get("conversations", [])
    #         print(f"✓ Found {len(conversations)} conversation(s)")
            
    #         if conversations:
    #             conv = conversations[0]
    #             conv_id = conv["conversation_id"]
    #             print(f"   First conversation: {conv_id}")
                
    #             print(f"\n[10] Getting conversation details...")
    #             conv_details = client.get_conversation(conv_id)
    #             print(f"✓ Conversation details retrieved")
    #             print(f"   Status: {conv_details.get('status', 'N/A')}")
    #             print(f"   Duration: {conv_details.get('call_duration', 'N/A')}s")
    #     except ElevenLabsError as e:
    #         print(f"⚠ Conversations: {e}")
        
    #     # ========== SECRETS ==========
    #     print("\n" + "=" * 80)
    #     print("SECRETS")
    #     print("=" * 80)
        
    #     print("\n[11] Listing secrets...")
    #     try:
    #         secrets = client.list_secrets()
    #         print(f"✓ Found {len(secrets)} secret(s)")
    #     except ElevenLabsError as e:
    #         print(f"⚠ Secrets: {e}")
        
    #     # ========== SUMMARY ==========
    #     print("\n" + "=" * 80)
    #     print("TEST SUMMARY")
    #     print("=" * 80)
    #     print("\n✓ All tests completed successfully!")
    #     print(f"\nStatistics:")
    #     print(f"  - Total Agents: {agent_count}")
    #     print(f"  - Knowledge Base Documents: {len(documents) if 'documents' in locals() else 0}")
    #     print(f"  - Phone Numbers: {len(phone_numbers) if 'phone_numbers' in locals() else 0}")
    #     print(f"  - Conversations: {len(conversations) if 'conversations' in locals() else 0}")
    #     print(f"  - Secrets: {len(secrets) if 'secrets' in locals() else 0}")
        
    # except ElevenLabsError as e:
    #     print(f"\n✗ ElevenLabs Error: {e}")
    #     import traceback
    #     traceback.print_exc()
    # except Exception as e:
    #     print(f"\n✗ Unexpected error: {e}")
    #     import traceback
    #     traceback.print_exc()
    
    # print("\n" + "=" * 80)
    # print("Test suite complete!")
    # print("=" * 80)
