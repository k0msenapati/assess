import React from 'react'
import {useQuery} from '@tanstack/react-query'
import {useParams, useNavigate} from '@tanstack/react-router'
import {getEvaluationBySubmission, getSubmissionContent} from '../api/client'
import {Card, CardContent} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {
  CheckCircle2,
  ThumbsUp,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Award,
  BookOpen
} from 'lucide-react'

export const StudentFeedbackView: React.FC = () => {
  const {submissionId} = useParams({strict: false})
  const navigate = useNavigate()
  const subIdNum = Number(submissionId)

  const {
    data: evaluation,
    isLoading: isEvalLoading,
    error
  } = useQuery({
    queryKey: ['student_evaluation', subIdNum],
    queryFn: () => getEvaluationBySubmission(subIdNum),
    enabled: !!subIdNum
  })

  const {isLoading: isContentLoading} = useQuery({
    queryKey: ['student_content', subIdNum],
    queryFn: () => getSubmissionContent(subIdNum),
    enabled: !!subIdNum
  })

  if (isEvalLoading || isContentLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm">Loading grade report...</span>
      </div>
    )
  }

  if (error || !evaluation) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Grade Under Review</h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          Your submission has been assessed against the rubric. Your instructor is currently
          reviewing the tentative feedback before releasing the official report.
        </p>
        <div className="pt-2">
          <Button onClick={() => navigate({to: '/my-submissions'})} size="sm">
            Return to My Submissions
          </Button>
        </div>
      </div>
    )
  }

  const scorePct =
    evaluation.total_max_score > 0 ? (evaluation.total_score / evaluation.total_max_score) * 100 : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({to: '/my-submissions'})}
        className="gap-2 text-xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Submissions</span>
      </Button>

      {/* Grade Report Header */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <Badge variant="success" className="gap-1.5 font-semibold text-xs mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Released by Instructor
            </Badge>
            <h1 className="text-2xl font-bold text-foreground">Grade & Feedback Report</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Rubric assessment results with instructor commentary.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-muted/40 border border-border rounded-xl px-5 py-3.5">
            <Award className="w-10 h-10 text-primary shrink-0" />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Final Grade
              </div>
              <div className="text-2xl font-bold font-mono text-foreground leading-tight">
                {evaluation.total_score}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  / {evaluation.total_max_score} pts
                </span>
              </div>
              <div className="text-xs font-semibold text-primary">{scorePct.toFixed(1)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructor Commentary */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>Instructor Summary</span>
          </h2>
          <p className="text-xs sm:text-sm text-foreground leading-relaxed bg-muted/30 p-4 rounded-lg border border-border">
            {evaluation.summary_feedback || 'Submission satisfied the defined criteria.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <Card className="border-border bg-muted/20 shadow-none">
              <CardContent className="p-3.5 text-xs space-y-2">
                <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5" /> Key Strengths
                </div>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  {evaluation.strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border bg-muted/20 shadow-none">
              <CardContent className="p-3.5 text-xs space-y-2">
                <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Areas for Growth
                </div>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  {evaluation.improvements.map((im, idx) => (
                    <li key={idx}>{im}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Criterion Breakdown */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Rubric Criteria Breakdown</h2>
        <div className="space-y-3">
          {evaluation.scores.map(s => (
            <Card key={s.id} className="border-border shadow-xs">
              <CardContent className="p-5 space-y-2.5">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{s.criterion_name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.criterion_description}
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono font-bold text-xs py-1 px-2.5">
                    {s.final_score} / {s.max_marks} pts
                  </Badge>
                </div>

                <div className="text-xs text-foreground bg-muted/30 p-3 rounded-lg border border-border leading-relaxed">
                  <span className="font-medium text-foreground">Evaluation Feedback: </span>
                  {s.feedback}
                </div>

                {s.deductions && s.deductions.length > 0 && (
                  <div className="text-xs text-amber-800 dark:text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    <span className="font-semibold">Notes: </span>
                    {s.deductions.join('; ')}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
