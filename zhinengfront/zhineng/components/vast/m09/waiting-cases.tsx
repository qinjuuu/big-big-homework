"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Send, Clock, AlertTriangle, CheckCircle, Eye, FileCheck } from "lucide-react"
import { getCases, type CaseItem } from "@/lib/api"

interface WaitingCasesProps {
  onNavigate: (page: string) => void
}

export function WaitingCases({ onNavigate }: WaitingCasesProps) {
  const [cases, setCases] = useState<CaseItem[]>([])
  const [selectedCases, setSelectedCases] = useState<string[]>([])

  useEffect(() => {
    getCases({ status: "pending-submit", pageSize: 100 }).then(data => setCases(data.list)).catch(console.error)
  }, [])

  const readyCases = cases.filter(c => c.case_status === "pending_submit")
  const pendingCases = cases.filter(c => c.case_status === "writing")
  const overdueCases = cases.filter(c => c.case_status === "abandoned")

  const toggleSelect = (id: string) => {
    setSelectedCases(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">待交案案件</h1>
          <p className="text-muted-foreground mt-1">共 {cases.length} 个案件待交案，其中 {readyCases.length} 个已满足交案条件</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={selectedCases.length === 0} onClick={() => onNavigate("m09-protection-center")}>
            <FileCheck className="mr-2 h-4 w-4" />批量预检
          </Button>
          <Button disabled={selectedCases.length === 0}>
            <Send className="mr-2 h-4 w-4" />批量交案 ({selectedCases.length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">可交案</p>
                <p className="text-2xl font-semibold text-green-600">{readyCases.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">撰写中</p>
                <p className="text-2xl font-semibold text-orange-600">{pendingCases.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已超期</p>
                <p className="text-2xl font-semibold text-red-600">{overdueCases.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">待交案列表</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">案件号</TableHead>
                <TableHead className="w-[100px]">客户</TableHead>
                <TableHead>专利名称</TableHead>
                <TableHead className="w-[80px]">工程师</TableHead>
                <TableHead className="w-[100px]">状态</TableHead>
                <TableHead className="w-[100px]">更新时间</TableHead>
                <TableHead className="w-[80px] text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map(item => (
                <TableRow key={item.case_id}>
                  <TableCell className="font-medium text-primary cursor-pointer" onClick={() => onNavigate("m09-case-detail")}>{item.case_id}</TableCell>
                  <TableCell>{item.client_name}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={item.case_name}>{item.case_name}</TableCell>
                  <TableCell>{item.engineer || "-"}</TableCell>
                  <TableCell>
                    <Badge className="bg-orange-100 text-orange-700">{item.case_status}</Badge>
                  </TableCell>
                  <TableCell>{item.update_time}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onNavigate("m09-case-detail")}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {item.case_status === "pending_submit" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
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
