"use client"

import { useState } from "react"
import { useSwarmStore } from "@/store/swarm-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Code2, FileCode, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function CodeViewer() {
  const { codeFiles } = useSwarmStore()
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const selectedFileData = codeFiles.find((f) => f.path === selectedFile)

  if (codeFiles.length === 0) {
    return null
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Code2 className="w-5 h-5 text-primary" />
          Generated Code
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-4 h-[500px]">
          {/* File tree */}
          <div className="col-span-1 border-r bg-muted/20">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                <AnimatePresence>
                  {codeFiles.map((file, index) => (
                    <motion.button
                      key={file.path}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedFile(file.path)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left text-sm transition-colors ${
                        selectedFile === file.path
                          ? "bg-primary/20 text-primary font-medium"
                          : "hover:bg-muted text-foreground/80"
                      }`}
                    >
                      <FileCode className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{file.path.split("/").pop()}</span>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>

          {/* Code display */}
          <div className="col-span-3 bg-slate-950">
            <ScrollArea className="h-full">
              {selectedFileData ? (
                <div className="p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
                    <ChevronRight className="w-4 h-4" />
                    <span className="font-mono">{selectedFileData.path}</span>
                  </div>
                  <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto border border-slate-800">
                    <code className="text-sm font-mono text-slate-200 leading-relaxed">{selectedFileData.content}</code>
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center space-y-2">
                    <FileCode className="w-12 h-12 mx-auto opacity-50" />
                    <p className="text-sm">Select a file to view its contents</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
