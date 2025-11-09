"use client"

import type React from "react"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, CheckCircle2, Loader2, Mic, MicOff, Sparkles, Users, Zap } from "lucide-react"
import { useSwarmStore } from "@/store/swarm-store"
import Link from "next/link"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

type ConversationStatus = "idle" | "recording" | "processing" | "ready"

type ConversationTurn = {
  role: "user" | "assistant"
  content: string
}

const createSessionId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `session-${Math.random().toString(36).slice(2)}`
}

export default function Home() {
  const [projectBrief, setProjectBrief] = useState("")
  const [conversationStatus, setConversationStatus] = useState<ConversationStatus>("idle")
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [sessionId] = useState(() => createSessionId())
  const [sessionReady, setSessionReady] = useState(false)
  const [initializingSession, setInitializingSession] = useState(false)
  const [conversationLog, setConversationLog] = useState<ConversationTurn[]>([])
  const [requirementsReady, setRequirementsReady] = useState(false)
  const [requirementsFileName, setRequirementsFileName] = useState<string | null>(null)
  const [requirementsMarkdown, setRequirementsMarkdown] = useState<string | null>(null)
  const [mediaSupported, setMediaSupported] = useState(true)
  const [lastReplyAudio, setLastReplyAudio] = useState<string | null>(null)
  const router = useRouter()
  const { setProjectBrief: setStoreBrief } = useSwarmStore()
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (requirementsReady) {
      setStoreBrief(requirementsMarkdown || projectBrief || "")
      router.push("/arena")
    }
  }

  const finalizeRequirementsDoc = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/doc/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      setRequirementsMarkdown(data.markdown)
      setRequirementsFileName("requirements.md")
      setRequirementsReady(true)
      setConversationStatus("ready")
    } catch (error) {
      console.error("requirements-finalize", error)
      setVoiceError("We couldn't finalize the requirements doc. Try again.")
      setRequirementsReady(false)
      setConversationStatus("idle")
    }
  }, [sessionId])

  const ensureSession = useCallback(async () => {
    if (sessionReady || initializingSession) return
    setInitializingSession(true)
    setVoiceError(null)
    try {
      const response = await fetch(`${BACKEND_URL}/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      const history = (data?.state?.history || []).filter(
        (item: ConversationTurn) => typeof item?.content === "string",
      )
      setConversationLog(history as ConversationTurn[])
      setSessionReady(true)
    } catch (error) {
      console.error("session-start", error)
      setVoiceError("Unable to reach the AI backend. Make sure it is running.")
    } finally {
      setInitializingSession(false)
    }
  }, [initializingSession, sessionId, sessionReady])

  useEffect(() => {
    if (typeof navigator === "undefined") return
    const supported = !!navigator.mediaDevices?.getUserMedia
    setMediaSupported(supported)
  }, [])

  useEffect(() => {
    void ensureSession()
  }, [ensureSession])

  useEffect(() => {
    if (!lastReplyAudio) return
    const audio = new Audio(`data:audio/mpeg;base64,${lastReplyAudio}`)
    audio.play().catch(() => {
      /* ignore autoplay errors */
    })
  }, [lastReplyAudio])

  const sendVoiceTurn = useCallback(
    async (audioBlob: Blob) => {
      if (!audioBlob.size) {
        setConversationStatus("idle")
        return
      }
      await ensureSession()
      setVoiceError(null)
      setConversationStatus("processing")
      try {
        const formData = new FormData()
        formData.append("audio", audioBlob, "user-input.webm")

        const response = await fetch(`${BACKEND_URL}/chat/voice?session_id=${sessionId}`, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(await response.text())
        }

        const data = await response.json()
        setConversationLog((prev) => [
          ...prev,
          { role: "user", content: data.transcript },
          { role: "assistant", content: data.reply },
        ])
        setProjectBrief((prev) => {
          const pieces = [prev, data.transcript, data.reply].filter(Boolean)
          return pieces.join("\n\n")
        })
        setLastReplyAudio(data.audio_b64 ?? null)
        await finalizeRequirementsDoc()
      } catch (error) {
        console.error("voice-turn", error)
        setVoiceError("Conversation failed. Please try again.")
        setConversationStatus("idle")
      }
    },
    [ensureSession, finalizeRequirementsDoc, sessionId],
  )

  const stopTracks = (stream?: MediaStream) => {
    stream?.getTracks().forEach((track) => track.stop())
  }

  const startRecording = async () => {
    if (!mediaSupported) {
      setVoiceError("Microphone access is not supported in this browser.")
      return
    }
    if (conversationStatus === "processing") return
    await ensureSession()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []
      setVoiceError(null)
      setConversationStatus("recording")
      setRequirementsReady(false)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onerror = (event) => {
        console.error("recorder-error", event.error)
        setVoiceError("Recorder error. Please retry.")
        setConversationStatus("idle")
        stopTracks(stream)
      }

      recorder.onstop = () => {
        stopTracks(stream)
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        })
        audioChunksRef.current = []
        void sendVoiceTurn(audioBlob)
      }

      recorder.start()
    } catch (error) {
      console.error("recording-start", error)
      setVoiceError("We couldn't access your microphone. Check permissions.")
      setConversationStatus("idle")
    }
  }

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== "inactive") {
      recorder.stop()
      setConversationStatus("processing")
    }
  }

  const conversationStatusMessage = useMemo(() => {
    switch (conversationStatus) {
      case "recording":
        return "Recording... tap stop to send your idea."
      case "processing":
        return "Talking to the agent and writing requirements..."
      case "ready":
        return requirementsFileName
          ? `${requirementsFileName} ready. You can generate your team.`
          : "Requirements document ready."
      default:
        return sessionReady
          ? "Tap the mic to describe your project."
          : "Connecting to the agent..."
    }
  }, [conversationStatus, requirementsFileName, sessionReady])

  const isRecording = conversationStatus === "recording"
  const isProcessing = conversationStatus === "processing"

  return (
    <div className="min-h-screen flex flex-col bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/20 blur-[100px] floating-orb" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-secondary/20 blur-[120px] floating-orb"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-accent/15 blur-[100px] floating-orb"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <header className="border-b border-border/30 bg-black/50 backdrop-blur-xl sticky top-0 z-50 relative">
        <div className="container mx-auto px-6">
          <nav className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold gradient-text">AI Swarm Arena</span>
            </Link>

            {/* Nav items */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                How it Works
              </Link>
              <Link
                href="#technology"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Technology
              </Link>
            </div>

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-sm font-medium hover:text-primary" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button size="sm" className="gradient-primary text-white font-semibold" asChild>
                <Link href="/arena">Get Started</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-16 relative">
        <div className="max-w-5xl w-full space-y-16">
          <div className="space-y-6 text-center">
            <h2 className="text-6xl md:text-7xl font-bold tracking-tight text-balance leading-tight">
              <span className="gradient-text">Watch AI Agents</span>
              <br />
              <span className="text-white">Build Your Project.</span>
            </h2>
            <p className="text-xl text-muted-foreground text-balance max-w-3xl mx-auto leading-relaxed">
              Enter your idea and see autonomous agents collaborate, debate, and create architecture in real-time with
              swarm intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="glass-effect border-border/50 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 glow-primary">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Multi-Agent Swarm</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground/80">
                  PM, Dev, UX, and QA agents work together to design your project
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/50 hover:border-secondary/50 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-3 glow-secondary">
                  <Zap className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle className="text-lg">Real-Time Debate</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground/80">
                  Watch agents discuss and refine ideas through live visualization
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/50 hover:border-accent/50 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3 glow-accent">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-lg">Instant Architecture</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground/80">
                  Get a complete project plan and downloadable scaffold in minutes
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-effect border-2 border-primary/30 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">Describe Your Project</CardTitle>
              <CardDescription className="text-base">
                Tell us what you want to build, and our AI swarm will get to work
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Textarea
                  placeholder="Example: A social media platform for pet owners with real-time chat, photo sharing, and event planning features..."
                  className="min-h-40 resize-none bg-input/50 border-border/50 focus:border-primary/50 text-base"
                  value={projectBrief}
                  onChange={(e) => setProjectBrief(e.target.value)}
                />
                <div className="flex flex-col gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-primary">Voice conversation</p>
                    <p className="text-xs text-muted-foreground" aria-live="polite">
                      {conversationStatusMessage}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 min-w-[140px] border-primary/40 text-primary hover:bg-primary/10"
                      onClick={startRecording}
                      disabled={isRecording || isProcessing || !mediaSupported}
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      {isRecording ? "Listening..." : "Start talking"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 min-w-[140px] border-secondary/40 text-secondary hover:bg-secondary/10"
                      onClick={stopRecording}
                      disabled={!isRecording}
                    >
                      <MicOff className="mr-2 h-4 w-4" />
                      Stop &amp; summarize
                    </Button>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {conversationStatus === "processing" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      {conversationStatus === "ready" && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                      <span>
                        {conversationStatus === "ready"
                          ? "Requirements ready"
                          : conversationStatus === "processing"
                            ? "Generating requirements.md"
                            : "Waiting for summary"}
                      </span>
                    </div>
                  </div>
                  {conversationLog.length > 0 && (
                    <div className="max-h-32 overflow-y-auto rounded-xl bg-black/30 p-3 text-xs text-muted-foreground">
                      {conversationLog.slice(-4).map((turn, index) => (
                        <p key={`${turn.role}-${index}`} className={turn.role === "assistant" ? "text-primary" : ""}>
                          <span className="font-semibold capitalize">{turn.role}:</span> {turn.content}
                        </p>
                      ))}
                    </div>
                  )}
                  {voiceError && <p className="text-sm text-red-400">{voiceError}</p>}
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">{projectBrief.length} characters</p>
                  <Button
                    type="submit"
                    size="lg"
                    className="gap-2 neon-button gradient-primary text-white font-semibold px-8"
                    disabled={!requirementsReady || conversationStatus !== "ready"}
                  >
                    Generate Team <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground/60">
            <p>Built for UBHacking Hackathon • Powered by AI Swarm Intelligence</p>
          </div>
        </div>
      </main>
    </div>
  )
}
