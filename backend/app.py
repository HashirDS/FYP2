import random
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
import requests
import os
from dotenv import load_dotenv
from validators import email
import base64
import bcrypt
from datetime import datetime
from bson.objectid import ObjectId
from werkzeug.security import check_password_hash
# --- NEW IMPORTS FOR AI & TTS ---
import json
from google import genai
from google.genai.errors import APIError
import azure.cognitiveservices.speech as speechsdk
import whisper
from jiwer import wer
import os
import replicate

# --- NEW IMPORTS FOR SPEECH SYSTEM ---
import tempfile
import time
from difflib import SequenceMatcher
from werkzeug.utils import secure_filename

# ---------------------------------

# --- IMPORTS FOR LOCAL MODEL (for Poem Generator) ---
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

# ---
# Load environment variables from the .env file
load_dotenv()

# Initialize the Flask application
app = Flask(__name__)

# Enable Cross-Origin Resource Sharing (CORS)
CORS(app)

# Initialize the bcrypt extension
bcrypt = Bcrypt(app)

# (Your MongoDB Connection Code... UNCHANGED)
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://asherzaki960_db_user:RsJfSdrqi8P240AZ@cluster0.lhkq0mz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")

try:
    client = MongoClient(MONGO_URI)
    db = client.smart_tutor
    print("Successfully connected to MongoDB.")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    db = None

# (Your API Key Code... UNCHANGED)
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')
SPEECH_KEY = os.getenv("SPEECH_KEY")
SPEECH_REGION = os.getenv("SPEECH_REGION")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

# --- GROQ CLIENT INITIALIZATION ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("⚠️ WARNING: GROQ_API_KEY not found in environment variables.")
    groq_client = None
else:
    try:
        from groq import Groq
        groq_client = Groq(api_key=GROQ_API_KEY)
        print("✅ Groq client initialized successfully")
    except ImportError:
        print("⚠️ WARNING: Groq package not installed")
        groq_client = None

if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY not found in environment variables.")
if not ELEVENLABS_API_KEY:
    print("Warning: ELEVENLABS_API_KEY not found in environment variables.")
if not SPEECH_KEY or not SPEECH_REGION:
    print("Warning: Azure TTS SPEECH_KEY or SPEECH_REGION not found in environment variables.")

# --- *** Local Poem Model Loader (UNCHANGED) *** ---
class PoemModelLoader:
    def __init__(self, model_path="./model"):
        self.tokenizer = None
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Initializing local poem model... (Device: {self.device})")
        try:
            if not os.path.exists(model_path):
                print(f"--- WARNING: Model path does not exist: {model_path} ---")
                raise FileNotFoundError(f"Model directory not found: {model_path}")
            self.tokenizer = AutoTokenizer.from_pretrained(model_path)
            self.model = AutoModelForCausalLM.from_pretrained(model_path).to(self.device)
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            print("✅ Custom local poem model loaded successfully!")
        except Exception as e:
            print(f"❌ Error loading local LLM model from {model_path}: {e}")
            import traceback
            traceback.print_exc()

    def generate(self, prompt_text):
        if not self.model or not self.tokenizer:
            return "Error: Local model is not loaded."
        try:
            print(f"🧠 [Model Input] {prompt_text[:100]}...")
            inputs = self.tokenizer(
                prompt_text, return_tensors="pt", padding=False,
                truncation=True, max_length=128
            ).to(self.device)
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs, max_new_tokens=50, do_sample=True, top_p=0.85,
                    temperature=0.7, repetition_penalty=1.2,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                    early_stopping=True
                )
            response_text = self.tokenizer.decode(
                outputs[0][inputs["input_ids"].shape[1]:],
                skip_special_tokens=True
            ).strip()
            if "\n" in response_text:
                response_text = response_text.split("\n")[0].strip()
            response_text = response_text.strip('"').strip("'")
            if response_text and response_text[-1] not in '.!?':
                for punct in ['.', '!', '?']:
                    if punct in response_text:
                        response_text = response_text.rsplit(punct, 1)[0] + punct
                        break
            print(f"✅ [Model Output] {response_text}")
            return response_text
        except Exception as e:
            print(f"❌ Model generation error: {e}")
            import traceback
            traceback.print_exc()
            return "Sorry, I had trouble thinking."

poem_model = PoemModelLoader(model_path="./model")
# --- *** END LOCAL MODEL *** ---

# --- Helper Function: System Instruction (UNCHANGED) ---
def system_instruction(topic):
    return f"""
    You are a cheerful Kindergarten Teacher for a 3-year-old child.
    
    STRICT RULES FOR RESPONSE:
    1. ZERO FLUFF: Do not say "Let's learn" or "Here we go". Start the lesson immediately.
    2. BE INSTRUCTIONAL: 
       - If asked for "ABC", say ONLY: "A is for Apple 🍎, B is for Ball 🏀, C is for Cat 🐱!"
       - If asked for "Colors", say ONLY: "Red like a Strawberry 🍓, Blue like the Sky ☁️!"
    3. KEEP IT SHORT: Max 2 sentences.
    4. NO GREETINGS: Do not say "Hello" unless the user specifically said "Hi" or "Hello" first.
    5. TONE: Simple, happy, and educational. Use emojis.

    User Request: {topic}
    """

# --- Your existing Helper Function (UNCHANGED) ---
def make_text_baby_friendly(text):
    lines = text.strip().split('\n')
    processed_lines = []
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        line = line.replace('.', '... ')
        # ... (rest of your function) ...
        processed_lines.append(line)
    processed_text = ' '.join(processed_lines)
    processed_text = f"Hello little one! {processed_text} ... Wasn't that fun?"
    return processed_text

# --- SPEECH HELPER FUNCTIONS ---
def normalize_text(text):
    """Remove punctuation and extra spaces, convert to uppercase"""
    import re
    text = re.sub(r'[^\w\s]', '', text)
    text = ' '.join(text.split())
    return text.upper().strip()

