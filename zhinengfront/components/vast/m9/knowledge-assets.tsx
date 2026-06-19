"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Star, TrendingUp, Award, FileText, Eye, Download, BarChart3 } from "lucide-react"
import { getCases, type CaseItem } from "@/lib/api"

interface KnowledgeAssetsProps {
  onNavigate: (page: string) => void
}

export function KnowledgeAssets({ onNavigate }: KnowledgeAssetsProps) {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [cases, setCases] = useState<CaseItem[]>([])

  useEffect(() => {
    getCases({ status: "已归档", pageSize: 100 })
      .then((data) => setCases(data.list))
      .catch(console.error)
  }, [])

  const getValue = (item: CaseItem) => item.priority === "high" ? "核心专利" : item.priority === "normal" ? "高价值" : "普通"

  const assets = useMemo(() => cases.filter((item) => {
    if (searchKeyword && !item.case_id.includes(searchKeyword) && !item.case_name?.includes(searchKeyword) && !item.client_name?.includes(searchKeyword)) return false
    const value = getValue(item)
    if (activeTab === "core") return value === "核心专利"
    if (activeTab === "high") return value === "高价值"
    if (activeTab === "invention") return item.patent_type?.includes("发明")
    if (activeTab === "utility") return item.patent_type?.includes("实用")
    return true
  }), [cases, searchKeyword, activeTab])

  const getValueBadge = (value: string) => {
    const config: Record<string, { className: string; icon: React.ReactNode }> = {
      "核心专利": { className: "bg-red-100 text-red-700", icon: <Award className="h-3 w-3 mr-1" /> },
      "高价值": { className: "bg-orange-100 text-orange-700", icon: <Star className="h-3 w-3 mr-1" /> },
      "普通": { className: "bg-gray-100 text-gray-600", icon: null },
    }
    const cfg = config[value] || config["普通"]
    return (
      <Badge className={`${cfg.className} flex items-center`}>
        {cfg.icon}
        {value}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">知识资产</h1>
          <p className="text-muted-foreground mt-1">管理已授权专利资产</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            资产分析报告
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            导出资产清单
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">专利总数</p>
                <p className="text-2xl font-semibold">{cases.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">核心专利</p>
                <p className="text-2xl font-semibold text-red-600">{cases.filter(item => getValue(item) === "核心专利").length}</p>
              </div>
              <Award className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">高价值专利</p>
                <p className="text-2xl font-semibold text-orange-600">{cases.filter(item => getValue(item) === "高价值").length}</p>
              </div>
              <Star className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">本年新增</p>
                <p className="text-2xl font-semibold text-green-600">+{cases.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">全部 ({cases.length})</TabsTrigger>
                <TabsTrigger value="core">核心专利 ({cases.filter(item => getValue(item) === "核心专利").length})</TabsTrigger>
                <TabsTrigger value="high">高价值 ({cases.filter(item => getValue(item) === "高价值").length})</TabsTrigger>
                <TabsTrigger value="invention">发明 ({cases.filter(item => item.patent_type?.includes("发明")).length})</TabsTrigger>
                <TabsTrigger value="utility">实用新型 ({cases.filter(item => item.patent_type?.includes("实用")).length})</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-[300px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索专利号、名称、客户..."
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
                <TableHead className="w-[120px]">资产编号</TableHead>
                <TableHead className="w-[160px]">专利号</TableHead>
                <TableHead className="w-[100px]">客户</TableHead>
                <TableHead>专利名称</TableHead>
                <TableHead className="w-[80px]">类型</TableHead>
                <TableHead className="w-[100px]">价值等级</TableHead>
                <TableHead className="w-[100px]">授权日期</TableHead>
                <TableHead className="w-[100px] text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((item, index) => (
                <TableRow key={item.case_id}>
                  <TableCell className="font-medium">PA-{String(index + 1).padStart(4, "0")}</TableCell>
                  <TableCell className="font-mono text-sm text-primary">{`ZL${String(Math.abs(item.case_id.split("").reduce((a, c) => a + c.charCodeAt(0), 0))).padStart(10, "0")}`}</TableCell>
                  <TableCell>{item.client_name || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={item.case_name}>{item.case_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.patent_type}</Badge>
                  </TableCell>
                  <TableCell>{getValueBadge(getValue(item))}</TableCell>
                  <TableCell>{item.update_time || item.create_time}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onNavigate("m09-case-detail")}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
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
