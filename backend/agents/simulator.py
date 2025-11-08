"""
Mock Agent Debate Simulator
Simulates intelligent debate between AI agents
"""
import asyncio
import random
from typing import List, Dict
from datetime import datetime
from .swarm import SwarmManager

class DebateSimulator:
    """Simulates realistic agent debates with timed messages"""
    
    def __init__(self, swarm_manager: SwarmManager):
        self.swarm = swarm_manager
        self.debate_rounds = 2
        self.is_running = False
    
    def generate_debate_messages(self, project_brief: str) -> List[Dict]:
        """Generate realistic debate messages for each agent"""
        
        messages_by_round = {
            1: {
                "PM": [
                    f"Let's break down '{project_brief}'. I see this as a multi-phase project requiring careful planning.",
                    "We need to identify core features, user stories, and technical constraints first.",
                ],
                "Dev": [
                    "From a technical perspective, we should consider scalability and maintainability.",
                    "I suggest we start with a solid architecture foundation before diving into implementation.",
                ],
                "UX": [
                    "User experience should drive our decisions. Who is the target audience?",
                    "Let's ensure we're solving real user pain points, not just building features.",
                ],
                "QA": [
                    "We need clear acceptance criteria and testability for every feature.",
                    "Quality gates should be established early to prevent technical debt.",
                ]
            },
            2: {
                "PM": [
                    "Based on our discussion, I propose we prioritize MVP features for faster time-to-market.",
                    "Let's define sprint goals and deliverables for the next 4 weeks.",
                ],
                "Dev": [
                    "I'll create a technical architecture document with component diagrams.",
                    "We can use modern frameworks and best practices to accelerate development.",
                ],
                "UX": [
                    "I'll work on user flows and wireframes based on our target personas.",
                    "Let's conduct quick user research to validate our assumptions.",
                ],
                "QA": [
                    "I'll prepare test plans and automation strategy for CI/CD pipeline.",
                    "We should implement both unit tests and integration tests from day one.",
                ]
            }
        }
        
        all_messages = []
        for round_num in range(1, self.debate_rounds + 1):
            for agent in self.swarm.agents:
                role_messages = messages_by_round.get(round_num, {}).get(agent.role, [])
                for msg_content in role_messages:
                    all_messages.append({
                        "agent": agent,
                        "content": msg_content,
                        "round": round_num
                    })
        
        return all_messages
    
    async def run_debate(self, websocket_broadcast, project_brief: str):
        """
        Run the mock debate simulation
        Broadcasts messages in real-time via WebSocket
        """
        self.is_running = True
        
        # Generate debate messages
        messages = self.generate_debate_messages(project_brief)
        
        # Broadcast debate start
        await websocket_broadcast({
            "event": "debate_start",
            "data": {"message": "Agent debate has begun"}
        })
        
        # Send messages with realistic timing
        for msg_data in messages:
            if not self.is_running:
                break
            
            agent = msg_data["agent"]
            message = agent.create_message(msg_data["content"])
            
            # Broadcast the message
            await websocket_broadcast({
                "event": "agent_message",
                "data": message
            })
            
            # Random delay between messages (1-3 seconds)
            await asyncio.sleep(random.uniform(1.0, 3.0))
        
        # Broadcast debate end
        await websocket_broadcast({
            "event": "debate_end",
            "data": {"message": "Debate completed"}
        })
        
        # Generate architecture plan
        plan = self.generate_architecture_plan(project_brief)
        await websocket_broadcast({
            "event": "plan_ready",
            "data": plan
        })
        
        self.is_running = False
    
    def generate_architecture_plan(self, project_brief: str) -> Dict:
        """Generate a mock architecture plan"""
        return {
            "projectName": "AI-Generated Project",
            "overview": f"Comprehensive solution for: {project_brief}",
            "components": [
                "Frontend (React/Next.js)",
                "Backend API (FastAPI/Node.js)",
                "Database (PostgreSQL/MongoDB)",
                "Authentication System",
                "Real-time Updates (WebSocket)",
                "CI/CD Pipeline"
            ],
            "techStack": [
                "React 19",
                "Next.js 15",
                "TypeScript",
                "Tailwind CSS",
                "FastAPI",
                "PostgreSQL",
                "Docker",
                "GitHub Actions"
            ],
            "timeline": "4-6 weeks for MVP development"
        }
    
    def stop_debate(self):
        """Stop the ongoing debate"""
        self.is_running = False