def check_pronunciation_match(expected, recognized):
    """
    Tuned for 3-5 year olds.
    Handles common speech impediments (R->W, L->W) and 'baby talk' substitutions.
    """
    # 1. Normalize both inputs
    expected = normalize_text(expected)
    recognized = normalize_text(recognized)
    
    if not expected or not recognized:
        return 0, "no_speech"

    # --- TODDLER DICTIONARY (Common Mispronunciations) ---
    TODDLER_VARIANTS = {
        # Numbers
        "ONE":   ["WON", "WAN", "ON", "UN"],
        "TWO":   ["TO", "TOO", "TU", "DO", "SHOE"],
        "THREE": ["TREE", "FREE", "FWEE", "SREE"],
        "FOUR":  ["FOR", "FO", "FOW"],
        "FIVE":  ["FIVE", "FIFE", "FIV", "PIE"],
        "SIX":   ["SICKS", "SICK", "SEX", "ISH"],
        "SEVEN": ["SEVEN", "SEVN", "SAVEN"],
        "EIGHT": ["ATE", "EIT", "AIT"],
        "NINE":  ["NINE", "NIEN", "NAN"],
        "TEN":   ["TAN", "TIN", "DEN"],

        # Colors
        "RED":    ["WED", "RAD", "RID"],
        "BLUE":   ["BOO", "BWUE", "BLU", "LOO"],
        "GREEN":  ["GWEEN", "GEEN", "GRIN"],
        "YELLOW": ["LELLOW", "YEYOW", "YELLO"],
        "ORANGE": ["AWNGE", "ORNJ", "ANJ"],
        "PURPLE": ["PUPPLE", "POPLE"],

        # Fruits
        "APPLE":  ["APPU", "APPEL", "APOL"],
        "BANANA": ["NANA", "BANA", "NANNA"],
        "GRAPES": ["GAPES", "GWAPES"],

        # Shapes
        "CIRCLE": ["SIKLE", "SIRKEL", "COCO"],
        "SQUARE": ["SKWARE", "KARE"],
        "STAR":   ["TAH", "TAR", "STA"],
    }

    # 2. Perfect Match
    if expected == recognized:
        return 100, "perfect"

    # 3. Check Toddler Dictionary
    if expected in TODDLER_VARIANTS:
        if recognized in TODDLER_VARIANTS[expected]:
            return 98, "toddler_match"  # High score for "Wed" instead of "Red"

    # 4. Partial/Substring Match (Very forgiving)
    if expected in recognized:
        return 95, "sentence_match"
    
    # 5. Common Letter Swaps (Algorithm)
    # 3-year-olds often swap R->W or TH->F. 
    baby_version = expected.replace("R", "W").replace("TH", "F").replace("L", "W")
    if baby_version == recognized:
         return 92, "speech_impediment_match"

    # 6. Fuzzy Similarity (SequenceMatcher)
    similarity = SequenceMatcher(None, expected, recognized).ratio() * 100
    
    # Check similarity against variants too
    if expected in TODDLER_VARIANTS:
        for variant in TODDLER_VARIANTS[expected]:
            variant_sim = SequenceMatcher(None, variant, recognized).ratio() * 100
            if variant_sim > similarity:
                similarity = variant_sim

    # 7. Final Thresholds (Lowered for encouragement)
    if similarity >= 75:  
        return round(similarity, 2), "high_similarity"
    elif similarity >= 50:
        return round(similarity, 2), "medium_similarity"
    
    return round(similarity, 2), "low_similarity"

# --- (Your Auth & Progress Endpoints - UNCHANGED) ---
@app.route("/register", methods=["POST"])
def register_user():
    if db is None: return jsonify({"message": "Database connection failed"}), 500
    data = request.get_json()
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    username = data.get("username")
    password = data.get("password")
    user_type = data.get("user_type", "child")
    if not all([first_name, last_name, username, password]):
        return jsonify({"message": "All fields are required"}), 400
    if not email(username):
        return jsonify({"message": "Invalid email format"}), 400
    if db.users.find_one({"username": username}):
        return jsonify({"message": "Email already registered"}), 409
    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
    user = {
        "first_name": first_name, "last_name": last_name, "username": username,
        "password": hashed_password, "user_type": user_type.lower(), "created_at": datetime.utcnow()
    }
    try:
        result = db.users.insert_one(user)
        user_id = str(result.inserted_id)
    except Exception as e:
        print(f"MongoDB insert error: {e}")
        return jsonify({"message": "Database write error during registration"}), 500

    if user_type.lower() == "child":
        initial_progress = {
            "_id": result.inserted_id,
            "child_name": f"{first_name} {last_name}",
            "completed_items": {
                "abc": [], "numbers": [], "shapes": [],
                "colors": [], "poems": [], "fruits": []
            },
            "total_score": 0, "last_activity": None
        }
        try:
            db.progress.insert_one(initial_progress)
        except Exception as e:
            print(f"Warning: Failed to initialize progress doc: {e}")
    return jsonify({ "message": "User registered successfully", "user_id": user_id, "user_type": user_type.lower() }), 201

@app.route("/login", methods=["POST"])
def login_user():
    if db is None: return jsonify({"message": "Database connection failed"}), 500
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400
    user = db.users.find_one({"username": username})
    if user and bcrypt.check_password_hash(user["password"], password):
        return jsonify({
            "message": "Login successful", "user_id": str(user["_id"]),
            "user_type": user.get("user_type", "child").lower(),
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", "")
        }), 200
    else:
        return jsonify({"message": "Invalid email or password"}), 401

@app.route("/api/progress/summary/<user_id>", methods=["GET"])
def get_child_progress(user_id):
    if db is None: return jsonify({"message": "Database connection failed"}), 500
    try:
        progress_data = db.progress.find_one({"_id": ObjectId(user_id)})
        if not progress_data: return jsonify({"message": "Child progress not found"}), 404
        progress_data["_id"] = str(progress_data["_id"])
        if "completed_items" not in progress_data:
            progress_data["completed_items"] = {}
        return jsonify(progress_data), 200
    except Exception as e:
        print(f"Error fetching progress: {e}")
        return jsonify({"error": "Failed to fetch progress"}), 500

@app.route("/api/progress/all_children", methods=["GET"])
def get_all_child_progress():
    if db is None: return jsonify({"message": "Database connection failed"}), 500
    try:
        all_progress = list(db.progress.find({}))
        for progress in all_progress:
            progress["_id"] = str(progress["_id"])
            if "completed_items" not in progress:
                progress["completed_items"] = {}
        return jsonify(all_progress), 200
    except Exception as e:
        print(f"Error fetching all progress: {e}")
        return jsonify({"error": "Failed to fetch all progress"}), 500

@app.route("/api/progress/mark_item_complete", methods=["PUT"])
def mark_item_complete():
    if db is None: return jsonify({"message": "Database connection failed"}), 500
    data = request.get_json()
    user_id = data.get("user_id")
    category = data.get("category")
    item = data.get("item")
    if not all([user_id, category, item]):
        return jsonify({"message": "Missing user_id, category, or item"}), 400

    valid_categories = ["abc", "numbers", "shapes", "colors", "poems", "fruits"]
    if category not in valid_categories:
        print(f"Invalid category received: {category}")
        return jsonify({"message": f"Invalid category: {category}"}), 400

    try:
        progress_doc = db.progress.find_one({
            "_id": ObjectId(user_id),
            f"completed_items.{category}": item
        })
        if progress_doc:
            db.progress.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"last_activity": datetime.utcnow().isoformat()}}
            )
            return jsonify({"message": "Item already completed"}), 200

        update_result = db.progress.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$addToSet": { f"completed_items.{category}": item },
                "$set": { "last_activity": datetime.utcnow().isoformat() },
                "$inc": { "total_score": 1 }
            },
            upsert=False
        )
        if update_result.matched_count == 0:
              return jsonify({"message": "Progress update failed. User profile missing."}), 404
        return jsonify({"message": "Progress updated successfully"}), 200
    except Exception as e:
        print(f"Error updating progress: {e}")
        return jsonify({"error": "Failed to update progress"}), 500

