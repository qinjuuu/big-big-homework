"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"
import {
  ArrowLeft,
  Search,
  Brain,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  ChevronRight,
} from "lucide-react"
import { getDisclosures, type DisclosureItem } from "@/lib/api"

interface SecondSearchProps {
  onBack: () => void
  onNext: () => void
}

export function SecondSearch({ onBack, onNext }: SecondSearchProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [searchComplete, setSearchComplete] = useState(true)
  const [disclosures, setDisclosures] = useState<DisclosureItem[]>([])

  useEffect(() => {
    getDisclosures({ pageSize: 20 }).then((data) => setDisclosures(data.list)).catch(console.error)
  }, [])

  const keywordComparison = useMemo(() => {
    const words = disclosures
      .flatMap((item) => [item.tech_field, item.case_name, item.patent_type])
      .filter(Boolean)
      .flatMap((text) => String(text).split(/[、，,；;\s]+/))
      .filter((word) => word.length >= 2)
    const unique = Array.from(new Set(words))
    return {
      initial: unique.slice(0, 8),
      added: unique.slice(8, 12),
      removed: [],
    }
  }, [disclosures])

  const searchResults = useMemo(() => disclosures.slice(0, 6).map((item, index) => ({
    id: `CN${String(item.id).padStart(9, "0")}${index % 2 ? "A" : "B"}`,
    title: item.case_name || item.case_id,
    applicant: item.sales_person || item.service_rep || "系统记录",
    date: item.create_time || "-",
    relevance: Math.max(60, Math.min(95, item.quality_score || (90 - index * 5))),
    riskLevel: item.risk_level === "HIGH" ? "high" : item.risk_level === "MEDIUM" ? "medium" : "low",
    isNew: index % 2 === 0,
  })), [disclosures])

  const handleSearch = () => {
    setIsSearching(true)
    setTimeout(() => {
      setIsSearching(false)
      setSearchComplete(true)
    }, 2000)
  }

  return (
    <div className="flex flex-col h-full">
      {/* M06 Progress Bar */}
      <M06ProgressBar currentStep={5} />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-[#111827]">二次检索</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              完整交底书生成后进行二次AI检索，确认新颖性和创造性风险
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSearch} disabled={isSearching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isSearching ? "animate-spin" : ""}`} />
            {isSearching ? "检索中..." : "重新检索"}
          </Button>
          <Button onClick={onNext}>
            下一步：现有技术对比
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* 重要提示 */}
        <Alert className="border-blue-200 bg-blue-50">
          <Brain className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            二次检索基于完整交底书内容，相比初检能发现更多相关现有技术。
            新增关键词来自交底补充阶段的新内容。
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-3 gap-6">
          {/* 左侧：关键词对比 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">关键词对比</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-[#374151] mb-2">
                  初检关键词 ({keywordComparison.initial.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {keywordComparison.initial.map((kw) => (
                    <Badge key={kw} variant="outline" className="text-xs">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-green-600 mb-2">
                  新增关键词 ({keywordComparison.added.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {keywordComparison.added.map((kw) => (
                    <Badge key={kw} className="text-xs bg-green-100 text-green-700 border-green-200">
                      + {kw}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">关键词总数</span>
                  <span className="font-medium">{keywordComparison.initial.length + keywordComparison.added.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 中央：检索结果 */}
          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">检索结果</CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    共 {searchResults.length} 条，
                    <span className="text-green-600 font-medium">
                      新发现 {searchResults.filter(r => r.isNew).length} 条
                    </span>
                  </span>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    导出
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      result.isNew ? "bg-green-50 border-green-200" : "bg-[#F9FAFB]"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#2F80ED]">{result.id}</span>
                        {result.isNew && (
                          <Badge className="text-xs bg-green-100 text-green-700">新发现</Badge>
                        )}
                      </div>
                      <div className="text-sm text-[#374151] mt-1">{result.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {result.applicant} | {result.date}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">相关度 {result.relevance}%</div>
                      </div>
                      <Badge
                        variant={
                          result.riskLevel === "high"
                            ? "destructive"
                            : result.riskLevel === "medium"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {result.riskLevel === "high"
                          ? "高风险"
                          : result.riskLevel === "medium"
                            ? "中风险"
                            : "低风险"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 风险评估对比 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">风险评估对比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center p-4 bg-[#F9FAFB] rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">初检新颖性</div>
                <div className="text-2xl font-bold text-[#10B981]">85</div>
              </div>
              <div className="text-center p-4 bg-[#F9FAFB] rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">二次新颖性</div>
                <div className="text-2xl font-bold text-[#F59E0B]">78</div>
                <div className="text-xs text-red-500 mt-1">-7</div>
              </div>
              <div className="text-center p-4 bg-[#F9FAFB] rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">初检创造性</div>
                <div className="text-2xl font-bold text-[#F59E0B]">72</div>
              </div>
              <div className="text-center p-4 bg-[#F9FAFB] rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">二次创造性</div>
                <div className="text-2xl font-bold text-[#F59E0B]">70</div>
                <div className="text-xs text-red-500 mt-1">-2</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 工程师结论 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">工程师结论</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-[#F9FAFB]">
                <input type="radio" name="conclusion" defaultChecked />
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    继续推进
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">风险可控，继续进入结构化阶段</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-[#F9FAFB]">
                <input type="radio" name="conclusion" />
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    需要调整
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">需调整技术方案，返回交底补充</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-[#F9FAFB]">
                <input type="radio" name="conclusion" />
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    高风险警告
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">存在重大风险，建议客户确认</div>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
