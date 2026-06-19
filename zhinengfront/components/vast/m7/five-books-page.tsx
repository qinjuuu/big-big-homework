"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChevronLeft,
  FileText,
  FileCheck,
  Image,
  BookOpen,
  Download,
  Eye,
  RefreshCw,
  Send,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { getWritingById } from "@/lib/api"

interface FiveBooksPageProps {
  onBack: () => void
  onSubmit: () => void
  writingId?: string | number
}

interface BookFile {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  status: "pending" | "generating" | "success" | "error"
  pages?: number
  size?: string
  field: string // 后端 writing 字段名
  content?: string
}

// UI 配置（保留）：五书章节对应的字段、图标、显示名
const BOOK_CONFIG: Array<Omit<BookFile, "status" | "content">> = [
  { id: "spec", name: "说明书", icon: BookOpen, field: "spec_content" },
  { id: "claims", name: "权利要求书", icon: FileCheck, field: "claim_content" },
  { id: "abstract", name: "摘要", icon: FileText, field: "abstract_content" },
  { id: "drawings", name: "附图说明", icon: FileText, field: "drawings_content" },
  { id: "abstract-drawing", name: "摘要附图", icon: Image, field: "abstract_drawing_content" },
]

function buildFiles(writing: any): BookFile[] {
  return BOOK_CONFIG.map((cfg) => {
    const raw = writing ? writing[cfg.field] : ""
    const has = typeof raw === "string" && raw.trim().length > 0
    return {
      ...cfg,
      content: has ? raw : "",
      status: has ? "success" : "pending",
      pages: has ? Math.max(1, Math.ceil(raw.length / 800)) : undefined,
      size: has ? `${Math.ceil(raw.length / 1024)}KB` : undefined,
    }
  })
}

export function FiveBooksPage({ onBack, onSubmit, writingId }: FiveBooksPageProps) {
  const [files, setFiles] = useState<BookFile[]>(buildFiles(null))
  const [isGenerating, setIsGenerating] = useState(false)
  const [writing, setWriting] = useState<any | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const reload = () => {
    if (!writingId) {
      setFiles(buildFiles(null))
      setWriting(null)
      return
    }
    setIsGenerating(true)
    getWritingById(writingId)
      .then((data) => {
        setWriting(data)
        const next = buildFiles(data)
        setFiles(next)
        const firstSuccess = next.find((f) => f.status === "success")
        if (firstSuccess) setSelectedFile(firstSuccess.id)
      })
      .catch((err) => {
        console.error("加载五书失败:", err)
        setWriting(null)
        setFiles(buildFiles(null))
      })
      .finally(() => setIsGenerating(false))
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writingId])

  const generated = files.some((f) => f.status === "success")
  const allSuccess = files.every((f) => f.status === "success")

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "generating":
        return <Loader2 className="h-4 w-4 text-[#2F80ED] animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-[#D1D5DB]" />
    }
  }

  const headerTitle = "五书生成"
  const headerSub = writing?.case_name || (writingId ? "加载中..." : "未传入 writingId")
  const currentFile = selectedFile ? files.find((f) => f.id === selectedFile) : null

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
            <Button onClick={reload} disabled={isGenerating || !writingId}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  生成五书
                </>
              )}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={reload}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重新加载
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                全部导出
              </Button>
              <Button onClick={onSubmit} disabled={!allSuccess}>
                <Send className="h-4 w-4 mr-2" />
                提交审核
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* 左侧：文件生成清单 */}
        <Card className="w-80 flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">文件生成清单</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file) => {
                const Icon = file.icon
                return (
                  <div
                    key={file.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedFile === file.id
                        ? "bg-[#EAF4FF] border border-[#2F80ED]"
                        : "bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-transparent"
                    }`}
                    onClick={() => file.status === "success" && setSelectedFile(file.id)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-border">
                      <Icon className="h-5 w-5 text-[#6B7280]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#111827]">{file.name}</div>
                      {file.status === "success" && (
                        <div className="text-xs text-[#9CA3AF] mt-0.5">
                          {file.pages ?? "-"} 页 · {file.size ?? "-"}
                        </div>
                      )}
                      {file.status === "generating" && (
                        <div className="text-xs text-[#2F80ED] mt-0.5">正在生成...</div>
                      )}
                      {file.status === "pending" && (
                        <div className="text-xs text-[#9CA3AF] mt-0.5">暂无内容</div>
                      )}
                    </div>
                    {getStatusIcon(file.status)}
                  </div>
                )
              })}
            </div>

            {generated && allSuccess && (
              <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">五书文件生成完成</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 右侧：文件预览 */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {currentFile ? `${currentFile.name} 预览` : "文件预览"}
              </CardTitle>
              {currentFile && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    全屏预览
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    下载
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            {!writingId ? (
              <div className="h-full flex items-center justify-center text-[#9CA3AF]">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-[#D1D5DB]" />
                  <p>未传入 writingId</p>
                </div>
              </div>
            ) : !generated ? (
              <div className="h-full flex items-center justify-center text-[#9CA3AF]">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-[#D1D5DB]" />
                  <p>暂无五书内容</p>
                  <p className="text-sm mt-1">请先在后端生成对应字段</p>
                </div>
              </div>
            ) : !currentFile ? (
              <div className="h-full flex items-center justify-center text-[#9CA3AF]">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-3 text-[#D1D5DB]" />
                  <p>选择左侧文件进行预览</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-6">
                  <div className="prose prose-sm max-w-none">
                    <h1 className="text-xl font-bold text-center mb-6">{currentFile.name}</h1>
                    {currentFile.content ? (
                      <div className="whitespace-pre-wrap text-[#374151] leading-relaxed">
                        {currentFile.content}
                      </div>
                    ) : (
                      <div className="text-center text-xs text-[#9CA3AF] py-10">
                        暂无{currentFile.name}内容
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
