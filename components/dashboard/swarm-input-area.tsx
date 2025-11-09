"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useSwarmStore } from "@/store/swarm-store"
import { Play, Download, Eye, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { ArchitecturePlanDialog } from "./architecture-plan-dialog"

export function SwarmInputArea() {
  const { projectBrief, agents, isDebating, debateFinished, architecturePlan, sseClient, sessionId } = useSwarmStore()
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [buildId, setBuildId] = useState<string | null>(null)
  const [buildStatus, setBuildStatus] = useState("idle")
  const [buildMessage, setBuildMessage] = useState("")
  const [downloadReady, setDownloadReady] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleGenerateTeam = async () => {
    if (!sseClient || !projectBrief) return

    setIsGenerating(true)
    try {
      await sseClient.generateAgents(projectBrief)
      toast.success("Generating agent team...")
    } catch (error) {
      toast.error("Failed to generate team")
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStartDebate = async () => {
    if (!sseClient || agents.length === 0) {
      toast.error("Generate a team first")
      return
    }

    try {
      await sseClient.startDebate(projectBrief, agents)
      toast.success("Debate started!")
    } catch (error) {
      toast.error("Failed to start debate")
      console.error(error)
    }
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
    }
  }, [])

  const fetchStatus = async (id: string | null) => {
    if (!id) return
    try {
      const response = await fetch(`/api/build/status/${id}`, { cache: "no-store" })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const data = await response.json()
      setBuildStatus(data.status)
      setBuildMessage(data.message || "")
      if (data.status === "complete" && data.download_path) {
        if (pollRef.current) clearInterval(pollRef.current)
        setDownloadReady(true)
        setIsDownloading(false)
        toast.success("Build ready to download")
      } else if (data.status === "failed") {
        if (pollRef.current) clearInterval(pollRef.current)
        setIsDownloading(false)
        setDownloadReady(false)
        toast.error("Build failed. You can try again.")
      }
    } catch (error) {
      console.error("[build] status polling failed", error)
    }
  }

  const startPolling = (id: string) => {
    if (!id) return
    if (pollRef.current) {
      clearInterval(pollRef.current)
    }
    pollRef.current = setInterval(() => {
      void fetchStatus(id)
    }, 3000)
    void fetchStatus(id)
  }

  const downloadArchive = async (id: string) => {
    setIsDownloading(true)
    try {
      const response = await fetch(`/api/build/download/${id}`)
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${projectBrief.slice(0, 30).replace(/\s+/g, "-") || "swarm-build"}-scaffold.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Artifact downloaded!")
    } catch (error) {
      toast.error("Failed to download artifact")
      console.error(error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownload = async () => {
    if (!sessionId) {
      toast.error("Session not ready yet. Capture requirements first.")
      return
    }
    if (!buildId || buildStatus === "failed") {
      setIsDownloading(true)
      setDownloadReady(false)
      try {
        const response = await fetch("/api/build/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        })
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || "Failed to queue build")
        }
        const data = await response.json()
        console.debug("[build] start response", data)
        const newId = data.build_id || data.buildId
        if (!newId) {
          throw new Error("Build ID missing from response")
        }
        setBuildId(newId)
        setBuildStatus("queued")
        setBuildMessage("Queued for generation")
        toast.success("Build queued. Sit tight while we generate code.")
        startPolling(newId)
      } catch (error) {
        setIsDownloading(false)
        toast.error("Failed to start build")
        console.error(error)
      }
      return
    }

    if (!downloadReady) {
      toast.info("Build still running. We'll notify you when it's ready.")
      return
    }

    await downloadArchive(buildId)
  }

  const downloadLabel = downloadReady
    ? isDownloading
      ? "Downloading..."
      : "Download Artifact"
    : buildId
      ? buildStatus === "failed"
        ? "Retry Build"
        : `Building (${buildStatus})`
      : "Generate Build"

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
          <div className="flex flex-wrap gap-3">
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
              disabled={!architecturePlan}
              variant="outline"
              className="gap-2 border-primary/50 bg-black/60 backdrop-blur-sm hover:bg-primary/10 hover:border-primary text-primary shadow-lg shadow-primary/20"
            >
              <Eye className="w-4 h-4" />
              View Plan
            </Button>

            <Button
              onClick={handleDownload}
              disabled={!architecturePlan || isDownloading}
              variant="outline"
              className="gap-2 ml-auto border-cyan-500/50 bg-black/60 backdrop-blur-sm hover:bg-cyan-500/10 hover:border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/20"
            >
              <Download className="w-4 h-4" />
              {downloadLabel}
            </Button>
          </div>
          {buildId && (
            <p className="text-xs text-muted-foreground">
              {buildMessage || (downloadReady ? "Build ready to download." : "Generating scaffold...")}
            </p>
          )}
        </CardContent>
      </Card>

      <ArchitecturePlanDialog open={showPlanDialog} onOpenChange={setShowPlanDialog} plan={architecturePlan} />
    </>
  )
}
