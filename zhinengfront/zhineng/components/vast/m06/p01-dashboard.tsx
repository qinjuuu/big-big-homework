"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Send, Search, RefreshCw, MoreHorizontal, Brain, Package,
  ChevronLeft, ChevronRight, Clock, Layers, ArrowUpDown, FileText,
  AlertTriangle,
} from "lucide-react"
import { getDisclosures, type DisclosureItem } from "@/lib/api"

interface EngineDashboardProps {
  onNavigate: (page: string) => void
}

const STAGE_ORDER = ["DECOMPOSITION", "AI_PRE_CHECK", "SUPPLEMENT", "FINAL_DISCLOSURE", "SECOND_SEARCH", "COMPARE", "RELATE", "STRUCTURE", "VALIDATE", "PACKAGE", "SUBMIT"]
const QUALITY_STAGE_INDEX = STAGE_ORDER.indexOf("VALIDATE")

const STAGE_LABELS: Record<string, string> = {
  DECOMPOSITION: "解构", AI_PRE_CHECK: "AI初检", SUPPLEMENT: "交底补全",
  FINAL_DISCLOSURE: "完整交底", SECOND_SEARCH: "二次检索", COMPARE: "技术对比",
  RELATE: "关系建模", STRUCTURE: "结构化", VALIDATE: "质量控制", PACKAGE: "数据包",
}

const STAGE_ROUTES: Record<string, string> = {
  DECOMPOSITION: "m06-p02-decomposition", AI_PRE_CHECK: "m06-p03-ai-inspection",
  SUPPLEMENT: "m06-p04-supplement", FINAL_DISCLOSURE: "m06-p05-final-disclosure",
  SECOND_SEARCH: "m06-p06-second-search", COMPARE: "m06-p07-prior-art",
  RELATE: "m06-p08-relation-mapping", STRUCTURE: "m06-p09-assets",
  VALIDATE: "m06-p10-quality", PACKAGE: "m06-p11-package",
}

