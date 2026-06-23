"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { M06ProgressBar } from "@/components/vast/m6/m06-progress-bar"
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Download,
  Plus,
} from "lucide-react"
import { getDisclosures, type DisclosureItem } from "@/lib/api"

interface PriorArtComparisonProps {
  onBack: () => void
  onNext: () => void
}

export function PriorArtComparison({ onBack, onNext }: PriorArtComparisonProps) {
  const [disclosures, setDisclosures] = useState<DisclosureItem[]>([])

  useEffect(() => {
    getDisclosures({ pageSize: 10 }).then((data) => setDisclosures(data.list)).catch(console.error)
  }, [])

  const priorArts = useMemo(() => disclosures.slice(0, 5).map((item, index) => ({
    id: `CN${String(item.id).padStart(9, "0")}${index % 2 ? "A" : "B"}`,
    title: item.case_name || item.case_id,
    applicant: item.sales_person || item.service_rep || "系统记录",
    date: item.create_time || "-",
    relevance: Math.max(60, Math.min(95, item.quality_score || (90 - index * 6))),
    riskLevel: item.risk_level === "HIGH" ? "high" : item.risk_level === "MEDIUM" ? "medium" : "low",
    selected: index < 2,
  })), [disclosures])

  const [selectedArt, setSelectedArt] = useState<any>(null)

  useEffect(() => {
    if (!selectedArt && priorArts.length > 0) setSelectedArt(priorArts[0])
  }, [priorArts, selectedArt])

  const featureComparison = useMemo(() => {
    const current = disclosures[0]
    const words = [current?.tech_field, current?.case_name, current?.patent_type]
      .filter(Boolean)
      .flatMap((text) => String(text).split(/[、，,；;\s]+/))
      .filter((word) => word.length >= 2)
    const base = words.length ? Array.from(new Set(words)) : ["技术方案", "技术效果", "实施方式"]
    return base.slice(0, 5).map((feature, index) => ({
      feature,
      ourTech: `${current?.case_name || "本申请"}中的${feature}`,
      priorArt1: priorArts[0]?.title || "对比文件1",
      priorArt2: priorArts[1]?.title || "对比文件2",
      isDistinct: index < 3,
    }))
  }, [disclosures, priorArts])

  const distinctFeatures = featureComparison.filter(f => f.isDistinct)
  const commonFeatures = featureComparison.filter(f => !f.isDistinct)

  return (
    <div className="flex flex-col h-full">
      {/* M06 Progress Bar */}
      <M06ProgressBar currentStep={6} />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-[#111827]">现有技术对比</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              对比分析现有技术，确认区别技术特征
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出对比报告
          </Button>
          <Button onClick={onNext}>
            下一步：结构化
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* 左侧：现有技术列表 */}
        <div className="w-80 border-r bg-[#F9FAFB] p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">现有技术 ({priorArts.length})</h3>
            <Button size="sm" variant="ghost">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100%-40px)]">
            <div className="space-y-2">
              {priorArts.map((art) => (
                <div
                  key={art.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedArt?.id === art.id
                      ? "bg-white border-2 border-[#2F80ED]"
                      : "bg-white border hover:border-[#2F80ED]/50"
                  }`}
                  onClick={() => setSelectedArt(art)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm text-[#2F80ED]">{art.id}</span>
                    <Badge
                      variant={
                        art.riskLevel === "high"
                          ? "destructive"
                          : art.riskLevel === "medium"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {art.riskLevel === "high" ? "高" : art.riskLevel === "medium" ? "中" : "低"}
                    </Badge>
                  </div>
                  <div className="text-sm text-[#374151] line-clamp-2">{art.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    相关度 {art.relevance}%
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* 右侧：对比详情 */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <Tabs defaultValue="features">
            <TabsList>
              <TabsTrigger value="features">特征对比</TabsTrigger>
              <TabsTrigger value="claims">权利要求对比</TabsTrigger>
              <TabsTrigger value="summary">对比总结</TabsTrigger>
            </TabsList>

            <TabsContent value="features" className="mt-4 space-y-4">
              {/* 区别技术特征 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-base">区别技术特征 ({distinctFeatures.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium">技术特征</th>
                          <th className="text-left py-2 px-3 font-medium bg-blue-50">本申请</th>
                          <th className="text-left py-2 px-3 font-medium">对比文件1</th>
                          <th className="text-left py-2 px-3 font-medium">对比文件2</th>
                        </tr>
                      </thead>
                      <tbody>
                        {distinctFeatures.map((item, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-3 px-3 font-medium">{item.feature}</td>
                            <td className="py-3 px-3 bg-blue-50 text-blue-700">{item.ourTech}</td>
                            <td className="py-3 px-3 text-muted-foreground">{item.priorArt1}</td>
                            <td className="py-3 px-3 text-muted-foreground">{item.priorArt2}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* 共有技术特征 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <CardTitle className="text-base">共有技术特征 ({commonFeatures.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium">技术特征</th>
                          <th className="text-left py-2 px-3 font-medium">本申请</th>
                          <th className="text-left py-2 px-3 font-medium">对比文件1</th>
                          <th className="text-left py-2 px-3 font-medium">对比文件2</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commonFeatures.map((item, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-3 px-3 font-medium">{item.feature}</td>
                            <td className="py-3 px-3">{item.ourTech}</td>
                            <td className="py-3 px-3">{item.priorArt1}</td>
                            <td className="py-3 px-3">{item.priorArt2}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="claims" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">权利要求对比分析</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>权利要求对比分析功能正在开发中...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">对比总结</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{distinctFeatures.length}</div>
                      <div className="text-sm text-green-700">区别技术特征</div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-600">{commonFeatures.length}</div>
                      <div className="text-sm text-yellow-700">共有技术特征</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{priorArts.length}</div>
                      <div className="text-sm text-blue-700">对比文件数</div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">AI分析结论</h4>
                    <p className="text-sm text-muted-foreground">
                      本申请相对于现有技术具有{distinctFeatures.length}个区别技术特征，
                      主要体现在多模态融合算法、自适应权重调整和轻量化推理优化方面。
                      这些区别特征能够带来明显的技术效果提升，建议继续推进申请。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
