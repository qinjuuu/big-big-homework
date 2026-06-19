'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertCircle, CheckCircle, FileText, Clock,
  ChevronLeft, ChevronRight, Play, MessageSquare, Download,
} from 'lucide-react'
import { getReviewDetail, getCaseDetail, type ReviewIssueItem } from '@/lib/api'

interface ReviewTaskDetailProps {
  reviewId?: string | number
  onNavigate?: (page: string) => void
}

interface TaskInfo {
  id: string
  caseNo: string
  title: string
  type: string
  method: string
  status: string
  priority: string
  reviewer: string
  submitTime: string
  blockingCount: number
  warningCount: number
}

const EMPTY_TASK: TaskInfo = {
  id: '-', caseNo: '-', title: '-', type: '-', method: '-',
  status: '-', priority: '-', reviewer: '-', submitTime: '-',
  blockingCount: 0, warningCount: 0,
}

export function ReviewTaskDetail({ reviewId, onNavigate }: ReviewTaskDetailProps) {
  const [activeTab, setActiveTab] = useState('info')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [taskInfo, setTaskInfo] = useState<TaskInfo>(EMPTY_TASK)
  const [reviewItems, setReviewItems] = useState<ReviewIssueItem[]>([])
  const [issueNote, setIssueNote] = useState<string>('')

  const reviewActions = [
    { label: '运行规则', icon: Play, page: null },
    { label: '交底书审核', icon: FileText, page: 'm08-disclosure-review' },
    { label: '审核决策', icon: CheckCircle, page: 'm08-review-decision' },
    { label: '新增问题', icon: MessageSquare, page: null },
    { label: '生成报告', icon: Download, page: null },
  ]

  useEffect(() => {
    if (!reviewId) {
      setTaskInfo(EMPTY_TASK)
      setReviewItems([])
      setIssueNote('')
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const review: any = await getReviewDetail(reviewId as any)

        // 案件标题：优先 case_name，缺失时尝试通过 getCaseDetail 联表
        let title = review?.case_name || ''
        if (!title && review?.case_id) {
          try {
            const caseDetail = await getCaseDetail(review.case_id)
            title = caseDetail?.case_name || ''
          } catch {
            /* 忽略联查失败 */
          }
        }

        // issues 列表：优先后端 issues；否则从 status / risk_assessment / audit_remark / ai_advice 抽取一条
        let items: ReviewIssueItem[] = []
        let note = ''
        if (Array.isArray(review?.issues) && review.issues.length > 0) {
          items = review.issues
        } else {
          const summary =
            review?.audit_remark ||
            review?.ai_advice ||
            review?.risk_assessment ||
            ''
          if (summary || review?.m08_status || review?.audit_result) {
            items = [{
              type: review?.audit_result === '通过' ? 'info' : 'warning',
              title: summary || `审核状态：${review?.m08_status || '-'}`,
              module: 'quality_check',
              status: review?.m08_status || review?.audit_result || '-',
            }]
            note = '当前接口未返回 issue 列表，信息从 status / risk_assessment 抽取。'
          } else {
            items = []
            note = '暂无审核问题'
          }
        }

        // 阻断/警告计数（基于 type 字段）
        const blockingCount = items.filter(i => i.type === 'blocking').length
        const warningCount = items.filter(i => i.type === 'warning').length

        const next: TaskInfo = {
          id: String(review?.id ?? review?.case_id ?? '-'),
          caseNo: review?.case_id || '-',
          title: title || review?.case_id || '-',
          type: review?.patent_type || '-',
          method: review?.apply_method || '-',
          status: review?.m08_status || review?.audit_result || '-',
          priority: review?.priority || '-',
          reviewer: review?.audit_user || review?.engineer || '-',
          submitTime: review?.create_time || review?.audit_time || '-',
          blockingCount,
          warningCount,
        }

        if (cancelled) return
        setTaskInfo(next)
        setReviewItems(items)
        setIssueNote(note)
      } catch (e: any) {
        if (cancelled) return
        setError(e?.message || '加载审核详情失败')
        setTaskInfo(EMPTY_TASK)
        setReviewItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [reviewId])

  const getTypeStyle = (type?: string) => {
    switch (type) {
      case 'blocking': return 'border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]'
      case 'warning': return 'border-[#FED7AA] bg-[#FFF7ED] text-[#EA580C]'
      default: return 'border-[#E5E9F0] bg-[#F9FAFB] text-[#374151]'
    }
  }

  // 空态：未传 reviewId
  if (!reviewId) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" className="text-[#9CA3AF] h-7 px-2 -ml-2"
            onClick={() => onNavigate?.('m08-task-list')}>
            <ChevronLeft className="w-4 h-4 mr-1" />审核任务列表
          </Button>
        </div>
        <Card className="border-[#E5E9F0]">
          <CardContent className="py-16 text-center">
            <FileText className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
            <p className="text-sm text-[#374151]">请从审核任务列表选择一条记录查看详情</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" className="text-[#9CA3AF] h-7 px-2 -ml-2"
              onClick={() => onNavigate?.('m08-task-list')}>
              <ChevronLeft className="w-4 h-4 mr-1" />审核任务列表
            </Button>
          </div>
          <h1 className="text-xl font-semibold text-[#111827]">{taskInfo.title}</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs text-[#9CA3AF]">案件编号：{taskInfo.caseNo}</span>
            <span className="text-xs text-[#9CA3AF]">审核编号：{taskInfo.id}</span>
            <span className="text-xs bg-[#EAF4FF] text-[#2F80ED] px-2 py-0.5 rounded-full font-medium">{taskInfo.status}</span>
            <span className="text-xs border border-[#E5E9F0] text-[#374151] px-2 py-0.5 rounded-full">{taskInfo.type}</span>
            <span className="text-xs border border-[#E5E9F0] text-[#374151] px-2 py-0.5 rounded-full">{taskInfo.method}</span>
          </div>
        </div>
        <div className="text-right text-sm text-[#9CA3AF]">
          <p>审核人：{taskInfo.reviewer}</p>
          <p className="mt-0.5">{taskInfo.submitTime}</p>
        </div>
      </div>

      {loading && (
        <Alert className="border-[#E5E9F0] bg-[#F9FAFB] py-3">
          <Clock className="h-4 w-4 text-[#2F80ED]" />
          <AlertDescription className="text-[#374151] text-sm">加载中...</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-[#FECACA] bg-[#FEF2F2] py-3">
          <AlertCircle className="h-4 w-4 text-[#DC2626]" />
          <AlertDescription className="text-[#DC2626] text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* 快速操作 */}
      <div className="flex gap-2 flex-wrap">
        {reviewActions.map((action) => {
          const Icon = action.icon
          return (
            <Button key={action.label} variant="outline" size="sm"
              className="h-8 border-[#E5E9F0] text-[#374151] text-xs"
              onClick={() => action.page && onNavigate?.(action.page)}>
              <Icon className="w-3.5 h-3.5 mr-1.5" />{action.label}
            </Button>
          )
        })}
      </div>

      {taskInfo.blockingCount > 0 && (
        <Alert className="border-[#FECACA] bg-[#FEF2F2] py-3">
          <AlertCircle className="h-4 w-4 text-[#DC2626]" />
          <AlertDescription className="text-[#DC2626] text-sm">
            存在 {taskInfo.blockingCount} 个阻断项，不允许直接通过审核，需先处理所有阻断项。
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 h-9">
          <TabsTrigger value="info" className="text-xs">案件信息</TabsTrigger>
          <TabsTrigger value="m07" className="text-xs">M07申请文件</TabsTrigger>
          <TabsTrigger value="issues" className="text-xs">审核问题</TabsTrigger>
          <TabsTrigger value="progress" className="text-xs">审核进度</TabsTrigger>
          <TabsTrigger value="disclosure" className="text-xs">完整交底书</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">操作日志</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card className="border-[#E5E9F0]">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-[#111827]">案件基础信息</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-6">
                {[
                  { label: '案件编号', value: taskInfo.caseNo },
                  { label: '专利类型', value: taskInfo.type },
                  { label: '申请方式', value: taskInfo.method },
                  { label: '优先级', value: taskInfo.priority },
                  { label: '审核编号', value: taskInfo.id },
                  { label: '审核人', value: taskInfo.reviewer },
                  { label: '提交时间', value: taskInfo.submitTime },
                  { label: '状态', value: taskInfo.status },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-[#9CA3AF]">{item.label}</p>
                    <p className="font-medium text-sm text-[#111827] mt-1">{item.value || '-'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="m07">
          <Card className="border-[#E5E9F0]">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-[#111827]">M07 申请文件</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['说明书', '权利要求书', '摘要', '附图说明', '摘要附图'].map((doc) => (
                  <div key={doc} className="flex items-center justify-between p-3 border border-[#E5E9F0] rounded-lg">
                    <span className="text-sm text-[#374151]">{doc}</span>
                    <Button variant="ghost" size="sm" className="text-xs text-[#2F80ED] h-7">查看</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <Card className="border-[#E5E9F0]">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-[#111827]">审核问题概览</CardTitle></CardHeader>
            <CardContent>
              {issueNote && (
                <p className="text-xs text-[#9CA3AF] mb-2">{issueNote}</p>
              )}
              {reviewItems.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#9CA3AF]">暂无审核问题</div>
              ) : (
                <div className="space-y-2">
                  {reviewItems.map((item, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border-2 ${getTypeStyle(item.type)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.title}</p>
                          <div className="flex gap-2 mt-1.5">
                            {item.module && (
                              <span className="text-xs bg-white/60 px-1.5 py-0.5 rounded">{item.module}</span>
                            )}
                            {item.status && (
                              <span className="text-xs bg-white/60 px-1.5 py-0.5 rounded">{item.status}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 ml-2 flex-shrink-0 opacity-60" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button size="sm" className="mt-3 w-full bg-[#2F80ED] text-white text-xs"
                onClick={() => onNavigate?.('m08-review-decision')}>
                进入审核决策
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card className="border-[#E5E9F0]">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-[#111827]">审核进度</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { step: '任务分配', status: taskInfo.submitTime !== '-' ? '完成' : '待开始', time: taskInfo.submitTime },
                  { step: '审核中', status: taskInfo.status === '通过' ? '完成' : '进行中', time: taskInfo.submitTime },
                  { step: '审核决策', status: taskInfo.status === '通过' ? '完成' : '待开始', time: '-' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F5F7FA]">
                      {item.status === '完成' && <CheckCircle className="w-5 h-5 text-[#16A34A]" />}
                      {item.status === '进行中' && <Clock className="w-5 h-5 text-[#2F80ED]" />}
                      {item.status === '待开始' && <div className="w-2 h-2 rounded-full bg-[#D1D5DB]" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-[#111827]">{item.step}</p>
                      <p className="text-xs text-[#9CA3AF]">{item.time}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.status === '完成' ? 'bg-[#F0FDF4] text-[#16A34A]' :
                      item.status === '进行中' ? 'bg-[#EAF4FF] text-[#2F80ED]' :
                      'bg-[#F5F7FA] text-[#9CA3AF]'
                    }`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disclosure">
          <Card className="border-[#E5E9F0]">
            <CardContent className="pt-6 text-center">
              <FileText className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
              <p className="text-sm text-[#374151] mb-3">查看完整交底书内容</p>
              <Button size="sm" className="bg-[#2F80ED] text-white text-xs"
                onClick={() => onNavigate?.('m08-disclosure-review')}>
                进入交底书审核页
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card className="border-[#E5E9F0]">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-[#111827]">操作日志</CardTitle></CardHeader>
            <CardContent>
              <div className="py-8 text-center text-sm text-[#9CA3AF]">暂无操作日志</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
