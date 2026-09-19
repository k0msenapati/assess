import React from 'react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  Navigate,
  useRouterState
} from '@tanstack/react-router'
import {DashboardLayout} from './components/DashboardLayout'
import {useAuth} from './context/AuthContext'
import {Login} from './pages/Login'
import {Register} from './pages/Register'
import {AssignmentsList} from './pages/AssignmentsList'
import {CreateAssignment} from './pages/CreateAssignment'
import {AssignmentDetail} from './pages/AssignmentDetail'
import {SubmitAssignment} from './pages/SubmitAssignment'
import {ReviewEvaluation} from './pages/ReviewEvaluation'
import {StudentFeedbackView} from './pages/StudentFeedbackView'
import {MySubmissions} from './pages/MySubmissions'
import {AnalyticsDashboard} from './pages/AnalyticsDashboard'
import {AdminDashboard} from './pages/AdminDashboard'
import {LandingPage} from './pages/LandingPage'

const RootComponent: React.FC = () => {
  const {token, isLoading} = useAuth()
  const pathname = useRouterState({select: s => s.location.pathname})

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b0f17]">
        <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isLanding = pathname === '/' && !token
  const isAuthPage = pathname === '/login' || pathname === '/register'

  if (isLanding) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 transition-colors duration-150">
        <Outlet />
      </main>
    )
  }

  if (isAuthPage) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 transition-colors duration-150">
        <Outlet />
      </main>
    )
  }

  if (!token) {
    return <Navigate to="/login" />
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}

const rootRoute = createRootRoute({
  component: RootComponent
})

const IndexPage: React.FC = () => {
  const {token, isLoading} = useAuth()
  if (isLoading) return null
  if (!token) return <LandingPage />
  return <AssignmentsList />
}

const CreateAssignmentPage: React.FC = () => {
  const {token, role, isLoading} = useAuth()
  if (isLoading) return null
  if (!token) return <Navigate to="/login" />
  if (role !== 'professor' && role !== 'admin') return <Navigate to="/" />
  return <CreateAssignment />
}

const AnalyticsPage: React.FC = () => {
  const {token, role, isLoading} = useAuth()
  if (isLoading) return null
  if (!token) return <Navigate to="/login" />
  if (role !== 'professor' && role !== 'admin') return <Navigate to="/" />
  return <AnalyticsDashboard />
}

const AdminPage: React.FC = () => {
  const {token, role, isLoading} = useAuth()
  if (isLoading) return null
  if (!token) return <Navigate to="/login" />
  if (role !== 'admin') return <Navigate to="/" />
  return <AdminDashboard />
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: Register
})

const createAssignmentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create-assignment',
  component: CreateAssignmentPage
})

const assignmentDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/assignments/$assignmentId',
  component: AssignmentDetail
})

const submitAssignmentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/submit/$assignmentId',
  component: SubmitAssignment
})

const reviewEvaluationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/review/$submissionId',
  component: ReviewEvaluation
})

const feedbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/feedback/$submissionId',
  component: StudentFeedbackView
})

const mySubmissionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/my-submissions',
  component: MySubmissions
})

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: AnalyticsPage
})

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminPage
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  createAssignmentRoute,
  assignmentDetailRoute,
  submitAssignmentRoute,
  reviewEvaluationRoute,
  feedbackRoute,
  mySubmissionsRoute,
  analyticsRoute,
  adminRoute
])

export const router = createRouter({routeTree})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
