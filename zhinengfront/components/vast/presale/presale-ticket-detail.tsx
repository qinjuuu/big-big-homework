"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Send,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  User,
  Calendar,
  AlertCircle,
  Edit,
  Paperclip,
  MoreHorizontal,
  ArrowRight,
  Star,
  XCircle,
  RefreshCw,
  Users,
} from "lucide-react"
import { getCaseDetail, getActivities, getUsers, type CaseDetail, type ActivityItem, type UserItem } from "@/lib/api"

interface PresaleTicketDetailProps {
  ticketId?: string
  onBack: () => void
  onNavigate: (page: string) => void
}

interface TicketInfoState {
  id: string
  client: string
  contact: string
  phone: string
  email: string
  type: string
  subject: string
  description: string
  status: string
  priority: string
  salesperson: string
  serviceRep: string
  consultant: string
  createTime: string
  updateTime: string
  expectedTime: string
  source: string
  techField: string
}

const EMPTY_TICKET_INFO: TicketInfoState = {
  id: "-",
  client: "-",
  contact: "-",
  phone: "-",
  email: "-",
  type: "-",
  subject: "-",
  description: "-",
  status: "assigning",
  priority: "-",
  salesperson: "-",
  serviceRep: "-",
  consultant: "-",
  createTime: "-",
  updateTime: "-",
  expectedTime: "-",
  source: "-",
  techField: "-",
}

interface CommunicationItem {
  id: number | string
  type: string
  user: string
  role: string
  content: string
  time: string
  attachments: string[]
}

interface FollowUpItem {
  id: number | string
  type: string
  content: string
  user: string
  time: string
  duration?: string
  status?: string
}

const fb = (v: any) => (v === null || v === undefined || v === "" ? "-" : String(v))

