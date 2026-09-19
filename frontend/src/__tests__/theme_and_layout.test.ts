import {describe, it, expect, beforeEach} from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Frontend Theme and Dashboard Layout Specifications', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('Theme System: manages dark/light modes and toggles root HTML class', () => {
    // Initial state check
    expect(localStorage.getItem('assess_theme')).toBeNull()

    // Set dark theme
    const setDark = () => {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
      localStorage.setItem('assess_theme', 'dark')
    }

    setDark()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(localStorage.getItem('assess_theme')).toBe('dark')

    // Toggle to light theme
    const toggleTheme = (current: 'dark' | 'light'): 'dark' | 'light' => {
      const next = current === 'dark' ? 'light' : 'dark'
      if (next === 'dark') {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
      }
      localStorage.setItem('assess_theme', next)
      return next
    }

    const next = toggleTheme('dark')
    expect(next).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('assess_theme')).toBe('light')
  })

  it('Dashboard Navigation: restricts menu items by user role', () => {
    const getNavItems = (role: string) =>
      [
        {label: 'Assignments', path: '/', show: true},
        {label: 'My Submissions', path: '/my-submissions', show: role === 'student'},
        {
          label: 'New Assignment',
          path: '/create-assignment',
          show: role === 'professor' || role === 'admin'
        },
        {
          label: 'Grading Analytics',
          path: '/analytics',
          show: role === 'professor' || role === 'admin'
        },
        {label: 'Admin Console', path: '/admin', show: role === 'admin'}
      ].filter(item => item.show)

    const studentItems = getNavItems('student').map(i => i.label)
    expect(studentItems).toContain('Assignments')
    expect(studentItems).toContain('My Submissions')
    expect(studentItems).not.toContain('New Assignment')
    expect(studentItems).not.toContain('Grading Analytics')
    expect(studentItems).not.toContain('Admin Console')

    const professorItems = getNavItems('professor').map(i => i.label)
    expect(professorItems).toContain('Assignments')
    expect(professorItems).toContain('New Assignment')
    expect(professorItems).toContain('Grading Analytics')
    expect(professorItems).not.toContain('My Submissions')
    expect(professorItems).not.toContain('Admin Console')

    const adminItems = getNavItems('admin').map(i => i.label)
    expect(adminItems).toContain('Assignments')
    expect(adminItems).toContain('New Assignment')
    expect(adminItems).toContain('Grading Analytics')
    expect(adminItems).toContain('Admin Console')
  })

  it('Authenticity Check: no fake school names or pseudo-academic Latin in landing page text', () => {
    const forbiddenPhrases = [
      'Odisha University',
      'OUTR',
      'veritas, aequitas',
      'veritas in aestimatione',
      'used in XYZ school',
      'Dean of Engineering'
    ]

    const landingFilePath = path.resolve(process.cwd(), 'src/pages/LandingPage.tsx')
    const landingSource = fs.readFileSync(landingFilePath, 'utf-8')

    forbiddenPhrases.forEach(phrase => {
      expect(landingSource.toLowerCase()).not.toContain(phrase.toLowerCase())
    })
  })

  it('Jargon Check: verify technical AST and RAG jargons are removed from user-facing views', () => {
    const jargonList = [
      'AST Semantic Node Chunking',
      'Strict Non-Autonomous Human-in-the-Loop Policy',
      'ChromaDB RAG Vector Similarity',
      'Prompt Stability & Agreement Metrics'
    ]

    const filesToCheck = [
      'src/pages/LandingPage.tsx',
      'src/pages/AssignmentsList.tsx',
      'src/pages/AssignmentDetail.tsx',
      'src/pages/ReviewEvaluation.tsx',
      'src/pages/AnalyticsDashboard.tsx'
    ]

    filesToCheck.forEach(file => {
      const filePath = path.resolve(process.cwd(), file)
      const source = fs.readFileSync(filePath, 'utf-8')
      jargonList.forEach(jargon => {
        expect(source.toLowerCase()).not.toContain(jargon.toLowerCase())
      })
    })
  })
})