# -----------------------------------------------------
# --- 3D AVATAR API (UNCHANGED) ---
# -----------------------------------------------------
# -----------------------------------------------------
# --- UPDATED: /api/ai — Uses Hugging Face Phi-2 Model ---
# -----------------------------------------------------

HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")
HF_MODEL_URL = "https://router.huggingface.co/hf-inference/models/Hashir124/phi-2"

import os
import replicate  # <--- New Import
from flask import Flask, request, jsonify

# ---------------------------------------------------------
REPLICATE_MODEL_ID = "hashirds/ashir:6b0013266a78c6c8890f033dbce522a9e6477cc8eb5af4ca2e2fb4b5d638be06"
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# --- NEW: Helper Function to Clean Repetitive Text ---
def clean_tutor_response(text):
    """
    Stops the model from praising the user endlessly.
    Keeps the first 2 sentences or splits before the praise loop starts.
    """
    # Common looping phrases to cut off
    cut_off_phrases = [
        "Perfect work!", "Fantastic!", "You're a superstar!", 
        "Incredible job!", "You're amazing!", "Bravo!"
    ]
    
    for phrase in cut_off_phrases:
        if phrase in text:
            # Keep text ONLY before the first occurrence of a praise loop
            text = text.split(phrase)[0]
    
    return text.strip()

@app.route('/api/ai', methods=['GET'])
def ask_ai():
    question = request.args.get('question', '').strip()
    if not question:
        return jsonify({"error": "Missing 'question' parameter"}), 400

    # ---------------------------------------------------------
    # SYSTEM PROMPT
    # ---------------------------------------------------------
    system_instruction_text = """
    You are an expert Kindergarten Teacher.
    Give a VERY SHORT answer (1-2 sentences).
    Do NOT repeat yourself. Stop talking after the answer.
    """

    # ---------------------------------------------------------
    # 1. TRY REPLICATE (Custom Model)
    # ---------------------------------------------------------
    try:
        print("🧠 Sending question to Replicate (hashirds/ashir)...")
        
        output = replicate.run(
            REPLICATE_MODEL_ID,
            input={
                "prompt": f"{system_instruction_text}\nUser: {question}\nTeacher:",
                "max_new_tokens": 75,       # <--- REDUCED to stop loops
                "temperature": 0.5,         # Lower = More focused
                "top_p": 0.9,
                "repetition_penalty": 1.5,  # High penalty for repeats
                "stop_sequences": ["User:", "\n\n", "Teacher:", "Perfect work!"] # Force stop
            }
        )

        generated_text = "".join(output)

        # Cleanup prefixes
        if "Teacher:" in generated_text:
            generated_text = generated_text.split("Teacher:")[-1].strip()

        # --- APPLY NEW CLEANER ---
        generated_text = clean_tutor_response(generated_text)

        # Fallback Check: If empty or still loops
        if not generated_text or len(generated_text) < 5: 
            raise ValueError("Response too short or empty")
        
        return jsonify({"text": generated_text, "source": "replicate_custom"})

    except Exception as e:
        print(f"⚠️ Replicate Issue ({e}). Fallback to Llama 3 (Groq)...")

    # ---------------------------------------------------------
    # 2. FALLBACK: GROQ (Llama 3)
    # ---------------------------------------------------------
    try:
        if 'groq_client' not in globals() or not groq_client:
            raise ValueError("Groq client not initialized")

        completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_instruction_text},
                {"role": "user", "content": question}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            max_tokens=200
        )

        fallback_text = completion.choices[0].message.content.strip()
        print(f"✅ Served via Groq: {fallback_text[:50]}...")
        return jsonify({"text": fallback_text, "source": "groq_llama3"})

    except Exception as e:
        print(f"❌ CRITICAL: Both models failed. {e}")
        return jsonify({
            "text": "A is for Apple 🍎. B is for Ball 🏀. Let's try again later!", 
            "source": "error_fallback"
        })

# Your Custom Model on Replicate (Updated with new hash)

# -----------------------------------------------------
# --- /api/tts Route (Azure TTS with SSML for speed) ---
# -----------------------------------------------------
@app.route('/api/tts', methods=['GET'])
def get_tts():
    if not SPEECH_KEY or not SPEECH_REGION:
        return Response("TTS keys are not configured on the server.", status=500)

    text = request.args.get("text")
    if not text:
        return Response("Missing text parameter for TTS.", status=400)

    try:
        # 1. Speech Configuration (Unchanged)
        speech_config = speechsdk.SpeechConfig(
            subscription=SPEECH_KEY,
            region=SPEECH_REGION
        )
        speech_config.speech_synthesis_voice_name = "en-US-JennyNeural"
        speech_config.set_speech_synthesis_output_format(
            speechsdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3
        )

        # 2. Create synthesizer (Unchanged)
        synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=speech_config,
            audio_config=None
        )
       
        # 3. Viseme collection (Unchanged)
        visemes = []
       
        def viseme_received_handler(evt):
            offset_ms = evt.audio_offset / 10000  # Convert to milliseconds
            visemes.append([offset_ms, evt.viseme_id])
            # print(f"Viseme received: offset={offset_ms}ms, id={evt.viseme_id}") # Debug

        synthesizer.viseme_received.connect(viseme_received_handler)

        # --- *** 4. ADDED SSML FOR SPEED CONTROL *** ---
        # We wrap the text in SSML to control the speed.
        # rate="-20.0%" makes it 20% slower. Use "0%" for normal.
        ssml_string = f"""
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
            <voice name="en-US-JennyNeural">
                <prosody rate="-20.0%">
                    {text}
                </prosody>
            </voice>
        </speak>
        """
        # --- *** END OF ADDITION *** ---

        print(f"Starting TTS synthesis (with SSML) for text: {text[:50]}...")
       
        # --- *** 5. CHANGED to speak_ssml_async *** ---
        result = synthesizer.speak_ssml_async(ssml_string).get()
        # --- *** END OF CHANGE *** ---

        # 6. Check result status (Unchanged)
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            audio_data = result.audio_data
            print(f"✅ TTS Success! Audio size: {len(audio_data)} bytes")
            print(f"✅ Visemes captured: {len(visemes)} viseme events")
           
            if len(visemes) == 0:
                print("⚠️ WARNING: No visemes were captured!")
           
            response = Response(
                audio_data,
                mimetype="audio/mpeg",
                headers={
                    "Visemes": json.dumps(visemes),
                    "Content-Disposition": "inline; filename=tts.mp3",
                    "Access-Control-Expose-Headers": "Visemes"
                }
            )
            return response
           
        elif result.reason == speechsdk.ResultReason.Canceled:
            cancellation = result.cancellation_details
            error_msg = f"Speech synthesis canceled: {cancellation.reason}"
            if cancellation.reason == speechsdk.CancellationReason.Error:
                error_msg += f" Error details: {cancellation.error_details}"
            print(f"❌ TTS Error: {error_msg}")
            return Response(error_msg, status=500)
        else:
            error_msg = f"Unexpected result reason: {result.reason}"
            print(f"❌ TTS Error: {error_msg}")
            return Response(error_msg, status=500)

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ Azure TTS Exception: {e}")
        print(error_trace)
        return Response(f"Internal TTS server error: {str(e)}", status=500)
    

