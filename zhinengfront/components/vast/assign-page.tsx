"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Check, User, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getCases,
  getUsers,
  updateCaseStatus,
  type CaseItem,
  type UserItem,
} from "@/lib/api"

interface AssignPageProps {
  onBack: () => void
}

export function AssignPage({ onBack }: AssignPageProps) {
  const [pendingItems, setPendingItems] = useState<CaseItem[]>([])
  const [engineers, setEngineers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [selectedEngineer, setSelectedEngineer] = useState<string>("")
  const [taskType, setTaskType] = useState<string>("presale")
  const [assignNote, setAssignNote] = useState("")
  const [deadline, setDeadline] = useState("")

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getCases({ m05_status: "checking", pageSize: 50 }),
      getUsers({ role: "engineer" }),
    ])
      .then(([cases, users]) => {
        setPendingItems(cases.list || [])
        setEngineers(users || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const selectedSource = pendingItems.find((item) => item.case_id === selectedItem)

  const handleConfirm = async () => {
    if (!selectedItem || !selectedEngineer) return
    setSubmitting(true)
    try {
      const engineer = engineers.find((e) => String(e.id) === selectedEngineer)
      await updateCaseStatus(selectedItem, {
        m05_status: taskType === "presale" ? "checking" : "filing",
        engineer: engineer?.display_name || engineer?.username,
        opt_user: "system",
        opt_content: assignNote
          ? `分配给${engineer?.display_name || engineer?.username}（${taskType}）：${assignNote}`
          : `分配给${engineer?.display_name || engineer?.username}（${taskType}）`,
      })
      onBack()
    } catch (e) {
      console.error(e)
      alert("分配失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">专利经理分配</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            将售前咨询或客服立案任务分配给专利工程师
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#111827]">
                  待分配来源
                </CardTitle>
                <span className="text-sm text-[#6B7280]">
                  共 <span className="font-medium text-[#1F2937]">{pendingItems.length}</span> 条
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F5F7FA]">
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="font-medium text-[#6B7280]">来源编号</TableHead>
                    <TableHead className="font-medium text-[#6B7280]">客户名称</TableHead>
                    <TableHead className="font-medium text-[#6B7280]">技术主题</TableHead>
                    <TableHead className="font-medium text-[#6B7280]">专利类型</TableHead>
                    <TableHead className="font-medium text-[#6B7280]">创建时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-[#9CA3AF] py-6">
                        加载中...
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && pendingItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-[#9CA3AF] py-6">
                        暂无待分配来源
                      </TableCell>
                    </TableRow>
                  )}
                  {pendingItems.map((item) => (
                    <TableRow
                      key={item.case_id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedItem === item.case_id
                          ? "bg-[#EAF4FF]"
                          : "hover:bg-[#F5F7FA]/50"
                      )}
                      onClick={() => setSelectedItem(item.case_id)}
                    >
                      <TableCell>
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                            selectedItem === item.case_id
                              ? "border-[#2F80ED] bg-[#2F80ED]"
                              : "border-[#E5EAF2]"
                          )}
                        >
                          {selectedItem === item.case_id && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-[#2F80ED]">
                        {item.case_id}
                      </TableCell>
                      <TableCell className="text-[#1F2937]">{item.client_name}</TableCell>
                      <TableCell className="text-[#1F2937] max-w-40 truncate">
                        {item.case_name}
                      </TableCell>
                      <TableCell className="text-[#6B7280]">{item.patent_type || "-"}</TableCell>
                      <TableCell className="text-[#6B7280] font-mono text-xs">
                        {item.create_time}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-2 space-y-4">
          {selectedSource && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[#111827]">
                  来源摘要
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">来源编号</span>
                  <span className="font-mono text-[#2F80ED]">{selectedSource.case_id}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">客户名称</span>
                  <span className="text-[#1F2937]">{selectedSource.client_name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">技术主题</span>
                  <span className="text-[#1F2937] truncate max-w-40">
                    {selectedSource.case_name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">专利类型</span>
                  <span className="text-[#1F2937]">{selectedSource.patent_type || "-"}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#111827]">
                分配设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1F2937]">
                  选择工程师 <span className="text-[#F5222D]">*</span>
                </Label>
                <Select value={selectedEngineer} onValueChange={setSelectedEngineer}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择专利工程师" />
                  </SelectTrigger>
                  <SelectContent>
                    {engineers.map((engineer) => (
                      <SelectItem key={engineer.id} value={String(engineer.id)}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#EAF4FF] flex items-center justify-center">
                              <User className="h-3 w-3 text-[#2F80ED]" />
                            </div>
                            <span>{engineer.display_name || engineer.username}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                            <span>{engineer.role}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    {engineers.length === 0 && (
                      <div className="px-4 py-2 text-sm text-[#9CA3AF]">暂无可分配工程师</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedEngineer && (
                <div className="p-3 bg-[#F5F7FA] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EAF4FF] flex items-center justify-center">
                      <User className="h-5 w-5 text-[#2F80ED]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1F2937]">
                        {engineers.find((e) => String(e.id) === selectedEngineer)?.display_name}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        角色：
                        {engineers.find((e) => String(e.id) === selectedEngineer)?.role}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1F2937]">
                  任务类型 <span className="text-[#F5222D]">*</span>
                </Label>
                <RadioGroup
                  value={taskType}
                  onValueChange={setTaskType}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="presale" id="presale" />
                    <Label htmlFor="presale" className="font-normal cursor-pointer">
                      售前初检
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="structure" id="structure" />
                    <Label htmlFor="structure" className="font-normal cursor-pointer">
                      交底解构
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-[#9CA3AF]">
                  {taskType === "presale"
                    ? "售前初检：进入 AI初检/反馈路径"
                    : "交底解构：进入 M06 交底书引擎模型"}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1F2937]">截止时间</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1F2937]">分配说明</Label>
                <Textarea
                  placeholder="请输入分配说明（可选）"
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="flex-1" onClick={onBack}>
              取消
            </Button>
            <Button
              className="flex-1 bg-[#2F80ED] hover:bg-[#2F80ED]/90 text-white"
              disabled={!selectedItem || !selectedEngineer || submitting}
              onClick={handleConfirm}
            >
              {submitting ? "分配中..." : "确认分配"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
