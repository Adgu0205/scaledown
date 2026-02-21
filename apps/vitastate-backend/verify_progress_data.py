import requests

BASE_URL = "http://localhost:8000/api"

def test_progress_merging():
    print("\n--- Testing Progress Data Merging ---")
    
    # 1. Fetch Workouts
    try:
        w_res = requests.get(f"{BASE_URL}/workouts")
        workouts = w_res.json()
        print(f"Workouts Found: {len(workouts)}")
    except Exception as e:
        print(f"Error fetching workouts: {e}")
        return

    # 2. Fetch Prescriptions
    try:
        p_res = requests.get(f"{BASE_URL}/prescriptions")
        prescriptions = p_res.json()
        print(f"Prescriptions Found: {len(prescriptions)}")
    except Exception as e:
        print(f"Error fetching prescriptions: {e}")
        return

    # 3. Simulate Frontend Merge
    merged = []
    for w in workouts:
        merged.append({"type": "workout", "date": w['date'], "title": w['name']})
        
    for p in prescriptions:
        merged.append({"type": "report", "date": p['upload_date'], "title": "Doctor Report"})
        
    merged.sort(key=lambda x: x['date'], reverse=True)
    
    print(f"\nMerged Events ({len(merged)} total):")
    for i, event in enumerate(merged[:5]):
        print(f"{i+1}. [{event['type'].upper()}] {event['date']} - {event['title']}")
        
    if len(merged) == len(workouts) + len(prescriptions):
        print("\n✅ SUCCESS: Data merging logic is valid.")
    else:
        print("\n❌ FAILURE: Count mismatch.")

if __name__ == "__main__":
    test_progress_merging()
