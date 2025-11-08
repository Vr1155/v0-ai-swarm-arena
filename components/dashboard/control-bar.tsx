"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useSwarmStore } from "@/store/swarm-store"
import { Play, FileText, Download, RotateCcw, Users } from "lucide-react"
import { toast } from "sonner"
import { ArchitecturePlanDialog } from "./architecture-plan-dialog"

export function ControlBar() {
  const { isDebating, architecturePlan, projectBrief, sseClient, agents, reset } = useSwarmStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showPlanDialog, setShowPlanDialog] = useState(false)

  const handleGenerateTeam = async () => {
    if (!projectBrief) {
      toast.error("No project brief found")
      return
    }

    setIsGenerating(true)
    try {
      await sseClient?.generateTeam(projectBrief)
    } catch (error) {
      console.error("[v0] Error generating team:", error)
      toast.error("Failed to generate team")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStartDebate = async () => {
    if (!projectBrief) {
      toast.error("No project brief found")
      return
    }

    if (agents.length === 0) {
      toast.error("Generate team first")
      return
    }

    setIsStarting(true)
    try {
      await sseClient?.startDebate(projectBrief, agents)
    } catch (error) {
      console.error("[v0] Error starting debate:", error)
      toast.error("Failed to start debate")
    } finally {
      setIsStarting(false)
    }
  }

  const handleShowPlan = () => {
    setShowPlanDialog(true)
  }

  const handleDownload = async () => {
    if (!architecturePlan) {
      toast.error("No architecture plan available")
      return
    }

    setIsDownloading(true)
    try {
      toast.info("Preparing download...")

      const response = await fetch("/api/download")
      if (!response.ok) throw new Error("Download failed")

      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "ai-swarm-project.zip"

      // Trigger download
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success("Project artifact downloaded!")
    } catch (error) {
      console.error("[v0] Error downloading artifact:", error)
      toast.error("Failed to download artifact")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleReset = () => {
    reset()
    toast.info("Dashboard reset")
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleGenerateTeam} disabled={isDebating || isGenerating} className="gap-2">
              <Users className="w-4 h-4" />
              {isGenerating ? "Generating..." : "Generate Team"}
            </Button>

            <Button
              onClick={handleStartDebate}
              disabled={isDebating || isStarting || agents.length === 0}
              variant="default"
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              {isStarting ? "Starting..." : "Start Debate"}
            </Button>

            <Button onClick={handleShowPlan} disabled={!architecturePlan} variant="secondary" className="gap-2">
              <FileText className="w-4 h-4" />
              Show Plan
            </Button>

            <Button
              onClick={handleDownload}
              disabled={!architecturePlan || isDownloading}
              variant="secondary"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? "Downloading..." : "Download Artifact"}
            </Button>

            <Button onClick={handleReset} variant="outline" className="gap-2 ml-auto bg-transparent">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <ArchitecturePlanDialog plan={architecturePlan} open={showPlanDialog} onOpenChange={setShowPlanDialog} />
    </>
  )
}
