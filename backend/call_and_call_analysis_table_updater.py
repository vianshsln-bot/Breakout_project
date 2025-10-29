from datetime import datetime
from supabase import create_client, Client
import os

#----------------------------------Supabase Client Creator------------------------------------
url = os.getenv("SUPABASE_URL")  
key = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(url, key)

#------------------------------------Table Updaters--------------------------------------------

def save_inbound_call(
    conv_id : str,
    call_intent: str,
    date_time : datetime.utcnow().isoformat(),
    transcript: str
):
    """Save inbound call details into the `call` table"""

    response = supabase.table("call").insert({
        "conv_id" : conv_id,
        "call_intent": call_intent,
        "transcript": transcript,
        "date_time":datetime.utcnow().isoformat()
    }).execute()

    if response.data:
        print("Call saved:", response.data[0])
        return response.data[0]
    else:
        print("Failed to save call:", response)
        return None

  def save_call_feedback(
    conv_id: str,
    customer_rating: int,
    human_agent_flag : bool,
    ai_detected_flag : bool,
    summary : str,
    sentiment_score : float,
    emotional_score : float,
    human_intervention_reason : str,
    failed_conversation_reason : str,
    out_of_scope : bool
):
    """Save customer feedback & rating after a call"""
    
    response = supabase.table("call_analysis").insert({
        "conv_id": conv_id,
        "customer_rating": customer_rating,
        "human_agent_flag" : human_agent_flag,
        "ai_detect_flag" : ai_detect_flag,
        "summary" : summary,
        "sentiment_score" : sentiment_score,
        "emotional_score" : emotional_score,
        "human_intervention_reason" : human_intervention_reason,
        "failed_conversation_reason" : failed_conversation_reason,
        "out_of_scope" : out_of_scope
    }).execute()

    if response.data:
        print("Feedback saved:", response.data)
        return response.data[0]["id"]
    else:
        print("Failed to save feedback:", response)
        return None

#-------------------------------Conversation ID Fetcher-----------------------------------------

import requests

def fetch_all_conversation_ids(api_key):
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json"
    }

    url = "https://api.elevenlabs.io/v1/convai/conversations"
    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        raise Exception(f"Error fetching conversations: {response.status_code} {response.text}")

    data = response.json()
    conversations = data.get("conversations", [])

    # Extract only conversation_id
    conversation_ids = [conv["conversation_id"] for conv in conversations]
    return conversation_ids

#----------------------------------Transcript Extractor----------------------------

import requests

API_KEY = os.getenv("ELEVENLAB_API")
headers = {"xi-api-key": API_KEY}

def extract_transcript(conversation_id: str) -> str:
    """
    Fetches and returns the full transcript text for a given conversation_id 
    from ElevenLabs
    """
    url = f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}"
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        conversation_details = response.json()
        transcript_turns = conversation_details.get("transcript", [])
        
        # Combine all agent + user messages
        transcript_text = " ".join(
            [turn["message"] for turn in transcript_turns if "message" in turn]
        )
        
        return transcript_text.strip()
    else:
        raise Exception(f"Error fetching transcript: {response.status_code}, {response.text}")


# Example usage
conversation_id = "conv_9501k63ks23ffqkv9jpy0txcmk6k"
transcript = extract_transcript(conversation_id)
print("📝 Transcript:", transcript)

#--------------------------------LLM for Key Info Extraction---------------------------------

