import { create } from "zustand"
import type { Agent, Message, GraphNode, GraphLink, ArchitecturePlan } from "@/lib/types"
import type { SwarmSSEClient } from "@/lib/sse-client"

interface SwarmState {
  agents: Agent[]
  messages: Message[]
  graphNodes: GraphNode[]
  graphLinks: GraphLink[]
  architecturePlan: ArchitecturePlan | null
  isConnected: boolean
  isDebating: boolean
  projectBrief: string
  sseClient: SwarmSSEClient | null

  setAgents: (agents: Agent[]) => void
  addMessage: (message: Message) => void
  updateGraph: (nodes: GraphNode[], links: GraphLink[]) => void
  setArchitecturePlan: (plan: ArchitecturePlan) => void
  setIsConnected: (connected: boolean) => void
  setIsDebating: (debating: boolean) => void
  setProjectBrief: (brief: string) => void
  reset: () => void
}

export const useSwarmStore = create<SwarmState>((set) => ({
  agents: [],
  messages: [],
  graphNodes: [],
  graphLinks: [],
  architecturePlan: null,
  isConnected: false,
  isDebating: false,
  projectBrief: "",
  sseClient: null,

  setAgents: (agents) => set({ agents }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  updateGraph: (nodes, links) =>
    set({
      graphNodes: nodes,
      graphLinks: links,
    }),
  setArchitecturePlan: (plan) => set({ architecturePlan: plan }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setIsDebating: (debating) => set({ isDebating: debating }),
  setProjectBrief: (brief) => set({ projectBrief: brief }),
  reset: () =>
    set({
      agents: [],
      messages: [],
      graphNodes: [],
      graphLinks: [],
      architecturePlan: null,
      isDebating: false,
    }),
}))
