"use client"

import Link from "next/link"
import { Sparkles, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSwarmStore } from "@/store/swarm-store"

export function DashboardHeader() {
  const { isConnected } = useSwarmStore()

  return (
    <header className="border-b border-primary/20 bg-black/60 backdrop-blur-xl shadow-lg shadow-primary/10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10 text-cyan-400 hover:text-cyan-300">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent">
              AI Swarm Arena
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-primary/20">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 shadow-lg shadow-green-400/50 animate-pulse" : "bg-gray-400"}`}
            />
            <span className={`text-sm ${isConnected ? "text-green-400" : "text-gray-400"}`}>
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
