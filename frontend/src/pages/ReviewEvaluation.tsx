import React, {useState} from 'react'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {useParams, useNavigate} from '@tanstack/react-router'
import {getEvaluationBySubmission, getSubmissionContent, reviewEvaluation} from '../api/client'
import type {Evaluation} from '../types'
import {CodeViewer} from '../components/CodeViewer'
import {Card, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {
  CheckCircle2,
  Clock,
  ArrowLeft,
  ThumbsUp,
  AlertTriangle,
  Save,
  Loader2,
  Quote,
  Edit3
} from 'lucide-react'

export const ReviewEvaluation: React.FC = () => {
  const {submissionId} = useParams({strict: false})
  const subIdNum = Number(submissionId)

  const {data: evaluation, isLoading: isEvalLoading} = useQuery({
    queryKey: ['evaluation', subIdNum],
    queryFn: () => getEvaluationBySubmission(subIdNum),
    enabled: !!subIdNum
  })

  const {data: contentData, isLoading: isContentLoading} = useQuery({
    queryKey: ['submission_content', subIdNum],
    queryFn: () => getSubmissionContent(subIdNum),
    enabled: !!subIdNum
  })

  if (isEvalLoading || isContentLoading || !evaluation || !contentData) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm">Loading grading studio...</span>
      </div>
    )
  }

  return (
    <GradingStudio
      key={evaluation.id}
      evaluation={evaluation}
      contentData={contentData}
      subIdNum={subIdNum}
    />
  )
}

interface GradingStudioProps {
  evaluation: Evaluation
  contentData: {id: number; file_name: string; file_type: string; content: string}
  subIdNum: number
}

