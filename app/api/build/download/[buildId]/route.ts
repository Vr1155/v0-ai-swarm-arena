import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function GET(
  _request: Request,
  context: { params: Promise<{ buildId: string }> } | { params: { buildId: string } },
) {
  try {
    const resolvedParams = "then" in context.params ? await context.params : context.params
    const response = await fetch(`${BACKEND_URL}/build/download/${resolvedParams.buildId}`, {
      cache: "no-store",
    })

    if (!response.ok || !response.body) {
      const errorText = await response.text().catch(() => "")
      return NextResponse.json(
        { error: "Failed to download build", details: errorText || response.statusText },
        { status: response.status },
      )
    }

    const headers = new Headers(response.headers)
    return new NextResponse(response.body, { headers })
  } catch (error) {
    console.error("[build:download] proxy failure", error)
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 })
  }
}
