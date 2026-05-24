# NASA Near-Earth Objects (NEO) Dashboard & Proxy API

This project is a high-performance, resilient dashboard for monitoring Near-Earth Objects using the NASA NeoWs API. It is split into a **FastAPI proxy backend** and a **React (Vite) typescript frontend**.

## Features & Implementation Specifications

1. **Upstream Limits Mitigation**: NASA's NeoWs API restricts single query feeds to 7 days. The proxy backend implements **automatic date chunking** to split large date queries into multiple sub-ranges of up to 7 days, fetching them in parallel.
2. **Concurrency Control**: A semaphore-restricted async gather handles parallel chunks, preventing client request flooding and avoiding immediate rate limit bans.
3. **SQLite-Backed Persistent Cache**: Uses `diskcache` to store retrieved daily data blocks. This ensures the dashboard doesn't consume unnecessary API keys quotas upon page refreshes, and avoids redundant network calls.
4. **90-Day Range Restriction**: Both frontend and backend enforce a strict 90-day maximum limit on date ranges, protecting resources and preventing rate limit exhaustion.
5. **Upstream 429 Rate-Limit Bubble**: Specifically intercepts NASA 429 status errors, translating them into a clean localizable error message that propagates to the user.
6. **Fully Localized Web Interface**: Multilingual support in English (EN) and Italian (IT) utilizing high-contrast styling (Jet Black in dark mode and Jet White in light mode).

---

## Project Structure

```
nasa-neo-dashboard/
├── backend/            # Python FastAPI backend service
│   ├── app/
│   │   ├── api/        # REST route definitions
│   │   ├── core/       # Configuration, environments, and caching systems
│   │   ├── services/   # NasaNeoClient service implementation
│   │   └── main.py     # FastAPI entry point
│   ├── tests/          # Pytest unit and integration test suite
│   ├── requirements.txt
│   └── .env            # Local backend environment file
├── frontend/           # React + TypeScript + Vite frontend
│   ├── src/            # Components, hooks, locales, and pages
│   ├── tailwind.config.js
│   └── package.json
└── README.md           # Root workspace documentation
```

---

## FastAPI Endpoints

The production API documentation is fully accessible online via Swagger UI at:
**[Live API Documentation (Render)](https://nasa-neo-dashboard-u0qn.onrender.com/docs)**

All backend endpoints are prefixed with `/api`.

### 1. GET `/health`
- **Description**: Returns backend API status.
- **Response**: `{"status": "ok", "service": "NASA NEO Proxy Backend"}`

### 2. GET `/api/asteroids`
- **Description**: Retrieves, flattens, and filters near-Earth object feed entries.
- **Query Parameters**:
  - `start_date` (string, required): Format `YYYY-MM-DD`.
  - `end_date` (string, required): Format `YYYY-MM-DD`.
  - `hazardous_only` (boolean, optional): If `true`, only returns potentially hazardous objects. Defaults to `false`.
  - `sort_by` (string, optional): One of `date`, `distance`, or `size`.
- **Error Responses**:
  - `400 Bad Request`: If date formats are invalid, start date is after end date, or date range exceeds 90 days.
  - `429 Too Many Requests`: If the upstream NASA API triggers a rate limit.
  - `502 Bad Gateway`: If the upstream NASA API fails entirely.

### 3. GET `/api/asteroids/charts`
- **Description**: Formats asteroid close-approach and diameter metrics into flat objects suitable for visualization libraries.
- **Query Parameters**:
  - `start_date` (string, required): Format `YYYY-MM-DD`.
  - `end_date` (string, required): Format `YYYY-MM-DD`.
- **Response Shape**:
  ```json
  {
    "chart_data": [
      {
        "date": "2026-05-22",
        "name": "Asteroid Name",
        "distance_km": 15000000.0,
        "size_km": 0.45,
        "is_hazardous": true
      }
    ]
  }
  ```

### 4. GET `/api/asteroids/{asteroid_id}`
- **Description**: Looks up raw detailed metadata for a specific asteroid from the NASA API.
- **Error Responses**:
  - `404 Not Found`: If the asteroid doesn't exist or is invalid.

---

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```sh
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```sh
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install required packages:
   ```sh
   pip install -r requirements.txt
   ```
4. Create a `.env` file from the configuration specifications:
   ```env
   NASA_API_KEY=DEMO_KEY  # Replace with a real NASA API key for higher rate limits
   NASA_BASE_URL=https://api.nasa.gov/neo/rest/v1
   CACHE_DIR=.cache
   CACHE_EXPIRE_SECONDS=86400
   ```
5. Run the server using Uvicorn:
   ```sh
   uvicorn app.main:app --reload
   ```
   The backend will be available at `http://localhost:8000`.

### Running Backend Tests
Ensure the virtual environment is active and execute pytest from the backend root:
```sh
venv\Scripts\python.exe -m pytest -v
```

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```sh
   cd ../frontend
   ```
2. Install Node dependencies:
   ```sh
   npm install
   ```
3. Run the development server:
   ```sh
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.
