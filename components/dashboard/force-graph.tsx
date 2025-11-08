"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { useSwarmStore } from "@/store/swarm-store"
import type { GraphNode, GraphLink } from "@/lib/types"

export function ForceGraph() {
  const svgRef = useRef<SVGSVGElement>(null)
  const { graphNodes, graphLinks } = useSwarmStore()

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // Clear previous content
    svg.selectAll("*").remove()

    // Add a background
    svg.append("rect").attr("width", width).attr("height", height).attr("fill", "hsl(var(--muted) / 0.1)")

    if (graphNodes.length === 0) {
      // Show placeholder message
      const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`)

      g.append("text")
        .attr("text-anchor", "middle")
        .attr("fill", "hsl(var(--muted-foreground))")
        .attr("font-size", "14px")
        .text('Click "Generate Team" to see agent network')

      return
    }

    // Create container group for zoom/pan
    const container = svg.append("g")

    // Add zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        container.attr("transform", event.transform)
      })

    svg.call(zoom)

    // Create force simulation
    const simulation = d3
      .forceSimulation<GraphNode>(graphNodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(graphLinks)
          .id((d) => d.id)
          .distance(100),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40))

    // Create links
    const link = container
      .append("g")
      .selectAll("line")
      .data(graphLinks)
      .join("line")
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-width", (d) => Math.sqrt(d.value))
      .attr("stroke-opacity", 0.6)

    // Create nodes
    const node = container
      .append("g")
      .selectAll("g")
      .data(graphNodes)
      .join("g")
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on("drag", (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          }),
      )

    // Add circles to nodes
    node
      .append("circle")
      .attr("r", 30)
      .attr("fill", (d) => d.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)

    // Add role labels
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("fill", "#fff")
      .attr("font-weight", "bold")
      .attr("font-size", "12px")
      .text((d) => d.role)

    // Add name labels below nodes
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "2.5em")
      .attr("fill", "hsl(var(--foreground))")
      .attr("font-size", "11px")
      .text((d) => d.name)

    // Add tooltip on hover
    node.append("title").text((d) => `${d.name} (${d.role})`)

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)

      node.attr("transform", (d) => `translate(${d.x},${d.y})`)
    })

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [graphNodes, graphLinks])

  return <svg ref={svgRef} className="w-full h-full" style={{ cursor: "grab" }} />
}
