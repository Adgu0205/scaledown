import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_custom_logging():
    print("\n--- Testing Custom Logging ---")
    
    # 1. Log Custom Workout
    custom_log = {
        "name": "Test Custom Run",
        "duration": 30,
        "intensity": "Moderate",
        "date": "2023-10-27T10:00:00Z",
        "source": "custom",
        "notes": "Feeling good"
    }
    
    res = requests.post(f"{BASE_URL}/log-workout", json=custom_log)
    print(f"Log Custom Status: {res.status_code}")
    if res.status_code != 200:
        print(f"Error: {res.text}")
        return

    # 2. Log AI Workout
    ai_log = {
        "name": "Test AI Squats",
        "duration": 15,
        "intensity": "High",
        "date": "2023-10-27T10:30:00Z",
        "source": "ai"
    }
    
    res = requests.post(f"{BASE_URL}/log-workout", json=ai_log)
    print(f"Log AI Status: {res.status_code}")

    # 3. specific Verify Logs
    res = requests.get(f"{BASE_URL}/workouts")
    logs = res.json()
    
    print(f"\nTotal Logs: {len(logs)}")
    
    custom_found = False
    ai_found = False
    
    for log in logs:
        if log.get('name') == "Test Custom Run" and log.get('source') == "custom":
            custom_found = True
            print("✅ Custom Log Found")
        if log.get('name') == "Test AI Squats" and log.get('source') == "ai":
            ai_found = True
            print("✅ AI Log Found")
            
    if custom_found and ai_found:
        print("\nSUCCESS: Both log types recorded correctly.")
    else:
        print("\nFAILURE: Missing logs.")

if __name__ == "__main__":
    test_custom_logging()
