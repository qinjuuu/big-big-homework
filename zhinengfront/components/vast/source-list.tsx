"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge, type DisclosureStatus } from "./status-badge"
import { Search, Filter, Download, Eye, Users, FileCheck, XCircle, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCases, updateCaseStatus, type CaseItem } from "@/lib/api"

interface SourceListProps {
  onViewDetail: (id: string) => void
}

export function SourceList({ onViewDetail }: SourceListProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [searchText, setSearchText] = useState("")
  const [sourceType, setSourceType] = useState("all")
  const [patentType, setPatentType] = useState("all")
  const [cases, setCases] = useState<CaseItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchCases = async () => {
    const tabStatusMap: Record<string, string | undefined> = {
      all: undefined,
      presale: "assigning",
      waiting: "filing",
      filed: "completed",
      "not-filed": "rejected",
    }
    setLoading(true)
    try {
      const data = await getCases({
        keyword: searchText || undefined,
        m05_status: tabStatusMap[activeTab],
        pageSize: 100,
      })
      setCases(data.list)
      setTotal(data.total)
    } catch (err) {
      console.error("获取来源列表失败：", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCases()
  }, [activeTab])

  const mapStatus = (status: string): DisclosureStatus => {
    const map: Record<string, DisclosureStatus> = {
      assigning: "presale",
      searching: "checking",
      confirming: "waiting-order",
      filing: "waiting-filing",
      completed: "filed",
      rejected: "not-filed",
    }
    return map[status] || "presale"
  }

  const filteredData = useMemo(() => cases.filter((item) => {
    if (searchText && !item.client_name?.includes(searchText) && !item.case_id?.includes(searchText) && !item.case_name?.includes(searchText)) {
      return false
    }
    if (sourceType !== "all" && item.source_type !== sourceType) return false
    if (patentType !== "all" && !item.patent_type?.includes(patentType)) return false
    if (activeTab === "all") return true
    if (activeTab === "presale") return item.m05_status === "assigning"
    if (activeTab === "waiting") return item.m05_status === "filing"
    if (activeTab === "filed") return item.m05_status === "completed"
    if (activeTab === "not-filed") return item.m05_status === "rejected"
    return true
  }), [cases, searchText, sourceType, patentType, activeTab])

  const handleStatusUpdate = async (id: string, m05Status: string, caseStatus?: string) => {
    try {
      await updateCaseStatus(id, { case_status: caseStatus, m05_status: m05Status, opt_user: "前端用户" })
      await fetchCases()
    } catch (err) {
      console.error("状态更新失败：", err)
    }
  }

  return (
    <div className="p-6 space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">交底书来源列表</h1>
          <p className="text-sm text-[#6B7280] mt-1">管理所有售前咨询、客服立案、待立案、不立案来源</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          导出
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#F5F7FA]">
          <TabsTrigger value="all" className="data-[state=active]:bg-white">全部来源</TabsTrigger>
          <TabsTrigger value="presale" className="data-[state=active]:bg-white">售前咨询</TabsTrigger>
          <TabsTrigger value="waiting" className="data-[state=active]:bg-white">待立案</TabsTrigger>
          <TabsTrigger value="filed" className="data-[state=active]:bg-white">已立案</TabsTrigger>
          <TabsTrigger value="not-filed" className="data-[state=active]:bg-white">不立案</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input
                placeholder="搜索客户名称、来源编号、专利名称"
                className="pl-9"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <Select value={sourceType} onValueChange={setSourceType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="来源类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="presale">售前咨询</SelectItem>
                <SelectItem value="filed">客服立案</SelectItem>
              </SelectContent>
            </Select>
            <Select value={patentType} onValueChange={setPatentType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="专利类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="发明">发明专利</SelectItem>
                <SelectItem value="实用">实用新型</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="是否签单" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="yes">已签单</SelectItem>
                <SelectItem value="no">未签单</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={fetchCases}>
              <Filter className="h-4 w-4" />
              更多筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F5F7FA]">
                <TableHead className="font-medium text-[#6B7280]">来源编号</TableHead>
                <TableHead className="font-medium text-[#6B7280]">客户名称</TableHead>
                <TableHead className="font-medium text-[#6B7280]">专利名称/技术主题</TableHead>
                <TableHead className="font-medium text-[#6B7280]">来源类型</TableHead>
                <TableHead className="font-medium text-[#6B7280]">专利类型</TableHead>
                <TableHead className="font-medium text-[#6B7280]">状态</TableHead>
                <TableHead className="font-medium text-[#6B7280]">是否签单</TableHead>
                <TableHead className="font-medium text-[#6B7280]">专利经理</TableHead>
                <TableHead className="font-medium text-[#6B7280]">计划受理时间</TableHead>
                <TableHead className="font-medium text-[#6B7280]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.case_id} className="hover:bg-[#F5F7FA]/50">
                  <TableCell className="font-mono text-sm text-[#2F80ED]">{item.case_id}</TableCell>
                  <TableCell className="text-[#1F2937]">{item.client_name || "-"}</TableCell>
                  <TableCell className="text-[#1F2937] max-w-48 truncate">{item.case_name}</TableCell>
                  <TableCell className="text-[#6B7280]">{item.source_type === "presale" ? "售前咨询" : "客服立案"}</TableCell>
                  <TableCell className="text-[#6B7280]">{item.patent_type}</TableCell>
                  <TableCell>
                    <StatusBadge status={mapStatus(item.m05_status)} />
                  </TableCell>
                  <TableCell>
                    <span className={item.m05_status === "filing" || item.m05_status === "completed" ? "text-[#52C41A]" : "text-[#9CA3AF]"}>
                      {item.m05_status === "filing" || item.m05_status === "completed" ? "已签单" : "未签单"}
                    </span>
                  </TableCell>
                  <TableCell className="text-[#6B7280]">{item.sales_person || item.service_rep || "-"}</TableCell>
                  <TableCell className="text-[#6B7280] font-mono text-sm">{item.update_time || item.create_time || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-[#2F80ED] hover:text-[#2F80ED] hover:bg-[#EAF4FF]"
                        onClick={() => onViewDetail(item.case_id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        查看
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => handleStatusUpdate(item.case_id, "assigning")}>
                            <Users className="h-4 w-4" />
                            分配
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleStatusUpdate(item.case_id, "completed", "待交底")}>
                            <FileCheck className="h-4 w-4" />
                            正式立案
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-[#F5222D]" onClick={() => handleStatusUpdate(item.case_id, "rejected", "已归档")}>
                            <XCircle className="h-4 w-4" />
                            不立案
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6B7280]">
          {loading ? "加载中..." : <>共 <span className="font-medium text-[#1F2937]">{total || filteredData.length}</span> 条记录</>}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            上一页
          </Button>
          <Button variant="outline" size="sm" className="bg-[#2F80ED] text-white hover:bg-[#2F80ED]/90">
            1
          </Button>
          <Button variant="outline" size="sm">
            2
          </Button>
          <Button variant="outline" size="sm">
            下一页
          </Button>
        </div>
      </div>
    </div>
  )
}
