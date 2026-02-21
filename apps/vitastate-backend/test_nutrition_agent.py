import requests
import json

url = "http://localhost:8000/api/nutrition-plan"

payload = {
    "goal": "Gain muscle",
    "diet": "Non-vegetarian",
    "allergies": [],
    "user_info": {
        "age": 25,
        "sex": "Male",
        "weight": 70,
        "height": "5'10"
    },
    "activity_level": "Moderately active",
    "taste_memory": {
        "likes": ["Chicken Tikka"],
        "dislikes": ["Oatmeal"]
    }
}

try:
    print("Sending request to Nutrition Agent...")
    response = requests.post(url, json=payload, timeout=20)
    response.raise_for_status()
    data = response.json()
    
    print("\n--- API Response ---")
    print(json.dumps(data, indent=2))
    
    # Validation
    if "intro" in data and "meals" in data:
        print("\n[SUCCESS] Response structure is valid.")
        
        # Check for Indian context keywords strings
        raw_text = json.dumps(data).lower()
        indian_keywords = ["indian", "curry", "paneer", "dal", "chilla", "poha", "tikka", "roti", "dosa"]
        if any(k in raw_text for k in indian_keywords):
             print("[SUCCESS] Indian culinary context detected.")
        else:
             print("[WARNING] No specific Indian keywords found. Check output.")
             
        # Check if "Oatmeal" is excluded
        if "oatmeal" in raw_text:
             print("[FAILURE] 'Oatmeal' found despite being in dislikes!")
        else:
             print("[SUCCESS] Disliked item 'Oatmeal' correctly excluded.")

    else:
        print("\n[FAILURE] Invalid response structure.")

except Exception as e:
    print(f"\n[ERROR] Request failed: {e}")
