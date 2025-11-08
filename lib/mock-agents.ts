import type { Agent, Message } from "./types"

export class MockAgentSimulator {
  private agents: Agent[] = []
  private messageCallback: ((message: Message) => void) | null = null
  private agentUpdateCallback: ((agent: Agent) => void) | null = null
  private completionCallback: ((plan: any) => void) | null = null
  private isRunning = false
  private currentRound = 0

  constructor(
    onMessage: (message: Message) => void,
    onAgentUpdate: (agent: Agent) => void,
    onCompletion: (plan: any) => void,
  ) {
    this.messageCallback = onMessage
    this.agentUpdateCallback = onAgentUpdate
    this.completionCallback = onCompletion
  }

  generateTeam(prompt: string) {
    const agentRoles = ["PM", "Dev", "UX", "QA"] as const

    this.agents = agentRoles.map((role, index) => ({
      id: `agent-${role.toLowerCase()}`,
      name: `${role} Agent`,
      role,
      status: "idle" as const,
      x: 300 + Math.cos((index * Math.PI * 2) / 4) * 100,
      y: 300 + Math.sin((index * Math.PI * 2) / 4) * 100,
    }))

    this.agents.forEach((agent) => {
      this.agentUpdateCallback?.(agent)
    })

    return this.agents
  }

  async startDebate() {
    if (this.isRunning) return

    this.isRunning = true
    this.currentRound = 0

    // Update all agents to active
    this.agents.forEach((agent) => {
      agent.status = "active"
      this.agentUpdateCallback?.(agent)
    })

    // Run 2 rounds of debate
    for (let round = 1; round <= 2; round++) {
      this.currentRound = round
      await this.runDebateRound(round)
    }

    // Mark completion
    this.agents.forEach((agent) => {
      agent.status = "completed"
      this.agentUpdateCallback?.(agent)
    })

    // Generate architecture plan
    const plan = this.generateArchitecturePlan()
    this.completionCallback?.(plan)

    this.isRunning = false
  }

  private async runDebateRound(round: number) {
    const messages = this.getDebateMessages(round)

    for (const msg of messages) {
      await this.delay(1500) // 1.5 second delay between messages
      this.messageCallback?.(msg)
    }
  }

  private getDebateMessages(round: number): Message[] {
    const timestamp = new Date().toISOString()

    if (round === 1) {
      return [
        {
          id: `msg-pm-${round}-1`,
          agentId: "agent-pm",
          agentRole: "PM",
          content:
            "Let's break down the project requirements. We need to define the core features and user flows first.",
          timestamp,
          type: "chat",
        },
        {
          id: `msg-ux-${round}-1`,
          agentId: "agent-ux",
          agentRole: "UX",
          content:
            "I suggest we start with a mobile-first design approach. The user interface should be intuitive and accessible.",
          timestamp,
          type: "chat",
        },
        {
          id: `msg-dev-${round}-1`,
          agentId: "agent-dev",
          agentRole: "Dev",
          content:
            "For the tech stack, I recommend Next.js for the frontend and FastAPI for the backend. We'll need a PostgreSQL database.",
          timestamp,
          type: "chat",
        },
        {
          id: `msg-qa-${round}-1`,
          agentId: "agent-qa",
          agentRole: "QA",
          content:
            "We should establish testing criteria early. I'll need E2E tests, unit tests, and accessibility audits in place.",
          timestamp,
          type: "chat",
        },
      ]
    } else {
      return [
        {
          id: `msg-pm-${round}-2`,
          agentId: "agent-pm",
          agentRole: "PM",
          content:
            "Great progress team! Let's prioritize the MVP features. We need authentication, core functionality, and basic analytics.",
          timestamp,
          type: "chat",
        },
        {
          id: `msg-dev-${round}-2`,
          agentId: "agent-dev",
          agentRole: "Dev",
          content:
            "I'll set up Supabase for auth and database. We can use their real-time subscriptions for live updates.",
          timestamp,
          type: "chat",
        },
        {
          id: `msg-ux-${round}-2`,
          agentId: "agent-ux",
          agentRole: "UX",
          content:
            "I'll create wireframes for the main user flows. We should use a component library like shadcn/ui for consistency.",
          timestamp,
          type: "chat",
        },
        {
          id: `msg-qa-${round}-2`,
          agentId: "agent-qa",
          agentRole: "QA",
          content:
            "All agreed. I'll prepare test plans for each feature. Let's ensure we have proper error handling throughout.",
          timestamp,
          type: "chat",
        },
      ]
    }
  }

  private generateArchitecturePlan() {
    return {
      version: "1.0.0",
      generated: new Date().toISOString(),
      architecture: {
        frontend: {
          framework: "Next.js 14",
          styling: "Tailwind CSS",
          components: "shadcn/ui",
          stateManagement: "Zustand",
          features: ["Server-side rendering", "Client-side routing", "WebSocket integration", "Responsive design"],
        },
        backend: {
          framework: "FastAPI",
          database: "Supabase PostgreSQL",
          authentication: "Supabase Auth",
          apis: ["/api/prompt - Project input", "/api/download - Artifact generation", "/ws - WebSocket connection"],
        },
        infrastructure: {
          hosting: "Vercel",
          database: "Supabase",
          cdn: "Vercel Edge Network",
        },
      },
      features: [
        "User authentication",
        "Real-time updates",
        "Project generation",
        "Architecture visualization",
        "Artifact download",
      ],
      timeline: {
        phase1: "MVP - 2 weeks",
        phase2: "Beta - 4 weeks",
        phase3: "Production - 6 weeks",
      },
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  stop() {
    this.isRunning = false
  }
}
