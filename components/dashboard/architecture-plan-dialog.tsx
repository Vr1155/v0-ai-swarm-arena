"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ArchitecturePlan } from "@/lib/types"

interface ArchitecturePlanDialogProps {
  plan: ArchitecturePlan | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ArchitecturePlanDialog({ plan, open, onOpenChange }: ArchitecturePlanDialogProps) {
  if (!plan) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{plan.projectName}</DialogTitle>
          <DialogDescription>{plan.overview}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Components</h3>
              <ul className="list-disc list-inside space-y-1">
                {plan.components.map((component, index) => (
                  <li key={index} className="text-sm">
                    {component}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {plan.techStack.map((tech, index) => (
                  <Badge key={index} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Timeline</h3>
              <p className="text-sm text-muted-foreground">{plan.timeline}</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
