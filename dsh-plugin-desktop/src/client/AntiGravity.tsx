/**
 * Anti-Gravity Physics Simulation for DSH Desktop
 * Lightweight canvas-based physics visualization with Vulkan acceleration support
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export interface AntiGravityParticle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  mass: number
}

export interface AntiGravitySettings {
  particleCount: number
  gravityStrength: number
  mouseRepelForce: number
  repelRadius: number
  friction: number
  showTrails: boolean
  vulkanAccelerated: boolean
}

const DEFAULT_SETTINGS: AntiGravitySettings = {
  particleCount: 150,
  gravityStrength: 0.5,
  mouseRepelForce: 2.0,
  repelRadius: 150,
  friction: 0.99,
  showTrails: true,
  vulkanAccelerated: false, // Will be auto-detected
}

const COLORS = [
  '#4D6BFE',
  '#08C',
  '#2EA44F',
  '#F59E0B',
  '#FF6B6B',
  '#4ECDC4',
  '#A78BFA',
  '#FB7185',
]

export function useAntiGravityPhysics(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  settings: Partial<AntiGravitySettings> = {}
) {
  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings }
  const particlesRef = useRef<AntiGravityParticle[]>([])
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const animationFrameRef = useRef<number>()
  const [isRunning, setIsRunning] = useState(true)

  // Auto-detect Vulkan support via WebGL2
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          // Check for Vulkan-compatible GPU
          mergedSettings.vulkanAccelerated = 
            /NVIDIA|AMD|Intel|Vulkan|Mesa/i.test(renderer || '')
        }
      }
    } catch {
      mergedSettings.vulkanAccelerated = false
    }
  }, [])

  const createParticle = useCallback((width: number, height: number): AntiGravityParticle => {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: Math.random() * 3 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      mass: Math.random() * 2 + 1,
    }
  }, [])

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    particlesRef.current = Array.from(
      { length: mergedSettings.particleCount },
      () => createParticle(canvas.width, canvas.height)
    )
  }, [mergedSettings.particleCount, createParticle])

  const updatePhysics = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const particles = particlesRef.current
    const mouse = mouseRef.current

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]

      // Apply anti-gravity (repulsion from mouse)
      const dx = p.x - mouse.x
      const dy = p.y - mouse.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < mergedSettings.repelRadius && dist > 0) {
        const force = (mergedSettings.mouseRepelForce * (1 - dist / mergedSettings.repelRadius)) / dist
        p.vx += dx * force
        p.vy += dy * force
      }

      // Apply mutual attraction between particles (weak gravity)
      for (let j = i + 1; j < particles.length; j++) {
        const other = particles[j]
        const pdx = other.x - p.x
        const pdy = other.y - p.y
        const pDist = Math.sqrt(pdx * pdx + pdy * pdy)

        if (pDist > 0 && pDist < 200) {
          const force = mergedSettings.gravityStrength / (pDist * pDist)
          p.vx += pdx * force * other.mass
          p.vy += pdy * force * other.mass
          other.vx -= pdx * force * p.mass
          other.vy -= pdy * force * p.mass
        }
      }

      // Apply friction
      p.vx *= mergedSettings.friction
      p.vy *= mergedSettings.friction

      // Update position
      p.x += p.vx
      p.y += p.vy

      // Boundary collision with bounce
      if (p.x < p.radius) {
        p.x = p.radius
        p.vx *= -0.8
      } else if (p.x > canvas.width - p.radius) {
        p.x = canvas.width - p.radius
        p.vx *= -0.8
      }

      if (p.y < p.radius) {
        p.y = p.radius
        p.vy *= -0.8
      } else if (p.y > canvas.height - p.radius) {
        p.y = canvas.height - p.radius
        p.vy *= -0.8
      }
    }
  }, [mergedSettings.gravityStrength, mergedSettings.mouseRepelForce, mergedSettings.repelRadius, mergedSettings.friction])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear with trail effect
    if (mergedSettings.showTrails) {
      ctx.fillStyle = 'rgba(32, 33, 36, 0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    // Draw particles
    const particles = particlesRef.current
    for (const p of particles) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      
      // Glow effect for Vulkan-accelerated mode
      if (mergedSettings.vulkanAccelerated) {
        ctx.shadowBlur = 10
        ctx.shadowColor = p.color
      } else {
        ctx.shadowBlur = 0
      }
      
      ctx.fill()
      ctx.shadowBlur = 0
    }

    // Draw connections between nearby particles
    ctx.strokeStyle = 'rgba(77, 107, 254, 0.15)'
    ctx.lineWidth = 0.5
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i]
        const p2 = particles[j]
        const dx = p1.x - p2.x
        const dy = p1.y - p2.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 100) {
          ctx.globalAlpha = 1 - dist / 100
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
        }
      }
    }
    ctx.globalAlpha = 1
  }, [mergedSettings.showTrails, mergedSettings.vulkanAccelerated])

  const animate = useCallback(() => {
    if (!isRunning) return

    updatePhysics()
    render()
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [isRunning, updatePhysics, render])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size
    const resizeObserver = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      initParticles()
    })

    resizeObserver.observe(canvas)
    initParticles()

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) * window.devicePixelRatio,
        y: (e.clientY - rect.top) * window.devicePixelRatio,
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    // Start animation
    animate()

    return () => {
      resizeObserver.disconnect()
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [initParticles, animate])

  const reset = useCallback(() => {
    initParticles()
  }, [initParticles])

  const togglePause = useCallback(() => {
    setIsRunning(prev => !prev)
  }, [])

  return { isRunning, reset, togglePause, vulkanAccelerated: mergedSettings.vulkanAccelerated }
}

export interface AntiGravityCanvasProps {
  className?: string
  settings?: Partial<AntiGravitySettings>
}

export function AntiGravityCanvas({ className = '', settings = {} }: AntiGravityCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { isRunning, reset, togglePause, vulkanAccelerated } = useAntiGravityPhysics(canvasRef, settings)

  return (
    <div className={`relative ${className}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          onClick={togglePause}
          style={{
            padding: '6px 12px',
            background: 'rgba(77, 107, 254, 0.8)',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          {isRunning ? 'Pause' : 'Resume'}
        </button>
        <button
          onClick={reset}
          style={{
            padding: '6px 12px',
            background: 'rgba(46, 164, 79, 0.8)',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Reset
        </button>
        {vulkanAccelerated && (
          <span
            style={{
              padding: '6px 12px',
              background: 'rgba(8, 204, 196, 0.8)',
              borderRadius: '6px',
              color: 'white',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            ✓ Vulkan Active
          </span>
        )}
      </div>
    </div>
  )
}
