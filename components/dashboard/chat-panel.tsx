"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useSwarmStore } from "@/store/swarm-store"
import { MessageSquare } from "lucide-react"

export function ChatPanel() {
  const { messages } = useSwarmStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <Card className="w-full lg:w-96 flex flex-col max-h-96 lg:max-h-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Agent Chat Log
          </CardTitle>
          <Badge variant="secondary">{messages.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0">
        <ScrollArea className="h-full px-4 pb-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              No messages yet. Start the debate to see agent conversations.
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: message.color }} />
                    <span className="text-sm font-medium">{message.agentName}</span>
                    <Badge variant="outline" className="text-xs">
                      {message.agentRole}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground pl-4">{message.content}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
