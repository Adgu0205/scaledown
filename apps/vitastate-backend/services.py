from fastapi import APIRouter, Header, Body, UploadFile, File
from pypdf import PdfReader
from io import BytesIO
from pydantic import BaseModel
import os
import requests
import json
import random
from datetime import datetime
from uuid import uuid4

# ScaleDown Integration
try:
    from scaledown import ScaleDownCompressor
except ImportError:
    ScaleDownCompressor = None

router = APIRouter()

SCALEDOWN_API_KEY = os.getenv("SCALEDOWN_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Initialize Compressor securely
compressor = None
if ScaleDownCompressor and SCALEDOWN_API_KEY:
    try:
        compressor = ScaleDownCompressor(api_key=SCALEDOWN_API_KEY)
    except Exception as e:
        print(f"ScaleDown Init Error: {e}")

# --- Data Models ---

class UserProfile(BaseModel):
    name: str = "User"
    age: int = 30
    height_cm: float = 170.0
    weight_kg: float = 70.0
    bmi: float = 24.2

class WorkoutLog(BaseModel):
    name: str
    duration: int
    intensity: str
    date: str
    source: str = "ai"
    notes: str = None

class JournalEntry(BaseModel):
    date: str
    mood: str
    food: str
    sleep: str
    notes: str = None
    insight: str = None

class DailyContext(BaseModel):
    goal: str
    journal: JournalEntry
    workouts: list = []

class PrescriptionSummary(BaseModel):
    overview: str
    purpose: str
    notes: str
    suggestion: str = None

class ManualEntryInput(BaseModel):
    appointment_date: str
    provider: str
    details: str

class Prescription(BaseModel):
    id: str
    upload_date: str
    appointment_date: str
    provider: str
    details: str
    status: str
    summary: PrescriptionSummary

# --- In-Memory Stores ---
user_store = {}
workout_store = []
journal_store = {}
prescription_store = []

# --- AI Helper Functions ---

def query_llm(system_prompt: str, user_prompt: str, temperature: float = 0.7) -> dict:
    """
    Queries OpenRouter LLM with JSON enforcement.
    Fallback to static safe response on error.
    """
    if not OPENROUTER_API_KEY:
        print("CRITICAL: Missing OpenRouter Key in environment variables.")
        return None

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173", # Required by OpenRouter
        "X-Title": "VitaState"
    }

    payload = {
        "model": "google/gemini-2.0-flash-001",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": temperature,
        "max_tokens": 2500
    }

    print(f"--- LLM REQUEST ---\nPayload: {json.dumps(payload, indent=2)}")

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=15 # Increased timeout
        )
        
        if response.status_code != 200:
            print(f"LLM API Error: Status {response.status_code}, Body: {response.text}")
            response.raise_for_status()
            
        data = response.json()
        content = data['choices'][0]['message']['content']
        print(f"--- LLM RESPONSE ---\nContent: {content}")
        
        parsed = json.loads(content)
        return parsed
    except json.JSONDecodeError as je:
        print(f"LLM JSON Parse Error: {je} | Content was: {content}")
        return None
    except Exception as e:
        print(f"LLM Query Exception: {e}")
        return None

def safe_compress_history(context_list: list, prompt: str) -> str:
    """Attempts to use ScaleDown, falls back to simple concatenation."""
    if compressor:
        try:
            result = compressor.compress(context=context_list, prompt=prompt)
            return result.content
        except Exception as e:
            print(f"Compression failed: {e}")
    
    # Fallback: Last 5 entries + count
    summary = f"Recent History ({len(context_list)} items): " + "; ".join(context_list[-5:])
    return summary

def get_goal_context(goal: str):
    g = goal.lower() if goal else ""
    if "muscle" in g or "gain" in g or "hypertrophy" in g: return "hypertrophy"
    if "fat" in g or "loss" in g or "lose" in g or "weight" in g: return "fat_loss"
    return "general_health"

# --- API Endpoints ---

