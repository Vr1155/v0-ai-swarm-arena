import { create } from "zustand"
import type { Agent, Message, GraphNode, GraphLink, ArchitecturePlan, CodeFile } from "@/lib/types"
import type { SwarmRealtimeClient } from "@/lib/swarm-client"

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
  projectRequirements: Record<string, any> | null
  sessionId: string | null
  swarmClient: SwarmRealtimeClient | null
  systemMessage: string
  codeFiles: CodeFile[]
  swarmDocMarkdown: string | null
  planningStatus: "idle" | "in_progress" | "done" | "approved"

  setAgents: (agents: Agent[]) => void
  addMessage: (message: Message) => void
  updateGraph: (nodes: GraphNode[], links: GraphLink[]) => void
  setArchitecturePlan: (plan: ArchitecturePlan) => void
  setIsConnected: (connected: boolean) => void
  setIsDebating: (debating: boolean) => void
  setDebateFinished: (finished: boolean) => void
  setProjectBrief: (brief: string) => void
  setProjectRequirements: (req: Record<string, any>) => void
  setSessionId: (sessionId: string) => void
  setSwarmClient: (client: SwarmRealtimeClient | null) => void
  setSystemMessage: (message: string) => void
  addCodeFile: (file: CodeFile) => void
  setSwarmDocMarkdown: (doc: string | null) => void
  setPlanningStatus: (status: "idle" | "in_progress" | "done" | "approved") => void
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
  projectRequirements: null,
  sessionId: null,
  swarmClient: null,
  systemMessage: "",
  codeFiles: [],
  swarmDocMarkdown: null,
  planningStatus: "idle",

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
  setProjectRequirements: (req) => set({ projectRequirements: req }),
  setSessionId: (sessionId) => set({ sessionId }),
  setSwarmClient: (client) => set({ swarmClient: client }),
  setSystemMessage: (message) => set({ systemMessage: message }),
  addCodeFile: (file) =>
    set((state) => ({
      codeFiles: [...state.codeFiles, file],
    })),
  setSwarmDocMarkdown: (doc) => set({ swarmDocMarkdown: doc }),
  setPlanningStatus: (status) => set({ planningStatus: status }),
  reset: () =>
    set({
      agents: [],
      messages: [],
      graphNodes: [],
      graphLinks: [],
      architecturePlan: null,
      isDebating: false,
      debateFinished: false,
      projectBrief: "",
      projectRequirements: null,
      sessionId: null,
      swarmClient: null,
      systemMessage: "",
      codeFiles: [],
      swarmDocMarkdown: null,
      planningStatus: "idle",
    }),
}))
