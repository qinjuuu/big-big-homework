"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Send,
  XCircle,
  Clock,
  CheckCircle,
  FileText,
  Plus,
  Filter,
} from "lucide-react"
import { getCases, getUsers, updateCaseStatus, type CaseItem, type UserItem } from "@/lib/api"

interface PresaleTicketListProps {
  onNavigate: (page: string) => void
  filterStatus?: string
}

export function PresaleTicketList({ onNavigate, filterStatus }: PresaleTicketListProps) {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [statusFilter, setStatusFilter] = useState(filterStatus || "all")
  const [tickets, setTickets] = useState<CaseItem[]>([])
  const [searchText, setSearchText] = useState("")
  const [salesList, setSalesList] = useState<UserItem[]>([])
  const [serviceList, setServiceList] = useState<UserItem[]>([])
  const [salesFilter, setSalesFilter] = useState<string>("all")
  const [serviceFilter, setServiceFilter] = useState<string>("all")

  useEffect(() => {
    Promise.all([getUsers({ role: "sales" }), getUsers({ role: "service" })])
      .then(([sales, services]) => {
        setSalesList(sales || [])
        setServiceList(services || [])
      })
      .catch(console.error)
  }, [])

  const fetchTickets = async () => {
    try {
      const data = await getCases({
        m05_status: statusFilter !== "all" ? statusFilter : undefined,
        keyword: searchText || undefined,
        pageSize: 100,
      })
      setTickets(data.list)
    } catch (err) {
      console.error("获取咨询工单失败：", err)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [statusFilter])

  const filteredTickets = useMemo(() => tickets.filter((ticket) => {
    if (!searchText) return true
    return ticket.case_id.includes(searchText) || ticket.client_name?.includes(searchText) || ticket.case_name?.includes(searchText)
  }), [tickets, searchText])

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      assigning:        { label: "待分配", className: "bg-[#FFF7E6] text-[#D46B08] border-[#FFD591]" },
      searching:        { label: "待检索",   className: "bg-[#F0F5FF] text-[#2F54EB] border-[#ADC6FF]" },
      confirming:       { label: "待确认",   className: "bg-[#E6F7FF] text-[#1890FF] border-[#91D5FF]" },
      filing:           { label: "等待立案", className: "bg-[#E6FFFB] text-[#13C2C2] border-[#87E8DE]" },
      completed:        { label: "已立案", className: "bg-[#F6FFED] text-[#52C41A] border-[#B7EB8F]" },
      rejected:         { label: "不立案", className: "bg-[#FFF1F0] text-[#CF1322] border-[#FFA39E]" },
      "to-filing":      { label: "客户同意立案", className: "bg-[#F6FFED] text-[#52C41A] border-[#B7EB8F]" },
      "no-filing":      { label: "客户不立案",   className: "bg-[#FFF1F0] text-[#CF1322] border-[#FFA39E]" },
      "filing-pending": { label: "等待立案",     className: "bg-[#E6FFFB] text-[#13C2C2] border-[#87E8DE]" },
      closed:           { label: "已关闭",       className: "bg-[#F5F5F5] text-[#8C8C8C] border-[#D9D9D9]" },
    }
    const config = configs[status] || configs.assigning
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      high: { label: "紧急", className: "bg-[#FFF1F0] text-[#CF1322] border-[#FFA39E]" },
      normal: { label: "普通", className: "bg-[#F0F5FF] text-[#2F54EB] border-[#ADC6FF]" },
      low: { label: "低", className: "bg-[#F5F5F5] text-[#8C8C8C] border-[#D9D9D9]" },
    }
    const config = configs[priority] || configs.normal
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(filteredTickets.map(t => t.case_id))
    } else {
      setSelectedTickets([])
    }
  }

  const handleSelectTicket = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTickets([...selectedTickets, id])
    } else {
      setSelectedTickets(selectedTickets.filter(t => t !== id))
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">咨询工单列表</h1>
          <p className="text-sm text-[#6B7280] mt-1">管理所有售前咨询工单</p>
        </div>
        <Button className="bg-[#2F80ED] gap-2" onClick={() => onNavigate("presale-new")}>
          <Plus className="h-4 w-4" />
          新建工单
        </Button>
      </div>

      {/* 筛选区 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input placeholder="搜索工单号、客户名称、咨询主题..." className="pl-9" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="工单状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="assigning">待分配工程师</SelectItem>
                <SelectItem value="searching">待检索</SelectItem>
                <SelectItem value="confirming">待确认</SelectItem>
                <SelectItem value="filing">等待立案</SelectItem>
                <SelectItem value="completed">已立案</SelectItem>
                <SelectItem value="rejected">不立案</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="咨询类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="invention">发明专利</SelectItem>
                <SelectItem value="utility">实用新型</SelectItem>
                <SelectItem value="design">外观设计</SelectItem>
                <SelectItem value="layout">专利布局</SelectItem>
              </SelectContent>
            </Select>
            <Select value={salesFilter} onValueChange={setSalesFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="所属销售" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部销售</SelectItem>
                {salesList.map((u) => (
                  <SelectItem key={u.id} value={u.display_name || u.username}>
                    {u.display_name || u.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="所属客服" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部客服</SelectItem>
                {serviceList.map((u) => (
                  <SelectItem key={u.id} value={u.display_name || u.username}>
                    {u.display_name || u.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              更多筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 批量操作 */}
      {selectedTickets.length > 0 && (
        <div className="flex items-center gap-4 p-3 bg-[#EAF4FF] rounded-lg">
          <span className="text-sm text-[#2F80ED]">已选择 {selectedTickets.length} 项</span>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowTransferDialog(true)}>
            <Send className="h-4 w-4" />
            批量转立案
          </Button>
          <Button size="sm" variant="outline" className="gap-1 text-[#EF4444]" onClick={() => setShowCloseDialog(true)}>
            <XCircle className="h-4 w-4" />
            批量关闭
          </Button>
        </div>
      )}

      {/* 工单表格 */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F9FAFB]">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>工单号</TableHead>
              <TableHead>客户信息</TableHead>
              <TableHead>咨询主题</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>优先级</TableHead>
              <TableHead>所属销售</TableHead>
              <TableHead>所属客服</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.map((ticket) => (
              <TableRow key={ticket.case_id} className="hover:bg-[#F9FAFB]">
                <TableCell>
                  <Checkbox
                    checked={selectedTickets.includes(ticket.case_id)}
                    onCheckedChange={(checked) => handleSelectTicket(ticket.case_id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <span className="font-medium text-[#2F80ED]">{ticket.case_id}</span>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-sm">{ticket.client_name || "-"}</div>
                    <div className="text-xs text-[#6B7280]">{ticket.contact_person || "-"}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate text-sm">{ticket.case_name}</div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{ticket.patent_type}</span>
                </TableCell>
                <TableCell>{getStatusBadge(ticket.m05_status)}</TableCell>
                <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#FEF9C3] flex items-center justify-center text-[10px] font-bold text-[#CA8A04]">
                      {(ticket.sales_person || "-").charAt(0)}
                    </div>
                    <span className="text-sm text-[#374151]">{ticket.sales_person || "-"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[10px] font-bold text-[#0369A1]">
                      {(ticket.service_rep || "-").charAt(0)}
                    </div>
                    <span className="text-sm text-[#374151]">{ticket.service_rep || "-"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-[#6B7280]">{ticket.update_time || ticket.create_time}</span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2" onClick={() => onNavigate("presale-detail")}>
                        <Eye className="h-4 w-4" />
                        查看详情
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Edit className="h-4 w-4" />
                        编辑工单
                      </DropdownMenuItem>
                      {ticket.m05_status === "completed" && (
                        <DropdownMenuItem className="gap-2" onClick={() => onNavigate("filing-new")}>
                          <Send className="h-4 w-4" />
                          转入立案
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="gap-2 text-[#EF4444]" onClick={() => updateCaseStatus(ticket.case_id, "已归档", "rejected", "前端用户").then(fetchTickets)}>
                        <XCircle className="h-4 w-4" />
                        关闭工单
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* 转立案弹窗 */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>转入立案</DialogTitle>
            <DialogDescription>
              将选中的 {selectedTickets.length} 个咨询工单转入��案流程
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm text-[#6B7280]">
              转入立案后，工单将进入 M05 立案管理模块��行后续处理。
            </div>
            <Textarea placeholder="备注说明（选填）" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>取消</Button>
            <Button className="bg-[#2F80ED]" onClick={() => {
              setShowTransferDialog(false)
              onNavigate("filing-list")
            }}>
              确认转入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 关闭工单弹窗 */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>关闭工单</DialogTitle>
            <DialogDescription>
              确定要关闭选中的 {selectedTickets.length} 个咨询工单吗？
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="请选择关闭原因" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">咨询已完成</SelectItem>
                <SelectItem value="no-response">客户无响应</SelectItem>
                <SelectItem value="cancelled">客户取消</SelectItem>
                <SelectItem value="duplicate">重复工单</SelectItem>
                <SelectItem value="other">其他原因</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="关闭说明（选填）" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>取消</Button>
            <Button variant="destructive" onClick={() => setShowCloseDialog(false)}>
              确认关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
