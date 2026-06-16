'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Search, Filter, Download } from 'lucide-react'
import { getReviews, type ReviewItem } from '@/lib/api'

interface ReviewTaskListProps {
  onNavigate?: (page: string) => void
}

export function ReviewTaskList({ onNavigate }: ReviewTaskListProps) {
  const [status, setStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [tasks, setTasks] = useState<ReviewItem[]>([])
  const [total, setTotal] = useState(0)

  const fetchTasks = useCallback(async () => {
    try {
      const data = await getReviews({ status: status !== 'all' ? status : undefined, keyword: searchTerm || undefined })
      setTasks(data.list)
      setTotal(data.total)
    } catch (err) { console.error("Failed to fetch reviews:", err) }
  }, [status, searchTerm])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = { pending: '待审核', reviewing: '审核中', reviewed: '已审核', rejected: '已退回' }
    return map[s] || s
  }

  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'pending': return 'bg-[#F5F7FA] text-[#374151]'
      case 'reviewing': return 'bg-[#EAF4FF] text-[#2F80ED]'
      case 'rejected': return 'bg-[#FEF2F2] text-[#DC2626]'
      case 'reviewed': return 'bg-[#F0FDF4] text-[#16A34A]'
      default: return 'bg-[#F5F7FA] text-[#374151]'
    }
  }

  return (
    <div className="w-full space-y-4 p-6">
      <div>
        <h1 className="text-xl font-semibold text-[#111827]">审核任务列表</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">集中管理全部审核任务</p>
      </div>

      {/* 筛选区 */}
      <Card className="border-[#E5E9F0]">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-4 h-4" />
              <Input
                placeholder="搜索案件编号或名称"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 border-[#E5E9F0]"
              />
            </div>
            <Select defaultValue="all" onValueChange={setStatus}>
              <SelectTrigger className="w-32 h-9 border-[#E5E9F0]">
                <SelectValue placeholder="审核状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="待审核">待审核</SelectItem>
                <SelectItem value="审核中">审核中</SelectItem>
                <SelectItem value="已退回">已退回</SelectItem>
                <SelectItem value="已通过">已通过</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-32 h-9 border-[#E5E9F0]">
                <SelectValue placeholder="专利类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="发明">发明专利</SelectItem>
                <SelectItem value="实用">实用新型</SelectItem>
                <SelectItem value="外观">外观设计</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-32 h-9 border-[#E5E9F0]">
                <SelectValue placeholder="风险等级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="blocking">阻断</SelectItem>
                <SelectItem value="warning">警告</SelectItem>
                <SelectItem value="safe">安全</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 border-[#E5E9F0] text-[#374151]">
              <Filter className="w-4 h-4 mr-1.5" />更多筛选
            </Button>
            <Button variant="outline" size="sm" className="h-9 border-[#E5E9F0] text-[#374151]">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 任务表格 */}
      <Card className="border-[#E5E9F0]">
        <CardContent className="pt-0 px-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#E5E9F0] bg-[#F9FAFB]">
                <TableHead className="text-xs text-[#9CA3AF] w-16 pl-4">审核编号</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] w-20">案件编号</TableHead>
                <TableHead className="text-xs text-[#9CA3AF]">专利名称</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] w-20">专利类型</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] w-20">申请方式</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] w-20">审核状态</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] w-14 text-center">阻断</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] w-14 text-center">警告</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] w-20">AI相似性</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] w-16">审核人</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] w-20 text-center pr-4">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} className="border-[#F3F4F6] hover:bg-[#F9FAFB] cursor-pointer"
                  onClick={() => onNavigate?.('m08-task-detail')}>
                  <TableCell className="font-mono text-xs text-[#9CA3AF] pl-4">R{String(task.id).padStart(3, '0')}</TableCell>
                  <TableCell className="font-mono text-xs text-[#9CA3AF]">{task.case_id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm text-[#111827]">{task.case_name}</p>
                      <p className="text-xs text-[#9CA3AF]">{task.create_time}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[#374151]">{task.patent_type}</TableCell>
                  <TableCell className="text-sm text-[#374151]">电子申请</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusStyle(task.m08_status)}`}>
                      {getStatusLabel(task.m08_status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {task.audit_result === '驳回修改' && (
                      <span className="text-xs bg-[#FEF2F2] text-[#DC2626] px-1.5 py-0.5 rounded font-semibold">1</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {task.ai_advice && (
                      <span className="text-xs bg-[#FFF7ED] text-[#EA580C] px-1.5 py-0.5 rounded font-semibold">1</span>
                    )}
                  </TableCell>
                  <TableCell><span className="text-sm text-[#6B7280]">-</span></TableCell>
                  <TableCell className="text-sm text-[#374151]">{task.audit_user || '未分配'}</TableCell>
                  <TableCell className="text-center pr-4">
                    <Button variant="ghost" size="sm" className="text-xs text-[#2F80ED] h-7 px-2"
                      onClick={(e) => { e.stopPropagation(); onNavigate?.('m08-task-detail') }}>
                      进入审核
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[#9CA3AF]">共 {total} 条记录</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 border-[#E5E9F0] text-[#374151]">上一页</Button>
          <Button size="sm" className="h-8 bg-[#2F80ED] text-white">1</Button>
          <Button variant="outline" size="sm" className="h-8 border-[#E5E9F0] text-[#374151]">下一页</Button>
        </div>
      </div>
    </div>
  )
}
