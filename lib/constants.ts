export const AGENT_COLORS = {
  PM: "#3b82f6", // blue
  Dev: "#10b981", // green
  UX: "#f59e0b", // amber
  QA: "#ef4444", // red
} as const

const defaultBackend =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_BACKEND_URL
    ? process.env.NEXT_PUBLIC_BACKEND_URL
    : "http://localhost:8000"

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || defaultBackend

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || BACKEND_URL.replace(/^http(s?)/i, "ws$1") + "/ws/projects/tech-plan"
