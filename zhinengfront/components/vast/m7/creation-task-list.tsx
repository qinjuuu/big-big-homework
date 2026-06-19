"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Search, Filter, Eye, Edit3, FileCheck, Send, RotateCcw, ChevronLeft, ChevronRight,
} from "lucide-react"
import { getWritings, type WritingItem } from "@/lib/api"

interface CreationTaskListProps {
  onViewDetail: (id: string) => void
}

export function CreationTaskList({ onViewDetail }: CreationTaskListProps) {
  const [tasks, setTasks] = useState<WritingItem[]>([])
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchTasks = useCallback(async () => {
    try {
      const data = await getWritings({ status: statusFilter !== "all" ? statusFilter : undefined, keyword: searchTerm || undefined })
      setTasks(data.list)
      setTotal(data.total)
    } catch (err) { console.error("Failed to fetch writings:", err) }
  }, [statusFilter, searchTerm])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const getStatusVariant = (status: string) => {
    const map: Record<string, string> = { drafting: "processing", reviewing: "waiting-order", submitted: "filed", returned: "returned" }
    return map[status] || "presale"
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = { drafting: "撰写中", reviewing: "复核中", submitted: "已提交", returned: "退回修改" }
    return map[status] || status
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">创作任务列表</h1>
          <p className="text-sm text-[#6B7280] mt-1">管理所有专利创作任务</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input placeholder="搜索案件编号/专利名称" className="pl-9"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="文档状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="drafting">撰写中</SelectItem>
                <SelectItem value="reviewing">复核中</SelectItem>
                <SelectItem value="returned">退回修改</SelectItem>
                <SelectItem value="submitted">已提交</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F9FAFB]">
                <TableHead className="w-32">案件编号</TableHead>
                <TableHead>专利名称</TableHead>
                <TableHead className="w-20">类型</TableHead>
                <TableHead className="w-20">撰写人</TableHead>
                <TableHead className="w-28">状态</TableHead>
                <TableHead className="w-24 text-center">AI占比</TableHead>
                <TableHead className="w-40">更新时间</TableHead>
                <TableHead className="w-28 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} className="hover:bg-[#F9FAFB]">
                  <TableCell className="font-mono text-xs text-[#6B7280]">{task.case_id}</TableCell>
                  <TableCell><span className="text-sm font-medium text-[#111827]">{task.case_name}</span></TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{task.patent_type}</Badge></TableCell>
                  <TableCell className="text-sm text-[#374151]">{task.write_user || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${
                      task.m07_status === 'drafting' ? 'bg-[#EAF4FF] text-[#2F80ED]' :
                      task.m07_status === 'reviewing' ? 'bg-[#FFF7E6] text-[#FAAD14]' :
                      task.m07_status === 'submitted' ? 'bg-[#F0FDF4] text-[#16A34A]' :
                      'bg-[#FEF2F2] text-[#DC2626]'
                    }`}>{getStatusLabel(task.m07_status)}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-sm font-medium ${(task.ai_check_rate || 0) > 80 ? 'text-orange-500' : 'text-green-600'}`}>
                      {task.ai_check_rate ? `${task.ai_check_rate}%` : '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-[#9CA3AF]">{task.create_time}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewDetail(String(task.id))}>
                        <Eye className="h-4 w-4 text-[#6B7280]" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit3 className="h-4 w-4 text-[#2F80ED]" />
                      </Button>
                      {task.m07_status === 'submitted' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Send className="h-4 w-4 text-green-600" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-[#6B7280]">共 {total} 条记录</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled><ChevronLeft className="h-4 w-4" /></Button>
          <span className="px-3 py-1 text-sm bg-[#2F80ED] text-white rounded">1</span>
          <Button variant="outline" size="sm"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  )
}
