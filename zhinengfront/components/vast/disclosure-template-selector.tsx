"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { FileText, Copy, CheckCircle2, Layers } from "lucide-react"
import { getDisclosureTemplates, getDisclosureTemplateDetail, type DisclosureTemplateItem } from "@/lib/api"

interface DisclosureTemplateSelectorProps {
  onSelect: (template: any) => void
  patentType?: string
  onClose?: () => void
}

export function DisclosureTemplateSelector({ onSelect, patentType, onClose }: DisclosureTemplateSelectorProps) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<DisclosureTemplateItem[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<DisclosureTemplateItem | null>(null)
  const [templateDetail, setTemplateDetail] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    if (open) {
      loadTemplates()
    }
  }, [open])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const data = await getDisclosureTemplates()
      setTemplates(data)
    } catch (err) {
      console.error('Load disclosure templates error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTemplate = async (template: DisclosureTemplateItem) => {
    setSelectedTemplate(template)
    try {
      const detail = await getDisclosureTemplateDetail(template.id)
      setTemplateDetail(detail)
    } catch (err) {
      console.error('Load template detail error:', err)
    }
  }

  const handleApply = () => {
    if (!selectedTemplate || !templateDetail) return
    onSelect(templateDetail)
    onClose?.()
    setApplied(true)
    setTimeout(() => {
      setOpen(false)
      setApplied(false)
      setSelectedTemplate(null)
      setTemplateDetail(null)
    }, 800)
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      '结构说明': '结构',
      '工艺步骤': '工艺',
      '原理说明': '原理',
      '动作关系': '动作',
      '综合': '综合'
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      '结构说明': 'bg-blue-50 text-blue-700',
      '工艺步骤': 'bg-green-50 text-green-700',
      '原理说明': 'bg-purple-50 text-purple-700',
      '动作关系': 'bg-orange-50 text-orange-700',
      '综合': 'bg-gray-50 text-gray-700'
    }
    return colors[type] || 'bg-gray-50 text-gray-700'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
          <Layers className="h-3.5 w-3.5" />
          模板库
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#2563EB]" />
            交底书模板库
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* 左侧模板列表 */}
          <div className="w-1/3 flex flex-col border border-[#E2E8F0] rounded-lg">
            <div className="p-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <p className="text-xs text-[#64748B]">共 {templates.length} 个模板</p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {loading ? (
                  <div className="text-center py-4 text-sm text-[#94A3B8]">加载中...</div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-4 text-sm text-[#94A3B8]">暂无模板</div>
                ) : (
                  templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className={`w-full text-left p-2.5 rounded-lg text-sm transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'bg-[#EFF6FF] border border-[#2563EB]'
                          : 'hover:bg-[#F1F5F9] border border-transparent'
                      }`}
                    >
                      <div className="font-medium text-[#0F172A] text-xs">{template.name}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge className={`text-[10px] h-5 px-1 ${getTypeColor(template.type)}`}>
                          {getTypeLabel(template.type)}
                        </Badge>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* 右侧模板详情 */}
          <div className="w-2/3 flex flex-col border border-[#E2E8F0] rounded-lg">
            {templateDetail ? (
              <>
                <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <h3 className="font-semibold text-sm text-[#0F172A]">{templateDetail.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-[10px] h-5 px-1.5 ${getTypeColor(templateDetail.type)}`}>
                      {templateDetail.type}
                    </Badge>
                    {templateDetail.patent_type && (
                      <span className="text-xs text-[#94A3B8]">{templateDetail.patent_type}</span>
                    )}
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-medium text-[#64748B] mb-1.5">模板内容</h4>
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-sm text-[#334155] whitespace-pre-wrap font-mono leading-relaxed max-h-[300px] overflow-y-auto">
                        {templateDetail.template_content}
                      </div>
                    </div>
                    {templateDetail.required_sections && templateDetail.required_sections.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-[#64748B] mb-1.5">必填章节</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {templateDetail.required_sections.map((section: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs h-6">
                              {section}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {templateDetail.example_content && (
                      <div>
                        <h4 className="text-xs font-medium text-[#64748B] mb-1.5">示例</h4>
                        <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-3 text-sm text-[#166534] whitespace-pre-wrap">
                          {templateDetail.example_content}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
                  <Button
                    className="w-full bg-[#2563EB] hover:bg-[#1D4ED8]"
                    onClick={handleApply}
                    disabled={applied}
                  >
                    {applied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        已应用
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1.5" />
                        使用此模板
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#94A3B8]">
                <div className="text-center">
                  <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">请从左侧选择一个模板</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
