import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function POST(request: Request) {
  const payload = await request.json()

  try {
    const response = await fetch(`${BACKEND_URL}/requirements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: "Failed to generate requirements", details: errorText || response.statusText },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[requirements] proxy failure", error)
    return NextResponse.json(
      { error: "Backend unavailable. Ensure BACKEND_URL is configured." },
      { status: 502 },
    )
  }
}
