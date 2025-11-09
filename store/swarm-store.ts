import { create } from "zustand"
import type { Agent, Message, GraphNode, GraphLink, ArchitecturePlan, CodeFile } from "@/lib/types"
import type { SwarmSSEClient } from "@/lib/sse-client"

interface SwarmState {
  agents: Agent[]
  messages: Message[]
  graphNodes: GraphNode[]
  graphLinks: GraphLink[]
  architecturePlan: ArchitecturePlan | null
  isConnected: boolean
  isDebating: boolean
  debateFinished: boolean
  projectBrief: string
  sessionId: string | null
  sseClient: SwarmSSEClient | null
  systemMessage: string
  codeFiles: CodeFile[]

  setAgents: (agents: Agent[]) => void
  addMessage: (message: Message) => void
  updateGraph: (nodes: GraphNode[], links: GraphLink[]) => void
  setArchitecturePlan: (plan: ArchitecturePlan) => void
  setIsConnected: (connected: boolean) => void
  setIsDebating: (debating: boolean) => void
  setDebateFinished: (finished: boolean) => void
  setProjectBrief: (brief: string) => void
  setSessionId: (sessionId: string) => void
  setSystemMessage: (message: string) => void
  addCodeFile: (file: CodeFile) => void
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
  debateFinished: false,
  projectBrief: "",
  sessionId: null,
  sseClient: null,
  systemMessage: "",
  codeFiles: [],

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
  setDebateFinished: (finished) => set({ debateFinished: finished }),
  setProjectBrief: (brief) => set({ projectBrief: brief }),
  setSessionId: (sessionId) => set({ sessionId }),
  setSystemMessage: (message) => set({ systemMessage: message }),
  addCodeFile: (file) =>
    set((state) => ({
      codeFiles: [...state.codeFiles, file],
    })),
  reset: () =>
    set({
      agents: [],
      messages: [],
      graphNodes: [],
      graphLinks: [],
      architecturePlan: null,
      isDebating: false,
      debateFinished: false,
      systemMessage: "",
      codeFiles: [],
    }),
}))
