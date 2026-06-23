"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Users, Wifi, WifiOff, Save, RefreshCw } from "lucide-react"

interface CollaborativeEditorProps {
  caseId: string
  docType: 'spec' | 'claims' | 'five_books'
  initialContent?: string
  onContentChange?: (content: string) => void
}

interface OnlineUser {
  userId: string
  userName: string
}

interface CursorInfo {
  userId: string
  userName: string
  position: number
  color: string
}

const USER_COLORS = [
  '#2563EB', '#DC2626', '#16A34A', '#D97706', '#7C3AED',
  '#DB2777', '#0891B2', '#65A30D', '#EA580C', '#4F46E5'
]

export function CollaborativeEditor({
  caseId,
  docType,
  initialContent = '',
  onContentChange
}: CollaborativeEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [connected, setConnected] = useState(false)
  const [userCount, setUserCount] = useState(1)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [cursors, setCursors] = useState<CursorInfo[]>([])
  const [syncing, setSyncing] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const userIdRef = useRef(`user-${Math.random().toString(36).substring(2, 9)}`)
  const userNameRef = useRef(`用户${Math.floor(Math.random() * 1000)}`)
  const versionRef = useRef(1)
  const ignoreNextChange = useRef(false)

  // 建立 WebSocket 连接
  useEffect(() => {
    const wsUrl = `ws://localhost:3001/ws/collaborate`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      // 发送加入文档消息
      ws.send(JSON.stringify({
        type: 'join',
        caseId,
        docType,
        userId: userIdRef.current,
        userName: userNameRef.current
      }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        handleWebSocketMessage(msg)
      } catch (err) {
        console.error('[WebSocket] Parse error:', err)
      }
    }

    ws.onclose = () => {
      setConnected(false)
    }

    ws.onerror = (err) => {
      console.error('[WebSocket] Error:', err)
      setConnected(false)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'leave' }))
      }
      ws.close()
    }
  }, [caseId, docType])

  const handleWebSocketMessage = (msg: any) => {
    switch (msg.type) {
      case 'init':
        if (msg.content !== undefined) {
          ignoreNextChange.current = true
          setContent(msg.content)
          versionRef.current = msg.version || 1
        }
        if (msg.userCount !== undefined) {
          setUserCount(msg.userCount)
        }
        break
      case 'operation':
        if (msg.userId !== userIdRef.current && msg.operation) {
          applyRemoteOperation(msg.operation)
        }
        if (msg.version) {
          versionRef.current = msg.version
        }
        break
      case 'presence':
        if (msg.userCount !== undefined) {
          setUserCount(msg.userCount)
        }
        break
      case 'users':
        if (msg.users) {
          setOnlineUsers(msg.users.filter((u: OnlineUser) => u.userId !== userIdRef.current))
        }
        break
      case 'cursor':
        if (msg.userId !== userIdRef.current && msg.cursor) {
          updateCursor(msg.userId, msg.userName, msg.cursor)
        }
        break
      case 'sync':
        if (msg.content !== undefined) {
          ignoreNextChange.current = true
          setContent(msg.content)
          versionRef.current = msg.version || 1
        }
        setSyncing(false)
        break
      case 'error':
        console.error('[WebSocket] Server error:', msg.message)
        break
    }
  }

  const applyRemoteOperation = (op: any) => {
    const textarea = textareaRef.current
    if (!textarea) return

    ignoreNextChange.current = true
    
    if (op.type === 'insert' && op.content) {
      const pos = Math.min(op.position, content.length)
      const newContent = content.slice(0, pos) + op.content + content.slice(pos)
      setContent(newContent)
      onContentChange?.(newContent)
    } else if (op.type === 'delete' && op.length) {
      const pos = Math.min(op.position, content.length)
      const newContent = content.slice(0, pos) + content.slice(pos + op.length)
      setContent(newContent)
      onContentChange?.(newContent)
    }
  }

  const updateCursor = (userId: string, userName: string, cursor: any) => {
    setCursors(prev => {
      const filtered = prev.filter(c => c.userId !== userId)
      if (cursor && cursor.position !== undefined) {
        const colorIndex = Math.abs(userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % USER_COLORS.length
        filtered.push({
          userId,
          userName,
          position: cursor.position,
          color: USER_COLORS[colorIndex]
        })
      }
      return filtered
    })
  }

  // 发送本地操作
  const sendOperation = useCallback((type: 'insert' | 'delete', position: number, contentOrLength?: string | number) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    const operation: any = { type, position }
    if (type === 'insert') {
      operation.content = contentOrLength
    } else if (type === 'delete') {
      operation.length = contentOrLength
    }

    ws.send(JSON.stringify({
      type: 'operation',
      operation,
      timestamp: Date.now()
    }))
  }, [])

  // 处理文本变化（简化版：发送完整内容diff）
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    
    if (ignoreNextChange.current) {
      ignoreNextChange.current = false
      setContent(newContent)
      onContentChange?.(newContent)
      return
    }

    // 计算差异并发送操作
    const oldContent = content
    const diffStart = findDiffStart(oldContent, newContent)
    
    if (newContent.length > oldContent.length) {
      // 插入
      const inserted = newContent.slice(diffStart, newContent.length - (oldContent.length - diffStart))
      sendOperation('insert', diffStart, inserted)
    } else if (newContent.length < oldContent.length) {
      // 删除
      const deletedLength = oldContent.length - newContent.length
      sendOperation('delete', diffStart, deletedLength)
    }

    setContent(newContent)
    onContentChange?.(newContent)
  }

  // 发送光标位置
  const handleCursorMove = (e: React.MouseEvent<HTMLTextAreaElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    ws.send(JSON.stringify({
      type: 'cursor',
      cursor: {
        position: textarea.selectionStart
      },
      timestamp: Date.now()
    }))
  }

  // 手动同步
  const handleSync = () => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    
    setSyncing(true)
    ws.send(JSON.stringify({
      type: 'sync',
      timestamp: Date.now()
    }))
  }

  // 重连
  const handleReconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    // 重新加载页面或触发useEffect重新连接
    window.location.reload()
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-[#E2E8F0]">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {connected ? (
              <Wifi className="h-4 w-4 text-[#16A34A]" />
            ) : (
              <WifiOff className="h-4 w-4 text-[#EF4444]" />
            )}
            <span className={`text-xs font-medium ${connected ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
              {connected ? '已连接' : '未连接'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-[#64748B]" />
            <span className="text-xs text-[#64748B]">{userCount} 人在线</span>
          </div>
          {onlineUsers.length > 0 && (
            <div className="flex items-center gap-1">
              {onlineUsers.slice(0, 5).map((user, i) => (
                <Badge
                  key={user.userId}
                  className="text-xs px-1.5 py-0"
                  style={{
                    backgroundColor: `${USER_COLORS[i % USER_COLORS.length]}20`,
                    color: USER_COLORS[i % USER_COLORS.length],
                    borderColor: USER_COLORS[i % USER_COLORS.length]
                  }}
                >
                  {user.userName}
                </Badge>
              ))}
              {onlineUsers.length > 5 && (
                <span className="text-xs text-[#64748B]">+{onlineUsers.length - 5}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={handleSync}
            disabled={syncing || !connected}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${syncing ? 'animate-spin' : ''}`} />
            同步
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={handleReconnect}
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            重连
          </Button>
        </div>
      </div>

      {/* 编辑器区域 */}
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onClick={handleCursorMove}
          onKeyUp={handleCursorMove}
          className="w-full h-full resize-none border-0 rounded-none p-4 font-mono text-sm leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder="在此协作编辑文档..."
          spellCheck={false}
        />
        
        {/* 显示其他用户光标位置（简化版：在光标位置显示用户名） */}
        {cursors.map(cursor => (
          <div
            key={cursor.userId}
            className="absolute pointer-events-none z-10"
            style={{
              top: `${Math.floor(cursor.position / 80) * 24 + 16}px`,
              left: `${(cursor.position % 80) * 9 + 16}px`,
              color: cursor.color
            }}
          >
            <div className="text-xs font-medium bg-white/90 px-1 rounded shadow-sm">
              {cursor.userName}
            </div>
          </div>
        ))}
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="text-xs text-[#64748B]">
          版本: {versionRef.current} | 字数: {content.length}
        </div>
        <div className="text-xs text-[#64748B]">
          {docType === 'spec' ? '说明书' : docType === 'claims' ? '权利要求书' : '五书'}协作编辑
        </div>
      </div>
    </div>
  )
}

function findDiffStart(oldStr: string, newStr: string): number {
  let i = 0
  while (i < oldStr.length && i < newStr.length && oldStr[i] === newStr[i]) {
    i++
  }
  return i
}
