export interface Agent {
  id: string
  name: string
  role: "PM" | "Dev" | "UX" | "QA"
  color: string
}

export interface Message {
  id: string
  agentId: string
  agentName: string
  agentRole: string
  content: string
  timestamp: number
  color: string
}

export interface GraphNode {
  id: string
  name: string
  role: string
  color: string
  x?: number
  y?: number
  vx?: number
  vy?: number
}

export interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  value: number
}

export interface ArchitecturePlan {
  projectName: string
  overview: string
  components: string[]
  techStack: string[]
  timeline: string
}