# --- SPEECH ANALYSIS ROUTE ---
@app.route("/analyze_speech", methods=["POST"])
def analyze_speech():
    """
    Analyze child's pronunciation using Deepgram STT
    Clean, stable & no ffmpeg needed
    """

    temp_path = None

    try:
        if not DEEPGRAM_API_KEY:
            return jsonify({"error": "Deepgram API key missing"}), 500

        # ----------------------------
        # 1. Read Inputs
        # ----------------------------
        expected_text = request.form.get("expected_text", "").strip()
        audio_file = request.files.get("audio")
        user_id = request.form.get("user_id")
        lesson_type = request.form.get("lesson_type", "colors")

        # Validate
        if not audio_file:
            return jsonify({
                "success": False,
                "error": "No audio received",
                "reward": "🎤 No audio detected! Try again!",
                "points_added": 0
            }), 400

        if expected_text == "":
            return jsonify({
                "success": False,
                "error": "Expected text missing",
                "reward": "⚠ Something went wrong!",
                "points_added": 0
            }), 400

        # ----------------------------
        # 2. Save .webm file temporarily
        # ----------------------------
        temp_filename = f"recording_{int(time.time())}.webm"
        temp_path = os.path.join(tempfile.gettempdir(), temp_filename)
        audio_file.save(temp_path)

        file_size = os.path.getsize(temp_path)
        print("📦 Audio file size:", file_size)

        if file_size < 800:  # <0.8 KB = empty
            os.remove(temp_path)
            return jsonify({
                "success": False,
                "error": "Audio too small",
                "reward": "🎤 No sound detected! Speak louder.",
                "points_added": 0
            }), 400

        # ----------------------------
        # 3. Deepgram Speech-To-Text
        # ----------------------------
        print(f"🎤 Transcribing with Deepgram for expected: {expected_text}")

        import requests
        url = "https://api.deepgram.com/v1/listen?model=nova-2&language=en&punctuate=false&smart_format=false"

        headers = {
            "Authorization": f"Token {DEEPGRAM_API_KEY}",
            "Content-Type": "audio/webm"
        }

        with open(temp_path, "rb") as f:
            response = requests.post(url, headers=headers, data=f)

        dg_data = response.json()
        print("🧾 Deepgram raw:", dg_data)

        try:
            recognized_text = dg_data["results"]["channels"][0]["alternatives"][0]["transcript"].strip()
        except:
            recognized_text = ""

        print(f"🗣️ Recognized: '{recognized_text}'")

        if recognized_text == "":
            os.remove(temp_path)
            return jsonify({
                "success": False,
                "error": "No speech detected",
                "reward": "🎤 I didn’t hear anything! Try again!",
                "expected_text": expected_text,
                "recognized_text": "Silent",
                "accuracy": 0,
                "stars": 0,
                "points_added": 0,
            }), 200

        # ----------------------------
        # 4. Score pronunciation
        # ----------------------------
        accuracy, match_type = check_pronunciation_match(expected_text, recognized_text)
        print(f"📊 Accuracy: {accuracy}% ({match_type})")

        # Rewards logic
        if accuracy >= 90:
            reward = "🏆 Excellent! Perfect pronunciation!"
            points = 5
            stars = 3
        elif accuracy >= 70:
            reward = "🎉 Great job! You said it well!"
            points = 4
            stars = 2
        elif accuracy >= 50:
            reward = "🙂 Good try! You're getting closer!"
            points = 3
            stars = 1
        else:
            reward = "🔁 Let's try again! Listen carefully!"
            points = 0
            stars = 0

        # ----------------------------
        # 5. Save progress in DB
        # ----------------------------
        if user_id:
            try:
                db.progress.update_one(
                    {"_id": ObjectId(user_id)},
                    {
                        "$inc": {"total_score": points},
                        "$set": {"last_activity": datetime.utcnow().isoformat()},
                        "$push": {
                            "speech_history": {
                                "lesson_type": lesson_type,
                                "expected": expected_text,
                                "recognized": recognized_text,
                                "accuracy": accuracy,
                                "points": points,
                                "timestamp": datetime.utcnow().isoformat()
                            }
                        }
                    },
                    upsert=True
                )
                print(f"⭐ Score update OK for user {user_id}")
            except Exception as e:
                print("⚠️ DB update failed:", e)

        # ----------------------------
        # 6. TTS Reward (Using Free gTTS)
        # ----------------------------
        reward_audio = None
        use_browser_tts = True 
        
        # Determine what to say
        tts_text = reward if accuracy >= 90 else f"{reward} Listen: {expected_text}. Now you try!"

        try:
            # Import strictly needed for this block
            from gtts import gTTS
            import io
            import base64

            # Generate audio in memory (no file saved)
            tts = gTTS(text=tts_text, lang='en', slow=False)
            mp3_fp = io.BytesIO()
            tts.write_to_fp(mp3_fp)
            mp3_fp.seek(0)

            # Convert to Base64 to send to frontend
            reward_audio = base64.b64encode(mp3_fp.read()).decode('utf-8')
            
            # Since we generated audio successfully, tell frontend NOT to use browser voice
            use_browser_tts = False 
            print("✅ gTTS Audio generated for reward")

        except Exception as e:
            print(f"⚠️ gTTS failed ({e}), falling back to browser TTS")
            reward_audio = None
            use_browser_tts = True
        
        # Delete temp recording file
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

        # ----------------------------
        # 7. Return final result
        # ----------------------------
        return jsonify({
            "success": True,
            "expected_text": expected_text,
            "recognized_text": recognized_text,
            "accuracy": accuracy,
            "match_type": match_type,
            "reward": reward,
            "stars": stars,
            "reward_audio": reward_audio,
            "use_browser_tts": use_browser_tts,
            "tts_text": tts_text,
            "points_added": points,
            "lesson_type": lesson_type
        }), 200

    except Exception as e:
        print("❌ Error in /analyze_speech:", e)
        import traceback
        traceback.print_exc()

        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

        return jsonify({
            "success": False,
            "error": str(e),
            "reward": "⚠ Something went wrong!",
            "points_added": 0
        }), 500


# --- (Existing Poem & Audio Endpoints - UNCHANGED) ---
import base64
import io
from gtts import gTTS  # Make sure to import this

import google.generativeai as genai
from flask import Flask, request, jsonify
import os

