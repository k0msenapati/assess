import * as React from 'react'
import {Moon, Sun} from 'lucide-react'
import {flushSync} from 'react-dom'
import {cn} from '@/lib/utils'

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<'button'> {
  duration?: number
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  ...props
}: AnimatedThemeTogglerProps) => {
  const [isDark, setIsDark] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    const updateTheme = () => {
      const savedTheme = localStorage.getItem('assess_theme')
      if (savedTheme === 'dark') {
        setIsDark(true)
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else if (savedTheme === 'light') {
        setIsDark(false)
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
      } else {
        const isSystemDark = document.documentElement.classList.contains('dark')
        setIsDark(isSystemDark)
      }
    }

    updateTheme()

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  const toggleTheme = React.useCallback(async () => {
    const nextTheme = !isDark

    const applyThemeChange = () => {
      setIsDark(nextTheme)
      if (nextTheme) {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
        localStorage.setItem('assess_theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
        localStorage.setItem('assess_theme', 'light')
      }
    }

    // Fallback if View Transitions API is unavailable
    if (
      typeof document === 'undefined' ||
      !('startViewTransition' in document) ||
      typeof document.startViewTransition !== 'function'
    ) {
      applyThemeChange()
      return
    }

    try {
      await document.startViewTransition(() => {
        flushSync(() => {
          applyThemeChange()
        })
      }).ready

      if (buttonRef.current && typeof document.documentElement.animate === 'function') {
        const {top, left, width, height} = buttonRef.current.getBoundingClientRect()
        const x = left + width / 2
        const y = top + height / 2
        const maxRadius = Math.hypot(
          Math.max(left, window.innerWidth - left),
          Math.max(top, window.innerHeight - top)
        )

        document.documentElement.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`]
          },
          {
            duration,
            easing: 'ease-in-out',
            pseudoElement: '::view-transition-new(root)'
          }
        )
      }
    } catch {
      applyThemeChange()
    }
  }, [isDark, duration])

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggleTheme}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-xs hover:bg-muted cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      aria-label="Toggle theme"
      {...props}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
