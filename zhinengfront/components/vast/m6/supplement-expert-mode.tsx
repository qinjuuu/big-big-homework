"use client"

import { useState, useEffect } from "react"
import { getDisclosureById, type DisclosureItem } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"
import {
  ArrowLeft,
  Save,
  Sparkles,
  ChevronRight,
  FileText,
  CheckCircle,
  AlertTriangle,
  Crown,
  Shield,
  Target,
  RefreshCw,
  Copy,
  XCircle,
  Lightbulb,
} from "lucide-react"

interface SupplementExpertModeProps {
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

interface PriorArtComparison {
  similar: Array<{ feature: string; priorArt: string; similarity: string }>
  different: Array<{ feature: string; description: string }>
}

interface ProtectionSuggestion {
  id: number
  point: string
  priority: string
  adopted: boolean
}

interface AlternativeSuggestion {
  id: number
  original: string
  alternative: string
  reason: string
}

interface ValidationResults {
  passed: string[]
  warnings: string[]
  blocked: string[]
}

const SECTION_FIELD_MAP: Record<string, keyof DisclosureItem> = {
  "technical-problem": "tech_problem",
  "technical-background": "background_tech",
  "existing-defects": "defects",
  "invention-purpose": "purpose",
  "technical-solution": "solution",
  "key-points": "keypoints",
  "beneficial-effects": "effect",
  "actual-product": "alternatives",
  "drawings": "drawings",
  "alternatives": "alternatives",
}

export function SupplementExpertMode({ onBack, onNext, disclosureId }: SupplementExpertModeProps) {
  const [activeSection, setActiveSection] = useState("technical-problem")
  const [editedContent, setEditedContent] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [rightTab, setRightTab] = useState("ai-suggestion")
  const [keywords, setKeywords] = useState<string[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, { suggestion: string; source: string }>>({})
  const [priorArtComparison, setPriorArtComparison] = useState<PriorArtComparison>({ similar: [], different: [] })
  const [protectionSuggestions, setProtectionSuggestions] = useState<ProtectionSuggestion[]>([])
  const [alternativeSuggestions, setAlternativeSuggestions] = useState<AlternativeSuggestion[]>([])
  const [validationResults, setValidationResults] = useState<ValidationResults>({ passed: [], warnings: [], blocked: [] })

  const splitKeywords = (text?: string | null): string[] => {
    if (!text) return []
    return text
      .split(/[\n,，、；;|\s]+/)
      .map(s => s.trim())
      .filter(Boolean)
  }

  useEffect(() => {
    if (!disclosureId) {
      setEditedContent({})
      setKeywords([])
      setAiSuggestions({})
      setPriorArtComparison({ similar: [], different: [] })
      setProtectionSuggestions([])
      setAlternativeSuggestions([])
      setValidationResults({ passed: [], warnings: [], blocked: [] })
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await getDisclosureById(disclosureId)
        if (cancelled) return
        // 加载已有章节内容
        const contents: Record<string, string> = {}
        Object.entries(SECTION_FIELD_MAP).forEach(([sectionId, field]) => {
          const v = data?.[field]
          if (typeof v === "string" && v) contents[sectionId] = v
        })
        setEditedContent(contents)
        setKeywords(splitKeywords(data?.innovation_ideas))
        // 解析 ai_suggest（后端可能返回字符串或对象）
        const aiSuggest = data?.ai_suggest as unknown
        if (aiSuggest && typeof aiSuggest === "object") {
          const result: Record<string, { suggestion: string; source: string }> = {}
          Object.entries(aiSuggest as Record<string, unknown>).forEach(([k, v]) => {
            if (typeof v === "string") {
              result[k] = { suggestion: v, source: "AI 生成" }
            } else if (v && typeof v === "object") {
              const obj = v as { suggestion?: string; source?: string }
              result[k] = {
                suggestion: obj.suggestion || "",
                source: obj.source || "AI 生成"
              }
            }
          })
          setAiSuggestions(result)
        } else {
          setAiSuggestions({})
        }
        // 其他建议数据后端暂未提供，保持空
        setPriorArtComparison({ similar: [], different: [] })
        setProtectionSuggestions([])
        setAlternativeSuggestions([])
        setValidationResults({ passed: [], warnings: [], blocked: [] })
      } catch {
        if (!cancelled) {
          setEditedContent({})
          setKeywords([])
          setAiSuggestions({})
          setPriorArtComparison({ similar: [], different: [] })
          setProtectionSuggestions([])
          setAlternativeSuggestions([])
          setValidationResults({ passed: [], warnings: [], blocked: [] })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [disclosureId])

  const getSectionStatus = (sectionId: string): "completed" | "in-progress" | "empty" => {
    if (editedContent[sectionId]) return "completed"
    return "empty"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in-progress":
        return <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const completedCount = sections.filter(s => editedContent[s.id]).length
  const currentAiSuggestion = aiSuggestions[activeSection]

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
            <Badge className="bg-orange-100 text-orange-700">
              <Crown className="h-3 w-3 mr-1" />
              专家模式
            </Badge>
            <h1 className="text-lg font-semibold">交底书补充</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            AI建议
          </Button>
          <Button variant="outline" size="sm">
            <Target className="h-4 w-4 mr-2" />
            检索对比
          </Button>
          <Button variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            实时校验
          </Button>
          <Button variant="outline" onClick={() => setSaving(true)} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            保存
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
          <div className="flex items-center gap-4">
            <span className="text-sm">完成进度 {completedCount}/{sections.length}</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {validationResults.passed.length} 通过
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                {validationResults.warnings.length} 警告
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-500" />
                {validationResults.blocked.length} 阻断
              </span>
            </div>
          </div>
        </div>
        <Progress value={(completedCount / sections.length) * 100} className="h-2" />
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Section Nav + Feature Tree */}
        <div className="w-60 border-r flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <h2 className="font-medium text-sm">模块与特征</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              <div className="text-xs text-muted-foreground px-2 py-1">交底模块</div>
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

              {/* 区别技术特征 */}
              <div className="text-xs text-muted-foreground px-2 py-1 mt-4">区别技术特征</div>
              {priorArtComparison.different.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">暂无</div>
              ) : (
                priorArtComparison.different.map((item, index) => (
                  <div key={index} className="px-2 py-1.5 text-xs bg-blue-50 rounded mb-1 mx-1">
                    <div className="font-medium text-blue-700">{item.feature}</div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Center - Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="font-medium">
              {sections.find(s => s.id === activeSection)?.label}
              {sections.find(s => s.id === activeSection)?.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm">
                <Sparkles className="h-4 w-4 mr-1" />
                AI生成
              </Button>
              <Button variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                重新生成
              </Button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            <Textarea
              value={editedContent[activeSection] || ""}
              onChange={(e) => setEditedContent(prev => ({ ...prev, [activeSection]: e.target.value }))}
              className="min-h-[400px] font-mono text-sm"
              placeholder="请输入内容或使用AI生成..."
            />
            <div className="flex justify-end mt-3">
              <Button size="sm">
                <Save className="h-4 w-4 mr-1" />
                保存模块
              </Button>
            </div>
          </div>
        </div>

        {/* Right - Expert Assist Panel */}
        <div className="w-80 border-l flex flex-col">
          <Tabs value={rightTab} onValueChange={setRightTab} className="flex flex-col h-full">
            <TabsList className="m-2 grid grid-cols-4">
              <TabsTrigger value="ai-suggestion" className="text-xs">AI建议</TabsTrigger>
              <TabsTrigger value="prior-art" className="text-xs">技术对比</TabsTrigger>
              <TabsTrigger value="protection" className="text-xs">保护点</TabsTrigger>
              <TabsTrigger value="validation" className="text-xs">校验</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              {/* AI建议 */}
              <TabsContent value="ai-suggestion" className="p-4 space-y-4 m-0">
                {currentAiSuggestion ? (
                  <>
                    <Card className="border-purple-200 bg-purple-50/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-500" />
                          AI补充建议
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p className="text-muted-foreground mb-2 whitespace-pre-wrap">{currentAiSuggestion.suggestion}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditedContent(prev => ({ ...prev, [activeSection]: currentAiSuggestion.suggestion }))}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          应用建议
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">补充理由</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        {currentAiSuggestion.source}
                      </CardContent>
                    </Card>

                    {keywords.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">初检关键词</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-1">
                            {keywords.map((kw) => (
                              <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">
                      暂无 AI 建议
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* 现有技术对比 */}
              <TabsContent value="prior-art" className="p-4 space-y-4 m-0">
                {priorArtComparison.similar.length === 0 && priorArtComparison.different.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">
                      暂无现有技术对比
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {priorArtComparison.similar.length > 0 && (
                      <Card className="border-red-200 bg-red-50/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            相似点（风险）
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {priorArtComparison.similar.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm py-1 border-b last:border-0">
                              <span>{item.feature}</span>
                              <Badge variant="destructive" className="text-xs">{item.similarity}</Badge>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {priorArtComparison.different.length > 0 && (
                      <Card className="border-green-200 bg-green-50/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            差异点（优势）
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {priorArtComparison.different.map((item, index) => (
                            <div key={index} className="text-sm py-1 border-b last:border-0">
                              <div className="font-medium">{item.feature}</div>
                              <div className="text-xs text-muted-foreground">{item.description}</div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              {/* 保护点建议 */}
              <TabsContent value="protection" className="p-4 space-y-4 m-0">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      保护点建议
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {protectionSuggestions.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-2 text-center">暂无保护点建议</div>
                    ) : (
                      protectionSuggestions.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex-1">
                            <div className="text-sm">{item.point}</div>
                            <Badge variant="outline" className="text-xs mt-1">{item.priority}</Badge>
                          </div>
                          <Button size="sm" variant="ghost">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      替代方案建议
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {alternativeSuggestions.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-2 text-center">暂无替代方案建议</div>
                    ) : (
                      alternativeSuggestions.map((item) => (
                        <div key={item.id} className="p-2 bg-muted/50 rounded text-sm">
                          <div><span className="text-muted-foreground">原方案:</span> {item.original}</div>
                          <div><span className="text-muted-foreground">替代:</span> {item.alternative}</div>
                          <div className="text-xs text-blue-600 mt-1">{item.reason}</div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 完整性校验 */}
              <TabsContent value="validation" className="p-4 space-y-4 m-0">
                <Card className="border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      通过项 ({validationResults.passed.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {validationResults.passed.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-1 text-center">暂无</div>
                    ) : (
                      validationResults.passed.map((item, index) => (
                        <div key={index} className="text-sm py-1 text-green-700">{item}</div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="border-yellow-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      警告项 ({validationResults.warnings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {validationResults.warnings.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-1 text-center">暂无</div>
                    ) : (
                      validationResults.warnings.map((item, index) => (
                        <div key={index} className="text-sm py-1 text-yellow-700">{item}</div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      阻断项 ({validationResults.blocked.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {validationResults.blocked.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-1 text-center">暂无</div>
                    ) : (
                      validationResults.blocked.map((item, index) => (
                        <div key={index} className="text-sm py-1 text-red-700">{item}</div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
