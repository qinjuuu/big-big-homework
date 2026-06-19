"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  UserPlus,
  Send,
  Archive,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react"
import { getCases, getUsers, type CaseItem, type UserItem } from "@/lib/api"

interface ConsultationFilingListProps {
  onNavigate: (page: string) => void
  filterStatus?: string
}

export function ConsultationFilingList({ onNavigate, filterStatus }: ConsultationFilingListProps) {
  const [statusFilter, setStatusFilter] = useState(filterStatus || "all")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [cases, setCases] = useState<CaseItem[]>([])
  const [total, setTotal] = useState(0)

  // ✅ 当 filterStatus prop 改变时，同步更新内部状态
  useEffect(() => {
    // ✅ 无论 filterStatus 是具体状态还是 undefined，都要同步
    const newStatus = filterStatus || 'all'
    console.log('🔄 Prop 变化，同步 statusFilter:', newStatus)
    setStatusFilter(newStatus)
  }, [filterStatus])

  const fetchCases = useCallback(async () => {
    try {
      // ✅ 当 statusFilter 为 'all' 或为空时，不传递 m05_status 参数，查询所有案件
      const m05Status = (statusFilter && statusFilter !== 'all') ? statusFilter : undefined
      console.log('🔍 查询案件，筛选状态:', m05Status || '全部')
      const data = await getCases({ m05_status: m05Status })
      setCases(data.list)
      setTotal(data.total)
    } catch (err) {
      console.error("Failed to fetch cases:", err)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

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

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      assigning:  { label: "待分配", className: "bg-[#FFF7E6] text-[#D46B08] border-[#FFD591]" },
      searching:  { label: "待检索", className: "bg-[#F0F5FF] text-[#2F54EB] border-[#ADC6FF]" },
      confirming: { label: "待确认", className: "bg-[#E6F7FF] text-[#1890FF] border-[#91D5FF]" },
      filing:     { label: "待立案", className: "bg-[#E6FFFB] text-[#13C2C2] border-[#87E8DE]" },
      completed:  { label: "已立案", className: "bg-[#F6FFED] text-[#52C41A] border-[#B7EB8F]" },
      rejected:   { label: "不立案归档", className: "bg-[#F5F5F5] text-[#8C8C8C] border-[#D9D9D9]" },
    }
    const config = configs[status] || configs.assigning
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      high:   { label: "紧急", className: "bg-[#FFF1F0] text-[#CF1322] border-[#FFA39E]" },
      normal: { label: "普通", className: "bg-[#F5F5F5] text-[#595959] border-[#D9D9D9]" },
      low:    { label: "低",   className: "bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB]" },
    }
    const config = configs[priority] || configs.normal
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  const toggleSelectAll = () => {
    if (selectedItems.length === cases.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(cases.map(c => c.case_id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">
            {filterStatus ? getStatusBadge(filterStatus).props.children : "全部案件"}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">共 {total} 条记录</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button onClick={() => onNavigate("m05-new")} className="bg-[#2F80ED] hover:bg-[#2F80ED]/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            发起咨询
          </Button>
        </div>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input placeholder="搜索案件编号、客户名称、主题..." className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={(value) => {
              console.log('🔄 切换筛选状态:', value)
              setStatusFilter(value)
            }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="案件状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="assigning">待分配</SelectItem>
                <SelectItem value="searching">待检索</SelectItem>
                <SelectItem value="confirming">待确认</SelectItem>
                <SelectItem value="filing">待立案</SelectItem>
                <SelectItem value="completed">已立案</SelectItem>
                <SelectItem value="rejected">不立案归档</SelectItem>
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
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              更多筛选
            </Button>
            <Button variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 批量操作栏 */}
      {selectedItems.length > 0 && (
        <Card className="bg-[#EAF4FF] border-[#2F80ED]">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm text-[#2F80ED]">已选择 {selectedItems.length} 项</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="border-[#2F80ED] text-[#2F80ED]">
                <UserPlus className="h-4 w-4 mr-1" /> 批量分配
              </Button>
              <Button size="sm" variant="outline" className="border-[#10B981] text-[#10B981]">
                <Send className="h-4 w-4 mr-1" /> 批量提交M06
              </Button>
              <Button size="sm" variant="outline" className="border-[#EF4444] text-[#EF4444]">
                <Archive className="h-4 w-4 mr-1" /> 批量归档
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 案件列表 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F9FAFB]">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedItems.length === cases.length && cases.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>案件编号</TableHead>
                <TableHead>客户信息</TableHead>
                <TableHead>咨询主题</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>所属销售</TableHead>
                <TableHead>所属客服</TableHead>
                <TableHead>工程师</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((item) => (
                <TableRow key={item.case_id} className="hover:bg-[#F9FAFB]">
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(item.case_id)}
                      onCheckedChange={() => toggleSelect(item.case_id)}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-[#2F80ED] cursor-pointer hover:underline" onClick={() => onNavigate("m05-detail")}>
                      {item.case_id}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{item.client_name || '-'}</div>
                      <div className="text-xs text-[#6B7280]">{item.contact_person || '-'}</div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{item.case_name}</TableCell>
                  <TableCell>{item.patent_type}</TableCell>
                  <TableCell>{getStatusBadge(item.m05_status)}</TableCell>
                  <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-[#FEF9C3] flex items-center justify-center text-[10px] font-bold text-[#CA8A04]">
                        {(item.sales_person || '-').charAt(0)}
                      </div>
                      <span className="text-sm">{item.sales_person || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[10px] font-bold text-[#0369A1]">
                        {(item.service_rep || '-').charAt(0)}
                      </div>
                      <span className="text-sm">{item.service_rep || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {!item.engineer ? (
                      <Badge variant="outline" className="bg-[#FFF7E6] text-[#D46B08] border-[#FFD591]">待分配</Badge>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#F3E8FF] flex items-center justify-center text-[10px] font-bold text-[#7C3AED]">
                          {item.engineer.charAt(0)}
                        </div>
                        <span className="text-sm">{item.engineer}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-[#6B7280]">{item.update_time || item.create_time}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2" onClick={() => onNavigate("m05-detail")}>
                          <Eye className="h-4 w-4" /> 查看详情
                        </DropdownMenuItem>
                        {item.m05_status === "assigning" && (
                          <DropdownMenuItem className="gap-2">
                            <UserPlus className="h-4 w-4" /> 分配工程师
                          </DropdownMenuItem>
                        )}
                        {item.m05_status === "completed" && (
                          <DropdownMenuItem className="gap-2" onClick={() => onNavigate("m06-p01-dashboard")}>
                            <Send className="h-4 w-4" /> 提交M06
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-[#EF4444]" onClick={() => onNavigate("m09-scrap-cases")}>
                          <Archive className="h-4 w-4" /> 不立案归档
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
