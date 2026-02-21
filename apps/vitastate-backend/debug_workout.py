import requests
import json

URL = "http://localhost:8000/api/workout-plan"
LOG_URL = "http://localhost:8000/api/log-workout"

def test_plan():
    print("Testing Workout Plan Generation...")
    payload = {
        "goal": "Lose Weight",
        "user_info": {"age": 30, "bmi": 24},
        "time_available": "30 mins"
    }
    try:
        res = requests.post(URL, json=payload)
        print(f"Status: {res.status_code}")
        data = res.json()
        print("Response Keys:", data.keys())
        if 'exercises' in data:
            print(f"Exercises: {len(data['exercises'])}")
            print(f"First Exercise: {data['exercises'][0].get('name')}")
        else:
            print("ERROR: 'exercises' key missing")
            print(data)
    except Exception as e:
        print(f"Plan Error: {e}")

def test_log():
    print("\nTesting Workout Logging...")
    payload = {
        "name": "Test Workout",
        "duration": 30,
        "intensity": "Moderate",
        "date": "2026-02-11T10:00:00Z"
    }
    try:
        res = requests.post(LOG_URL, json=payload)
        print(f"Status: {res.status_code}")
        print("Response:", res.text)
    except Exception as e:
        print(f"Log Error: {e}")

if __name__ == "__main__":
    test_plan()
    test_log()