import requests
import json

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def llm_extract(transcript: str):
    """
    Uses Groq LLaMA 3.1 8B model to extract structured info from transcript.
    Returns JSON with fields required by process_inbound_call.
    """
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    prompt = f"""
    You are an AI that extracts structured call information from transcripts.

    Transcript:
    {transcript}

    Extract the following fields in valid JSON (no extra text):
    {{
        "summary": string,                    # concise 2–3 line summary of the call
        "sentiment": "Positive" | "Neutral" | "Negative",
        "call_intent": "Genuine Customer" | "Delivery Inquiry" | "Marketing Call" | "HR query" 
        "ai_detected_flag": boolean,               # true if caller suspects they are speaking to AI
        "customer_rating": 1 - 5, #If not present return 4
        "human_agent_flag" : human_agent_flag, # True if caller asks for a human or the call is transfered to a human due to any issues.
        "sentiment_score" :0.0000 - 1.0000, #Assign a score yourself basedd on the sentiment of the call negative/neutral/positive strictly in this range
        "emotional_score" : 0.0000 - 1.0000, #based on emotions of the caller assign a score strictly in this range
        "human_intervention_reason" : string, #If a call is transfered to human write the reasonn in one line under 5-8 words if not return empty.
        "failed_conversation_reason" : string, #If a conversation ends abruptly and the we were unable to help the user with his asked enquiry/booking write the reason here under 10 words
        "out_of_scope" : boolean #if a call ends abrubtly or if the customer doesnt follow the given workflow starts asking/saying things randomly apart from booking/themes enquiry or making a booking, mark this as true
        }}
    }}
    """

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
        "max_tokens": 1000,
        "response_format": {"type": "json_object"}
    }

    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        print("LLM returned invalid JSON. Raw output:", content)
        return {}

#----------------------------Updating Supabase---------------------------------------------

def process_inbound_call(conversation_id, structured_info=None, feedback=None):
    """
    End-to-end call processing:
    1. Fetch transcript from ElevenLabs API
    2. Run LLM to extract structured info (summary, sentiment etc. etc.)
    3. Save call and call_analysis
    """
    API_KEY = os.getenv("ELEVENLAB_API")

    # Step 1: Fetch transcript
    transcript = extract_transcript(conversation_id) 

    # Step 2: Extract structured info via LLM if not provided
    if structured_info is None:
        structured_info = llm_extract(transcript)

    call_intent = structured_info.get("call_intent", "")
    summary = structured_info.get("summary", "")
    sentiment = structured_info.get("sentiment", "Neutral")
    ai_detected_flag = structured_info.get("ai_detected_flag", False)  # from identity detection
    customer_rating = structured_info.get("customer_rating")
    human_agent_flag =  structured_info.get("human_agent_flag", False)
    sentiment_score =structured_info.get("sentiment_score",4)
    emotional_score = structured_info.get("emotional_score")
    human_intervention_reason = structured_info.get("human_intervention_reason","")
    failed_conversation_reason = structured_info.get("failed_conversation_reason","")
    out_of_scope = structured_info.get("out_of_scope",False)
    results = {}

    # 🔹 Step 3: Save call log
    call_data = save_inbound_call(
        conv_id = conversation_id,
        date_time = datetime.utcnow().isoformat(),
        call_intent=call_intent,
        transcript=transcript,
    )

    save_call_feedback(
        conv_id= conversation_id,
        customer_rating= customer_rating,
        human_agent_flag =human_agent_flag,
        ai_detected_flag = ai_detected_flag,
        summary =summary,
        sentiment_score =sentiment_score,
        emotional_score =emotional_score,
        human_intervention_reason =human_intervention_reason,
        failed_conversation_reason =failed_conversation_reason,
        out_of_scope =out_of_scope
)
    if not call_data:
        return {"error": "Call not saved"}

    conversation_id = conversation_id
    results["conversation_id"] = conversation_id

    
    return results

#--------------------------Checker for Existing Conv_id in Supabase-------------------------

def check_and_process_conversation(conversation_id: str):
    """
    Checks Supabase bookings table to see if conversation_id has already been processed.
    - If exists: skip
    - If not: process via process_inbound_call and store results
    """

    try:
        #Step 1: Check if this conversation_id already exists in bookings
        existing = (
            supabase.table("call")
            .select("conv_id")
            .eq("conv_id", conversation_id)
            .execute()
        )

        if existing.data:
            print(f"Conversation {conversation_id} already processed (found in bookings). Skipping...")
            return {"status": "Skipped", "conversation_id": conversation_id}

        # Step 2: Process if it's a new conversation
        print(f"Processing new conversation: {conversation_id}")
        result = process_inbound_call(conversation_id)

        print(f"Finished processing {conversation_id}: {result}")
        return {"status": "Processed", "conversation_id": conversation_id, "result": result}

    except Exception as e:
        print(f"Error during processing {conversation_id}: {e}")
        return {"status": "error", "conversation_id": conversation_id, "error": str(e)}

#----------------------------------------The End-------------------------------------------------

