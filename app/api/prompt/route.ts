import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Project prompt is required" }, { status: 400 })
    }

    // Return success - the actual debate will be triggered via WebSocket simulation
    return NextResponse.json({
      success: true,
      message: "Team generation started",
      prompt,
    })
  } catch (error) {
    console.error("Error in prompt endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
