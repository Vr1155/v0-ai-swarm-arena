"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSwarmStore } from "@/store/swarm-store"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { VisualizationPanel } from "@/components/dashboard/visualization-panel"
import { ChatPanel } from "@/components/dashboard/chat-panel"
import { ControlBar } from "@/components/dashboard/control-bar"
import { SwarmSSEClient } from "@/lib/sse-client"
import { toast } from "sonner"

export default function DashboardPage() {
  const router = useRouter()
  const { projectBrief, setIsConnected, addMessage, setAgents, updateGraph, setArchitecturePlan, setIsDebating } =
    useSwarmStore()
  const sseRef = useRef<SwarmSSEClient | null>(null)

  useEffect(() => {
    // Redirect to home if no project brief
    if (!projectBrief) {
      router.push("/")
      return
    }

    sseRef.current = new SwarmSSEClient({
      onConnect: () => {
        console.log("[v0] Dashboard: SSE connected")
        setIsConnected(true)
        toast.success("Connected to AI Swarm Arena")
      },
      onDisconnect: () => {
        console.log("[v0] Dashboard: SSE disconnected")
        setIsConnected(false)
      },
      onMessage: (message) => {
        console.log("[v0] Dashboard: Received agent message", message)
        addMessage(message)
      },
      onAgentsGenerated: ({ agents, nodes, links }) => {
        console.log("[v0] Dashboard: Agents generated", agents)
        setAgents(agents)
        updateGraph(nodes, links)
        toast.success("Agent team generated!")
      },
      onDebateStart: () => {
        console.log("[v0] Dashboard: Debate started")
        setIsDebating(true)
        toast.info("Agent debate in progress...")
      },
      onDebateEnd: () => {
        console.log("[v0] Dashboard: Debate ended")
        setIsDebating(false)
        toast.success("Debate completed!")
      },
      onPlanReady: (plan) => {
        console.log("[v0] Dashboard: Architecture plan ready", plan)
        setArchitecturePlan(plan)
        toast.success("Architecture plan is ready!")
      },
      onError: (error) => {
        console.error("[v0] Dashboard: SSE error", error)
        toast.error("Connection error occurred")
      },
    })

    sseRef.current.connect()

    // Cleanup on unmount
    return () => {
      sseRef.current?.disconnect()
    }
  }, [projectBrief, router, setIsConnected, addMessage, setAgents, updateGraph, setArchitecturePlan, setIsDebating])

  useEffect(() => {
    if (sseRef.current) {
      useSwarmStore.setState({ sseClient: sseRef.current })
    }
  }, [])

  if (!projectBrief) {
    return null
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <DashboardHeader />

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        {/* Main Visualization Area */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <VisualizationPanel />
          <ControlBar />
        </div>

        {/* Side Chat Panel */}
        <ChatPanel />
      </div>
    </div>
  )
}
