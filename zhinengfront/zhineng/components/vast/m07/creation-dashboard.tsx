"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/vast/status-badge"
import {
  FileText, Edit3, CheckCircle, AlertTriangle, Clock,
  ArrowRight, RotateCcw, Send, AlertCircle, FileCheck,
} from "lucide-react"
import { getWritings, getActivities, type WritingItem, type ActivityItem } from "@/lib/api"

interface CreationDashboardProps {
  onNavigate: (page: string) => void
}

export function CreationDashboard({ onNavigate }: CreationDashboardProps) {
  const [writings, setWritings] = useState<WritingItem[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    getWritings({ pageSize: 100 }).then(data => setWritings(data.list)).catch(console.error)
    getActivities(5).then(setActivities).catch(console.error)
  }, [])

  const statusCounts: Record<string, number> = {}
  writings.forEach(item => { statusCounts[item.m07_status] = (statusCounts[item.m07_status] || 0) + 1 })

  const stats = [
    { label: "待创作", value: statusCounts.draft || 0, icon: FileText, color: "#9CA3AF" },
    { label: "说明书中", value: statusCounts.writing_spec || 0, icon: Edit3, color: "#2F80ED" },
    { label: "权利要求中", value: statusCounts.writing_claims || 0, icon: FileCheck, color: "#06B6D4" },
    { label: "退回修改", value: statusCounts.returned || 0, icon: RotateCcw, color: "#EF4444" },
    { label: "待提交审核", value: statusCounts.pending_review || 0, icon: Send, color: "#10B981" },
  ]

  const risks = [
    { type: "退回修改", count: statusCounts.returned || 0, severity: "error" },
    { type: "AI查重率高", count: writings.filter(w => w.ai_check_rate > 80).length, severity: "warning" },
    { type: "撰写逾期", count: 0, severity: "normal" },
  ]

  const getStatusVariant = (status: string) => {
    const map: Record<string, string> = {
      draft: "initial-review", writing_spec: "presale", writing_claims: "processing",
      pending_review: "filed", returned: "returned",
    }
    return map[status] || "initial-review"
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      draft: "待创作", writing_spec: "说明书撰写中", writing_claims: "权利要求撰写中",
      pending_review: "待提交审核", returned: "退回修改",
    }
    return map[status] || status
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">M07 专利创作平台工作台</h1>
          <p className="text-sm text-[#6B7280] mt-1">管理专利申请文件创作任务</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onNavigate("m07-return")}>
            <RotateCcw className="h-4 w-4 mr-2" />退回修改
          </Button>
          <Button onClick={() => onNavigate("m07-list")}>
            <FileText className="h-4 w-4 mr-2" />进入创作任务
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("m07-list")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                    <Icon className="h-5 w-5" style={{ color: stat.color }} />
                  </div>
                  <span className="text-2xl font-bold text-[#111827]">{stat.value}</span>
                </div>
                <div className="mt-3 text-sm text-[#6B7280]">{stat.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">我的创作任务</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("m07-list")}>
                查看全部<ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {writings.slice(0, 4).map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-[#F9FAFB] hover:bg-[#F3F4F6] cursor-pointer transition-colors"
                  onClick={() => onNavigate("m07-detail")}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#EAF4FF] flex items-center justify-center">
                      <FileText className="h-4 w-4 text-[#2F80ED]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#111827]">{task.case_name}</span>
                      </div>
                      <div className="text-xs text-[#9CA3AF] mt-0.5">{task.patent_type} · {task.create_time}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={getStatusVariant(task.m07_status) as import("@/components/vast/status-badge").DisclosureStatus} label={getStatusLabel(task.m07_status)} />
                    <ArrowRight className="h-4 w-4 text-[#9CA3AF]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />风险提醒
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {risks.map(risk => (
                <div key={risk.type} className="flex items-center justify-between p-3 rounded-lg bg-[#F9FAFB]">
                  <div className="flex items-center gap-2">
                    {risk.severity === "error" ? <AlertCircle className="h-4 w-4 text-red-500" />
                      : risk.severity === "warning" ? <AlertTriangle className="h-4 w-4 text-orange-500" />
                        : <CheckCircle className="h-4 w-4 text-green-500" />}
                    <span className="text-sm text-[#374151]">{risk.type}</span>
                  </div>
                  <span className={`text-sm font-medium ${risk.count > 0 ? risk.severity === "error" ? "text-red-600" : "text-orange-600" : "text-green-600"}`}>
                    {risk.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-medium">快捷入口</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => onNavigate("m07-workspace")}>
                <Edit3 className="h-5 w-5 text-[#2F80ED]" /><span className="text-xs">双文档工作台</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => onNavigate("m07-spec-draft")}>
                <FileText className="h-5 w-5 text-[#8B5CF6]" /><span className="text-xs">说明书初稿</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => onNavigate("m07-claims")}>
                <FileCheck className="h-5 w-5 text-[#06B6D4]" /><span className="text-xs">权利要求撰写</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => onNavigate("m07-review")}>
                <CheckCircle className="h-5 w-5 text-[#10B981]" /><span className="text-xs">全文件复核</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-base font-medium">最近动态</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.map(act => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="text-xs text-[#9CA3AF] w-12 pt-0.5">{act.opt_time?.slice(0, 10)}</div>
                  <div className="w-2 h-2 rounded-full bg-[#2F80ED] mt-1.5" />
                  <div className="flex-1">
                    <span className="text-sm text-[#374151]">{act.opt_type}</span>
                    <span className="text-sm text-[#2F80ED] ml-1">《{act.case_name || act.case_id}》</span>
                    <span className="text-xs text-[#9CA3AF] ml-2">- {act.opt_user}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