@router.get("/health-data")
def get_health_data(token: str = Header(None, alias="Authorization")):
    """Fetches real or mock activity data."""
    if not token or "mock" in token:
        return {
            "steps": 8500,
            "calories": 2100,
            "active_minutes": 45,
            "summary": "Step goal functionality active."
        }
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get("https://api.fitbit.com/1/user/-/activities/date/today.json", headers=headers)
        response.raise_for_status()
        data = response.json()
        summary = data.get("summary", {})
        return {
            "steps": summary.get("steps", 0),
            "calories": summary.get("caloriesOut", 0),
            "active_minutes": summary.get("fairlyActiveMinutes", 0) + summary.get("veryActiveMinutes", 0),
            "summary": "Data synced from Fitbit."
        }
    except Exception:
        return {"steps": 0, "calories": 0, "active_minutes": 0, "error": "Sync failed"}

@router.post("/dashboard-insights")
def dashboard_insights(
    user_data: UserProfile = Body(...),
    goals: str = Body(...),
    conditions: list = Body(default=[]),
    activity_data: dict = Body(default={})
):
    """
    Dashboard Agent: AI-Driven.
    """
    # System Prompt: PERSONA + RULES
    system_prompt = (
        "You are 'Vita', a calm, observational fitness coach. "
        "Analyze the user's data and generating insights. "
        "STRICT SAFETY RULES: "
        "1. Never diagnose or give medical advice. "
        "2. Never make absolute claims about the user's health (use 'suggests', 'may', 'appears'). "
        "3. Output valid JSON with keys: 'body_insight', 'activity_insight', 'nutrition_insight', 'overview'. "
        "Keep insights under 20 words each. Overview under 40 words."
    )

    user_prompt = f"""
    Profile: Age {user_data.age}, BMI {user_data.bmi:.1f}
    Goal: {goals}
    Conditions: {', '.join(conditions) if conditions else 'None'}
    Activity Level: {activity_data.get('level', 'Unknown')}
    Sleep Reported: {activity_data.get('sleep', 'Unknown')}
    Diet Pref: {activity_data.get('diet', 'Unknown')}
    Allergies: {', '.join(activity_data.get('allergies', []))}
    """

    result = query_llm(system_prompt, user_prompt)

    if not result:
        # Fallback Heuristic
        return {
            "body_insight": "Your metrics provide a baseline for progress.",
            "activity_insight": "Consistency in movement is key.",
            "nutrition_insight": "Focus on nutrient-dense foods aligned with your preferences.",
            "overview": f"Your primary focus is {goals}. Small consistent steps will yield results."
        }
    
    return result


# --- Taste Memory Store ---
taste_memory_store = {
    "default_user": {"likes": [], "dislikes": [], "neutral": []}
}

class RateMealRequest(BaseModel):
    meal_name: str
    rating: str  # 'like', 'neutral', 'dislike'
    user_id: str = "default_user"

@router.post("/rate-meal")
def rate_meal(request: RateMealRequest):
    user_mem = taste_memory_store.setdefault(request.user_id, {"likes": [], "dislikes": [], "neutral": []})
    
    # Remove from all lists first to avoid duplicates/conflicts
    for key in ["likes", "dislikes", "neutral"]:
        if request.meal_name in user_mem[key]:
            user_mem[key].remove(request.meal_name)
    
    if request.rating == "like":
        user_mem["likes"].append(request.meal_name)
    elif request.rating == "dislike":
        user_mem["dislikes"].append(request.meal_name)
    elif request.rating == "neutral":
        user_mem["neutral"].append(request.meal_name)
        
    return {"status": "success", "memory": user_mem}

