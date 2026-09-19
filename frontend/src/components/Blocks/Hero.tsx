import React from 'react'
import {Link} from '@tanstack/react-router'
import {ArrowRight, Sparkles} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {useAuth} from '@/context/AuthContext'

export const Hero: React.FC = () => {
  const {token} = useAuth()

  return (
    <section className="pt-20 pb-24 sm:pt-28 sm:pb-32 lg:pt-36 lg:pb-40 px-4 sm:px-6 max-w-4xl mx-auto text-center">
      {/* Purpose Badge */}
      <div className="inline-flex items-center gap-2 mb-8">
        <Badge
          variant="outline"
          className="px-3.5 py-1.5 text-xs font-medium gap-2 rounded-full border-border bg-card"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Verifiable Line-Level Citations</span>
        </Badge>
      </div>

      {/* Main Headline */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.12]">
        Fair academic grading with{' '}
        <span className="text-primary underline decoration-primary/30 underline-offset-8">
          exact evidence
        </span>
      </h1>

      {/* Concise Subtitle */}
      <p className="mt-8 text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-normal">
        Match student code and reports directly against rubric criteria with line citations.
        Instructors retain 100% review authority before grades are released.
      </p>

      {/* Action Buttons */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button asChild size="lg" className="rounded-lg shadow-xs px-6 h-11 text-sm font-medium">
          <Link to={token ? '/' : '/register'}>
            {token ? 'Go to Assignments' : 'Start Evaluating Work'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="rounded-lg px-6 h-11 text-sm font-medium"
        >
          <a href="#preview">See Studio Preview</a>
        </Button>
      </div>

      {/* Minimal Supported Formats Indicator */}
      <div className="mt-16 pt-8 border-t border-border/40 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-muted-foreground font-mono">
        <span className="text-[11px] font-sans font-medium tracking-wider uppercase text-foreground/70">
          Supported:
        </span>
        <span>Python (.py)</span>
        <span className="text-border" aria-hidden="true">
          &bull;
        </span>
        <span>Java (.java)</span>
        <span className="text-border" aria-hidden="true">
          &bull;
        </span>
        <span>C++ (.cpp)</span>
        <span className="text-border" aria-hidden="true">
          &bull;
        </span>
        <span>PDF Lab Reports</span>
      </div>
    </section>
  )
}

export default Hero
