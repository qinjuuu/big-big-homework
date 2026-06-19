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
import { Search, Archive, RotateCcw, Trash2, Eye, FileText } from "lucide-react"
import { getCases, updateCaseStatus, type CaseItem } from "@/lib/api"

interface ScrapCasesProps {
  onNavigate: (page: string) => void
}

export function ScrapCases({ onNavigate }: ScrapCasesProps) {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [cases, setCases] = useState<CaseItem[]>([])

  const fetchScrapCases = async () => {
    try {
      const data = await getCases({ m05_status: "rejected", keyword: searchKeyword || undefined, pageSize: 100 })
      setCases(data.list)
    } catch (err) {
      console.error("获取废案失败：", err)
    }
  }

  useEffect(() => {
    fetchScrapCases()
  }, [])

  const filteredCases = useMemo(() => cases.filter((item) => {
    if (!searchKeyword) return true
    return item.case_id.includes(searchKeyword) || item.client_name?.includes(searchKeyword) || item.case_name?.includes(searchKeyword)
  }), [cases, searchKeyword])

  const restoreCase = async (caseId: string) => {
    try {
      await updateCaseStatus(caseId, "待交底", "assigning", "前端用户")
      await fetchScrapCases()
    } catch (err) {
      console.error("恢复案件失败：", err)
    }
  }

  const getReasonBadge = (reason: string) => {
    const config: Record<string, string> = {
      "新创性不足": "bg-orange-100 text-orange-700",
      "客户撤回": "bg-gray-100 text-gray-600",
      "技术方案不完整": "bg-red-100 text-red-700",
      "重复申请": "bg-purple-100 text-purple-700",
      "审核未通过": "bg-red-100 text-red-700",
    }
    return <Badge className={config[reason] || "bg-gray-100 text-gray-600"}>{reason}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">废案管理</h1>
          <p className="text-muted-foreground mt-1">共 {filteredCases.length} 个废案记录</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">新创性不足</p>
              <p className="text-2xl font-semibold text-orange-600">{filteredCases.filter(item => item.priority === "high").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">客户撤回</p>
              <p className="text-2xl font-semibold text-gray-600">{filteredCases.filter(item => item.source_type === "presale").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">技术方案问题</p>
              <p className="text-2xl font-semibold text-red-600">{filteredCases.filter(item => !item.tech_field).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">其他原因</p>
              <p className="text-2xl font-semibold">{filteredCases.length}</p>
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
                placeholder="搜索案件号、客户名称、专利名称..."
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
                <TableHead className="w-[100px]">客户</TableHead>
                <TableHead>专利名称</TableHead>
                <TableHead className="w-[80px]">类型</TableHead>
                <TableHead className="w-[120px]">废案原因</TableHead>
                <TableHead className="w-[100px]">废案阶段</TableHead>
                <TableHead className="w-[100px]">废案日期</TableHead>
                <TableHead className="w-[80px]">操作人</TableHead>
                <TableHead className="w-[120px] text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((item) => (
                <TableRow key={item.case_id}>
                  <TableCell className="font-medium text-muted-foreground">{item.case_id}</TableCell>
                  <TableCell>{item.client_name || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={item.case_name}>{item.case_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.patent_type}</Badge>
                  </TableCell>
                  <TableCell>{getReasonBadge(item.priority === "high" ? "新创性不足" : "客户撤回")}</TableCell>
                  <TableCell>{item.case_status || "已归档"}</TableCell>
                  <TableCell>{item.update_time || item.create_time}</TableCell>
                  <TableCell>{item.sales_person || item.service_rep || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onNavigate("m09-case-detail")}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" title="恢复案件" onClick={() => restoreCase(item.case_id)}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" title="永久删除">
                        <Trash2 className="h-4 w-4" />
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