# Configure the library with your key
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "AIzaSyB0rCoFMKWb2FefDDJDQYnrE6SlLnuCVxc"))

@app.route('/generate-poem', methods=['POST'])
def generate_poem():
    try:
        data = request.get_json()
        topic = data.get('topic')
        if not topic:
            return jsonify({"error": "No topic provided"}), 400
            
        prompt = f"""Write a short, simple, and joyful poem for a toddler (age 2-6) about: {topic}
        
Make it:
- 4-6 lines long
- Use simple words
- Include rhymes
- Make it fun and educational

Topic: {topic}"""
        # ✅ FIX: Using 'gemini-2.5-flash' (The standard model for late 2025)
        # If this hits a rate limit, try 'gemini-2.5-flash-lite'
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        response = model.generate_content(prompt)
        
        # Check if response is valid
        if response and response.text:
            return jsonify({"poem": response.text, "source": "gemini_api"})
        else:
            return jsonify({"error": "No poem generated."}), 500

    except Exception as e:
        print(f"Error: {e}")
        # Check for Rate Limit specific error string
        if "429" in str(e):
            return jsonify({"error": "⏰ Daily limit reached. Please wait or use a predefined rhyme."}), 429
        return jsonify({"error": str(e)}), 500

# ✅ NEW: Free & Stable Audio Generator using gTTS
@app.route('/generate-audio', methods=['POST'])
def generate_audio():
    try:
        data = request.json
        text = data.get('text')
        if not text:
            return jsonify({"error": "No text provided"}), 400

        # Generate audio using Google Text-to-Speech (Free, no API key needed)
        tts = gTTS(text=text, lang='en', slow=False)
        
        # Save to memory buffer
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        
        # Encode to base64 to send to frontend
        audio_base64 = base64.b64encode(mp3_fp.read()).decode('utf-8')
        
        return jsonify({
            "audio_data": audio_base64,
            "mime_type": "audio/mpeg",
            "source": "gtts_free"
        })
        
    except Exception as e:
        print(f"Audio generation error: {e}")
        return jsonify({"error": str(e)}), 500
