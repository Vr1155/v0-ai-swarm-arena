import { BACKEND_URL } from "./constants"

export const api = {
  /**
   * Submit project brief to backend
   */
  async submitBrief(brief: string) {
    const response = await fetch(`${BACKEND_URL}/api/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief }),
    })
    return response.json()
  },

  /**
   * Generate agent team
   */
  async generateTeam(brief: string) {
    const response = await fetch(`${BACKEND_URL}/api/generate-team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief }),
    })
    return response.json()
  },

  /**
   * Start agent debate
   */
  async startDebate(brief: string) {
    const response = await fetch(`${BACKEND_URL}/api/start-debate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief }),
    })
    return response.json()
  },

  /**
   * Download project artifact
   */
  async downloadArtifact() {
    const response = await fetch(`${BACKEND_URL}/api/download`)
    const blob = await response.blob()
    return blob
  },
}
