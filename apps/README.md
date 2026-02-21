# Vita-state

A basic health dashboard application using React (Frontend) and FastAPI (Backend), integrated with ScaleDown.

## Apps

1. **vitastate-backend** (Python/FastAPI)
2. **vitastate-frontend** (React/Vite)

## Setup & Run

### Prerequisites

- Python 3.10+
- Node.js 16+
- `scaledown` repo cloned and accessible

### 1. Backend Setup

Open a terminal and navigate to `apps/vitastate-backend`.

```bash
# Create virtual env (optional but recommended)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

The backend runs on `http://localhost:8000`.

### 2. Frontend Setup

Open a new terminal and navigate to `apps/vitastate-frontend`.

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Fitbit Integration (Getting Real Data)

To get real Fitbit data, you need to register an app with Fitbit:

1.  Go to the [Fitbit Dev Portal](https://dev.fitbit.com/apps/new).
2.  Login with your Fitbit account.
3.  **Register a New App**:
    *   **Application Name**: Vita-state (or similar).
    *   **Description**: Health dashboard.
    *   **Application Website**: `http://localhost:5173` (or any valid URL).
    *   **Organization/Terms**: Any placeholder is fine for personal use.
    *   **OAuth 2.0 Application Type**: **Server**.
    *   **Callback URL**: `http://localhost:8000/auth/fitbit/callback` (IMPORTANT).
    *   **Default Access Type**: Read-Only.
4.  **Save** and get your **OAuth 2.0 Client ID** and **Client Secret**.
5.  Open `apps/vitastate-backend/.env` and update:
    ```env
    FITBIT_CLIENT_ID=your_client_id_here
    FITBIT_CLIENT_SECRET=your_client_secret_here
    ```
6.  Restart the backend server.

## Environment Variables

Check `apps/vitastate-backend/.env` to configure:
- Fitbit Client ID/Secret
- ScaleDown API Key
