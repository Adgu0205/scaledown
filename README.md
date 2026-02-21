# Vita-state

A comprehensive Health and Wellness Dashboard providing AI-powered insights into fitness, nutrition, and daily sleep routines. It automatically correlates health metrics (like Fitbit data and sleep cycles) through Large Language Models to offer actionable health advice.

![Vita-state Dashboard](https://github.com/Adgu0205/scaledown/assets/vita-state-preview.png)

## Core Features
Holistic AI Insights: Context-aware AI analysis that monitors sleep schedules, daily steps, and workout records to summarize daily well-being.
Smart Diet & Workout Generation: Personalized exercise routines and nutritional plans incorporating individual allergies, goals, and BMI data.
Clinical Prescription Analysis: Upload medical reports (PDF). The platform extracts necessary medications and translates medical jargon into understandable lifestyle advice.
Fitbit Integration: Connect to your Fitbit account to automatically pull in sleep history, active zones, steps, and caloric output.
Dynamic Dashboard: A responsive UI that organizes health vectors in structured activity matrices and trend graphs.

## Technology Stack
React SPA (Frontend)
Python / FastAPI (Backend)
OAuth2 (Fitbit), JWT
OpenRouter API (Llama 3 / Claude fallback)
ScaleDown API

## How We Used the ScaleDown API
The ScaleDown API operates as a preprocessing layer. Medical documents and extensive raw journal entries often contain excess noise. Before hitting the LLMs, the backend routes the extracted text through the ScaleDown API to:
Reduce Token Overhead: Decreases the payload size sent to OpenRouter, reducing API costs and inference time.
Focus on Semantics: By retaining only clinically significant information (medication names, diagnoses), the downstream AI provides more accurate insights.

## How We Used the OpenRouter API
The core brain operates on OpenRouter, allowing us to utilize strictly prompted state-of-the-art models:
The Holistic Health Analyst: Analyzes compressed clinical PDFs. Outputs structured JSON mapping medications and generates personalized insights focusing on nutrition and habit changes.
The Sleep & Recovery Coach: Takes recent sleep duration and correlates it with the user's daily journal to return a natural language summary explaining fatigue causes.
The Personal Trainer: Ingests BMI, goals, and fatigue states to generate structured, 4-step workout regimes mathematically isolated to prevent muscle overtraining.

## Quickstart (Local Development)

Clone the repository
git clone https://github.com/Adgu0205/scaledown.git
cd scaledown/apps

Setup the Backend
cd vitastate-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

Create a .env file in the vitastate-backend directory
OPENROUTER_API_KEY=your_key_here
SCALEDOWN_API_KEY=your_key_here
FITBIT_CLIENT_ID=optional
FITBIT_CLIENT_SECRET=optional

Run the server
uvicorn main:app --reload

Setup the Frontend
cd ../vitastate-frontend
npm install

Create a .env file in the vitastate-frontend directory
VITE_API_URL=http://localhost:8000/api
VITE_AUTH_URL=http://localhost:8000/auth

Start the development server
npm run dev

## Deployment Configuration
Frontend: A netlify.toml file enforces SPA routing logic. Connect your repository to Netlify, set your build command to npm run build, and map VITE_API_URL to your live backend domain.
Backend: A Procfile is included for zero-config deployments on PaaS providers like Render or Heroku.
