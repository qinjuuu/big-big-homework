import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { FileText, Shield, TrendingUp, DollarSign } from "lucide-react"
import { PatentEvaluateResult } from "@/lib/api"

interface AIScoreCardProps {
    result: PatentEvaluateResult
}

export default function AIScoreCard({ result }: AIScoreCardProps) {
    return (
        <div className="space-y-4">
            {/* 总分 */}
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

            {/* 四大分项卡片 */}
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
        </div>
    )
}