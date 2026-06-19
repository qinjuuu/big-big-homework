"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, RefreshCw, CheckCircle, Clock, AlertTriangle, FileText, Eye, ExternalLink } from "lucide-react"
import { getCases, type CaseItem } from "@/lib/api"

interface NationalIPProps {
  onNavigate: (page: string) => void
}

export function NationalIP({ onNavigate }: NationalIPProps) {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [cases, setCases] = useState<CaseItem[]>([])

  const fetchCases = () => {
    getCases({ keyword: searchKeyword || undefined, pageSize: 100 })
      .then((data) => setCases(data.list))
      .catch(console.error)
  }

  useEffect(() => {
    fetchCases()
  }, [])

  const getIPStatus = (item: CaseItem) => {
    if (item.case_status === "已归档") return "授权公告"
    if (item.case_status === "待质检") return "实质审查"
    if (item.m05_status === "rejected") return "驳回待答复"
    if (item.m05_status === "confirming") return "补正通知"
    return "初审合格"
  }

  const filteredCases = useMemo(() => cases.filter((item) => {
    if (!searchKeyword) return true
    return item.case_id.includes(searchKeyword) || item.case_name?.includes(searchKeyword) || item.client_name?.includes(searchKeyword)
  }), [cases, searchKeyword])

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; icon: React.ReactNode }> = {
      "初审合格": { className: "bg-blue-100 text-blue-700", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      "实质审查": { className: "bg-purple-100 text-purple-700", icon: <Clock className="h-3 w-3 mr-1" /> },
      "授权公告": { className: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      "补正通知": { className: "bg-orange-100 text-orange-700", icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
      "驳回待答复": { className: "bg-red-100 text-red-700", icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
    }
    const cfg = config[status] || { className: "bg-gray-100 text-gray-600", icon: null }
    return (
      <Badge className={`${cfg.className} flex items-center`}>
        {cfg.icon}
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">国知局状态</h1>
          <p className="text-muted-foreground mt-1">同步国家知识产权局案件审查状态</p>
        </div>
        <Button variant="outline" onClick={fetchCases}>
          <RefreshCw className="mr-2 h-4 w-4" />
          同步最新状态
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">初审中</p>
              <p className="text-2xl font-semibold text-blue-600">{cases.filter(item => getIPStatus(item) === "初审合格").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">实审中</p>
              <p className="text-2xl font-semibold text-purple-600">{cases.filter(item => getIPStatus(item) === "实质审查").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">已授权</p>
              <p className="text-2xl font-semibold text-green-600">{cases.filter(item => getIPStatus(item) === "授权公告").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">待答复</p>
              <p className="text-2xl font-semibold text-orange-600">{cases.filter(item => ["补正通知", "驳回待答复"].includes(getIPStatus(item))).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">驳回/撤回</p>
              <p className="text-2xl font-semibold text-red-600">{cases.filter(item => item.m05_status === "rejected").length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索申请号、案件号、专利名称..."
                className="pl-9"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">案件号</TableHead>
                <TableHead className="w-[160px]">申请号</TableHead>
                <TableHead className="w-[100px]">客户</TableHead>
                <TableHead>专利名称</TableHead>
                <TableHead className="w-[80px]">类型</TableHead>
                <TableHead className="w-[100px]">国知局状态</TableHead>
                <TableHead className="w-[100px]">提交日期</TableHead>
                <TableHead className="w-[100px]">最后更新</TableHead>
                <TableHead className="w-[100px] text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((item) => (
                <TableRow key={item.case_id}>
                  <TableCell className="font-medium text-primary cursor-pointer" onClick={() => onNavigate("m09-case-detail")}>{item.case_id}</TableCell>
                  <TableCell className="font-mono text-sm">{`CN${String(Math.abs(item.case_id.split("").reduce((a, c) => a + c.charCodeAt(0), 0))).padStart(10, "0")}`}</TableCell>
                  <TableCell>{item.client_name || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={item.case_name}>{item.case_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.patent_type}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(getIPStatus(item))}</TableCell>
                  <TableCell>{item.create_time || "-"}</TableCell>
                  <TableCell>{item.update_time || item.create_time || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
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
