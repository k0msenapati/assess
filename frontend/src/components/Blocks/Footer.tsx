import React from 'react'
import {Link} from '@tanstack/react-router'

export const Footer: React.FC = () => {
  return (
    <footer className="py-20 sm:py-28 lg:py-32 border-t border-border/50 bg-background text-foreground transition-colors">
      <div className="mx-auto max-w-7xl space-y-12 sm:space-y-16 px-4 sm:px-6 lg:px-8">
        {/* Navigation Quick Links */}
        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm text-muted-foreground font-medium">
            <li>
              <Link to="/login" className="hover:text-foreground transition-colors">
                Instructor Portal
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-foreground transition-colors">
                Student Workspace
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-foreground transition-colors">
                Rubric Engine
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-foreground transition-colors">
                Audit Workflows
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-foreground transition-colors">
                Privacy & RBAC
              </Link>
            </li>
          </ul>
        </nav>

        {/* Value Proposition Statement */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-center text-xs sm:text-sm text-muted-foreground font-normal">
          <span>Fair & Transparent Grading</span>
          <span className="text-border" aria-hidden="true">
            &bull;
          </span>
          <span>Deterministic Rubric Intelligence</span>
          <span className="text-border" aria-hidden="true">
            &bull;
          </span>
          <span>NFR-11 Academic Isolation</span>
        </div>

        {/* Bottom: Signature Giant Brand Wordmark + Copyright */}
        <div className="space-y-6 text-center select-none pt-4 sm:pt-6">
          <div className="overflow-hidden">
            <h2 className="text-6xl sm:text-8xl md:text-9xl lg:text-[11rem] font-black tracking-tighter leading-none text-foreground/90 dark:text-foreground uppercase transition-colors">
              Assess
            </h2>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            &copy; {new Date().getFullYear()} Assess Platform. Built for higher education and
            verified rubric evaluations.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
