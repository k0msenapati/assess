import {describe, it, expect} from 'vitest'

describe('Evaluation & Consistency Metrics Tests', () => {
  it('calculates score percentage and grade classification correctly', () => {
    const computeGrade = (score: number, max: number) => {
      const percentage = (score / max) * 100
      if (percentage >= 90) return {grade: 'A', percentage}
      if (percentage >= 80) return {grade: 'B', percentage}
      if (percentage >= 70) return {grade: 'C', percentage}
      if (percentage >= 60) return {grade: 'D', percentage}
      return {grade: 'F', percentage}
    }

    expect(computeGrade(18, 20)).toEqual({grade: 'A', percentage: 90})
    expect(computeGrade(16.5, 20)).toEqual({grade: 'B', percentage: 82.5})
    expect(computeGrade(14, 20)).toEqual({grade: 'C', percentage: 70})
    expect(computeGrade(10, 20)).toEqual({grade: 'F', percentage: 50})
  })

  it('calculates instructor audit delta correctly', () => {
    const draftScore = 17.5
    const instructorScore = 18.5
    const delta = Number((instructorScore - draftScore).toFixed(2))

    expect(delta).toBe(1.0)
    expect(delta > 0).toBe(true) // Instructor adjusted upward
  })

  it('computes Mean Absolute Error (MAE) for rubric consistency', () => {
    const historicalPairs = [
      {draft: 18.0, instructor: 18.5}, // diff 0.5
      {draft: 14.0, instructor: 14.0}, // diff 0.0
      {draft: 16.5, instructor: 15.5}, // diff 1.0
      {draft: 19.0, instructor: 19.5} // diff 0.5
    ]

    const totalAbsDiff = historicalPairs.reduce(
      (sum, p) => sum + Math.abs(p.draft - p.instructor),
      0
    )
    const mae = totalAbsDiff / historicalPairs.length

    expect(mae).toBe(0.5) // Average divergence is only 0.5 points
    expect(mae).toBeLessThan(1.0) // Within acceptable threshold for rubric consistency
  })
})
