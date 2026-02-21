# Vita-state

A comprehensive Health and Wellness Dashboard providing holistic, AI-powered insights into your fitness, nutrition, and daily sleep routines. Vita-state automatically correlates disparate health metrics (like Fitbit active zones and sleep cycles) through Large Language Models to offer actionable, hyper-personalized health advice. 

![Vita-state Dashboard](https://github.com/Adgu0205/scaledown/assets/vita-state-preview.png)

## Core Features
- **Holistic AI Insights**: Context-aware AI analysis that monitors user sleep schedules, daily steps, and workout records to summarize daily well-being.
- **Smart Diet & Workout Generation**: On-the-fly personalized exercise routines and nutritional plans, seamlessly incorporating individual allergies, goals, and BMI data.
- **Clinical Prescription Analysis**: Upload your doctor's prescriptions or medical reports (PDF). The platform extracts necessary medications and translates medical jargon into easily understandable holistic lifestyle advice.
- **Fitbit Integration**: Connect directly to your Fitbit account to automatically pull in historic sleep history, active zones, steps, and caloric output.
- **Dynamic Dashboard**: A responsive, dark-themed UI that organizes all your health vectors in neatly structured activity matrices and trend graphs.

## Technology Stack

### Frontend (User Interface)
- **Framework**: React / Vite SPA
- **Styling**: Vanilla CSS (CSS Variables for dynamic Dark-Theme implementation)
- **Data Visualization**: Recharts (for Sleep and Activity Trends)
- **Routing**: React Router DOM 

### Backend (API Server)
- **Framework**: Python / FastAPI
- **Authentication**: OAuth2 (Fitbit), JWT
- **Data Extractor**: PyPDF (for clinical report ingestion)

### AI & Third-Party Services
1. **ScaleDown API**
2. **OpenRouter API** (Llama 3 / Claude fallback)

---

## AI Implementation Details

### How We Used the ScaleDown API
The **ScaleDown API** was utilized as a preprocessing and data compression layer. Medical documents and extensive raw journal entries often contain excess noise, boilerplate text, and redundant tokens. 
Before hitting the heavy LLMs, the Vita-state backend routes the extracted text through the ScaleDown API to:
1. **Reduce Token Overhead**: Significantly decreases the size of the payload sent to OpenRouter, drastically reducing API costs and inference time.
2. **Focus on Semantics**: By retaining only the clinically significant information (medication names, diagnoses, core sentiments), the downstream AI provides far more accurate and less hallucinatory insights.

### How We Used the OpenRouter API
The core "Brain" of Vita-state operates on **OpenRouter**, allowing us to dynamic-switch between state-of-the-art models (primarily `meta-llama/llama-3.1-8b-instruct`). We engineered strict, rigid System Prompts for OpenRouter to act as specialized health agents:

1. **The Holistic Health Analyst (`analyze_prescription`)**: 
   When a user uploads a clinical PDF (after being compressed by ScaleDown), OpenRouter receives the text. It avoids giving direct medical diagnoses and instead outputs strictly structured JSON mapping the extracted medications. Further, it generates a 2-3 sentence personalized insight focusing on *nutrition and habit changes* related to the discovered conditions.

2. **The Sleep & Recovery Coach (`analyze_sleep`)**: 
   OpenRouter takes the last 3 days of sleep duration and correlates it with the user's daily journal (mood, diet). It then returns a natural language summary explaining *why* the user might be feeling fatigued (e.g., "Your high late-night carb intake correlated with a 1.5-hour drop in baseline sleep...").

3. **The Personal Trainer (`generate_workout`)**: 
   OpenRouter ingests the user's BMI, Target Goals ("Lose Fat"), and current fatigue states. It generates structured, 4-step workout regimes mathematically isolated to prevent muscle overtraining compared to historic workouts.

---

## Project Setup & Deployment 

Vita-state is separated into a detached frontend and backend to support modern cloud-native deployment patterns (e.g. Netlify + Render).

### Prerequisites
- Node.js (v16+)
- Python 3.9+
- An [OpenRouter API Key](https://openrouter.ai/)
- A [ScaleDown API Key]
- Optional: A registered Fitbit Developer OAuth Application 

### Quickstart (Local Development)

**1. Clone the repository**
```bash
git clone https://github.com/Adgu0205/scaledown.git
cd scaledown/apps
```

**2. Setup the Backend (FastAPI)**
```bash
cd vitastate-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
Create a `.env` file in the `vitastate-backend` directory:
```env
OPENROUTER_API_KEY=your_key_here
SCALEDOWN_API_KEY=your_key_here

FITBIT_CLIENT_ID=optional
FITBIT_CLIENT_SECRET=optional
```
Run the server:
```bash
uvicorn main:app --reload
```

**3. Setup the Frontend (React/Vite)**
```bash
cd ../vitastate-frontend
npm install
```
Create a `.env` file in the `vitastate-frontend` directory:
```env
VITE_API_URL=http://localhost:8000/api
VITE_AUTH_URL=http://localhost:8000/auth
```
Start the development server:
```bash
npm run dev
```

### Deployment Configuration
This project is pre-configured for direct cloud deployment. 
- **Frontend**: A `netlify.toml` file enforces SPA routing logic. Connect your repository to Netlify, set your build command to `npm run build`, and map `VITE_API_URL` to your live backend domain.
- **Backend**: A `Procfile` is included for zero-config deployments on PaaS providers like **Render** or **Heroku**. 

---
*Made by Aditya Gupta*
