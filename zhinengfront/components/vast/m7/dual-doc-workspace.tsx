"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OnlyOfficeEditor } from "./onlyoffice-editor"
import { CollaborativeEditor } from "@/components/vast/collaborative-editor"
import { getDisclosureById, type DisclosureItem } from "@/lib/api"
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Save,
  FileText,
  CheckCircle,
  AlertCircle,
  Search,
  Link2,
  Eye,
  EyeOff,
  Send,
  Maximize2,
  Minus,
  PanelLeftClose,
  PanelLeft,
  Users,
} from "lucide-react"

interface DualDocWorkspaceProps {
  onBack: () => void
  disclosureId?: string | number
}

interface DisclosureTreeNode {
  id: string
  title: string
  covered: boolean | "weak"
  children: DisclosureTreeNode[]
}

interface DisclosureParagraph {
  id: string
  section: string
  content: string
  status: "covered" | "weak" | "uncovered"
  mappedTo: string | null
}

// 章节配置（纯 UI 配置，可保留）：将 disclosure 的字段映射成树节点
const SECTION_CONFIG: Array<{ id: string; title: string; field: keyof DisclosureItem | string }> = [
  { id: "technical_field", title: "技术领域", field: "technical_field" },
  { id: "background_tech", title: "背景技术", field: "background_tech" },
  { id: "problem", title: "现有技术问题", field: "problem" },
  { id: "solution", title: "技术方案", field: "solution" },
  { id: "keypoints", title: "保护点", field: "keypoints" },
  { id: "embodiments", title: "具体实施方式", field: "embodiments" },
  { id: "effect", title: "有益效果", field: "effect" },
]

function buildTreeFromDisclosure(d: any): DisclosureTreeNode[] {
  if (!d) return []
  return SECTION_CONFIG.map((cfg) => {
    const raw = d[cfg.field]
    const has = typeof raw === "string" ? raw.trim().length > 0 : !!raw
    return {
      id: cfg.id,
      title: cfg.title,
      covered: has,
      children: [],
    }
  })
}

function buildParagraphsFromDisclosure(d: any): DisclosureParagraph[] {
  if (!d) return []
  const paras: DisclosureParagraph[] = []
  SECTION_CONFIG.forEach((cfg) => {
    const raw = d[cfg.field]
    if (typeof raw === "string" && raw.trim().length > 0) {
      // 按段落分隔
      const blocks = raw
        .split(/\n{2,}/)
        .map((s) => s.trim())
        .filter(Boolean)
      blocks.forEach((block, idx) => {
        paras.push({
          id: `${cfg.id}-${idx + 1}`,
          section: cfg.title,
          content: block,
          status: "covered",
          mappedTo: null,
        })
      })
    }
  })
  return paras
}

const getStatusBadge = (status: string | boolean) => {
  if (status === true || status === "covered") {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
        <CheckCircle className="h-3 w-3" />
        已覆盖
      </span>
    )
  }
  if (status === "weak") {
    return (
      <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
        <AlertCircle className="h-3 w-3" />
        弱覆盖
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
      <AlertCircle className="h-3 w-3" />
      未覆盖
    </span>
  )
}

