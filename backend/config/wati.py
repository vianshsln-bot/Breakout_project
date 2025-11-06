import os
import re
import logging
import requests
from dotenv import load_dotenv
from typing import Dict, List, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), 'keys.env'))

# --- Template configuration ---
# Define reusable templates with the exact parameter order your template expects.
# For reminders, reuse one generic template by changing params (e.g., "tomorrow" vs "in 1 hour").
TEMPLATES = {
    "reminder_generic": {
        "name": "reminder_generic",  # must match approved template name exactly
        "params": [
            # example order for a generic reminder template:
            # 1: timing_phrase ("tomorrow", "in 1 hour"), 2: customer_name, 3: theme_name,
            # 4: booking_date, 5: booking_time, 6: participants_summary (optional)
            "timing_phrase",
            "customer_name",
            "theme_name",
            "booking_date",
            "booking_time",
            "participants_summary",
        ],
    },
    "booking_confirmation": {
        "name": "booking_confirmation_v2",  # must match approved template name exactly
        "params": [
            # example order for a booking confirmation template:
            # 1: customer_name, 2: theme_name, 3: booking_date, 4: booking_time, 5: participants_summary
            "customer_name",
            "theme_name",
            "booking_date",
            "booking_time",
            "participants_summary",
        ],
    },
}


def _safe_phone(p: str) -> str:
    """
    Minimal normalization for WhatsApp-style numbers:
    - keep one leading '+' if present
    - remove other non-digits
    """
    if not isinstance(p, str):
        return ""
    p = p.strip()
    if p.startswith("+"):
        return "+" + re.sub(r"\D", "", p[1:])
    return re.sub(r"\D", "", p)


def _extract_api_base(full_endpoint: str) -> Optional[str]:
    if not full_endpoint or "/api/" not in full_endpoint:
        return None
    return full_endpoint.split("/api/")[0]


