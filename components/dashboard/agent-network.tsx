"use client"

import { useEffect, useState } from "react"
import { useSwarmStore } from "@/store/swarm-store"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, Cog, Users, Code, Palette, ClipboardCheck } from "lucide-react"

// Icon mapping for different agent roles
const ROLE_ICONS = {
  PM: Users,
  Dev: Code,
  UX: Palette,
  QA: ClipboardCheck,
}

// Communication line types based on message content
const getLineType = (content: string) => {
  const lower = content.toLowerCase()
  if (lower.includes("agree") || lower.includes("approved")) return "agreement"
  if (lower.includes("delegate") || lower.includes("assign")) return "delegation"
  if (lower.includes("negotiate") || lower.includes("compromise")) return "negotiation"
  return "debate"
}

const LINE_STYLES = {
  debate: { color: "#ef4444", dashArray: "5,5", label: "Debate" },
  agreement: { color: "#10b981", dashArray: "0", label: "Agreement" },
  delegation: { color: "#3b82f6", dashArray: "0", label: "Delegation" },
  negotiation: { color: "#f97316", dashArray: "8,4", label: "Negotiation" },
}

interface AgentConnection {
  from: string
  to: string
  type: "debate" | "agreement" | "delegation" | "negotiation"
  timestamp: number
}

interface ChatBubble {
  id: string
  agentId: string
  content: string
  timestamp: number
}

