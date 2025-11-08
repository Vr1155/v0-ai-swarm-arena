import { WS_URL } from "./constants"
import type { Message, GraphNode, GraphLink, ArchitecturePlan } from "./types"

export type WebSocketEventHandler = {
  onConnect?: () => void
  onDisconnect?: () => void
  onMessage?: (message: Message) => void
  onAgentsGenerated?: (data: { agents: any[]; nodes: GraphNode[]; links: GraphLink[] }) => void
  onDebateStart?: () => void
  onDebateEnd?: () => void
  onPlanReady?: (plan: ArchitecturePlan) => void
  onError?: (error: Error) => void
}

export class SwarmWebSocket {
  private ws: WebSocket | null = null
  private handlers: WebSocketEventHandler = {}
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout: NodeJS.Timeout | null = null

  constructor(handlers: WebSocketEventHandler) {
    this.handlers = handlers
  }

  connect() {
    try {
      this.ws = new WebSocket(WS_URL)

      this.ws.onopen = () => {
        console.log("[v0] WebSocket connected")
        this.reconnectAttempts = 0
        this.handlers.onConnect?.()
      }

      this.ws.onclose = () => {
        console.log("[v0] WebSocket disconnected")
        this.handlers.onDisconnect?.()
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        console.error("[v0] WebSocket error:", error)
        this.handlers.onError?.(new Error("WebSocket connection error"))
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error("[v0] Failed to parse WebSocket message:", error)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to create WebSocket:", error)
      this.handlers.onError?.(error as Error)
    }
  }

  private handleMessage(data: any) {
    const { event, data: payload } = data

    switch (event) {
      case "agent_message":
        this.handlers.onMessage?.(payload)
        break

      case "agents_generated":
        this.handlers.onAgentsGenerated?.(payload)
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

      default:
        console.log("[v0] Unknown WebSocket event:", event)
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("[v0] Max reconnection attempts reached")
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000)

    console.log(`[v0] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)

    this.reconnectTimeout = setTimeout(() => {
      this.connect()
    }, delay)
  }

  send(event: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }))
    } else {
      console.error("[v0] WebSocket is not connected")
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}
