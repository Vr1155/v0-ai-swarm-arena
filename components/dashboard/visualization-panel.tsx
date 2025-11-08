"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSwarmStore } from "@/store/swarm-store"
import { ForceGraph } from "@/components/dashboard/force-graph"

export function VisualizationPanel() {
  const { projectBrief } = useSwarmStore()

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Agent Collaboration Network</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">{projectBrief}</p>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 relative p-0">
        <ForceGraph />
      </CardContent>
    </Card>
  )
}
