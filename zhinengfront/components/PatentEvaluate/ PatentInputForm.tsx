"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Sparkles } from "lucide-react"
import { PatentEvaluateSubmitParams } from "@/lib/api"

interface PatentInputFormProps {
    formData: PatentEvaluateSubmitParams
    loading: boolean
    onChange: (key: keyof PatentEvaluateSubmitParams, value: string | number) => void
    onSubmit: () => void
}

export default function PatentInputForm({ formData, loading, onChange, onSubmit }: PatentInputFormProps) {
    const handleInput = (key: keyof PatentEvaluateSubmitParams, val: string | number) => {
        onChange(key, val)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    专利信息录入
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                {/* 基础专利信息 */}
                <div className="space-y-3">
                    <h3 className="font-medium text-sm text-foreground">基础专利信息</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>专利号</Label>
                            <Input value={formData.patentNo} onChange={(e) => handleInput("patentNo", e.target.value)} placeholder="ZL202XXXXXXXXX" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>专利名称</Label>
                            <Input value={formData.patentName} onChange={(e) => handleInput("patentName", e.target.value)} placeholder="输入专利全称" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>专利类型</Label>
                            <Select value={formData.patentType} onValueChange={(v) => handleInput("patentType", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择类型" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="invention">发明专利</SelectItem>
                                    <SelectItem value="utility">实用新型</SelectItem>
                                    <SelectItem value="design">外观设计</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>权利要求数量</Label>
                            <Input type="number" value={formData.claimCount} onChange={(e) => handleInput("claimCount", Number(e.target.value))} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label>所属技术领域</Label>
                        <Input value={formData.techField} onChange={(e) => handleInput("techField", e.target.value)} placeholder="如新能源电池、人工智能算法" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>技术方案/交底详情</Label>
                        <Textarea rows={3} value={formData.disclosureContent} onChange={(e) => handleInput("disclosureContent", e.target.value)} placeholder="简述专利解决的技术问题、创新结构、实现效果" />
                    </div>
                </div>

                {/* 市场维度 */}
                <div className="space-y-3">
                    <h3 className="font-medium text-sm text-foreground">市场维度信息</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>目标市场规模</Label>
                            <Input value={formData.marketScale} onChange={(e) => handleInput("marketScale", e.target.value)} placeholder="亿元/年" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>同类竞品专利数量</Label>
                            <Input type="number" value={formData.competitorCount} onChange={(e) => handleInput("competitorCount", Number(e.target.value))} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>商业化阶段</Label>
                            <Select value={formData.commercialStage} onValueChange={(v) => handleInput("commercialStage", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择阶段" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="research">研发阶段</SelectItem>
                                    <SelectItem value="pilot">小试中试</SelectItem>
                                    <SelectItem value="mass">量产落地</SelectItem>
                                    <SelectItem value="commercial">已商用盈利</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>剩余保护年限</Label>
                            <Input type="number" value={formData.remainYear} onChange={(e) => handleInput("remainYear", Number(e.target.value))} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label>实际应用场景</Label>
                        <Textarea rows={2} value={formData.applyScene} onChange={(e) => handleInput("applyScene", e.target.value)} placeholder="该专利可落地的产品、行业场景" />
                    </div>
                </div>

                {/* 法律维度 */}
                <div className="space-y-3">
                    <h3 className="font-medium text-sm text-foreground">法律维度信息</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>法律状态</Label>
                            <Select value={formData.legalStatus} onValueChange={(v) => handleInput("legalStatus", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择状态" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="valid">有效授权</SelectItem>
                                    <SelectItem value="exam">实质审查中</SelectItem>
                                    <SelectItem value="expire">失效过期</SelectItem>
                                    <SelectItem value="abandon">视为放弃</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>许可/转让计划</Label>
                            <Input value={formData.licensePlan} onChange={(e) => handleInput("licensePlan", e.target.value)} placeholder="无/独家许可/普通许可/转让" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label>诉讼/无效纠纷历史</Label>
                        <Textarea rows={2} value={formData.litigationHistory} onChange={(e) => handleInput("litigationHistory", e.target.value)} placeholder="无/有无侵权诉讼、无效宣告记录" />
                    </div>
                </div>

                {/* 直接内联按钮，不再引入外部组件 */}
                <Button onClick={onSubmit} disabled={loading} className="w-full gap-2 mt-4">
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            AI评估计算中...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            启动AI价值评估
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}