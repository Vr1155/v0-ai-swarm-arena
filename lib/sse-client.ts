import type { Message, GraphNode, GraphLink, ArchitecturePlan, Agent, CodeFile } from "./types"

export type SSEEventHandler = {
  onConnect?: () => void
  onDisconnect?: () => void
  onMessage?: (message: Message) => void
  onAgentsGenerated?: (data: { agents: Agent[]; nodes: GraphNode[]; links: GraphLink[] }) => void
  onDebateStart?: () => void
  onDebateEnd?: () => void
  onPlanReady?: (plan: ArchitecturePlan) => void
  onCodeGenerated?: (file: CodeFile) => void
  onError?: (error: Error) => void
}

export class SwarmSSEClient {
  private eventSource: EventSource | null = null
  private handlers: SSEEventHandler = {}
  private isConnectedState = false

  constructor(handlers: SSEEventHandler) {
    this.handlers = handlers
  }

  connect() {
    this.isConnectedState = true
    this.handlers.onConnect?.()
  }

  async generateAgents(projectBrief: string): Promise<void> {
    try {
      const response = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectBrief }),
      })

      if (!response.ok) throw new Error("Failed to generate team")

      const data = await response.json()
      this.handlers.onAgentsGenerated?.(data)
    } catch (error) {
      console.error("[v0] Error generating team:", error)
      this.handlers.onError?.(error as Error)
      throw error
    }
  }

  async startDebate(projectBrief: string, agents?: Agent[]): Promise<void> {
    try {
      this.handlers.onDebateStart?.()

      const response = await fetch("/api/debate/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectBrief, agents: agents || [] }),
      })

      if (!response.ok) throw new Error("Failed to start debate")
      if (!response.body) throw new Error("No response body")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6))
            this.handleSSEMessage(data)
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error in debate stream:", error)
      this.handlers.onError?.(error as Error)
      throw error
    }
  }

  private handleSSEMessage(data: any) {
    const { type, data: payload } = data

    switch (type) {
      case "message":
        this.handlers.onMessage?.(payload)
        break

      case "debate_start":
        this.handlers.onDebateStart?.()
        break

      case "debate_end":
        this.handlers.onDebateEnd?.()
        break

      case "plan_ready":
        this.handlers.onPlanReady?.(payload)
        break

      case "code_generated":
        this.handlers.onCodeGenerated?.(payload)
        break

      default:
        console.log("[v0] Unknown SSE event:", type)
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    this.isConnectedState = false
    this.handlers.onDisconnect?.()
  }

  isConnected(): boolean {
    return this.isConnectedState
  }
}
