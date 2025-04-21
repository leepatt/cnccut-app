"use client"

import * as React from "react"

export function GridBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10"
      style={{
        // Using a darker blue gradient for better fit with the existing theme
        background: "radial-gradient(circle at center, #B80F0A20, #111827)", 
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          // Subtle grid lines
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "30px 30px", // Slightly larger grid squares
        }}
      />
    </div>
  )
} 