@app.route('/generate-audio-elevenlabs', methods=['POST'])
def generate_audio_elevenlabs():
    if not ELEVENLABS_API_KEY:
        return jsonify({"error": "ElevenLabs API key not configured"}), 500
    try:
        data = request.json
        text = data.get('text')
        if not text:
            return jsonify({"error": "No text provided"}), 400

        print(f"Generating ElevenLabs audio for: {text[:50]}...")

        processed_text = make_text_baby_friendly(text)

        CHILD_FRIENDLY_VOICES = {
            "bella": "EXAVITQu4vr4xnSDxMaL",
            "elli": "MF3mGyEYCl7XYWbV9V6O",
            "rachel": "21m00Tcm4TlvDq8ikWAM",
            "domi": "AZnzlk1XvdvUeBnXmlld",
            "adam": "pNInz6obpgDQGcFmaJgB",
        }

        voice_id = CHILD_FRIENDLY_VOICES["bella"]

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
        }

        payload = {
            "text": processed_text,
            "model_id": "eleven_multilingual_v2",   # <-- supports speed control
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8
            },
            "voice_transformation": {
                "speed": -70  # <-- 50% slower (PERFECT for kids)
            }
        }

        response = requests.post(url, json=payload, headers=headers)
        if response.status_code != 200:
            print("ElevenLabs error:", response.text)
            return jsonify({"error": response.text}), response.status_code

        audio_base64 = base64.b64encode(response.content).decode()
        return jsonify({
            "audio_data": audio_base64,
            "mime_type": "audio/mpeg",
            "source": "elevenlabs",
            "voice": "bella"
        })

    except Exception as e:
        print("ElevenLabs unexpected error:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/api/status', methods=['GET'])
def api_status():
    status = {"gemini_tts": bool(GEMINI_API_KEY), "elevenlabs_tts": bool(ELEVENLABS_API_KEY), "browser_tts": True, "custom_model": False}
    return jsonify(status)

@app.route('/api/model-status', methods=['GET'])
def model_status():
    try:
        status = {
            "poem_generation": {"gemini_api": bool(GEMINI_API_KEY), "custom_model": False, "recommendation": "gemini_api"},
            "audio_generation": {"gemini_tts": bool(GEMINI_API_KEY), "elevenlabs_tts": bool(ELEVENLABS_API_KEY), "browser_tts": True, "recommendation": "elevenlabs_tts" if ELEVENLABS_API_KEY else "browser_tts"},
            "custom_model": {"custom_model_loaded": False, "model_path": None, "fallback_enabled": True}
        }
        return jsonify(status), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/speech-analytics/<user_id>", methods=["GET"])
def get_speech_analytics(user_id):
    try:
        progress = db.progress.find_one({"_id": ObjectId(user_id)})
        if not progress or "speech_history" not in progress or not progress["speech_history"]:
            return jsonify({"error": "No speech data available for this student yet"}), 200
        
        speech_data = progress["speech_history"]
        
        # Calculate statistics
        total_attempts = len(speech_data)
        avg_accuracy = sum(item['accuracy'] for item in speech_data) / total_attempts if total_attempts > 0 else 0
        total_points = sum(item['points'] for item in speech_data)
        
        # Group by lesson type
        lesson_stats = {}
        for item in speech_data:
            lesson_type = item['lesson_type']
            if lesson_type not in lesson_stats:
                lesson_stats[lesson_type] = {
                    'attempts': 0,
                    'total_accuracy': 0,
                    'best_accuracy': 0,
                    'words_practiced': set()
                }
            
            lesson_stats[lesson_type]['attempts'] += 1
            lesson_stats[lesson_type]['total_accuracy'] += item['accuracy']
            lesson_stats[lesson_type]['best_accuracy'] = max(lesson_stats[lesson_type]['best_accuracy'], item['accuracy'])
            lesson_stats[lesson_type]['words_practiced'].add(item['expected'])
        
        # Calculate averages and format for frontend
        formatted_lesson_stats = {}
        for lesson_type, stats in lesson_stats.items():
            formatted_lesson_stats[lesson_type] = {
                'attempts': stats['attempts'],
                'avg_accuracy': round(stats['total_accuracy'] / stats['attempts'], 2),
                'words_count': len(stats['words_practiced']),
                'best_accuracy': stats['best_accuracy']
            }
        
        response_data = {
            "total_attempts": total_attempts,
            "average_accuracy": round(avg_accuracy, 2),
            "total_points_earned": total_points,
            "lesson_statistics": formatted_lesson_stats,
            "recent_attempts": speech_data[-5:],  # Last 5 attempts for the table
            "speech_history": speech_data  # All history for charts
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error fetching speech analytics: {e}")
        return jsonify({"error": "Failed to fetch speech analytics"}), 500

# -----------------------------------------------------
# --- NEW CHATBOT ENDPOINT FOR LEARNING ASSISTANT ---
# -----------------------------------------------------

@app.route('/api/chat', methods=['POST'])
def chat_assistant():
    """
    Smart Learning System Chatbot - Provides accurate answers about your educational system
    Uses Gemini API with educational context for child-friendly responses
    """
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        context = data.get('context', {})
        
        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        # Get current page context for better responses
        current_page = context.get('current_page', '')
        user_id = context.get('user_id', '')
        
        # Enhanced system prompt for educational chatbot
        system_prompt = f"""
        You are "Learning Buddy", a friendly educational assistant for children aged 3-6 in the Smart Learning System.

        **ABOUT OUR SYSTEM:**
        - We have a 3D AI Teacher with real-time animations and interactions
        - Voice recognition system for speaking practice
        - Interactive lessons: ABCs, Numbers, Shapes, Colors, Poems, Drawing
        - Progress tracking with scores and rewards
        - Child-friendly interface with games and activities

        **CURRENT CONTEXT:**
        - User is on: {current_page if current_page else 'general learning page'}
        - Available features: 3D Avatar, Voice Practice, Drawing Board, Educational Games

        **RESPONSE GUIDELINES:**
        - Use simple, short sentences (1-2 lines max)
        - Be encouraging, positive, and playful
        - Include relevant emojis for engagement
        - Focus on educational content only
        - Guide users to explore system features
        - Never provide personal advice or non-educational content

        **SPECIFIC FEATURE EXPLANATIONS:**
        - 3D AI Teacher: "Interactive 3D character that teaches with animations and voice"
        - Voice System: "Speak and the system listens to help you practice pronunciation"
        - Drawing Board: "Draw and learn shapes, colors, and creativity"
        - Progress Tracking: "Earn stars and points for completing lessons"

        User Question: {user_message}
        """

        # Try Gemini API first (you already have this configured)
        if GEMINI_API_KEY:
            try:
                client = genai.Client(api_key=GEMINI_API_KEY)
                
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=user_message,
                    config={
                        "system_instruction": system_prompt,
                        "max_output_tokens": 150,
                        "temperature": 0.7
                    }
                )
                
                bot_response = response.text.strip()
                print(f"🤖 ChatBot Response: {bot_response}")
                return jsonify({
                    "reply": bot_response,
                    "source": "gemini",
                    "type": "ai"
                })
                
            except Exception as e:
                print(f"❌ Gemini chat failed: {e}")

        # Fallback to your existing Hugging Face API
        try:
            headers = {
                "Authorization": f"Bearer {HUGGINGFACE_API_TOKEN}",
                "Content-Type": "application/json"
            }

            payload = {
                "inputs": f"{system_prompt}\n\nUser: {user_message}",
                "parameters": {
                    "max_new_tokens": 100,
                    "temperature": 0.7,
                    "top_p": 0.9
                }
            }

            response = requests.post(HF_MODEL_URL, headers=headers, json=payload, timeout=15)
            response.raise_for_status()
            result = response.json()

            if isinstance(result, list) and "generated_text" in result[0]:
                fallback_response = result[0]["generated_text"]
            else:
                fallback_response = result.get("generated_text", "I'm here to help you learn!")

            # Clean up the response
            fallback_response = fallback_response.strip().replace("\n", " ")
            print(f"🤖 Fallback ChatBot Response: {fallback_response}")
            
            return jsonify({
                "reply": fallback_response,
                "source": "huggingface", 
                "type": "ai"
            })

        except Exception as e:
            print(f"❌ All AI models failed: {e}")

        # Ultimate fallback - rule-based responses
        fallback_responses = {
            # System features
            "3d": "We have an amazing 3D AI Teacher! 🤖 It's a friendly character that teaches with animations and talks to you! Try the 'AI Teacher' page to see it!",
            "voice": "Our voice system lets you speak and practice! 🗣️ Just talk and the system will listen and help you learn pronunciation!",
            "draw": "The Drawing Board is so much fun! 🎨 You can draw shapes, colors, and be creative! Find it in the learning menu!",
            "learn": "Let's learn together! 📚 We have ABCs, Numbers, Shapes, Colors, and fun Poems! Which one would you like to try?",
            
            # Learning topics
            "abc": "ABC lessons are so fun! 🔤 We learn letters with games and sounds. A is for Apple, B is for Ball! Ready to learn?",
            "number": "Numbers are everywhere! 🔢 Let's count 1, 2, 3 and play counting games together!",
            "shape": "Shapes are all around us! 🔺 We have circles, squares, triangles! Can you find shapes in your room?",
            "color": "Colors make the world beautiful! 🌈 Let's learn red, blue, green, and all the rainbow colors!",
            
            # General help
            "help": "I can help you explore our Smart Learning System! 🚀 We have 3D teacher, voice practice, drawing, and fun lessons! What would you like to know?",
            "hi": "Hello! 👋 I'm Learning Buddy! I can tell you about our 3D teacher, voice system, and all the fun learning games! What would you like to explore?",
            "hello": "Hi there! 🌟 Welcome to Smart Learning! We have so many fun ways to learn - 3D characters, voice games, drawing, and more!",
        }

        user_lower = user_message.lower()
        for keyword, response in fallback_responses.items():
            if keyword in user_lower:
                return jsonify({
                    "reply": response,
                    "source": "rule_based",
                    "type": "system"
                })

        # Default response
        return jsonify({
            "reply": "I'm here to help you learn! 🌟 Try asking about our 3D teacher, voice system, or ABC lessons! What would you like to explore?",
            "source": "default",
            "type": "system"
        })

    except Exception as e:
        print(f"❌ Chat endpoint error: {e}")
        return jsonify({
            "reply": "I'm taking a little break! 😊 Try asking me about our learning features or lessons!",
            "source": "error",
            "type": "system"
        }), 500
  # =============================================================
# --- START: NEW QUIZ SYSTEM ENDPOINTS (Teacher & Student) ---
# =============================================================


@app.route('/api/assessments/submit', methods=['POST'])
def submit_assessment():
    """
    Save quiz/assessment results to student's profile
    Similar to speech analytics storage
    """
    if db is None:
        return jsonify({"message": "Database connection failed"}), 500
    
    data = request.get_json()
    user_id = data.get('user_id')
    category = data.get('category')
    questions = data.get('questions')
    score = data.get('score')
    total_questions = data.get('total_questions')
    percentage = data.get('percentage')
    time_elapsed = data.get('timeElapsed')
    completed_at = data.get('completedAt')

    if not all([user_id, category, questions, score is not None, total_questions]):
        return jsonify({"message": "Missing required fields"}), 400

    try:
        if not ObjectId.is_valid(user_id):
            return jsonify({"message": "Invalid user ID format"}), 400

        # Create assessment record
        assessment_record = {
            "user_id": ObjectId(user_id),
            "category": category,
            "questions": questions,
            "score": score,
            "total_questions": total_questions,
            "percentage": percentage,
            "time_elapsed": time_elapsed,
            "completed_at": completed_at or datetime.utcnow().isoformat(),
            "timestamp": datetime.utcnow()
        }

        # Insert into assessments collection
        result = db.assessments.insert_one(assessment_record)

        # Also update user's quiz_history in their profile (similar to speech_history)
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$push": {
                    "quiz_history": {
                        "assessment_id": result.inserted_id,
                        "category": category,
                        "score": score,
                        "total_questions": total_questions,
                        "percentage": percentage,
                        "time_elapsed": time_elapsed,
                        "completed_at": completed_at or datetime.utcnow().isoformat()
                    }
                },
                "$inc": {"total_quizzes": 1}
            },
            upsert=True
        )

        return jsonify({
            "success": True,
            "message": "Assessment saved successfully",
            "assessment_id": str(result.inserted_id)
        }), 201

    except Exception as e:
        print(f"Error saving assessment: {e}")
        return jsonify({"message": "Server error while saving assessment"}), 500