def get_diet_compliant_fallback(diet: str, goal: str) -> dict:
    """
    Returns strictly compliant fallback meals based on diet type.
    SCOPE: EXACTLY 2 OPTIONS per meal.
    """
    d = diet.lower()
    is_veg = "vegetarian" in d or "vegan" in d
    is_vegan = "vegan" in d

    if is_vegan:
        return {
            "intro": f"A purely plant-based plan to fuel your {goal}. Focuses on complete proteins and nutrient density without any animal products.",
            "meals": {
                "Breakfast": [
                    "Option 1: Scrambled Tofu with nutritional yeast and spinach",
                    "Option 2: Spiced Vegetable Poha with peanuts"
                ],
                "Lunch": [
                    "Option 1: Quinoa & Black Bean Burrito Bowl with guacamole",
                    "Option 2: Lentil Soup (Dal) with brown rice"
                ],
                "Dinner": [
                    "Option 1: Stuffed Bell Peppers with savory rice and beans",
                    "Option 2: Vegetable Stir-fry with tempeh"
                ],
                "Snack": [
                    "Option 1: Roasted Fox Nuts (Makhana)",
                    "Option 2: Apple slices with peanut butter"
                ]
            },
            "type": "Strict Vegan Fallback"
        }
    
    if is_veg:
        return {
            "intro": f"A tailored vegetarian plan for {goal}. Balances dairy and plant proteins to keep you satisfied.",
            "meals": {
                "Breakfast": [
                    "Option 1: Paneer Bhurji (Scrambled Cottage Cheese) with toast",
                    "Option 2: Greek Yogurt Parfait with granola"
                ],
                "Lunch": [
                    "Option 1: Paneer Tikka Salad with mint chutney",
                    "Option 2: Lentil & Spinach Stew (Dal Palak) with rice"
                ],
                "Dinner": [
                    "Option 1: Palak Paneer with roti",
                    "Option 2: Vegetable & Bean Burrito with cheese"
                ],
                "Snack": [
                    "Option 1: Greek Yogurt with honey",
                    "Option 2: Cheese slices with apple"
                ]
            },
            "type": "Strict Vegetarian Fallback"
        }

    # Non-Vegetarian (Standard)
    return {
        "intro": f"This plan determines the best fuel for your {goal}, balancing proteins from various sources.",
        "meals": {
            "Breakfast": [
                "Option 1: Scrambled Eggs with spinach and smoked salmon",
                "Option 2: Greek Yogurt Parfait with berries"
            ],
            "Lunch": [
                "Option 1: Grilled Chicken Breast with Roasted Sweet Potato",
                "Option 2: Minced Turkey & Quinoa Bowl"
            ],
            "Dinner": [
                "Option 1: Baked Salmon with steamed asparagus",
                "Option 2: Lean Beef Stir-fry with broccoli"
            ],
            "Snack": [
                "Option 1: Whey Protein Shake",
                "Option 2: Jerky (Beef or Turkey)"
            ]
        },
        "type": "Standard High-Protein Fallback"
    }

@router.post("/nutrition-plan")
def generate_nutrition_plan(
    goal: str = Body(...),
    diet: str = Body("Non-vegetarian"),
    allergies: list = Body([]),
    user_info: dict = Body({}, description="age, sex, weight, height"),
    activity_level: str = Body("Sedentary"),
    taste_memory: dict = Body({}, description="likes, dislikes")
):
    """
    Nutrition Agent: Strict Diet Compliance & Feedback Learning.
    """
    # Merge client usage with server store if needed, currently preferring server store for persistence
    # In a real app we'd merge, but here we can just verify against the store.
    server_memory = taste_memory_store.get("default_user", {"likes": [], "dislikes": []})
    
    # Combined Dislikes (Client + Server)
    all_dislikes = list(set(taste_memory.get('dislikes', []) + server_memory['dislikes']))
    all_likes = list(set(taste_memory.get('likes', []) + server_memory['likes']))

    system_prompt = (
        "You are the Nutrition Tracking and Meal Planning Agent for Vita-state.\n"
        "This is a HARD CONTRACT. Any output that violates diet, allergies, or rules is INVALID.\n\n"
        "CORE OBJECTIVE:\n"
        "Generate daily nutrition plans that:\n"
        "- Respect the user’s diet type, primary goal, health conditions, allergies, and preferences\n"
        "- Are culturally Indian-oriented by default (unless explicitly overridden)\n"
        "- Provide exactly two options per meal category\n"
        "- Adapt over time using user ratings and taste memory\n"
        "- Avoid generic Western gym-diet patterns unless appropriate\n\n"
        "CULTURAL ORIENTATION RULE (CRITICAL):\n"
        "The default food context is Indian.\n"
        "- Primary meal ideas should come from: Indian home cooking, Regional Indian cuisines, Simple tiffin-style meals.\n"
        "- Western meals may appear ONLY if: They align with user taste memory OR fit the user’s goal clearly.\n"
        "- Protein powders, smoothies, granola bowls, and gym-style meals must NOT be default choices.\n\n"
        "DIET TYPE ENFORCEMENT (HARD CONSTRAINT):\n"
        "1. Vegetarian: Exclude all meat, poultry, fish, seafood, meat broths, gelatin.\n"
        "2. Vegan: Exclude all animal products including dairy, eggs, honey.\n"
        "3. Non-Vegetarian: Animal products are allowed. MUST suggest a mix. MANDATORY: Include at least one meat/fish/egg option per meal category (Lunch/Dinner).\n\n"
        "ALLERGY AND HEALTH CONDITION ENFORCEMENT:\n"
        "Allergies and health conditions are absolute constraints. If a food conflicts with allergies or known conditions, it must NOT appear.\n\n"
        "PRIMARY GOAL AWARENESS:\n"
        "- Lose fat: Focus on satiety, fiber, portion control, lighter dinners.\n"
        "- Gain muscle: Ensure protein presence in every meal (Use Indian protein sources: paneer, dal, curd, soy, legumes, eggs).\n"
        "- Improve fitness: Balance carbohydrates and protein.\n"
        "- Improve sleep/recovery: Lighter dinners, easy-to-digest foods.\n\n"
        "USER TASTE MEMORY:\n"
        f"- Disliked Meals (NEVER INCLUDE): {all_dislikes}\n"
        f"- Liked Meals (PRIORITIZE): {all_likes}\n\n"
        "OUTPUT FORMAT (STRICT JSON):\n"
        "You must output valid JSON with the following structure. The 'intro' field should contain the 'Explanation Block' describing how the plan fits the goal and diet.\n"
        "{\n"
        "  \"intro\": \"2-3 sentences explaining the plan (Goal, Diet, Indian orientation).\",\n"
        "  \"meals\": {\n"
        "    \"Breakfast\": [\"Option 1: ...\", \"Option 2: ...\"],\n"
        "    \"Lunch\": [\"Option 1: ...\", \"Option 2: ...\"],\n"
        "    \"Dinner\": [\"Option 1: ...\", \"Option 2: ...\"],\n"
        "    \"Snack\": [\"Option 1: ...\", \"Option 2: ...\"]\n"
        "  },\n"
        "  \"type\": \"Indian Personalized\"\n"
        "}"
    )

    user_prompt = f"""
    MANDATORY USER DATA:
    Age: {user_info.get('age')}
    Sex: {user_info.get('sex')}
    Height: {user_info.get('height')}
    Weight: {user_info.get('weight')}
    Activity Level: {activity_level}
    Primary Goal: {goal}
    Diet Type: {diet}
    Allergies: {allergies}
    Taste Memory Likes: {all_likes}
    Taste Memory Dislikes: {all_dislikes}
    """

    result = query_llm(system_prompt, user_prompt)

    if not result:
        # Use STRICT DYNAMIC FALLBACK
        fallback = get_diet_compliant_fallback(diet, goal)
        return fallback

    return result

