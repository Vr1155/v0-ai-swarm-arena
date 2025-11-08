"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Sparkles, Users, Zap } from "lucide-react"
import { useSwarmStore } from "@/store/swarm-store"

export default function Home() {
  const [projectBrief, setProjectBrief] = useState("")
  const router = useRouter()
  const { setProjectBrief: setStoreBrief } = useSwarmStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (projectBrief.trim()) {
      setStoreBrief(projectBrief)
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Swarm Arena
          </h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="max-w-4xl w-full space-y-12">
          {/* Hero Section */}
          <div className="space-y-4 text-center">
            <h2 className="text-5xl font-bold tracking-tight text-balance">Watch AI Agents Build Your Project</h2>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Enter your idea and see autonomous agents collaborate, debate, and create architecture in real-time
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Users className="w-8 h-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Multi-Agent Collaboration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>PM, Dev, UX, and QA agents work together to design your project</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="w-8 h-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Real-Time Debate</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Watch agents discuss and refine ideas through live visualization</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Sparkles className="w-8 h-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Instant Architecture</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Get a complete project plan and downloadable scaffold in minutes</CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Input Form */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Describe Your Project</CardTitle>
              <CardDescription>Tell us what you want to build, and our AI swarm will get to work</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  placeholder="Example: A social media platform for pet owners with real-time chat, photo sharing, and event planning features..."
                  className="min-h-32 resize-none"
                  value={projectBrief}
                  onChange={(e) => setProjectBrief(e.target.value)}
                  required
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">{projectBrief.length} characters</p>
                  <Button type="submit" size="lg" className="gap-2" disabled={!projectBrief.trim()}>
                    Generate Team <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Built for UBHacking Hackathon - Powered by AI Swarm Intelligence</p>
          </div>
        </div>
      </main>
    </div>
  )
}
