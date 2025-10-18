"""
PayU Payment Link Integration Module
Handles OAuth token management and payment link creation for PayU Payment Gateway.
Environment: UAT (Test)
"""

import http.client
import json
import os
import threading
import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr, validator
from dotenv import load_dotenv


# ============================================================================
# EXCEPTION CLASSES
# ============================================================================

class PayUAPIError(Exception):
    """Custom exception for PayU API errors."""
    pass


# ============================================================================
# REQUEST MODELS
# ============================================================================

class CustomerInfo(BaseModel):
    """Customer information for payment link."""
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)


class AddressInfo(BaseModel):
    """Address information for payment link."""
    line1: str = Field(default="", max_length=200)
    line2: str = Field(default="", max_length=200)
    city: str = Field(default="", max_length=100)
    state: str = Field(default="", max_length=100)
    zipCode: str = Field(default="", max_length=10)


class UDFInfo(BaseModel):
    """User-defined fields for payment link."""
    udf1: Optional[str] = None
    udf2: Optional[str] = None
    udf3: Optional[str] = None
    udf4: Optional[str] = None
    udf5: Optional[str] = None


class PaymentLinkRequest(BaseModel):
    """Request model for creating a payment link."""
    invoiceNumber: str = Field(..., min_length=1)
    subAmount: float = Field(..., ge=0)
    tax: float = Field(default=0, ge=0)
    shippingCharge: float = Field(default=0, ge=0)
    discount: float = Field(default=0, ge=0)
    adjustment: float = Field(default=0, ge=0)
    minAmountForCustomer: float = Field(default=0, ge=0)
    description: str = Field(default="")
    source: str = Field(default="API")
    currency: str = Field(default="INR")
    maxPaymentsAllowed: int = Field(default=1, ge=1)
    customer: CustomerInfo
    address: AddressInfo = Field(default_factory=AddressInfo)
    udf: UDFInfo = Field(default_factory=UDFInfo)
    viaEmail: bool = Field(default=True)
    viaSms: bool = Field(default=False)
    notes: str = Field(default="")
    isActive: bool = Field(default=True)
    isAmountFilledByCustomer: bool = Field(default=False)

    @property
    def total_amount(self) -> float:
        """Calculate total amount."""
        return (
            self.subAmount + 
            self.tax + 
            self.shippingCharge - 
            self.discount + 
            self.adjustment
        )


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class UDFResponse(BaseModel):
    """UDF fields in response."""
    udf1: Optional[str] = None
    udf2: Optional[str] = None
    udf3: Optional[str] = None
    udf4: Optional[str] = None
    udf5: Optional[str] = None


class AddressResponse(BaseModel):
    """Address in response."""
    line1: Optional[str] = None
    line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    zipCode: Optional[str] = None


class PaymentLinkResult(BaseModel):
    """Detailed payment link result from PayU."""
    subAmount: float
    tax: float
    shippingCharge: float
    totalAmount: float
    invoiceNumber: str
    paymentLink: str
    description: str
    active: bool
    isPartialPaymentAllowed: bool
    expiryDate: str
    udf: UDFResponse
    address: AddressResponse
    emailStatus: str
    smsStatus: str
    currency: str
    addedOn: str
    status: str
    maxPaymentsAllowed: int
    customerName: str
    customerPhone: str
    customerEmail: str
    notes: str
    amountCollected: float
    dueAmount: float
    minAmountForCustomer: float
    adjustment: float
    discount: float
    customParams: Optional[Any] = None
    transactionId: Optional[str] = None


class PaymentLinkResponse(BaseModel):
    """Complete response from PayU payment link creation."""
    status: int
    message: str
    result: PaymentLinkResult
    errorCode: Optional[str] = None
    guid: str