@router.post("/workout-plan")
def generate_workout_plan(
    goal: str = Body(...),
    activity_level: str = Body("Sedentary"),
    conditions: list = Body([]),
    user_info: dict = Body({}, description="age, sex, bmi, health_conditions"),
    sleep_history: list = Body([], description="Recent sleep data"),
    recent_workouts: list = Body([], description="Last 3 workouts"),
    equipment: str = Body("Bodyweight/Home", description="Available equipment"),
    time_available: str = Body("30-45 mins", description="Time per session")
):
    """
    Workout Agent: Advanced Personalized Tiles.
    """
    print(f"Generating Workout Plan for Goal: {goal}, Sleep History len: {len(sleep_history)}")

    # 1. Analyze Context State
    context_notes = []
    
    # Sleep Analysis
    avg_sleep = 7.0
    if sleep_history and len(sleep_history) > 0:
        avg_sleep = sum(d['hours'] for d in sleep_history) / len(sleep_history)
        if avg_sleep < 6.0:
            context_notes.append("SEVERE SLEEP DEFICIT: Force Low Intensity/Recovery/Mobility.")
        elif avg_sleep < 7.0:
            context_notes.append("MILD SLEEP DEFICIT: Avoid HIIT, focus on steady state or strength.")
        else:
            context_notes.append("GOOD SLEEP: Ready for High Intensity/Progressive Overload.")
    
    # Recovery Analysis
    last_exercises_context = "None"
    if recent_workouts:
        last = recent_workouts[-1]
        last_exercises_context = f"{last.get('name', 'Unknown')} ({last.get('date', '')})"
        context_notes.append(f"LAST WORKOUT: {last.get('name', 'Unknown')}. DO NOT REPEAT THIS.")

    # Goal Alignment
    if "lose" in goal.lower() or "fat" in goal.lower():
        context_notes.append("GOAL FAT LOSS: Prioritize metabolic demand, circuit style, high density.")
    elif "muscle" in goal.lower() or "gain" in goal.lower():
        context_notes.append("GOAL HYPERTROPHY: Prioritize time under tension, controlled reps, compound lifts.")
    
    context_str = " | ".join(context_notes)

    system_prompt = (
        "You are an advanced AI Fitness & Health Intelligence Engine.\n"
        f"CONTEXT ANALYSIS: {context_str}\n"
        "Your task: Generate a highly personalized workout session based on user data AND context.\n"
        "STRICT RULES:\n"
        "1. GENERATE EXACTLY TWO (2) WORKOUTS. No more, no less.\n"
        "2. SAFETY FIRST: If health conditions/injuries exist, STRICTLY modify exercises.\n"
        "3. ADAPT INTENSITY: If Context says Sleep Deficit, YOU MUST LOWER DIFFICULTY.\n"
        "4. ANTI-REPETITION: Do NOT suggest the exact same exercises as the 'Last Workout'. VARY the movements.\n"
        "5. DIET AWARE: If Vegetarian/Vegan, mention protein timing in 'details'.\n"
        "6. JSON OUTPUT MANDATORY: Return 'routine_name', 'description', 'ai_insight', and 'exercises' list.\n"
        "   - 'ai_insight': A string with 2-3 short paragraphs explaining WHY these 2 workouts were chosen based on goal, sleep, and recovery. Be supportive and specific.\n"
        "   - 'exercises': List of EXACTLY 2 exercise objects.\n"
        "   - Each exercise MUST have: 'name' (string), 'muscle' (target), 'type' (Strength/Cardio/Mobility), 'difficulty' (Beginner/Intermediate), 'duration_or_sets' (e.g. '3x10'), 'calories' (int est), and 'details' object.\n"
        "   - 'details' object MUST have: 'description' (string), 'steps' (list of strings), 'benefits' (list of strings), 'safety' (list of strings).\n"
    )

    user_prompt = f"""
    User Profile: {user_info} (Diet: {user_info.get('diet', 'Standard')})
    Primary Goal: {goal}
    Activity Level: {activity_level}
    Health Conditions: {conditions}
    Equipment: {equipment}
    Time Available: {time_available}
    Recent Sleep Avg: {avg_sleep:.1f}h
    Last Workout Scanned: {last_exercises_context}
    """

    result = query_llm(system_prompt, user_prompt)

    # DYNAMIC FALLBACK SYSTEM
    # If API fails, we select 2 random exercises from a safe pool to ensure variety
    fallback_pool = [
        {
            "name": "Bodyweight Squats", "muscle": "Legs", "type": "Strength", 
            "difficulty": "Beginner", "calories": 40, "duration_or_sets": "3x12",
            "details": {"description": "Standard squat.", "steps": ["Hips back", "Chest up"], "benefits": ["Leg strength"], "safety": ["Knees out"]}
        },
        {
            "name": "Push-Ups (or Knee Push-Ups)", "muscle": "Chest/Triceps", "type": "Strength",
            "difficulty": "Beginner", "calories": 50, "duration_or_sets": "3x10",
            "details": {"description": "Classic push movement.", "steps": ["Plank position", "Lower chest"], "benefits": ["Upper body"], "safety": ["Core tight"]}
        },
        {
            "name": "Glute Bridges", "muscle": "Glutes", "type": "Strength",
            "difficulty": "Beginner", "calories": 30, "duration_or_sets": "3x15",
            "details": {"description": "Hip extension on floor.", "steps": ["Lying on back", "Lift hips"], "benefits": ["Glute activation"], "safety": ["Squeeze glutes"]}
        },
        {
            "name": "Bird-Dog", "muscle": "Core/Back", "type": "Mobility",
            "difficulty": "Beginner", "calories": 20, "duration_or_sets": "20 reps total",
            "details": {"description": "Core stability.", "steps": ["All fours", "Opposite arm/leg extend"], "benefits": ["Spine health"], "safety": ["Neutral spine"]}
        },
        {
            "name": "Lunges", "muscle": "Legs", "type": "Strength",
            "difficulty": "Beginner", "calories": 45, "duration_or_sets": "2x10/leg",
            "details": {"description": "Unilateral leg work.", "steps": ["Step forward", "Drop knee"], "benefits": ["Balance", "Strength"], "safety": ["Torso upright"]}
        },
        {
            "name": "Plank", "muscle": "Core", "type": "Strength",
            "difficulty": "Beginner", "calories": 20, "duration_or_sets": "3x45s",
            "details": {"description": "Static core hold.", "steps": ["Forearms down", "Body straight"], "benefits": ["Core stability"], "safety": ["No sagging hips"]}
        }
    ]

    selected_fallback = random.sample(fallback_pool, 2)

    # Handle LLM returning a list of routines instead of expected object
    if isinstance(result, list):
        if len(result) > 0 and isinstance(result[0], dict):
            # Just take the first routine if it looks valid
            result = result[0]
        else:
            result = {}

    if not result or not result.get('exercises') or len(result['exercises']) < 2:
        print("Using DYNAMIC FALLBACK due to LLM failure or invalid response.")
        return {
            "routine_name": "Fallback Dynamic Routine",
            "description": "AI service unavailable, generated safe tailored options.",
            "ai_insight": "We couldn't reach the AI brain right now, but here are two effective exercises to keep your streak alive.",
            "exercises": selected_fallback
        }
    
    # Enforce strict 2-workout limit on valid results
    if 'exercises' in result:
        result['exercises'] = result['exercises'][:2]

    return result

