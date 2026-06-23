"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  FileText,
  Brain,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Loader2,
  Star,
  Layers,
  Lightbulb,
  BookOpen,
  Target,
  Wrench,
  Shield,
  Image,
  GitBranch,
  Save,
} from "lucide-react"
import { M06ProgressBar } from "@/components/vast/m6/m06-progress-bar"
import { getDisclosureById, type DisclosureItem } from "@/lib/api"
import { DisclosureTemplateSelector } from "@/components/vast/disclosure-template-selector"

interface ModelDetailProps {
  disclosureId?: number | string
  onBack?: () => void
  onNavigate?: (page: string) => void
}

interface MaterialItem {
  id: number | string
  name: string
  type: string
  size: string
  isCore: boolean
  parseStatus: string
  sourceContent: string
}

interface ModuleConfig {
  key: string
  label: string
  icon: any
  required: boolean
  content: string
  confirmed: boolean
  needSupplement: boolean
}

// 模块定义 - 静态结构，content 由后端字段填充
const MODULE_DEFS: Array<{
  key: string
  label: string
  icon: any
  required: boolean
  // 从 disclosure 中读取的字段名（按优先级）
  fields: string[]
}> = [
  { key: "problem", label: "技术问题", icon: Target, required: true, fields: ["problem", "tech_problem"] },
  { key: "background", label: "技术背景", icon: BookOpen, required: false, fields: ["background", "background_tech"] },
  { key: "defects", label: "现有技术缺点", icon: XCircle, required: false, fields: ["defects"] },
  { key: "purpose", label: "发明目的", icon: Lightbulb, required: false, fields: ["purpose"] },
  { key: "solution", label: "技术方案", icon: Wrench, required: true, fields: ["solution", "ai_generate_content"] },
  { key: "keypoints", label: "关键保护点", icon: Shield, required: false, fields: ["keypoints", "innovation_ideas"] },
  { key: "effect", label: "有益效果", icon: Star, required: true, fields: ["effect"] },
  { key: "drawings", label: "图纸材料", icon: Image, required: false, fields: ["drawings"] },
  { key: "alternatives", label: "替代方案", icon: GitBranch, required: false, fields: ["alternatives"] },
]

function buildMaterialsFromDisclosure(d: DisclosureItem | null): MaterialItem[] {
  if (!d) return []

  // 1) 后端若返回 attachments 列表则优先使用
  if (Array.isArray(d.attachments) && d.attachments.length > 0) {
    return d.attachments.map((a, idx) => ({
      id: a.id ?? idx + 1,
      name: a.name,
      type: a.type || "附件",
      size: typeof a.size === "number" ? `${a.size}` : (a.size || "-"),
      isCore: !!a.isCore,
      parseStatus: a.parseStatus || "completed",
      sourceContent: a.sourceContent || "",
    }))
  }

  // 2) 否则用 disclosure 字段拼装 1-2 条
  const list: MaterialItem[] = []
  const baseName = `${d.case_id || "DISCLOSURE"}技术交底书`

  if (d.source_content) {
    list.push({
      id: `src-${d.id}`,
      name: `${baseName}.txt`,
      type: "交底书",
      size: "-",
      isCore: true,
      parseStatus: "completed",
      sourceContent: d.source_content,
    })
  }

  if (d.ai_generate_content) {
    list.push({
      id: `ai-${d.id}`,
      name: `${baseName}_AI解构.txt`,
      type: "AI生成",
      size: "-",
      isCore: false,
      parseStatus: "completed",
      sourceContent: d.ai_generate_content,
    })
  }

  return list
}

function buildModulesFromDisclosure(d: DisclosureItem | null): ModuleConfig[] {
  return MODULE_DEFS.map((def) => {
    let content = ""
    if (d) {
      for (const f of def.fields) {
        const v = (d as any)[f]
        if (v != null && String(v).trim() !== "") {
          content = String(v)
          break
        }
      }
    }
    return {
      key: def.key,
      label: def.label,
      icon: def.icon,
      required: def.required,
      content,
      confirmed: false,
      needSupplement: !content,
    }
  })
}

