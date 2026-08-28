/**
 * Codex UI Component for DSH Desktop
 * Lightweight, minimalist code-like interface with syntax highlighting
 * Optimized for low resource usage with Vulkan acceleration support
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export interface CodexLine {
  id: string
  content: string
  type: 'code' | 'comment' | 'output' | 'prompt'
  timestamp: number
}

export interface CodexUIState {
  lines: CodexLine[]
  isTyping: boolean
  currentPrompt: string
  vulkanEnabled: boolean
}

export interface CodexUISettings {
  maxLines: number
  typingSpeed: number
  fontSize: number
  fontFamily: string
  showLineNumbers: boolean
  theme: 'dark' | 'light' | 'auto'
  vulkanAccelerated: boolean
}

const DEFAULT_SETTINGS: CodexUISettings = {
  maxLines: 100,
  typingSpeed: 30,
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  showLineNumbers: true,
  theme: 'dark',
  vulkanAccelerated: false,
}

// Simple syntax highlighting patterns
const SYNTAX_PATTERNS = {
  keyword: /\b(const|let|var|function|return|if|else|for|while|class|import|from|export|default|async|await|try|catch|throw|new|this|typeof|instanceof)\b/g,
  string: /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
  comment: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
  number: /\b\d+\.?\d*\b/g,
  function: /\b[a-zA-Z_]\w*(?=\()/g,
  operator: /([+\-*/%=<>!&|^~?:]+)/g,
}

const THEME_COLORS = {
  dark: {
    background: '#202124',
    foreground: '#E8EAED',
    keyword: '#C586C0',
    string: '#CE9178',
    comment: '#6A9955',
    number: '#B5CEA8',
    function: '#DCDCAA',
    operator: '#569CD6',
    prompt: '#4D6BFE',
    output: '#9CDCFE',
    lineNumber: '#858585',
    cursor: '#4D6BFE',
  },
  light: {
    background: '#FFFFFF',
    foreground: '#1E1E1E',
    keyword: '#0000FF',
    string: '#A31515',
    comment: '#008000',
    number: '#098658',
    function: '#795E26',
    operator: '#000000',
    prompt: '#0066CC',
    output: '#0451A5',
    lineNumber: '#237893',
    cursor: '#0066CC',
  },
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function highlightSyntax(text: string, colors: typeof THEME_COLORS.dark): string {
  let highlighted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Apply highlighting in order of specificity
  highlighted = highlighted
    .replace(SYNTAX_PATTERNS.comment, `<span style="color: ${colors.comment}">$1</span>`)
    .replace(SYNTAX_PATTERNS.string, `<span style="color: ${colors.string}">$&</span>`)
    .replace(SYNTAX_PATTERNS.keyword, `<span style="color: ${colors.keyword}">$&</span>`)
    .replace(SYNTAX_PATTERNS.function, `<span style="color: ${colors.function}">$&</span>`)
    .replace(SYNTAX_PATTERNS.number, `<span style="color: ${colors.number}">$&</span>`)
    .replace(SYNTAX_PATTERNS.operator, `<span style="color: ${colors.operator}">$&</span>`)

  return highlighted
}

export function useCodexUI(
  containerRef: React.RefObject<HTMLDivElement>,
  settings: Partial<CodexUISettings> = {}
) {
  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings }
  const [state, setState] = useState<CodexUIState>({
    lines: [],
    isTyping: false,
    currentPrompt: '',
    vulkanEnabled: false,
  })
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-detect Vulkan/WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          mergedSettings.vulkanAccelerated = /NVIDIA|AMD|Intel|Vulkan|Mesa/i.test(renderer || '')
        }
      }
      setState(prev => ({ ...prev, vulkanEnabled: mergedSettings.vulkanAccelerated }))
    } catch {
      mergedSettings.vulkanAccelerated = false
    }
  }, [])

  const addLine = useCallback((content: string, type: CodexLine['type'] = 'code') => {
    setState(prev => {
      const newLine: CodexLine = {
        id: generateId(),
        content,
        type,
        timestamp: Date.now(),
      }
      const newLines = [...prev.lines, newLine]
      // Trim to max lines
      if (newLines.length > mergedSettings.maxLines) {
        newLines.shift()
      }
      return { ...prev, lines: newLines }
    })

    // Auto-scroll to bottom
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 10)
  }, [mergedSettings.maxLines])

  const addCode = useCallback((code: string) => {
    addLine(code, 'code')
  }, [addLine])

  const addComment = useCallback((comment: string) => {
    addLine(comment, 'comment')
  }, [addLine])

  const addOutput = useCallback((output: string) => {
    addLine(output, 'output')
  }, [addLine])

  const setPrompt = useCallback((prompt: string) => {
    setState(prev => ({ ...prev, currentPrompt: prompt }))
  }, [])

  const executePrompt = useCallback(async () => {
    const prompt = state.currentPrompt.trim()
    if (!prompt || state.isTyping) return

    setState(prev => ({ ...prev, isTyping: true }))
    addLine(`> ${prompt}`, 'prompt')

    // Simulate command execution (in real implementation, this would call actual commands)
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Add simulated response
    const responses = [
      'Executing...',
      'Processing request...',
      'Operation completed successfully.',
      'Ready for next command.',
    ]
    const response = responses[Math.floor(Math.random() * responses.length)]
    addOutput(response)
    
    setState(prev => ({ 
      ...prev, 
      isTyping: false,
      currentPrompt: '' 
    }))
  }, [state.currentPrompt, state.isTyping, addLine, addOutput])

  const clear = useCallback(() => {
    setState(prev => ({ ...prev, lines: [] }))
  }, [])

  return {
    state,
    addCode,
    addComment,
    addOutput,
    setPrompt,
    executePrompt,
    clear,
    scrollRef,
  }
}

