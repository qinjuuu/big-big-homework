"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChevronLeft,
  PlayCircle,
  RefreshCw,
  Save,
  Send,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  ArrowRight,
} from "lucide-react"
import { getReviews, type ReviewItem } from "@/lib/api"

interface FullReviewPageProps {
  onBack: () => void
  onSubmit: () => void
  caseId?: string
}

interface ReviewRow {
  id: string
  type: string
  severity: "blocking" | "warning" | "passed"
  description: string
  source: string
  location: string
  status: "pending" | "fixed" | "ignored"
}

interface ReviewStatsView {
  blocking: number
  warning: number
  passed: number
  coverageRate: number | null
  supportRate: number | null
  duplicateRate: number | null
  aiSimilarity: number | null
}

// 将后端 ReviewItem.issues 拆解为 ReviewRow
function buildItems(reviews: ReviewItem[]): ReviewRow[] {
  const rows: ReviewRow[] = []
  reviews.forEach((rv) => {
    if (Array.isArray(rv.issues)) {
      rv.issues.forEach((issue: any, idx: number) => {
        const severity: ReviewRow["severity"] =
          issue.severity === "blocking" || issue.severity === "warning" || issue.severity === "passed"
            ? issue.severity
            : (issue.level === "高" ? "blocking" : issue.level === "中" ? "warning" : "passed")
        rows.push({
          id: `${rv.id}-${idx}`,
          type: issue.type || "审核项",
          severity,
          description: issue.title || issue.desc || "",
          source: issue.module || issue.source || "质检",
          location: issue.location || "-",
          status: (issue.status as ReviewRow["status"]) || "pending",
        })
      })
    }
  })
  return rows
}

function buildStats(reviews: ReviewItem[], items: ReviewRow[]): ReviewStatsView {
  const blocking = items.filter((i) => i.severity === "blocking").length
  const warning = items.filter((i) => i.severity === "warning").length
  const passed = items.filter((i) => i.severity === "passed").length
  // 兼容后端可能附带的指标字段
  const first: any = reviews[0] || {}
  return {
    blocking,
    warning,
    passed,
    coverageRate: first.coverage_rate ?? null,
    supportRate: first.support_rate ?? null,
    duplicateRate: first.duplicate_rate ?? null,
    aiSimilarity: first.ai_similarity ?? null,
  }
}

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case "blocking":
      return (
        <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
          <XCircle className="h-3 w-3" />
          阻断项
        </span>
      )
    case "warning":
      return (
        <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
          <AlertTriangle className="h-3 w-3" />
          警告项
        </span>
      )
    default:
      return (
        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
          <CheckCircle className="h-3 w-3" />
          通过
        </span>
      )
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "fixed":
      return (
        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">已处理</span>
      )
    case "ignored":
      return (
        <span className="text-xs text-[#6B7280] bg-[#F0F3F8] px-2 py-0.5 rounded">已忽略</span>
      )
    default:
      return (
        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">待处理</span>
      )
  }
}

