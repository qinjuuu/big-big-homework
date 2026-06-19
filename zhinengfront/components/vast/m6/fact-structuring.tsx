"use client"

import { useState, useEffect } from "react"
import { getDisclosureById, type DisclosureItem } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft,
  Save,
  Sparkles,
  ChevronRight,
  Plus,
  Trash2,
  GripVertical,
  Link,
  CheckCircle,
  AlertCircle
} from "lucide-react"

interface FactStructuringProps {
  onBack?: () => void
  onNext?: () => void
  disclosureId?: string | number
}

interface StructureNode {
  id: string
  type: string
  content: string
  sourceParaId: string
  isCore: boolean
  status: "draft" | "confirmed"
}

interface ParagraphItem {
  id: string
  content: string
}

export function FactStructuring({ onBack, onNext, disclosureId }: FactStructuringProps) {
  const [activeType, setActiveType] = useState("technical-problem")
  const [saving, setSaving] = useState(false)
  const [disclosure, setDisclosure] = useState<DisclosureItem | null>(null)
  const [paragraphs, setParagraphs] = useState<ParagraphItem[]>([])
  const [nodesData, setNodesData] = useState<Record<string, StructureNode[]>>({
    "technical-problem": [],
    "technical-background": [],
    "technical-solution": [],
    "technical-effect": [],
    "key-protection": [],
    "alternative": []
  })

  useEffect(() => {
    if (!disclosureId) {
      setDisclosure(null)
      setParagraphs([])
      setNodesData({
        "technical-problem": [],
        "technical-background": [],
        "technical-solution": [],
        "technical-effect": [],
        "key-protection": [],
        "alternative": []
      })
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await getDisclosureById(disclosureId)
        if (cancelled) return
        setDisclosure(data)
        const src = data?.source_content || ""
        const paras = src
          .split(/\n\s*\n/)
          .map(s => s.trim())
          .filter(Boolean)
          .map((content, i) => ({ id: `P${i + 1}`, content }))
        setParagraphs(paras)
      } catch {
        if (!cancelled) {
          setDisclosure(null)
          setParagraphs([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [disclosureId])

  const nodeTypes = [
    { id: "technical-problem", label: "技术问题节点", count: nodesData["technical-problem"]?.length || 0, color: "bg-red-100 text-red-700" },
    { id: "technical-background", label: "技术背景节点", count: nodesData["technical-background"]?.length || 0, color: "bg-gray-100 text-gray-700" },
    { id: "technical-solution", label: "技术方案节点", count: nodesData["technical-solution"]?.length || 0, color: "bg-blue-100 text-blue-700" },
    { id: "technical-effect", label: "技术效果节点", count: nodesData["technical-effect"]?.length || 0, color: "bg-green-100 text-green-700" },
    { id: "key-protection", label: "关键保护点节点", count: nodesData["key-protection"]?.length || 0, color: "bg-purple-100 text-purple-700" },
    { id: "alternative", label: "替代方案节点", count: nodesData["alternative"]?.length || 0, color: "bg-orange-100 text-orange-700" }
  ]

  const currentNodes = nodesData[activeType] || []

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 1500)
  }

  const totalNodes = Object.values(nodesData).flat().length
  const confirmedNodes = Object.values(nodesData).flat().filter(n => n.status === "confirmed").length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">交底事实结构化</h1>
            <p className="text-sm text-muted-foreground">将完整交底书内容拆分为可计算、可校验的结构化数据</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "保存中..." : "保存"}
          </Button>
          <Button variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            AI结构化
          </Button>
          <Button onClick={onNext}>
            结构化确认
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-2 border-b bg-muted/30 flex items-center justify-between">
        <span className="text-sm">结构化进度</span>
        <span className="text-sm text-muted-foreground">
          已确认 {confirmedNodes}/{totalNodes} 个节点
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Node Type Nav */}
        <div className="w-56 border-r flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <h2 className="font-medium text-sm">节点类型</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {nodeTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setActiveType(type.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-sm transition-colors ${
                    activeType === type.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <span>{type.label}</span>
                  <Badge variant={activeType === type.id ? "secondary" : "outline"} className="text-xs">
                    {type.count}
                  </Badge>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center - Structure Cards */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="font-medium">
              {nodeTypes.find(t => t.id === activeType)?.label}
            </h2>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              新增节点
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {currentNodes.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center text-sm text-muted-foreground">
                    暂无节点
                  </CardContent>
                </Card>
              )}
              {currentNodes.map((node) => (
                <Card key={node.id} className={node.status === "confirmed" ? "border-green-200" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="cursor-move text-muted-foreground hover:text-foreground">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Textarea
                              defaultValue={node.content}
                              className="min-h-[60px] text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Link className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">来源段落:</span>
                              <Badge variant="outline" className="text-xs">{node.sourceParaId}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox id={`core-${node.id}`} checked={node.isCore} />
                              <label htmlFor={`core-${node.id}`} className="text-xs text-muted-foreground">
                                核心节点
                              </label>
                            </div>
                          </div>
                          <Badge className={node.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                            {node.status === "confirmed" ? (
                              <><CheckCircle className="h-3 w-3 mr-1" />已确认</>
                            ) : (
                              <><AlertCircle className="h-3 w-3 mr-1" />待确认</>
                            )}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right - Source & AI Suggestions */}
        <div className="w-80 border-l flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <h2 className="font-medium text-sm">原文定位 / AI建议</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Source Paragraph */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">原文段落</CardTitle>
                </CardHeader>
                <CardContent>
                  {paragraphs.length === 0 ? (
                    <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground text-center">
                      暂无内容
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {paragraphs.map(p => (
                        <div key={p.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                          <Badge variant="outline" className="mb-2">{p.id}</Badge>
                          <p className="text-muted-foreground whitespace-pre-wrap">{p.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Suggestions */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    AI结构化建议
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground py-2 text-center">暂无 AI 建议</div>
                </CardContent>
              </Card>

              {/* Node Statistics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">节点统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {nodeTypes.map((type) => (
                      <div key={type.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{type.label}</span>
                        <Badge className={type.color}>{type.count}</Badge>
                      </div>
                    ))}
                    <div className="pt-2 border-t mt-2">
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span>总计</span>
                        <span>{totalNodes} 个节点</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
