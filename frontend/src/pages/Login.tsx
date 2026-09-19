import React, {useState} from 'react'
import {useForm} from '@tanstack/react-form'
import {useNavigate, Link} from '@tanstack/react-router'
import {useAuth} from '../context/AuthContext'
import {
  FileCheck2,
  Lock,
  User as UserIcon,
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  ShieldCheck
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Badge} from '@/components/ui/badge'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs'
import {AnimatedThemeToggler} from '@/components/ui/animated-theme-toggler'

export const Login: React.FC = () => {
  const {login} = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    defaultValues: {
      username: '',
      password: ''
    },
    onSubmit: async ({value}) => {
      setError(null)
      setIsSubmitting(true)
      try {
        await login(value.username, value.password)
        navigate({to: '/'})
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Invalid username or password.')
      } finally {
        setIsSubmitting(false)
      }
    }
  })

  const handleDemoLogin = async (demoUsername: string, demoPassword: string = 'password123') => {
    setError(null)
    setIsSubmitting(true)
    form.setFieldValue('username', demoUsername)
    form.setFieldValue('password', demoPassword)
    try {
      await login(demoUsername, demoPassword)
      navigate({to: '/'})
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to sign in with demo account.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-background text-foreground transition-colors duration-150">
      {/* Top Bar with Home Link and Theme Switcher */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-xs">
          <Link to="/">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </Button>
        <AnimatedThemeToggler />
      </div>

      {/* Centered Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <Card className="border-border shadow-sm">
          <CardHeader className="text-center space-y-2 pb-6">
            <div className="mx-auto w-11 h-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">Sign in to Assess</CardTitle>
            <CardDescription className="text-xs">
              Academic rubric evaluation workspace
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
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
              className="space-y-4"
            >
              <form.Field
                name="username"
                validators={{
                  onChange: ({value}) => (!value ? 'Username is required' : undefined)
                }}
              >
                {field => (
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-xs font-semibold">
                      Username
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <Input
                        id="username"
                        type="text"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={e => field.handleChange(e.target.value)}
                        placeholder="Enter your username"
                        className="pl-9 text-sm"
                      />
                    </div>
                    {field.state.meta.errors ? (
                      <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                    ) : null}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="password"
                validators={{
                  onChange: ({value}) => (!value ? 'Password is required' : undefined)
                }}
              >
                {field => (
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold">
                      Password
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                        <Lock className="w-4 h-4" />
                      </div>
                      <Input
                        id="password"
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={e => field.handleChange(e.target.value)}
                        placeholder="••••••••"
                        className="pl-9 text-sm"
                      />
                    </div>
                    {field.state.meta.errors ? (
                      <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                    ) : null}
                  </div>
                )}
              </form.Field>

              <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Demo Accounts Quick-Select */}
            {/* Demo Accounts Quick-Select with Names & Roles */}
            <div className="pt-2">
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground font-medium text-[10px] tracking-wider">
                    Sign in with Demo Account
                  </span>
                </div>
              </div>

              <Tabs defaultValue="professors" className="w-full">
                <TabsList className="grid grid-cols-3 h-8 p-0.5 bg-muted/60 text-xs">
                  <TabsTrigger value="professors" className="text-[11px] py-1 cursor-pointer">
                    Instructors
                  </TabsTrigger>
                  <TabsTrigger value="students" className="text-[11px] py-1 cursor-pointer">
                    Students
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="text-[11px] py-1 cursor-pointer">
                    Admin
                  </TabsTrigger>
                </TabsList>

                {/* Instructors Tab */}
                <TabsContent value="professors" className="space-y-1.5 pt-1.5">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleDemoLogin('prof_alan')}
                    className="w-full p-2.5 rounded-lg border border-border bg-card hover:bg-primary/5 hover:border-primary/50 text-left transition-all group cursor-pointer flex items-center justify-between"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                          <span>Prof. Alan Turing</span>
                          <span className="text-[10px] text-muted-foreground font-mono font-normal">
                            prof_alan
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          Course: CS402 (CPU Scheduler) — 2 submissions
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">
                      Instructor
                    </Badge>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleDemoLogin('professor')}
                    className="w-full p-2.5 rounded-lg border border-border bg-card hover:bg-primary/5 hover:border-primary/50 text-left transition-all group cursor-pointer flex items-center justify-between"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                          <span>Dr. Alex Vance</span>
                          <span className="text-[10px] text-muted-foreground font-mono font-normal">
                            professor
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          Courses: CS301 (AVL Trees) &amp; CS503 (NLP Report)
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">
                      Instructor
                    </Badge>
                  </button>
                </TabsContent>

                {/* Students Tab */}
                <TabsContent value="students" className="space-y-1.5 pt-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleDemoLogin('student_priya')}
                      className="p-2 rounded-lg border border-border bg-card hover:bg-primary/5 hover:border-primary/50 text-left transition-all group cursor-pointer"
                    >
                      <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        Priya Patel
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        student_priya
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 truncate">
                        CS402 (23/25 Tentative)
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleDemoLogin('student_ada')}
                      className="p-2 rounded-lg border border-border bg-card hover:bg-primary/5 hover:border-primary/50 text-left transition-all group cursor-pointer"
                    >
                      <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        Ada Lovelace
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">student_ada</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 truncate">
                        CS301 (19.5/20 Final)
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleDemoLogin('student_rohan')}
                      className="p-2 rounded-lg border border-border bg-card hover:bg-primary/5 hover:border-primary/50 text-left transition-all group cursor-pointer"
                    >
                      <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        Rohan Sharma
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        student_rohan
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 truncate">
                        CS301 (14.5/20 Final)
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleDemoLogin('student')}
                      className="p-2 rounded-lg border border-border bg-card hover:bg-primary/5 hover:border-primary/50 text-left transition-all group cursor-pointer"
                    >
                      <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        Demo Student
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">student</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 truncate">
                        New Submissions
                      </div>
                    </button>
                  </div>
                </TabsContent>

                {/* Admin Tab */}
                <TabsContent value="admin" className="space-y-1.5 pt-1.5">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleDemoLogin('admin')}
                    className="w-full p-2.5 rounded-lg border border-border bg-card hover:bg-primary/5 hover:border-primary/50 text-left transition-all group cursor-pointer flex items-center justify-between"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                          <span>Department Administrator</span>
                          <span className="text-[10px] text-muted-foreground font-mono font-normal">
                            admin
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          Full system control, view all submissions &amp; config
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">
                      Superuser
                    </Badge>
                  </button>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>

          <CardFooter className="justify-center border-t border-border pt-4 text-xs text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="ml-1 font-semibold text-primary hover:underline">
              Create account
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Footer Note */}
      <div className="max-w-md w-full mx-auto text-center text-xs text-muted-foreground pb-2">
        Assess &copy; 2026. Academic Evaluation System.
      </div>
    </div>
  )
}
