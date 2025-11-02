import uuid
import requests
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
import logging
import time
import os
from backend.config.payu_client import get_payu_client, PaymentLinkRequest
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), 'keys.env'))


class BookeoAPI:
    """
    Bookeo API Client using direct HTTP requests

    This class provides methods to:
    1. Get available time slots
    2. Create and retrieve bookings
    3. Create and retrieve customers

    Uses API key and secret key for authentication via headers and as URL params as backup.
    """

    def __init__(self, base_url: str = "https://api.bookeo.com/v2"):
        """
        Initialize the Bookeo API client.

        Args:
            base_url (str): Base URL for Bookeo API (default: https://api.bookeo.com/v2)
        """
        self.api_key = os.environ.get("BOOKEO_API_KEY")
        self.secret_key = os.environ.get("BOOKEO_SECRET_KEY")
        self.base_url = base_url.rstrip('/')

        # Set up logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

        # Create session for connection reuse
        self.session = requests.Session()

        # Set default headers as per Bookeo API documentation
        self.session.headers.update({
            'Content-Type': 'application/json',
            'X-Bookeo-secretKey': self.secret_key,
            'X-Bookeo-apiKey': self.api_key
        })

    def _make_request(self, method: str, endpoint: str, params: Dict = None, data: Dict = None) -> Dict:
        """
        Make HTTP request to Bookeo API with proper error handling.

        Args:
            method (str): HTTP method (GET, POST, PUT, DELETE)
            endpoint (str): API endpoint path
            params (dict): URL parameters
            data (dict): Request body data for POST/PUT

        Returns:
            dict: API response data

        Raises:
            requests.RequestException: If API request fails
        """
        url = f"{self.base_url}{endpoint}"

        # Add credentials to params if not using headers
        if params is None:
            params = {}

        # Always add credentials as URL parameters as backup
        params.update({
            'secretKey': self.secret_key,
            'apiKey': self.api_key
        })

        try:
            self.logger.info(f"Making {method} request to {endpoint}")

            if method.upper() == 'GET':
                response = self.session.get(url, params=params)
            elif method.upper() == 'POST':
                response = self.session.post(url, params=params, json=data)
            elif method.upper() == 'PUT':
                response = self.session.put(url, params=params, json=data)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, params=params)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            # Handle rate limiting (HTTP 429)
            if response.status_code == 429:
                retry_after = int(response.headers.get('Retry-After', 60))
                self.logger.warning(f"Rate limited. Waiting {retry_after} seconds...")
                time.sleep(retry_after)
                # Retry the request once
                if method.upper() == 'GET':
                    response = self.session.get(url, params=params)
                elif method.upper() == 'POST':
                    response = self.session.post(url, params=params, json=data)
                elif method.upper() == 'PUT':
                    response = self.session.put(url, params=params, json=data)
                elif method.upper() == 'DELETE':
                    response = self.session.delete(url, params=params)

            # Raise for HTTP errors
            response.raise_for_status()

            # Parse JSON response
            result = response.json()
            self.logger.info(f"Request successful. Status: {response.status_code}")

            return result

        except requests.RequestException as e:
            self.logger.error(f"API request failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    self.logger.error(f"Error response: {error_data}")
                    if isinstance(error_data, dict) and 'errorId' in error_data:
                        self.logger.error(f"Error ID: {error_data['errorId']}")
                except Exception:
                    self.logger.error(f"Response text: {e.response.text if e.response is not None else ''}")
            raise

    # ==================== ERROR NORMALIZATION ====================

    def _extract_api_error(self, err: Exception, source: str) -> dict:
        """
        Normalize errors from HTTP clients into a router-friendly payload.
        Prefer Bookeo's error JSON: { httpStatus, message, errorId } when present.
        """
        status_code = None
        http_status = None
        message = None
        error_id = None
        response_text = None

        resp = getattr(err, "response", None)
        if resp is not None:
            status_code = getattr(resp, "status_code", None)
            try:
                data = resp.json()
            except Exception:
                data = None
                response_text = getattr(resp, "text", None)

            if isinstance(data, dict):
                message = data.get("message") or data.get("error") or data.get("errors") or json.dumps(data)
                error_id = data.get("errorId")
                http_status = data.get("httpStatus") or status_code
            else:
                message = response_text or str(err)
                http_status = status_code
        else:
            message = str(err)
            http_status = None

        return {
            "success": False,
            "source": source,
            "message": message or "Unexpected error",
            "httpStatus": http_status,
            "errorId": error_id,
            "status": status_code,
        }
    def get_customer_bookings(
    self,
    customer_id: str,
    begin_date: Optional[str] = None,
    end_date: Optional[str] = None,
    expand_participants: bool = False,
    items_per_page: int = 50,
    page_navigation_token: Optional[str] = None,
    page_number: int = 1
    ) -> Dict:
        """
        Retrieve a customer's bookings.

        Args:
            customer_id (str): The customer ID (required)
            begin_date (str, optional): If specified, only bookings on or after this date will be included (format: YYYY-MM-DD)
            end_date (str, optional): If specified, only bookings on or before this date will be included (format: YYYY-MM-DD)
            expand_participants (bool): If true, full details of the participants are included (default: False)
            items_per_page (int): Number of items per page, max 100 (default: 50)
            page_navigation_token (str, optional): Token for page navigation
            page_number (int): Page number (default: 1)

        Returns:
            dict: Customer's bookings data

        Raises:
            requests.RequestException: If API request fails
        """
        try:
            endpoint = f"/customers/{customer_id}/bookings"

            # Build query parameters
            params = {}

            if begin_date:
                params['beginDate'] = begin_date
            if end_date:
                params['endDate'] = end_date
            if expand_participants:
                params['expandParticipants'] = expand_participants
            if items_per_page and items_per_page <= 100:
                params['itemsPerPage'] = items_per_page
            if page_navigation_token:
                params['pageNavigationToken'] = page_navigation_token
            if page_number:
                params['pageNumber'] = page_number

            result = self._make_request('GET', endpoint, params=params)

            self.logger.info(f"Successfully retrieved bookings for customer {customer_id}")
            return {
                "success": True,
                "data": result,
                "source": "get_customer_bookings"
            }

        except Exception as err:
            self.logger.error(f"Failed to retrieve customer bookings: {err}")
            return self._extract_api_error(err, "get_customer_bookings")


    # ==================== AVAILABILITY METHODS ====================

    def get_available_slots(
        self,
        start_time: str,
        end_time: str,
        product_id: str = None,
        people_category_id: str = None,
        number_of_people: int = 1,
        slot_type: str = "fixed",
        lang: str = "en-US"
    ) -> Dict:
        """
        Get available time slots.
        """
        params = {
            'startTime': start_time,
            'endTime': end_time
        }

        if product_id:
            params['productId'] = product_id
        if people_category_id:
            params['peopleCategoryId'] = people_category_id
            params['numberOfPeople'] = number_of_people

        return self._make_request('GET', '/availability/slots', params=params)

    def get_matching_slots(
        self,
        start_time: str,
        end_time: str,
        product_id: str,
        participants: Dict,
        lang: str = "en-US"
    ) -> Dict:
        """
        Get matching slots for specific participants (alternative to get_available_slots).
        """
        params = {
            'startTime': start_time,
            'endTime': end_time,
            'productId': product_id,
            'lang': lang
        }

        # Add participant info to params
        for i, participant in enumerate(participants.get('numbers', [])):
            params[f'peopleCategoryId[{i}]'] = participant['peopleCategoryId']
            params[f'numberOfPeople[{i}]'] = participant['number']

        return self._make_request('GET', '/availability/matchingslots', params=params)

    # ==================== BOOKING METHODS ====================

    def create_booking_hold(
        self,
        event_id: str,
        customer_id: str,
        participants: Dict,
        product_id: str,
        options: List[Dict] = None,
        hold_id: Optional[str] = None,
        lang: str = "en-US"
    ) -> Dict:
        """
        Create a temporary booking hold (recommended before creating actual booking).
        """
        booking_data = {
            "eventId": event_id,
            "customerId": customer_id,
            "participants": participants,
            "productId": product_id
        }

        if options:
            booking_data["options"] = options

        params = {'lang': lang}
        if(hold_id):
            params["previousHoldId"] = hold_id

        return self._make_request('POST', '/holds', params=params, data=booking_data)

    def create_booking(
        self,
        product_id: str=None,
        event_id: str=None,
        customer_id: str=None,
        participants: Dict=None,
        previous_hold_id: str = None,
        options: List[Dict] = None,
        initial_payments: List[Dict] = None,
        notify_users: bool = True,
        notify_customer: bool = True,
        lang: str = "en-US"
    ) -> Dict:
        """
        Create a new booking.
        """

        booking_data = {
            "eventId": event_id,
            "customerId": customer_id,
            "participants": participants,
            "productId": product_id
        }

        if options:
            booking_data["options"] = options
        if initial_payments:
            booking_data["initialPayments"] = initial_payments

        params = {
            'lang': lang,
            'notifyUsers': str(notify_users).lower(),
            'notifyCustomer': str(notify_customer).lower()
        }

        if previous_hold_id:
            params['previousHoldId'] = previous_hold_id
        print(params)
        print("\n\n")
        print(booking_data)
        return self._make_request('POST', '/bookings', params=params, data=booking_data)

    def get_booking(self, booking_id: str, expand: bool = False, lang: str = "en-US") -> Dict:
        """
        Retrieve a specific booking by ID.
        """
        params = {'lang': lang}
        if expand:
            params['expand'] = 'customer,payments'

        return self._make_request('GET', f'/bookings/{booking_id}', params=params)

    def get_bookings(
        self,
        lastUpdatedStartTime: str,
        lastUpdatedEndTime: str,
        start_time: str = None,
        end_time: str = None,
        last_updated: str = None,
        created_time: str = None,
        page_size: int = 50,
        page_number: int = 1,
        page_navigation_token: str = None,
        expand: bool = False,
        lang: str = "en-US"
    ) -> Dict:
        """
        Retrieve multiple bookings with optional filtering.
        """
        params = {'lang': lang}

        # Handle pagination
        if page_navigation_token:
            params['pageNavigationToken'] = page_navigation_token
            params['pageNumber'] = page_number
        else:
            # Initial request parameters
            params['includeCanceled'] = True
            params['lastUpdatedStartTime'] = lastUpdatedStartTime
            params['lastUpdatedEndTime'] = lastUpdatedEndTime
            if start_time:
                params['startTime'] = start_time
            if end_time:
                params['endTime'] = end_time
            if created_time:
                params['createdTime'] = created_time

        if expand:
            params['expand'] = 'customer,payments'

        return self._make_request('GET', '/bookings', params=params)

    def update_booking(self, booking_id: str, booking_data: Dict, lang: str = "en-US") -> Dict:
        """
        Update an existing booking.
        """
        params = {'lang': lang}
        return self._make_request('PUT', f'/bookings/{booking_id}', params=params, data=booking_data)

    def cancel_booking(self, booking_id: str, notify_customer: bool = True, lang: str = "en-US") -> Dict:
        """
        Cancel a booking.
        """
        params = {
            'lang': lang,
            'notifyCustomer': str(notify_customer).lower()
        }

        return self._make_request('DELETE', f'/bookings/{booking_id}', params=params)

    # ==================== CUSTOMER METHODS ====================

    def create_customer(self, customer_data: Dict, lang: str = "en-US") -> Dict:
        """
        Create a new customer.
        """
        params = {'lang': lang}
        return self._make_request('POST', '/customers', params=params, data=customer_data)

    def get_customer(self, customer_id: str, lang: str = "en-US") -> Dict:
        """
        Retrieve a specific customer by ID.
        """
        params = {'lang': lang}
        return self._make_request('GET', f'/customers/{customer_id}', params=params)

    def get_customers(
        self,
        query: str = None,
        page_size: int = 50,
        page_number: int = 1,
        page_navigation_token: str = None,
        lang: str = "en-US"
    ) -> Dict:
        """
        Search and retrieve customers.
        """
        params = {'lang': lang}

        # Handle pagination
        if page_navigation_token:
            params['pageNavigationToken'] = page_navigation_token
            params['pageNumber'] = page_number
        else:
            params['pageSize'] = min(page_size, 100)
            params['pageNumber'] = page_number
            if query:
                params['searchField'] = query

        return self._make_request('GET', '/customers', params=params)

    def update_customer(self, customer_id: str, customer_data: Dict, lang: str = "en-US") -> Dict:
        """
        Update an existing customer.
        """
        params = {'lang': lang}
        return self._make_request('PUT', f'/customers/{customer_id}', params=params, data=customer_data)
    


    # ==================== SETTINGS & UTILITY METHODS ====================

    def get_products(self, lang: str = "en-US") -> Dict:
        """
        Get list of available products/services.
        """
        params = {'lang': lang}
        return self._make_request('GET', '/settings/products', params=params)

    def get_people_categories(self, lang: str = "en-US") -> Dict:
        """
        Get available people categories (adults, children, etc.).
        """
        params = {'lang': lang}
        return self._make_request('GET', '/settings/peoplecategories', params=params)

    def get_languages(self) -> Dict:
        """
        Get supported languages for the account.
        """
        return self._make_request('GET', '/settings/languages')

    def get_subaccounts(self, lang: str = "en-US") -> Dict:
        """
        Get sub-accounts (if any).
        """
        params = {'lang': lang}
        return self._make_request('GET', '/subaccounts', params=params)

    # ==================== HELPER METHODS ====================

    def format_datetime(self, dt: datetime, use_account_timezone: bool = False) -> str:
        """
        Format datetime object to Bookeo API ISO format.
        """
        return dt.strftime('%Y-%m-%dT%H:%M:%S-00:00')

    def get_today_availability(self, product_id: str = None, days_ahead: int = 7) -> Dict:
        """
        Convenience method to get available slots from today for specified days ahead.
        """
        start_time = datetime.now()
        end_time = start_time + timedelta(days=days_ahead)

        return self.get_available_slots(
            start_time=self.format_datetime(start_time),
            end_time=self.format_datetime(end_time),
            product_id=product_id
        )

    def get_all_bookings_paginated(self, **kwargs) -> List[Dict]:
        """
        Get all bookings across multiple pages.
        """
        all_bookings = []
        page_number = 1
        page_navigation_token = None

        while True:
            response = self.get_bookings(
                page_number=page_number,
                page_navigation_token=page_navigation_token,
                **kwargs
            )

            # Add bookings from this page
            bookings = response.get('data', [])
            all_bookings.extend(bookings)

            # Check pagination info
            info = response.get('info', {})
            total_pages = info.get('totalPages', 1)
            current_page = info.get('currentPage', 1)
            page_navigation_token = info.get('pageNavigationToken')

            # Break if we're on the last page or no more pages
            if current_page >= total_pages or not page_navigation_token:
                break

            page_number += 1

        return all_bookings

    def create_booking_hold_and_payment_link(
        self,
        event_id: str,
        customer_id: str,
        participants: Dict,
        product_id: str,
        hold_id: Optional[str] = None,
        options: Optional[List[Dict]] = None,
        lang: str = "en-US",
        payment_link_request: Optional[PaymentLinkRequest] = None
    ) -> Dict:
        """
        Create a booking hold and a payment link.
        Returns a normalized success/error payload suitable for router responses.
        """
        if payment_link_request is None:
            return {    
                "success": False,
                "source": "payu",
                "message": "Missing payment_link_request",
                "httpStatus": 400,
            }
        print(payment_link_request)
        # 1) Create hold in Bookeo
        try:
            hold = self.create_booking_hold(
                event_id=event_id,
                customer_id=customer_id,
                participants=participants,
                product_id=product_id,
                options=options,
                lang=lang,
                hold_id=hold_id
            )
        except requests.HTTPError as e:
            # Bookeo returns JSON error with httpStatus/message/errorId
            return self._extract_api_error(e, source="bookeo")
        except Exception as e:
            return {
                "success": False,
                "source": "bookeo",
                "message": str(e),
            }
        # print("Hold created:", hold)
        # Validate minimal hold payload
        hold_id = hold.get("id")
        if not hold_id:
            return {
                "success": False,
                "source": "bookeo",
                "message": "Hold created without an id; unexpected response shape",
            }
        # 2) Create PayU payment link
        try:
            payu_client = get_payu_client()
            # print(hold.get("totalPayable")["amount"])
            payment_link_request.subAmount=float(hold.get("totalPayable")["amount"])
            if(payment_link_request.description==""):
                payment_link_request.description=f"Payment for booking hold {hold_id}"
            # if(payment_link_request.invoiceNumber==""):
            payment_link_request.invoiceNumber=f"INV{uuid.uuid4().hex[:8].upper()}" 
            
            # Udfs
            payment_link_request.udf.booking_id=hold_id
            payment_link_request.udf.customer_id=customer_id
            payment_link_request.udf.event_id=event_id
            payment_link_request.udf.product_id=product_id
            payment_link_request.udf.participants=json.dumps(participants)

            payment_link_request.minAmountForCustomer=float(hold.get("totalPayable")["amount"])/2
            print(payment_link_request)
            payment_link_response = payu_client.create_payment_link(payment_link_request)
            print(payment_link_response)
        except Exception as e:
            # Preserve hold info for caller decision (keep or release hold)
            return {
                "invoice_id": payment_link_request.invoiceNumber,
                "success": False,
                "source": "payu",
                "message": str(e),
                "hold": {
                    "id": hold_id,
                    "expiration": hold.get("expiration"),
                },
            }

        # # Normalize PayU result shape
        # print("Payment link result:", payment_link_result ,"\n", type(payment_link_result.))
        # print("\n\n\n")
        if not payment_link_response or payment_link_response.status!=0:
            return {
                "success": False,
                "source": "payu",
                "message": payment_link_response.get("error") if payment_link_response else "Payment link creation failed",
                "hold": {
                    "id": hold_id,
                    "expiration": hold.get("expiration"),
                },
            }

        # Success response: return key hold fields and the payment link
        payment_link_result = payment_link_response.result
        return {
            "success": True,
            "hold": {
                "id": hold_id,
                "expiration": hold.get("expiration"),
                "price": hold.get("price"),
            },
            "payment_link": payment_link_result.paymentLink,
            "invoice_id": payment_link_result.invoiceNumber,
            "expiry_date": payment_link_result.expiryDate,
            "min_amount_for_customer": payment_link_result.minAmountForCustomer,
            "discount_amount": payment_link_result.discount,
            "max_payments_allowed": payment_link_result.maxPaymentsAllowed,

            }
    def create_booking_after_payment_from_payu(
        self,
        payu_payload: Dict,
        lang: str = "en-US",
    ) -> Dict:
        """
        Map a PayU transaction payload to Bookeo's POST /bookings/{bookingNumber}/payments
        and submit it with robust validation, logging, and error normalization.
        """
        try:
            # -------- Validate booking reference --------
            # print(payu_payload,type(payu_payload),payu_payload.get("udf1") ,sep="\n",end="\n\n")
            
            booking_hold_number = (payu_payload.get("udf1") or "").strip()
            booking_customer_id = (payu_payload.get("udf2") or "").strip()
            booking_event_id = (payu_payload.get("udf3") or "").strip()
            booking_product_id = (payu_payload.get("udf4") or "").strip()
            booking_participants = json.loads(payu_payload.get("udf5") or "[]")

            print("Booking details from UDFs:", booking_hold_number, booking_event_id, booking_customer_id, booking_participants, booking_product_id, sep="\n", end="\n")

            
            
            if not booking_hold_number:
                self.logger.error("Missing booking number (udf1) in PayU payload")
                return {
                    "success": False,
                    "source": "payu",
                    "message": "Missing booking number (udf1) in PayU payload",
                    "httpStatus": 400,
                }

            # -------- Validate transaction status --------
            status = (payu_payload.get("status") or "").lower()
            unmapped = (payu_payload.get("unmappedstatus") or "").lower()
            if not (status == "success" or unmapped == "captured"):
                self.logger.warning(f"PayU transaction not successful/captured: status={status}, unmapped={unmapped}")
                return {
                    "success": False,
                    "source": "payu",
                    "message": "PayU transaction is not successful/captured",
                    "httpStatus": 400,
                }

            # -------- Parse received time --------
            addedon = payu_payload.get("addedon")
            if not addedon:
                self.logger.error("Missing 'addedon' in PayU payload")
                return {
                    "success": False,
                    "source": "payu",
                    "message": "Missing 'addedon' in PayU payload",
                    "httpStatus": 400,
                }
            try:
                dt = datetime.strptime(addedon, "%Y-%m-%d %H:%M:%S")
            except Exception:
                # Fallback for ISO-like strings
                try:
                    dt = datetime.fromisoformat(addedon.replace("Z", "+00:00"))
                except Exception as e:
                    self.logger.error(f"Invalid 'addedon' datetime format: {addedon} ({e})")
                    return {
                        "success": False,
                        "source": "payu",
                        "message": f"Invalid 'addedon' datetime format: {addedon}",
                        "httpStatus": 400,
                    }
            received_time_str = self.format_datetime(dt)

            # -------- Amount and currency --------
            from decimal import Decimal, ROUND_HALF_UP
            raw_amount = payu_payload.get("amount") or payu_payload.get("net_amount_debit")
            if raw_amount is None:
                self.logger.error("Missing 'amount' in PayU payload")
                return {
                    "success": False,
                    "source": "payu",
                    "message": "Missing 'amount' in PayU payload",
                    "httpStatus": 400,
                }
            try:
                amount_str = f"{Decimal(str(raw_amount)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)}"
            except Exception as e:
                self.logger.warning(f"Amount quantize failed, using raw string: {raw_amount} ({e})")
                amount_str = str(raw_amount)

            currency = (payu_payload.get("currency") or "INR").upper()
            if len(currency) != 3:
                self.logger.warning(f"Invalid currency '{currency}', defaulting to INR")
                currency = "INR"

            # -------- Reason --------
            reason = (payu_payload.get("productinfo") or "").strip() or "Online payment"

            # -------- Map payment method --------
            mode = (payu_payload.get("mode") or "").upper()
            payment_method = "other"
            payment_method_other = None
            if mode in ("CREDITCARD", "CC"):
                payment_method = "creditCard"
            elif mode in ("DEBITCARD", "DC"):
                payment_method = "debitCard"
            elif mode in ("NB", "NETBANKING", "BANKTRANSFER"):
                payment_method = "bankTransfer"
            elif mode == "PAYPAL":
                payment_method = "paypal"
            elif mode == "CASH":
                payment_method = "cash"
            elif mode in ("CHEQUE", "CHECQUE", "CHECK"):
                payment_method = "checque"  # Bookeo enum spelling
            elif mode in ("UPI", "GPAY", "PHONEPE", "PAYTM", "BHIM"):
                payment_method = "other"
                payment_method_other = "UPI"
            else:
                payment_method = "other"
                payment_method_other = mode or "Other"

            # -------- Comment (compact, informative) --------
            comment_parts = [
                f"mihpayid={payu_payload.get('mihpayid')}",
                f"txnid={payu_payload.get('txnid')}",
                f"bank_ref={payu_payload.get('bank_ref_num') or payu_payload.get('bank_ref_no')}",
                f"pg={payu_payload.get('PG_TYPE')}",
                f"mode={payu_payload.get('mode')}",
                f"status={payu_payload.get('status')}",
            ]
            comment = "PayU: " + " ".join([p for p in comment_parts if p and not p.endswith("=None")])
            # Optional: trim overly long comments to keep within API/UI limits
            if len(comment) > 500:
                comment = comment[:500]

            payload = {
                "receivedTime": received_time_str,
                "reason": reason,
                "comment": comment,
                "amount": {"amount": amount_str, "currency": currency},
                "paymentMethod": payment_method,
            }
            if payment_method == "other":
                payload["paymentMethodOther"] = payment_method_other or "Other"


            self.logger.info(
                f"Submitting payment to Bookeo for booking {booking_hold_number}: "
                f"amount={amount_str} {currency}, method={payment_method}"
                + (f" ({payment_method_other})" if payment_method == "other" else "")
            )

            # -------- Submit to Bookeo Finalize booking --------
            try:
                self.create_booking(product_id=booking_product_id,event_id=booking_event_id, customer_id=booking_customer_id, participants=booking_participants, previous_hold_id=booking_hold_number, initial_payments=[payload])
            except Exception as e:
                self.logger.error(f"Bookeo error while recording payment for {booking_hold_number}: {e}")
                return self._extract_api_error(e, source="bookeo")
            
            # try:
            #     resp = self._make_request(
            #         "POST",
            #         f"/bookings/{booking_hold_number}/payments",
            #         params=params,
            #         data=payload,
            #     )
            #     self.logger.info(f"Bookeo payment recorded for booking {booking_hold_number}")
            #     return resp
            # except requests.HTTPError as e:
            #     self.logger.error(f"Bookeo HTTP error while recording payment for {booking_hold_number}: {e}")
            #     return self._extract_api_error(e, source="bookeo")

        except Exception as e:
            # Catch-all for unexpected mapping/validation errors
            self.logger.exception(f"Unexpected error while mapping PayU payload to Bookeo payment: {e}")
            return {
                "success": False,
                "source": "internal",
                "message": str(e),
                "httpStatus": 500,
            }


# ==================== HELPER FUNCTIONS ====================

def create_customer_data(
    first_name: str,
    last_name: str,
    email: str,
    phone: str = None
) -> Dict:
    """
    Helper function to create customer data structure.
    """
    customer_data = {
        "firstName": first_name,
        "lastName": last_name,
        "emailAddress": email
    }
    if phone:
        customer_data["phoneNumbers"] = [{"number": phone, "type": "mobile"}]
    return customer_data


def create_participants_data(
    adults: int = 1,
    children: int = 0,
    adult_category_id: str = "Cadults",
    child_category_id: str = "Cchildren"
) -> Dict:
    """
    Helper function to create participants data structure.
    """
    participants = {"numbers": []}
    if adults > 0:
        participants["numbers"].append({
            "peopleCategoryId": adult_category_id,
            "number": adults
        })
    if children > 0:
        participants["numbers"].append({
            "peopleCategoryId": child_category_id,
            "number": children
        })
    return participants


def create_payment_data(
    amount: str,
    currency: str = "INR",
    reason: str = "Initial payment",
    comment: str = "",
    payment_method: str = "UPI"
) -> Dict:
    """
    Helper function to create payment data structure.
    """
    return {
        "reason": reason,
        "comment": comment,
        "amount": {
            "amount": amount,
            "currency": currency
        },
        "paymentMethod": payment_method
    }


if __name__ == "__main__":
    """
    End-to-end test:
      1) Discover a product and an event (slot) for next 7 days
      2) Ensure a customer (create if not found)
      3) Create participants
      4) Create a hold in Bookeo
      5) Create a PayU payment link (email+sms enabled)
    """
    import traceback
    from payu_client import CustomerInfo

    # Basic test inputs (adjust as needed)
    TEST_FIRST_NAME = "Vianshu"
    TEST_LAST_NAME = "Shalyan"
    TEST_EMAIL = "vianshsln@gmail.com"
    TEST_PHONE = "9650848213"

    # Instantiate Bookeo client (env must have BOOKEO_API_KEY, BOOKEO_SECRET_KEY)
    api = BookeoAPI()

    # try:
    print("=== Step 1: Discover a product ===")
    products = api.get_products()
    # Try common shapes
    product_list = []
    if isinstance(products, dict):
        # Some APIs return under "data" or at top-level "products"
        product_list = products.get("data") or products.get("products") or []
    elif isinstance(products, list):
        product_list = products
    if not product_list:
        raise RuntimeError(f"No products found; response shape={type(products)}")
    # Heuristic to pick first product id
    def extract_product_id(p):
        return p.get("id") or p.get("productId") or p.get("code") or p.get("key")
    product_id = None
    for p in product_list:
        pid = extract_product_id(p) if isinstance(p, dict) else None
        if pid:
            product_id = pid
            break
    if not product_id:
        raise RuntimeError("Could not extract product id from products response")
    print(f"Chosen product_id={product_id}")

    print("\n=== Step 2: Discover an event (slot) in next 7 days ===")
    start = datetime.now()
    end = start + timedelta(days=7)
    slots = api.get_available_slots(
        start_time=api.format_datetime(start),
        end_time=api.format_datetime(end),
        product_id=product_id,
    )
    # Try to extract first slot's event id
    slot_items = []
    if isinstance(slots, dict):
        # Common shapes: {"slots": [...]}, {"data": [...]}
        slot_items = slots.get("slots") or slots.get("data") or []
    elif isinstance(slots, list):
        slot_items = slots
    if not slot_items:
        raise RuntimeError(f"No slots found for product {product_id}; response shape={type(slots)}")
    def extract_event_id(slot):
        # Handle various shapes: eventId, event.id, or id
        if not isinstance(slot, dict):
            return None
        return (
            slot.get("eventId")
            or (slot.get("event") or {}).get("id")
            or slot.get("id")
        )
    event_id = None
    for s in slot_items[1:]:
        eid = extract_event_id(s)
        if eid:
            event_id = eid
            break
    if not event_id:
        raise RuntimeError("Could not extract event id from availability")
    print(f"Chosen event_id={event_id}")
    print("\n=== Step 3: Ensure a customer ===")
    # Try to find existing customer by email; fall back to createf
    # cust_search = api.get_customers(query=TEST_EMAIL)
    cust_id = "4256137EUML19A1C09D5A6"
    # if isinstance(cust_search, dict):
    #     # Common shapes: {"data": [...]}
    #     candidates = cust_search.get("data") or []
    #     for c in candidates:
    #         # Typical fields: id, emailAddress
    #         if isinstance(c, dict) and (c.get("emailAddress") == TEST_EMAIL or c.get("email") == TEST_EMAIL):
    #             cust_id = c.get("id") or c.get("customerId")
    #             if cust_id:
    #                 break
    
    # if not cust_id:
    #     print("Customer not found, creating...")
    #     new_cust_payload = create_customer_data(TEST_FIRST_NAME, TEST_LAST_NAME, TEST_EMAIL, TEST_PHONE)
    #     created = api.create_customer(new_cust_payload)
    #     if not isinstance(created, dict):
    #         raise RuntimeError(f"Unexpected create_customer response: {type(created)}")
    #     cust_id = created.get("id") or created.get("customerId")
    #     if not cust_id:
    #         raise RuntimeError(f"Could not extract customer id from create response: {created}")
    print(f"Created customer_id={cust_id}")
    # else:
    #     print(f"Found existing customer_id={cust_id}")
    print("\n=== Step 4: Build participants ===")
    participants = create_participants_data(adults=3, children=0)
    print(f"Participants payload: {participants}")
    print("\n=== Step 5: Build PayU PaymentLinkRequest ===")
    # Set tax/shipping/discount/adjustment to 0 so totalAmount == subAmount after Bookeo hold overwrites subAmount
    pl_request = PaymentLinkRequest(
        invoiceNumber=f"INV{uuid.uuid4().hex[:8].upper()}",
        description="Booking Payment for Event",
        subAmount=5.0,  # placeholder; will be overwritten from hold.totalPayable.amount
        tax=1.0,
        shippingCharge=1.0,
        discount=1.0,
        adjustment=1.0,
            minAmountForCustomer=1.0,  # will be set to 50% of hold by Bookeo wrapper
            customer=CustomerInfo(
                name=f"{TEST_FIRST_NAME} {TEST_LAST_NAME}",
                email=TEST_EMAIL,
                phone=TEST_PHONE,
        )
    )
    
    print(pl_request)

    print("\n=== Step 6: Create hold and payment link ===")
    result = api.create_booking_hold_and_payment_link(
        event_id=event_id,
        customer_id=cust_id,
        participants=participants,
        product_id=product_id,
        payment_link_request=pl_request,
    )
    print("\n--- RESULT ---")
    print(json.dumps(result, indent=2, default=str))
    if result.get("success"):
        print(f"\nPayment Link: {result.get('payment_link')}")
        print(f"Invoice: {result.get('invoice_id')}")
        print(f"Expires: {result.get('expiry_date')}")
    else:
        print("\nFlow failed.")


