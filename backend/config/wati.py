import os
import logging
import requests
from dotenv import load_dotenv
from typing import Dict, List, Any
from datetime import datetime

# Load .env file for local testing
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', 'keys.env'))

# --- WATI Template Configuration ---
# Define your WATI template names and their expected parameters here.
# The 'params' list order MUST match your WhatsApp template variables
# e.g., "Hi {{1}}, your booking for {{2}} is at {{3}}."

TEMPLATES = {
    "booking_confirmation": {
        "name": "booking_confirmation_v2", # The name of your template in WATI
        "params": [
            "customer_name", 
            "theme_name", 
            "booking_date", 
            "booking_time", 
            "participants_summary"
        ] 
    },
    "one_day": {
        "name": "booking_reminder_24h",
        "params": ["customer_name", "theme_name", "booking_time"] 
    },
    "one_hour": {
        "name": "booking_reminder_1h",
        "params": ["customer_name", "theme_name", "booking_time"]
    }
}


class WatiClient:
    """
    A client for sending pre-approved WhatsApp template messages via the WATI API.
    """
    
    def __init__(self):
        self.api_endpoint = os.getenv("WATI_API_ENDPOINT")
        self.api_token = os.getenv("WATI_API_TOKEN")
        self.templates = TEMPLATES
        
        if not self.api_endpoint or not self.api_token:
            logging.critical("WATI_API_ENDPOINT or WATI_API_TOKEN is not set.")
            raise ValueError("WATI environment variables are not set.")

    def _send_template_message(self, phone_number: str, template_name: str, params_list: List[str]) -> bool:
        """
        Private helper function to send a template message.
        
        :param phone_number: The customer's phone number (with country code).
        :param template_name: The exact name of the template in WATI.
        :param params_list: A list of string values to fill template variables (e.g., ["John", "The Tomb", "5:00 PM"]).
        :return: True if the message was sent successfully, False otherwise.
        """
        
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        # Format parameters for WATI's "customParams" structure
        wati_params = []
        for i, param_value in enumerate(params_list):
            wati_params.append({
                "name": f"param{i+1}",
                "value": str(param_value)
            })

        payload = {
            "template_name": template_name,
            "broadcast_name": f"api_broadcast_{template_name}",
            "receivers": [
                {
                    "whatsappNumber": phone_number,
                    "customParams": wati_params
                }
            ]
        }
        
        try:
            logging.info(f"Sending WATI template '{template_name}' to {phone_number}...")
            response = requests.post(self.api_endpoint, headers=headers, json=payload, timeout=15)
            response.raise_for_status() # Raise an exception for HTTP 4xx/5xx errors
            
            logging.info(f"Successfully sent message to {phone_number}. Response: {response.json()}")
            return True
            
        except requests.exceptions.HTTPError as http_err:
            logging.error(f"HTTP error sending to {phone_number}: {http_err} - Response: {response.text}")
        except requests.exceptions.RequestException as req_err:
            logging.error(f"Request error sending to {phone_number}: {req_err}")
        except Exception as e:
            logging.error(f"An unexpected error occurred during WATI API call: {e}")
            
        return False

    def send_booking_confirmation(
        self, 
        phone_number: str, 
        customer_name: str, 
        theme_name: str, 
        start_time: datetime, 
        participants: Dict[str, int]
    ) -> bool:
        """
        Sends the initial booking confirmation message.
        Called by your main app *after* a booking is confirmed.
        """
        template = self.templates['booking_confirmation']
        
        # 1. Format date and time
        booking_date_str = start_time.strftime("%B %d, %Y") # e.g., "November 01, 2025"
        booking_time_str = start_time.strftime("%I:%M %p")   # e.g., "05:30 PM"
        
        # 2. Format participants dictionary
        # (e.g., {'adults': 2, 'children': 1} -> "2 Adults, 1 Child")
        participants_parts = []
        if 'adults' in participants and participants['adults'] > 0:
            participants_parts.append(f"{participants['adults']} Adult{'s' if participants['adults'] > 1 else ''}")
        if 'children' in participants and participants['children'] > 0:
            participants_parts.append(f"{participants['children']} Child{'ren' if participants['children'] > 1 else ''}")
        participants_summary = ", ".join(participants_parts) or "1 Guest"

        # 3. Create the ordered parameter list
        params_map = {
            "customer_name": customer_name,
            "theme_name": theme_name,
            "booking_date": booking_date_str,
            "booking_time": booking_time_str,
            "participants_summary": participants_summary
        }
        
        try:
            params_list = [params_map[param_name] for param_name in template['params']]
        except KeyError as e:
            logging.error(f"Missing parameter {e} for template '{template['name']}'")
            return False

        return self._send_template_message(
            phone_number=phone_number,
            template_name=template['name'],
            params_list=params_list
        )

    def send_one_day_reminder(
        self, 
        phone_number: str, 
        customer_name: str, 
        theme_name: str, 
        start_time: datetime
    ) -> bool:
        """Sends the 1-day reminder. Called by the cron job."""
        template = self.templates['one_day']
        
        # Format time
        booking_time_str = start_time.strftime("%I:%M %p") # e.g., "05:30 PM"
        
        params_map = {
            "customer_name": customer_name,
            "theme_name": theme_name,
            "booking_time": booking_time_str
        }
        
        try:
            params_list = [params_map[param_name] for param_name in template['params']]
        except KeyError as e:
            logging.error(f"Missing parameter {e} for template '{template['name']}'")
            return False

        return self._send_template_message(
            phone_number=phone_number,
            template_name=template['name'],
            params_list=params_list
        )
        
    def send_one_hour_reminder(
        self, 
        phone_number: str, 
        customer_name: str, 
        theme_name: str, 
        start_time: datetime
    ) -> bool:
        """Sends the 1-hour reminder. Called by the cron job."""
        template = self.templates['one_hour']
        
        # Format time
        booking_time_str = start_time.strftime("%I:%M %p") # e.g., "05:30 PM"
        
        params_map = {
            "customer_name": customer_name,
            "theme_name": theme_name,
            "booking_time": booking_time_str
        }

        try:
            params_list = [params_map[param_name] for param_name in template['params']]
        except KeyError as e:
            logging.error(f"Missing parameter {e} for template '{template['name']}'")
            return False

        return self._send_template_message(
            phone_number=phone_number,
            template_name=template['name'],
            params_list=params_list
        )

# --- Create a global instance for your app to import ---
# Just like your 'supabase' client
try:
    wati_client = WatiClient()
except ValueError as e:
    logging.critical(f"Failed to initialize global WatiClient: {e}")
    wati_client = None