@router.get("/sleep-history")
def get_sleep_history(period: int = 7):
    """
    Aggregate sleep data from Journals (primary fallback) and Fitbit (if available).
    Parses "7 hours" -> 7.0
    """
    history = []
    
    # 1. Mock Fitbit Check (In real app, query Fitbit API here)
    # If fitbit_connected: return fitbit_data
    
    # 2. Journal Fallback
    today = datetime.now()
    sorted_dates = sorted(journal_store.keys(), reverse=True)
    
    for date_str in sorted_dates[:period]:
        entry = journal_store[date_str]
        try:
            # Simple parsing: "7.5 hours" -> 7.5
            sleep_val = float(''.join(c for c in entry['sleep'] if c.isdigit() or c == '.'))
            history.append({"date": date_str, "hours": sleep_val})
        except ValueError:
            continue # Skip invalid formats
            
    # Sort by date ascending for graph
    history.sort(key=lambda x: x['date'])
    
    if not history:
        # Mock data for demonstration if no journals exist
        from datetime import timedelta
        base_date = datetime.now() - timedelta(days=period)
        for i in range(period):
            date_str = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
            # Generate somewhat realistic sleep curve around 6.5 - 8.5 hours
            hours = 7.0 + (random.random() * 2 - 0.5)
            history.append({"date": date_str, "hours": round(hours, 1)})
            
    return history

