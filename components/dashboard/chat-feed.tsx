"use client"

import { useEffect, useRef } from "react"
import { useSwarmStore } from "@/store/swarm-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Bot } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function ChatFeed() {
  const { messages, systemMessage, agents } = useSwarmStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <Card className="h-[800px] flex flex-col border-2 border-primary/20">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="w-5 h-5 text-primary" />
          Agent Conversation
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-4 space-y-4">
            {/* System message */}
            {systemMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20"
              >
                <Bot className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{systemMessage}</p>
                </div>
              </motion.div>
            )}

            {/* Agent messages */}
            <AnimatePresence initial={false}>
              {messages.map((message, index) => {
                const agent = agents.find((a) => a.id === message.agentId)
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    {/* Agent avatar */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: message.color }}
                    >
                      {message.agentRole.substring(0, 2)}
                    </div>

                    {/* Message content */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold" style={{ color: message.color }}>
                          {message.agentName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed">{message.content}</p>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {messages.length === 0 && !systemMessage && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-2 py-12">
                <MessageCircle className="w-12 h-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground">Agent conversations will appear here</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
