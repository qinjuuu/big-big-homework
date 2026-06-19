"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Search, Filter, Download, Eye, MoreHorizontal } from "lucide-react"
import { getCases, type CaseItem } from "@/lib/api"

interface AllCasesListProps {
  onNavigate: (page: string, payload?: any) => void
}

const getStatusBadge = (status: string) => {
  const config: Record<string, { className: string }> = {
    "撰写中": { className: "bg-blue-100 text-blue-700" },
    "待审核": { className: "bg-purple-100 text-purple-700" },
    "已交案": { className: "bg-cyan-100 text-cyan-700" },
    "待交案": { className: "bg-orange-100 text-orange-700" },
    "授权": { className: "bg-green-100 text-green-700" },
    "废案": { className: "bg-gray-100 text-gray-500" },
  }
  return <Badge className={config[status]?.className || "bg-gray-100 text-gray-500"}>{status}</Badge>
}

export function AllCasesList({ onNavigate }: AllCasesListProps) {
  const [cases, setCases] = useState<CaseItem[]>([])
  const [total, setTotal] = useState(0)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [page, setPage] = useState(1)
  const pageSize = 20

  const fetchCases = async () => {
    try {
      const data = await getCases({
        keyword: searchKeyword || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page, pageSize,
      })
      setCases(data.list)
      setTotal(data.total)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchCases() }, [page, statusFilter, typeFilter])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">全部案件列表</h1>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />导出列表
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="搜索案件号、客户名称、专利名称..." className="pl-9"
                value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") fetchCases() }} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="案件状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="writing">撰写中</SelectItem>
                <SelectItem value="pending-review">待审核</SelectItem>
                <SelectItem value="pending-submit">待交案</SelectItem>
                <SelectItem value="submitted">已交案</SelectItem>
                <SelectItem value="authorized">授权</SelectItem>
                <SelectItem value="abandoned">废案</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="专利类型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="invention">发明</SelectItem>
                <SelectItem value="utility">实用新型</SelectItem>
                <SelectItem value="design">外观设计</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchCases}><Filter className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">案件号</TableHead>
                <TableHead className="w-[100px]">客户</TableHead>
                <TableHead>专利名称</TableHead>
                <TableHead className="w-[80px]">类型</TableHead>
                <TableHead className="w-[80px]">状态</TableHead>
                <TableHead className="w-[80px]">工程师</TableHead>
                <TableHead className="w-[100px]">更新时间</TableHead>
                <TableHead className="w-[80px] text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map(item => (
                <TableRow key={item.case_id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium text-primary">{item.case_id}</TableCell>
                  <TableCell>{item.client_name}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={item.case_name}>{item.case_name}</TableCell>
                  <TableCell><Badge variant="outline">{item.patent_type}</Badge></TableCell>
                  <TableCell>{getStatusBadge(item.case_status)}</TableCell>
                  <TableCell>{item.engineer || "-"}</TableCell>
                  <TableCell>{item.update_time}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onNavigate("m09-case-detail", item.case_id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">共 {total} 条记录</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>上一页</Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(i => (
                <Button key={i} variant="outline" size="sm" className={page === i ? "bg-primary text-primary-foreground" : ""}
                  onClick={() => setPage(i)}>{i}</Button>
              ))}
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>下一页</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
