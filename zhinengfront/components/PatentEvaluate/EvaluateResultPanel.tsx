import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

interface EvaluateSubmitBtnProps {
    loading: boolean
    onSubmit: () => void
}

export default function EvaluateSubmitBtn({ loading, onSubmit }: EvaluateSubmitBtnProps) {
    return (
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
    )
}