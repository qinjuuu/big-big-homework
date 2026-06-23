"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { FileText, Copy, CheckCircle2, BookOpen } from "lucide-react"
import { getClaimsTemplates, getClaimsTemplateDetail, type ClaimsTemplateItem } from "@/lib/api"

interface ClaimsTemplateSelectorProps {
  onSelect: (content: { independent_claim: string; dependent_claims: string[] }) => void
  patentType?: string
  onClose?: () => void
}

export function ClaimsTemplateSelector({ onSelect, patentType, onClose }: ClaimsTemplateSelectorProps) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<ClaimsTemplateItem[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ClaimsTemplateItem | null>(null)
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
      const data = await getClaimsTemplates()
      setTemplates(data)
    } catch (err) {
      console.error('Load templates error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTemplate = async (template: ClaimsTemplateItem) => {
    setSelectedTemplate(template)
    try {
      const detail = await getClaimsTemplateDetail(template.id)
      setTemplateDetail(detail)
    } catch (err) {
      console.error('Load template detail error:', err)
    }
  }

  const handleApply = () => {
    if (!selectedTemplate || !templateDetail) return
    onSelect({
      independent_claim: templateDetail.independent_claim || '',
      dependent_claims: (templateDetail.dependent_claims || '').split('\n').filter((s: string) => s.trim())
    })
    onClose?.()
    setApplied(true)
    setTimeout(() => {
      setOpen(false)
      setApplied(false)
      setSelectedTemplate(null)
      setTemplateDetail(null)
    }, 800)
  }

  const getTemplateTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'product': '产品',
      'method': '方法',
      'system': '系统',
      'process': '工艺'
    }
    return labels[type] || type
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          模板库
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#2563EB]" />
            权利要求书标准模板库
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
                          ? 'bg-[#EFF6FF] border border-[#2563EB] text-[#2563EB]'
                          : 'hover:bg-[#F1F5F9] border border-transparent'
                      }`}
                    >
                      <div className="font-medium text-[#0F172A] text-xs">{template.name}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" className="text-[10px] h-5 px-1">
                          {getTemplateTypeLabel(template.type)}
                        </Badge>
                        <span className="text-[10px] text-[#94A3B8]">{template.type}</span>
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
                  <h3 className="font-semibold text-sm text-[#0F172A]">{templateDetail.template_name}</h3>
                  <p className="text-xs text-[#64748B] mt-1">{templateDetail.usage_guide}</p>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-medium text-[#64748B] mb-1.5">独立权利要求模板</h4>
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-sm text-[#334155] font-mono leading-relaxed">
                        {templateDetail.independent_claim_template}
                      </div>
                    </div>
                    {templateDetail.preamble_template && (
                      <div>
                        <h4 className="text-xs font-medium text-[#64748B] mb-1.5">前序部分</h4>
                        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-sm text-[#334155]">
                          {templateDetail.preamble_template}
                        </div>
                      </div>
                    )}
                    {templateDetail.character_part_template && (
                      <div>
                        <h4 className="text-xs font-medium text-[#64748B] mb-1.5">特征部分</h4>
                        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-sm text-[#334155]">
                          {templateDetail.character_part_template}
                        </div>
                      </div>
                    )}
                    {templateDetail.dependent_claim_templates && templateDetail.dependent_claim_templates.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-[#64748B] mb-1.5">从属权利要求模板</h4>
                        <div className="space-y-2">
                          {templateDetail.dependent_claim_templates.map((claim: string, i: number) => (
                            <div key={i} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-sm text-[#334155] font-mono">
                              {claim}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {templateDetail.example_claims && (
                      <div>
                        <h4 className="text-xs font-medium text-[#64748B] mb-1.5">示例</h4>
                        <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-3 text-sm text-[#166534] font-mono whitespace-pre-wrap">
                          {templateDetail.example_claims}
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
                        应用此模板
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#94A3B8]">
                <div className="text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
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
