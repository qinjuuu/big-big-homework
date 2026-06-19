"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertCircle, CheckCircle, Clock, TrendingUp, AlertTriangle,
  FileText, BarChart3, Settings, ChevronRight,
} from "lucide-react"
import { getReviews, getActivities, type ReviewItem, type ActivityItem } from "@/lib/api"

interface ReviewDashboardProps {
  onNavigate?: (page: string) => void
}

export function ReviewDashboard({ onNavigate }: ReviewDashboardProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    getReviews({ pageSize: 100 }).then(data => setReviews(data.list)).catch(console.error)
    getActivities(5).then(setActivities).catch(console.error)
  }, [])

  const statusCounts: Record<string, number> = {}
  reviews.forEach(item => { statusCounts[item.m08_status] = (statusCounts[item.m08_status] || 0) + 1 })

  const stats = [
    { label: "待审核", value: statusCounts.pending || 0, colorBg: "bg-[#F5F7FA]", colorText: "text-[#374151]", icon: Clock, page: "m08-task-list" },
    { label: "审核中", value: statusCounts.reviewing || 0, colorBg: "bg-[#EAF4FF]", colorText: "text-[#2F80ED]", icon: TrendingUp, page: "m08-task-list" },
    { label: "已退回", value: statusCounts.rejected || 0, colorBg: "bg-[#FEF2F2]", colorText: "text-[#DC2626]", icon: AlertCircle, page: "m08-task-list" },
    { label: "已通过", value: statusCounts.reviewed || 0, colorBg: "bg-[#F0FDF4]", colorText: "text-[#16A34A]", icon: CheckCircle, page: "m08-task-list" },
    { label: "高风险", value: reviews.filter(r => r.audit_result === "high_risk").length, colorBg: "bg-[#FFF7ED]", colorText: "text-[#EA580C]", icon: AlertTriangle, page: "m08-task-list" },
    { label: "超期", value: reviews.filter(r => r.audit_result === "overdue").length, colorBg: "bg-[#FEF2F2]", colorText: "text-[#DC2626]", icon: AlertCircle, page: "m08-task-list" },
  ]

  const getStatusStyle = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-[#F5F7FA] text-[#374151]", reviewing: "bg-[#EAF4FF] text-[#2F80ED]",
      rejected: "bg-[#FEF2F2] text-[#DC2626]", reviewed: "bg-[#F0FDF4] text-[#16A34A]",
    }
    return map[status] || "bg-[#F5F7FA] text-[#374151]"
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "待审核", reviewing: "审核中", rejected: "已退回", reviewed: "已通过",
    }
    return map[status] || status
  }

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">M08 质量审核工作台</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">强制质量门 — 交底、申请文件、五书全面审核</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-[#374151]"><Settings className="w-4 h-4 mr-1.5" />规则配置</Button>
          <Button variant="outline" size="sm" className="text-[#374151]"><BarChart3 className="w-4 h-4 mr-1.5" />审核报告</Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { label: "审核任务列表", page: "m08-task-list" },
          { label: "审核任务详情", page: "m08-task-detail" },
          { label: "交底书审核", page: "m08-disclosure-review" },
          { label: "审核决策", page: "m08-review-decision" },
        ].map(item => (
          <Button key={item.label} variant="outline" size="sm" className="text-[#374151] text-xs"
            onClick={() => onNavigate?.(item.page)}>{item.label}</Button>
        ))}
      </div>

      <div className="grid grid-cols-6 gap-3">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="cursor-pointer hover:shadow-md transition-shadow border-[#E5E9F0]"
              onClick={() => onNavigate?.(stat.page)}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#9CA3AF]">{stat.label}</p>
                    <p className="text-2xl font-bold text-[#111827] mt-0.5">{stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${stat.colorBg}`}>
                    <Icon className={`w-4 h-4 ${stat.colorText}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2 border-[#E5E9F0]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#111827]">审核任务列表</CardTitle>
              <Button variant="ghost" size="sm" className="text-[#2F80ED] text-xs h-7" onClick={() => onNavigate?.("m08-task-list")}>
                查看全部 <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 h-8">
                <TabsTrigger value="pending" className="text-xs">待审核</TabsTrigger>
                <TabsTrigger value="reviewing" className="text-xs">审核中</TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs">退回复审</TabsTrigger>
                <TabsTrigger value="reviewed" className="text-xs">已通过</TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="mt-3">
                <div className="space-y-2">
                  {reviews.filter(r => r.m08_status === "pending").slice(0, 4).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 border border-[#E5E9F0] rounded-lg hover:bg-[#F5F7FA] cursor-pointer transition-colors"
                      onClick={() => onNavigate?.("m08-task-detail")}>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[#111827] truncate">{task.case_name}</p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">{task.case_id} · {task.create_time}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusStyle(task.m08_status)}`}>
                        {getStatusLabel(task.m08_status)}
                      </span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="reviewing" className="mt-3">
                <div className="space-y-2">
                  {reviews.filter(r => r.m08_status === "reviewing").slice(0, 4).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 border border-[#E5E9F0] rounded-lg hover:bg-[#F5F7FA] cursor-pointer"
                      onClick={() => onNavigate?.("m08-task-detail")}>
                      <p className="font-medium text-sm text-[#111827]">{task.case_name}</p>
                      <span className="text-xs text-[#9CA3AF]">{task.create_time}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="rejected" className="mt-3">
                <div className="space-y-2">
                  {reviews.filter(r => r.m08_status === "rejected").slice(0, 4).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 border border-[#E5E9F0] rounded-lg hover:bg-[#F5F7FA] cursor-pointer"
                      onClick={() => onNavigate?.("m08-task-detail")}>
                      <p className="font-medium text-sm text-[#111827]">{task.case_name}</p>
                      <span className="text-xs text-[#9CA3AF]">{task.create_time}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="reviewed" className="mt-3">
                <div className="space-y-2">
                  {reviews.filter(r => r.m08_status === "reviewed").slice(0, 4).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 border border-[#E5E9F0] rounded-lg hover:bg-[#F5F7FA] cursor-pointer"
                      onClick={() => onNavigate?.("m08-task-detail")}>
                      <p className="font-medium text-sm text-[#111827]">{task.case_name}</p>
                      <span className="text-xs text-[#9CA3AF]">{task.create_time}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-[#E5E9F0]">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-[#111827]">风险提醒</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { type: "审核退回", count: statusCounts.rejected || 0 },
                { type: "AI建议冲突", count: reviews.filter(r => r.ai_advice).length },
                { type: "高风险案例", count: reviews.filter(r => r.audit_result === "high_risk").length },
              ].map(alert => (
                <div key={alert.type} className="p-2.5 rounded-lg cursor-pointer hover:opacity-80 transition-opacity bg-[#F5F7FA]"
                  onClick={() => onNavigate?.("m08-task-list")}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">{alert.type}</p>
                    <span className="text-xs font-bold">{alert.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#E5E9F0]">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-[#111827]">最近动态</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-0">
            {activities.map((act, idx) => (
              <div key={act.id} className={`flex items-center justify-between py-2.5 ${idx < activities.length - 1 ? "border-b border-[#F3F4F6]" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2F80ED]" />
                  <div>
                    <p className="text-sm text-[#111827]">
                      <span className="font-medium">{act.opt_type}</span>
                      <span className="text-[#9CA3AF] mx-1">·</span>
                      <span className="text-[#9CA3AF]">{act.case_name || act.case_id}</span>
                      <span className="text-[#9CA3AF] mx-1">·</span>
                      <span className="text-[#9CA3AF]">{act.opt_user}</span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#9CA3AF]">{act.opt_time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