class WatiClient:
    """
    Client for WATI v1 template sends (bulk-style) and template listing.
    """

    def __init__(self):
        # Configure to v1 bulk send endpoint
        # e.g., https://<tenant>.wati.io/api/v1/sendTemplateMessages
        self.send_endpoint = os.getenv("WATI_API_ENDPOINT")
        self.api_token = os.getenv("WATI_API_TOKEN")
        # print(self.api_token,self.send_endpoint)
        if not self.send_endpoint or not self.api_token:
            logger.critical("WATI_API_ENDPOINT or WATI_API_TOKEN is not set.")
            raise ValueError("WATI environment variables are not set.")

        self.api_base = _extract_api_base(self.send_endpoint)
        # Default list endpoint for templates
        self.templates_endpoint = os.getenv("WATI_TEMPLATES_ENDPOINT") or (
            f"{self.api_base}/api/v1/getMessageTemplates" if self.api_base else None
        )
        if not self.templates_endpoint:
            logger.warning("WATI_TEMPLATES_ENDPOINT is not configured and could not be inferred.")

        self._session = requests.Session()
        self._session.headers.update(
            {
                "Authorization": self.api_token,
                "Content-Type": "application/json",
            }
        )
        self.templates = TEMPLATES

    @staticmethod
    def _build_custom_params(params_list: List[str]) -> List[Dict[str, str]]:
        return [{"name": f"param{i+1}", "value": str(v)} for i, v in enumerate(params_list)]

    def _send_template_message(
        self,
        phone_number: str,
        template_name: str,
        params_list: List[str],
        broadcast_name: Optional[str] = None,
        timeout_sec: int = 20,
    ) -> bool:
        phone = _safe_phone(phone_number)
        if not phone:
            logger.error("Invalid phone number for WATI send.")
            return False
        if not template_name:
            logger.error("Template name is required for WATI send.")
            return False

        payload = {
            "template_name": template_name,
            "broadcast_name": broadcast_name or f"api_broadcast_{template_name}",
            "receivers": [
                {
                    "whatsappNumber": phone,
                    "customParams": self._build_custom_params(params_list),
                }
            ],
        }

        try:
            logger.info(f"Sending WATI template '{template_name}' to {phone}...")
            resp = self._session.post(self.send_endpoint, json=payload, timeout=timeout_sec)
            # try to capture server response for diagnostics
            try:
                content = resp.json()
            except Exception:
                content = resp.text
            resp.raise_for_status()
            logger.info(f"WATI send OK to {phone}. Response: {content}")
            return True
        except requests.exceptions.HTTPError as http_err:
            logger.error(f"WATI HTTP error: {http_err} - Body: {getattr(http_err, 'response', None) and getattr(http_err.response, 'text', '')}")
        except requests.exceptions.RequestException as req_err:
            logger.error(f"WATI request error: {req_err}")
        except Exception as e:
            logger.error(f"Unexpected WATI error: {e}")
        return False

    def get_templates(
        self,
        page: Optional[int] = None,
        page_size: Optional[int] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        timeout_sec: int = 20,
    ) -> Dict[str, Any]:
        """
        List templates and check name/language/status/variable count before sending.
        """
        if not self.templates_endpoint:
            raise ValueError("Templates endpoint is not configured.")
        params: Dict[str, Any] = {}
        if page is not None:
            params["page"] = int(page)
        if page_size is not None:
            params["pageSize"] = int(page_size)
        if status:
            params["status"] = status
        if search:
            params["search"] = search

        resp = self._session.get(self.templates_endpoint, params=params, timeout=timeout_sec)
        resp.raise_for_status()
        return resp.json()

    # --- Business helpers ---

    @staticmethod
    def _format_date_time(start_time: datetime) -> Dict[str, str]:
        return {
            "booking_date": start_time.strftime("%B %d, %Y"),
            "booking_time": start_time.strftime("%I:%M %p"),
        }

    @staticmethod
    def _format_participants(participants: Dict[str, int]) -> str:
        parts: List[str] = []
        a = int(participants.get("adults", 0) or 0)
        c = int(participants.get("children", 0) or 0)
        if a > 0:
            parts.append(f"{a} Adult{'s' if a > 1 else ''}")
        if c > 0:
            parts.append(f"{c} Child{'ren' if c > 1 else ''}")
        return ", ".join(parts) if parts else "1 Guest"

    def send_booking_confirmation(
        self,
        phone_number: str,
        customer_name: str,
        theme_name: str,
        start_time: datetime,
        participants: Dict[str, int],
    ) -> bool:
        template = self.templates["booking_confirmation"]
        dt = self._format_date_time(start_time)
        participants_summary = self._format_participants(participants)
        params_map = {
            "customer_name": customer_name,
            "theme_name": theme_name,
            "booking_date": dt["booking_date"],
            "booking_time": dt["booking_time"],
            "participants_summary": participants_summary,
        }
        try:
            params_list = [params_map[p] for p in template["params"]]
        except KeyError as e:
            logger.error(f"Missing parameter {e} for template '{template['name']}'")
            return False

        return self._send_template_message(
            phone_number=phone_number,
            template_name=template["name"],
            params_list=params_list,
        )

    def send_custom_reminder(
        self,
        phone_number: str,
        timing_phrase: str,       # e.g., "tomorrow" or "in 1 hour"
        customer_name: str,
        theme_name: str,
        start_time: datetime,
        participants: Dict[str, int],
    ) -> bool:
        """
        Reuse a single generic reminder template by varying 'timing_phrase'.
        """
        template = self.templates["reminder_generic"]
        dt = self._format_date_time(start_time)
        participants_summary = self._format_participants(participants)
        params_map = {
            "timing_phrase": timing_phrase,
            "customer_name": customer_name,
            "theme_name": theme_name,
            "booking_date": dt["booking_date"],
            "booking_time": dt["booking_time"],
            "participants_summary": participants_summary,
        }
        try:
            params_list = [params_map[p] for p in template["params"]]
        except KeyError as e:
            logger.error(f"Missing parameter {e} for template '{template['name']}'")
            return False

        return self._send_template_message(
            phone_number=phone_number,
            template_name=template["name"],
            params_list=params_list,
        )



# --- Global instance for app imports ---
try:
    wati_client = WatiClient()
except ValueError as e:
    logger.critical(f"Failed to initialize WatiClient: {e}")
    wati_client = None

if __name__=="__main__":

    print(wati_client.get_templates())