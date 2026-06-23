"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { M06ProgressBar } from "@/components/vast/m6/m06-progress-bar"
import { createWriting } from "@/lib/api"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  FileText,
  Search,
  Layers,
  Shield,
  Package,
  Star,
  ChevronRight,
} from "lucide-react"

interface SubmitM07Props {
  onBack?: () => void
  onSubmit?: () => void
  onNavigate?: (page: string) => void
  caseId?: string
}

// 前置条件检查清单（待对接真实校验结果）
const checklistItems: Array<{ id: string; label: string; status: "pass" | "warning" | "fail"; required: boolean }> = []

// 风险提示（待对接真实校验结果）
const riskItems: Array<{ level: string; message: string }> = []

export function SubmitM07({ onBack, onSubmit, onNavigate, caseId }: SubmitM07Props) {
  const [confirmed, setConfirmed] = useState(false)
  const [remarks, setRemarks] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const passCount = checklistItems.filter(item => item.status === "pass").length
  const warningCount = checklistItems.filter(item => item.status === "warning").length
  const failCount = checklistItems.filter(item => item.status === "fail").length
  const requiredFailCount = checklistItems.filter(item => item.required && item.status === "fail").length

  const canSubmit = requiredFailCount === 0 && confirmed

  const handleSubmit = async () => {
    if (!caseId) {
      alert("缺少案件ID，无法创建撰写任务")
      return
    }
    setIsSubmitting(true)
    try {
      // 调用后端 API 创建撰写记录
      await createWriting({ case_id: caseId, write_user: "前端用户" })
      setSubmitted(true)
      // 2秒后自动跳转
      setTimeout(() => {
        onSubmit?.()
      }, 1500)
    } catch (err) {
      console.error("创建撰写任务失败:", err)
      alert("提交失败，请检查网络或联系管理员")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-[#F5F7FA]">
        <Card className="w-[480px]">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-[#111827] mb-2">提交成功</h2>
            <p className="text-sm text-[#6B7280] mb-6">
              已成功创建 M07 撰写任务，案件状态已变更为"撰写中"
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onBack} className="flex-1">
                返回 M06
              </Button>
              <Button onClick={() => onNavigate?.("m07-dashboard")} className="flex-1 bg-[#2F80ED]">
                前往 M07 创作
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* M06 Progress Bar */}
      <M06ProgressBar currentStep={11} />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">提交M07确认</h1>
            <p className="text-sm text-muted-foreground">
              完成前置条件检查，创建M07创作任务
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBack}>
            返回修改
          </Button>
          <Button 
            className="bg-[#2F80ED] hover:bg-[#1E5EFF]"
            disabled={!canSubmit || isSubmitting}
            onClick={handleSubmit}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? "提交中..." : "确认提交M07"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 检查结果概览 */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700">{passCount}</div>
                  <div className="text-sm text-green-600">已通过</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-700">{warningCount}</div>
                  <div className="text-sm text-yellow-600">警告项</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-700">{failCount}</div>
                  <div className="text-sm text-red-600">阻断项</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 前置条件检查清单 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                前置条件检查清单
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checklistItems.map((item) => (
                  <div 
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      item.status === "pass" 
                        ? "bg-green-50 border-green-200" 
                        : item.status === "warning"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.status === "pass" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : item.status === "warning" ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="text-sm">{item.label}</span>
                      {item.required && (
                        <Badge variant="outline" className="text-xs">必需</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={item.status === "pass" ? "default" : item.status === "warning" ? "secondary" : "destructive"}
                        className={
                          item.status === "pass" 
                            ? "bg-green-100 text-green-700" 
                            : item.status === "warning"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }
                      >
                        {item.status === "pass" ? "已完成" : item.status === "warning" ? "警告" : "未完成"}
                      </Badge>
                      {item.status !== "pass" && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            // 根据检查项跳转到对应页面
                            if (item.id === "distinction") onNavigate?.("m06-prior-art")
                            else if (item.id === "second-search") onNavigate?.("m06-second-search")
                            else if (item.id === "completeness") onNavigate?.("m06-validation")
                          }}
                        >
                          去处理
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 风险提示 */}
          {riskItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  提交风险提示
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {riskItems.map((risk, index) => (
                    <Alert key={index} variant={risk.level === "warning" ? "default" : "default"}>
                      <AlertTriangle className={`h-4 w-4 ${risk.level === "warning" ? "text-yellow-600" : "text-blue-600"}`} />
                      <AlertDescription>{risk.message}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 提交备注 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">提交备注（可选）</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="填写提交备注，便于M07工程师了解特殊情况..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* 确认提交 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="confirm"
                  checked={confirmed}
                  onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                />
                <div>
                  <Label htmlFor="confirm" className="text-sm font-medium cursor-pointer">
                    我已确认以上检查项，同意将本交底模型提交至M07创作平台
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    提交后将创建M07创作任务，M07工程师可开始专利文件撰写工作
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 输出物预览 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">将提交至M07的输出物</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium">完整交底书</div>
                    <div className="text-xs text-muted-foreground">final_disclosure_doc</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Package className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-sm font-medium">可撰写数据包</div>
                    <div className="text-xs text-muted-foreground">disclosure_package</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Search className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-sm font-medium">检索对比资产</div>
                    <div className="text-xs text-muted-foreground">ai_search_comparison</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
