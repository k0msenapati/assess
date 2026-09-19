import React, {useState} from 'react'
import {useQuery} from '@tanstack/react-query'
import {useParams, useNavigate} from '@tanstack/react-router'
import {getAssignmentDetail, uploadSubmission} from '../api/client'
import {Card, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Upload, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Award} from 'lucide-react'

export const SubmitAssignment: React.FC = () => {
  const {assignmentId} = useParams({strict: false})
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const {data: assignment, isLoading} = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => getAssignmentDetail(Number(assignmentId)),
    enabled: !!assignmentId
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file to submit.')
      return
    }

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('assignment_id', String(assignmentId))
    formData.append('file', file)

    try {
      await uploadSubmission(formData)
      navigate({to: '/my-submissions'})
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          'Failed to upload submission. Please verify file type and size.'
      )
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading || !assignment) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm">Loading assignment specifications...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({to: '/'})}
        className="gap-2 text-xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Assignments</span>
      </Button>

      <Card className="border-border shadow-xs">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-xs font-semibold text-primary">Submit Assignment</span>
            <h1 className="text-2xl font-bold text-foreground mt-1">{assignment.title}</h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/40 p-4 rounded-lg border border-border">
              {assignment.description}
            </p>
          </div>

          {/* Evaluation Rubric Expectations */}
          <Card className="border-border bg-muted/20 shadow-none p-5 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Grading Rubric Criteria ({assignment.rubric?.length || 0})
            </h2>
            <p className="text-xs text-muted-foreground">
              Your submission will be evaluated against the following criteria:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {assignment.rubric?.map((c, i) => (
                <Card key={i} className="bg-card p-3.5 border-border shadow-none space-y-1 text-xs">
                  <div className="flex justify-between items-center font-medium text-foreground">
                    <span>{c.name}</span>
                    <Badge variant="secondary" className="font-mono font-semibold">
                      {c.max_marks} pts
                    </Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed line-clamp-2">
                    {c.description}
                  </p>
                </Card>
              ))}
            </div>
          </Card>

          {error && (
            <div className="bg-destructive/15 border border-destructive/30 text-destructive px-3.5 py-2.5 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-2 border-dashed border-border hover:border-primary rounded-xl p-8 text-center transition bg-muted/20">
              <Upload className="mx-auto w-9 h-9 text-muted-foreground" />
              <div className="mt-3">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-xs font-medium text-primary hover:underline">
                    Click to select file
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Allowed formats:{' '}
                  {assignment.allowed_types
                    .split(',')
                    .map(x => `.${x.trim()}`)
                    .join(', ')}{' '}
                  (Max: {assignment.max_file_size_mb} MB)
                </p>
              </div>
              {file && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-foreground rounded-lg text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>{file.name}</span>
                  <span className="text-muted-foreground font-normal">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate({to: '/'})}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!file || isUploading} className="gap-2">
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Submit Work</span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
