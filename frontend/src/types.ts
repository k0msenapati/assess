export type Role = 'student' | 'professor' | 'admin'

export interface User {
  id: number
  username: string
  email: string
  role: Role
}

export interface AuthResponse {
  access_token: string
  token_type: string
  role: Role
  username: string
  user_id: number
}

export interface RubricCriterion {
  id?: number
  assignment_id?: number
  name: string
  description: string
  max_marks: number
  weight: number
  levels_json?: string
}

export interface Assignment {
  id: number
  title: string
  description: string
  allowed_types: string
  max_file_size_mb: number
  due_date: string | null
  created_by: number
  creator_username?: string
  created_at: string
  criteria_count: number
  submission_count: number
  student_submission_id?: number | null
  student_submission_status?: string | null
  rubric?: RubricCriterion[]
}

export interface Submission {
  id: number
  assignment_id: number
  student_id: number
  student_username?: string
  assignment_title?: string
  file_name: string
  file_type: string
  file_size_bytes: number
  submitted_at: string
  status: 'submitted' | 'evaluating' | 'tentative' | 'finalized' | 'failed'
  evaluation_id?: number | null
  total_score?: number | null
  total_max_score?: number | null
}

export interface CriterionScore {
  id: number
  criterion_id: number
  criterion_name: string
  criterion_description: string
  max_marks: number
  tentative_score: number
  final_score: number
  feedback: string
  evidence_quotes: string[]
  deductions: string[]
  confidence: number
  is_overridden: boolean
  override_reason?: string | null
}

export interface Evaluation {
  id: number
  submission_id: number
  status: 'tentative' | 'finalized' | 'failed'
  current_stage?: string | null
  failed_stage?: string | null
  error_message?: string | null
  processing_duration_seconds?: number | null
  total_score: number
  total_max_score: number
  summary_feedback: string
  strengths: string[]
  improvements: string[]
  evaluated_at: string
  reviewed_at?: string | null
  scores: CriterionScore[]
}

export interface EvaluationHistory {
  id: number
  evaluation_id: number
  submission_id: number
  version: number
  status: string
  total_score: number
  total_max_score: number
  summary_feedback: string
  scores_snapshot: Array<Record<string, any>>
  created_at: string
  created_by?: number | null
  action_note: string
}

export interface EvaluationStatus {
  submission_id: number
  evaluation_id?: number | null
  status: string
  evaluation_status?: string | null
  current_stage?: string | null
  failed_stage?: string | null
  error_message?: string | null
  processing_duration_seconds?: number | null
}

export interface AdminUser {
  id: number
  username: string
  email: string
  role: Role
  created_at: string
}

export interface MetricsData {
  total_evaluations: number
  finalized_count: number
  tentative_count: number
  average_score_pct: number
  rubric_coverage_pct: number
  score_agreement_mae: number
  overridden_criterion_count: number
  retrieval_quality_avg_similarity?: number
  feedback_quality_evidence_pct?: number
  prompt_stability_avg_confidence?: number
  average_processing_duration_seconds?: number
  recent_evaluations: Array<{
    evaluation_id: number
    submission_id: number
    assignment_title: string
    status: string
    total_score: number
    total_max_score: number
    evaluated_at: string
  }>
}
