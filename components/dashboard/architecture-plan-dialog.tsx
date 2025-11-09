"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useSwarmStore } from "@/store/swarm-store"
import type { ArchitecturePlan } from "@/lib/types"
import { Send } from "lucide-react"
import { toast } from "sonner"

interface ArchitecturePlanDialogProps {
  plan: ArchitecturePlan | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ArchitecturePlanDialog({ plan, open, onOpenChange }: ArchitecturePlanDialogProps) {
  const { messages } = useSwarmStore()
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      toast.error("Please enter your feedback")
      return
    }

    setIsSubmitting(true)
    try {
      // TODO: Send feedback to backend for processing
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Feedback submitted! Agents will refine the plan.")
      setFeedback("")
    } catch (error) {
      toast.error("Failed to submit feedback")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!plan) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-black/95 backdrop-blur-2xl border-primary/30 shadow-2xl shadow-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2 bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent">
            <span className="text-2xl">🎯</span> {plan.projectName}
          </DialogTitle>
          <DialogDescription className="text-base italic text-cyan-400/70">
            *Achieved through collaborative debate and compromise*
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="space-y-6 pr-4">
            {/* Project Overview */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground">{plan.overview}</p>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            {/* Architecture Plan Sections */}
            <div className="p-4 rounded-lg bg-black/40 border border-cyan-500/20">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-cyan-400">📦 Components</h3>
              <ul className="space-y-2">
                {plan.components.map((component, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{component}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

            <div className="p-4 rounded-lg bg-black/40 border border-primary/20">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-primary">🛠️ Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {plan.techStack.map((tech, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-sm bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <div className="p-4 rounded-lg bg-black/40 border border-cyan-500/20">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-cyan-400">⏱️ Timeline</h3>
              <p className="text-sm text-muted-foreground">{plan.timeline}</p>
            </div>

            {messages.length > 0 && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <div className="p-4 rounded-lg bg-black/40 border border-primary/20">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-primary">
                    💬 Agent Debate Transcript
                  </h3>
                  <div className="space-y-3 bg-black/60 rounded-lg p-4 max-h-72 overflow-y-auto border border-primary/10">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className="space-y-1 p-2 rounded bg-black/40 border border-primary/5 hover:border-primary/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shadow-lg"
                            style={{
                              backgroundColor: message.color,
                              boxShadow: `0 0 10px ${message.color}`,
                            }}
                          />
                          <span className="text-xs font-semibold text-cyan-400">{message.agentName}</span>
                          <span className="text-xs text-muted-foreground">({message.agentRole})</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm pl-5 leading-relaxed">{message.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-primary/20 pt-4 space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan-400">Your Feedback</label>
            <Textarea
              placeholder="Share your thoughts on this architecture plan. What would you like to change or improve?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-24 resize-none bg-black/60 border-primary/30 focus-visible:ring-primary/50 focus-visible:border-primary/50"
            />
          </div>
          <Button
            onClick={handleSubmitFeedback}
            disabled={isSubmitting || !feedback.trim()}
            className="w-full gap-2 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 shadow-lg shadow-primary/50"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