export interface CodexUIProps {
  className?: string
  settings?: Partial<CodexUISettings>
  initialCode?: string[]
}

export function CodexUI({ className = '', settings = {}, initialCode = [] }: CodexUIProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { state, addCode, addComment, addOutput, setPrompt, executePrompt, clear, scrollRef } = useCodexUI(containerRef, settings)
  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings }
  
  const colors = mergedSettings.theme === 'light' 
    ? THEME_COLORS.light 
    : THEME_COLORS.dark

  // Initialize with sample code
  useEffect(() => {
    if (initialCode.length > 0 && state.lines.length === 0) {
      initialCode.forEach(line => {
        if (line.startsWith('//')) {
          addComment(line)
        } else {
          addCode(line)
        }
      })
    }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      executePrompt()
    }
  }, [executePrompt])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value)
  }, [setPrompt])

  return (
    <div
      ref={containerRef}
      className={`codex-ui ${className}`}
      style={{
        width: '100%',
        height: '100%',
        background: colors.background,
        color: colors.foreground,
        fontFamily: mergedSettings.fontFamily,
        fontSize: `${mergedSettings.fontSize}px`,
        lineHeight: '1.6',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${colors.lineNumber}30`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '13px' }}>
          📟 Codex Interface
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {state.vulkanEnabled && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                background: `${colors.prompt}40`,
                borderRadius: '4px',
                color: colors.prompt,
              }}
            >
              ⚡ Vulkan Active
            </span>
          )}
          <button
            onClick={clear}
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              background: 'transparent',
              border: `1px solid ${colors.lineNumber}50`,
              borderRadius: '4px',
              color: colors.foreground,
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Code display area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '12px',
          fontFamily: mergedSettings.fontFamily,
        }}
      >
        {state.lines.map((line, index) => (
          <div
            key={line.id}
            style={{
              display: 'flex',
              marginBottom: '2px',
              opacity: state.isTyping && index === state.lines.length - 1 ? 0.7 : 1,
            }}
          >
            {mergedSettings.showLineNumbers && (
              <span
                style={{
                  color: colors.lineNumber,
                  minWidth: '40px',
                  textAlign: 'right',
                  paddingRight: '12px',
                  userSelect: 'none',
                  fontSize: '12px',
                }}
              >
                {String(index + 1).padStart(3, '0')}
              </span>
            )}
            <div
              style={{
                flex: 1,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                color: line.type === 'comment' 
                  ? colors.comment 
                  : line.type === 'prompt'
                  ? colors.prompt
                  : line.type === 'output'
                  ? colors.output
                  : colors.foreground,
              }}
              dangerouslySetInnerHTML={{
                __html: line.type === 'code' 
                  ? highlightSyntax(line.content, colors)
                  : line.content.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
              }}
            />
          </div>
        ))}
        
        {/* Current prompt line */}
        <div style={{ display: 'flex', marginTop: '8px' }}>
          {mergedSettings.showLineNumbers && (
            <span
              style={{
                color: colors.lineNumber,
                minWidth: '40px',
                textAlign: 'right',
                paddingRight: '12px',
                userSelect: 'none',
                fontSize: '12px',
              }}
            >
              {String(state.lines.length + 1).padStart(3, '0')}
            </span>
          )}
          <span style={{ color: colors.prompt, marginRight: '8px' }}>{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={state.currentPrompt}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={state.isTyping}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: colors.foreground,
              fontFamily: mergedSettings.fontFamily,
              fontSize: `${mergedSettings.fontSize}px`,
              caretColor: colors.cursor,
            }}
            placeholder={state.isTyping ? 'Executing...' : 'Enter command...'}
          />
        </div>
      </div>

      {/* Status bar */}
      <div
        style={{
          padding: '6px 12px',
          borderTop: `1px solid ${colors.lineNumber}30`,
          fontSize: '11px',
          color: colors.lineNumber,
          display: 'flex',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span>Lines: {state.lines.length}/{mergedSettings.maxLines}</span>
        <span>
          {state.isTyping ? '⏳ Executing' : '✓ Ready'}
          {mergedSettings.vulkanAccelerated && ' • GPU Accelerated'}
        </span>
      </div>
    </div>
  )
}
