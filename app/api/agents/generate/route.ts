import type { NextRequest } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const AGENT_ROLES = ["PM", "Dev", "UX", "QA"] as const
const AGENT_COLORS = {
  PM: "#3b82f6",
  Dev: "#10b981",
  UX: "#f59e0b",
  QA: "#ef4444",
}

export async function POST(request: NextRequest) {
  try {
    const { projectBrief } = await request.json()

    // Generate agents based on project brief
    const agents = AGENT_ROLES.map((role, index) => ({
      id: `agent-${role.toLowerCase()}-${Date.now()}-${index}`,
      name: `${role} Agent`,
      role,
      color: AGENT_COLORS[role],
    }))

    // Generate graph nodes and links
    const nodes = agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      color: agent.color,
    }))

    // Create connections between agents (everyone connected to PM)
    const links = agents
      .filter((a) => a.role !== "PM")
      .map((agent) => ({
        source: agents[0].id, // PM
        target: agent.id,
        value: 1,
      }))

    return Response.json({
      agents,
      nodes,
      links,
    })
  } catch (error) {
    console.error("[v0] Error generating agents:", error)
    return Response.json({ error: "Failed to generate agents" }, { status: 500 })
  }
}