export function ModelDetail({ disclosureId, onBack, onNavigate }: ModelDetailProps) {
  const [loading, setLoading] = useState<boolean>(!!disclosureId)
  const [error, setError] = useState<string | null>(null)
  const [disclosure, setDisclosure] = useState<DisclosureItem | null>(null)

  const [activeModule, setActiveModule] = useState<string>("problem")
  const [isDestructuring, setIsDestructuring] = useState(false)
  const [isCheckingCompleteness, setIsCheckingCompleteness] = useState(false)
  const [isCheckingInnovation, setIsCheckingInnovation] = useState(false)
  const [completenessChecked, setCompletenessChecked] = useState(false)
  const [innovationChecked, setInnovationChecked] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)

  const materials = useMemo<MaterialItem[]>(() => buildMaterialsFromDisclosure(disclosure), [disclosure])
  const modules = useMemo<ModuleConfig[]>(() => buildModulesFromDisclosure(disclosure), [disclosure])

  // moduleSourceMap：暂为空，后端无对应字段时全部"暂无关联"
  const moduleSourceMap: Record<string, Array<{ materialId: number | string; page: string; paragraph: string; excerpt: string }>> = {}

  const [moduleStates, setModuleStates] = useState<
    Record<string, { confirmed: boolean; needSupplement: boolean; content: string }>
  >({})

  // 同步 moduleStates（disclosure 加载/变化时重建）
  useEffect(() => {
    setModuleStates(
      Object.fromEntries(
        modules.map((m) => [m.key, { confirmed: m.confirmed, needSupplement: m.needSupplement, content: m.content }])
      )
    )
  }, [modules])

  // 加载 disclosure 详情
  useEffect(() => {
    if (!disclosureId) {
      setDisclosure(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    getDisclosureById(disclosureId)
      .then((data) => {
        if (!cancelled) setDisclosure(data)
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || "加载交底书失败")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [disclosureId])

  const active = modules.find((m) => m.key === activeModule) || modules[0]

  const handleAIDestructure = () => {
    setIsDestructuring(true)
    setTimeout(() => setIsDestructuring(false), 2000)
  }

  const handleCompletenessCheck = () => {
    setIsCheckingCompleteness(true)
    setTimeout(() => {
      setIsCheckingCompleteness(false)
      setCompletenessChecked(true)
    }, 1500)
  }

  const handleInnovationCheck = () => {
    setIsCheckingInnovation(true)
    setTimeout(() => {
      setIsCheckingInnovation(false)
      setInnovationChecked(true)
    }, 2000)
  }

  const getModuleStatus = (key: string) => {
    const s = moduleStates[key]
    if (!s) return "missing"
    if (!s.content) return "missing"
    if (s.confirmed) return "confirmed"
    return "draft"
  }

  const missingRequired = modules.filter((m) => m.required && !(moduleStates[m.key]?.content)).length

  // 动态完整性结果
  const completenessResult = useMemo(() => {
    const items = modules.map((m) => {
      const has = !!moduleStates[m.key]?.content
      let status: "ok" | "missing" | "warning" = "ok"
      if (!has) status = m.required ? "missing" : "warning"
      return { label: m.label, status }
    })
    const filled = items.filter((i) => i.status === "ok").length
    const score = modules.length > 0 ? Math.round((filled / modules.length) * 100) : 0
    return { score, items }
  }, [modules, moduleStates])

  const innovationResult = useMemo(() => {
    const hasContent = !!moduleStates["keypoints"]?.content || !!moduleStates["solution"]?.content
    return {
      hasInnovation: hasContent,
      confidence: hasContent ? 70 : 0,
      summary: hasContent
        ? "已识别到关键保护点/技术方案内容，建议补全后再进行AI检索。"
        : "暂未填写关键保护点或技术方案，无法判断创新点。",
      suggestion: missingRequired > 0 ? ("supplement" as const) : ("go-inspection" as const),
    }
  }, [moduleStates, missingRequired])

  // ===== 占位 UI：未传入 disclosureId 显示空态 =====
  if (!disclosureId) {
    return (
      <div className="flex flex-col h-full bg-[#F5F7FA]">
        <M06ProgressBar currentStep={1} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Layers className="h-12 w-12 text-[#D1D5DB] mb-3" />
          <p className="text-base font-medium text-[#374151] mb-1">未选择交底书</p>
          <p className="text-sm text-[#9CA3AF] mb-4">请从交底书列表选择一条记录进入解构页面</p>
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              返回列表
            </Button>
          )}
        </div>
      </div>
    )
  }

  // ===== loading =====
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#F5F7FA]">
        <M06ProgressBar currentStep={1} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-[#6B7280] text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在加载交底书...
          </div>
        </div>
      </div>
    )
  }

  // ===== error =====
  if (error || !disclosure) {
    return (
      <div className="flex flex-col h-full bg-[#F5F7FA]">
        <M06ProgressBar currentStep={1} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-[#DC2626] mb-3" />
          <p className="text-base font-medium text-[#374151] mb-1">加载失败</p>
          <p className="text-sm text-[#9CA3AF] mb-4">{error || "交底书数据不存在"}</p>
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              返回
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (!active) {
    return null
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F7FA]">
      <M06ProgressBar currentStep={1} />

      {/* 工具栏 */}
      <div className="h-14 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5 text-[#6B7280]" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div className="w-px h-5 bg-[#E5E7EB]" />
          <div>
            <span className="text-sm font-semibold text-[#111827]">交底书解构</span>
            <span className="ml-2 text-xs text-[#6B7280]">
              {disclosure.case_id} · {disclosure.case_name || "-"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={() => setShowTemplateSelector(true)}>
            <FileText className="h-3.5 w-3.5" />
            模板库
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
            <Save className="h-3.5 w-3.5" />
            保存草稿
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={handleAIDestructure} disabled={isDestructuring}>
            {isDestructuring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
            手动解构
          </Button>
          <Button size="sm" className="text-xs h-8 gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8]" onClick={handleAIDestructure} disabled={isDestructuring}>
            {isDestructuring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
            {isDestructuring ? "AI解构中..." : "AI解构"}
          </Button>
          <Button size="sm" className="text-xs h-8 gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8]" onClick={handleCompletenessCheck} disabled={isCheckingCompleteness}>
            {isCheckingCompleteness ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            完整性判断
          </Button>
          <Button size="sm" className="text-xs h-8 gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8]" onClick={handleInnovationCheck} disabled={isCheckingInnovation}>
            {isCheckingInnovation ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            创新点判断
          </Button>
          <Button
            size="sm"
            className="text-xs h-8 gap-1.5 bg-[#16A34A] hover:bg-[#15803D]"
            disabled={missingRequired > 0}
            onClick={() => onNavigate?.("m06-ai-inspection")}
          >
            下一步
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 三列主体 */}
      <div className="flex flex-1 overflow-hidden p-4 gap-3">
        {/* 左侧材料区 320px */}
        <aside className="w-[320px] shrink-0 flex flex-col gap-2 overflow-y-auto">
          {/* 来源信息 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3">
            <h3 className="text-xs font-semibold text-[#111827] mb-2">来源信息</h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">来源类别</span>
                <Badge className="bg-[#EFF6FF] text-[#2563EB] text-[10px]">{disclosure.source_type || "-"}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">案件编号</span>
                <span className="text-[#111827] font-medium font-mono">{disclosure.case_id || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">来源状态</span>
                <Badge className="bg-[#DCFCE7] text-[#16A34A] text-[10px]">{disclosure.m06_status || "-"}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">专利类型</span>
                <span className="text-[#111827] font-medium">{disclosure.patent_type || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">技术领域</span>
                <span className="text-[#111827] font-medium">{disclosure.tech_field || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">工程师</span>
                <span className="text-[#111827] font-medium">{disclosure.engineer || "-"}</span>
              </div>
            </div>
          </div>

          {/* 材料列表 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-[#E5E7EB]">
              <h3 className="text-xs font-semibold text-[#111827]">材料列表 ({materials.length})</h3>
            </div>
            <div className="p-2 space-y-1">
              {materials.length === 0 ? (
                <div className="text-center py-4 text-xs text-[#9CA3AF]">暂无材料</div>
              ) : (
                materials.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F9FAFB] transition">
                    <FileText className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
                    <span className="text-xs text-[#111827] truncate flex-1">{m.name}</span>
                    <Badge variant="outline" className="text-[9px] py-0 px-1">{m.type}</Badge>
                    {m.isCore && <Badge className="bg-[#EFF6FF] text-[#2563EB] text-[9px] py-0 px-1">核心</Badge>}
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                      <Eye className="h-3 w-3 text-[#9CA3AF]" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 模块导航 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden flex-1">
            <div className="px-3 py-2 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827]">模块导航</h3>
            </div>
            <div className="p-2 space-y-1">
              {modules.map((mod) => {
                const Icon = mod.icon
                const status = getModuleStatus(mod.key)
                return (
                  <button
                    key={mod.key}
                    onClick={() => setActiveModule(mod.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                      activeModule === mod.key
                        ? "bg-[#EFF6FF] text-[#2563EB]"
                        : "text-[#374151] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium flex-1">{mod.label}</span>
                    {mod.required && status === "missing" && (
                      <div className="w-2 h-2 rounded-full bg-[#DC2626]" />
                    )}
                    {status === "confirmed" && (
                      <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                    )}
                    {mod.required && <span className="text-[#DC2626] text-sm font-semibold">*</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        {/* 中央编辑区 */}
        <main className="flex-1 flex flex-col gap-3 overflow-hidden">
          <div className="bg-white border border-[#E5E7EB] rounded-xl flex flex-col overflow-hidden flex-1">
            <div className="h-10 flex items-center justify-between px-4 border-b border-[#E5E7EB] shrink-0">
              <div className="flex items-center gap-2">
                {(() => { const Icon = active.icon; return <Icon className="h-4 w-4 text-[#2563EB]" /> })()}
                <span className="text-sm font-semibold text-[#111827]">{active.label}</span>
                {active.required && <span className="text-[#DC2626] text-xs">必填</span>}
                {moduleStates[active.key]?.confirmed && (
                  <Badge className="bg-[#DCFCE7] text-[#16A34A] text-[10px]">已确认</Badge>
                )}
                {moduleStates[active.key]?.needSupplement && (
                  <Badge className="bg-[#FEF3C7] text-[#D97706] text-[10px]">待补充</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <span>需补充</span>
                  <Switch
                    checked={!!moduleStates[active.key]?.needSupplement}
                    onCheckedChange={(v) =>
                      setModuleStates((s) => ({ ...s, [active.key]: { ...s[active.key], needSupplement: v } }))
                    }
                    className="scale-75"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <span>已确认</span>
                  <Switch
                    checked={!!moduleStates[active.key]?.confirmed}
                    onCheckedChange={(v) =>
                      setModuleStates((s) => ({ ...s, [active.key]: { ...s[active.key], confirmed: v } }))
                    }
                    className="scale-75"
                  />
                </div>
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                  <Brain className="h-3 w-3" />
                  AI生成
                </Button>
                <Button size="sm" className="text-xs h-7 bg-[#2563EB] hover:bg-[#1D4ED8] gap-1">
                  <Save className="h-3 w-3" />
                  保存模块
                </Button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex flex-col h-full gap-3">
                {moduleStates[active.key]?.content ? (
                  <div className="flex-1 min-h-0">
                    <Textarea
                      className="w-full h-full min-h-[120px] text-sm resize-none border-[#E5E7EB] focus-visible:ring-[#2563EB]"
                      value={moduleStates[active.key].content}
                      onChange={(e) =>
                        setModuleStates((s) => ({ ...s, [active.key]: { ...s[active.key], content: e.target.value } }))
                      }
                    />
                  </div>
                ) : (
                  <div className="flex-1 min-h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-[#E5E7EB] rounded-xl text-center p-4">
                    <Layers className="h-6 w-6 text-[#D1D5DB] mb-2" />
                    <p className="text-sm text-[#6B7280] mb-1">此模块内容为空</p>
                    <p className="text-xs text-[#9CA3AF] mb-3">
                      {active.required ? "必填模块，请填写或AI生成" : "可手动填写或AI生成"}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() =>
                          setModuleStates((s) => ({
                            ...s,
                            [active.key]: { ...s[active.key], content: "" },
                          }))
                        }
                      >
                        手动填写
                      </Button>
                      <Button size="sm" className="text-xs h-7 bg-[#2563EB] hover:bg-[#1D4ED8] gap-1">
                        <Brain className="h-3 w-3" />
                        AI生成
                      </Button>
                    </div>
                  </div>
                )}

                {/* 内容来源 */}
                <div className="shrink-0 border border-[#E5E7EB] rounded-lg overflow-hidden bg-[#F9FAFB]">
                  <div className="px-3 py-2 border-b border-[#E5E7EB] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#2563EB]" />
                      <span className="text-sm font-semibold text-[#374151]">内容来源</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[#2563EB] text-[#2563EB]">
                        {active.label}
                      </Badge>
                    </div>
                    <span className="text-xs text-[#9CA3AF]">
                      {moduleSourceMap[active.key]?.length || 0} 处引用
                    </span>
                  </div>
                  <div className="px-3 py-2.5 space-y-2 max-h-[180px] overflow-y-auto">
                    {moduleSourceMap[active.key] && moduleSourceMap[active.key].length > 0 ? (
                      moduleSourceMap[active.key].map((source, idx) => {
                        const material = materials.find((m) => m.id === source.materialId)
                        return (
                          <div key={idx} className="bg-white border border-[#E5E7EB] rounded-lg p-2.5">
                            <div className="flex items-center gap-2 mb-1.5">
                              <FileText className="h-3 w-3 text-[#6B7280]" />
                              <span className="text-xs font-medium text-[#374151]">{material?.name}</span>
                              <Badge variant="outline" className="text-[9px] py-0 px-1 text-[#6B7280] border-[#D1D5DB]">
                                {source.page}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] py-0 px-1 text-[#6B7280] border-[#D1D5DB]">
                                {source.paragraph}
                              </Badge>
                            </div>
                            <p className="text-xs text-[#6B7280] leading-relaxed bg-[#F9FAFB] border border-[#E5E7EB] rounded px-2 py-1.5">
                              "{source.excerpt}"
                            </p>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-4">
                        <FileText className="h-5 w-5 text-[#D1D5DB] mx-auto mb-1.5" />
                        <p className="text-xs text-[#9CA3AF]">暂无关联</p>
                        <p className="text-[10px] text-[#D1D5DB] mt-0.5">请手动填写或使用AI生成内容</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 备注 */}
                <div className="shrink-0">
                  <Textarea
                    placeholder="备注（可选，最多500字符）"
                    className="text-xs h-12 resize-none border-[#E5E7EB]"
                    maxLength={500}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 模块完成度总览 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#111827]">模块完成概览</span>
              <span className="text-xs text-[#6B7280]">
                {modules.filter((m) => moduleStates[m.key]?.content).length} / {modules.length} 已填写
              </span>
            </div>
            <div className="flex gap-1.5">
              {modules.map((mod) => {
                const status = getModuleStatus(mod.key)
                return (
                  <button
                    key={mod.key}
                    onClick={() => setActiveModule(mod.key)}
                    title={mod.label}
                    className={`flex-1 h-2 rounded-full transition-all ${
                      status === "confirmed" ? "bg-[#16A34A]" :
                      status === "draft" ? "bg-[#2563EB]" :
                      mod.required ? "bg-[#DC2626]" : "bg-[#E5E7EB]"
                    }`}
                  />
                )
              })}
            </div>
            <div className="flex gap-3 mt-2 text-[10px] text-[#9CA3AF]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#16A34A]" />已确认</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2563EB]" />草稿</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#DC2626]" />必填缺失</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#E5E7EB]" />未填写</span>
            </div>
          </div>
        </main>

        {/* 右侧判断区 */}
        <aside className="w-[320px] shrink-0 flex flex-col gap-3 overflow-y-auto">
          {/* 完整性判断 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
                完整性判断
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6"
                onClick={handleCompletenessCheck}
                disabled={isCheckingCompleteness}
              >
                {isCheckingCompleteness ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              </Button>
            </div>
            {completenessChecked ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">完整性得分</span>
                  <span className={`text-lg font-bold ${completenessResult.score >= 80 ? "text-[#16A34A]" : completenessResult.score >= 60 ? "text-[#F59E0B]" : "text-[#DC2626]"}`}>
                    {completenessResult.score}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {completenessResult.items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <span className="text-[#374151]">{item.label}</span>
                      {item.status === "ok" && <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />}
                      {item.status === "missing" && <XCircle className="h-3.5 w-3.5 text-[#DC2626]" />}
                      {item.status === "warning" && <AlertTriangle className="h-3.5 w-3.5 text-[#F59E0B]" />}
                    </div>
                  ))}
                </div>
                {missingRequired > 0 && (
                  <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#DC2626]">
                    {missingRequired} 个必填模块尚未填写，无法进入下一步
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#9CA3AF]">点击【完整性判断】执行检查</div>
            )}
          </div>

          {/* 创新点判断 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#2563EB]" />
                创新点判断
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6"
                onClick={handleInnovationCheck}
                disabled={isCheckingInnovation}
              >
                {isCheckingInnovation ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              </Button>
            </div>
            {innovationChecked ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${innovationResult.hasInnovation ? "bg-[#DCFCE7]" : "bg-[#FEF2F2]"}`}>
                    {innovationResult.hasInnovation
                      ? <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                      : <XCircle className="h-4 w-4 text-[#DC2626]" />
                    }
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#111827]">
                      {innovationResult.hasInnovation ? "存在创新点" : "暂未发现创新点"}
                    </div>
                    <div className="text-xs text-[#6B7280]">置信度 {innovationResult.confidence}%</div>
                  </div>
                </div>
                <p className="text-xs text-[#374151] leading-relaxed">{innovationResult.summary}</p>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#9CA3AF]">点击【创新点判断】执行分析</div>
            )}
          </div>

          {/* 缺失项 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827]">缺失项</h3>
            </div>
            <div className="p-3 space-y-1.5">
              {modules.filter((m) => !moduleStates[m.key]?.content).length === 0 ? (
                <div className="text-xs text-[#16A34A] flex items-center gap-1.5 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  全部模块已填写
                </div>
              ) : modules.filter((m) => !moduleStates[m.key]?.content).map((m) => (
                <div
                  key={m.key}
                  className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-[#F9FAFB]"
                  onClick={() => setActiveModule(m.key)}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.required ? "bg-[#DC2626]" : "bg-[#F59E0B]"}`} />
                  <span className="text-xs text-[#374151]">{m.label}</span>
                  {m.required && <Badge className="bg-[#FEF2F2] text-[#DC2626] text-[10px] ml-auto">必填</Badge>}
                </div>
              ))}
            </div>
          </div>

          {/* 建议动作 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827]">建议动作</h3>
            </div>
            <div className="p-3 space-y-2">
              {[
                {
                  label: "进入AI初检",
                  desc: "交底完整，存在创新点",
                  color: "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]",
                  active: innovationResult.suggestion === "go-inspection",
                  action: () => onNavigate?.("m06-ai-inspection"),
                },
                {
                  label: "进入交底补全",
                  desc: "创新点不足，建议补充",
                  color: "border-[#FDE68A] bg-[#FFFBEB] text-[#D97706]",
                  active: innovationResult.suggestion === "supplement",
                  action: () => onNavigate?.("m06-supplement"),
                },
                {
                  label: "返回M05",
                  desc: "材料严重缺失，需补充原始资料",
                  color: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
                  active: false,
                  action: () => onNavigate?.("m05-dashboard"),
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`w-full flex items-center justify-between p-3 border rounded-lg text-left transition-all hover:opacity-90 ${item.color} ${item.active ? "ring-2 ring-offset-1 ring-current" : "opacity-60 hover:opacity-80"}`}
                >
                  <div>
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{item.desc}</div>
                  </div>
                  {item.active && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {showTemplateSelector && (
        <DisclosureTemplateSelector
          onSelect={(template) => {
            if (template.sections) {
              const newStates: Record<string, any> = {}
              template.sections.forEach((sec: any) => {
                const keyMap: Record<string, string> = {
                  技术领域: 'background',
                  背景技术: 'background',
                  技术问题: 'problem',
                  技术方案: 'solution',
                  关键保护点: 'keypoints',
                  有益效果: 'effect',
                  具体实施方式: 'solution',
                  替代方案: 'alternatives',
                }
                const key = keyMap[sec.name] || sec.name
                if (key) {
                  newStates[key] = { content: sec.example || '', confirmed: false, needSupplement: !sec.required }
                }
              })
              setModuleStates((prev) => ({ ...prev, ...newStates }))
            }
            setShowTemplateSelector(false)
          }}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  )
}
