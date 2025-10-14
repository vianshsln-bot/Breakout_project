
import requests
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
import logging
import time
import os

# from dotenv import load_dotenv
# load_dotenv("backend/config/keys.env")


class BookeoAPI:
    """
    Bookeo API Client using direct HTTP requests

    This class provides methods to:
    1. Get available time slots
    2. Create and retrieve bookings  
    3. Create and retrieve customers

    Uses your existing API key and secret key for authentication.
    """

    def __init__(self, base_url: str = "https://api.bookeo.com/v2"):
        """
        Initialize the Bookeo API client.

        Args:
            api_key (str): Your API key from Bookeo business account authorization
            secret_key (str): Your secret key from developer account registration
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
                    if 'errorId' in error_data:
                        self.logger.error(f"Error ID: {error_data['errorId']}")
                except:
                    self.logger.error(f"Response text: {e.response.text}")
            raise

    # ==================== AVAILABILITY METHODS ====================

    def get_available_slots(self, 
                          start_time: str, 
                          end_time: str,
                          product_id: str = None,
                          people_category_id: str = None,
                          number_of_people: int = 1,
                          slot_type: str = "fixed",
                          lang: str = "en-US") -> Dict:
        """
        Get available time slots.

        Args:
            start_time (str): Start time in ISO format (e.g., "2025-10-15T00:00:00Z")
            end_time (str): End time in ISO format
            product_id (str): Optional product ID filter
            people_category_id (str): Category ID for people (e.g., "Cadults", "Cchildren")  
            number_of_people (int): Number of people to book for
            slot_type (str): Type of slot ("fixed" or "flexible")
            lang (str): Language code (default: "en-US")

        Returns:
            dict: Available slots data
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

    def get_matching_slots(self, 
                          start_time: str, 
                          end_time: str,
                          product_id: str,
                          participants: Dict,
                          lang: str = "en-US") -> Dict:
        """
        Get matching slots for specific participants (alternative to get_available_slots).

        Args:
            start_time (str): Start time in ISO format
            end_time (str): End time in ISO format  
            product_id (str): Product ID
            participants (dict): Participant details with numbers array
            lang (str): Language code

        Returns:
            dict: Matching slots data
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

    def create_booking_hold(self, 
                           event_id: str,
                           customer_id: str,
                           participants: Dict,
                           product_id: str,
                           options: List[Dict] = None,
                           lang: str = "en-US") -> Dict:
        """
        Create a temporary booking hold (recommended before creating actual booking).

        Args:
            event_id (str): Event ID from available slots
            customer_data (dict): Customer information
            participants (dict): Participant details
            product_id (str): Product ID
            options (list): Additional booking options
            lang (str): Language code

        Returns:
            dict: Hold data with hold ID and price information
        """
        booking_data = {
            "eventId": event_id,
            "customerId": customer_id,
            "participants": participants,
            "productId": product_id
        }

        params = {'lang': lang}

        return self._make_request('POST', '/holds', params=params, data=booking_data)

    def create_booking(self, 
                      event_id: str,
                      customer_id: str,
                      participants: Dict,
                      product_id: str,
                      previous_hold_id: str = None,
                      options: List[Dict] = None,
                      initial_payments: List[Dict] = None,
                      notify_users: bool = True,
                      notify_customer: bool = True,
                      lang: str = "en-US") -> Dict:
        """
        Create a new booking.

        Args:
            event_id (str): Event ID from available slots
            customer_data (dict): Customer information
            participants (dict): Participant details
            product_id (str): Product ID
            previous_hold_id (str): Optional hold ID to convert to booking
            options (list): Additional booking options
            initial_payments (list): Payment information
            notify_users (bool): Whether to notify business users
            notify_customer (bool): Whether to notify customer
            lang (str): Language code

        Returns:
            dict: Created booking data
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

        return self._make_request('POST', '/bookings', params=params, data=booking_data)

    def get_booking(self, booking_id: str, expand: bool = False, lang: str = "en-US") -> Dict:
        """
        Retrieve a specific booking by ID.

        Args:
            booking_id (str): Booking ID
            expand (bool): Whether to include expanded data (customer, payments)
            lang (str): Language code

        Returns:
            dict: Booking data
        """
        params = {'lang': lang}
        if expand:
            params['expand'] = 'customer,payments'

        return self._make_request('GET', f'/bookings/{booking_id}', params=params)

    def get_bookings(self, 
                    start_time: str = None,
                    end_time: str = None,
                    last_updated: str = None,
                    created_time: str = None,
                    page_size: int = 50,
                    page_number: int = 1,
                    page_navigation_token: str = None,
                    expand: bool = False,
                    lang: str = "en-US") -> Dict:
        """
        Retrieve multiple bookings with optional filtering.

        Args:
            start_time (str): Filter by start time (ISO format)
            end_time (str): Filter by end time (ISO format)
            last_updated (str): Filter by last updated time (ISO format)
            created_time (str): Filter by creation time (ISO format)
            page_size (int): Number of results per page (max 100)
            page_number (int): Page number
            page_navigation_token (str): Token for pagination
            expand (bool): Whether to include expanded data
            lang (str): Language code

        Returns:
            dict: List of bookings with pagination info
        """
        params = {'lang': lang}

        # Handle pagination
        if page_navigation_token:
            params['pageNavigationToken'] = page_navigation_token
            params['pageNumber'] = page_number
        else:
            # Initial request parameters
            params['pageSize'] = min(page_size, 100)  # Bookeo limits to 100
            params['pageNumber'] = page_number

            if start_time:
                params['startTime'] = start_time
            if end_time:
                params['endTime'] = end_time
            if last_updated:
                params['lastUpdated'] = last_updated
            if created_time:
                params['createdTime'] = created_time

        if expand:
            params['expand'] = 'customer,payments'

        return self._make_request('GET', '/bookings', params=params)

    def update_booking(self, booking_id: str, booking_data: Dict, lang: str = "en-US") -> Dict:
        """
        Update an existing booking.

        Args:
            booking_id (str): Booking ID to update
            booking_data (dict): Updated booking data
            lang (str): Language code

        Returns:
            dict: Updated booking data
        """
        params = {'lang': lang}
        return self._make_request('PUT', f'/bookings/{booking_id}', params=params, data=booking_data)

    def cancel_booking(self, booking_id: str, notify_customer: bool = True, lang: str = "en-US") -> Dict:
        """
        Cancel a booking.

        Args:
            booking_id (str): Booking ID to cancel
            notify_customer (bool): Whether to notify customer
            lang (str): Language code

        Returns:
            dict: Cancellation response
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

        Args:
            customer_data (dict): Customer information
            lang (str): Language code

        Returns:
            dict: Created customer data
        """
        params = {'lang': lang}
        return self._make_request('POST', '/customers', params=params, data=customer_data)

    def get_customer(self, customer_id: str, lang: str = "en-US") -> Dict:
        """
        Retrieve a specific customer by ID.

        Args:
            customer_id (str): Customer ID
            lang (str): Language code

        Returns:
            dict: Customer data
        """
        params = {'lang': lang}
        return self._make_request('GET', f'/customers/{customer_id}', params=params)

    def get_customers(self, 
                     query: str = None,
                     page_size: int = 50,
                     page_number: int = 1,
                     page_navigation_token: str = None,
                     lang: str = "en-US") -> Dict:
        """
        Search and retrieve customers.

        Args:
            query (str): Search query (name, email, etc.)
            page_size (int): Number of results per page (max 100)
            page_number (int): Page number
            page_navigation_token (str): Token for pagination
            lang (str): Language code

        Returns:
            dict: List of customers with pagination info
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

        Args:
            customer_id (str): Customer ID to update
            customer_data (dict): Updated customer data
            lang (str): Language code

        Returns:
            dict: Updated customer data
        """
        params = {'lang': lang}
        return self._make_request('PUT', f'/customers/{customer_id}', params=params, data=customer_data)

    # ==================== SETTINGS & UTILITY METHODS ====================

    def get_products(self, lang: str = "en-US") -> Dict:
        """
        Get list of available products/services.

        Args:
            lang (str): Language code

        Returns:
            dict: List of products
        """
        params = {'lang': lang}
        return self._make_request('GET', '/settings/products', params=params)

    def get_people_categories(self, lang: str = "en-US") -> Dict:
        """
        Get available people categories (adults, children, etc.).

        Args:
            lang (str): Language code

        Returns:
            dict: List of people categories
        """
        params = {'lang': lang}
        return self._make_request('GET', '/settings/peoplecategories', params=params)

    def get_languages(self) -> Dict:
        """
        Get supported languages for the account.

        Returns:
            dict: List of supported languages
        """
        return self._make_request('GET', '/settings/languages')

    def get_subaccounts(self, lang: str = "en-US") -> Dict:
        """
        Get sub-accounts (if any).

        Args:
            lang (str): Language code

        Returns:
            dict: List of sub-accounts
        """
        params = {'lang': lang}
        return self._make_request('GET', '/subaccounts', params=params)

    # ==================== HELPER METHODS ====================

    def format_datetime(self, dt: datetime, use_account_timezone: bool = False) -> str:
        """
        Format datetime object to Bookeo API ISO format.

        Args:
            dt (datetime): Datetime object
            use_account_timezone (bool): Use account timezone instead of UTC

        Returns:
            str: ISO formatted datetime string
        """
        return dt.strftime('%Y-%m-%dT%H:%M:%S-00:00')
        # if use_account_timezone:
        #     # Use special offset to indicate account's local timezone
        # else:
        #     return dt.isoformat()

    def get_today_availability(self, product_id: str = None, days_ahead: int = 7) -> Dict:
        """
        Convenience method to get available slots from today for specified days ahead.

        Args:
            product_id (str): Optional product ID filter
            days_ahead (int): Number of days to look ahead

        Returns:
            dict: Available slots
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

        Args:
            **kwargs: Arguments to pass to get_bookings()

        Returns:
            list: All bookings from all pages
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

# ==================== HELPER FUNCTIONS ====================

def create_customer_data(first_name: str, 
                        last_name: str, 
                        email: str,
                        phone: str = None) -> Dict:
    """
    Helper function to create customer data structure.

    Args:
        first_name (str): Customer's first name
        last_name (str): Customer's last name
        email (str): Customer's email address
        phone (str): Customer's phone number
        custom_fields (list): List of custom field dictionaries
        language (str): Customer's preferred language

    Returns:
        dict: Formatted customer data
    """
    customer_data = {
        "firstName": first_name,
        "lastName": last_name,
        "emailAddress": email
    }

    if phone:
        customer_data["phoneNumbers"] = [{"number": phone, "type": "mobile"}]

    return customer_data

def create_participants_data(adults: int = 1, 
                           children: int = 0,
                           adult_category_id: str = "Cadults",
                           child_category_id: str = "Cchildren") -> Dict:
    """
    Helper function to create participants data structure.

    Args:
        adults (int): Number of adults
        children (int): Number of children
        adult_category_id (str): Adult category ID
        child_category_id (str): Child category ID

    Returns:
        dict: Formatted participants data
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

def create_payment_data(amount: str, 
                       currency: str = "INR",
                       reason: str = "Initial payment",
                       comment: str = "",
                       payment_method: str = "UPI") -> Dict:
    """
    Helper function to create payment data structure.

    Args:
        amount (str): Payment amount as string
        currency (str): Currency code
        reason (str): Payment reason
        comment (str): Payment comment
        payment_method (str): Payment method

    Returns:
        dict: Formatted payment data
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