export function PresaleTicketDetail({ ticketId = "", onBack, onNavigate }: PresaleTicketDetailProps) {
  const [activeTab, setActiveTab] = useState("info")
  const [replyContent, setReplyContent] = useState("")
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [showEscalateDialog, setShowEscalateDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)

  const [ticketInfo, setTicketInfo] = useState<TicketInfoState>(EMPTY_TICKET_INFO)
  const [communications, setCommunications] = useState<CommunicationItem[]>([])
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [hasData, setHasData] = useState<boolean>(false)
  const [managerList, setManagerList] = useState<UserItem[]>([])

  useEffect(() => {
    getUsers({ role: "manager" })
      .then((list) => setManagerList(list || []))
      .catch(console.error)
  }, [])

  // 工作流纯 UI 配置（保留 step/label/desc/color），状态由 m05_status 推导
  const baseWorkflowSteps = [
    { step: 1, label: "发起咨询",   desc: "销售/客服发起",       color: "bg-[#2F80ED]" },
    { step: 2, label: "分配工程师", desc: "指定专利工程师",      color: "bg-[#8B5CF6]" },
    { step: 3, label: "检索初检",   desc: "工程师检索专利",      color: "bg-[#F59E0B]" },
    { step: 4, label: "客户确认",   desc: "反馈初检结果",        color: "bg-[#06B6D4]" },
    { step: 5, label: "是否立案",   desc: "客户决策",            color: "bg-[#EF4444]", branch: true },
    { step: 6, label: "正式立案",   desc: "确认生成案件",        color: "bg-[#10B981]" },
    { step: 7, label: "进入M06",    desc: "交底书引擎",          color: "bg-[#1E5EFF]" },
  ] as const

  // 根据 m05_status 推导当前工作流步骤
  const m05ToStepIndex = (m05: string): number => {
    switch (m05) {
      case "assigning":  return 1 // 分配工程师
      case "searching":  return 2 // 检索初检
      case "confirming": return 3 // 客户确认
      case "processing": return 3
      case "filing":     return 4 // 是否立案
      case "completed":  return 5 // 正式立案
      case "rejected":   return 4
      default:           return 0
    }
  }

  const currentStepIdx = m05ToStepIndex(ticketInfo.status)
  const workflow = baseWorkflowSteps.map((s, idx) => {
    let status: "completed" | "current" | "pending"
    if (idx < currentStepIdx) status = "completed"
    else if (idx === currentStepIdx) status = "current"
    else status = "pending"

    let time = "-"
    let user = "-"
    if (idx === 0 && hasData) {
      time = ticketInfo.createTime
      user = `${ticketInfo.serviceRep} / ${ticketInfo.salesperson}`
    } else if (idx === currentStepIdx && hasData) {
      time = ticketInfo.updateTime
      user = ticketInfo.consultant
    }

    return { ...s, status, time, user }
  })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!ticketId) {
        // 无 ticketId 展示空态
        setTicketInfo(EMPTY_TICKET_INFO)
        setCommunications([])
        setFollowUps([])
        setHasData(false)
        return
      }

      setLoading(true)
      try {
        const [detail, activities] = await Promise.all([
          getCaseDetail(ticketId).catch(() => null as CaseDetail | null),
          getActivities(50).catch(() => [] as ActivityItem[]),
        ])

        if (cancelled) return

        if (detail) {
          setTicketInfo({
            id: fb(detail.case_id),
            client: fb(detail.client_name),
            contact: fb((detail as any).contact_person),
            phone: "-",
            email: "-",
            type: fb(detail.patent_type),
            subject: fb(detail.case_name),
            description: fb((detail as any).disclosure?.source_content),
            status: detail.m05_status || "assigning",
            priority: fb((detail as any).priority),
            salesperson: fb(detail.sales_person),
            serviceRep: fb(detail.service_rep),
            consultant: fb(detail.engineer),
            createTime: fb(detail.create_time),
            updateTime: fb(detail.update_time),
            expectedTime: "-",
            source: fb(detail.source_type),
            techField: fb(detail.tech_field),
          })
          setHasData(true)
        } else {
          setTicketInfo(EMPTY_TICKET_INFO)
          setHasData(false)
        }

        // 过滤当前案件的活动日志
        const matched = (activities || []).filter((a) => a.case_id === ticketId)

        // 沟通记录：将活动映射为对话条目
        const comms: CommunicationItem[] = matched.map((a) => ({
          id: a.id,
          type: a.opt_type === "customer_reply" ? "customer" : "reply",
          user: fb(a.opt_user),
          role: fb(a.opt_module),
          content: fb(a.opt_content),
          time: fb(a.opt_time),
          attachments: [],
        }))
        setCommunications(comms)

        // 跟进记录：根据 opt_type 推导跟进类型
        const fups: FollowUpItem[] = matched.map((a) => {
          let type = "note"
          if (a.opt_type?.includes("call") || a.opt_type?.includes("phone")) type = "call"
          else if (a.opt_type?.includes("mail") || a.opt_type?.includes("email")) type = "email"
          else if (a.opt_type?.includes("meeting")) type = "meeting"
          return {
            id: a.id,
            type,
            content: fb(a.opt_content),
            user: fb(a.opt_user),
            time: fb(a.opt_time),
          }
        })
        setFollowUps(fups)
      } catch (e) {
        if (!cancelled) {
          setTicketInfo(EMPTY_TICKET_INFO)
          setCommunications([])
          setFollowUps([])
          setHasData(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [ticketId])

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      assigning:  { label: "待分配", className: "bg-[#FFF7E6] text-[#D46B08] border-[#FFD591]" },
      searching:  { label: "待检索",   className: "bg-[#F0F5FF] text-[#2F54EB] border-[#ADC6FF]" },
      confirming: { label: "待确认",   className: "bg-[#E6F7FF] text-[#1890FF] border-[#91D5FF]" },
      processing: { label: "处理中",       className: "bg-[#E6F7FF] text-[#1890FF] border-[#91D5FF]" },
      filing:     { label: "待立案",   className: "bg-[#E6FFFB] text-[#13C2C2] border-[#87E8DE]" },
      completed:  { label: "已立案",  className: "bg-[#F6FFED] text-[#52C41A] border-[#B7EB8F]" },
      rejected:   { label: "不立案归档",   className: "bg-[#F5F5F5] text-[#8C8C8C] border-[#D9D9D9]" },
    }
    const config = configs[status] || configs.assigning
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  const handleSendReply = () => {
    if (replyContent.trim()) {
      setReplyContent("")
    }
  }

  const safeChar = (s: string) => (s && s !== "-" ? s.charAt(0) : "-")

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
              <h1 className="text-xl font-bold text-[#111827]">{ticketInfo.id || "-"}</h1>
              {getStatusBadge(ticketInfo.status)}
              {ticketInfo.priority === "high" && (
                <Badge variant="outline" className="bg-[#FFF1F0] text-[#CF1322] border-[#FFA39E]">紧急</Badge>
              )}
            </div>
            <p className="text-sm text-[#6B7280] mt-1">{ticketInfo.subject || "-"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowTransferDialog(true)}>
            <RefreshCw className="h-4 w-4" />
            转派
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowEscalateDialog(true)}>
            <Users className="h-4 w-4" />
            升级
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-[#52C41A]" onClick={() => onNavigate("filing-new")}>
            <Send className="h-4 w-4" />
            转立案
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-[#EF4444]" onClick={() => setShowCloseDialog(true)}>
            <XCircle className="h-4 w-4" />
            关闭
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 左侧主内容区 */}
        <div className="col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-[#F3F4F6]">
              <TabsTrigger value="info">基本信息</TabsTrigger>
              <TabsTrigger value="communication">沟通记录</TabsTrigger>
              <TabsTrigger value="followup">跟进记录</TabsTrigger>
              <TabsTrigger value="attachments">附件材料</TabsTrigger>
              <TabsTrigger value="workflow">流程进度</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">咨询详情</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-[#6B7280]">客户名称</Label>
                      <p className="text-sm font-medium">{ticketInfo.client || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-[#6B7280]">联系人</Label>
                      <p className="text-sm font-medium">{ticketInfo.contact || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-[#6B7280]">联系电话</Label>
                      <p className="text-sm font-medium">{ticketInfo.phone || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-[#6B7280]">电子邮箱</Label>
                      <p className="text-sm font-medium">{ticketInfo.email || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-[#6B7280]">咨询类型</Label>
                      <p className="text-sm font-medium">{ticketInfo.type || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-[#6B7280]">技术领域</Label>
                      <p className="text-sm font-medium">{ticketInfo.techField || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-[#6B7280]">来源渠道</Label>
                      <p className="text-sm font-medium">{ticketInfo.source || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-[#6B7280]">期望完成时间</Label>
                      <p className="text-sm font-medium">{ticketInfo.expectedTime || "-"}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <Label className="text-xs text-[#6B7280]">咨询描述</Label>
                    <p className="text-sm mt-2 text-[#374151] leading-relaxed">{ticketInfo.description || "-"}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="communication" className="mt-4 space-y-4">
              {/* 沟通记录列表 */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  {communications.length === 0 ? (
                    <div className="text-center text-sm text-[#9CA3AF] py-8">暂无沟通记录</div>
                  ) : (
                    communications.map((item) => (
                    <div key={item.id} className={`flex gap-3 ${item.type === 'customer' ? 'flex-row-reverse' : ''}`}>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={item.type === 'customer' ? 'bg-[#E6F7FF] text-[#1890FF]' : 'bg-[#F6FFED] text-[#52C41A]'}>
                          {safeChar(item.user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 max-w-[80%] ${item.type === 'customer' ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{item.user || "-"}</span>
                          <span className="text-xs text-[#9CA3AF]">{item.role || "-"}</span>
                          <span className="text-xs text-[#9CA3AF]">{item.time || "-"}</span>
                        </div>
                        <div className={`p-3 rounded-lg text-sm ${item.type === 'customer' ? 'bg-[#E6F7FF] text-[#374151]' : 'bg-[#F3F4F6] text-[#374151]'}`}>
                          {item.content || "-"}
                        </div>
                        {item.attachments.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {item.attachments.map((file, idx) => (
                              <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-[#F9FAFB] rounded text-xs text-[#6B7280]">
                                <Paperclip className="h-3 w-3" />
                                {file}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* 回复输入框 */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Textarea
                      placeholder="输入回复内容..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-1">
                          <Paperclip className="h-4 w-4" />
                          添加附件
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1">
                          <FileText className="h-4 w-4" />
                          插入模板
                        </Button>
                      </div>
                      <Button className="bg-[#2F80ED] gap-1" onClick={handleSendReply}>
                        <Send className="h-4 w-4" />
                        发送回复
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="followup" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">跟进记录</CardTitle>
                  <Button size="sm" className="bg-[#2F80ED] gap-1">
                    <MessageSquare className="h-4 w-4" />
                    添加跟进
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {followUps.length === 0 ? (
                      <div className="text-center text-sm text-[#9CA3AF] py-8">暂无跟进记录</div>
                    ) : (
                      followUps.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-3 bg-[#F9FAFB] rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          item.type === 'call' ? 'bg-[#E6F7FF]' : item.type === 'email' ? 'bg-[#FFF7E6]' : 'bg-[#F6FFED]'
                        }`}>
                          {item.type === 'call' && <Phone className="h-4 w-4 text-[#1890FF]" />}
                          {item.type === 'email' && <Mail className="h-4 w-4 text-[#D46B08]" />}
                          {item.type === 'meeting' && <Calendar className="h-4 w-4 text-[#52C41A]" />}
                          {item.type === 'note' && <MessageSquare className="h-4 w-4 text-[#52C41A]" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.content || "-"}</span>
                            {item.status === 'scheduled' && (
                              <Badge variant="outline" className="bg-[#E6F7FF] text-[#1890FF]">已预约</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-[#6B7280]">
                            <span>{item.user || "-"}</span>
                            <span>·</span>
                            <span>{item.time || "-"}</span>
                            {item.duration && (
                              <>
                                <span>·</span>
                                <span>{item.duration}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachments" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">附件材料</CardTitle>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Paperclip className="h-4 w-4" />
                    上传附件
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-sm text-[#9CA3AF] py-8">暂无附件</div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workflow" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">工单流程</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {workflow.map((step, index) => (
                      <div key={step.step} className="flex items-start gap-4 pb-5 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            step.status === 'completed' ? step.color + ' text-white' :
                            step.status === 'current'   ? step.color + ' text-white ring-2 ring-offset-2 ring-[#06B6D4]' :
                            'bg-[#F3F4F6] text-[#9CA3AF]'
                          }`}>
                            {step.status === 'completed'
                              ? <CheckCircle className="h-4 w-4" />
                              : <span className="text-xs font-bold">{step.step}</span>
                            }
                          </div>
                          {index < workflow.length - 1 && (
                            <div className={`w-0.5 h-full min-h-[28px] mt-1 ${
                              step.status === 'completed' ? 'bg-[#52C41A]' : 'bg-[#E5E7EB]'
                            }`} />
                          )}
                        </div>
                        <div className="flex-1 pt-0.5 pb-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className={`font-semibold text-sm ${
                                step.status === 'current' ? 'text-[#06B6D4]' :
                                step.status === 'completed' ? 'text-[#111827]' : 'text-[#9CA3AF]'
                              }`}>{step.label}</span>
                              {"branch" in step && step.branch && (
                                <span className="ml-2 text-[10px] text-[#EF4444] font-medium bg-[#FFF1F0] px-1.5 py-0.5 rounded">决策节点</span>
                              )}
                            </div>
                            {step.status === 'current' && (
                              <Badge variant="outline" className="bg-[#E6FFFB] text-[#13C2C2] border-[#87E8DE]">当前步骤</Badge>
                            )}
                          </div>
                          <div className="text-xs text-[#6B7280] mt-0.5">{step.desc}</div>
                          {step.time !== '-' && (
                            <div className="text-xs text-[#9CA3AF] mt-0.5">{step.time} · {step.user}</div>
                          )}
                          {"branch" in step && step.branch && step.status === 'pending' && (
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" className="h-7 text-xs bg-[#52C41A] hover:bg-[#52C41A]/90" onClick={() => onNavigate("m05-filing")}>
                                同意立案
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs text-[#EF4444] border-[#FFA39E]" onClick={() => onNavigate("m09-scrap-cases")}>
                                不立案
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* 右侧信息栏 */}
        <div className="space-y-4">
          {/* 负责人信息 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">负责人信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">所属销售</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FEF9C3] flex items-center justify-center text-xs font-bold text-[#CA8A04]">
                    {safeChar(ticketInfo.salesperson)}
                  </div>
                  <span className="text-sm font-medium">{ticketInfo.salesperson || "-"}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">所属客服</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#E0F2FE] flex items-center justify-center text-xs font-bold text-[#0369A1]">
                    {safeChar(ticketInfo.serviceRep)}
                  </div>
                  <span className="text-sm font-medium">{ticketInfo.serviceRep || "-"}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">专利顾问</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#D1FAE5] flex items-center justify-center text-xs font-bold text-[#059669]">
                    {safeChar(ticketInfo.consultant)}
                  </div>
                  <span className="text-sm font-medium">{ticketInfo.consultant || "-"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 时间信息 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">时间信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">创建时间</span>
                <span className="text-sm">{ticketInfo.createTime || "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">最后更新</span>
                <span className="text-sm">{ticketInfo.updateTime || "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">期望完成</span>
                <span className="text-sm text-[#D46B08]">{ticketInfo.expectedTime || "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">响应时长</span>
                <span className="text-sm text-[#52C41A]">-</span>
              </div>
            </CardContent>
          </Card>

          {/* 快捷操作 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                <Phone className="h-4 w-4 text-[#1890FF]" />
                拨打电话
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                <Mail className="h-4 w-4 text-[#D46B08]" />
                发送邮件
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                <Calendar className="h-4 w-4 text-[#52C41A]" />
                预约会议
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                <Star className="h-4 w-4 text-[#FAAD14]" />
                标记重要
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 转派弹窗 */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>转派工单</DialogTitle>
            <DialogDescription>将工单转派给其他同事处理</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>转派给</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="选择接收人" />
                </SelectTrigger>
                <SelectContent>
                  {managerList.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">暂无可选人员</div>
                  )}
                  {managerList.map((u) => (
                    <SelectItem key={u.id} value={u.username}>
                      {u.display_name || u.username}{u.role ? ` - ${u.role}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>转派原因</Label>
              <Textarea placeholder="请说明转派原因..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>取消</Button>
            <Button className="bg-[#2F80ED]" onClick={() => setShowTransferDialog(false)}>确认转派</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 升级弹窗 */}
      <Dialog open={showEscalateDialog} onOpenChange={setShowEscalateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>升级工单</DialogTitle>
            <DialogDescription>将工单升级给上级处理</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>升级给</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="选择上级" />
                </SelectTrigger>
                <SelectContent>
                  {managerList.length === 0 && (
                    <div className="px-3 py-2 text-xs text-[#9CA3AF]">暂无可升级人员</div>
                  )}
                  {managerList.map((u) => (
                    <SelectItem key={u.id} value={u.username}>
                      {u.display_name || u.username} - {u.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>升级原因</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="选择原因" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complex">技术复杂，需专家支持</SelectItem>
                  <SelectItem value="urgent">客户要求紧急处理</SelectItem>
                  <SelectItem value="vip">VIP客户特殊需求</SelectItem>
                  <SelectItem value="other">其他原因</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>详细说明</Label>
              <Textarea placeholder="请详细说明升级原因..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEscalateDialog(false)}>取消</Button>
            <Button className="bg-[#D46B08]" onClick={() => setShowEscalateDialog(false)}>确认升级</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 关闭弹窗 */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>关闭工单</DialogTitle>
            <DialogDescription>确定要关闭此工单吗？</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>关闭原因</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="请选择关闭原因" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">咨询已完成，客户满意</SelectItem>
                  <SelectItem value="no-response">客户长期无响应</SelectItem>
                  <SelectItem value="cancelled">客户主动取消</SelectItem>
                  <SelectItem value="duplicate">重复工单，已合并</SelectItem>
                  <SelectItem value="invalid">无效咨询</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>关闭说明</Label>
              <Textarea placeholder="请填写关闭说明..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>取消</Button>
            <Button variant="destructive" onClick={() => setShowCloseDialog(false)}>确认关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