export function AgentNetwork() {
  const { agents, messages, isDebating } = useSwarmStore()
  const [connections, setConnections] = useState<AgentConnection[]>([])
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set())
  const [chatBubbles, setChatBubbles] = useState<ChatBubble[]>([])

  // Track agent connections based on messages
  useEffect(() => {
    if (messages.length === 0) return

    const latestMessage = messages[messages.length - 1]
    const fromAgent = latestMessage.agentId

    setChatBubbles((prev) => [
      ...prev,
      {
        id: latestMessage.id,
        agentId: latestMessage.agentId,
        content: latestMessage.content,
        timestamp: Date.now(),
      },
    ])

    setTimeout(() => {
      setChatBubbles((prev) => prev.filter((b) => b.id !== latestMessage.id))
    }, 5000)

    // Determine which agent this message is directed to (simplified)
    const toAgent = agents.find((a) => a.id !== fromAgent)?.id

    if (toAgent) {
      const lineType = getLineType(latestMessage.content)
      setConnections((prev) => [
        ...prev.slice(-10), // Keep last 10 connections
        {
          from: fromAgent,
          to: toAgent,
          type: lineType,
          timestamp: Date.now(),
        },
      ])

      // Show agent as active
      setActiveAgents((prev) => new Set(prev).add(fromAgent))
      setTimeout(() => {
        setActiveAgents((prev) => {
          const next = new Set(prev)
          next.delete(fromAgent)
          return next
        })
      }, 2000)
    }
  }, [messages, agents])

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <Brain className="w-12 h-12 text-primary" />
        </motion.div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">Agent Network Offline</h3>
          <p className="text-muted-foreground max-w-md">
            Generate your AI agent team to see them collaborate in real-time
          </p>
        </div>
      </div>
    )
  }

  // Calculate positions for agents in a circle
  const containerWidth = 800
  const containerHeight = 600
  const centerX = containerWidth / 2
  const centerY = containerHeight / 2
  const radius = 180
  const CIRCLE_RADIUS = 48 // Half of the agent circle's 96px (w-24) width
  const agentPositions = agents.map((agent, index) => {
    const angle = (index / agents.length) * 2 * Math.PI - Math.PI / 2
    return {
      ...agent,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    }
  })

  const getLineCoordinates = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    // Calculate angle between two points
    const dx = to.x - from.x
    const dy = to.y - from.y
    const angle = Math.atan2(dy, dx)

    // Calculate start point at edge of 'from' circle
    const x1 = from.x + CIRCLE_RADIUS * Math.cos(angle)
    const y1 = from.y + CIRCLE_RADIUS * Math.sin(angle)

    // Calculate end point at edge of 'to' circle
    const x2 = to.x - CIRCLE_RADIUS * Math.cos(angle)
    const y2 = to.y - CIRCLE_RADIUS * Math.sin(angle)

    return { x1, y1, x2, y2 }
  }

  return (
    <div className="relative w-full h-[600px] glass-effect rounded-2xl border-2 border-primary/20 overflow-hidden shadow-2xl">
      <div
        className="absolute inset-0 bg-black/40"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, oklch(0.7 0.3 260 / 0.1) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* SVG for connections */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
        <defs>
          {/* Glow filters for lines */}
          {Object.entries(LINE_STYLES).map(([type, style]) => (
            <filter key={type} id={`glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        <AnimatePresence>
          {connections.map((conn, index) => {
            const fromPos = agentPositions.find((a) => a.id === conn.from)
            const toPos = agentPositions.find((a) => a.id === conn.to)
            if (!fromPos || !toPos) return null

            const { x1, y1, x2, y2 } = getLineCoordinates(fromPos, toPos)
            const style = LINE_STYLES[conn.type]

            return (
              <motion.line
                key={`${conn.from}-${conn.to}-${index}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={style.color}
                strokeWidth="3"
                strokeDasharray={style.dashArray}
                filter={`url(#glow-${conn.type})`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            )
          })}
        </AnimatePresence>
      </svg>

      {/* Agent nodes */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        <AnimatePresence>
          {agentPositions.map((agent, index) => {
            const Icon = ROLE_ICONS[agent.role as keyof typeof ROLE_ICONS] || Brain
            const isActive = activeAgents.has(agent.id)
            const activeBubble = chatBubbles.find((b) => b.agentId === agent.id)

            return (
              <motion.div
                key={agent.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, type: "spring" }}
                className="absolute"
                style={{
                  left: `${agent.x}px`,
                  top: `${agent.y}px`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {/* Glow effect when active */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: agent.color,
                      filter: "blur(20px)",
                    }}
                  />
                )}

                {/* Agent circle */}
                <motion.div
                  animate={
                    isActive
                      ? {
                          scale: [1, 1.1, 1],
                          boxShadow: [
                            `0 0 20px ${agent.color}40`,
                            `0 0 40px ${agent.color}80`,
                            `0 0 20px ${agent.color}40`,
                          ],
                        }
                      : {}
                  }
                  transition={{ duration: 0.6 }}
                  className="relative w-24 h-24 rounded-full flex items-center justify-center cursor-pointer group"
                  style={{
                    backgroundColor: agent.color,
                    boxShadow: `0 0 30px ${agent.color}40`,
                  }}
                >
                  {/* Icon */}
                  <Icon className="w-10 h-10 text-white relative z-10" />

                  {/* Pulse ring when speaking */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                      className="absolute inset-0 rounded-full border-4 border-white"
                    />
                  )}

                  {/* Tooltip on hover */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-popover text-popover-foreground text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap border">
                      {agent.name}
                    </div>
                  </div>
                </motion.div>

                {/* Agent name label */}
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center w-32">
                  <div className="text-sm font-semibold">{agent.role}</div>
                  <div className="text-xs text-muted-foreground truncate">{agent.name}</div>
                </div>

                <AnimatePresence>
                  {activeBubble && (
                    <motion.div
                      key={activeBubble.id}
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", duration: 0.4 }}
                      className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 pointer-events-none"
                      style={{ zIndex: 10 }}
                    >
                      {/* Speech bubble */}
                      <div
                        className="relative bg-card/95 backdrop-blur-sm text-card-foreground rounded-2xl px-4 py-3 shadow-xl border-2"
                        style={{
                          borderColor: agent.color,
                          boxShadow: `0 4px 20px ${agent.color}40`,
                        }}
                      >
                        {/* Bubble content */}
                        <p className="text-xs leading-relaxed text-balance">{activeBubble.content}</p>

                        {/* Tail pointing to agent */}
                        <div
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-r-2 border-b-2"
                          style={{
                            backgroundColor: "hsl(var(--card))",
                            borderColor: agent.color,
                          }}
                        />

                        {/* Subtle typing animation dots when message first appears */}
                        {Date.now() - activeBubble.timestamp < 1000 && (
                          <div className="absolute -bottom-1 right-3 flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: agent.color }}
                                animate={{
                                  y: [0, -4, 0],
                                  opacity: [0.5, 1, 0.5],
                                }}
                                transition={{
                                  duration: 0.6,
                                  repeat: Number.POSITIVE_INFINITY,
                                  delay: i * 0.1,
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {isDebating && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 left-1/2 -translate-x-1/2 gradient-primary text-white px-6 py-3 rounded-full text-sm font-semibold flex items-center gap-3 shadow-xl glow-primary"
          style={{ zIndex: 3 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Cog className="w-5 h-5" />
          </motion.div>
          Agents Collaborating...
        </motion.div>
      )}
    </div>
  )
}