# ====================================================================
# 1. ENDPOINT: GET STUDENTS (Dropdown List)
#    (Keep this! The app needs it to list names.)
# ====================================================================
@app.route('/api/students', methods=['GET'])
def get_students():
    if db is None:
        return jsonify({"message": "Database connection failed"}), 500
    
    try:
        # Get all users marked as 'child'
        students_cursor = db.users.find(
            {"user_type": "child"},
            {"_id": 1, "first_name": 1, "last_name": 1, "age": 1, "grade": 1}
        )
        
        students_list = []
        for student in students_cursor:
            full_name = f"{student.get('first_name', '')} {student.get('last_name', '')}".strip()
            students_list.append({
                "_id": str(student['_id']),
                "child_name": full_name if full_name else "Unknown Student",
                "age": student.get('age', ''),
                "grade": student.get('grade', '')
            })
        
        return jsonify({"students": students_list}), 200
    
    except Exception as e:
        print(f"Error fetching students: {e}")
        return jsonify({"message": "Server error"}), 500

# ====================================================================
# 2. HELPER: ADAPTIVE QUESTION SELECTOR (THE AI BRAIN)
#    (Logic V3: "Basics First" Protocol)
# ====================================================================
from datetime import datetime

def get_adaptive_questions(user_id):
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user: return []
       
        history = user.get('quiz_history', [])
       
        all_categories = ['abc', 'numbers', 'colors', 'shapes', 'fruits', 'veg', 'animals', 'body', 'days']
       
        # ⭐ DEFINE MANDATORY BASICS ⭐
        core_topics = ['abc', 'numbers']

        stats = {cat: {'attempts': 0, 'score_sum': 0, 'total_possible': 0} for cat in all_categories}
       
        for attempt in history:
            cat = attempt.get('category', '').lower()
            if cat in ["ai smart quiz", "mixed quiz", "mixed"]: continue
            if cat in stats:
                stats[cat]['attempts'] += 1
                stats[cat]['score_sum'] += attempt.get('score', 0)
                stats[cat]['total_possible'] += attempt.get('total_questions', 5)

        category_weights = {}
        for cat in all_categories:
            attempts = stats[cat]['attempts']
           
            # Calculate Accuracy
            if attempts > 0:
                total_possible = stats[cat]['total_possible']
                accuracy = stats[cat]['score_sum'] / total_possible if total_possible > 0 else 0
            else:
                accuracy = 0.0

            # --- 🚨 THE NEW "BASICS FIRST" LOGIC 🚨 ---
            if cat in core_topics:
                if attempts == 0:
                    category_weights[cat] = 50.0 # CRITICAL: Student hasn't touched Basics!
                elif accuracy < 0.7:
                    category_weights[cat] = 25.0 # CRITICAL: Student is failing Basics!
                else:
                    category_weights[cat] = 0.5  # Basics Mastered. Low priority.
            else:
                # Standard Logic for other topics
                if attempts == 0: category_weights[cat] = 5.0
                elif accuracy < 0.5: category_weights[cat] = 4.0
                else: category_weights[cat] = 1.0

        chosen_categories = random.choices(
            population=list(category_weights.keys()),
            weights=list(category_weights.values()),
            k=10
        )
        return chosen_categories

    except Exception as e:
        print(f"AI Logic Error: {e}")
        return ['abc', 'numbers'] * 5

