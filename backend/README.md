# AI Swarm Arena Backend

FastAPI backend for AI Swarm Arena - handles WebSocket connections, agent simulation, and artifact generation.

## Setup

1. Install Python 3.11+
2. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

3. Run the server:
   \`\`\`bash
   uvicorn main:app --reload
   \`\`\`

The API will be available at `http://localhost:8000`

## API Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health status
- `POST /api/prompt` - Submit project brief
- `WebSocket /ws` - Real-time communication
- `GET /api/download` - Download project artifact

## Development

The backend is structured for easy integration with:
- **LangGraph**: Add to `agents/` directory
- **Supabase**: Configure in `db.py`
- **ElevenLabs**: Add voice synthesis in `agents/`

## Docker

Build and run with Docker:
\`\`\`bash
docker build -t ai-swarm-backend .
docker run -p 8000:8000 ai-swarm-backend