const GradingStudio: React.FC<GradingStudioProps> = ({
  evaluation,
  contentData,
  subIdNum
}) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [highlightLines, setHighlightLines] = useState<[number, number] | null>(null)
  const [overrides, setOverrides] = useState<Record<number, {score: number; reason: string}>>(() => {
    const initialOverrides: Record<number, {score: number; reason: string}> = {}
    evaluation.scores?.forEach(s => {
      initialOverrides[s.criterion_id] = {
        score: s.final_score,
        reason: s.override_reason || ''
      }
    })
    return initialOverrides
  })
  const [summaryFeedback, setSummaryFeedback] = useState<string>(evaluation.summary_feedback || '')

  const reviewMutation = useMutation({
    mutationFn: (finalize: boolean) => {
      const overrideList = Object.entries(overrides).map(([critId, data]) => ({
        criterion_id: Number(critId),
        final_score: data.score,
        override_reason: data.reason
      }))
      return reviewEvaluation(evaluation.id, {
        summary_feedback: summaryFeedback,
        overrides: overrideList,
        finalize
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['evaluation', subIdNum]})
      queryClient.invalidateQueries({queryKey: ['submissions']})
      alert('Evaluation updated successfully.')
      navigate({to: '/'})
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to save review.')
    }
  })

  const handleScoreChange = (criterionId: number, newScore: number) => {
    setOverrides(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        score: newScore
      }
    }))
  }

  const handleReasonChange = (criterionId: number, reason: string) => {
    setOverrides(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        reason
      }
    }))
  }

  const parseLineNumbersFromQuote = (quote: string) => {
    const match = quote.match(/lines?\s*(\d+)(?:-(\d+))?/i)
    if (match) {
      const start = parseInt(match[1], 10)
      const end = match[2] ? parseInt(match[2], 10) : start
      setHighlightLines([start, end])
    }
  }

  const currentTotal = Object.values(overrides).reduce((acc, curr) => acc + (curr?.score || 0), 0)

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({to: '/'})}
              title="Return to assignments"
              className="h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-foreground">Grading Studio</h1>
                {evaluation.status === 'finalized' ? (
                  <Badge variant="success" className="gap-1.5 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Graded & Released</span>
                  </Badge>
                ) : (
                  <Badge variant="info" className="gap-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Draft Grade (Pending Professor Approval)</span>
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Submission:{' '}
                <span className="font-medium text-foreground">{contentData.file_name}</span>
              </p>
            </div>
          </div>

          {/* Score & Publishing Controls */}
          <div className="flex items-center gap-5">
            <div className="text-right border-r border-border pr-5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Total Points
              </div>
              <div className="text-2xl font-bold font-mono text-foreground leading-tight">
                {currentTotal.toFixed(1)}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  / {evaluation.total_max_score}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => reviewMutation.mutate(false)}
                disabled={reviewMutation.isPending}
                className="gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </Button>
              <Button
                size="sm"
                onClick={() => reviewMutation.mutate(true)}
                disabled={reviewMutation.isPending}
                className="gap-1.5"
              >
                {reviewMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Approve & Release</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Column: Student Work Display */}
        <div className="lg:col-span-6 flex flex-col min-h-[450px]">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="font-semibold text-foreground">Student Submission</span>
            {highlightLines && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setHighlightLines(null)}
                className="text-primary text-xs h-auto p-0"
              >
                Clear Line Highlight (lines {highlightLines[0]}-{highlightLines[1]})
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <CodeViewer
              filename={contentData.file_name}
              content={contentData.content}
              language={contentData.file_type}
              highlightLines={highlightLines}
            />
          </div>
        </div>

        {/* Right Column: Instructor Review & Rubric Adjustments */}
        <div className="lg:col-span-6 space-y-4">
          {/* Instructor Holistic Feedback */}
          <Card className="border-border shadow-xs">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-primary" />
                  <span>Overall Feedback</span>
                </h2>
                <span className="text-[11px] text-muted-foreground">
                  Student will see this comment
                </span>
              </div>
              <Textarea
                rows={3}
                value={summaryFeedback}
                onChange={e => setSummaryFeedback(e.target.value)}
                placeholder="Provide constructive feedback for the student..."
                className="text-xs"
              />

              {/* Strengths & Improvement Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Card className="border-border bg-muted/20 shadow-none">
                  <CardContent className="p-3 text-xs">
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1.5">
                      <ThumbsUp className="w-3.5 h-3.5" /> Strengths
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-foreground">
                      {evaluation.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-border bg-muted/20 shadow-none">
                  <CardContent className="p-3 text-xs">
                    <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Areas for Improvement
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-foreground">
                      {evaluation.improvements.map((im, i) => (
                        <li key={i}>{im}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Criterion Evaluation Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-foreground">Rubric Criteria Breakdown</h2>
              <span className="text-xs text-muted-foreground">You may adjust any score</span>
            </div>

            {evaluation.scores.map(s => {
              const currentScore = overrides[s.criterion_id]?.score ?? s.final_score
              const currentReason = overrides[s.criterion_id]?.reason ?? (s.override_reason || '')
              const isOverridden = currentScore !== s.tentative_score

              return (
                <Card
                  key={s.id}
                  className={`transition shadow-xs ${
                    isOverridden ? 'border-primary ring-1 ring-primary/40' : 'border-border'
                  }`}
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                          {s.criterion_name}
                          {isOverridden && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-primary/10 text-primary border-primary/30"
                            >
                              Score Adjusted
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {s.criterion_description}
                        </p>
                      </div>

                      {/* Point Allocation Control */}
                      <div className="flex items-center gap-1.5 shrink-0 bg-muted/40 border border-border px-3 py-1.5 rounded-lg">
                        <Label className="text-xs font-medium text-muted-foreground">Points:</Label>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max={s.max_marks}
                          value={currentScore}
                          onChange={e => handleScoreChange(s.criterion_id, Number(e.target.value))}
                          className="w-14 h-7 text-xs font-mono font-bold text-center"
                        />
                        <span className="text-xs text-muted-foreground font-medium">
                          / {s.max_marks}
                        </span>
                      </div>
                    </div>

                    {/* Observations */}
                    <div className="text-xs text-foreground bg-muted/30 p-3 rounded-lg border border-border leading-relaxed">
                      <span className="font-semibold text-foreground">Observations: </span>
                      {s.feedback}
                    </div>

                    {/* Evidence Quotes */}
                    {s.evidence_quotes && s.evidence_quotes.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Cited Evidence (click to highlight line):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {s.evidence_quotes.map((q, qi) => (
                            <Button
                              key={qi}
                              type="button"
                              variant="secondary"
                              size="xs"
                              onClick={() => parseLineNumbersFromQuote(q)}
                              className="gap-1.5 text-[11px] font-mono"
                            >
                              <Quote className="w-3 h-3 shrink-0 text-primary" />
                              <span className="line-clamp-1">{q}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Deductions / Considerations */}
                    {s.deductions && s.deductions.length > 0 && (
                      <div className="text-xs text-amber-800 dark:text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                        <span className="font-semibold">Grading Notes: </span>
                        {s.deductions.join('; ')}
                      </div>
                    )}

                    {/* Reason for Override */}
                    {isOverridden && (
                      <div className="pt-1 space-y-1">
                        <Label className="text-[11px] font-medium text-foreground">
                          Adjustment Reason (Saved to audit history):
                        </Label>
                        <Input
                          type="text"
                          value={currentReason}
                          onChange={e => handleReasonChange(s.criterion_id, e.target.value)}
                          placeholder="e.g., Clear structure despite minor formatting omission"
                          className="h-8 text-xs border-primary/50"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