export function EngineDashboard({ onNavigate }: EngineDashboardProps) {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [filterSource, setFilterSource] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [disclosures, setDisclosures] = useState<DisclosureItem[]>([])
  const [total, setTotal] = useState(0)

  const fetchDisclosures = useCallback(async () => {
    try {
      const data = await getDisclosures({})
      setDisclosures(data.list)
      setTotal(data.total)
    } catch (err) {
      console.error("Failed to fetch disclosures:", err)
    }
  }, [])

  useEffect(() => { fetchDisclosures() }, [fetchDisclosures])

  const sourceType = (d: DisclosureItem) => (d as any).source_type || 'filed'
  const stats = {
    total: disclosures.length,
    filed: disclosures.filter(d => sourceType(d) === "filed").length,
    presale: disclosures.filter(d => sourceType(d) === "presale").length,
    processing: disclosures.filter(d => d.m06_status === "IN_PROGRESS").length,
    blocked: disclosures.filter(d => d.m06_status === "BLOCKED").length,
    ready: disclosures.filter(d => d.m06_status === "READY").length,
  }

  const filteredData = disclosures.filter(item => {
    if (searchKeyword && !item.case_name?.includes(searchKeyword) && !item.case_id?.includes(searchKeyword)) return false
    if (filterSource !== "all" && sourceType(item) !== filterSource) return false
    if (filterStatus !== "all" && item.m06_status !== filterStatus.toUpperCase()) return false
    return true
  })

  const getSourceBadge = (source: string) => source === "presale"
    ? <Badge variant="outline" className="text-xs px-2 py-0.5 border-[#7C3AED] text-[#7C3AED] bg-[#F5F3FF]">售前</Badge>
    : <Badge variant="outline" className="text-xs px-2 py-0.5 border-[#2563EB] text-[#2563EB] bg-[#EFF6FF]">立案</Badge>

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BLOCKED": return <Badge className="text-xs px-2.5 py-0.5 bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">阻断</Badge>
      case "READY": return <Badge className="text-xs px-2.5 py-0.5 bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">就绪</Badge>
      default: return <Badge className="text-xs px-2.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">处理中</Badge>
    }
  }

  const getRiskBadge = (risk: string) => {
    const map: Record<string, any> = {
      HIGH: { color: "#DC2626", label: "高" },
      MEDIUM: { color: "#F59E0B", label: "中" },
      LOW: { color: "#16A34A", label: "低" },
    }
    const r = map[risk]
    if (!r) return <span className="text-[#D1D5DB]">—</span>
    return <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: r.color }}>
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />{r.label}
    </span>
  }

  const getStageBadge = (stage: string) => {
    const styles: Record<string, string> = {
      "解构": "bg-slate-100 text-slate-700 border-slate-200",
      "AI初检": "bg-blue-50 text-blue-700 border-blue-200",
      "交底补全": "bg-indigo-50 text-indigo-700 border-indigo-200",
      "完整交底": "bg-purple-50 text-purple-700 border-purple-200",
      "二次检索": "bg-cyan-50 text-cyan-700 border-cyan-200",
      "技术对比": "bg-teal-50 text-teal-700 border-teal-200",
      "关系建模": "bg-emerald-50 text-emerald-700 border-emerald-200",
      "结构化": "bg-green-50 text-green-700 border-green-200",
      "质量控制": "bg-amber-50 text-amber-700 border-amber-200",
      "数据包": "bg-orange-50 text-orange-700 border-orange-200",
    }
    const label = STAGE_LABELS[stage] || stage
    return <Badge variant="outline" className={`text-xs px-2.5 py-0.5 font-medium border ${styles[label] || "bg-gray-50 text-gray-700 border-gray-200"}`}>{label}</Badge>
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F7FA]">
      <header className="bg-white border-b border-[#E5E7EB] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-[#111827]">交底书工作台</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">管理从M05流转的交底书任务</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onNavigate("m06-p10-quality")}>
              <AlertTriangle size={14} className="mr-1.5 text-[#DC2626]" />阻断任务 ({stats.blocked})
            </Button>
            <Button variant="outline" size="sm" className="text-[#16A34A] border-[#16A34A]" onClick={() => onNavigate("m06-p12-submit")}>
              <Send size={14} className="mr-1.5" />待提交M07 ({stats.ready})
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={fetchDisclosures}><RefreshCw size={16} /></Button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
            <div className="flex items-center gap-2 text-[#6B7280] text-sm mb-1"><FileText size={16} />全部任务</div>
            <div className="text-2xl font-bold text-[#111827]">{stats.total}</div>
            <div className="text-xs text-[#9CA3AF] mt-1">处理中 {stats.processing}</div>
          </div>
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-4 cursor-pointer hover:bg-[#DBEAFE] transition" onClick={() => setFilterSource("filed")}>
            <div className="flex items-center gap-2 text-[#2563EB] text-sm mb-1"><FileText size={16} />立案来源</div>
            <div className="text-2xl font-bold text-[#111827]">{stats.filed}</div>
            <div className="text-xs text-[#9CA3AF] mt-1">完整流程至M07</div>
          </div>
          <div className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-lg p-4 cursor-pointer hover:bg-[#EDE9FE] transition" onClick={() => setFilterSource("presale")}>
            <div className="flex items-center gap-2 text-[#7C3AED] text-sm mb-1"><FileText size={16} />售前来源</div>
            <div className="text-2xl font-bold text-[#111827]">{stats.presale}</div>
            <div className="text-xs text-[#9CA3AF] mt-1">初检后返回M05</div>
          </div>
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-4 cursor-pointer hover:bg-[#DCFCE7] transition" onClick={() => setFilterStatus("processing")}>
            <div className="flex items-center gap-2 text-[#16A34A] text-sm mb-1"><Clock size={16} />进行中</div>
            <div className="text-2xl font-bold text-[#111827]">{stats.processing}</div>
            <div className="text-xs text-[#9CA3AF] mt-1">阻断 {stats.blocked} / 就绪 {stats.ready}</div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6">
        <div className="bg-white border border-[#E5E7EB] rounded-xl h-full flex flex-col">
          <div className="flex items-center justify-between gap-4 p-4 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 text-[#9CA3AF]" size={16} />
                <Input className="pl-9 h-9 bg-[#F9FAFB] border-[#E5E7EB]" placeholder="搜索编号或技术主题..."
                  value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} />
              </div>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-28 h-9"><SelectValue placeholder="来源" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部来源</SelectItem>
                  <SelectItem value="presale">售前咨询</SelectItem>
                  <SelectItem value="filed">立案</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-28 h-9"><SelectValue placeholder="状态" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="processing">处理中</SelectItem>
                  <SelectItem value="blocked">阻断</SelectItem>
                  <SelectItem value="ready">就绪</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-[#6B7280]">共 <span className="font-medium text-[#111827]">{filteredData.length}</span> 条</div>
          </div>

          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-[#F9FAFB] sticky top-0">
                <TableRow className="text-sm">
                  <TableHead className="w-32 text-[#374151] font-semibold">编号</TableHead>
                  <TableHead className="w-20 text-[#374151] font-semibold">来源</TableHead>
                  <TableHead className="text-[#374151] font-semibold">技术主题</TableHead>
                  <TableHead className="w-24 text-[#374151] font-semibold">专利类型</TableHead>
                  <TableHead className="w-24 text-[#374151] font-semibold">技术领域</TableHead>
                  <TableHead className="w-28 text-[#374151] font-semibold">当前阶段</TableHead>
                  <TableHead className="w-24 text-[#374151] font-semibold">状态</TableHead>
                  <TableHead className="w-20 text-[#374151] font-semibold">风险</TableHead>
                  <TableHead className="w-20 text-center text-[#374151] font-semibold">
                    <div className="flex items-center justify-center gap-1">质量分<ArrowUpDown size={13} className="text-[#9CA3AF]" /></div>
                  </TableHead>
                  <TableHead className="w-20 text-[#374151] font-semibold">工程师</TableHead>
                  <TableHead className="w-20 text-[#374151] font-semibold">销售</TableHead>
                  <TableHead className="w-20 text-[#374151] font-semibold">客服</TableHead>
                  <TableHead className="w-32 text-[#374151] font-semibold">更新时间</TableHead>
                  <TableHead className="w-28 text-center text-[#374151] font-semibold">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}
                    className={`cursor-pointer transition-colors ${item.m06_status === "BLOCKED" ? "bg-[#FEF9F9] hover:bg-[#FEF2F2]" : "hover:bg-[#F5F9FF]"}`}
                    onClick={() => onNavigate(STAGE_ROUTES[item.m06_stage] || "m06-p02-decomposition")}>
                    <TableCell className="font-mono text-sm text-[#6B7280] py-3.5">{item.case_id}</TableCell>
                    <TableCell className="py-3.5">{getSourceBadge(sourceType(item))}</TableCell>
                    <TableCell className="py-3.5"><span className="text-sm font-medium text-[#111827] line-clamp-1">{item.case_name}</span></TableCell>
                    <TableCell className="py-3.5">
                      <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium border-[#D1D5DB] text-[#6B7280]">{item.patent_type}</Badge>
                    </TableCell>
                    <TableCell className="py-3.5"><span className="text-sm text-[#374151]">{item.tech_field}</span></TableCell>
                    <TableCell className="py-3.5">{getStageBadge(item.m06_stage)}</TableCell>
                    <TableCell className="py-3.5">{getStatusBadge(item.m06_status)}</TableCell>
                    <TableCell className="py-3.5">{item.risk_level ? getRiskBadge(item.risk_level) : <span className="text-[#D1D5DB]">—</span>}</TableCell>
                    <TableCell className="text-center py-3.5">
                      {item.quality_score ? (
                        <span className={`text-base font-bold ${item.quality_score >= 85 ? "text-[#16A34A]" : item.quality_score >= 70 ? "text-[#F59E0B]" : "text-[#DC2626]"}`}>{item.quality_score}</span>
                      ) : <span className="text-[#D1D5DB]">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-[#374151] py-3.5">{item.engineer || '-'}</TableCell>
                    <TableCell className="text-sm text-[#6B7280] py-3.5">{item.sales_person || '-'}</TableCell>
                    <TableCell className="text-sm text-[#6B7280] py-3.5">{item.service_rep || '-'}</TableCell>
                    <TableCell className="text-sm text-[#9CA3AF] py-3.5">{item.create_time}</TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" className="h-8 px-3 text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white gap-1"
                          onClick={() => onNavigate(STAGE_ROUTES[item.m06_stage] || "m06-p02-decomposition")}>
                          进入<ChevronRight size={13} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8 border-[#E5E7EB]"><MoreHorizontal size={15} /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem className="text-sm" onClick={() => onNavigate("m06-p02-decomposition")}><Layers size={14} className="mr-2" />查看解构</DropdownMenuItem>
                            <DropdownMenuItem className="text-sm" onClick={() => onNavigate("m06-p03-ai-inspection")}><Brain size={14} className="mr-2" />AI初检</DropdownMenuItem>
                            <DropdownMenuItem className="text-sm" onClick={() => onNavigate("m06-p11-package")}><Package size={14} className="mr-2" />数据包</DropdownMenuItem>
                            <DropdownMenuItem className="text-sm" onClick={() => onNavigate("m06-p13-version")}><Clock size={14} className="mr-2" />版本日志</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB]">
            <div className="text-sm text-[#6B7280]">显示 1-{filteredData.length} 条，共 {total} 条</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled><ChevronLeft size={14} className="mr-1" />上一页</Button>
              <Button variant="outline" size="sm">下一页<ChevronRight size={14} className="ml-1" /></Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
