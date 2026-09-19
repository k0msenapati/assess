import React, {useState} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {useParams, Link, useNavigate} from '@tanstack/react-router'
import {ColumnDef} from '@tanstack/react-table'
import {
  getAssignmentDetail,
  getAssignmentSubmissions,
  triggerEvaluation,
  addRubricCriterion,
  deleteRubricCriterion
} from '../api/client'
import {Submission} from '../types'
import {useAuth} from '../context/AuthContext'
import {DataTable} from '../components/DataTable'
import {Card, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Users,
  Award,
  Plus,
  Trash2,
  GraduationCap,
  ShieldCheck
} from 'lucide-react'

export const AssignmentDetail: React.FC = () => {
  const {assignmentId} = useParams({strict: false})
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {role, user} = useAuth()
  const [evaluatingSubId, setEvaluatingSubId] = useState<number | null>(null)

  // New criterion state
  const [showAddCriterion, setShowAddCriterion] = useState(false)
  const [newCritName, setNewCritName] = useState('')
  const [newCritDesc, setNewCritDesc] = useState('')
  const [newCritMax, setNewCritMax] = useState(10)
  const [newCritWeight, setNewCritWeight] = useState(1.0)
  const [isAddingCrit, setIsAddingCrit] = useState(false)

  const {data: assignment, isLoading: isAsgtLoading} = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => getAssignmentDetail(Number(assignmentId)),
    enabled: !!assignmentId
  })

  const {
    data: submissions = [],
    isLoading: isSubsLoading,
    error: subsError
  } = useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: () => getAssignmentSubmissions(Number(assignmentId)),
    enabled: !!assignmentId,
    retry: false
  })

  const handleTriggerEval = async (submissionId: number) => {
    setEvaluatingSubId(submissionId)
    try {
      await triggerEvaluation(submissionId)
      queryClient.invalidateQueries({queryKey: ['submissions', assignmentId]})
    } catch {
      alert('Could not generate draft evaluation. Please check the submission file and try again.')
    } finally {
      setEvaluatingSubId(null)
    }
  }

  const handleAddCriterion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignmentId || !newCritName) return
    setIsAddingCrit(true)
    try {
      await addRubricCriterion(Number(assignmentId), {
        name: newCritName,
        description: newCritDesc,
        max_marks: Number(newCritMax),
        weight: Number(newCritWeight)
      })
      queryClient.invalidateQueries({queryKey: ['assignment', assignmentId]})
      setNewCritName('')
      setNewCritDesc('')
      setShowAddCriterion(false)
    } catch {
      alert('Failed to add rubric criterion.')
    } finally {
      setIsAddingCrit(false)
    }
  }

  const handleDeleteCriterion = async (critId: number) => {
    if (!assignmentId || !confirm('Are you sure you want to remove this rubric criterion?')) return
    try {
      await deleteRubricCriterion(Number(assignmentId), critId)
      queryClient.invalidateQueries({queryKey: ['assignment', assignmentId]})
    } catch {
      alert('Failed to delete rubric criterion.')
    }
  }

  const columns: ColumnDef<Submission>[] = [
    {
      accessorKey: 'student_username',
      header: 'Student',
      cell: ({row}) => (
        <span className="font-medium text-foreground">
          {row.original.student_username || `Student #${row.original.student_id}`}
        </span>
      )
    },
    {
      accessorKey: 'file_name',
      header: 'Submitted File',
      cell: ({row}) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-medium text-foreground">{row.original.file_name}</span>
          <span className="text-[11px] text-muted-foreground">
            ({(row.original.file_size_bytes / 1024).toFixed(1)} KB)
          </span>
        </div>
      )
    },
    {
      accessorKey: 'submitted_at',
      header: 'Submitted',
      cell: ({row}) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.submitted_at).toLocaleDateString()}{' '}
          {new Date(row.original.submitted_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({row}) => {
        const status = row.original.status
        if (status === 'finalized') {
          return (
            <Badge variant="success" className="gap-1 text-xs">
              <CheckCircle2 className="w-3 h-3" />
              Graded & Released
            </Badge>
          )
        }
        if (status === 'tentative') {
          return (
            <Badge variant="info" className="gap-1 text-xs">
              <Clock className="w-3 h-3" />
              Draft Ready
            </Badge>
          )
        }
        if (status === 'evaluating' || evaluatingSubId === row.original.id) {
          return (
            <Badge variant="warning" className="gap-1.5 text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              Analyzing...
            </Badge>
          )
        }
        return (
          <Badge variant="secondary" className="text-xs">
            Awaiting Evaluation
          </Badge>
        )
      }
    },
    {
      accessorKey: 'total_score',
      header: 'Score',
      cell: ({row}) => {
        const score = row.original.total_score
        const maxScore = row.original.total_max_score
        if (score === null || score === undefined) {
          return <span className="text-muted-foreground text-xs italic">Pending</span>
        }
        return (
          <span className="font-semibold font-mono text-foreground">
            {score}{' '}
            <span className="text-xs text-muted-foreground font-normal">/ {maxScore} pts</span>
          </span>
        )
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({row}) => {
        const sub = row.original
        const isEvaluatingThis = evaluatingSubId === sub.id

        if (sub.status === 'submitted') {
          return (
            <Button
              size="sm"
              onClick={() => handleTriggerEval(sub.id)}
              disabled={isEvaluatingThis}
              className="gap-1.5"
            >
              {isEvaluatingThis ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Evaluate
                </>
              )}
            </Button>
          )
        }

        return (
          <Button asChild size="sm" variant={sub.status === 'tentative' ? 'default' : 'secondary'}>
            <Link
              to="/review/$submissionId"
              params={{submissionId: String(sub.id)}}
              className="gap-1.5"
            >
              {sub.status === 'tentative' ? 'Review & Grade' : 'View Feedback'}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        )
      }
    }
  ]

  if (isAsgtLoading || !assignment) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm">Loading assignment details...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({to: '/'})}
        className="gap-2 text-xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Assignments</span>
      </Button>

      {/* Assignment Overview Card */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-6 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-primary">Assignment Overview</span>
              <h1 className="text-2xl font-bold text-foreground mt-1">{assignment.title}</h1>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed whitespace-pre-line">
                {assignment.description}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-xs font-medium">
                <Users className="w-4 h-4 text-primary" />
                {assignment.submission_count ?? submissions.length} Submissions
              </Badge>
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 text-xs font-medium">
                <GraduationCap className="w-4 h-4 text-primary" />
                Instructor:{' '}
                {assignment.creator_username === 'prof_alan'
                  ? 'Prof. Alan Turing'
                  : assignment.creator_username === 'professor'
                    ? 'Dr. Alex Vance'
                    : assignment.creator_username || `Instructor #${assignment.created_by}`}
              </Badge>
            </div>
          </div>

          {/* Rubric Criteria Section */}
          <div className="pt-5 border-t border-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Rubric Criteria ({assignment.rubric?.length || 0})
                </h2>
              </div>
              {(role === 'professor' || role === 'admin') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddCriterion(!showAddCriterion)}
                  className="gap-1 text-xs text-primary"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddCriterion ? 'Cancel' : 'Add Criterion'}</span>
                </Button>
              )}
            </div>

            {/* Add Criterion Form */}
            {showAddCriterion && (
              <form
                onSubmit={handleAddCriterion}
                className="p-4 rounded-xl bg-muted/40 border border-border space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] font-semibold">Criterion Name</Label>
                    <Input
                      type="text"
                      required
                      value={newCritName}
                      onChange={e => setNewCritName(e.target.value)}
                      placeholder="e.g., Code Structure & Efficiency"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Max Marks</Label>
                    <Input
                      type="number"
                      min="1"
                      required
                      value={newCritMax}
                      onChange={e => setNewCritMax(Number(e.target.value))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Weight</Label>
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      required
                      value={newCritWeight}
                      onChange={e => setNewCritWeight(Number(e.target.value))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">
                    Description / Grading Guidelines
                  </Label>
                  <Input
                    type="text"
                    value={newCritDesc}
                    onChange={e => setNewCritDesc(e.target.value)}
                    placeholder="Expected patterns, logic correctness, constraints..."
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={isAddingCrit}>
                    {isAddingCrit ? 'Saving...' : 'Save Criterion'}
                  </Button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {assignment.rubric?.map((c, i) => (
                <Card
                  key={c.id || i}
                  className="border-border bg-card/70 shadow-none text-xs relative group"
                >
                  <CardContent className="p-3.5 space-y-1.5">
                    <div className="flex justify-between items-start font-semibold text-foreground">
                      <span>{c.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {c.max_marks} pts
                        </Badge>
                        {(role === 'professor' || role === 'admin') && c.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCriterion(c.id!)}
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition p-0.5"
                            title="Delete Criterion"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed line-clamp-3">
                      {c.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span>Student Submissions</span>
          </h2>
          <span className="text-xs text-muted-foreground">
            Click &quot;Evaluate&quot; to generate draft marks against rubric criteria
          </span>
        </div>

        {isSubsLoading ? (
          <div className="flex justify-center items-center h-32 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-xs">Loading submissions...</span>
          </div>
        ) : subsError || (role === 'professor' && assignment.created_by !== user?.id) ? (
          <Card className="border-border bg-muted/20">
            <CardContent className="p-6 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-primary mx-auto opacity-70" />
              <h3 className="font-semibold text-foreground text-sm">
                Instructor Restricted Access
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Submissions for this course are managed by{' '}
                <strong className="text-foreground">
                  {assignment.creator_username === 'prof_alan'
                    ? 'Prof. Alan Turing'
                    : assignment.creator_username === 'professor'
                      ? 'Dr. Alex Vance'
                      : assignment.creator_username || 'the course instructor'}
                </strong>
                . Departmental privacy policy restricts student submission grading to the course
                instructor and administrators.
              </p>
            </CardContent>
          </Card>
        ) : (
          <DataTable
            columns={columns}
            data={submissions}
            emptyMessage="No student submissions recorded for this assignment yet."
          />
        )}
      </div>
    </div>
  )
}
