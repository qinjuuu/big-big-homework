"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Shield, Clock, CheckCircle, AlertTriangle, FileText, Eye, Send } from "lucide-react"
import { getCases, type CaseItem } from "@/lib/api"

interface ProtectionCenterProps {
  onNavigate: (page: string) => void
}

export function ProtectionCenter({ onNavigate }: ProtectionCenterProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [cases, setCases] = useState<CaseItem[]>([])

  useEffect(() => {
    getCases({ pageSize: 100 }).then((data) => setCases(data.list)).catch(console.error)
  }, [])

  const getCaseProtectionStatus = (item: CaseItem) => {
    if (item.case_status === "已归档") return "已通过"
    if (item.case_status === "待质检") return "预审中"
    if (item.m05_status === "rejected") return "需补正"
    return "待提交"
  }

  const rows = useMemo(() => cases
    .map((item) => ({ ...item, protectionStatus: getCaseProtectionStatus(item) }))
    .filter((item) => {
      if (activeTab === "pending") return item.protectionStatus === "待提交"
      if (activeTab === "reviewing") return item.protectionStatus === "预审中"
      if (activeTab === "passed") return item.protectionStatus === "已通过"
      if (activeTab === "correction") return item.protectionStatus === "需补正"
      return true
    }), [cases, activeTab])

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; icon: React.ReactNode }> = {
      "待提交": { className: "bg-gray-100 text-gray-600", icon: <Clock className="h-3 w-3 mr-1" /> },
      "预审中": { className: "bg-blue-100 text-blue-700", icon: <Shield className="h-3 w-3 mr-1" /> },
      "已通过": { className: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      "需补正": { className: "bg-orange-100 text-orange-700", icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
    }
    const cfg = config[status] || config["待提交"]
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
          <h1 className="text-2xl font-semibold text-foreground">保护中心</h1>
          <p className="text-muted-foreground mt-1">管理知识产权保护中心预审案件</p>
        </div>
        <Button>
          <Send className="mr-2 h-4 w-4" />
          提交预审申请
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">待提交</p>
                <p className="text-2xl font-semibold">{cases.filter(item => getCaseProtectionStatus(item) === "待提交").length}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">预审中</p>
                <p className="text-2xl font-semibold text-blue-600">{cases.filter(item => getCaseProtectionStatus(item) === "预审中").length}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已通过</p>
                <p className="text-2xl font-semibold text-green-600">{cases.filter(item => getCaseProtectionStatus(item) === "已通过").length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">需补正</p>
                <p className="text-2xl font-semibold text-orange-600">{cases.filter(item => getCaseProtectionStatus(item) === "需补正").length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">全部 ({cases.length})</TabsTrigger>
              <TabsTrigger value="pending">待提交 ({cases.filter(item => getCaseProtectionStatus(item) === "待提交").length})</TabsTrigger>
              <TabsTrigger value="reviewing">预审中 ({cases.filter(item => getCaseProtectionStatus(item) === "预审中").length})</TabsTrigger>
              <TabsTrigger value="passed">已通过 ({cases.filter(item => getCaseProtectionStatus(item) === "已通过").length})</TabsTrigger>
              <TabsTrigger value="correction">需补正 ({cases.filter(item => getCaseProtectionStatus(item) === "需补正").length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">预审编号</TableHead>
                <TableHead className="w-[140px]">关联案件</TableHead>
                <TableHead className="w-[100px]">客户</TableHead>
                <TableHead>专利名称</TableHead>
                <TableHead className="w-[120px]">保护中心</TableHead>
                <TableHead className="w-[100px]">状态</TableHead>
                <TableHead className="w-[100px]">提交日期</TableHead>
                <TableHead className="w-[100px]">预计完成</TableHead>
                <TableHead className="w-[80px] text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item, index) => (
                <TableRow key={item.case_id}>
                  <TableCell className="font-medium">PC-{String(index + 1).padStart(4, "0")}</TableCell>
                  <TableCell className="text-primary cursor-pointer" onClick={() => onNavigate("m09-case-detail")}>{item.case_id}</TableCell>
                  <TableCell>{item.client_name || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={item.case_name}>{item.case_name}</TableCell>
                  <TableCell>{item.tech_field?.includes("通信") ? "北京保护中心" : "综合保护中心"}</TableCell>
                  <TableCell>{getStatusBadge(item.protectionStatus)}</TableCell>
                  <TableCell>{item.create_time || "-"}</TableCell>
                  <TableCell>{item.update_time || item.create_time || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <FileText className="h-4 w-4" />
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
