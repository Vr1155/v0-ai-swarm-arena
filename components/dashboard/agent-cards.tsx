"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSwarmStore } from "@/store/swarm-store"
import { Brain, MessageSquare, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function AgentCards() {
  const { agents, messages, isDebating } = useSwarmStore()

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">No Agents Yet</h3>
          <p className="text-muted-foreground max-w-md">
            Click "Generate Team" to create your AI agent team and watch them collaborate in real-time
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      {isDebating && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 text-sm font-medium text-primary"
        >
          <Brain className="w-4 h-4 animate-pulse" />
          Agents are debating and collaborating...
        </motion.div>
      )}

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function AgentCard({ agent }: { agent: { id: string; name: string; role: string; color: string } }) {
  const { messages } = useSwarmStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Get messages for this specific agent
  const agentMessages = messages.filter((m) => m.agentId === agent.id)
  const latestMessage = agentMessages[agentMessages.length - 1]

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [agentMessages])

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <Card className="h-[400px] flex flex-col border-2 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3 space-y-3">
          {/* Agent Icon with Color */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: agent.color,
                boxShadow: `0 0 20px ${agent.color}40`,
              }}
            >
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{agent.name}</h3>
              <Badge variant="secondary" className="text-xs">
                {agent.role}
              </Badge>
            </div>
          </div>

          {/* Agent Status */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="w-3 h-3" />
            <span>{agentMessages.length} thoughts</span>
            {latestMessage && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 rounded-full bg-green-500 ml-auto"
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 min-h-0 p-0">
          <ScrollArea className="h-full px-4 pb-4" ref={scrollRef}>
            {agentMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                Waiting to contribute...
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {agentMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1"
                    >
                      <div className="text-xs text-muted-foreground">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-sm bg-muted/50 rounded-lg p-2 leading-relaxed">{message.content}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  )
}
