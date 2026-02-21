from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
import os
import requests
import base64

router = APIRouter()

FITBIT_CLIENT_ID = os.getenv("FITBIT_CLIENT_ID", "23XXXX") # Placeholder default
FITBIT_CLIENT_SECRET = os.getenv("FITBIT_CLIENT_SECRET", "xxxxxxxx")
FITBIT_REDIRECT_URI = os.getenv("FITBIT_REDIRECT_URI", "http://localhost:8000/auth/fitbit/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

@router.get("/fitbit/login")
def fitbit_login():
    # Scope: activity profile heartrate nutrition weight
    scope = "activity profile"
    auth_url = (
        f"https://www.fitbit.com/oauth2/authorize?response_type=code"
        f"&client_id={FITBIT_CLIENT_ID}&redirect_uri={FITBIT_REDIRECT_URI}"
        f"&scope={scope}"
    )
    return RedirectResponse(auth_url)

@router.get("/fitbit/callback")
def fitbit_callback(code: str = Query(...)):
    # Exchange code for token
    token_url = "https://api.fitbit.com/oauth2/token"
    
    # Basic Auth header
    auth_str = f"{FITBIT_CLIENT_ID}:{FITBIT_CLIENT_SECRET}"
    b64_auth = base64.b64encode(auth_str.encode()).decode()
    
    headers = {
        "Authorization": f"Basic {b64_auth}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    data = {
        "client_id": FITBIT_CLIENT_ID,
        "grant_type": "authorization_code",
        "redirect_uri": FITBIT_REDIRECT_URI,
        "code": code
    }
    
    # For now, if we don't have real keys, this will fail. 
    # We'll return a mock token if keys are placeholders for demonstration.
    if "XXXX" in FITBIT_CLIENT_ID:
        # Mock flow for demo
        fake_token = "mock_fitbit_token_12345"
        return RedirectResponse(f"{FRONTEND_URL}/dashboard?token={fake_token}")

    try:
        response = requests.post(token_url, headers=headers, data=data)
        response.raise_for_status()
        tokens = response.json()
        access_token = tokens.get("access_token")
        # In a real app, store this securely or pass back to frontend
        return RedirectResponse(f"{FRONTEND_URL}/dashboard?token={access_token}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Fitbit auth failed: {str(e)}")