export function FullReviewPage({ onBack, onSubmit, caseId }: FullReviewPageProps) {
  const [isReviewing, setIsReviewing] = useState(false)
  const [items, setItems] = useState<ReviewRow[]>([])
  const [stats, setStats] = useState<ReviewStatsView>({
    blocking: 0,
    warning: 0,
    passed: 0,
    coverageRate: null,
    supportRate: null,
    duplicateRate: null,
    aiSimilarity: null,
  })
  const [caseName, setCaseName] = useState<string>("")

  const load = () => {
    setIsReviewing(true)
    getReviews({ keyword: caseId, pageSize: 50 })
      .then((data) => {
        const reviews = (data?.list || []).filter((r) => !caseId || r.case_id === caseId)
        const rows = buildItems(reviews)
        setItems(rows)
        setStats(buildStats(reviews, rows))
        if (reviews[0]?.case_name) setCaseName(reviews[0].case_name)
      })
      .catch((err) => {
        console.error("加载复核失败:", err)
        setItems([])
        setStats({
          blocking: 0, warning: 0, passed: 0,
          coverageRate: null, supportRate: null, duplicateRate: null, aiSimilarity: null,
        })
      })
      .finally(() => setIsReviewing(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId])

  const hasBlocking = items.some((i) => i.severity === "blocking" && i.status === "pending")
  const headerTitle = caseName || "全文件与交底书复核"
  const headerSub = caseId ? `案件：${caseId}` : "未指定案件"

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F5F7FA]">
      {/* 顶部操作栏 */}
      <div className="h-14 px-4 bg-white border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-sm font-semibold text-[#111827]">{headerTitle}</h1>
            <p className="text-xs text-[#9CA3AF]">{headerSub}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={isReviewing}>
            {isReviewing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                复核中...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                执行全文件复核
              </>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            保存审核锁定版本
          </Button>
          <Button size="sm" disabled={hasBlocking} onClick={onSubmit}>
            <Send className="h-4 w-4 mr-2" />
            提交 M08
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* 复核结果卡片 */}
        <div className="grid grid-cols-7 gap-4">
          <Card className={stats.blocking > 0 ? "border-red-200 bg-red-50" : ""}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.blocking}</div>
              <div className="text-xs text-red-600 mt-1">阻断项</div>
            </CardContent>
          </Card>
          <Card className={stats.warning > 0 ? "border-orange-200 bg-orange-50" : ""}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.warning}</div>
              <div className="text-xs text-orange-600 mt-1">警告项</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
              <div className="text-xs text-green-600 mt-1">通过项</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#2F80ED]">
                {stats.coverageRate != null ? `${stats.coverageRate}%` : "-"}
              </div>
              <div className="text-xs text-[#6B7280] mt-1">交底覆盖率</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#2F80ED]">
                {stats.supportRate != null ? `${stats.supportRate}%` : "-"}
              </div>
              <div className="text-xs text-[#6B7280] mt-1">权利要求支持率</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.duplicateRate != null ? `${stats.duplicateRate}%` : "-"}
              </div>
              <div className="text-xs text-[#6B7280] mt-1">查重率</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.aiSimilarity != null ? `${stats.aiSimilarity}%` : "-"}
              </div>
              <div className="text-xs text-[#6B7280] mt-1">AI相似性</div>
            </CardContent>
          </Card>
        </div>

        {/* 问题列表 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">问题列表</CardTitle>
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <span>共 {items.length} 项</span>
                <span>·</span>
                <span className="text-red-600">阻断 {items.filter((i) => i.severity === "blocking").length}</span>
                <span>·</span>
                <span className="text-orange-600">警告 {items.filter((i) => i.severity === "warning").length}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB]">
                  <TableHead className="w-28">问题类型</TableHead>
                  <TableHead className="w-24">严重级别</TableHead>
                  <TableHead>问题描述</TableHead>
                  <TableHead className="w-24">来源模块</TableHead>
                  <TableHead className="w-40">定位位置</TableHead>
                  <TableHead className="w-24">处理状态</TableHead>
                  <TableHead className="w-28 text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-xs text-[#9CA3AF] py-8">
                      暂无复核问题
                    </TableCell>
                  </TableRow>
                ) : items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-[#F9FAFB]">
                    <TableCell className="text-sm text-[#374151]">{item.type}</TableCell>
                    <TableCell>{getSeverityBadge(item.severity)}</TableCell>
                    <TableCell className="text-sm text-[#374151]">{item.description}</TableCell>
                    <TableCell className="text-xs text-[#6B7280]">{item.source}</TableCell>
                    <TableCell className="text-xs text-[#2F80ED]">{item.location}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4 text-[#6B7280]" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowRight className="h-4 w-4 text-[#2F80ED]" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 阻断提示 */}
        {hasBlocking && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-sm font-medium text-red-800">存在未处理的阻断项</div>
                  <div className="text-xs text-red-600 mt-1">
                    请先处理所有阻断项后才能提交 M08 审核
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
