import React, {useState, useEffect} from 'react'
import {
  adminGetUsers,
  adminUpdateUserRole,
  adminDeleteUser,
  adminGetConfig,
  adminUpdateConfig
} from '../api/client'
import {AdminUser, Role} from '../types'
import {Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Users, Settings, Shield, Trash2, Check, RefreshCw, AlertCircle} from 'lucide-react'

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [configs, setConfigs] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [msg, setMsg] = useState<{text: string; type: 'success' | 'error'} | null>(null)
  const [activeTab, setActiveTab] = useState<string>('users')

  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)

  useEffect(() => {
    let ignore = false
    Promise.all([adminGetUsers(), adminGetConfig()])
      .then(([uList, cfg]) => {
        if (!ignore) {
          setUsers(uList)
          setConfigs(cfg)
        }
      })
      .catch((err: any) => {
        if (!ignore) {
          setMsg({
            text: 'Failed to load admin data: ' + (err.response?.data?.detail || err.message),
            type: 'error'
          })
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [refreshTrigger])

  const handleRefresh = () => {
    setIsLoading(true)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleRoleChange = async (userId: number, newRole: Role) => {
    try {
      await adminUpdateUserRole(userId, newRole)
      setUsers(prev => prev.map(u => (u.id === userId ? {...u, role: newRole} : u)))
      setMsg({text: `Updated user role to ${newRole}`, type: 'success'})
    } catch (err: any) {
      setMsg({
        text: 'Error updating role: ' + (err.response?.data?.detail || err.message),
        type: 'error'
      })
    }
  }

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return
    try {
      await adminDeleteUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      setMsg({text: `User "${username}" deleted`, type: 'success'})
    } catch (err: any) {
      setMsg({
        text: 'Error deleting user: ' + (err.response?.data?.detail || err.message),
        type: 'error'
      })
    }
  }

  const handleConfigSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const updated = await adminUpdateConfig(configs)
      setConfigs(updated)
      setMsg({text: 'System configuration updated successfully', type: 'success'})
    } catch (err: any) {
      setMsg({
        text: 'Error updating configuration: ' + (err.response?.data?.detail || err.message),
        type: 'error'
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-border gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span>Admin Console</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage registered accounts, role permissions, and system parameters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            title="Refresh data"
            className="gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {msg && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between ${
            msg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20'
              : 'bg-destructive/15 text-destructive border border-destructive/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
            <span>{msg.text}</span>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setMsg(null)}
            className="h-auto p-1 text-xs"
          >
            ✕
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-xs text-muted-foreground">
          Loading administration records...
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="users" className="gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5" />
              <span>Users ({users.length})</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-1.5 text-xs">
              <Settings className="w-3.5 h-3.5" />
              <span>Configuration</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card className="border-border shadow-xs overflow-hidden">
              <CardHeader className="px-5 py-3.5 border-b border-border bg-muted/30 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  User Accounts & Role Permissions
                </CardTitle>
                <Badge variant="secondary" className="font-mono text-xs">
                  {users.length} accounts
                </Badge>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(u => (
                      <TableRow key={u.id}>
                        <TableCell className="font-mono text-muted-foreground">#{u.id}</TableCell>
                        <TableCell className="font-medium text-foreground">{u.username}</TableCell>
                        <TableCell className="text-muted-foreground font-mono">{u.email}</TableCell>
                        <TableCell>
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value as Role)}
                            className="bg-background border border-border rounded-md px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                          >
                            <option value="student">Student</option>
                            <option value="professor">Professor</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-[11px]">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            title="Delete User"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <Card className="border-border shadow-xs max-w-3xl">
              <CardHeader className="pb-4 border-b border-border">
                <CardTitle className="text-sm font-semibold text-foreground">
                  System Parameters
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configuration parameters applied to evaluation pipeline and file limits.
                </p>
              </CardHeader>
              <CardContent className="pt-5">
                <form onSubmit={handleConfigSave} className="space-y-4">
                  {Object.keys(configs).map(k => (
                    <div key={k} className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                      <Label className="text-xs font-mono text-foreground font-medium">{k}</Label>
                      <div className="sm:col-span-2">
                        <Input
                          type="text"
                          value={configs[k]}
                          onChange={e => setConfigs({...configs, [k]: e.target.value})}
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-border flex justify-end">
                    <Button type="submit" size="sm" className="gap-1.5">
                      <Check className="w-4 h-4" />
                      <span>Save Configuration</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
