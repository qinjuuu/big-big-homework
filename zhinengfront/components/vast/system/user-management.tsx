"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Key,
  Ban,
  CheckCircle,
  Users,
  UserCheck,
  UserX,
  Clock,
  Download,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type UserItem,
} from "@/lib/api"

interface UserManagementProps {
  onNavigate: (page: string) => void
}

interface DisplayUser {
  id: number
  name: string
  email: string
  phone: string
  department: string
  role: string
  status: "active" | "inactive"
  lastLogin: string
  createdAt: string
}

const departments = [
  "全部部门",
  "专利撰写部",
  "质量管理部",
  "项目管理部",
  "客户服务部",
  "资源管理部",
  "售前部",
  "技术部",
]

const roleOptions = [
  "全部角色",
  "系统管理员",
  "专利经理",
  "专利工程师",
  "质量审核员",
  "客服专员",
  "售前顾问",
  "资源管理员",
]

function mapUser(u: UserItem): DisplayUser {
  return {
    id: u.id,
    name: u.display_name || u.username || "-",
    email: "-",
    phone: "-",
    department: "-",
    role: u.role || "-",
    status: u.status === 1 ? "active" : "inactive",
    lastLogin: "-",
    createdAt: u.create_time
      ? String(u.create_time).slice(0, 10)
      : "-",
  }
}

export function UserManagement({ onNavigate }: UserManagementProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("全部部门")
  const [selectedRole, setSelectedRole] = useState("全部角色")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const [users, setUsers] = useState<DisplayUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 表单状态（创建/编辑）
  const [formUsername, setFormUsername] = useState("")
  const [formDisplayName, setFormDisplayName] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formRole, setFormRole] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await getUsers({})
      setUsers((list || []).map(mapUser))
    } catch (e: any) {
      setError(e?.message || "加载失败")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const resetForm = () => {
    setFormUsername("")
    setFormDisplayName("")
    setFormPassword("")
    setFormRole("")
    setEditingId(null)
  }

  const handleCreate = async () => {
    if (!formUsername || !formDisplayName) return
    setSubmitting(true)
    try {
      await createUser({
        username: formUsername,
        display_name: formDisplayName,
        password: formPassword || undefined,
        role: formRole || undefined,
      })
      setShowCreateDialog(false)
      resetForm()
      await loadUsers()
    } catch (e: any) {
      setError(e?.message || "创建失败")
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (u: DisplayUser) => {
    setEditingId(u.id)
    setFormUsername("")
    setFormDisplayName(u.name === "-" ? "" : u.name)
    setFormPassword("")
    setFormRole(u.role === "-" ? "" : u.role)
    setShowEditDialog(true)
  }

  const handleUpdate = async () => {
    if (editingId == null) return
    setSubmitting(true)
    try {
      await updateUser(editingId, {
        display_name: formDisplayName,
        role: formRole || undefined,
      })
      setShowEditDialog(false)
      resetForm()
      await loadUsers()
    } catch (e: any) {
      setError(e?.message || "更新失败")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (u: DisplayUser) => {
    try {
      await updateUser(u.id, { status: u.status === "active" ? 0 : 1 })
      await loadUsers()
    } catch (e: any) {
      setError(e?.message || "状态更新失败")
    }
  }

  const handleDelete = async (u: DisplayUser) => {
    if (typeof window !== "undefined" && !window.confirm(`确认删除用户 ${u.name} ?`))
      return
    try {
      await deleteUser(u.id)
      await loadUsers()
    } catch (e: any) {
      setError(e?.message || "删除失败")
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.name.includes(searchQuery) ||
      user.email.includes(searchQuery) ||
      user.phone.includes(searchQuery)
    const matchesDept =
      selectedDepartment === "全部部门" ||
      user.department === selectedDepartment
    const matchesRole =
      selectedRole === "全部角色" || user.role === selectedRole
    const matchesStatus =
      selectedStatus === "all" || user.status === selectedStatus
    return matchesSearch && matchesDept && matchesRole && matchesStatus
  })

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status === "inactive").length,
    pending: 0,
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("sys-settings")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-foreground">用户管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理系统用户及角色分配
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            批量导入
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button
            onClick={() => {
              resetForm()
              setShowCreateDialog(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            添加用户
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card
          className={cn(
            "cursor-pointer transition-colors",
            selectedStatus === "all" && "ring-2 ring-blue-500"
          )}
          onClick={() => setSelectedStatus("all")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">全部用户</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "cursor-pointer transition-colors",
            selectedStatus === "active" && "ring-2 ring-green-500"
          )}
          onClick={() => setSelectedStatus("active")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">正常状态</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "cursor-pointer transition-colors",
            selectedStatus === "inactive" && "ring-2 ring-gray-500"
          )}
          onClick={() => setSelectedStatus("inactive")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <UserX className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.inactive}</p>
                <p className="text-sm text-muted-foreground">已停用</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "cursor-pointer transition-colors",
            selectedStatus === "pending" && "ring-2 ring-orange-500"
          )}
          onClick={() => setSelectedStatus("pending")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">待激活</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索姓名、邮箱或手机号..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 用户列表 */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">用户</TableHead>
              <TableHead>部门</TableHead>
              <TableHead>角色</TableHead>
              <TableHead className="text-center">状态</TableHead>
              <TableHead>最后登录</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                  加载中...
                </TableCell>
              </TableRow>
            )}
            {!loading && filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                  暂无数据
                </TableCell>
              </TableRow>
            )}
            {!loading && filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                        {user.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{user.department}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                      user.status === "active" &&
                        "bg-green-100 text-green-700",
                      user.status === "inactive" &&
                        "bg-gray-100 text-gray-700"
                    )}
                  >
                    {user.status === "active" ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        正常
                      </>
                    ) : (
                      <>
                        <Ban className="h-3 w-3" />
                        停用
                      </>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.lastLogin}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.createdAt}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(user)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        编辑信息
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Key className="h-4 w-4 mr-2" />
                        重置密码
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.status === "active" ? (
                        <DropdownMenuItem
                          className="text-orange-600"
                          onClick={() => handleToggleStatus(user)}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          停用账户
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="text-green-600"
                          onClick={() => handleToggleStatus(user)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          启用账户
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(user)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除用户
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* 添加用户弹窗 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>添加用户</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>登录账号</Label>
                <Input
                  placeholder="请输入登录账号"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>姓名</Label>
                <Input
                  placeholder="请输入姓名"
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select value={formRole} onValueChange={setFormRole}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择角色" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.slice(1).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>初始密码</Label>
              <Input
                placeholder="请设置初始密码"
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                用户首次登录后需修改密码
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "提交中..." : "添加用户"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑用户弹窗 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>姓名</Label>
              <Input
                placeholder="请输入姓名"
                value={formDisplayName}
                onChange={(e) => setFormDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select value={formRole} onValueChange={setFormRole}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择角色" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.slice(1).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
