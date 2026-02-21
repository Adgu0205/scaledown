import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

print(f"Testing API Key: {OPENROUTER_API_KEY[:5]}...{OPENROUTER_API_KEY[-5:] if OPENROUTER_API_KEY else 'None'}")

if not OPENROUTER_API_KEY:
    print("No API Key found!")
    exit(1)

headers = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost:8000",
    "X-Title": "VitaState Test"
}

payload = {
    "model": "google/gemini-2.0-flash-001",
    "messages": [
        {"role": "user", "content": "Say hello in JSON format: {'message': 'Hello'}"}
    ],
    "response_format": {"type": "json_object"}
}

try:
    print("Sending request to OpenRouter...")
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=payload,
        timeout=10
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
