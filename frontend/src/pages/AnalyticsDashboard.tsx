import React from 'react'
import {useQuery} from '@tanstack/react-query'
import {ColumnDef} from '@tanstack/react-table'
import {getEvaluationMetrics} from '../api/client'
import {MetricsData} from '../types'
import {DataTable} from '../components/DataTable'
import {Card, CardContent} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Progress} from '@/components/ui/progress'
import {
  BarChart3,
  Target,
  FileCheck2,
  TrendingUp,
  SlidersHorizontal,
  Loader2,
  ShieldCheck,
  Scale
} from 'lucide-react'

export const AnalyticsDashboard: React.FC = () => {
  const {data: metrics, isLoading} = useQuery({
    queryKey: ['evaluation_metrics'],
    queryFn: getEvaluationMetrics
  })

  const columns: ColumnDef<MetricsData['recent_evaluations'][0]>[] = [
    {
      accessorKey: 'evaluation_id',
      header: 'Evaluation ID',
      cell: ({row}) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{row.original.evaluation_id}
        </span>
      )
    },
    {
      accessorKey: 'assignment_title',
      header: 'Assignment',
      cell: ({row}) => (
        <span className="font-medium text-foreground">{row.original.assignment_title}</span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({row}) => {
        const isFinal = row.original.status === 'finalized'
        return (
          <Badge variant={isFinal ? 'success' : 'info'} className="text-xs">
            {isFinal ? 'Released' : 'Draft'}
          </Badge>
        )
      }
    },
    {
      accessorKey: 'total_score',
      header: 'Score Awarded',
      cell: ({row}) => (
        <span className="font-mono font-medium text-foreground">
          {row.original.total_score}{' '}
          <span className="text-xs text-muted-foreground font-normal">
            / {row.original.total_max_score} pts
          </span>
        </span>
      )
    },
    {
      accessorKey: 'evaluated_at',
      header: 'Date',
      cell: ({row}) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.evaluated_at).toLocaleDateString()}{' '}
          {new Date(row.original.evaluated_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      )
    }
  ]

  if (isLoading || !metrics) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm">Loading analytics report...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          <span>Grading Analytics & Consistency</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Rubric coverage, instructor adjustments, and class score distribution.
        </p>
      </div>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Score Agreement */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">Score Agreement</span>
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {metrics.score_agreement_mae.toFixed(1)}{' '}
              <span className="text-xs font-normal text-muted-foreground font-sans">
                avg point delta
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mean difference between draft marks and final professor release.
            </p>
          </CardContent>
        </Card>

        {/* Rubric Coverage */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">Rubric Coverage</span>
              <FileCheck2 className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold font-mono text-primary">
              {metrics.rubric_coverage_pct.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All defined criteria evaluated with cited evidence.
            </p>
          </CardContent>
        </Card>

        {/* Average Performance */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">Class Average</span>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {metrics.average_score_pct.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mean score awarded across all evaluated submissions.
            </p>
          </CardContent>
        </Card>

        {/* Adjustments */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">Adjustments Made</span>
              <SlidersHorizontal className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {metrics.overridden_criterion_count}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Criteria scores customized during faculty review.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-border shadow-xs">
          <CardContent className="p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              <span>Grading Status</span>
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-foreground">Released</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                    {metrics.finalized_count} submissions
                  </span>
                </div>
                <Progress
                  value={
                    metrics.total_evaluations > 0
                      ? (metrics.finalized_count / metrics.total_evaluations) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-foreground">Drafts Pending Review</span>
                  <span className="text-primary font-mono">
                    {metrics.tentative_count} submissions
                  </span>
                </div>
                <Progress
                  value={
                    metrics.total_evaluations > 0
                      ? (metrics.tentative_count / metrics.total_evaluations) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-border shadow-xs">
          <CardContent className="p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Evaluation Integrity Standards</span>
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Assess enforces consistent application of instructor-defined rubrics across all
              coursework submissions:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <Card className="border-border bg-muted/20 shadow-none">
                <CardContent className="p-3 text-xs">
                  <span className="font-semibold text-foreground block mb-1">Human Approval</span>
                  <p className="text-muted-foreground">
                    All grades remain drafts until explicitly authorized by faculty.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border bg-muted/20 shadow-none">
                <CardContent className="p-3 text-xs">
                  <span className="font-semibold text-foreground block mb-1">
                    Evidence Citations
                  </span>
                  <p className="text-muted-foreground">
                    Every score observation links directly to line numbers.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border bg-muted/20 shadow-none">
                <CardContent className="p-3 text-xs">
                  <span className="font-semibold text-foreground block mb-1">Audit Snapshots</span>
                  <p className="text-muted-foreground">
                    Any instructor override reason is preserved in audit logs.
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Evaluations Table */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Recent Evaluations</h2>
        <DataTable
          columns={columns}
          data={metrics.recent_evaluations}
          emptyMessage="No evaluation records logged yet."
        />
      </div>
    </div>
  )
}