class PaymentLinkCreationResponse(BaseModel):
    """
    Simplified response model for frontend/agent consumption.
    Contains only vital information needed by the caller.
    """
    success: bool
    payment_link: str
    invoice_number: str
    total_amount: float
    due_amount: float
    expiry_date: str
    time_left_hours: float
    status: str
    guid: str
    email_status: str
    customer_name: str
    customer_email: str
    customer_phone: str

    @staticmethod
    def from_payu_response(response: PaymentLinkResponse) -> "PaymentLinkCreationResponse":
        """Convert PayU API response to simplified response."""
        result = response.result
        
        # Calculate time left
        expiry = datetime.strptime(result.expiryDate, "%Y-%m-%d %H:%M:%S")
        now = datetime.now()
        time_left = (expiry - now).total_seconds() / 3600  # Convert to hours
        
        return PaymentLinkCreationResponse(
            success=response.status == 0,
            payment_link=result.paymentLink,
            invoice_number=result.invoiceNumber,
            total_amount=result.totalAmount,
            due_amount=result.dueAmount,
            expiry_date=result.expiryDate,
            time_left_hours=round(time_left, 2),
            status=result.status,
            guid=response.guid,
            email_status=result.emailStatus,
            customer_name=result.customerName,
            customer_email=result.customerEmail,
            customer_phone=result.customerPhone
        )


# ============================================================================
# MAIN PAYU MANAGER CLASS
# ============================================================================

