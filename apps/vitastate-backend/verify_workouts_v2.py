import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_workout_v2():
    print("\n--- Testing Workout V2 (Limit & Insights) ---")
    
    payload = {
        "goal": "Build Muscle",
        "user_info": {"age": 25, "diet": "Standard"},
        "time_available": "60 mins"
    }
    
    try:
        res = requests.post(f"{BASE_URL}/workout-plan", json=payload, timeout=30)
        print(f"Status: {res.status_code}")
        
        if res.status_code == 200:
            data = res.json()
            
            # Check 1: Insight existence
            insight = data.get('ai_insight')
            print(f"\n[Check 1] AI Insight Present: {bool(insight)}")
            if insight:
                print(f"Insight Preview: {insight[:100]}...")
            else:
                print("❌ FAIL: No insight found.")

            # Check 2: Exercise Count
            exercises = data.get('exercises', [])
            count = len(exercises)
            print(f"\n[Check 2] Exercise Count: {count}")
            
            if count == 2:
                print("✅ PASS: Exactly 2 workouts.")
            else:
                print(f"❌ FAIL: Expected 2, got {count}.")
                
            # Check 3: Structure
            if count > 0:
                ex = exercises[0]
                has_details = 'details' in ex
                print(f"\n[Check 3] Exercise Detail Structure: {'✅ Valid' if has_details else '❌ Invalid'}")

        else:
            print(f"Error: {res.text}")

    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_workout_v2()
