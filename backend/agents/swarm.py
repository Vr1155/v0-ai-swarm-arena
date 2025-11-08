"""
Agent Swarm Manager
Coordinates multiple agents and their interactions
"""
from typing import List, Dict
from .base_agent import Agent

class SwarmManager:
    """Manages the agent swarm and their collaboration"""
    
    def __init__(self):
        self.agents: List[Agent] = []
        self.project_brief: str = ""
    
    def create_team(self, project_brief: str) -> List[Dict]:
        """Create a team of agents for the project"""
        self.project_brief = project_brief
        
        # Define agent team
        agent_configs = [
            {"id": "pm_1", "name": "Project Manager", "role": "PM", "color": "#3b82f6"},
            {"id": "dev_1", "name": "Lead Developer", "role": "Dev", "color": "#10b981"},
            {"id": "ux_1", "name": "UX Designer", "role": "UX", "color": "#f59e0b"},
            {"id": "qa_1", "name": "QA Engineer", "role": "QA", "color": "#ef4444"},
        ]
        
        self.agents = [
            Agent(
                agent_id=config["id"],
                name=config["name"],
                role=config["role"],
                color=config["color"]
            )
            for config in agent_configs
        ]
        
        # Return agent data for frontend
        return [
            {
                "id": agent.agent_id,
                "name": agent.name,
                "role": agent.role,
                "color": agent.color
            }
            for agent in self.agents
        ]
    
    def get_graph_data(self) -> Dict:
        """Generate graph nodes and links for visualization"""
        nodes = [
            {
                "id": agent.agent_id,
                "name": agent.name,
                "role": agent.role,
                "color": agent.color
            }
            for agent in self.agents
        ]
        
        # Create links between agents (everyone communicates with everyone)
        links = []
        for i, agent1 in enumerate(self.agents):
            for agent2 in self.agents[i+1:]:
                links.append({
                    "source": agent1.agent_id,
                    "target": agent2.agent_id,
                    "value": 1
                })
        
        return {"nodes": nodes, "links": links}
