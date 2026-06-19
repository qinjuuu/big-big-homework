"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge, type DisclosureStatus } from "./status-badge"
import {
  FileText,
  Search,
  Clock,
  FileCheck,
  CheckCircle,
  XCircle,
  Plus,
  Users,
  ArrowRight,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts"
import { getActivities, getCaseStats, getDashboard, type ActivityItem, type DashboardData } from "@/lib/api"

interface StatCardProps {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  trend?: string
}

function StatCard({ title, value, icon: Icon, color, bgColor, trend }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-[#6B7280]">{title}</p>
            <p className="text-2xl font-semibold text-[#111827] mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
              {value}
            </p>
            {trend && <p className="text-xs text-[#52C41A] mt-1">{trend}</p>}
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: bgColor }}
          >
            <span style={{ color }}><Icon className="h-5 w-5" /></span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const chartData: Array<{ name: string; 售前: number; 立案: number }> = []

interface DashboardProps {
  onNavigate: (page: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [m05Counts, setM05Counts] = useState<Record<string, number>>({})

  useEffect(() => {
    getDashboard().then(setDashboard).catch(console.error)
    getActivities(8).then(setActivities).catch(console.error)
    getCaseStats()
      .then((data) => {
        const counts: Record<string, number> = {}
        data.m05Stats.forEach((item) => {
          counts[item.m05_status || "unknown"] = Number(item.count) || 0
        })
        setM05Counts(counts)
      })
      .catch(console.error)
  }, [])

  const stats = [
    { title: "咨询转入", value: m05Counts.assigning || 0, icon: FileText, color: "#2F80ED", bgColor: "#EAF4FF" },
    { title: "待立案", value: m05Counts.filing || 0, icon: Clock, color: "#FAAD14", bgColor: "#FFF7E6" },
    { title: "立案中", value: m05Counts.searching || m05Counts.confirming || 0, icon: Search, color: "#6F4FF2", bgColor: "#F1EDFF" },
    { title: "已立案", value: m05Counts.completed || 0, icon: CheckCircle, color: "#52C41A", bgColor: "#E8F8F5" },
    { title: "待进入M06", value: m05Counts.completed || 0, icon: FileCheck, color: "#00A8C8", bgColor: "#E6F8FB" },
    { title: "不立案归档", value: m05Counts.rejected || 0, icon: XCircle, color: "#9CA3AF", bgColor: "#F5F5F5" },
  ]

  const todoItems = dashboard?.todoItems || []
  const pieData = (dashboard?.statusDistribution || []).map((item, index) => ({
    ...item,
    color: ["#2F80ED", "#FAAD14", "#6F4FF2", "#52C41A", "#9CA3AF"][index % 5],
  }))

  const toStatus = (module: string): DisclosureStatus => {
    if (module === "M06") return "checking"
    if (module === "M09") return "filed"
    return "presale"
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">立案工作台</h1>
          <p className="text-sm text-[#6B7280] mt-1">M05 立案管理中心</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => onNavigate("filing-new")}
            className="bg-[#2F80ED] hover:bg-[#2F80ED]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            新建立案
          </Button>
          <Button
            onClick={() => onNavigate("filing-pending")}
            variant="outline"
            className="border-[#2F80ED] text-[#2F80ED] hover:bg-[#EAF4FF]"
          >
            <Clock className="h-4 w-4 mr-2" />
            待立案
          </Button>
          <Button
            onClick={() => onNavigate("assign")}
            variant="outline"
          >
            <Users className="h-4 w-4 mr-2" />
            待分配
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Todo List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#111827]">我的待办</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todoItems.map((item) => (
              <button
                key={item.id}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#F5F7FA] transition-colors text-left"
              >
                <span className="text-sm text-[#1F2937]">{item.title}</span>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#F0F3F8] text-xs flex items-center justify-center text-[#6B7280]">
                    {item.count}
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#9CA3AF]" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Status Distribution Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#111827]">来源状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#6B7280]">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#111827]">本周趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF2" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <Tooltip />
                  <Bar dataKey="售前" fill="#2F80ED" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="立案" fill="#52C41A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#111827]">最近动态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F5F7FA] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-[#2F80ED]" />
                  <div>
                    <p className="text-sm text-[#1F2937]">
                      <span className="font-medium">{activity.opt_type}</span>
                      <span className="mx-2 text-[#9CA3AF]">·</span>
                      <span>{activity.case_name || activity.case_id}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={toStatus(activity.opt_module)} />
                  <span className="text-xs text-[#9CA3AF]">{activity.opt_time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
