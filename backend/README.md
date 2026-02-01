# ConvoSense Backend

This is the Flask-based backend for social media analysis.

## Setup

1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Environment Variables**:
    Update `.env` with your API keys.

3.  **Run the App**:
    ```bash
    python app.py
    ```

## Endpoints

- `GET /health`: Check if backend is alive.
- `POST /api/analyze`: Trigger a new analysis.
  - Body: `{ "query": "#AI", "sid": "socket_id" }`

## Real-time Updates (Socket.IO)

- Event: `status_update` -> Receives pipeline progress.
- Event: `analysis_result` -> Receives final data.
