import React, {useState} from 'react'
import {Card} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Code2, ShieldCheck, FileCode} from 'lucide-react'

export const StudioPreview: React.FC = () => {
  const [activeView, setActiveView] = useState<'code' | 'rubric'>('code')
  const [instructorAdjustment, setInstructorAdjustment] = useState<string>('10')

  return (
    <section
      id="preview"
      className="scroll-mt-24 pb-24 sm:pb-32 lg:pb-40 px-4 sm:px-6 max-w-5xl mx-auto"
    >
      <div className="text-center mb-12 sm:mb-16 space-y-3">
        <Badge variant="outline" className="text-xs uppercase font-medium tracking-wider px-3 py-1">
          Interactive Evaluation Studio
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Complete clarity between code and rubric
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Every criterion points to specific lines in student work, giving instructors quick
          verification and students total clarity.
        </p>
      </div>

      <Card className="overflow-hidden border-border shadow-sm rounded-xl">
        {/* Mock Window Topbar */}
        <div className="border-b border-border px-4 py-3 bg-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5" aria-hidden="true">
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
            </div>
            <div className="flex items-center gap-1.5 ml-3 font-mono text-xs text-muted-foreground">
              <FileCode className="h-3.5 w-3.5" />
              <span>assignment_02_binary_search.py</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant={activeView === 'code' ? 'secondary' : 'ghost'}
              size="xs"
              onClick={() => setActiveView('code')}
              className="text-xs h-7 px-2.5"
            >
              Student Code
            </Button>
            <Button
              variant={activeView === 'rubric' ? 'secondary' : 'ghost'}
              size="xs"
              onClick={() => setActiveView('rubric')}
              className="text-xs h-7 px-2.5"
            >
              Rubric Evidence
            </Button>
          </div>
        </div>

        {/* Studio Dual Pane */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Left Pane: Code Viewer */}
          <div className="lg:col-span-7 p-5 bg-muted/15 font-mono text-xs overflow-x-auto leading-relaxed select-text">
            <div className="text-muted-foreground/70 mb-4 text-[11px]">
              # Submission: student_ada (sub-4819)
            </div>
            <div className="space-y-1.5">
              <div className="flex">
                <span className="w-8 text-muted-foreground/60 select-none">1</span>
                <span className="text-primary font-semibold">def</span>
                <span className="text-foreground ml-1">binary_search(arr, target):</span>
              </div>
              <div className="flex">
                <span className="w-8 text-muted-foreground/60 select-none">2</span>
                <span className="text-muted-foreground ml-4">
                  &quot;&quot;&quot;Searches sorted array in O(log n) time.&quot;&quot;&quot;
                </span>
              </div>
              <div className="flex">
                <span className="w-8 text-muted-foreground/60 select-none">3</span>
                <span className="text-foreground ml-4">low = 0</span>
              </div>
              <div className="flex">
                <span className="w-8 text-muted-foreground/60 select-none">4</span>
                <span className="text-foreground ml-4">high = len(arr) - 1</span>
              </div>
              {/* Highlighted Evidence Lines 5-8 */}
              <div className="flex bg-primary/10 -mx-2 px-2 py-0.5 rounded-sm border-l-2 border-primary">
                <span className="w-8 text-primary font-bold select-none">5</span>
                <span className="text-primary font-semibold ml-4">while</span>
                <span className="text-foreground ml-1">low &lt;= high:</span>
              </div>
              <div className="flex bg-primary/10 -mx-2 px-2 py-0.5 rounded-sm border-l-2 border-primary">
                <span className="w-8 text-primary font-bold select-none">6</span>
                <span className="text-foreground ml-8">mid = (low + high) // 2</span>
              </div>
              <div className="flex bg-primary/10 -mx-2 px-2 py-0.5 rounded-sm border-l-2 border-primary">
                <span className="w-8 text-primary font-bold select-none">7</span>
                <span className="text-primary font-semibold ml-8">if</span>
                <span className="text-foreground ml-1">arr[mid] == target:</span>
              </div>
              <div className="flex bg-primary/10 -mx-2 px-2 py-0.5 rounded-sm border-l-2 border-primary">
                <span className="w-8 text-primary font-bold select-none">8</span>
                <span className="text-foreground ml-12">return mid</span>
              </div>
              <div className="flex">
                <span className="w-8 text-muted-foreground/60 select-none">9</span>
                <span className="text-foreground ml-4">return -1</span>
              </div>
            </div>
          </div>

          {/* Right Pane: Rubric Evaluation Card */}
          <div className="lg:col-span-5 p-6 space-y-5 bg-card">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wider">
                Criterion 1 of 2
              </span>
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 text-xs"
              >
                Draft: 9.5 / 10
              </Badge>
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground">
                Algorithm Correctness & Boundary Handling
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-normal">
                Verifies binary search narrows search space and avoids boundary errors.
              </p>
            </div>

            {/* Cited Line Evidence Box */}
            <div className="p-3.5 rounded-lg bg-muted/40 border border-border text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-primary text-[11px]">
                <Code2 className="h-3.5 w-3.5" />
                <span>Cited Lines 5-8:</span>
              </div>
              <div className="font-mono text-[11px] bg-background p-2.5 rounded border border-border text-foreground">
                while low &lt;= high:
                <br />
                &nbsp;&nbsp;mid = (low + high) // 2
              </div>
              <p className="text-muted-foreground text-[11px] italic">
                &quot;Loop terminates cleanly; midpoint calculation correctly integer-divides
                boundaries.&quot;
              </p>
            </div>

            {/* Instructor Override Field */}
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">Instructor Final Score:</span>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={instructorAdjustment}
                  onChange={e => setInstructorAdjustment(e.target.value)}
                  className="w-14 h-7 text-center font-mono text-xs"
                />
                <span className="text-muted-foreground">/ 10</span>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Draft scores stay private until instructor release.</span>
            </div>
          </div>
        </div>
      </Card>
    </section>
  )
}

export default StudioPreview
