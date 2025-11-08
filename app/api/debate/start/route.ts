import type { NextRequest } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Mock debate conversation templates
const DEBATE_TEMPLATES = {
  PM: [
    "Let's break down the project requirements. We need to prioritize core features first.",
    "I suggest we start with the MVP and iterate based on user feedback.",
    "The timeline looks tight. Let's focus on what delivers the most value.",
    "We should align on the technical approach before diving into implementation.",
  ],
  Dev: [
    "I can build this using Next.js with TypeScript for type safety.",
    "We should set up CI/CD early to catch issues fast.",
    "Let me propose a microservices architecture for better scalability.",
    "I'll need the API contracts defined before I can start the frontend work.",
  ],
  UX: [
    "The user flow should be intuitive and minimize cognitive load.",
    "I recommend doing user research before finalizing the design.",
    "Let's ensure the interface is accessible and mobile-responsive.",
    "We need to consider edge cases in the user journey.",
  ],
  QA: [
    "I'll set up automated testing from the start to prevent regression.",
    "We should define acceptance criteria for each feature clearly.",
    "Let's not skip edge case testing - that's where bugs hide.",
    "I recommend integration tests to ensure components work together.",
  ],
}

// SSE stream for real-time debate updates
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  try {
    const { agents, projectBrief } = await request.json()

    const stream = new ReadableStream({
      async start(controller) {
        console.log("[v0] Starting debate stream for project:", projectBrief)

        // Send debate start event
        const startEvent = `data: ${JSON.stringify({ type: "debate_start" })}\n\n`
        controller.enqueue(encoder.encode(startEvent))

        // Simulate debate rounds
        const rounds = 2
        const agentsArray = agents || []

        for (let round = 0; round < rounds; round++) {
          for (const agent of agentsArray) {
            // Random delay between messages (1-3 seconds)
            await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

            const templates = DEBATE_TEMPLATES[agent.role as keyof typeof DEBATE_TEMPLATES] || []
            const message = templates[Math.floor(Math.random() * templates.length)]

            const messageData = {
              id: `msg-${agent.id}-${Date.now()}-${Math.random()}`,
              agentId: agent.id,
              agentName: agent.name,
              agentRole: agent.role,
              content: message,
              timestamp: Date.now(),
              color: agent.color,
            }

            const messageEvent = `data: ${JSON.stringify({ type: "message", data: messageData })}\n\n`
            controller.enqueue(encoder.encode(messageEvent))
          }
        }

        // Generate architecture plan after debate
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const architecturePlan = {
          projectName: projectBrief.split(" ").slice(0, 5).join(" ") + "...",
          overview: `A comprehensive solution built with modern web technologies to address: ${projectBrief}`,
          components: [
            "Frontend: Next.js 14 with TypeScript and Tailwind CSS",
            "Backend: Node.js API with RESTful endpoints",
            "Database: PostgreSQL with Prisma ORM",
            "Authentication: NextAuth.js with JWT",
            "Deployment: Vercel with CI/CD pipeline",
          ],
          techStack: ["Next.js", "TypeScript", "PostgreSQL", "Prisma", "Tailwind CSS"],
          timeline: "MVP ready in 2 weeks with iterative improvements",
        }

        const planEvent = `data: ${JSON.stringify({ type: "plan_ready", data: architecturePlan })}\n\n`
        controller.enqueue(encoder.encode(planEvent))

        // Send debate end event
        const endEvent = `data: ${JSON.stringify({ type: "debate_end" })}\n\n`
        controller.enqueue(encoder.encode(endEvent))

        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[v0] Error in debate stream:", error)
    return Response.json({ error: "Failed to start debate" }, { status: 500 })
  }
}
