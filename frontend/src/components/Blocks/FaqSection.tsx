import React from 'react'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '@/components/ui/accordion'
import {Badge} from '@/components/ui/badge'

export const FaqSection: React.FC = () => {
  const faqItems = [
    {
      question: 'How do line-level citations work?',
      answer:
        'Assess pinpoints the exact line numbers in code or text that address each rubric criterion. Instructors and students can click to see the verbatim evidence immediately.'
    },
    {
      question: 'Can instructors override AI draft scores?',
      answer:
        'Yes. All AI evaluations are preliminary suggestions. Course faculty have complete authority to adjust marks, add personal notes, and approve the final score.'
    },
    {
      question: 'When do students see their feedback?',
      answer:
        'Draft scores are hidden from students during evaluation. Feedback and grades only become visible once course staff explicitly verify and release them.'
    },
    {
      question: 'What assignment file formats are supported?',
      answer:
        'We support Python (.py), Java (.java), C++ (.cpp), PDF lab reports (.pdf), and plain text documents (.txt). Additional language configurations are available.'
    },
    {
      question: 'Is student coursework kept confidential?',
      answer:
        'Yes. All submissions and rubric data remain strictly private within your university course environment, protected by role-based access control.'
    }
  ]

  return (
    <section
      id="faq"
      className="scroll-mt-24 py-24 sm:py-32 lg:py-40 border-t border-border/40 bg-muted/10"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16 sm:mb-20 space-y-3">
          <Badge
            variant="outline"
            className="text-xs uppercase font-medium tracking-wider px-3 py-1"
          >
            Questions & Answers
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Frequently asked questions
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Common questions from professors, teaching assistants, and students.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border/80 rounded-xl bg-card px-5 transition-colors"
            >
              <AccordionTrigger className="text-left font-semibold text-foreground text-sm sm:text-base py-5 hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pb-5">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

export default FaqSection
