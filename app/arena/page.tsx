"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSwarmStore } from "@/store/swarm-store"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SwarmInputArea } from "@/components/dashboard/swarm-input-area"
import { AgentNetwork } from "@/components/dashboard/agent-network"
import { SwarmSSEClient } from "@/lib/sse-client"
import { toast } from "sonner"

export default function ArenaPage() {
  const router = useRouter()
  const {
    projectBrief,
    setIsConnected,
    addMessage,
    setAgents,
    updateGraph,
    setArchitecturePlan,
    setIsDebating,
    addCodeFile,
    setSystemMessage,
    setDebateFinished,
  } = useSwarmStore()
  const sseRef = useRef<SwarmSSEClient | null>(null)

  useEffect(() => {
    // Redirect to home if no project brief
    if (!projectBrief) {
      router.push("/")
      return
    }

    sseRef.current = new SwarmSSEClient({
      onConnect: () => {
        setIsConnected(true)
        toast.success("Connected to AI Swarm Arena")
      },
      onDisconnect: () => {
        setIsConnected(false)
      },
      onMessage: (message) => {
        addMessage(message)
      },
      onAgentsGenerated: ({ agents, nodes, links }) => {
        setAgents(agents)
        updateGraph(nodes, links)
        const pmAgent = agents.find((a) => a.role === "PM")
        if (pmAgent) {
          addMessage({
            id: `pm-intro-${Date.now()}`,
            agentId: pmAgent.id,
            agentName: pmAgent.name,
            agentRole: pmAgent.role,
            content: `For your project, I have created these agents: ${agents.map((a) => a.role).join(", ")}. Let's start collaborating!`,
            timestamp: Date.now(),
            color: pmAgent.color,
          })
        }
        toast.success("Agent team generated!")
      },
      onDebateStart: () => {
        setIsDebating(true)
        toast.info("Agent debate in progress...")
      },
      onDebateEnd: () => {
        setIsDebating(false)
        setDebateFinished(true)
        toast.success("Debate completed!")
      },
      onPlanReady: (plan) => {
        setArchitecturePlan(plan)
        toast.success("Architecture plan is ready!")
      },
      onCodeGenerated: (file) => {
        addCodeFile(file)
        toast.info(`Generated: ${file.path}`)
      },
      onError: (error) => {
        console.error("[v0] Arena: SSE error", error)
        toast.error("Connection error occurred")
      },
    })

    sseRef.current.connect()

    return () => {
      sseRef.current?.disconnect()
    }
  }, [
    projectBrief,
    router,
    setIsConnected,
    addMessage,
    setAgents,
    updateGraph,
    setArchitecturePlan,
    setIsDebating,
    setSystemMessage,
    addCodeFile,
    setDebateFinished,
  ])

  useEffect(() => {
    if (sseRef.current) {
      useSwarmStore.setState({ sseClient: sseRef.current })
    }
  }, [])

  if (!projectBrief) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-primary/15 blur-[120px] floating-orb" />
        <div
          className="absolute bottom-40 left-20 w-80 h-80 rounded-full bg-secondary/15 blur-[100px] floating-orb"
          style={{ animationDelay: "3s" }}
        />
      </div>

      <DashboardHeader />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8 relative">
        <SwarmInputArea />
        <AgentNetwork />
      </main>
    </div>
  )
}
