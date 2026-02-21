from dotenv import load_dotenv
import os

# Load env before other imports
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router
from services import router as services_router

app = FastAPI(title="Vita-state Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow any frontend Domain to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Vita-state Backend is running"}

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(services_router, prefix="/api", tags=["API"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
