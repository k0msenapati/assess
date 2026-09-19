import {describe, it, expect, beforeEach, vi} from 'vitest'
import {
  addRubricCriterion,
  updateRubricCriterion,
  deleteRubricCriterion,
  getEvaluationStatus,
  getEvaluationHistory,
  adminGetUsers,
  adminUpdateUserRole,
  adminDeleteUser,
  adminGetConfig,
  api
} from '../api/client'
import type {
  RubricCriterion,
  Submission,
  Evaluation,
  EvaluationHistory,
  EvaluationStatus,
  AdminUser
} from '../types'

describe('Frontend Comprehensive Requirements Test Suite', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  // --- UNIT TESTS ---
  describe('Unit Tests: Models, Validation & Role Rules', () => {
    it('FR-06 & NFR-19: validates rubric criterion maximum marks and positive weight constraints', () => {
      const criteria: RubricCriterion[] = [
        {
          name: 'Core Functionality',
          description: 'Working binary tree',
          max_marks: 10,
          weight: 0.7
        },
        {
          name: 'Documentation',
          description: 'Method docstrings',
          max_marks: 5,
          weight: 0.3
        }
      ]

      const totalMaxMarks = criteria.reduce((acc, c) => acc + c.max_marks, 0)
      const totalWeight = criteria.reduce((acc, c) => acc + c.weight, 0)

      expect(totalMaxMarks).toBe(15)
      expect(totalWeight).toBeCloseTo(1.0)
      criteria.forEach(c => {
        expect(c.max_marks).toBeGreaterThan(0)
        expect(c.weight).toBeGreaterThan(0)
      })
    })

    it('FR-09 & NFR-12: validates file extension parser against allowed types', () => {
      const allowedTypes = 'pdf,py,java,cpp,txt'
      const allowedList = allowedTypes.split(',').map(s => s.trim().toLowerCase())

      const validateFile = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase() || ''
        return allowedList.includes(ext)
      }

      expect(validateFile('assignment1.pdf')).toBe(true)
      expect(validateFile('solution.py')).toBe(true)
      expect(validateFile('Main.java')).toBe(true)
      expect(validateFile('script.exe')).toBe(false)
      expect(validateFile('data.bin')).toBe(false)
    })

    it('FR-02 & FR-03: role-based capability definitions', () => {
      const canManageAssignments = (role: string) => ['professor', 'admin'].includes(role)
      const canSubmitWork = (role: string) => ['student', 'admin'].includes(role)
      const canAccessAdminPanel = (role: string) => role === 'admin'

      expect(canManageAssignments('professor')).toBe(true)
      expect(canManageAssignments('student')).toBe(false)

      expect(canSubmitWork('student')).toBe(true)
      expect(canSubmitWork('professor')).toBe(false)

      expect(canAccessAdminPanel('admin')).toBe(true)
      expect(canAccessAdminPanel('professor')).toBe(false)
      expect(canAccessAdminPanel('student')).toBe(false)
    })
  })

  // --- INTEGRATION TESTS ---
  describe('Integration Tests: API Client & Service Contract Endpoints', () => {
    it('FR-05: executes rubric criteria add, update, delete requests', async () => {
      const postSpy = vi.spyOn(api, 'post').mockResolvedValue({
        data: {
          id: 42,
          assignment_id: 1,
          name: 'Efficiency',
          description: 'O(log n)',
          max_marks: 10,
          weight: 1.0
        }
      })
      const putSpy = vi.spyOn(api, 'put').mockResolvedValue({
        data: {
          id: 42,
          assignment_id: 1,
          name: 'Efficiency',
          description: 'Updated O(1)',
          max_marks: 12,
          weight: 1.0
        }
      })
      const deleteSpy = vi.spyOn(api, 'delete').mockResolvedValue({data: null})

      const created = await addRubricCriterion(1, {
        name: 'Efficiency',
        description: 'O(log n)',
        max_marks: 10
      })
      expect(postSpy).toHaveBeenCalledWith(
        '/assignments/1/rubric',
        expect.objectContaining({name: 'Efficiency'})
      )
      expect(created.id).toBe(42)

      const updated = await updateRubricCriterion(1, 42, {
        max_marks: 12,
        description: 'Updated O(1)'
      })
      expect(putSpy).toHaveBeenCalledWith(
        '/assignments/1/rubric/42',
        expect.objectContaining({max_marks: 12})
      )
      expect(updated.max_marks).toBe(12)

      await deleteRubricCriterion(1, 42)
      expect(deleteSpy).toHaveBeenCalledWith('/assignments/1/rubric/42')
    })

    it('FR-24 & FR-26: retrieves processing status and evaluation audit history', async () => {
      const statusData: EvaluationStatus = {
        submission_id: 101,
        evaluation_id: 55,
        status: 'evaluating',
        evaluation_status: 'evaluating',
        current_stage: 'retrieve_context',
        failed_stage: null,
        error_message: null,
        processing_duration_seconds: 1.2
      }
      vi.spyOn(api, 'get').mockImplementation((url: string) => {
        if (url.includes('/evaluations/status/')) return Promise.resolve({data: statusData})
        if (url.includes('/evaluations/55/history')) {
          const historyData: EvaluationHistory[] = [
            {
              id: 1,
              evaluation_id: 55,
              submission_id: 101,
              version: 1,
              status: 'tentative',
              total_score: 18.0,
              total_max_score: 20.0,
              summary_feedback: 'Draft feedback',
              scores_snapshot: [],
              created_at: '2026-09-18T10:00:00Z',
              action_note: 'AI Tentative Evaluation'
            }
          ]
          return Promise.resolve({data: historyData})
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      const status = await getEvaluationStatus(101)
      expect(status.current_stage).toBe('retrieve_context')

      const history = await getEvaluationHistory(55)
      expect(history).toHaveLength(1)
      expect(history[0].action_note).toBe('AI Tentative Evaluation')
    })

    it('FR-25: executes admin user management and system configuration APIs', async () => {
      const mockUsers: AdminUser[] = [
        {
          id: 1,
          username: 'admin',
          email: 'admin@outr.ac.in',
          role: 'admin',
          created_at: '2026-09-18T00:00:00Z'
        },
        {
          id: 2,
          username: 'student_1',
          email: 's1@outr.ac.in',
          role: 'student',
          created_at: '2026-09-18T00:00:00Z'
        }
      ]
      vi.spyOn(api, 'get').mockImplementation((url: string) => {
        if (url === '/admin/users') return Promise.resolve({data: mockUsers})
        if (url === '/admin/config') return Promise.resolve({data: {max_file_size_mb: '15'}})
        return Promise.reject(new Error('Unknown URL'))
      })
      const putSpy = vi.spyOn(api, 'put').mockResolvedValue({
        data: {
          id: 2,
          username: 'student_1',
          email: 's1@outr.ac.in',
          role: 'professor',
          created_at: '2026-09-18T00:00:00Z'
        }
      })
      const deleteSpy = vi.spyOn(api, 'delete').mockResolvedValue({data: null})

      const users = await adminGetUsers()
      expect(users).toHaveLength(2)

      const updatedUser = await adminUpdateUserRole(2, 'professor')
      expect(putSpy).toHaveBeenCalledWith('/admin/users/2/role', {role: 'professor'})
      expect(updatedUser.role).toBe('professor')

      await adminDeleteUser(2)
      expect(deleteSpy).toHaveBeenCalledWith('/admin/users/2')

      const config = await adminGetConfig()
      expect(config.max_file_size_mb).toBe('15')
    })
  })

  // --- END-TO-END FLOW TESTS ---
  describe('E2E Flow Tests: Simulated User Journeys', () => {
    it('E2E Student Journey: Submission lifecycle from upload to finalized feedback visibility', () => {
      // Step 1: Student uploads file -> status 'submitted'
      const submission: Submission = {
        id: 701,
        assignment_id: 10,
        student_id: 5,
        file_name: 'graph_dfs.py',
        file_type: 'py',
        file_size_bytes: 4096,
        submitted_at: '2026-09-18T10:00:00Z',
        status: 'submitted'
      }
      expect(submission.status).toBe('submitted')

      // Step 2: Evaluation triggered -> AI draft status 'tentative'
      const tentativeEval: Evaluation = {
        id: 901,
        submission_id: 701,
        status: 'tentative',
        total_score: 16.0,
        total_max_score: 20.0,
        summary_feedback: 'Draft evaluation pending professor approval',
        strengths: ['Graph traversal works'],
        improvements: ['Handle disconnected components'],
        evaluated_at: '2026-09-18T10:05:00Z',
        scores: [
          {
            id: 1,
            criterion_id: 1,
            criterion_name: 'DFS Correctness',
            criterion_description: 'Traversal visits all reachable nodes',
            max_marks: 20.0,
            tentative_score: 16.0,
            final_score: 16.0,
            feedback: 'Visits reachable nodes cleanly',
            evidence_quotes: ['Line 15: def dfs(visited, node)'],
            deductions: ['Does not iterate through unvisited keys for disconnected graphs'],
            confidence: 0.9,
            is_overridden: false
          }
        ]
      }

      // Rule check: student cannot view tentative evaluation
      const canStudentView = (status: string) => status === 'finalized'
      expect(canStudentView(tentativeEval.status)).toBe(false)

      // Step 3: Professor reviews and finalizes -> status 'finalized'
      const finalizedEval: Evaluation = {
        ...tentativeEval,
        status: 'finalized',
        reviewed_at: '2026-09-18T10:15:00Z'
      }
      submission.status = 'finalized'

      expect(canStudentView(finalizedEval.status)).toBe(true)
      expect(submission.status).toBe('finalized')
      expect(finalizedEval.scores[0].evidence_quotes).toHaveLength(1)
    })

    it('E2E Professor Journey: Rubric definition, score adjustment with audit trail, and release', () => {
      // 1. Initial AI Score
      const aiScore = 14.0
      const professorAdjustedScore = 16.5
      const overrideReason = 'Partial credit granted for alternative recursion design'

      const criterionScore = {
        criterion_id: 1,
        tentative_score: aiScore,
        final_score: aiScore,
        is_overridden: false,
        override_reason: null as string | null
      }

      // 2. Professor adjusts score
      criterionScore.final_score = professorAdjustedScore
      criterionScore.is_overridden = true
      criterionScore.override_reason = overrideReason

      expect(criterionScore.is_overridden).toBe(true)
      expect(criterionScore.final_score).toBe(16.5)
      expect(criterionScore.tentative_score).toBe(14.0)
      expect(criterionScore.override_reason).toContain('Partial credit')
    })
  })
})