class PayUManager:
    """
    Manages PayU OAuth tokens and Payment Link creation for the UAT environment.
    Automatically caches and refreshes OAuth tokens.
    
    Thread-safe implementation with automatic token refresh.
    Reads credentials securely from environment variables via secret.env file.
    """
    
    # UAT Environment URLs
    AUTH_URL = "https://uat-accounts.payu.in/oauth/token"
    API_BASE_URL = "uatoneapi.payu.in"
    
    def __init__(self, scope: str = "create_payment_links read_payment_links update_payment_links"):
        """
        Initialize PayU Manager.
        
        Args:
            scope: OAuth scope for API access
        """
        self.scope = scope
        self.grant_type = "client_credentials"
        
        # Load credentials from environment
        self._load_credentials()
        
        # Token management
        self._access_token: Optional[str] = None
        self._token_expires_at: datetime = datetime.now()
        self._lock = threading.Lock()  # Thread-safe token refresh

    # ------------------------------------------------------------------------
    # CREDENTIAL MANAGEMENT
    # ------------------------------------------------------------------------

    def _load_credentials(self, filename: str = "keys.env") -> None:
        """
        Load PayU credentials from environment file.
        
        Args:
            filename: Name of the environment file
            
        Raises:
            PayUAPIError: If file not found or credentials missing
        """
        try:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            file_path = os.path.join(script_dir, filename)

            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Environment file '{filename}' not found at {file_path}")

            load_dotenv(dotenv_path=file_path)

        except FileNotFoundError as e:
            raise PayUAPIError(str(e))
        except Exception as e:
            raise PayUAPIError(f"Error reading environment file '{filename}': {e}")

        # Load credentials from environment
        self.client_id = os.getenv("PAYU_CLIENT_ID")
        self.client_secret = os.getenv("PAYU_CLIENT_SECRET")
        self.merchant_key = os.getenv("PAYU_KEY")
        self.merchant_salt = os.getenv("PAYU_SALT")
        self.merchant_id = os.getenv("MID")

        # Validate all credentials are present
        if not all([self.client_id, self.client_secret, self.merchant_key, 
                    self.merchant_salt, self.merchant_id]):
            raise PayUAPIError(
                "Missing credentials in secret.env. Required: "
                "PAYU_CLIENT_ID, PAYU_CLIENT_SECRET, PAYU_KEY, PAYU_SALT, MID"
            )

    # ------------------------------------------------------------------------
    # TOKEN MANAGEMENT
    # ------------------------------------------------------------------------

    def _is_token_valid(self) -> bool:
        """
        Check if current token is valid with 60 second buffer.
        
        Returns:
            True if token is valid and not expiring soon
        """
        return (
            self._access_token is not None and 
            self._token_expires_at > (datetime.now() + timedelta(seconds=60))
        )

    def _fetch_new_token(self) -> None:
        """
        Fetch a new OAuth access token from PayU.
        
        Raises:
            PayUAPIError: If token fetch fails
        """
        payload = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'grant_type': self.grant_type,
            'scope': self.scope
        }

        try:
            conn = http.client.HTTPSConnection("uat-accounts.payu.in")
            headers = {'Content-Type': 'application/x-www-form-urlencoded'}
            
            # Convert payload to URL-encoded string
            body = "&".join([f"{k}={v}" for k, v in payload.items()])
            
            conn.request("POST", "/oauth/token", body, headers)
            response = conn.getresponse()
            data = json.loads(response.read().decode("utf-8"))

            if response.status != 200:
                raise PayUAPIError(f"Token fetch failed: {data}")

            if "access_token" not in data or "expires_in" not in data:
                raise PayUAPIError(f"Invalid token response: {data}")

            self._access_token = data['access_token']
            self._token_expires_at = datetime.now() + timedelta(seconds=int(data['expires_in']))
            
            print(f"✓ Successfully fetched new PayU token (expires in {data['expires_in']}s)")

        except Exception as e:
            raise PayUAPIError(f"Error fetching token: {e}")
        finally:
            conn.close()

    def get_token(self) -> str:
        """
        Get a valid access token, refreshing if necessary.
        Thread-safe implementation.
        
        Returns:
            Valid OAuth access token
        """
        if self._is_token_valid():
            return self._access_token

        with self._lock:
            # Double-check after acquiring lock
            if self._is_token_valid():
                return self._access_token
            
            self._fetch_new_token()
            return self._access_token

    # ------------------------------------------------------------------------
    # HASH GENERATION
    # ------------------------------------------------------------------------

    def _generate_hash(self, txnid: str, amount: str, productinfo: str, 
                       firstname: str, email: str) -> str:
        """
        Generate SHA512 hash for PayU transaction.
        
        Args:
            txnid: Transaction ID
            amount: Amount (formatted as string)
            productinfo: Product description
            firstname: Customer first name
            email: Customer email
            
        Returns:
            SHA512 hash string
        """
        # Hash sequence with 12 pipes (including 5 empty UDF fields)
        hash_string = (
            f"{self.merchant_key}|{txnid}|{amount}|{productinfo}|"
            f"{firstname}|{email}|||||||||||{self.merchant_salt}"
        )
        
        return hashlib.sha512(hash_string.encode('utf-8')).hexdigest()

    # ------------------------------------------------------------------------
    # PAYLOAD BUILDING
    # ------------------------------------------------------------------------

    def _build_payment_payload(self, request: PaymentLinkRequest) -> Dict[str, Any]:
        """
        Build PayU API payload from request model.
        
        Args:
            request: Payment link request model
            
        Returns:
            Dictionary payload for PayU API
        """
        return {
            "invoiceNumber": request.invoiceNumber,
            "isAmountFilledByCustomer": request.isAmountFilledByCustomer,
            "subAmount": request.subAmount,
            "minAmountForCustomer": request.minAmountForCustomer,
            "tax": request.tax,
            "shippingCharge": request.shippingCharge,
            "discount": request.discount,
            "adjustment": request.adjustment,
            "description": request.description,
            "source": request.source,
            "currency": request.currency,
            "maxPaymentsAllowed": request.maxPaymentsAllowed,
            "customer": {
                "name": request.customer.name,
                "email": request.customer.email,
                "phone": request.customer.phone,
            },
            "address": {
                "line1": request.address.line1,
                "line2": request.address.line2,
                "city": request.address.city,
                "state": request.address.state,
                "zipCode": request.address.zipCode,
            },
            "udf": {
                "booking_id": request.udf.booking_id,
                "customer_id": request.udf.customer_id,
                "udf3": request.udf.udf3,
                "udf4": request.udf.udf4,
                "udf5": request.udf.udf5,
            },
            "viaEmail": request.viaEmail,
            "viaSms": request.viaSms,
            "notes": request.notes,
            "isActive": request.isActive,
        }

    # ------------------------------------------------------------------------
    # PAYMENT LINK CREATION
    # ------------------------------------------------------------------------

    def create_payment_link(
        self, 
        request: PaymentLinkRequest
    ) -> PaymentLinkCreationResponse:
        """
        Create a payment link via PayU API.
        
        Args:
            request: Payment link request model
            
        Returns:
            Simplified payment link creation response
            
        Raises:
            PayUAPIError: If payment link creation fails
        """
        try:
            token = self.get_token()
            
            # Build payload
            payload = self._build_payment_payload(request)
            payload_json = json.dumps(payload)
            
            # Prepare headers
            headers = {
                'merchantId': self.merchant_id,
                'Content-Type': 'application/json',
                'Authorization': f"Bearer {token}"
            }
            # Make API request
            conn = http.client.HTTPSConnection(self.API_BASE_URL)
            conn.request("POST", "/payment-links/", payload_json, headers)
            response = conn.getresponse()
            data = json.loads(response.read().decode("utf-8"))
            print("DONEE=========")
            # print("data",data)
            conn.close()

            # Parse response
            payu_response = PaymentLinkResponse(**data)
            print(payu_response)
            # print(f"✓ Payment link created successfully: {data}")  
            # Check for success
            if payu_response.status != 0:
                raise PayUAPIError(
                    f"Payment link creation failed: {payu_response.message} "
                    f"(Error Code: {payu_response.errorCode})"
                )

            # Convert to simplified response
            return payu_response
        except PayUAPIError:
            raise
        except Exception as e:
            raise PayUAPIError(f"Unexpected error creating payment link: {e}")

 
# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

# Global instance for use across the application
payu_client: Optional[PayUManager] = None


def get_payu_client() -> PayUManager:
    """
    Get or create PayU client singleton instance.
    
    Returns:
        PayU Manager instance
    """
    global payu_client
    if payu_client is None:
        payu_client = PayUManager()
    return payu_client


# ============================================================================
# EXAMPLE USAGE & TESTING
# ============================================================================

if __name__ == "__main__":
    """Example usage and testing"""
    
    try:
        manager = get_payu_client()
        print("✓ PayU Manager initialized successfully\n")
        
        # Example 2: Detailed payment link with all parameters
        print("--- Creating Detailed Payment Link ---")
        detailed_request = PaymentLinkRequest(
            invoiceNumber=f"INV{uuid.uuid4().hex[:8].upper()}",
            subAmount=1000.00,
            tax=180.00,
            shippingCharge=50.00,
            discount=100.00,
            adjustment=0.00,
            description="Premium service booking",
            minAmountForCustomer=500.00,
            customer=CustomerInfo(
                name="Jane Smith",
                email="jane.smith@example.com",
                phone="9123456789"
            ),
            address=AddressInfo(
                line1="123 Main Street",
                line2="Apartment 4B",
                city="Mumbai",
                state="Maharashtra",
                zipCode="400001"
            ),
            udf=UDFInfo(
                booking_id="BOOK789",
                customer_id="CUST012"
            ),
            viaEmail=True,
            viaSms=False
        )
        
        print(detailed_request.invoiceNumber)
        detailed_response = manager.create_payment_link(detailed_request)
        
        print(f"✓ Payment Link: {detailed_response.payment_link}")
        print(f"  Total: ₹{detailed_response.total_amount}")
        print(f"  Due: ₹{detailed_response.due_amount}")
        print(f"  Email Status: {detailed_response.email_status}\n")
        
    except PayUAPIError as e:
        print(f"✗ PayU Error: {e}")
    except Exception as e:
        print(f"✗ Unexpected Error: {e}")
