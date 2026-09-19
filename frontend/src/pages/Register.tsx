import React, {useState} from 'react'
import {useForm} from '@tanstack/react-form'
import {useNavigate, Link} from '@tanstack/react-router'
import {useAuth} from '../context/AuthContext'
import {Role} from '../types'
import {
  FileCheck2,
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  Briefcase
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
import {AnimatedThemeToggler} from '@/components/ui/animated-theme-toggler'

export const Register: React.FC = () => {
  const {register} = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      role: 'student' as Role
    },
    onSubmit: async ({value}) => {
      setError(null)
      setIsSubmitting(true)
      try {
        await register(value.username, value.email, value.password, value.role)
        navigate({to: '/'})
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Registration failed. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    }
  })

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

      {/* Centered Register Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="text-center space-y-2 pb-6">
            <div className="mx-auto w-11 h-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">Create an Account</CardTitle>
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
              <form.Field name="role">
                {field => (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Account Role</Label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <Button
                        type="button"
                        variant={field.state.value === 'student' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => field.handleChange('student')}
                        className="w-full justify-center gap-2"
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>Student</span>
                      </Button>
                      <Button
                        type="button"
                        variant={field.state.value === 'professor' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => field.handleChange('professor')}
                        className="w-full justify-center gap-2"
                      >
                        <Briefcase className="w-4 h-4" />
                        <span>Professor</span>
                      </Button>
                    </div>
                  </div>
                )}
              </form.Field>

              <form.Field
                name="username"
                validators={{
                  onChange: ({value}) => (!value ? 'Username is required' : undefined)
                }}
              >
                {field => (
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-username" className="text-xs font-semibold">
                      Username
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <Input
                        id="reg-username"
                        type="text"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={e => field.handleChange(e.target.value)}
                        placeholder="Choose a username"
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
                name="email"
                validators={{
                  onChange: ({value}) => {
                    if (!value) return 'Email is required'
                    if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format'
                    return undefined
                  }
                }}
              >
                {field => (
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email" className="text-xs font-semibold">
                      Email Address
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                        <Mail className="w-4 h-4" />
                      </div>
                      <Input
                        id="reg-email"
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={e => field.handleChange(e.target.value)}
                        placeholder="you@institution.edu"
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
                  onChange: ({value}) => {
                    if (!value) return 'Password is required'
                    if (value.length < 6) return 'Password must be at least 6 characters'
                    return undefined
                  }
                }}
              >
                {field => (
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-password" className="text-xs font-semibold">
                      Password
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                        <Lock className="w-4 h-4" />
                      </div>
                      <Input
                        id="reg-password"
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
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t border-border pt-4 text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="ml-1 font-semibold text-primary hover:underline">
              Sign in
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
