import React from 'react'
import {Card, CardContent} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Sliders, SearchCheck, CheckSquare} from 'lucide-react'

export const WorkflowSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Define Rubric',
      description: 'Set criteria, point weights, and expectations for the assignment in minutes.',
      icon: <Sliders className="h-5 w-5 text-primary" />
    },
    {
      step: '02',
      title: 'Extract Citations',
      description: 'Submissions are scanned to match exact file lines against each criterion.',
      icon: <SearchCheck className="h-5 w-5 text-primary" />
    },
    {
      step: '03',
      title: 'Review & Release',
      description: 'Faculty verify draft scores, apply overrides, and authorize student feedback.',
      icon: <CheckSquare className="h-5 w-5 text-primary" />
    }
  ]

  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 py-24 sm:py-32 lg:py-40 border-t border-border/40 bg-muted/10"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-16 sm:mb-20 space-y-3">
          <Badge
            variant="outline"
            className="text-xs uppercase font-medium tracking-wider px-3 py-1"
          >
            Three Simple Steps
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            From submission to verified release
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Instructors stay in complete control while students receive clear, transparent grading.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {steps.map(item => (
            <Card
              key={item.step}
              className="border-border/80 bg-card shadow-xs hover:shadow-sm transition-all rounded-xl"
            >
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                    {item.icon}
                  </div>
                  <span className="font-mono text-xs font-semibold text-muted-foreground/80 tracking-wider">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground pt-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-normal">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WorkflowSection
