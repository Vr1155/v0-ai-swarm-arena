"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useSwarmStore } from "@/store/swarm-store"
import { Play, Download, Eye, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { ArchitecturePlanDialog } from "./architecture-plan-dialog"

export function SwarmInputArea() {
  const {
    projectBrief,
    agents,
    isDebating,
    debateFinished,
    architecturePlan,
    swarmClient,
    swarmDocMarkdown,
    planningStatus,
    setPlanningStatus,
    setSwarmDocMarkdown,
  } = useSwarmStore()
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateTeam = async () => {
    if (!swarmClient || !projectBrief) return

    setIsGenerating(true)
    try {
      await swarmClient.generateAgents(projectBrief)
      toast.success("Generating agent team...")
    } catch (error) {
      toast.error("Failed to generate team")
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStartDebate = async () => {
    if (!swarmClient || agents.length === 0) {
      toast.error("Generate a team first")
      return
    }

    try {
      setPlanningStatus("in_progress")
      setSwarmDocMarkdown(null)
      await swarmClient.startDebate(projectBrief, agents)
      toast.success("Debate started!")
    } catch (error) {
      toast.error("Failed to start debate")
      console.error(error)
    }
  }

  const handleDownload = async () => {
    if (!swarmDocMarkdown) {
      toast.error("No execution plan available yet")
      return
    }

    const blob = new Blob([swarmDocMarkdown], { type: "text/markdown" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${projectBrief.slice(0, 30).replace(/\s+/g, "-") || "swarm"}-plan.md`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.success("Execution plan downloaded!")
  }

  return (
    <>
      <Card className="relative overflow-hidden border-primary/30 bg-black/40 backdrop-blur-xl shadow-2xl shadow-primary/20">
        {/* Animated gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-cyan-500/20 to-primary/20 opacity-50 blur-xl" />

        <CardContent className="relative pt-6 space-y-4">
          {/* Project Brief Display */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-cyan-400">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              Your Project
            </div>
            <Textarea
              value={projectBrief}
              disabled
              className="min-h-24 resize-none bg-black/60 backdrop-blur-sm border-primary/30 text-foreground focus-visible:ring-primary/50"
            />
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              onClick={handleGenerateTeam}
              disabled={isGenerating || agents.length > 0}
              className="gap-2 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 shadow-lg shadow-primary/50 transition-all hover:shadow-primary/70"
            >
              <Sparkles className="w-4 h-4" />
              {agents.length > 0 ? "Team Generated" : "Generate Team"}
            </Button>

            <Button
              onClick={handleStartDebate}
              disabled={agents.length === 0 || isDebating || debateFinished}
              variant="secondary"
              className="gap-2 bg-cyan-500/20 border border-cyan-500/50 hover:bg-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/30"
            >
              <Play className="w-4 h-4" />
              {debateFinished ? "Debate Finished" : isDebating ? "Debating..." : "Start Debate"}
            </Button>

            <Button
              onClick={() => setShowPlanDialog(true)}
              disabled={!architecturePlan && !swarmDocMarkdown}
              variant="outline"
              className="gap-2 border-primary/50 bg-black/60 backdrop-blur-sm hover:bg-primary/10 hover:border-primary text-primary shadow-lg shadow-primary/20"
            >
              <Eye className="w-4 h-4" />
              View Plan
            </Button>

            <div className="text-sm font-semibold text-primary/80">
              {planningStatus === "done" && "Planning done! View the plan to review."}
              {planningStatus === "approved" && "Plan is ready!"}
              {planningStatus === "in_progress" && "Planning in progress..."}
            </div>

            <Button
              onClick={handleDownload}
              disabled={!swarmDocMarkdown}
              variant="outline"
              className="gap-2 ml-auto border-cyan-500/50 bg-black/60 backdrop-blur-sm hover:bg-cyan-500/10 hover:border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/20"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      <ArchitecturePlanDialog open={showPlanDialog} onOpenChange={setShowPlanDialog} plan={architecturePlan} />
    </>
  )
}