@router.post("/sleep-analysis")
def analyze_sleep(
    baseline: str = Body(...),
    fitbit_sleep: str = Body(None),
    goal: str = Body(...),
    history: list = Body(None, description="List of {date, hours} objects")
):
    """
    Sleep Agent: AI-Driven with Trend Analysis.
    """
    system_prompt = (
        "You are a sleep hygiene expert. observational only. "
        "STRICT RULES: "
        "1. Never usage judgmental words like 'bad', 'terrible', 'fail'. "
        "2. Connect sleep to the specific goal (e.g. fat loss needs sleep for hormone regulation). "
        "3. IF HISTORY PROVIDED: Analyze the trend (consistency, avg vs baseline). "
        "4. Output JSON with structured keys: "
        "'observation' (What happened recently), "
        "'impact' (Connection to goal), "
        "'action' (One tiny specific tip)."
    )
    
    duration = fitbit_sleep if fitbit_sleep else baseline
    trend_context = ""
    if history and len(history) > 2:
        avgs = sum(d['hours'] for d in history) / len(history)
        trend_context = f"Recent History (Last {len(history)} entries): Avg {avgs:.1f} hrs. Trend Data: {history}"

    user_prompt = f"Current/Baseline: {duration}. Goal: {goal}. {trend_context}"

    result = query_llm(system_prompt, user_prompt)
    
    # Fallback to simple insight if LLM fails or structure is wrong
    if not result:
        return {
            "observation": "Sleep data is sparse right now.",
            "impact": "Consistent sleep helps recover from daily stress.",
            "action": "Try to log your sleep daily for better insights."
        }
    
    return result

# --- Journal System ---

@router.get("/journal/{date}")
def get_journal(date: str):
    return journal_store.get(date, None)

