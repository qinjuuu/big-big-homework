import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Sparkles } from "lucide-react"
import AIScoreCard from "./AIScoreCard"
import { PatentEvaluateResult } from "@/lib/api"

interface EvaluateResultPanelProps {
    result: PatentEvaluateResult | null
    loading: boolean
}

export default function EvaluateResultPanel({ result, loading }: EvaluateResultPanelProps) {
    if (loading) {
        return (
            <Card>
                <CardContent className="py-12 text-center space-y-4">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-muted-foreground">AI正在分析专利技术、法律、市场、经济价值，生成打分报告...</p>
                </CardContent>
            </Card>
        )
    }

    if (!result) {
        return (
            <div className="h-full flex items-center justify-center border rounded-lg text-muted-foreground p-12 text-center">
                <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-400" />
                <p>填写左侧专利信息并提交<br/>AI四大维度打分报告将展示在此处</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <AIScoreCard result={result} />

            {/* AI分项评语 */}
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
        </div>
    )
}