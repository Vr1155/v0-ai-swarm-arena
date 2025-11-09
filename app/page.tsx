"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Sparkles, Users, Zap } from "lucide-react"
import { useSwarmStore } from "@/store/swarm-store"
import Link from "next/link"

export default function Home() {
  const [projectBrief, setProjectBrief] = useState("")
  const router = useRouter()
  const { setProjectBrief: setStoreBrief } = useSwarmStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (projectBrief.trim()) {
      setStoreBrief(projectBrief)
      router.push("/arena")
    }
  }

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
                  required
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">{projectBrief.length} characters</p>
                  <Button
                    type="submit"
                    size="lg"
                    className="gap-2 neon-button gradient-primary text-white font-semibold px-8"
                    disabled={!projectBrief.trim()}
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
