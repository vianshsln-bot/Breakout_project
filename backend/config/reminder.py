import os
import logging
from dotenv import load_dotenv
from typing import Dict, Any
from datetime import datetime

# --- Import Your Shared Clients ---
try:
    # 1. Import your shared Supabase client
    from backend.config.supabase_client import supabase
    logging.info("Successfully imported shared Supabase client.")
    
    # 2. Import your shared WATI client instance
    # from wati import wati_client
    # if wati_client is None:
    #     raise ImportError("wati_client is None, check WATI env variables.")
    # logging.info("Successfully imported shared Wati client.")
    
except ImportError as e:
    logging.critical(f"Fatal: Could not import shared client: {e}")
    logging.critical("Ensure PYTHONPATH is set correctly and env variables are loaded.")
    raise

# --- Configuration ---
# Load .env file for local testing
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', 'keys.env'))

# Set up logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# --- Constants ---
# We still need retry logic here
MAX_RETRIES = 3
RETRY_DELAY_MINUTES = 15

# --- Helper Functions (Database Updates) ---
# These functions are unchanged, as they only interact with Supabase

def update_reminder_status(booking_id: str, stage: str, update_data: Dict[str, Any]):
    """
    Generic function to update a reminder's status in Supabase.
    It automatically uses the global imported 'supabase' client.
    """
    try:
        update_data["updated_at"] = "now()"
        
        # Uses the global 'supabase' client
        supabase.table("reminders").update(update_data).match({
            "booking_id": booking_id,
            "reminder_stage": stage
        }).execute()
        
        logging.info(f"Updated booking {booking_id} ({stage}) to status: {update_data.get('status')}")
        
    except Exception as e:
        logging.error(f"FATAL: Could not update status for booking {booking_id} ({stage}): {e}")


def handle_send_success(booking_id: str, stage: str):
    """Update reminder status to 'sent'."""
    update_data = {
        "status": "sent",
        "sent_at": "now()",
        "error_message": None
    }
    update_reminder_status(booking_id, stage, update_data)


def handle_send_failure(booking_id: str, stage: str, retry_count: int, error: str):
    """Handles a failed send, implementing the retry logic."""
    
    if retry_count + 1 >= MAX_RETRIES:
        logging.warning(f"Booking {booking_id} ({stage}) reached max retries. Marking as 'failed'.")
        update_data = {
            "status": "failed",
            "error_message": f"Final attempt failed: {error}"[:500],
            "retry_count": retry_count + 1
        }
    else:
        logging.info(f"Booking {booking_id} ({stage}) failed. Scheduling retry {retry_count + 1}.")
        update_data = {
            "status": "pending",
            "retry_count": retry_count + 1,
            "error_message": f"Attempt {retry_count + 1} failed: {error}"[:500],
            "next_trigger": f"now() + interval '{RETRY_DELAY_MINUTES} minutes'"
        }
    
    update_reminder_status(booking_id, stage, update_data)


# --- Main Cron Job Function ---

def main():
    """Main function to fetch, process, and update reminders."""
    logging.info("--- 🚀 Starting reminder cron job run ---")

    # 1. Fetch and lock due reminders
    try:
        # Uses the global 'supabase' client to call the RPC function
        response = supabase.rpc('get_and_lock_due_reminders').execute()
        due_reminders = response.data
        
        if not due_reminders:
            logging.info("No due reminders found. Job finished.")
            return
            
    except Exception as e:
        logging.error(f"Error calling RPC 'get_and_lock_due_reminders': {e}")
        return

    logging.info(f"Found {len(due_reminders)} reminders to process.")

    # 2. Process each reminder
    for reminder in due_reminders:
        booking_id = reminder['booking_id']
        stage = reminder['reminder_stage']
        
        try:
            # Convert the start_time string from Supabase to a datetime object,
            # which the wati_client functions expect.
            # start_time_dt = datetime.fromisoformat(reminder['start_time'])
            print(reminder)
            # success = False
            
            # # Call the correct WatiClient function based on the stage
            # if stage == 'one_day':
            #     success = wati_client.send_one_day_reminder(
            #         phone_number=reminder['phone_number'],
            #         customer_name=reminder['customer_name'],
            #         theme_name=reminder['theme_name'],
            #         start_time=start_time_dt
            #     )
            # elif stage == 'one_hour':
            #     success = wati_client.send_one_hour_reminder(
            #         phone_number=reminder['phone_number'],
            #         customer_name=reminder['customer_name'],
            #         theme_name=reminder['theme_name'],
            #         start_time=start_time_dt
            #     )
            # else:
            #     logging.warning(f"Unknown reminder_stage '{stage}' for booking {booking_id}. Skipping.")
            #     continue # Skip to the next reminder

            # # 3. Update status in Supabase based on outcome
            # if success:
            #     handle_send_success(booking_id, stage)
            # else:
            #     handle_send_failure(booking_id, stage, reminder['retry_count'], "WATI client call failed")

        except Exception as e:
            # This catches errors in *our* logic (e.g., bad datetime format)
            logging.error(f"Critical error processing booking {booking_id} ({stage}): {e}")
            handle_send_failure(booking_id, stage, reminder['retry_count'], str(e))

    logging.info("--- ✅ Reminder cron job run finished ---")


if __name__ == "__main__":
    main()