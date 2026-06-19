import { Skeleton } from "@/components/ui/skeleton"

export default function PatentEvaluateLoading() {
    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-2">
                    <Skeleton className="w-48 h-6" />
                    <Skeleton className="w-72 h-4" />
                </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Skeleton className="h-[820px] rounded-xl" />
                <div className="space-y-6">
                    <Skeleton className="h-28 rounded-xl" />
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-20 rounded-lg" />
                        <Skeleton className="h-20 rounded-lg" />
                        <Skeleton className="h-20 rounded-lg" />
                        <Skeleton className="h-20 rounded-lg" />
                    </div>
                    <Skeleton className="h-56 rounded-xl" />
                    <Skeleton className="h-44 rounded-xl" />
                </div>
            </div>
        </div>
    )
}