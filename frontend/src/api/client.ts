import axios from 'axios'
import {
  AuthResponse,
  User,
  Assignment,
  Submission,
  Evaluation,
  MetricsData,
  RubricCriterion
} from '../types'

const API_BASE = '/api'

export const api = axios.create({
  baseURL: API_BASE
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('assess_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth
export const registerUser = async (data: any): Promise<AuthResponse> => {
  const res = await api.post('/auth/register', data)
  return res.data
}

export const loginUser = async (formData: FormData): Promise<AuthResponse> => {
  const res = await api.post('/auth/token', formData, {
    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
  })
  return res.data
}

export const getCurrentUser = async (): Promise<User> => {
  const res = await api.get('/auth/me')
  return res.data
}

// Assignments
export const getAssignments = async (): Promise<Assignment[]> => {
  const res = await api.get('/assignments')
  return res.data
}

export const getAssignmentDetail = async (id: number): Promise<Assignment> => {
  const res = await api.get(`/assignments/${id}`)
  return res.data
}

export const createAssignment = async (payload: {
  title: string
  description: string
  allowed_types: string
  max_file_size_mb: number
  due_date?: string | null
  rubric: RubricCriterion[]
}): Promise<Assignment> => {
  const res = await api.post('/assignments', payload)
  return res.data
}

export const deleteAssignment = async (id: number): Promise<void> => {
  await api.delete(`/assignments/${id}`)
}

// Submissions
export const uploadSubmission = async (formData: FormData): Promise<Submission> => {
  const res = await api.post('/submissions', formData, {
    headers: {'Content-Type': 'multipart/form-data'}
  })
  return res.data
}

export const getAssignmentSubmissions = async (assignmentId: number): Promise<Submission[]> => {
  const res = await api.get(`/submissions/assignment/${assignmentId}`)
  return res.data
}

export const getMySubmissions = async (): Promise<Submission[]> => {
  const res = await api.get('/submissions/my')
  return res.data
}

export const getSubmissionContent = async (
  submissionId: number
): Promise<{id: number; file_name: string; file_type: string; content: string}> => {
  const res = await api.get(`/submissions/${submissionId}/content`)
  return res.data
}

// Evaluations
export const triggerEvaluation = async (submissionId: number): Promise<Evaluation> => {
  const res = await api.post(`/evaluations/run/${submissionId}`)
  return res.data
}

export const getEvaluationBySubmission = async (submissionId: number): Promise<Evaluation> => {
  const res = await api.get(`/evaluations/submission/${submissionId}`)
  return res.data
}

export const reviewEvaluation = async (
  evaluationId: number,
  payload: {
    summary_feedback?: string
    overrides: Array<{
      criterion_id: number
      final_score: number
      feedback?: string
      override_reason?: string
    }>
    finalize: boolean
  }
): Promise<Evaluation> => {
  const res = await api.post(`/evaluations/${evaluationId}/review`, payload)
  return res.data
}

// Metrics
export const getEvaluationMetrics = async (): Promise<MetricsData> => {
  const res = await api.get('/metrics')
  return res.data
}

// Rubric Criteria Management (FR-05)
export const addRubricCriterion = async (
  assignmentId: number,
  criterion: {
    name: string
    description: string
    max_marks: number
    weight?: number
    levels_json?: string
  }
): Promise<RubricCriterion> => {
  const res = await api.post(`/assignments/${assignmentId}/rubric`, criterion)
  return res.data
}

export const updateRubricCriterion = async (
  assignmentId: number,
  criterionId: number,
  criterion: Partial<RubricCriterion>
): Promise<RubricCriterion> => {
  const res = await api.put(`/assignments/${assignmentId}/rubric/${criterionId}`, criterion)
  return res.data
}

export const deleteRubricCriterion = async (
  assignmentId: number,
  criterionId: number
): Promise<void> => {
  await api.delete(`/assignments/${assignmentId}/rubric/${criterionId}`)
}

// Evaluation Status & History (FR-24, FR-26)
export const getEvaluationStatus = async (submissionId: number): Promise<any> => {
  const res = await api.get(`/evaluations/status/${submissionId}`)
  return res.data
}

export const getEvaluationHistory = async (evaluationId: number): Promise<any[]> => {
  const res = await api.get(`/evaluations/${evaluationId}/history`)
  return res.data
}

// Admin Management (FR-25)
export const adminGetUsers = async (): Promise<any[]> => {
  const res = await api.get('/admin/users')
  return res.data
}

export const adminUpdateUserRole = async (userId: number, role: string): Promise<any> => {
  const res = await api.put(`/admin/users/${userId}/role`, {role})
  return res.data
}

export const adminDeleteUser = async (userId: number): Promise<void> => {
  await api.delete(`/admin/users/${userId}`)
}

export const adminGetConfig = async (): Promise<Record<string, string>> => {
  const res = await api.get('/admin/config')
  return res.data
}

export const adminUpdateConfig = async (
  configs: Record<string, string>
): Promise<Record<string, string>> => {
  const res = await api.put('/admin/config', {configs})
  return res.data
}
