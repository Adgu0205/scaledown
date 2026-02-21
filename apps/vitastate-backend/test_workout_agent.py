import requests
import json

url = "http://localhost:8000/api/workout-plan"

payload = {
    "goal": "Gain muscle",
    "activity_level": "Moderately active",
    "conditions": ["None"],
    "user_info": {
        "age": 28,
        "bmi": 23.5
    },
    "equipment": "Dumbbells",
    "time_available": "45 mins"
}

try:
    print("Sending request to Workout Agent...")
    response = requests.post(url, json=payload, timeout=20)
    response.raise_for_status()
    data = response.json()
    
    print("\n--- API Response ---")
    print(json.dumps(data, indent=2))
    
    # Validation
    if "routine_name" in data and "exercises" in data:
        print("\n[SUCCESS] Response structure is valid.")
        
        exercises = data["exercises"]
        if len(exercises) > 0:
            ex = exercises[0]
            if "name" in ex and "details" in ex and "steps" in ex["details"]:
                 print(f"[SUCCESS] Exercise Tile '{ex['name']}' has details.")
                 print(f"Goal Tag: {ex.get('goal_tag', 'N/A')}")
            else:
                 print("[FAILURE] Exercise tile missing required fields.")
        else:
             print("[WARNING] No exercises returned.")

    else:
        print("\n[FAILURE] Invalid response structure.")

except Exception as e:
    print(f"\n[ERROR] Request failed: {e}")
