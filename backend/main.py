from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import asyncio
from typing import List
import io
import zipfile

from agents.swarm import SwarmManager
from agents.simulator import DebateSimulator

app = FastAPI(title="AI Swarm Arena API")

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

swarm_manager = SwarmManager()
debate_simulator = None

# Request/Response models
class ProjectBrief(BaseModel):
    brief: str

class DebateCommand(BaseModel):
    command: str
    brief: str = ""

# Health check endpoint
@app.get("/")
async def root():
    return {"status": "AI Swarm Arena API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "connections": len(manager.active_connections)}

# Project brief endpoint
@app.post("/api/prompt")
async def receive_prompt(brief: ProjectBrief):
    """
    Receives project brief from frontend
    This will trigger agent generation in future implementation
    """
    return {
        "status": "received",
        "brief": brief.brief,
        "message": "Project brief received successfully"
    }

@app.post("/api/generate-team")
async def generate_team(brief: ProjectBrief):
    """Generate agent team and broadcast to all connected clients"""
    global swarm_manager, debate_simulator
    
    # Create agent team
    agents = swarm_manager.create_team(brief.brief)
    graph_data = swarm_manager.get_graph_data()
    
    # Initialize debate simulator
    debate_simulator = DebateSimulator(swarm_manager)
    
    # Broadcast to all connected clients
    await manager.broadcast({
        "event": "agents_generated",
        "data": {
            "agents": agents,
            "nodes": graph_data["nodes"],
            "links": graph_data["links"]
        }
    })
    
    return {
        "status": "success",
        "agents": agents,
        "graph": graph_data
    }

@app.post("/api/start-debate")
async def start_debate(brief: ProjectBrief):
    """Start the agent debate simulation"""
    global debate_simulator
    
    if not debate_simulator:
        return {"status": "error", "message": "Generate team first"}
    
    # Run debate in background
    asyncio.create_task(
        debate_simulator.run_debate(manager.broadcast, brief.brief)
    )
    
    return {"status": "started", "message": "Debate simulation started"}

# WebSocket endpoint for real-time communication
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            event = message.get("event")
            payload = message.get("data", {})
            
            if event == "generate_team":
                brief = payload.get("brief", "")
                agents = swarm_manager.create_team(brief)
                graph_data = swarm_manager.get_graph_data()
                
                global debate_simulator
                debate_simulator = DebateSimulator(swarm_manager)
                
                await manager.broadcast({
                    "event": "agents_generated",
                    "data": {
                        "agents": agents,
                        "nodes": graph_data["nodes"],
                        "links": graph_data["links"]
                    }
                })
            
            elif event == "start_debate":
                brief = payload.get("brief", "")
                if debate_simulator:
                    asyncio.create_task(
                        debate_simulator.run_debate(manager.broadcast, brief)
                    )
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print(f"Client disconnected. Active connections: {len(manager.active_connections)}")

# Download artifact endpoint
@app.get("/api/download")
async def download_artifact():
    """
    Generates and returns a ZIP file with mock project scaffold
    """
    # Create in-memory ZIP file
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Add mock files to ZIP
        zip_file.writestr('README.md', '''# AI Swarm Generated Project

This project was generated by AI Swarm Arena.

## Getting Started

1. Install dependencies
2. Configure environment variables
3. Run the development server

## Architecture

See ARCHITECTURE.md for detailed system design.
''')
        
        zip_file.writestr('ARCHITECTURE.md', '''# System Architecture

## Overview
This is a modern full-stack application.

## Components
- Frontend: React/Next.js
- Backend: FastAPI/Node.js
- Database: PostgreSQL

## Tech Stack
- TypeScript
- Tailwind CSS
- Docker
''')
        
        zip_file.writestr('package.json', json.dumps({
            "name": "ai-swarm-project",
            "version": "1.0.0",
            "description": "Generated by AI Swarm Arena",
            "scripts": {
                "dev": "next dev",
                "build": "next build",
                "start": "next start"
            }
        }, indent=2))
        
        zip_file.writestr('src/index.ts', '''// AI Swarm Generated Entry Point
console.log("Welcome to your AI-generated project!");

// TODO: Add your application logic here
''')
    
    zip_buffer.seek(0)
    
    return StreamingResponse(
        io.BytesIO(zip_buffer.getvalue()),
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=ai-swarm-project.zip"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