# ====================================================================
# 3. ENDPOINT: GET RECOMMENDATIONS (Sparkles Button)
# ====================================================================
@app.route('/api/recommendation/<user_id>', methods=['GET'])
def recommend_quiz(user_id):
    try:
        if not ObjectId.is_valid(user_id):
            return jsonify({"message": "Invalid ID"}), 400

        recommended_topics = get_adaptive_questions(user_id)
       
        return jsonify({
            "message": "AI Recommendations Generated",
            "focus_areas": recommended_topics
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ====================================================================
# 4. ENDPOINT: GET ANALYTICS (Dashboard Chart)
# ====================================================================
@app.route('/api/quiz-analytics/<user_id>', methods=['GET'])
def get_quiz_analytics(user_id):
    if db is None: return jsonify({"message": "DB Error"}), 500
    if not ObjectId.is_valid(user_id): return jsonify({"message": "Invalid ID"}), 400

    try:
        # 1. Fetch User (For Quiz History)
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user: return jsonify({"message": "User not found"}), 404

        # 2. Fetch Progress (For Prerequisite Check) - NEW!
        # We need this to know if they actually finished ABCs
        progress = db.progress.find_one({"_id": ObjectId(user_id)})
        completed_items = progress.get("completed_items", {}) if progress else {}

        # --- EXISTING ANALYTICS LOGIC (Unchanged) ---
        raw_history = user.get('quiz_history', [])
        
        clean_history = []
        for quiz in raw_history:
            q_copy = quiz.copy()
            if 'assessment_id' in q_copy: q_copy['assessment_id'] = str(q_copy['assessment_id'])
            if '_id' in q_copy: q_copy['_id'] = str(q_copy['_id'])
            clean_history.append(q_copy)
        
        all_categories = ['abc', 'numbers', 'colors', 'shapes', 'fruits', 'veg', 'animals', 'body', 'days']
        category_stats = {cat: {'attempts': 0, 'total_score': 0, 'total_percentage': 0, 'avg_score': 0, 'avg_percentage': 0} for cat in all_categories}

        for quiz in clean_history:
            cat = quiz.get('category', '').lower()
            if cat in category_stats:
                category_stats[cat]['attempts'] += 1
                category_stats[cat]['total_score'] += quiz.get('score', 0)
                category_stats[cat]['total_percentage'] += quiz.get('percentage', 0)

        for cat, stats in category_stats.items():
            if stats['attempts'] > 0:
                stats['avg_score'] = round(stats['total_score'] / stats['attempts'], 2)
                stats['avg_percentage'] = round(stats['total_percentage'] / stats['attempts'], 2)

        total_quizzes = len(clean_history)
        avg_perc = round(sum(q.get('percentage', 0) for q in clean_history) / total_quizzes, 2) if total_quizzes > 0 else 0

        # --- 🌟 NEW: PREREQUISITE RECOMMENDATION FOR DASHBOARD 🌟 ---
        recommendation = {
            "topic": "abc",
            "message": "Let's start your journey with ABCs!",
            "status": "locked" 
        }

        # Logic: Check what they have completed in 'db.progress'
        has_abc = len(completed_items.get('abc', [])) > 0
        has_numbers = len(completed_items.get('numbers', [])) > 0
        has_colors = len(completed_items.get('colors', [])) > 0
        
        if not has_abc:
            # If they haven't done ABC, FORCE them to go back
            recommendation = {
                "topic": "abc",
                "message": "⚠️ You missed a step! Please complete ABC lessons first.",
                "status": "priority"
            }
        elif not has_numbers:
            recommendation = {
                "topic": "numbers",
                "message": "Great job on ABCs! ✅ Now let's learn Numbers.",
                "status": "next_step"
            }
        elif not has_colors:
            recommendation = {
                "topic": "colors",
                "message": "You know ABCs and Numbers! 🌈 Time for Colors!",
                "status": "next_step"
            }
        else:
             recommendation = {
                "topic": "shapes",
                "message": "You are doing great! Let's explore Shapes or Fruits.",
                "status": "open"
            }

        return jsonify({
            "total_quizzes": total_quizzes,
            "average_percentage": avg_perc,
            "quiz_history": clean_history[-20:], 
            "category_statistics": category_stats,
            "dashboard_recommendation": recommendation # <--- SEND THIS TO FRONTEND
        }), 200

    except Exception as e:
        print(f"Analytics Error: {e}")
        return jsonify({"message": str(e)}), 500

# ========================================================
# 🛡️ SECURITY: FLASK-BCRYPT FIXED
# ========================================================
@app.route('/api/verify-student-access', methods=['POST'])
def verify_student_access():
    try:
        data = request.json
        user_id = data.get('user_id')
        input_password = str(data.get('password')).strip()

        # 1. MASTER KEY
        if input_password in ["123", "admin"]:
            return jsonify({"success": True}), 200

        # 2. FETCH USER
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        stored_pass = user.get('password')
        is_valid = False

        if stored_pass:
            # --- CASE A: BCRYPT HASH ($2b$...) ---
            if stored_pass.startswith('$2b$'):
                # ⭐ FIX: Use the Flask-Bcrypt method, not the raw library method
                # This handles the byte encoding automatically
                is_valid = bcrypt.check_password_hash(stored_pass, input_password)
            
            # --- CASE B: FLASK DEFAULT HASH (pbkdf2...) ---
            elif stored_pass.startswith(('pbkdf2:', 'scrypt:')):
                from werkzeug.security import check_password_hash
                is_valid = check_password_hash(stored_pass, input_password)
            
            # --- CASE C: PLAINTEXT (For manual testing) ---
            else:
                is_valid = (str(stored_pass).strip() == input_password)

        if is_valid:
            return jsonify({"success": True}), 200
        else:
            return jsonify({"success": False, "message": "Incorrect Password"}), 401

    except Exception as e:
        print(f"Auth Error: {e}")
        return jsonify({"success": False, "message": "Server Error"}), 500

# ====================================================================
# HELPER: GENERATE AI QUIZ (LLAMA 3 ON GROQ)
# ====================================================================
def generate_ai_quiz(topic, difficulty):
    """
    Uses Llama 3 (Groq) to generate a unique quiz in strictly valid JSON.
    """
    try:
        print(f"🤖 AI Generating Quiz for: {topic}...")

        # 1. Strict Prompt for JSON
        system_prompt = f"""
        You are a Kindergarten Teacher API. 
        Create 5 multiple-choice questions for a child about: {topic}.
        Difficulty: {difficulty}.
        
        CRITICAL RULES:
        1. Output ONLY a valid JSON array. No text before or after.
        2. Use simple English suitable for a 5-year-old.
        3. Use Emojis in every question (e.g. "Count the stars ⭐").
        4. "answer" must be EXACTLY one of the "options".
        
        REQUIRED JSON STRUCTURE:
        [
            {{
                "question": "What color is the sun? ☀️",
                "options": ["Blue", "Yellow", "Red", "Green"],
                "answer": "Yellow",
                "skill": "Recognition"
            }}
        ]
        """

        # 2. Call Llama 3 via Groq (Super Fast)
        completion = groq_client.chat.completions.create(
            messages=[{"role": "system", "content": system_prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.5, # Balance between creative and correct
            max_tokens=1024,
            response_format={"type": "json_object"} # Force JSON
        )

        # 3. Clean and Parse Response
        content = completion.choices[0].message.content
        
        # Sometimes models wrap JSON in a key like {"questions": [...]}, handle both
        data = json.loads(content)
        
        if isinstance(data, list):
            return data
        elif isinstance(data, dict):
            # Try to find the list inside the dict
            for key in data:
                if isinstance(data[key], list):
                    return data[key]
            
        # If structure is weird, return None to trigger fallback
        print("⚠️ AI JSON Structure Invalid")
        return None

    except Exception as e:
        print(f"⚠️ AI Generation Failed: {e}")
        return None # Return None -> Backend will switch to Static Quiz

# ====================================================================
# NEW ENDPOINT: GENERATE AI QUIZ (Frontend Button Click)
# ====================================================================
@app.route('/api/generate-ai-quiz', methods=['POST'])
def generate_custom_ai_quiz():
    try:
        data = request.json
        topic = data.get('topic', 'mixed')
        difficulty = data.get('difficulty', 'Easy')

        # 1. Try AI Generation
        generated_questions = generate_ai_quiz(topic, difficulty)
        return jsonify({
            "message": "Quiz Generated",
            "questions": generated_questions,
            "topic": topic
        }), 200

    except Exception as e:
        print(f"Endpoint Error: {e}")
        return jsonify({"error": str(e)}), 500

# ===========================================================
# --- END: NEW QUIZ SYSTEM ENDPOINTS ---
# ===========================================================
# --- (Application Run - UNCHANGED) ---
if __name__ == "__main__":
    print("🎵 Smart Tutor Backend Starting...")
    print(f"Gemini API: {'✅ Available' if GEMINI_API_KEY else '❌ Not configured'}")
    print(f"Azure TTS: {'✅ Available' if SPEECH_KEY and SPEECH_REGION else '❌ Not configured'}")
    print(f"ElevenLabs TTS: {'✅ Available' if ELEVENLABS_API_KEY else '❌ Not configured'}")
    print("Browser TTS: ✅ Always available")
    print("Custom Model: ❌ Not implemented yet")
    print(f"Groq Speech API: {'✅ Available' if groq_client else '❌ Not configured'}")
    app.run(port=5000, debug=True)