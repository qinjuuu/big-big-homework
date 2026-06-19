"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Download, Edit, Send, User, FileText, Calendar, Building } from "lucide-react"
import { getCaseDetail, getActivities, type CaseDetail as CaseDetailData, type ActivityItem } from "@/lib/api"

interface CaseDetailProps {
  caseId: string
  onNavigate: (page: string) => void
}

interface TimelineItem {
  date: string
  action: string
  user: string
  desc: string
}

function calcProgress(status?: string): number {
  switch (status) {
    case "废案":
      return 0
    case "待交案":
      return 30
    case "撰写中":
      return 60
    case "待审核":
      return 90
    case "已交案":
    case "授权":
      return 100
    default:
      return 0
  }
}

function mapLogToTimeline(log: any): TimelineItem {
  return {
    date: log?.opt_time ?? "",
    action: log?.opt_type ?? "",
    user: log?.opt_user ?? "",
    desc: log?.opt_content ?? "",
  }
}

export function CaseDetail({ caseId, onNavigate }: CaseDetailProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [loading, setLoading] = useState(false)
  const [caseInfo, setCaseInfo] = useState<CaseDetailData | null>(null)
  const [timeline, setTimeline] = useState<TimelineItem[]>([])

  useEffect(() => {
    if (!caseId) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const data = await getCaseDetail(caseId)
        if (cancelled) return
        setCaseInfo(data)
        if (Array.isArray(data?.logs) && data.logs.length > 0) {
          setTimeline(data.logs.map(mapLogToTimeline))
        } else {
          try {
            const activities = await getActivities(50)
            if (cancelled) return
            const filtered = (activities || [])
              .filter((a: ActivityItem) => a.case_id === caseId)
              .map(mapLogToTimeline)
            setTimeline(filtered)
          } catch {
            if (!cancelled) setTimeline([])
          }
        }
      } catch (e) {
        if (!cancelled) {
          setCaseInfo(null)
          setTimeline([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [caseId])

  if (!caseId) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>请从列表选择案件</p>
        <Button variant="outline" className="mt-4" onClick={() => onNavigate("m09-all-cases")}>
          返回案件列表
        </Button>
      </div>
    )
  }

  if (loading && !caseInfo) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <p>加载中...</p>
      </div>
    )
  }

  if (!caseInfo) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>未找到案件信息</p>
        <Button variant="outline" className="mt-4" onClick={() => onNavigate("m09-all-cases")}>
          返回案件列表
        </Button>
      </div>
    )
  }

  const progress = calcProgress(caseInfo.case_status)
  const engineer = caseInfo.engineer || "-"
  const manager = caseInfo.sales_person || "-"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("m09-all-cases")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">{caseInfo.case_id}</h1>
              <Badge className="bg-blue-100 text-blue-700">{caseInfo.case_status}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{caseInfo.case_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            导出案件
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            编辑信息
          </Button>
          <Button size="sm" onClick={() => onNavigate("m09-waiting-cases")}>
            <Send className="mr-2 h-4 w-4" />
            提交交案
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">客户名称</p>
                <p className="font-medium">{caseInfo.client_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">专利类型</p>
                <p className="font-medium">{caseInfo.patent_type}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">负责工程师</p>
                <p className="font-medium">{engineer}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">更新时间</p>
                <p className="font-medium">{caseInfo.update_time}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="disclosure">交底书</TabsTrigger>
              <TabsTrigger value="documents">申请文件</TabsTrigger>
              <TabsTrigger value="timeline">流程记录</TabsTrigger>
              <TabsTrigger value="files">附件管理</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="mt-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">案件信息</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">案件编号</span>
                      <span className="font-medium">{caseInfo.case_id}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">客户名称</span>
                      <span className="font-medium">{caseInfo.client_name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">专利名称</span>
                      <span className="font-medium max-w-[300px] text-right">{caseInfo.case_name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">专利类型</span>
                      <span className="font-medium">{caseInfo.patent_type}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">案件状态</span>
                      <Badge className="bg-blue-100 text-blue-700">{caseInfo.case_status}</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium">人员与时间</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">负责工程师</span>
                      <span className="font-medium">{engineer}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">专利经理</span>
                      <span className="font-medium">{manager}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">创建日期</span>
                      <span className="font-medium">{caseInfo.create_time}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">更新日期</span>
                      <span className="font-medium">{caseInfo.update_time}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">撰写进度</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="font-medium">{progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="disclosure" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>交底书内容预览区域</p>
                <Button variant="outline" className="mt-4" onClick={() => onNavigate("m06-model-detail")}>
                  查看完整交底书
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="documents" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>申请文件预览区域（说明书、权利要求书、摘要等）</p>
                <Button variant="outline" className="mt-4" onClick={() => onNavigate("m07-workspace")}>
                  进入创作平台
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="timeline" className="mt-6">
              {timeline.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>暂无流程记录</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {timeline.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                        {index < timeline.length - 1 && <div className="w-px h-full bg-border flex-1 my-1" />}
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.action}</span>
                          <Badge variant="outline">{item.user}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="files" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>附件管理区域</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
