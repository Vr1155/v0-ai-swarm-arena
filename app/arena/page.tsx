"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSwarmStore } from "@/store/swarm-store"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SwarmInputArea } from "@/components/dashboard/swarm-input-area"
import { AgentNetwork } from "@/components/dashboard/agent-network"
import { SwarmRealtimeClient } from "@/lib/swarm-client"
import { toast } from "sonner"

export default function ArenaPage() {
  const router = useRouter()
  const {
    projectBrief,
    projectRequirements,
    sessionId,
    setIsConnected,
    addMessage,
    setAgents,
    updateGraph,
    setArchitecturePlan,
    setIsDebating,
    addCodeFile,
    setDebateFinished,
    setSwarmClient,
    setSwarmDocMarkdown,
    setPlanningStatus,
  } = useSwarmStore()
  const clientRef = useRef<SwarmRealtimeClient | null>(null)

  useEffect(() => {
    // Redirect to home if no project brief
    if (!projectBrief || (!projectRequirements && !sessionId)) {
      router.push("/")
      return
    }

    const client = new SwarmRealtimeClient(
      {
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
        toast.success("Agent team generated!")
      },
      onDebateStart: () => {
        setPlanningStatus("in_progress")
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
        setPlanningStatus("done")
        toast.success("Architecture plan is ready!")
      },
      onCodeGenerated: (file) => {
        addCodeFile(file)
        setSwarmDocMarkdown(file.content)
        toast.info(`Generated: ${file.path}`)
      },
      onError: (error) => {
        console.error("[v0] Arena: SSE error", error)
        setPlanningStatus("idle")
        toast.error("Connection error occurred")
      },
    },
      sessionId,
      projectRequirements,
    )

    clientRef.current = client
    setSwarmClient(client)

    return () => {
      client.disconnect()
      setSwarmClient(null)
    }
  }, [
    projectBrief,
    projectRequirements,
    sessionId,
    router,
    setIsConnected,
    addMessage,
    setAgents,
    updateGraph,
    setArchitecturePlan,
    setIsDebating,
    addCodeFile,
    setDebateFinished,
    setSwarmClient,
    setSwarmDocMarkdown,
    setPlanningStatus,
  ])

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
