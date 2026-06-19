"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  Sparkles,
  RefreshCw,
  Check,
  Edit3,
  AlertTriangle,
  Link2,
  Loader2,
  FileText,
} from "lucide-react"
import { getWritingById } from "@/lib/api"

interface SpecDraftPageProps {
  onBack: () => void
  onEdit: () => void
  writingId?: string | number
}

// 章节配置（UI 配置，可保留）：id 与 writing 字段映射
const CHAPTERS: Array<{
  id: string
  label: string
  field: string
}> = [
  { id: "tech-field", label: "技术领域", field: "spec_tech_field" },
  { id: "background", label: "背景技术", field: "spec_background" },
  { id: "summary", label: "发明内容", field: "spec_summary" },
  { id: "drawings", label: "附图说明", field: "spec_drawings" },
  { id: "embodiment", label: "具体实施方式", field: "spec_embodiment" },
  { id: "effects", label: "有益效果", field: "spec_effects" },
]

interface ChapterContent {
  content: string
  sources: string[]
  risks: string[]
}

function buildChapterContents(writing: any): Record<string, ChapterContent> {
  const result: Record<string, ChapterContent> = {}
  CHAPTERS.forEach((c) => {
    let content = ""
    if (writing) {
      const direct = writing[c.field]
      if (typeof direct === "string" && direct.trim()) {
        content = direct
      } else if (typeof writing.spec_content === "string" && writing.spec_content.trim()) {
        // 兜底：从 spec_content 中按章节标题切片
        content = extractSection(writing.spec_content, c.label)
      }
    }
    result[c.id] = {
      content,
      sources: [],
      risks: [],
    }
  })
  return result
}

function extractSection(spec: string, sectionLabel: string): string {
  // 简单按章节标题切片
  const labels = CHAPTERS.map((c) => c.label)
  const escaped = labels.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const re = new RegExp(`(?:^|\\n)\\s*${sectionLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[:：\\n]([\\s\\S]*?)(?=(?:\\n\\s*(?:${escaped.join("|")})\\s*[:：\\n])|$)`, "m")
  const m = spec.match(re)
  return m ? m[1].trim() : ""
}

