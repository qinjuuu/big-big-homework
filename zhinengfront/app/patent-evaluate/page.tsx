"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, TrendingUp, Shield, FileText, DollarSign, AlertTriangle } from "lucide-react"
import { submitPatentEvaluate, PatentEvaluateSubmitParams, PatentEvaluateResult } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"

export default function PatentEvaluatePage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<PatentEvaluateResult | null>(null)
    const [formData, setFormData] = useState<PatentEvaluateSubmitParams>({
        patentNo: "",
        patentName: "",
        patentType: "",
        techField: "",
        claimCount: 0,
        disclosureContent: "",
        marketScale: "",
        applyScene: "",
        competitorCount: 0,
        commercialStage: "",
        legalStatus: "",
        remainYear: 0,
        litigationHistory: "",
        licensePlan: "",
    })

    // 表单赋值
    const handleInputChange = (key: keyof PatentEvaluateSubmitParams, value: string | number) => {
        setFormData(prev => ({ ...prev, [key]: value }))
    }

    // 提交AI评估
    const handleSubmit = async () => {
        // 简单校验
        if (!formData.patentNo || !formData.patentName || !formData.patentType) {
            toast({ title: "参数不全", description: "请填写专利号、名称、专利类型", variant: "destructive" })
            return
        }
        setLoading(true)
        setResult(null)
        try {
            const res = await submitPatentEvaluate(formData)
            setResult(res)
            toast({ title: "评估完成", description: "AI专利价值分析已生成" })
        } catch (err) {
            toast({ title: "评估失败", description: String(err), variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">AI专利价值评估</h1>
                    <p className="text-sm text-muted-foreground">录入专利信息，AI自动测算技术、法律、市场、经济四大维度价值并打分</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* 左侧录入表单 */}
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
                                    <Input value={formData.patentNo} onChange={(e) => handleInputChange("patentNo", e.target.value)} placeholder="ZL202XXXXXXXXX" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>专利名称</Label>
                                    <Input value={formData.patentName} onChange={(e) => handleInputChange("patentName", e.target.value)} placeholder="输入专利全称" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>专利类型</Label>
                                    <Select value={formData.patentType} onValueChange={(v) => handleInputChange("patentType", v)}>
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
                                    <Input type="number" value={formData.claimCount} onChange={(e) => handleInputChange("claimCount", Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>所属技术领域</Label>
                                <Input value={formData.techField} onChange={(e) => handleInputChange("techField", e.target.value)} placeholder="如新能源电池、人工智能算法" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>技术方案/交底详情</Label>
                                <Textarea rows={3} value={formData.disclosureContent} onChange={(e) => handleInputChange("disclosureContent", e.target.value)} placeholder="简述专利解决的技术问题、创新结构、实现效果" />
                            </div>
                        </div>

                        {/* 市场维度 */}
                        <div className="space-y-3">
                            <h3 className="font-medium text-sm text-foreground">市场维度信息</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>目标市场规模</Label>
                                    <Input value={formData.marketScale} onChange={(e) => handleInputChange("marketScale", e.target.value)} placeholder="亿元/年" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>同类竞品专利数量</Label>
                                    <Input type="number" value={formData.competitorCount} onChange={(e) => handleInputChange("competitorCount", Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>商业化阶段</Label>
                                    <Select value={formData.commercialStage} onValueChange={(v) => handleInputChange("commercialStage", v)}>
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
                                    <Input type="number" value={formData.remainYear} onChange={(e) => handleInputChange("remainYear", Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>实际应用场景</Label>
                                <Textarea rows={2} value={formData.applyScene} onChange={(e) => handleInputChange("applyScene", e.target.value)} placeholder="该专利可落地的产品、行业场景" />
                            </div>
                        </div>

                        {/* 法律维度 */}
                        <div className="space-y-3">
                            <h3 className="font-medium text-sm text-foreground">法律维度信息</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>法律状态</Label>
                                    <Select value={formData.legalStatus} onValueChange={(v) => handleInputChange("legalStatus", v)}>
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
                                    <Input value={formData.licensePlan} onChange={(e) => handleInputChange("licensePlan", e.target.value)} placeholder="无/独家许可/普通许可/转让" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>诉讼/无效纠纷历史</Label>
                                <Textarea rows={2} value={formData.litigationHistory} onChange={(e) => handleInputChange("litigationHistory", e.target.value)} placeholder="无/有无侵权诉讼、无效宣告记录" />
                            </div>
                        </div>

                        <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2">
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

                {/* 右侧评估结果面板 */}
                <div className="space-y-6">
                    {!result && !loading && (
                        <div className="h-full flex items-center justify-center border rounded-lg text-muted-foreground p-12 text-center">
                            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-40" />
                            <p>填写左侧专利信息并提交<br/>AI四大维度打分报告将展示在此处</p>
                        </div>
                    )}

                    {loading && (
                        <Card>
                            <CardContent className="py-12 text-center space-y-4">
                                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-muted-foreground">AI正在分析专利技术、法律、市场、经济价值，生成打分报告...</p>
                            </CardContent>
                        </Card>
                    )}

                    {result && (
                        <>
                            {/* 总分卡片 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-blue-600" />
                                        综合价值总分
                                        <span className="ml-auto text-3xl font-bold text-blue-600">{result.totalScore}</span>
                                        <span className="text-sm font-normal text-muted-foreground">/100</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Progress value={result.totalScore} className="h-2.5" />
                                    <p className="mt-3 text-sm text-muted-foreground">{result.generalConclusion}</p>
                                </CardContent>
                            </Card>

                            {/* 四大维度分项打分 */}
                            <div className="grid grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-sky-600" />
                                            技术价值分
                                            <span className="ml-auto font-bold">{result.techScore}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="py-0">
                                        <Progress value={result.techScore} className="h-2" />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-emerald-600" />
                                            法律稳定分
                                            <span className="ml-auto font-bold">{result.lawScore}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="py-0">
                                        <Progress value={result.lawScore} className="h-2" />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-orange-600" />
                                            市场潜力分
                                            <span className="ml-auto font-bold">{result.marketScore}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="py-0">
                                        <Progress value={result.marketScore} className="h-2" />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-amber-600" />
                                            经济收益分
                                            <span className="ml-auto font-bold">{result.economyScore}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="py-0">
                                        <Progress value={result.economyScore} className="h-2" />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* AI详细评语 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">AI分项评估分析</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Tabs defaultValue="tech">
                                        <TabsList className="grid grid-cols-4 w-full">
                                            <TabsTrigger value="tech">技术</TabsTrigger>
                                            <TabsTrigger value="law">法律</TabsTrigger>
                                            <TabsTrigger value="market">市场</TabsTrigger>
                                            <TabsTrigger value="economy">经济</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="tech" className="mt-4 text-sm">{result.techComment}</TabsContent>
                                        <TabsContent value="law" className="mt-4 text-sm">{result.lawComment}</TabsContent>
                                        <TabsContent value="market" className="mt-4 text-sm">{result.marketComment}</TabsContent>
                                        <TabsContent value="economy" className="mt-4 text-sm">{result.economyComment}</TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>

                            {/* 风险清单 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                        专利风险清单与优化建议
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {result.riskList.map((risk, idx) => (
                                        <Alert key={idx} variant={risk.level === "高" ? "destructive" : "default"}>
                                            <div className="flex items-start gap-2">
                                                <AlertTriangle className="w-4 h-4 mt-0.5" />
                                                <AlertDescription className="space-y-1">
                                                    <p className="font-medium">{risk.riskType}（风险等级：{risk.level}）</p>
                                                    <p className="text-xs opacity-80">风险描述：{risk.desc}</p>
                                                    <p className="text-xs font-medium">优化建议：{risk.suggest}</p>
                                                </AlertDescription>
                                            </div>
                                        </Alert>
                                    ))}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}