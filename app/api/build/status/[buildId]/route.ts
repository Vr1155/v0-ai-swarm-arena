import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function GET(
  _request: Request,
  context: { params: Promise<{ buildId: string }> } | { params: { buildId: string } },
) {
  try {
    const resolvedParams = "then" in context.params ? await context.params : context.params
    const response = await fetch(`${BACKEND_URL}/build/status/${resolvedParams.buildId}`, {
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: "Failed to fetch status", details: errorText || response.statusText },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[build:status] proxy failure", error)
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 })
  }
}