export function SpecDraftPage({ onBack, onEdit, writingId }: SpecDraftPageProps) {
  const [patentType, setPatentType] = useState("invention")
  const [applyMethod, setApplyMethod] = useState("preliminary")
  const [template, setTemplate] = useState("system")
  const [selectedChapters, setSelectedChapters] = useState(CHAPTERS.map((c) => c.id))
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeChapter, setActiveChapter] = useState("tech-field")
  const [writing, setWriting] = useState<any | null>(null)
  const [chapterContents, setChapterContents] = useState<Record<string, ChapterContent>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!writingId) {
      setWriting(null)
      setChapterContents({})
      return
    }
    setLoading(true)
    getWritingById(writingId)
      .then((data) => {
        setWriting(data)
        setChapterContents(buildChapterContents(data))
      })
      .catch((err) => {
        console.error("加载撰写记录失败:", err)
        setWriting(null)
        setChapterContents({})
      })
      .finally(() => setLoading(false))
  }, [writingId])

  const generated = Object.values(chapterContents).some((c) => c.content)

  const handleGenerate = () => {
    // 重新拉一次，模拟"重新生成"
    if (!writingId) return
    setIsGenerating(true)
    getWritingById(writingId)
      .then((data) => {
        setWriting(data)
        setChapterContents(buildChapterContents(data))
      })
      .catch((err) => console.error(err))
      .finally(() => setIsGenerating(false))
  }

  const toggleChapter = (id: string) => {
    setSelectedChapters((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const headerTitle = writing?.case_name || "说明书 AI 初稿"
  const headerSub = writing?.case_id ? `案件：${writing.case_id}` : (writingId ? "加载中..." : "未传入 writingId")
  const activeContent = chapterContents[activeChapter]

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
          {!generated ? (
            <Button onClick={handleGenerate} disabled={isGenerating || !writingId}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  生成初稿
                </>
              )}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleGenerate}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重新加载
              </Button>
              <Button variant="outline">
                <Check className="h-4 w-4 mr-2" />
                接受初稿
              </Button>
              <Button onClick={onEdit}>
                <Edit3 className="h-4 w-4 mr-2" />
                进入编辑
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* 左侧：生成配置 */}
        <Card className="w-72 flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">初稿生成配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">专利类型</Label>
              <Select value={patentType} onValueChange={setPatentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invention">发明专利</SelectItem>
                  <SelectItem value="utility">实用新型</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">发明申请方式</Label>
              <Select value={applyMethod} onValueChange={setApplyMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preliminary">预先审查</SelectItem>
                  <SelectItem value="priority">优先审查</SelectItem>
                  <SelectItem value="normal">普通申请</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">模板选择</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">系统默认模板</SelectItem>
                  <SelectItem value="electronics">电子信息模板</SelectItem>
                  <SelectItem value="mechanical">机械工程模板</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm">生成范围</Label>
              <div className="space-y-2">
                {CHAPTERS.map((chapter) => (
                  <div key={chapter.id} className="flex items-center gap-2">
                    <Checkbox
                      id={chapter.id}
                      checked={selectedChapters.includes(chapter.id)}
                      onCheckedChange={() => toggleChapter(chapter.id)}
                    />
                    <Label htmlFor={chapter.id} className="text-sm text-[#374151] cursor-pointer">
                      {chapter.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 中部：章节初稿预览 */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base">章节初稿预览</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            {loading ? (
              <div className="h-full flex items-center justify-center text-[#9CA3AF]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : !generated ? (
              <div className="h-full flex items-center justify-center text-[#9CA3AF]">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-[#D1D5DB]" />
                  <p>{writingId ? "暂无说明书初稿" : "未传入 writingId"}</p>
                  <p className="text-sm mt-1">{writingId ? "点击\"生成初稿\"或先在后端生成 spec_xxx 内容" : "请通过列表进入"}</p>
                </div>
              </div>
            ) : (
              <Tabs value={activeChapter} onValueChange={setActiveChapter} className="h-full flex flex-col">
                <div className="border-b border-border px-4">
                  <TabsList className="h-10">
                    {CHAPTERS.map((c) => (
                      <TabsTrigger key={c.id} value={c.id} className="text-xs">{c.label}</TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                <ScrollArea className="flex-1 p-4">
                  {CHAPTERS.map((c) => {
                    const cc = chapterContents[c.id]
                    return (
                      <TabsContent key={c.id} value={c.id} className="m-0">
                        <div className="prose prose-sm max-w-none">
                          {cc?.content ? (
                            <div className="whitespace-pre-wrap text-[#374151] leading-relaxed">
                              {cc.content}
                            </div>
                          ) : (
                            <div className="text-center py-10 text-xs text-[#9CA3AF]">
                              暂无{c.label}内容
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    )
                  })}
                </ScrollArea>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* 右侧：来源映射与风险提示 */}
        {generated && (
          <Card className="w-72 flex-shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">来源与风险</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-[#6B7280]">来源段落</Label>
                <div className="mt-2 space-y-2">
                  {activeContent?.sources.length ? activeContent.sources.map((source, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded bg-[#EAF4FF] text-xs text-[#2F80ED] cursor-pointer hover:bg-[#D4E8FF]"
                    >
                      <Link2 className="h-3 w-3" />
                      {source}
                    </div>
                  )) : (
                    <div className="text-xs text-[#9CA3AF] py-2">暂无来源信息</div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm text-[#6B7280]">风险提示</Label>
                <div className="mt-2 space-y-2">
                  {activeContent?.risks.length ? activeContent.risks.map((risk, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 rounded bg-orange-50 text-xs text-orange-700"
                    >
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {risk}
                    </div>
                  )) : (
                    <div className="text-xs text-[#9CA3AF] py-2">暂无风险提示</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
