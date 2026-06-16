import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import BackBtn from './BackBtn'
import './globals.css'

export const metadata: Metadata = {
    title: 'VAST 8.0 | M05 交底书来源模块',
    description: 'VAST 8.0 专利智能生产系统 - 交底书来源管理模块',
    generator: 'v0.app',
    icons: {
        icon: [
            {
                url: '/icon-light-32x32.png',
                media: '(prefers-color-scheme: light)',
            },
            {
                url: '/icon-dark-32x32.png',
                media: '(prefers-color-scheme: dark)',
            },
            {
                url: '/icon.svg',
                type: 'image/svg+xml',
            },
        ],
        apple: '/apple-icon.png',
    },
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="zh-CN" className="bg-background">
        <body className="font-sans antialiased">
        <BackBtn />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        </body>
        </html>
    )
}