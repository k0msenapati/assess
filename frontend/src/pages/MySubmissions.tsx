import React from 'react'
import {useQuery} from '@tanstack/react-query'
import {Link} from '@tanstack/react-router'
import {ColumnDef} from '@tanstack/react-table'
import {getMySubmissions} from '../api/client'
import {Submission} from '../types'
import {DataTable} from '../components/DataTable'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {FileCheck, CheckCircle2, Clock, ArrowRight, Loader2, FileText} from 'lucide-react'

export const MySubmissions: React.FC = () => {
  const {data: submissions = [], isLoading} = useQuery({
    queryKey: ['my_submissions'],
    queryFn: getMySubmissions
  })

  const columns: ColumnDef<Submission, unknown>[] = [
    {
      accessorKey: 'assignment_title',
      header: 'Assignment',
      cell: ({row}) => (
        <span className="font-semibold text-foreground text-sm">
          {row.original.assignment_title || `Assignment #${row.original.assignment_id}`}
        </span>
      )
    },
    {
      accessorKey: 'file_name',
      header: 'Submitted File',
      cell: ({row}) => (
        <div className="flex items-center gap-1.5 font-mono text-xs text-foreground">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{row.original.file_name}</span>
        </div>
      )
    },
    {
      accessorKey: 'submitted_at',
      header: 'Submitted At',
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
        const s = row.original.status
        if (s === 'finalized') {
          return (
            <Badge variant="success" className="gap-1 text-xs">
              <CheckCircle2 className="w-3 h-3" /> Grade Released
            </Badge>
          )
        }
        if (s === 'tentative' || s === 'evaluating') {
          return (
            <Badge variant="info" className="gap-1 text-xs">
              <Clock className="w-3 h-3" /> Under Review
            </Badge>
          )
        }
        return (
          <Badge variant="secondary" className="text-xs">
            Awaiting Review
          </Badge>
        )
      }
    },
    {
      accessorKey: 'total_score',
      header: 'Grade',
      cell: ({row}) => {
        const score = row.original.total_score
        const maxScore = row.original.total_max_score
        if (row.original.status !== 'finalized' || score === null || score === undefined) {
          return <span className="text-muted-foreground text-xs italic">Pending</span>
        }
        return (
          <span className="font-mono font-semibold text-foreground">
            {score}{' '}
            <span className="text-xs text-muted-foreground font-normal">/ {maxScore} pts</span>
          </span>
        )
      }
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({row}) => {
        const sub = row.original
        if (sub.status === 'finalized') {
          return (
            <Button asChild size="sm">
              <Link
                to="/feedback/$submissionId"
                params={{submissionId: String(sub.id)}}
                className="gap-1.5"
              >
                <span>View Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          )
        }
        return <span className="text-xs text-muted-foreground italic">In review</span>
      }
    }
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm">Loading your submissions...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-primary" />
          <span>My Submissions</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Track uploaded assignments and access finalized feedback reports.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={submissions}
        emptyMessage="You have not submitted work for any assignments yet."
      />
    </div>
  )
}
