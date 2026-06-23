"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  Plus,
  Save,
  CheckCircle,
  AlertCircle,
  Link2,
  ChevronRight,
  ChevronDown,
  GitBranch,
  FileText,
  Lightbulb,
  Sparkles,
  Image,
} from "lucide-react"
import { getWritingById } from "@/lib/api"
import { ClaimsTemplateSelector } from "@/components/vast/claims-template-selector"
import { aiGenerateDrawing, type DrawingGenerationResult } from "@/lib/api"

interface ClaimsWritingPageProps {
  onBack: () => void
  writingId?: string | number
}

interface Claim {
  id: string
  number: number
  type: "independent" | "dependent"
  text: string
  refClaim?: number
  supportStatus: "supported" | "weak" | "unsupported" | "unchecked"
  supportParagraphs: string[]
}

interface Alternative {
  id: string
  title: string
  content: string
  source: string
}

// 解析 claim_content 文本为结构化 Claim 数组
function parseClaims(text?: string | null): Claim[] {
  if (!text || typeof text !== "string") return []
  const trimmed = text.trim()
  if (!trimmed) return []

  // 1) 优先尝试 JSON
  try {
    const json = JSON.parse(trimmed)
    if (Array.isArray(json)) {
      return json
        .map((item: any, idx: number) => {
          const number = Number(item.number ?? idx + 1)
          const type = item.type === "dependent" ? "dependent" : "independent"
          return {
            id: `c${number}`,
            number,
            type,
            text: String(item.text ?? ""),
            refClaim: item.refClaim != null ? Number(item.refClaim) : undefined,
            supportStatus: (item.supportStatus as Claim["supportStatus"]) || "unchecked",
            supportParagraphs: Array.isArray(item.supportParagraphs) ? item.supportParagraphs : [],
          } as Claim
        })
        .filter((c) => c.text)
    }
  } catch {
    /* 不是 JSON，按文本解析 */
  }

  // 2) 文本：按 "1." "2." 之类分隔
  const blocks = trimmed
    .split(/\n(?=\s*\d+[\.\、])/)
    .map((s) => s.trim())
    .filter(Boolean)
  return blocks.map((blk, idx) => {
    const m = blk.match(/^\s*(\d+)[\.\、]\s*([\s\S]*)$/)
    const number = m ? parseInt(m[1], 10) : idx + 1
    const body = m ? m[2] : blk
    const refMatch = body.match(/根据权利要求\s*(\d+)/)
    const isDep = !!refMatch
    return {
      id: `c${number}`,
      number,
      type: isDep ? "dependent" : "independent",
      text: body,
      refClaim: refMatch ? parseInt(refMatch[1], 10) : undefined,
      supportStatus: "unchecked",
      supportParagraphs: [],
    }
  })
}

// 从 writing.repeat_check_info 或 spec_content 中提取替代方案
function parseAlternatives(writing: any): Alternative[] {
  if (!writing) return []
  const candidates: any[] = []
  // 后端可能直接放 alternatives 字段
  if (Array.isArray(writing.alternatives)) {
    return writing.alternatives.map((a: any, idx: number) => ({
      id: a.id || `alt${idx + 1}`,
      title: String(a.title || `替代方案${idx + 1}`),
      content: String(a.content || ""),
      source: String(a.source || ""),
    }))
  }
  // 否则尝试从 repeat_check_info 中解析
  if (typeof writing.repeat_check_info === "string" && writing.repeat_check_info.trim()) {
    try {
      const json = JSON.parse(writing.repeat_check_info)
      if (Array.isArray(json?.alternatives)) {
        return json.alternatives.map((a: any, idx: number) => ({
          id: a.id || `alt${idx + 1}`,
          title: String(a.title || `替代方案${idx + 1}`),
          content: String(a.content || ""),
          source: String(a.source || ""),
        }))
      }
    } catch {
      /* ignore */
    }
  }
  return candidates
}

const getSupportBadge = (status: string) => {
  switch (status) {
    case "supported":
      return (
        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
          <CheckCircle className="h-3 w-3" />
          有支持
        </span>
      )
    case "weak":
      return (
        <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
          <AlertCircle className="h-3 w-3" />
          弱支持
        </span>
      )
    case "unsupported":
      return (
        <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
          <AlertCircle className="h-3 w-3" />
          无支持
        </span>
      )
    default:
      return (
        <span className="text-xs text-[#9CA3AF] bg-[#F0F3F8] px-2 py-0.5 rounded">
          未检查
        </span>
      )
  }
}

