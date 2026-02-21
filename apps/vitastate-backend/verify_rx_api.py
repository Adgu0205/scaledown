import requests
import json
import sys

URL = "http://localhost:8000/api/analyze-prescription"

def test_upload(file_path):
    print(f"Testing upload of: {file_path}")
    try:
        with open(file_path, "rb") as f:
            files = {"file": (file_path, f, "application/pdf")}
            response = requests.post(URL, files=files)
            
        print(f"Status Code: {response.status_code}")
        
        try:
            data = response.json()
            print("Response JSON:")
            print(json.dumps(data, indent=2))
        except Exception:
            print("Raw Response:")
            print(response.text)
            
    except Exception as e:
        print(f"Error testing API: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python verify_rx_api.py <path_to_pdf>")
    else:
        test_upload(sys.argv[1])