export function DualDocWorkspace({ onBack, disclosureId }: DualDocWorkspaceProps) {
  const [showUncoveredOnly, setShowUncoveredOnly] = useState(false)
  const [showKeyPoints, setShowKeyPoints] = useState(false)
  const [selectedParagraph, setSelectedParagraph] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState("spec")
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [collaborativeMode, setCollaborativeMode] = useState(false)

  const [disclosure, setDisclosure] = useState<any | null>(null)
  const [disclosureTree, setDisclosureTree] = useState<DisclosureTreeNode[]>([])
  const [disclosureParagraphs, setDisclosureParagraphs] = useState<DisclosureParagraph[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!disclosureId) {
      setDisclosure(null)
      setDisclosureTree([])
      setDisclosureParagraphs([])
      return
    }
    setLoading(true)
    getDisclosureById(disclosureId)
      .then((data) => {
        setDisclosure(data)
        setDisclosureTree(buildTreeFromDisclosure(data))
        setDisclosureParagraphs(buildParagraphsFromDisclosure(data))
      })
      .catch((err) => {
        console.error("加载交底书失败:", err)
        setDisclosure(null)
        setDisclosureTree([])
        setDisclosureParagraphs([])
      })
      .finally(() => setLoading(false))
  }, [disclosureId])

  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const filteredParagraphs = disclosureParagraphs.filter((p) => {
    if (showUncoveredOnly && p.status === "covered") return false
    return true
  })

  const getDocumentTitle = () => {
    switch (currentTab) {
      case "spec": return "说明书"
      case "claims": return "权利要求书"
      case "abstract": return "摘要"
      case "drawings": return "附图说明"
      default: return "说明书"
    }
  }

  const headerTitle = disclosure?.case_name || "未关联案件"
  const headerSub = disclosure ? `案件：${disclosure.case_id || ""}` : "未传入交底书 ID"

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
          <Button
            variant={collaborativeMode ? "default" : "outline"}
            size="sm"
            onClick={() => setCollaborativeMode(!collaborativeMode)}
          >
            <Users className="h-4 w-4 mr-2" />
            {collaborativeMode ? "退出协作" : "协作编辑"}
          </Button>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            保存版本
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            交底书
          </Button>
          <Button variant="outline" size="sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            覆盖检查
          </Button>
          <Button variant="outline" size="sm">
            <Link2 className="h-4 w-4 mr-2" />
            支持检查
          </Button>
          <Button size="sm">
            <Send className="h-4 w-4 mr-2" />
            提交审核
          </Button>
        </div>
      </div>

      {/* 主内容区 - 双栏布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：完整交底书预览 */}
        <div className={`border-r border-border bg-white flex flex-col transition-all duration-300 ${
          leftPanelCollapsed ? "w-0 overflow-hidden" : "w-[35%]"
        }`}>
          <div className="p-3 border-b border-border space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                <Input placeholder="搜索交底内容" className="pl-8 h-8 text-sm" />
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Switch
                  id="uncovered"
                  checked={showUncoveredOnly}
                  onCheckedChange={setShowUncoveredOnly}
                />
                <Label htmlFor="uncovered" className="text-[#6B7280]">只看未覆盖</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="keypoints"
                  checked={showKeyPoints}
                  onCheckedChange={setShowKeyPoints}
                />
                <Label htmlFor="keypoints" className="text-[#6B7280]">只看保护点</Label>
              </div>
            </div>
          </div>

          {/* 目录树 */}
          <div className="p-3 border-b border-border">
            <div className="text-xs font-medium text-[#6B7280] mb-2">交底书目录</div>
            {loading ? (
              <div className="text-xs text-[#9CA3AF] py-3">加载中...</div>
            ) : disclosureTree.length === 0 ? (
              <div className="text-xs text-[#9CA3AF] py-3">暂无交底书目录</div>
            ) : (
              <div className="space-y-1">
                {disclosureTree.map((item) => (
                  <div key={item.id}>
                    <div
                      className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-[#F5F7FA] cursor-pointer"
                      onClick={() => item.children.length > 0 && toggleSection(item.id)}
                    >
                      {item.children.length > 0 ? (
                        expandedSections.includes(item.id) ? (
                          <ChevronDown className="h-3 w-3 text-[#9CA3AF]" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-[#9CA3AF]" />
                        )
                      ) : (
                        <Minus className="h-3 w-3 text-[#D1D5DB]" />
                      )}
                      <span className="text-sm text-[#374151] flex-1">{item.title}</span>
                      {getStatusBadge(item.covered)}
                    </div>
                    {item.children.length > 0 && expandedSections.includes(item.id) && (
                      <div className="ml-5 space-y-1">
                        {item.children.map((child) => (
                          <div
                            key={child.id}
                            className="flex items-center gap-2 py-1 px-2 rounded hover:bg-[#F5F7FA] cursor-pointer"
                          >
                            <Minus className="h-3 w-3 text-[#D1D5DB]" />
                            <span className="text-sm text-[#6B7280] flex-1">{child.title}</span>
                            {getStatusBadge(child.covered)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 段落卡片列表 */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {filteredParagraphs.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#9CA3AF]">
                  {disclosureId ? "暂无交底段落" : "未指定 disclosureId，暂无可显示内容"}
                </div>
              ) : (
                filteredParagraphs.map((para) => (
                  <Card
                    key={para.id}
                    className={`cursor-pointer transition-all ${
                      selectedParagraph === para.id
                        ? "ring-2 ring-[#2F80ED] bg-[#EAF4FF]"
                        : "hover:shadow-md"
                    }`}
                    onClick={() => setSelectedParagraph(para.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-[#2F80ED]">{para.section}</span>
                        {getStatusBadge(para.status)}
                      </div>
                      <p className="text-sm text-[#374151] leading-relaxed line-clamp-3">
                        {para.content}
                      </p>
                      {para.mappedTo && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <div className="text-xs text-[#9CA3AF] flex items-center gap-1">
                            <Link2 className="h-3 w-3" />
                            映射至：{para.mappedTo}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="h-7 text-xs flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          定位正文
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs flex-1">
                          <Link2 className="h-3 w-3 mr-1" />
                          建立映射
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          <EyeOff className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 左侧面板折叠按钮 */}
        <button
          className="w-5 bg-[#F5F7FA] border-r border-border flex items-center justify-center hover:bg-[#E5E7EB] transition-colors"
          onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
        >
          {leftPanelCollapsed ? (
            <PanelLeft className="h-4 w-4 text-[#9CA3AF]" />
          ) : (
            <PanelLeftClose className="h-4 w-4 text-[#9CA3AF]" />
          )}
        </button>

        {/* 右侧：OnlyOffice 编辑器 */}
        <div className="flex-1 flex flex-col bg-white">
          {/* 文档 Tab */}
          <div className="px-4 pt-3 border-b border-border">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList>
                <TabsTrigger value="spec">说明书</TabsTrigger>
                <TabsTrigger value="claims">权利要求书</TabsTrigger>
                <TabsTrigger value="abstract">摘要</TabsTrigger>
                <TabsTrigger value="drawings">附图说明</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* 编辑器区域 */}
          <div className="flex-1 p-4">
            {collaborativeMode ? (
              <CollaborativeEditor
                caseId={disclosure?.case_id || "CASE001"}
                docType={currentTab === "spec" ? "spec" : currentTab === "claims" ? "claims" : "five_books"}
                onContentChange={(content) => console.log("Content changed:", content.length)}
              />
            ) : (
              <OnlyOfficeEditor
                documentTitle={`${disclosure?.case_name || "未命名"}-${getDocumentTitle()}`}
                documentType={currentTab as "spec" | "claims" | "abstract" | "drawings"}
                showAiAssist={true}
              />
            )}
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="h-10 px-4 bg-white border-t border-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280]">覆盖率：</span>
            <span className="font-medium text-[#374151]">
              {disclosure?.quality_score != null ? `${disclosure.quality_score}%` : "-"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280]">风险等级：</span>
            <span className="font-medium text-[#374151]">{disclosure?.risk_level || "-"}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280]">阶段：</span>
            <span className="font-medium text-[#374151]">{disclosure?.m06_stage || "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[#6B7280]">已加载</span>
          </div>
        </div>
      </div>
    </div>
  )
}