@router.post("/journal")
def save_journal(entry: JournalEntry):
    if entry.date in journal_store and not entry.insight:
        entry.insight = journal_store[entry.date].get('insight')
    journal_store[entry.date] = entry.dict()
    return {"status": "saved", "entry": entry}

@router.get("/journal/all")
def get_all_journals():
    return journal_store

@router.post("/daily-insight")
def generate_daily_insight(context: DailyContext):
    """
    Journal Agent: Uses ScaleDown for historical context if available.
    """
    j = context.journal
    
    # 1. Get Historical Context via ScaleDown
    history_context = ""
    if journal_store:
        history_lines = [f"{e['date']}: {e['mood']}, {e['food']}" for e in journal_store.values()]
        # Only compress if we have enough history
        if len(history_lines) > 3:
            history_context = safe_compress_history(
                history_lines, 
                "Summarize user's recent mood/diet/consistency trends."
            )

    # 2. Query LLM
    system_prompt = (
        "You are a thoughtful mood & habit tracker. "
        "Structure your response as three plain paragraphs (NO HEADERS, NO JSON KEYS in text output, just the text): "
        "1. Reflection (Mirror their mood/log). "
        "2. Connection (How this links to their goal). "
        "3. Action (One tiny suggestion). "
        "Output JSON with key: 'insight' containing the full formatted string."
    )

    user_prompt = f"""
    Today's Log:
    Mood: {j.mood}
    Food: {j.food}
    Sleep: {j.sleep}
    Notes: {j.notes}
    
    Goal: {context.goal}
    Recent History Context: {history_context}
    """

    result = query_llm(system_prompt, user_prompt)
    
    insight_text = ""
    if result and 'insight' in result:
        insight_text = result['insight']
    else:
        insight_text = "Thank you for logging. Consistency is the most important step."

    # Cache
    if j.date in journal_store:
        journal_store[j.date]['insight'] = insight_text

    return {"insight": insight_text}

# --- Doctor Reports ---

@router.post("/doctor-report")
def generate_doctor_report(
    user_data: UserProfile = Body(...),
    time_range: str = Body("1 month"),
    conditions: list = Body([])
):
    """
    Doctor Report Agent: Heavy ScaleDown Usage.
    """
    # 1. Aggregate & Compress History
    history_lines = [f"{date}: {e['mood']}/{e['food']}" for date, e in journal_store.items()]
    clinical_summary = "No logs available."
    if history_lines:
        clinical_summary = safe_compress_history(
            history_lines, 
            "Create a clinical summary of symptom/lifestyle stability for a physician."
        )

    # 2. Query LLM for final report formatting
    system_prompt = (
        "You are a medical scribe. Format a text report for a doctor. "
        "Key Sections: Patient Info, Observations, Lifestyle Trends (from context), Active Records. "
        "Tone: Professional, Clinical, Objective. "
        "Output JSON with key: 'report' containing the full formatted report text."
    )

    user_prompt = f"""
    Patient: {user_data.name}, {user_data.age}yo, BMI {user_data.bmi:.1f}
    Conditions: {conditions}
    Clinical History Summary: {clinical_summary}
    """

    result = query_llm(system_prompt, user_prompt)
    if result and 'report' in result:
         return {"report": result['report']}

    # Fallback
    return {"report": f"Report for {user_data.name}\n\nSummary: {clinical_summary}"}

# --- Prescriptions / Manual Notes ---

