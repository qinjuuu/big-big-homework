"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge, type DisclosureStatus } from "./status-badge"
import {
  ArrowLeft,
  Users,
  Search,
  FileCheck,
  XCircle,
  Clock,
  FileText,
  Image,
  Music,
  Video,
  Download,
  Eye,
  ChevronRight,
  Send,
} from "lucide-react"
import { getActivities, getCases } from "@/lib/api"

interface SourceDetailProps {
  sourceId: string
  onBack: () => void
  onAssign: () => void
  onNavigate?: (page: string) => void
}

const emptyDetail: {
  id: string
  code: string
  clientName: string
  applicantName: string
  patentTitle: string
  sourceType: string
  patentType: string
  applicationMethod: string
  status: DisclosureStatus
  isSigned: boolean
  manager: string
  engineer: string
  techField: string
  consultPurpose: string
  plannedDate: string
  createdAt: string
  materials: Array<{ id: number; name: string; type: string; size: string }>
  aiResult: {
    status: string
    completedAt: string
    suggestion: string
    noveltyScore: number
    summary: string
    relatedPatents: Array<{ id: number; title: string; similarity: string }>
  }
  assignRecords: Array<{ id: number; manager: string; engineer: string; taskType: string; assignedAt: string; deadline: string }>
  statusHistory: Array<{ id: number; status: string; time: string; operator: string }>
  operationLogs: Array<{ id: number; action: string; operator: string; time: string; detail?: string }>
} = {
  id: "",
  code: "",
  clientName: "-",
  applicantName: "-",
  patentTitle: "-",
  sourceType: "-",
  patentType: "-",
  applicationMethod: "-",
  status: "checking",
  isSigned: false,
  manager: "-",
  engineer: "-",
  techField: "-",
  consultPurpose: "-",
  plannedDate: "-",
  createdAt: "-",
  materials: [],
  aiResult: {
    status: "pending",
    completedAt: "-",
    suggestion: "-",
    noveltyScore: 0,
    summary: "暂无 AI 初检结果",
    relatedPatents: [],
  },
  assignRecords: [],
  statusHistory: [],
  operationLogs: [],
}

const getFileIcon = (type: string) => {
  switch (type) {
    case "document":
      return FileText
    case "image":
      return Image
    case "audio":
      return Music
    case "video":
      return Video
    default:
      return FileText
  }
}

