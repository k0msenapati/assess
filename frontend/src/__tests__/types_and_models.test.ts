import {describe, it, expect} from 'vitest'
import type {Submission, Evaluation, RubricCriterion} from '../types'

describe('Data Contracts & Rubric Model Tests', () => {
  it('computes total max points from rubric criteria correctly', () => {
    const criteria: RubricCriterion[] = [
      {
        id: 1,
        name: 'Algorithm Correctness',
        description: 'Check recursion invariant',
        max_marks: 10,
        weight: 0.5
      },
      {
        id: 2,
        name: 'Code Modularity',
        description: 'Clean encapsulation',
        max_marks: 5,
        weight: 0.25
      },
      {
        id: 3,
        name: 'Documentation & Citations',
        description: 'Method docstrings',
        max_marks: 5,
        weight: 0.25
      }
    ]

    const totalMaxMarks = criteria.reduce((sum, c) => sum + c.max_marks, 0)
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0)

    expect(totalMaxMarks).toBe(20)
    expect(totalWeight).toBeCloseTo(1.0)
  })

  it('verifies non-autonomous grading rule: tentative vs finalized state', () => {
    const submission: Submission = {
      id: 101,
      assignment_id: 1,
      student_id: 2,
      file_name: 'student_work.py',
      file_type: 'py',
      file_size_bytes: 1024,
      submitted_at: '2026-09-15T10:00:00Z',
      status: 'tentative' // AI Draft evaluated, not yet published
    }

    const evaluation: Evaluation = {
      id: 201,
      submission_id: 101,
      status: 'tentative',
      total_score: 18.5,
      total_max_score: 20.0,
      summary_feedback: 'Draft evaluation pending instructor signoff',
      strengths: ['Recursive logic is sound'],
      improvements: ['Add docstrings'],
      evaluated_at: '2026-09-15T10:05:00Z',
      reviewed_at: null,
      scores: [
        {
          id: 1,
          criterion_id: 1,
          criterion_name: 'Algorithm Correctness',
          criterion_description: 'BST operations handle edge cases',
          max_marks: 10.0,
          tentative_score: 9.0,
          final_score: 9.0,
          feedback: 'Recursive insertion accurately preserves invariant',
          evidence_quotes: ['Line 23-28'],
          deductions: [],
          confidence: 0.95,
          is_overridden: false,
          override_reason: null
        }
      ]
    }

    // Before faculty approval:
    expect(submission.status).toBe('tentative')
    expect(evaluation.status).toBe('tentative')
    expect(evaluation.reviewed_at).toBeNull()
    expect(evaluation.scores[0].is_overridden).toBe(false)

    // Faculty review & override:
    const finalizedEvaluation: Evaluation = {
      ...evaluation,
      status: 'finalized',
      total_score: 19.0,
      reviewed_at: '2026-09-15T10:15:00Z',
      scores: [
        {
          ...evaluation.scores[0],
          final_score: 9.5,
          is_overridden: true,
          override_reason: 'Exceptional recursive clarity. Adjusted by +0.5 pts.'
        }
      ]
    }

    expect(finalizedEvaluation.status).toBe('finalized')
    expect(finalizedEvaluation.total_score).toBe(19.0)
    expect(finalizedEvaluation.reviewed_at).not.toBeNull()
    expect(finalizedEvaluation.scores[0].is_overridden).toBe(true)
    expect(finalizedEvaluation.scores[0].override_reason).toContain('Adjusted by +0.5 pts')
  })

  it('validates citation line range parsing', () => {
    const citation = 'Lines 22-26 in binary_search_tree.py'
    const match = citation.match(/Lines?\s+(\d+)-(\d+)/i)

    expect(match).not.toBeNull()
    if (match) {
      const startLine = parseInt(match[1], 10)
      const endLine = parseInt(match[2], 10)
      expect(startLine).toBe(22)
      expect(endLine).toBe(26)
      expect(endLine).toBeGreaterThanOrEqual(startLine)
    }
  })
})