@router.post("/analyze-prescription")
async def analyze_prescription(file: UploadFile = File(...)):
    """
    Analyzes an uploaded PDF prescription. 
    Uses ScaleDown for compression if the text is long, then OpenRouter for extraction.
    """
    try:
        # 1. Read and Extract PDF Text
        pdf_bytes = await file.read()
        reader = PdfReader(BytesIO(pdf_bytes))
        extracted_text = ""
        for page in reader.pages:
            extracted_text += page.extract_text() + "\n"
        
        print(f"Extracted {len(extracted_text)} characters from {file.filename}")

        if not extracted_text.strip():
             return {"status": "error", "message": "Could not extract text from PDF."}

        # 2. Compress Context using ScaleDown (if text is substantially long)
        context_to_analyze = extracted_text
        if len(extracted_text) > 500 and compressor: # Arbitrary threshold for demonstration
             print("Compressing prescription text with ScaleDown...")
             try:
                 result = compressor.compress(
                     context=[extracted_text], 
                     prompt="Summarize this medical record, extracting all key health metrics, diagnosis, and prescribed medications accurately."
                 )
                 context_to_analyze = result.content
                 print(f"Compressed down to {len(context_to_analyze)} characters.")
             except Exception as e:
                 print(f"ScaleDown Compression failed for PDF: {e}")
                 # Fallback to using uncompressed if it fails but isn't absurdly massive

        # 3. Query LLM (OpenRouter)
        system_prompt = (
            "You are a holistic health analyst. Analyze the provided clinical text. "
            "Extract the following into structured JSON: "
            "'diagnosis' (string or short list), "
            "'medications' (list of strings with dosage/frequency), "
            "'metrics' (any vital signs or lab results found, otherwise empty list), "
            "'advice' (A detailed, supportive 2-3 sentence insight focusing on lifestyle, daily habits, "
            "and nutrition that can help the user manage the condition or improve general well-being. "
            "Do NOT give direct medical advice or prescribe treatments, focus on holistic education). "
            "Do not hallucinate data. If diagnosis is empty or none, provide general healthy lifestyle advice."
        )

        user_prompt = f"Extract clinical data from this text:\n\n{context_to_analyze}"
        
        print("Querying LLM with extracted text...")
        analysis_result = query_llm(system_prompt, user_prompt)

        if not analysis_result:
             return {"status": "error", "message": "Failed to analyze prescription."}

        # 4. Save to Store (Mocking an appointment date for now)
        summary = PrescriptionSummary(
            overview=f"Prescription Analysis from {file.filename}",
            purpose=str(analysis_result.get('diagnosis', 'Clinical Record')),
            notes=f"Medications: {', '.join(analysis_result.get('medications', []))}",
            suggestion=analysis_result.get('advice', 'Follow provider instructions.')
        )

        rec = Prescription(
            id=str(uuid4()),
            upload_date=datetime.now().strftime("%Y-%m-%d"),
            appointment_date=datetime.now().strftime("%Y-%m-%d"), # Assume today if not parsed
            provider="Extracted from Document",
            details=json.dumps(analysis_result),
            status="Auto-Analyzed",
            summary=summary
        )
        prescription_store.append(rec.dict())

        return {
            "status": "success", 
            "analysis": analysis_result,
            "prescription_record": rec
        }

    except Exception as e:
        print(f"Prescription Analysis Error: {e}")
        return {"status": "error", "message": str(e)}

@router.post("/prescriptions/manual")
def add_manual_prescription(entry: ManualEntryInput):
    """
    Prescription Agent: AI Analysis of medical notes.
    """
    system_prompt = (
        "You are a medical assistant. Analyze the user's note. "
        "Extract: 'purpose' (what is this for?), 'suggestion' (patient adherence advice). "
        "Safety: Do not diagnose. "
        "Output JSON with keys: 'purpose', 'suggestion', 'overview'."
    )
    
    user_prompt = f"Provider: {entry.provider}\nNote: {entry.details}"
    
    result = query_llm(system_prompt, user_prompt)
    
    if result:
        summary = PrescriptionSummary(
            overview=result.get('overview', 'Medical Note'),
            purpose=result.get('purpose', 'Record'),
            notes="AI Analyzed",
            suggestion=result.get('suggestion', 'Follow provider instructions.')
        )
    else:
        summary = PrescriptionSummary(
            overview="Manual Entry", purpose="Record", notes="Raw", suggestion="Follow guidelines."
        )

    rec = Prescription(
        id=str(uuid4()),
        upload_date=datetime.now().strftime("%Y-%m-%d"),
        appointment_date=entry.appointment_date,
        provider=entry.provider,
        details=entry.details,
        status="Analyzed",
        summary=summary
    )
    
    prescription_store.append(rec.dict())
    return {"status": "success", "prescription": rec}

# --- Workout Logging ---

@router.get("/workouts")
def get_workouts():
    return workout_store

@router.post("/log-workout")
def log_workout(log: WorkoutLog):
    workout_store.append(log.dict())
    return {"status": "success", "log": log}


@router.get("/prescriptions")
def get_prescriptions():
    return prescription_store

@router.delete("/prescriptions/{pid}")
def delete_prescription(pid: str):
    global prescription_store
    prescription_store = [p for p in prescription_store if p['id'] != pid]
    return {"status": "deleted"}

