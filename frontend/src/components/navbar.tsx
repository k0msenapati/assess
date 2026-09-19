import React from 'react'
import {Link} from '@tanstack/react-router'
import {FileCheck2, Menu, X, ArrowRight} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {AnimatedThemeToggler} from '@/components/ui/animated-theme-toggler'
import {useAuth} from '@/context/AuthContext'
import {cn} from '@/lib/utils'

export const Navbar: React.FC = () => {
  const {token} = useAuth()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isVisible, setIsVisible] = React.useState(true)
  const lastScrollY = React.useRef(0)

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Backdrop & border trigger
      setIsScrolled(currentScrollY > 15)

      // When close to the very top, always show navbar
      if (currentScrollY < 60) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY.current && currentScrollY - lastScrollY.current > 8) {
        // Scrolling DOWN -> hide navbar
        setIsVisible(false)
        setMenuOpen(false)
      } else if (currentScrollY < lastScrollY.current && lastScrollY.current - currentScrollY > 8) {
        // Scrolling UP -> show navbar
        setIsVisible(true)
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, {passive: true})
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 w-full transition-transform duration-300 ease-in-out',
        isVisible ? 'translate-y-0' : '-translate-y-full'
      )}
    >
      <div
        className={cn(
          'mx-auto w-full transition-all duration-300 px-4 sm:px-6 lg:px-8',
          isScrolled
            ? 'bg-background/85 backdrop-blur-md border-b border-border shadow-xs'
            : 'bg-background/60 backdrop-blur-xs border-b border-border/40'
        )}
      >
        <div className="relative max-w-6xl mx-auto h-16 flex items-center justify-between">
          {/* Brand Logo - Left */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 z-10">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Assess</span>
          </Link>

          {/* Academic Navigation Links - Geometrically Dead-Centered */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-1 text-xs lg:text-sm font-medium text-muted-foreground absolute left-1/2 -translate-x-1/2"
          >
            <a
              href="#how-it-works"
              className="px-3 py-1.5 rounded-md hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#preview"
              className="px-3 py-1.5 rounded-md hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              Evaluation Studio
            </a>
            <a
              href="#features"
              className="px-3 py-1.5 rounded-md hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              Capabilities
            </a>
            <a
              href="#faq"
              className="px-3 py-1.5 rounded-md hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              FAQ
            </a>
          </nav>

          {/* Actions & Theme Toggler - Right */}
          <div className="flex items-center gap-3 shrink-0 z-10">
            <AnimatedThemeToggler />

            {token ? (
              <Button asChild size="sm">
                <Link to="/">
                  Dashboard
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/register">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border py-4 px-2 space-y-3 bg-card/95 backdrop-blur-md rounded-b-xl shadow-lg animate-in fade-in-50">
            <a
              href="#how-it-works"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
            >
              How It Works
            </a>
            <a
              href="#preview"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
            >
              Evaluation Studio
            </a>
            <a
              href="#features"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
            >
              Capabilities
            </a>
            <a
              href="#faq"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
            >
              FAQ
            </a>
            <div className="pt-2 border-t border-border flex flex-col gap-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  Sign In
                </Link>
              </Button>
              <Button asChild size="sm" className="w-full">
                <Link to="/register" onClick={() => setMenuOpen(false)}>
                  Register
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
