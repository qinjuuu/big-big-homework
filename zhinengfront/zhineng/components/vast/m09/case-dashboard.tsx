"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import {
  FileText, AlertCircle, Clock, CheckCircle, XCircle,
  TrendingUp, Calendar, User, ChevronRight,
} from "lucide-react"
import { getCases, getDashboard, getActivities, type CaseItem, type DashboardData, type ActivityItem } from "@/lib/api"

interface CaseDashboardProps {
  onNavigate?: (page: string) => void
}

export function CaseDashboard({ onNavigate }: CaseDashboardProps) {
  const [cases, setCases] = useState<CaseItem[]>([])
  const [dash, setDash] = useState<DashboardData | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    getCases({ pageSize: 500 }).then(data => setCases(data.list)).catch(console.error)
    getDashboard().then(setDash).catch(console.error)
    getActivities(4).then(setActivities).catch(console.error)
  }, [])

  const countsByStatus: Record<string, number> = {}
  cases.forEach(item => { countsByStatus[item.case_status] = (countsByStatus[item.case_status] || 0) + 1 })

  const caseStats = [
    { label: "未立案", value: countsByStatus.draft || 0, color: "#9CA3AF", icon: Clock },
    { label: "撰写失败", value: countsByStatus.failed || 0, color: "#EF4444", icon: XCircle },
    { label: "审核未通过", value: countsByStatus.review_rejected || 0, color: "#F97316", icon: AlertCircle },
    { label: "待交案", value: countsByStatus.pending_submit || 0, color: "#3B82F6", icon: FileText },
    { label: "已交案", value: countsByStatus.submitted || 0, color: "#8B5CF6", icon: CheckCircle },
    { label: "授权", value: countsByStatus.authorized || 0, color: "#10B981", icon: CheckCircle },
    { label: "废案", value: countsByStatus.abandoned || 0, color: "#1F2937", icon: XCircle },
  ]

  const chartData = [
    { month: "1月", 未立案: 45, 待交案: 32, 已交案: 120, 授权: 68 },
    { month: "2月", 未立案: 52, 待交案: 45, 已交案: 145, 授权: 85 },
    { month: "3月", 未立案: 48, 待交案: 38, 已交案: 168, 授权: 102 },
    { month: "4月", 未立案: 55, 待交案: 52, 已交案: 182, 授权: 115 },
    { month: "5月", 未立案: 45, 待交案: 67, 已交案: 156, 授权: 89 },
  ]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">案件管理工作台</h1>
          <p className="text-sm text-muted-foreground mt-1">统一管理 VAST 全流程案件状态、归档和知识资产沉淀</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            { label: "待交案列表", page: "m09-waiting-cases" },
            { label: "保护中心状态", page: "m09-protection-center" },
            { label: "国知局状态", page: "m09-national-ip" },
            { label: "废案管理", page: "m09-scrap-cases" },
            { label: "知识资产", page: "m09-knowledge-assets" },
          ].map(item => (
            <Button key={item.page} variant="outline" size="sm" onClick={() => onNavigate?.(item.page)} className="gap-2">
              {item.label}<ChevronRight className="w-4 h-4" />
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-4">
          {caseStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onNavigate?.("m09-all-cases")}>
                <div className="flex items-center justify-between mb-3">
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  <Badge variant="secondary" className="text-xs">{stat.value}</Badge>
                </div>
                <p className="text-sm font-medium text-foreground">{stat.label}</p>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />我的待办
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(dash?.todoItems || []).map(item => (
                <div key={item.id} className="p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer transition-colors"
                  onClick={() => onNavigate?.("m09-case-detail")}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{item.module}</Badge>
                        <span className="text-xs text-muted-foreground">{item.count} 项</span>
                      </div>
                    </div>
                    {item.type === "urgent" && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />风险提醒
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {[
                { id: 1, title: "交案超期", count: cases.filter(c => c.case_status === "pending_submit").length, color: "#EF4444", level: "high" },
                { id: 2, title: "撰写停滞", count: cases.filter(c => c.case_status === "draft").length, color: "#F97316", level: "medium" },
                { id: 3, title: "审核阻塞", count: cases.filter(c => c.case_status === "review_rejected").length, color: "#EF4444", level: "high" },
                { id: 4, title: "废案未处理", count: cases.filter(c => c.case_status === "abandoned").length, color: "#FBBF24", level: "low" },
              ].map(alert => (
                <div key={alert.id} className="p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer transition-colors border-l-4"
                  style={{ borderLeftColor: alert.color }}
                  onClick={() => onNavigate?.("m09-all-cases")}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.count} 个案件</p>
                    </div>
                    <Badge variant={alert.level === "high" ? "destructive" : alert.level === "medium" ? "outline" : "secondary"} className="text-xs">
                      {alert.level === "high" ? "高" : alert.level === "medium" ? "中" : "低"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />案件动态趋势（近5月）
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="未立案" stroke="#9CA3AF" strokeWidth={2} />
              <Line type="monotone" dataKey="待交案" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="已交案" stroke="#8B5CF6" strokeWidth={2} />
              <Line type="monotone" dataKey="授权" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">最近动态</h2>
          <div className="space-y-3">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-start gap-4 pb-3 border-b last:border-b-0">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.opt_user}</span>
                    <span className="text-muted-foreground"> {activity.opt_type} </span>
                    <span className="text-primary">{activity.case_name || activity.case_id}</span>
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{activity.opt_time}</span>
                    <Badge variant="outline" className="text-xs">{activity.opt_module || ""}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
