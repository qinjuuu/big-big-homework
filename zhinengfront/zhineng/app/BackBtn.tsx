'use client'
import { useRouter } from 'next/navigation'

export default function BackBtn() {
    const router = useRouter()
    return (
        <div style={{ padding: '12px' }}>
            <button
                onClick={() => router.back()}
                style={{ padding: '6px 14px', cursor: 'pointer' }}
            >
                ← 返回上一页
            </button>
        </div>
    )
}
