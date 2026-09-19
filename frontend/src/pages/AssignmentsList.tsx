import React, {useState, useMemo} from 'react'
import {useQuery} from '@tanstack/react-query'
import {Link} from '@tanstack/react-router'
import {ColumnDef} from '@tanstack/react-table'
import {getAssignments} from '../api/client'
import {Assignment} from '../types'
import {useAuth} from '../context/AuthContext'
import {DataTable} from '../components/DataTable'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Badge} from '@/components/ui/badge'
import {BookOpen, PlusCircle, ArrowRight, Loader2, Users, Award, Search} from 'lucide-react'

export const AssignmentsList: React.FC = () => {
  const {role} = useAuth()
  const [searchTerm, setSearchTerm] = useState('')

  const {data: assignments = [], isLoading} = useQuery({
    queryKey: ['assignments'],
    queryFn: getAssignments
  })

  const displayedAssignments = useMemo(() => {
    return assignments.filter(
      asgt =>
        asgt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asgt.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [assignments, searchTerm])

  const columns: ColumnDef<Assignment, unknown>[] = [
    {
      accessorKey: 'title',
      header: 'Assignment Title',
      cell: ({row}) => (
        <div className="py-1">
          <div className="font-semibold text-foreground text-sm">{row.original.title}</div>
          <div className="text-xs text-muted-foreground line-clamp-1 max-w-md mt-0.5">
            {row.original.description}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'allowed_types',
      header: 'Allowed Formats',
      cell: ({row}) => (
        <div className="flex gap-1.5 flex-wrap">
          {row.original.allowed_types.split(',').map((ext: string) => (
            <Badge key={ext} variant="secondary" className="font-mono text-[11px] px-2 py-0.5">
              .{ext.trim()}
            </Badge>
          ))}
        </div>
      )
    },
    {
      accessorKey: 'criteria_count',
      header: 'Rubric Criteria',
      cell: ({row}) => (
        <Badge variant="outline" className="gap-1.5 text-xs font-medium py-1">
          <Award className="w-3.5 h-3.5 text-primary" />
          {row.original.criteria_count} Criteria
        </Badge>
      )
    },
    {
      accessorKey: 'submission_count',
      header: role === 'student' ? 'My Submission' : 'Submissions',
      cell: ({row}) => {
        if (role === 'student') {
          const status = row.original.student_submission_status
          if (status === 'finalized') {
            return (
              <Badge
                variant="outline"
                className="text-xs text-green-700 bg-green-50 border-green-200"
              >
                Grade Released
              </Badge>
            )
          }
          if (status === 'tentative' || status === 'submitted' || status === 'evaluating') {
            return (
              <Badge variant="secondary" className="text-xs">
                Submitted
              </Badge>
            )
          }
          return (
            <Badge variant="outline" className="text-xs text-muted-foreground font-normal">
              Not Submitted
            </Badge>
          )
        }
        return (
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{row.original.submission_count}</span>
          </div>
        )
      }
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({row}) => {
        const asgt = row.original
        if (role === 'professor' || role === 'admin') {
          return (
            <Button asChild size="sm" variant="default">
              <Link
                to="/assignments/$assignmentId"
                params={{assignmentId: String(asgt.id)}}
                className="gap-1.5"
              >
                Manage & Grade
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          )
        }
        if (asgt.student_submission_id) {
          return (
            <Button asChild size="sm" variant="outline">
              <Link
                to={
                  asgt.student_submission_status === 'finalized'
                    ? '/feedback/$submissionId'
                    : '/my-submissions'
                }
                params={{submissionId: String(asgt.student_submission_id)}}
                className="gap-1.5"
              >
                {asgt.student_submission_status === 'finalized'
                  ? 'View Feedback'
                  : 'View Submission'}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          )
        }
        return (
          <Button asChild size="sm" variant="default">
            <Link
              to="/submit/$assignmentId"
              params={{assignmentId: String(asgt.id)}}
              className="gap-1.5"
            >
              Submit Work
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        )
      }
    }
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm">Loading assignments...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-primary" />
            {role === 'professor' ? 'My Courses' : 'Course Assignments'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {role === 'professor'
              ? 'Manage your course assignments, configure rubrics, and review student work.'
              : role === 'admin'
                ? 'Manage all department assignments and academic configurations.'
                : 'View course assignments, check rubric criteria, and submit your work.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs w-48 sm:w-56"
            />
          </div>

          {(role === 'professor' || role === 'admin') && (
            <Button asChild size="sm">
              <Link to="/create-assignment" className="gap-1.5">
                <PlusCircle className="w-4 h-4" />
                <span>New Assignment</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={displayedAssignments}
        emptyMessage={
          searchTerm
            ? 'No assignments matched your search filter.'
            : role === 'professor'
              ? 'You have not created any assignments yet. Click "New Assignment" to publish your first course.'
              : 'No assignments are currently published.'
        }
      />
    </div>
  )
}
