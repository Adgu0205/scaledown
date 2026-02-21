import requests
import json

BASE_URL = "http://localhost:8000/api"

def debug_endpoint(name, url, payload):
    print(f"\n--- DEBUGGING {name} ---")
    try:
        res = requests.post(f"{BASE_URL}/{url}", json=payload, timeout=20)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            print(json.dumps(data, indent=2))
        else:
            print(f"Error: {res.text}")
    except Exception as e:
        print(f"Exception: {e}")

# 1. Sleep Analysis (Missing Insight)
debug_endpoint(
    "Sleep Analysis",
    "sleep-analysis",
    {
        "baseline": "7-8 hrs",
        "goal": "Improve sleep & recovery",
        "history": [{"date": "2023-01-01", "hours": 7.5}]
    }
)

# 2. Workout Plan (Missing Text in Tiles)
debug_endpoint(
    "Workout Plan",
    "workout-plan",
    {
        "goal": "Lose fat",
        "user_info": {"age": 30, "bmi": 24, "diet": "Non-vegetarian"},
        "time_available": "45 mins"
    }
)

# 3. Doctor Report (Crash)
debug_endpoint(
    "Doctor Report",
    "doctor-report",
    {
        "user_data": {"name": "Test", "age": 30, "weight_kg": 70, "bmi": 24},
        "time_range": "1 month",
        "conditions": []
    }
)
