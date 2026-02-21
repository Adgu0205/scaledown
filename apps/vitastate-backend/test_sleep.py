import requests
import json
from datetime import datetime, timedelta

# Seed Data
history = [
    {"date": (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d"), "sleep": "6.5 hours", "mood": "Okay", "food": "Good"},
    {"date": (datetime.now() - timedelta(days=4)).strftime("%Y-%m-%d"), "sleep": "7 hours", "mood": "Good", "food": "Okay"},
    {"date": (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d"), "sleep": "5.5 hours", "mood": "Tired", "food": "Okay"},
    {"date": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"), "sleep": "8 hours", "mood": "Great", "food": "Good"},
    {"date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"), "sleep": "7.2 hours", "mood": "Good", "food": "Great"},
]

print("Seeding Journal Data...")
for entry in history:
    requests.post("http://localhost:8000/api/journal", json=entry)

print("\nTesting History Endpoint...")
res = requests.get("http://localhost:8000/api/sleep-history?period=7")
data = res.json()
print(json.dumps(data, indent=2))

if len(data) >= 5:
    print("\n[SUCCESS] History Data Retrieved Correctly")
else:
    print(f"\n[FAILURE] Expected 5+ entries, got {len(data)}")

print("\nTesting Analysis Endpoint with History...")
an_res = requests.post("http://localhost:8000/api/sleep-analysis", json={
    "baseline": "7 hours",
    "goal": "Energy",
    "history": data
})
print(json.dumps(an_res.json(), indent=2))
