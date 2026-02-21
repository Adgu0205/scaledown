import requests
import json
import os

BASE_URL = "http://localhost:8000/api"

def print_result(name, success, details):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} - {name}")
    if not success:
        print(f"   Details: {details}")

def test_endpoint(name, url, payload, expected_keys):
    try:
        res = requests.post(f"{BASE_URL}/{url}", json=payload, timeout=15)
        if res.status_code != 200:
            print_result(name, False, f"Status Code: {res.status_code}, Body: {res.text}")
            return

        data = res.json()
        missing_keys = [k for k in expected_keys if k not in data]
        
        if missing_keys:
            print_result(name, False, f"Missing Keys: {missing_keys}. Got: {list(data.keys())}")
        else:
            # Check for non-empty values in expected keys
            empty_keys = [k for k in expected_keys if not data[k]]
            if empty_keys:
                 print_result(name, False, f"Empty Values for: {empty_keys}")
            else:
                print_result(name, True, "Structure Valid")
                
    except Exception as e:
        print_result(name, False, f"Exception: {str(e)}")

# 1. Dashboard Insights
test_endpoint(
    "Dashboard Insights",
    "dashboard-insights",
    {
        "user_data": {"age": 30, "bmi": 24},
        "goals": "Lose Fat",
        "activity_data": {"steps": 5000}
    },
    ["body_insight", "activity_insight", "nutrition_insight", "overview"]
)

# 2. Sleep Analysis
test_endpoint(
    "Sleep Analysis",
    "sleep-analysis",
    {
        "baseline": "6 hours",
        "goal": "Energy",
        "history": [{"date": "2023-01-01", "hours": 6}]
    },
    ["observation", "impact", "action"]
)

# 3. Workout Plan
test_endpoint(
    "Workout Plan",
    "workout-plan",
    {
        "goal": "Build Muscle",
        "user_info": {"age": 25, "bmi": 22},
        "time_available": "60 mins"
    },
    ["routine_name", "description", "exercises"]
)

# 4. Nutrition Plan
test_endpoint(
    "Nutrition Plan",
    "nutrition-plan",
    {
        "goal": "Lose Weight",
        "diet": "Vegetarian",
        "user_info": {"age": 30, "bmi": 25},
        "taste_memory": {"likes": [], "dislikes": []}
    },
    ["intro", "meals", "type"]
)

# 5. Doctor Report
test_endpoint(
    "Doctor Report",
    "doctor-report",
    {
        "user_data": {"age": 40, "bmi": 28, "name": "Test User"},
        "conditions": ["Hypertension"]
    },
    ["report"]
)