export function ClaimsWritingPage({ onBack, writingId }: ClaimsWritingPageProps) {
  const [claims, setClaims] = useState<Claim[]>([])
  const [alternatives, setAlternatives] = useState<Alternative[]>([])
  const [writing, setWriting] = useState<any | null>(null)
  const [selectedClaim, setSelectedClaim] = useState<string>("")
  const [showHierarchy, setShowHierarchy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [isGeneratingDrawing, setIsGeneratingDrawing] = useState(false)
  const [drawingResult, setDrawingResult] = useState<DrawingGenerationResult | null>(null)

  useEffect(() => {
    if (!writingId) {
      setWriting(null)
      setClaims([])
      setAlternatives([])
      setSelectedClaim("")
      return
    }
    setLoading(true)
    getWritingById(writingId)
      .then((data) => {
        setWriting(data)
        const parsed = parseClaims((data as any)?.claim_content)
        setClaims(parsed)
        if (parsed.length > 0) setSelectedClaim(parsed[0].id)
        setAlternatives(parseAlternatives(data))
      })
      .catch((err) => {
        console.error("加载撰写记录失败:", err)
        setWriting(null)
        setClaims([])
        setAlternatives([])
      })
      .finally(() => setLoading(false))
  }, [writingId])

  const currentClaim = claims.find((c) => c.id === selectedClaim)
  const independentClaims = claims.filter((c) => c.type === "independent")

  const handleSelectTemplate = (template: any) => {
    const newClaims: Claim[] = []
    const independent = template.independent_claim
    const dependents = template.dependent_claims?.split('\n').filter((s: string) => s.trim()) || []
    const newNumber = 1
    newClaims.push({
      id: `c${newNumber}`,
      number: newNumber,
      type: "independent",
      text: independent,
      supportStatus: "unchecked",
      supportParagraphs: [],
    })
    dependents.forEach((dep: string, idx: number) => {
      const refMatch = dep.match(/根据权利要求\s*(\d+)/)
      newClaims.push({
        id: `c${idx + 2}`,
        number: idx + 2,
        type: "dependent",
        text: dep,
        refClaim: refMatch ? parseInt(refMatch[1], 10) : 1,
        supportStatus: "unchecked",
        supportParagraphs: [],
      })
    })
    setClaims(newClaims)
    if (newClaims.length > 0) setSelectedClaim(newClaims[0].id)
  }

  const handleGenerateDrawing = async () => {
    if (!writing?.spec_content) return
    setIsGeneratingDrawing(true)
    try {
      const result = await aiGenerateDrawing({ caseId: writing.case_id, specContent: writing.spec_content })
      setDrawingResult(result)
    } catch (err) {
      console.error('AI附图生成失败:', err)
    } finally {
      setIsGeneratingDrawing(false)
    }
  }

  const handleAddIndependent = () => {
    const newNumber = claims.length === 0 ? 1 : Math.max(...claims.map((c) => c.number)) + 1
    const newClaim: Claim = {
      id: `c${newNumber}`,
      number: newNumber,
      type: "independent",
      text: "",
      supportStatus: "unchecked",
      supportParagraphs: [],
    }
    setClaims([...claims, newClaim])
    setSelectedClaim(newClaim.id)
  }

  const handleAddDependent = () => {
    if (!currentClaim) return
    const newNumber = Math.max(...claims.map((c) => c.number)) + 1
    const newClaim: Claim = {
      id: `c${newNumber}`,
      number: newNumber,
      type: "dependent",
      text: `根据权利要求${currentClaim.number}所述的，其特征在于，`,
      refClaim: currentClaim.number,
      supportStatus: "unchecked",
      supportParagraphs: [],
    }
    setClaims([...claims, newClaim])
    setSelectedClaim(newClaim.id)
  }

  const updateClaimText = (text: string) => {
    setClaims(
      claims.map((c) => (c.id === selectedClaim ? { ...c, text } : c))
    )
  }

  const headerTitle = writing?.case_name || "权利要求书撰写"
  const headerSub = writing?.case_id ? `案件：${writing.case_id}` : (writingId ? "加载中..." : "未传入 writingId")

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F5F7FA]">
      {/* 顶部操作栏 */}
      <div className="h-14 px-4 bg-white border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-sm font-semibold text-[#111827]">{headerTitle}</h1>
            <p className="text-xs text-[#9CA3AF]">{headerSub}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTemplateSelector(true)}>
            <FileText className="h-4 w-4 mr-2" />
            模板库
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddIndependent}>
            <Plus className="h-4 w-4 mr-2" />
            新增独权
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddDependent} disabled={!currentClaim}>
            <Plus className="h-4 w-4 mr-2" />
            新增从权
          </Button>
          <Button variant="outline" size="sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            支持检查
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowHierarchy(!showHierarchy)}>
            <GitBranch className="h-4 w-4 mr-2" />
            层级图
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerateDrawing} disabled={isGeneratingDrawing}>
            {isGeneratingDrawing ? <Sparkles className="h-4 w-4 mr-2 animate-spin" /> : <Image className="h-4 w-4 mr-2" />}
            AI附图
          </Button>
          <Button size="sm">
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* 左侧：权利要求树 */}
        <Card className="w-72 flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">权利要求树</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="p-3 space-y-1">
                {loading ? (
                  <div className="text-xs text-[#9CA3AF] text-center py-6">加载中...</div>
                ) : independentClaims.length === 0 ? (
                  <div className="text-xs text-[#9CA3AF] text-center py-6">暂无权利要求</div>
                ) : independentClaims.map((indClaim) => {
                  const dependentClaims = claims.filter(
                    (c) => c.type === "dependent" && c.refClaim === indClaim.number
                  )
                  return (
                    <div key={indClaim.id}>
                      <div
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          selectedClaim === indClaim.id
                            ? "bg-[#EAF4FF] text-[#2F80ED]"
                            : "hover:bg-[#F5F7FA]"
                        }`}
                        onClick={() => setSelectedClaim(indClaim.id)}
                      >
                        {dependentClaims.length > 0 ? (
                          <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[#D1D5DB]" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">权利要求 {indClaim.number}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-[#2F80ED] text-white">
                              独权
                            </span>
                          </div>
                        </div>
                        {getSupportBadge(indClaim.supportStatus)}
                      </div>
                      {dependentClaims.length > 0 && (
                        <div className="ml-6 space-y-1 mt-1">
                          {dependentClaims.map((depClaim) => (
                            <div
                              key={depClaim.id}
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                selectedClaim === depClaim.id
                                  ? "bg-[#EAF4FF] text-[#2F80ED]"
                                  : "hover:bg-[#F5F7FA]"
                              }`}
                              onClick={() => setSelectedClaim(depClaim.id)}
                            >
                              <ChevronRight className="h-4 w-4 text-[#D1D5DB]" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">权利要求 {depClaim.number}</span>
                                  <span className="text-xs text-[#9CA3AF]">
                                    引用{depClaim.refClaim}
                                  </span>
                                </div>
                              </div>
                              {getSupportBadge(depClaim.supportStatus)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 中部：权利要求正文编辑区 */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {currentClaim ? `权利要求 ${currentClaim.number}` : "请选择权利要求"}
                {currentClaim && (
                  <span className="ml-2 text-xs font-normal text-[#6B7280]">
                    {currentClaim.type === "independent" ? "独立权利要求" : "从属权利要求"}
                  </span>
                )}
              </CardTitle>
              {currentClaim && getSupportBadge(currentClaim.supportStatus)}
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 flex flex-col">
            {currentClaim?.type === "dependent" && (
              <div className="mb-4">
                <label className="text-sm text-[#6B7280] mb-2 block">引用关系</label>
                <Select
                  value={String(currentClaim.refClaim ?? "")}
                  onValueChange={(v) => {
                    setClaims(
                      claims.map((c) =>
                        c.id === selectedClaim ? { ...c, refClaim: parseInt(v) } : c
                      )
                    )
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {claims
                      .filter((c) => c.number < (currentClaim?.number || 0))
                      .map((c) => (
                        <SelectItem key={c.id} value={String(c.number)}>
                          权利要求 {c.number}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Textarea
              className="flex-1 min-h-[300px] text-sm leading-relaxed resize-none"
              value={currentClaim?.text || ""}
              onChange={(e) => updateClaimText(e.target.value)}
              placeholder={currentClaim ? "请输入权利要求内容..." : "暂无可编辑权利要求"}
              disabled={!currentClaim}
            />
            <div className="mt-4 flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={!currentClaim}>
                <Link2 className="h-4 w-4 mr-2" />
                选择支持段落
              </Button>
              <div className="text-xs text-[#9CA3AF]">
                字数：{currentClaim?.text.length || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 右侧：说明书支持关系 / 替代方案素材 */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* 支持段落 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#2F80ED]" />
                说明书支持
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentClaim?.supportParagraphs.length ? (
                <div className="space-y-2">
                  {currentClaim.supportParagraphs.map((para, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded bg-[#F5F7FA] text-xs text-[#374151] cursor-pointer hover:bg-[#EAF4FF]"
                    >
                      <Link2 className="h-3 w-3 text-[#2F80ED]" />
                      {para}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-[#9CA3AF]">
                  {currentClaim?.supportStatus === "unsupported" ? (
                    <div className="text-red-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      无说明书支持，请补充说明书内容
                    </div>
                  ) : (
                    "暂无支持段落"
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 替代方案素材 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-orange-500" />
                替代方案素材
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                {alternatives.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#9CA3AF]">暂无可选方案</div>
                ) : (
                  <div className="space-y-3">
                    {alternatives.map((alt) => (
                      <div
                        key={alt.id}
                        className="p-3 rounded border border-border hover:border-[#2F80ED] cursor-pointer transition-colors"
                      >
                        <div className="text-sm font-medium text-[#111827] mb-1">{alt.title}</div>
                        <p className="text-xs text-[#6B7280] line-clamp-2">{alt.content}</p>
                        {alt.source && (
                          <div className="text-xs text-[#9CA3AF] mt-2 flex items-center gap-1">
                            <Link2 className="h-3 w-3" />
                            {alt.source}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {showTemplateSelector && (
        <ClaimsTemplateSelector
          onSelect={handleSelectTemplate}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}

      {drawingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">AI附图建议</h3>
              <Button variant="ghost" size="sm" onClick={() => setDrawingResult(null)}>关闭</Button>
            </div>
            <div className="space-y-3 text-sm">
              <div><strong>图号：</strong>{drawingResult.figureNumber}</div>
              <div><strong>建议：</strong>{drawingResult.drawingSuggestion}</div>
              <div><strong>关键元素：</strong>{drawingResult.keyElements.join('、')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
