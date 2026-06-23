"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, FileCheck, CheckCircle, AlertTriangle, XCircle, RefreshCw, Send, Download } from "lucide-react"
import { aiPreSubmitCheck, getCaseDetail, type PreSubmitCheckResult, type CaseDetail } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PreSubmitCheckProps {
  caseId?: string
  onBack?: () => void
  onNavigate?: (page: string) => void
}

function statusColorClass(status: string) {
  switch (status) {
    case 'pass': return 'bg-green-100 text-green-700'
    case 'warning': return 'bg-yellow-100 text-yellow-700'
    case 'fail': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pass': return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
    case 'fail': return <XCircle className="h-5 w-5 text-red-600" />
    default: return null
  }
}

export function PreSubmitCheck({ caseId, onBack, onNavigate }: PreSubmitCheckProps) {
  const [caseData, setCaseData] = useState<CaseDetail | null>(null)
  const [result, setResult] = useState<PreSubmitCheckResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('formal')
  const [fixedItems, setFixedItems] = useState<string[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [dialogMessage, setDialogMessage] = useState('')

  useEffect(() => {
    if (caseId) {
      getCaseDetail(caseId).then(setCaseData).catch(console.error)
    }
  }, [caseId])

  const handleCheck = async () => {
    if (!caseId) return
    setLoading(true)
    try {
      const res = await aiPreSubmitCheck({ caseId: caseId })
      setResult(res)
      setFixedItems([])
    } catch (err) {
      console.error('Check failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleFixed = (itemName: string) => {
    setFixedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(i => i !== itemName)
        : [...prev, itemName]
    )
  }

  const handleSubmit = () => {
    if (result?.overallStatus !== 'pass') {
      setDialogMessage('检查未通过，请修复所有失败项后再提交。')
      setShowDialog(true)
      return
    }
    setDialogMessage('案件已通过交案前检查，确认提交交案？')
    setShowDialog(true)
  }

  const allItems = result ? [
    ...result.formalCheck.items.map(i => ({ ...i, section: '形式审查' })),
    ...result.completenessCheck.items.map(i => ({ ...i, section: '完整性检查' })),
    ...result.consistencyCheck.items.map(i => ({ ...i, section: '一致性检查' })),
  ] : []

  const currentSection = (() => {
    switch (activeTab) {
      case 'formal': return result?.formalCheck
      case 'completeness': return result?.completenessCheck
      case 'consistency': return result?.consistencyCheck
      default: return null
    }
  })()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => onBack ? onBack() : onNavigate?.("m09-waiting-cases")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">交案前检查</h1>
              {result && (
                <Badge className={result.overallStatus === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                  {result.overallStatus === 'pass' ? '通过' : '未通过'}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">案件编号: {caseId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCheck} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            {loading ? '检查中...' : '开始检查'}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            导出报告
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!result || result.overallStatus !== 'pass'}>
            <Send className="mr-2 h-4 w-4" />
            提交交案
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {result && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">综合得分</p>
                  <p className={cn("text-2xl font-semibold", result.totalScore >= 80 ? 'text-green-600' : result.totalScore >= 60 ? 'text-yellow-600' : 'text-red-600')}>
                    {result.totalScore}分
                  </p>
                </div>
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", result.totalScore >= 80 ? 'bg-green-100' : 'bg-yellow-100')}>
                  <FileCheck className={cn("h-5 w-5", result.totalScore >= 80 ? 'text-green-600' : 'text-yellow-600')} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">形式审查</p>
                  <p className={cn("text-2xl font-semibold", result.formalCheck.status === 'pass' ? 'text-green-600' : 'text-red-600')}>
                    {result.formalCheck.score}分
                  </p>
                </div>
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", result.formalCheck.status === 'pass' ? 'bg-green-100' : 'bg-red-100')}>
                  <StatusIcon status={result.formalCheck.status} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">完整性检查</p>
                  <p className={cn("text-2xl font-semibold", result.completenessCheck.status === 'pass' ? 'text-green-600' : 'text-red-600')}>
                    {result.completenessCheck.score}分
                  </p>
                </div>
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", result.completenessCheck.status === 'pass' ? 'bg-green-100' : 'bg-red-100')}>
                  <StatusIcon status={result.completenessCheck.status} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">一致性检查</p>
                  <p className={cn("text-2xl font-semibold", result.consistencyCheck.status === 'pass' ? 'text-green-600' : 'text-red-600')}>
                    {result.consistencyCheck.score}分
                  </p>
                </div>
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", result.consistencyCheck.status === 'pass' ? 'bg-green-100' : 'bg-red-100')}>
                  <StatusIcon status={result.consistencyCheck.status} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary */}
      {result && (
        <Card className="border-l-4" style={{ borderLeftColor: result.overallStatus === 'pass' ? '#10B981' : '#EF4444' }}>
          <CardContent className="pt-4">
            <p className="text-sm text-foreground">{result.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Detail Tabs */}
      {result && (
        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="formal">
                  形式审查 ({result.formalCheck.items.length})
                </TabsTrigger>
                <TabsTrigger value="completeness">
                  完整性检查 ({result.completenessCheck.items.length})
                </TabsTrigger>
                <TabsTrigger value="consistency">
                  一致性检查 ({result.consistencyCheck.items.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab} className="mt-6">
                <div className="space-y-3">
                  {currentSection?.items.map((item, idx) => (
                    <div key={idx} className={cn(
                      "flex items-start justify-between p-3 rounded-lg border",
                      item.status === 'pass' ? 'bg-green-50 border-green-200' :
                      item.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-red-50 border-red-200'
                    )}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <StatusIcon status={item.status} />
                          <span className="font-medium text-sm">{item.name}</span>
                          <Badge variant="outline" className={cn("text-xs", statusColorClass(item.status))}>
                            {item.status === 'pass' ? '通过' : item.status === 'warning' ? '警告' : '失败'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 ml-7">{item.detail}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Checkbox
                          checked={fixedItems.includes(item.name)}
                          onCheckedChange={() => toggleFixed(item.name)}
                          disabled={item.status === 'pass'}
                        />
                        <span className="text-sm text-muted-foreground">已修复</span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>点击"开始检查"进行交案前检查</p>
              <p className="text-sm mt-1">检查内容包括：形式审查、完整性检查、一致性检查</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
              <p>正在进行交案前检查...</p>
              <p className="text-sm mt-1">AI正在检查五书格式、内容完整性和文件一致性</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>提示</DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>取消</Button>
            <Button onClick={() => { setShowDialog(false); onNavigate?.("m09-waiting-cases"); }}>确认</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function cn(...classes: (string | undefined | false | true)[]) {
  return classes.filter(Boolean).join(' ')
}