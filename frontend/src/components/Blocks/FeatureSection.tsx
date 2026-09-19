import React from 'react'
import {Card, CardContent} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Code2, FileText, ShieldCheck, History} from 'lucide-react'

export const FeatureSection: React.FC = () => {
  const capabilities = [
    {
      icon: <Code2 className="h-5 w-5 text-primary" />,
      title: 'Line-Level Citations',
      description:
        'Every criterion references exact line numbers and excerpts directly from student files to justify scores.'
    },
    {
      icon: <FileText className="h-5 w-5 text-primary" />,
      title: 'Code & Report Support',
      description:
        'Evaluate programming files in Python, Java, and C++ alongside written PDF lab reports with identical rigor.'
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-primary" />,
      title: 'Human-in-the-Loop',
      description:
        'AI only produces preliminary drafts. Instructors retain 100% authority to edit scores before student release.'
    },
    {
      icon: <History className="h-5 w-5 text-primary" />,
      title: 'Audit-Ready History',
      description:
        'Every score adjustment, override reason, and evaluation snapshot is recorded for institutional accountability.'
    }
  ]

  return (
    <section
      id="features"
      className="scroll-mt-24 py-24 sm:py-32 lg:py-40 max-w-5xl mx-auto px-4 sm:px-6"
    >
      <div className="text-center max-w-xl mx-auto mb-16 sm:mb-20 space-y-3">
        <Badge variant="outline" className="text-xs uppercase font-medium tracking-wider px-3 py-1">
          Platform Capabilities
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Built for academic integrity
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Objective, evidence-backed evaluation tools designed to save instructor time without
          sacrificing quality.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 max-w-4xl mx-auto">
        {capabilities.map(cap => (
          <Card
            key={cap.title}
            className="border-border/80 bg-card shadow-xs hover:border-primary/40 transition-colors rounded-xl"
          >
            <CardContent className="p-8 space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 mb-2">
                {cap.icon}
              </div>
              <h3 className="text-lg font-bold text-foreground">{cap.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-normal">
                {cap.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

export default FeatureSection