export function SourceDetail({ sourceId, onBack, onAssign, onNavigate }: SourceDetailProps) {
  const [detail, setDetail] = useState(emptyDetail)

  useEffect(() => {
    Promise.all([
      getCases({ keyword: sourceId, pageSize: 1 }),
      getActivities(20),
    ]).then(([caseData, activities]) => {
      const item = caseData.list[0]
      if (!item) return
      const relatedLogs = activities.filter((activity) => activity.case_id === item.case_id)
      setDetail({
        ...emptyDetail,
        id: item.case_id,
        code: item.case_id,
        clientName: item.client_name || "-",
        applicantName: item.client_name || "-",
        patentTitle: item.case_name || "-",
        sourceType: item.source_type === "presale" ? "售前咨询" : "客服立案",
        patentType: item.patent_type || "-",
        applicationMethod: item.source_type === "presale" ? "售前咨询" : "普通申请",
        status: item.m05_status === "completed" ? "filed" : item.m05_status === "rejected" ? "not-filed" : "checking",
        isSigned: item.m05_status === "filing" || item.m05_status === "completed",
        manager: item.sales_person || item.service_rep || "-",
        engineer: item.engineer || "-",
        techField: item.tech_field || "-",
        consultPurpose: item.case_name || "-",
        plannedDate: item.update_time || item.create_time || "-",
        createdAt: item.create_time || "-",
        materials: [
          { id: 1, name: `${item.case_id}-技术交底记录`, type: "document", size: item.tech_field || "系统记录" },
          { id: 2, name: `${item.case_id}-客户信息`, type: "document", size: item.client_name || "系统记录" },
        ],
        aiResult: {
          ...emptyDetail.aiResult,
          completedAt: item.update_time || item.create_time || "-",
          suggestion: item.m05_status === "rejected" ? "不建议申报" : "建议继续处理",
          summary: `${item.case_name || item.case_id}，技术领域：${item.tech_field || "未填写"}。`,
        },
        assignRecords: item.engineer ? [{
          id: 1,
          manager: item.sales_person || item.service_rep || "-",
          engineer: item.engineer,
          taskType: "售前初检",
          assignedAt: item.update_time || item.create_time || "-",
          deadline: item.update_time || item.create_time || "-",
        }] : [],
        statusHistory: relatedLogs.map((log, index) => ({
          id: index + 1,
          status: log.opt_type,
          time: log.opt_time,
          operator: log.opt_user || "系统",
        })),
        operationLogs: relatedLogs.map((log, index) => ({
          id: index + 1,
          action: log.opt_type,
          operator: log.opt_user || "系统",
          time: log.opt_time,
          detail: log.opt_content,
        })),
      })
    }).catch(console.error)
  }, [sourceId])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-[#111827]">
                {detail.patentTitle}
              </h1>
              <StatusBadge status={detail.status} />
            </div>
            <p className="text-sm text-[#6B7280] mt-1">
              来源编号：
              <span className="font-mono text-[#2F80ED]">{detail.code}</span>
              <span className="mx-2">·</span>
              {detail.clientName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={onAssign}
          >
            <Users className="h-4 w-4" />
            分配工程师
          </Button>
          <Button variant="outline" className="gap-2">
            <Search className="h-4 w-4" />
            查看AI初检
          </Button>
          <Button variant="outline" className="gap-2">
            <Clock className="h-4 w-4" />
            标记等待订单
          </Button>
          <Button className="bg-[#2F80ED] hover:bg-[#2F80ED]/90 text-white gap-2">
            <FileCheck className="h-4 w-4" />
            正式立案
          </Button>
          <Button 
            className="bg-[#13A38B] hover:bg-[#13A38B]/90 text-white gap-2"
            onClick={() => onNavigate?.("m06-create-model")}
          >
            <Send className="h-4 w-4" />
            进入M06建模
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 text-[#F5222D] hover:text-[#F5222D] hover:bg-[#FFF1F0]"
            onClick={() => onNavigate?.("m09-scrap-cases")}
          >
            <XCircle className="h-4 w-4" />
            不立案
          </Button>
        </div>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="basic">
        <TabsList className="bg-[#F5F7FA]">
          <TabsTrigger value="basic" className="data-[state=active]:bg-white">
            基础信息
          </TabsTrigger>
          <TabsTrigger value="materials" className="data-[state=active]:bg-white">
            交底材料
          </TabsTrigger>
          <TabsTrigger value="ai-result" className="data-[state=active]:bg-white">
            AI初检结果
          </TabsTrigger>
          <TabsTrigger value="assign" className="data-[state=active]:bg-white">
            分配记录
          </TabsTrigger>
          <TabsTrigger value="status" className="data-[state=active]:bg-white">
            状态流转
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-white">
            操作日志
          </TabsTrigger>
        </TabsList>

        {/* 基础信息 */}
        <TabsContent value="basic" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#111827] border-b border-[#E5EAF2] pb-2">
                    客户信息
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">客户名称</span>
                      <span className="text-[#1F2937]">{detail.clientName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">申请人名称</span>
                      <span className="text-[#1F2937]">{detail.applicantName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">咨询目的</span>
                      <span className="text-[#1F2937]">{detail.consultPurpose}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">技术领域</span>
                      <span className="text-[#1F2937]">{detail.techField}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#111827] border-b border-[#E5EAF2] pb-2">
                    专利信息
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">专利类型</span>
                      <span className="text-[#1F2937]">{detail.patentType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">申请方式</span>
                      <span className="text-[#1F2937]">{detail.applicationMethod}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">是否签单</span>
                      <span className={detail.isSigned ? "text-[#52C41A]" : "text-[#9CA3AF]"}>
                        {detail.isSigned ? "已签单" : "未签单"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">计划受理时间</span>
                      <span className="text-[#1F2937] font-mono">{detail.plannedDate}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#111827] border-b border-[#E5EAF2] pb-2">
                    负责人信息
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">来源类型</span>
                      <span className="text-[#1F2937]">{detail.sourceType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">专利经理</span>
                      <span className="text-[#1F2937]">{detail.manager}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">专利工程师</span>
                      <span className="text-[#1F2937]">{detail.engineer}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">创建时间</span>
                      <span className="text-[#1F2937] font-mono text-xs">{detail.createdAt}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 交底材料 */}
        <TabsContent value="materials" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#111827]">
                已上传材料（{detail.materials.length}）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {detail.materials.map((material) => {
                  const Icon = getFileIcon(material.type)
                  return (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-[#E5EAF2] hover:border-[#2F80ED] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#F5F7FA] flex items-center justify-center">
                          <Icon className="h-5 w-5 text-[#6B7280]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1F2937]">{material.name}</p>
                          <p className="text-xs text-[#9CA3AF]">{material.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI初检结果 */}
        <TabsContent value="ai-result" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-[#111827]">
                    AI检索初稿
                  </CardTitle>
                  <span className="text-xs text-[#9CA3AF]">
                    完成时间：{detail.aiResult.completedAt}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-[#F5F7FA] rounded-lg">
                  <p className="text-sm text-[#1F2937] leading-relaxed">
                    {detail.aiResult.summary}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#111827] mb-3">相关专利</h4>
                  <div className="space-y-2">
                    {detail.aiResult.relatedPatents.map((patent) => (
                      <div
                        key={patent.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-[#E5EAF2] hover:bg-[#F5F7FA] cursor-pointer"
                      >
                        <span className="text-sm text-[#2F80ED]">{patent.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#9CA3AF]">
                            相似度：{patent.similarity}
                          </span>
                          <ChevronRight className="h-4 w-4 text-[#9CA3AF]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-[#111827]">
                  初检结论
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-[#E8F8F5] rounded-lg">
                  <div className="text-3xl font-bold text-[#13A38B]">
                    {detail.aiResult.noveltyScore}
                  </div>
                  <div className="text-sm text-[#13A38B] mt-1">新颖性评分</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#F5F7FA] rounded-lg">
                  <span className="text-sm text-[#6B7280]">申报建议</span>
                  <span className="px-2 py-1 bg-[#E8F8F5] text-[#13A38B] text-xs rounded">
                    {detail.aiResult.suggestion}
                  </span>
                </div>
                <Button className="w-full bg-[#2F80ED] hover:bg-[#2F80ED]/90 text-white">
                  反馈销售/客服
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 分配记录 */}
        <TabsContent value="assign" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#111827]">分配记录</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {detail.assignRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-[#E5EAF2]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#EAF4FF] flex items-center justify-center">
                        <Users className="h-5 w-5 text-[#2F80ED]" />
                      </div>
                      <div>
                        <p className="text-sm text-[#1F2937]">
                          <span className="font-medium">{record.manager}</span>
                          <span className="mx-2 text-[#9CA3AF]">分配给</span>
                          <span className="font-medium">{record.engineer}</span>
                        </p>
                        <p className="text-xs text-[#9CA3AF] mt-1">
                          任务类型：{record.taskType} · 截止时间：{record.deadline}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-[#9CA3AF] font-mono">{record.assignedAt}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 状态流转 */}
        <TabsContent value="status" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#111827]">状态流转</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-8">
                {detail.statusHistory.map((item, index) => (
                  <div key={item.id} className="relative pb-6 last:pb-0">
                    {index < detail.statusHistory.length - 1 && (
                      <div className="absolute left-[-20px] top-3 w-0.5 h-full bg-[#E5EAF2]" />
                    )}
                    <div className="absolute left-[-24px] top-1 w-2 h-2 rounded-full bg-[#2F80ED]" />
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-[#EAF4FF] text-[#2F80ED]">
                          {item.status}
                        </span>
                        <span className="ml-3 text-sm text-[#6B7280]">
                          操作人：{item.operator}
                        </span>
                      </div>
                      <span className="text-xs text-[#9CA3AF] font-mono">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 操作日志 */}
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#111827]">操作日志</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {detail.operationLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between p-3 rounded-lg hover:bg-[#F5F7FA]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#2F80ED] mt-2" />
                      <div>
                        <p className="text-sm text-[#1F2937]">
                          <span className="font-medium">{log.operator}</span>
                          <span className="mx-2 text-[#9CA3AF]">·</span>
                          <span>{log.action}</span>
                        </p>
                        {log.detail && (
                          <p className="text-xs text-[#9CA3AF] mt-1">{log.detail}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-[#9CA3AF] font-mono whitespace-nowrap">
                      {log.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
