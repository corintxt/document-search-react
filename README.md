# Walkthrough - Email Search Tool (React + FastAPI)

The Email Search Tool has been rewritten as a modern React application with a FastAPI backend.

## Architecture
- **Frontend**: React (Vite)
- **Backend**: FastAPI (Python)
- **Database**: Google BigQuery (via Python client)

## Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Google Cloud Credentials (configured in environment or default auth)
- `.streamlit/secrets.toml` (optional, for configuration)

## Setup & Running

### 1. Backend Setup
Navigate to the `backend` directory:
```bash
cd backend
```

Create a virtual environment and install dependencies:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Ensure `.env` is present OR `.streamlit/secrets.toml` exists with:
- `PROJECT_ID`
- `DATASET`
- `TABLE`
- `SUMMARY` (optional)
- `APP_PASSWORD`

Start the backend server:
```bash
uvicorn main:app --reload --port 8000
```
The API will be available at `http://localhost:8000`.

### 2. Frontend Setup
Navigate to the `frontend` directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

## Usage
1.  Open `http://localhost:5173`.
2.  Enter the password (configured in `secrets.toml` or `.env`).
3.  Use the sidebar to filter emails by date, sender, recipient, or category.
4.  Enter keywords in the search bar to find specific emails.
5.  Click "View Full" to see the complete email body.
6.  Export results to CSV using the button in the results area.

## Troubleshooting
- **No Results**: Ensure the `TABLE` configuration points to a valid BigQuery table with the correct schema (must contain `id`, `Subject`, `Body`, etc.).
- **Login Failed**: Verify `APP_PASSWORD` in `.streamlit/secrets.toml` or `.env`.

## Verification Results
- **Frontend**: Successfully initialized.
- **Backend**: FastAPI server implements search logic and BigQuery integration.
- **Secrets**: Backend successfully reads configuration from `.streamlit/secrets.toml`.
- **Search**: Verified search returns results from BigQuery.
