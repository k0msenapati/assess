import React, {useState} from 'react'
import {Copy, Check, FileCode} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {ScrollArea} from '@/components/ui/scroll-area'

interface CodeViewerProps {
  filename: string
  content: string
  language?: string
  highlightLines?: [number, number] | null
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  filename,
  content,
  language = 'py',
  highlightLines = null
}) => {
  const [copied, setCopied] = useState(false)
  const lines = content.split('\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col h-full font-mono">
      {/* File Header */}
      <div className="bg-muted/50 px-4 py-2.5 border-b border-border flex items-center justify-between text-xs text-foreground">
        <div className="flex items-center space-x-2">
          <FileCode className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">{filename}</span>
          <Badge variant="secondary" className="font-mono uppercase text-[10px] px-1.5 py-0">
            {language}
          </Badge>
          <span className="text-muted-foreground text-[11px]">({lines.length} lines)</span>
        </div>
        <Button variant="outline" size="xs" onClick={handleCopy} className="gap-1 text-[11px]">
          {copied ? (
            <Check className="w-3.5 h-3.5 text-primary" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>

      {/* Code Scrollable Area */}
      <ScrollArea className="flex-1 p-4 font-mono text-xs leading-relaxed text-foreground select-text">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = idx + 1
              const isHighlighted =
                highlightLines && lineNum >= highlightLines[0] && lineNum <= highlightLines[1]

              return (
                <tr
                  key={idx}
                  className={`group transition-colors ${
                    isHighlighted
                      ? 'bg-primary/15 border-l-4 border-primary font-semibold text-foreground'
                      : 'hover:bg-muted/40'
                  }`}
                >
                  <td className="w-12 pr-4 text-right select-none text-muted-foreground/60 font-mono text-xs border-r border-border">
                    {lineNum}
                  </td>
                  <td className="pl-4 whitespace-pre overflow-x-auto">{line || '\n'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  )
}
