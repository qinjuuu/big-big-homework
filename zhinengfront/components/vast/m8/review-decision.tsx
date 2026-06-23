'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react'
import { getReviewDetail, updateReview, type ReviewIssueItem } from '@/lib/api'

interface ReviewIssue {
  id: number
  title: string
  module: string
  type?: string
}

interface ReviewDecisionPageProps {
  onNavigate?: (page: string) => void
  reviewId?: number | string
}

export function ReviewDecisionPage({ onNavigate, reviewId }: ReviewDecisionPageProps) {
  const [decision, setDecision] = useState('')
  const [decisionComment, setDecisionComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [blockingIssues, setBlockingIssues] = useState<ReviewIssue[]>([])
  const [warningIssues, setWarningIssues] = useState<ReviewIssue[]>([])
  const [adviceIssues, setAdviceIssues] = useState<ReviewIssue[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (reviewId === undefined || reviewId === null || reviewId === '') {
      setBlockingIssues([])
      setWarningIssues([])
      setAdviceIssues([])
      setLoaded(true)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const detail = await getReviewDetail(reviewId)
        if (cancelled) return
        const blocking: ReviewIssue[] = []
        const warning: ReviewIssue[] = []
        const advice: ReviewIssue[] = []

        const rawIssues: ReviewIssueItem[] = Array.isArray(detail?.issues) ? detail.issues : []
        rawIssues.forEach((it, idx) => {
          const item: ReviewIssue = {
            id: idx + 1,
            title: it.title || '',
            module: it.module || '',
            type: it.type,
          }
          const t = (it.type || '').toLowerCase()
          if (t.includes('block') || t.includes('阻断') || t === 'error') {
            blocking.push(item)
          } else if (t.includes('warn') || t.includes('警告')) {
            warning.push(item)
          } else if (t.includes('advice') || t.includes('建议') || t.includes('info')) {
            advice.push(item)
          } else {
            warning.push(item)
          }
        })

        // 如果 issues 为空，则尝试从 audit_remark 文本中按行提取
        if (rawIssues.length === 0 && detail?.audit_remark) {
          const lines = String(detail.audit_remark)
            .split(/\r?\n|；|;/)
            .map((s) => s.trim())
            .filter(Boolean)
          lines.forEach((line, idx) => {
            const item: ReviewIssue = { id: idx + 1, title: line, module: '审核备注' }
            if (/阻断|block|不通过|严重/i.test(line)) blocking.push(item)
            else if (/警告|warn/i.test(line)) warning.push(item)
            else advice.push(item)
          })
        }

        setBlockingIssues(blocking)
        setWarningIssues(warning)
        setAdviceIssues(advice)
      } catch {
        if (!cancelled) {
          setBlockingIssues([])
          setWarningIssues([])
          setAdviceIssues([])
        }
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reviewId])

  const hasAnyIssues =
    blockingIssues.length + warningIssues.length + adviceIssues.length > 0

  const handleSubmitDecision = async () => {
    if (!reviewId) {
      alert("缺少审核记录ID")
      return
    }
    setIsSubmitting(true)
    try {
      // 调用后端 API 更新审核结果
      let auditResult = ''
      let m08Status = ''
      if (decision === 'pass') {
        auditResult = '通过'
        m08Status = 'completed'
      } else if (decision === 'reject-m06') {
        auditResult = '退回M06'
        m08Status = 'rejected'
      } else if (decision === 'reject-m07') {
        auditResult = '退回M07'
        m08Status = 'rejected'
      } else if (decision === 'reject-case') {
        auditResult = '废案'
        m08Status = 'rejected'
      }
      await updateReview(Number(reviewId), {
        audit_result: auditResult,
        audit_remark: decisionComment,
        audit_user: '前端用户',
        m08_status: m08Status,
      })
      setIsSubmitting(false)
      // 根据决策结果跳转到对应模块
      if (decision === 'pass') {
        onNavigate?.('m09-dashboard') // 审核通过 → M09 案件管理
      } else if (decision === 'reject-m06') {
        onNavigate?.('m06-p01-dashboard') // 退回M06 → M06 交底书引擎
      } else if (decision === 'reject-m07') {
        onNavigate?.('m07-dashboard') // 退回M07 → M07 专利创作
      } else if (decision === 'reject-case') {
        onNavigate?.('m09-scrap-cases') // 废案 → M09 废案管理
      }
    } catch (err) {
      console.error("提交审核决策失败:", err)
      alert("提交审核决策失败，请检查网络或联系管理员")
      setIsSubmitting(false)
    }
  }

  const decisionOptions = [
    { value: 'pass', label: '审核通过', desc: '所有问题已处理，可进入M09待交案', color: 'border-[#BBF7D0] bg-[#F0FDF4]', activeColor: 'border-[#16A34A] bg-[#F0FDF4]' },
    { value: 'reject-m06', label: '退回M06', desc: '交底书存在问题，需补充/重做交底模型', color: 'border-[#E5E9F0] bg-white', activeColor: 'border-[#EA580C] bg-[#FFF7ED]' },
    { value: 'reject-m07', label: '退回M07', desc: '申请文件存在问题，需修改说明书/权利要求', color: 'border-[#E5E9F0] bg-white', activeColor: 'border-[#EA580C] bg-[#FFF7ED]' },
    { value: 'reject-case', label: '标记废案', desc: '不具备申报基础，进入M09案件管理', color: 'border-[#E5E9F0] bg-white', activeColor: 'border-[#DC2626] bg-[#FEF2F2]' },
  ]

  return (
    <div className="w-full space-y-4 p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" className="text-[#9CA3AF] h-7 px-2 -ml-2"
              onClick={() => onNavigate?.('m08-task-detail')}>
              <ChevronLeft className="w-4 h-4 mr-1" />审核任务详情
            </Button>
          </div>
          <h1 className="text-xl font-semibold text-[#111827]">审核决策</h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">汇总所有审核结果，确定最终决策</p>
        </div>
      </div>

      {blockingIssues.length > 0 && (
        <Alert className="border-[#FECACA] bg-[#FEF2F2] py-3">
          <AlertTriangle className="h-4 w-4 text-[#DC2626]" />
          <AlertDescription className="text-[#DC2626] text-sm font-medium">
            存在 {blockingIssues.length} 个阻断项，必须处理所有阻断项才能通过审核
          </AlertDescription>
        </Alert>
      )}

      {/* 审核结果汇总 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '阻断项', value: blockingIssues.length, sub: '必须处理', color: 'text-[#DC2626]', bg: 'bg-[#FEF2F2]' },
          { label: '警告项', value: warningIssues.length, sub: '需确认', color: 'text-[#EA580C]', bg: 'bg-[#FFF7ED]' },
          { label: '建议项', value: adviceIssues.length, sub: '参考处理', color: 'text-[#2F80ED]', bg: 'bg-[#EAF4FF]' },
        ].map((item) => (
          <Card key={item.label} className="border-[#E5E9F0]">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#9CA3AF]">{item.label}</p>
                  <p className={`text-3xl font-bold mt-0.5 ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{item.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 问题详情 */}
        <Card className="border-[#E5E9F0]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#111827]">审核问题详情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasAnyIssues && loaded && (
              <div className="text-center text-xs text-[#9CA3AF] py-6">暂无审核问题</div>
            )}
            {blockingIssues.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#DC2626] mb-2">阻断项 ({blockingIssues.length})</p>
                <div className="space-y-1.5">
                  {blockingIssues.map((issue) => (
                    <div key={issue.id} className="p-2.5 border-2 border-[#FECACA] bg-[#FEF2F2] rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#111827]">{issue.title}</p>
                          {issue.module && (
                            <span className="text-xs bg-white/70 text-[#374151] px-1.5 py-0.5 rounded mt-1 inline-block">{issue.module}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {warningIssues.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#EA580C] mb-2">警告项 ({warningIssues.length})</p>
                <div className="space-y-1.5">
                  {warningIssues.map((issue) => (
                    <div key={issue.id} className="p-2.5 border-2 border-[#FED7AA] bg-[#FFF7ED] rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#EA580C] flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#111827]">{issue.title}</p>
                          {issue.module && (
                            <span className="text-xs bg-white/70 text-[#374151] px-1.5 py-0.5 rounded mt-1 inline-block">{issue.module}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {adviceIssues.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#2F80ED] mb-2">建议项 ({adviceIssues.length})</p>
                <div className="space-y-1.5">
                  {adviceIssues.map((issue) => (
                    <div key={issue.id} className="p-2.5 border-2 border-[#BFDBFE] bg-[#EAF4FF] rounded-lg">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-[#2F80ED] flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#111827]">{issue.title}</p>
                          {issue.module && (
                            <span className="text-xs bg-white/70 text-[#374151] px-1.5 py-0.5 rounded mt-1 inline-block">{issue.module}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 决策表单 */}
        <Card className="border-[#E5E9F0]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#111827]">审核决策</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-[#374151] mb-2">决策结果</p>
              <div className="space-y-2">
                {decisionOptions.map((opt) => (
                  <label key={opt.value}
                    className={`flex items-center gap-3 p-2.5 border-2 rounded-lg cursor-pointer transition-colors ${
                      decision === opt.value ? opt.activeColor : opt.color
                    } hover:border-[#2F80ED]`}>
                    <input type="radio" name="decision" value={opt.value}
                      checked={decision === opt.value}
                      onChange={(e) => setDecision(e.target.value)}
                      className="w-4 h-4 accent-[#2F80ED]" />
                    <div>
                      <p className="text-sm font-medium text-[#111827]">{opt.label}</p>
                      <p className="text-xs text-[#9CA3AF]">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {(decision === 'reject-m06' || decision === 'reject-m07') && (
              <div>
                <p className="text-xs font-medium text-[#374151] mb-1.5">预计回稿时间</p>
                <input type="date" className="w-full px-3 py-2 text-sm border border-[#E5E9F0] rounded-lg focus:outline-none focus:border-[#2F80ED]" />
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-[#374151] mb-1.5">决策说明</p>
              <textarea
                value={decisionComment}
                onChange={(e) => setDecisionComment(e.target.value)}
                placeholder="请输入审核决策的详细说明..."
                rows={4}
                className="w-full px-3 py-2 text-sm border border-[#E5E9F0] rounded-lg focus:outline-none focus:border-[#2F80ED] resize-none"
              />
              <p className="text-xs text-[#9CA3AF] text-right mt-0.5">{decisionComment.length}/500</p>
            </div>

            <div className="flex gap-2">
              <Button
                disabled={!decision || (decision !== 'pass' && !decisionComment) || isSubmitting}
                onClick={handleSubmitDecision}
                className="flex-1 bg-[#2F80ED] text-white h-9 text-sm">
                {isSubmitting ? '提交中...' : '提交审核决策'}
              </Button>
              <Button variant="outline" className="flex-1 border-[#E5E9F0] text-[#374151] h-9 text-sm">
                保存草稿
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
