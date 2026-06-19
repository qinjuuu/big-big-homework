"use client"

import { useState, useEffect } from "react"
import { getDisclosureById, type DisclosureItem } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"
import {
  ArrowLeft,
  Save,
  Sparkles,
  ChevronRight,
  FileText,
  CheckCircle,
  RefreshCw,
  Copy,
  AlertTriangle,
  Zap,
} from "lucide-react"

interface SupplementFastModeProps {
  onBack?: () => void
  onNext?: () => void
  disclosureId?: string | number
}

const sections = [
  { id: "technical-problem", label: "技术问题", required: true },
  { id: "technical-background", label: "技术背景", required: true },
  { id: "existing-defects", label: "现有技术缺点", required: true },
  { id: "invention-purpose", label: "发明目的", required: true },
  { id: "technical-solution", label: "技术方案", required: true },
  { id: "key-points", label: "关键点和欲保护点", required: true },
  { id: "beneficial-effects", label: "有益效果", required: true },
  { id: "actual-product", label: "实际产品", required: false },
  { id: "drawings", label: "图纸材料", required: false },
  { id: "alternatives", label: "替代方案", required: false },
]

export function SupplementFastMode({ onBack, onNext, disclosureId }: SupplementFastModeProps) {
  const [activeSection, setActiveSection] = useState("technical-problem")
  const [editedContent, setEditedContent] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [disclosure, setDisclosure] = useState<DisclosureItem | null>(null)
  const [keywords, setKeywords] = useState<string[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, { suggestion: string; source: string; risks?: string[] }>>({})

  const splitKeywords = (text?: string | null): string[] => {
    if (!text) return []
    return text
      .split(/[\n,，、；;|\s]+/)
      .map(s => s.trim())
      .filter(Boolean)
  }

  useEffect(() => {
    if (!disclosureId) {
      setDisclosure(null)
      setKeywords([])
      setAiSuggestions({})
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await getDisclosureById(disclosureId)
        if (cancelled) return
        setDisclosure(data)
        setKeywords(splitKeywords(data?.innovation_ideas))
        const aiSuggest = data?.ai_suggest as unknown
        if (aiSuggest && typeof aiSuggest === "object") {
          const result: Record<string, { suggestion: string; source: string; risks?: string[] }> = {}
          Object.entries(aiSuggest as Record<string, unknown>).forEach(([k, v]) => {
            if (typeof v === "string") {
              result[k] = { suggestion: v, source: "AI 生成" }
            } else if (v && typeof v === "object") {
              const obj = v as { suggestion?: string; source?: string; risks?: string[] }
              result[k] = {
                suggestion: obj.suggestion || "",
                source: obj.source || "AI 生成",
                risks: obj.risks
              }
            }
          })
          setAiSuggestions(result)
        } else {
          setAiSuggestions({})
        }
      } catch {
        if (!cancelled) {
          setDisclosure(null)
          setKeywords([])
          setAiSuggestions({})
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [disclosureId])

  const getSectionStatus = (sectionId: string) => {
    if (editedContent[sectionId]) return "completed"
    if (aiSuggestions[sectionId]) return "ai-ready"
    return "empty"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "ai-ready":
        return <Sparkles className="h-4 w-4 text-purple-500" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const completedCount = sections.filter(s => editedContent[s.id]).length

  const handleAdopt = (sectionId: string) => {
    const suggestion = aiSuggestions[sectionId]?.suggestion
    if (suggestion) {
      setEditedContent(prev => ({ ...prev, [sectionId]: suggestion }))
    }
  }

  const handleRegenerate = () => {
    setGenerating(true)
    setTimeout(() => setGenerating(false), 1500)
  }

  const currentSuggestion = aiSuggestions[activeSection]
  const currentContent = editedContent[activeSection] || ""

  return (
    <div className="flex flex-col h-full">
      <M06ProgressBar currentStep={3} />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-100 text-purple-700">
              <Zap className="h-3 w-3 mr-1" />
              极速模式
            </Badge>
            <h1 className="text-lg font-semibold">交底书补充</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSaving(true)} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
          <Button variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            生成全部AI建议
          </Button>
          <Button onClick={onNext}>
            生成完整交底书
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm">完成进度</span>
          <span className="text-sm text-muted-foreground">{completedCount}/{sections.length}</span>
        </div>
        <Progress value={(completedCount / sections.length) * 100} className="h-2" />
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Section Nav */}
        <div className="w-56 border-r flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <h2 className="font-medium text-sm">交底模块目录</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {editedContent[section.id] ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    getStatusIcon(getSectionStatus(section.id))
                  )}
                  <span className="flex-1 truncate">{section.label}</span>
                  {section.required && (
                    <span className={`text-xs ${activeSection === section.id ? "text-primary-foreground/70" : "text-red-500"}`}>*</span>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center - AI Suggestion + Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="font-medium">
              {sections.find(s => s.id === activeSection)?.label}
              {sections.find(s => s.id === activeSection)?.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </h2>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* AI Suggestion Card */}
            {currentSuggestion ? (
              <Card className="border-purple-200 bg-purple-50/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      AI建议内容
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={handleRegenerate} disabled={generating}>
                        <RefreshCw className={`h-4 w-4 mr-1 ${generating ? "animate-spin" : ""}`} />
                        重新生成
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleAdopt(activeSection)}>
                        <Copy className="h-4 w-4 mr-1" />
                        采纳建议
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg p-3 text-sm whitespace-pre-wrap border">
                    {currentSuggestion.suggestion}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  暂无 AI 建议
                </CardContent>
              </Card>
            )}

            {/* Final Content Editor */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">最终内容（可编辑）</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={currentContent}
                  onChange={(e) => setEditedContent(prev => ({ ...prev, [activeSection]: e.target.value }))}
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="点击「采纳建议」或手动输入内容..."
                />
                <div className="flex justify-end mt-3">
                  <Button size="sm">
                    <Save className="h-4 w-4 mr-1" />
                    保存模块
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right - Source & Risks */}
        <div className="w-72 border-l flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <h2 className="font-medium text-sm">依据与风险</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Source */}
              {currentSuggestion && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      来源依据
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{currentSuggestion.source}</p>
                  </CardContent>
                </Card>
              )}

              {/* Risks */}
              {currentSuggestion?.risks && currentSuggestion.risks.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      风险提示
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {currentSuggestion.risks.map((risk, index) => (
                        <li key={index} className="text-sm text-yellow-800 flex items-start gap-2">
                          <span>•</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Keywords from inspection */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">初检关键词</CardTitle>
                </CardHeader>
                <CardContent>
                  {keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {keywords.map((kw) => (
                        <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground py-2 text-center">暂无关键词</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
