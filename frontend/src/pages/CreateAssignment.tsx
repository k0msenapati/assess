import React, {useState} from 'react'
import {useForm} from '@tanstack/react-form'
import {useNavigate} from '@tanstack/react-router'
import {createAssignment} from '../api/client'
import {RubricCriterion} from '../types'
import {Card, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {Badge} from '@/components/ui/badge'
import {Plus, Trash2, BookPlus, AlertCircle, ArrowLeft, Award} from 'lucide-react'

export const CreateAssignment: React.FC = () => {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [criteria, setCriteria] = useState<RubricCriterion[]>([
    {
      name: 'Correctness & Logic',
      description:
        'Accurately satisfies core requirements, handles edge cases, and demonstrates sound computational logic.',
      max_marks: 10,
      weight: 1.0
    },
    {
      name: 'Code Structure & Modularity',
      description:
        'Readable organization, appropriate function decomposition, clean variable naming, and consistent conventions.',
      max_marks: 5,
      weight: 1.0
    },
    {
      name: 'Documentation & Method Comments',
      description:
        'Clear docstrings, explanations for complex blocks, and well-structured presentation.',
      max_marks: 5,
      weight: 1.0
    }
  ])

  const handleAddCriterion = () => {
    setCriteria([
      ...criteria,
      {
        name: '',
        description: '',
        max_marks: 10,
        weight: 1.0
      }
    ])
  }

  const handleRemoveCriterion = (idx: number) => {
    setCriteria(criteria.filter((_, i) => i !== idx))
  }

  const handleCriterionChange = (idx: number, field: keyof RubricCriterion, val: any) => {
    const updated = [...criteria]
    updated[idx] = {...updated[idx], [field]: val}
    setCriteria(updated)
  }

  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      allowed_types: 'py,pdf,java,cpp,c,js,ts,txt',
      max_file_size_mb: 15
    },
    onSubmit: async ({value}) => {
      setError(null)
      if (criteria.length === 0) {
        setError('Please define at least one rubric criterion.')
        return
      }
      for (const c of criteria) {
        if (!c.name.trim() || !c.description.trim()) {
          setError('All rubric criteria require a name and description.')
          return
        }
      }

      setIsSubmitting(true)
      try {
        const asgt = await createAssignment({
          title: value.title,
          description: value.description,
          allowed_types: value.allowed_types,
          max_file_size_mb: Number(value.max_file_size_mb),
          rubric: criteria
        })
        navigate({
          to: '/assignments/$assignmentId',
          params: {assignmentId: String(asgt.id)}
        })
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to create assignment.')
      } finally {
        setIsSubmitting(false)
      }
    }
  })

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
            <span className="text-xs font-semibold text-primary">Assignment Builder</span>
            <h1 className="text-2xl font-bold text-foreground mt-1 flex items-center gap-2">
              <BookPlus className="w-6 h-6 text-primary" />
              Create Assignment & Rubric
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Define assignment instructions and set up criteria used to evaluate student
              submissions.
            </p>
          </div>

          {error && (
            <div className="bg-destructive/15 border border-destructive/30 text-destructive px-3.5 py-2.5 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={e => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="space-y-6"
          >
            {/* Assignment Information */}
            <div className="space-y-4">
              <form.Field
                name="title"
                validators={{
                  onChange: ({value}) => (!value ? 'Assignment title is required' : undefined)
                }}
              >
                {field => (
                  <div className="space-y-1.5">
                    <Label htmlFor="asgt-title" className="text-xs font-semibold">
                      Assignment Title
                    </Label>
                    <Input
                      id="asgt-title"
                      type="text"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={e => field.handleChange(e.target.value)}
                      placeholder="e.g., Lab 3: Binary Search Tree Implementation"
                      className="text-sm"
                    />
                    {field.state.meta.errors ? (
                      <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                    ) : null}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="description"
                validators={{
                  onChange: ({value}) => (!value ? 'Instructions are required' : undefined)
                }}
              >
                {field => (
                  <div className="space-y-1.5">
                    <Label htmlFor="asgt-desc" className="text-xs font-semibold">
                      Instructions & Guidelines
                    </Label>
                    <Textarea
                      id="asgt-desc"
                      rows={4}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={e => field.handleChange(e.target.value)}
                      placeholder="Provide detailed problem statement, expectations, and deliverables..."
                      className="text-sm"
                    />
                    {field.state.meta.errors ? (
                      <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                    ) : null}
                  </div>
                )}
              </form.Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <form.Field name="allowed_types">
                  {field => (
                    <div className="space-y-1.5">
                      <Label htmlFor="asgt-types" className="text-xs font-semibold">
                        Allowed File Extensions
                      </Label>
                      <Input
                        id="asgt-types"
                        type="text"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={e => field.handleChange(e.target.value)}
                        placeholder="py,pdf,java,cpp,txt"
                        className="font-mono text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Comma-separated list (e.g. <code>py, java, cpp, pdf</code>)
                      </p>
                    </div>
                  )}
                </form.Field>

                <form.Field name="max_file_size_mb">
                  {field => (
                    <div className="space-y-1.5">
                      <Label htmlFor="asgt-size" className="text-xs font-semibold">
                        Max Upload Limit (MB)
                      </Label>
                      <Input
                        id="asgt-size"
                        type="number"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={e => field.handleChange(Number(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                  )}
                </form.Field>
              </div>
            </div>

            {/* Rubric Criteria Builder */}
            <div className="pt-6 border-t border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    Rubric Criteria
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Define expectations and point values used to evaluate each submission.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCriterion}
                  className="gap-1.5 self-start"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Criterion</span>
                </Button>
              </div>

              <div className="space-y-3">
                {criteria.map((crit, idx) => (
                  <Card key={idx} className="border-border bg-muted/30 shadow-none p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="text-[11px] font-semibold uppercase tracking-wider"
                      >
                        Criterion #{idx + 1}
                      </Badge>
                      {criteria.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCriterion(idx)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          title="Remove criterion"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-3 space-y-1">
                        <Label className="text-[11px] font-medium">Criterion Name</Label>
                        <Input
                          type="text"
                          value={crit.name}
                          onChange={e => handleCriterionChange(idx, 'name', e.target.value)}
                          placeholder="e.g., Algorithmic Correctness"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium">Max Points</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={crit.max_marks}
                          onChange={e =>
                            handleCriterionChange(idx, 'max_marks', Number(e.target.value))
                          }
                          className="h-8 text-xs font-mono font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium">
                        Grading Expectations & Criteria Notes
                      </Label>
                      <Textarea
                        rows={2}
                        value={crit.description}
                        onChange={e => handleCriterionChange(idx, 'description', e.target.value)}
                        placeholder="Specify what students need to demonstrate to achieve maximum points..."
                        className="text-xs"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Total Points:{' '}
                <Badge variant="secondary" className="font-mono font-semibold ml-1">
                  {criteria.reduce((acc, c) => acc + (c.max_marks || 0), 0)} pts
                </Badge>
              </div>

              <div className="flex gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate({to: '/'})}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Assignment'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
