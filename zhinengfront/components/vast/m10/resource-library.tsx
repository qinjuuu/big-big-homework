'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, AlertCircle, Clock, Download, Upload, Plus, Edit, Trash2, Eye, Copy, Lock } from 'lucide-react'

interface ResourceLibraryProps {
  libraryType: 'terminology' | 'template' | 'specification' | 'drawing' | 'formula' | 'ipc' | 'citation' | 'rules' | 'claims' | 'samples'
  onNavigate?: (page: string) => void
}

export function ResourceLibrary({ libraryType, onNavigate }: ResourceLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [moduleFilter, setModuleFilter] = useState('all')

  const libraryConfig: Record<string, { title: string; description: string; icon: string; items: any[] }> = {
    terminology: {
      title: '术语库',
      description: '维护原始术语、标准术语、撰写术语和同义词',
      icon: '📚',
      items: []
    },
    template: {
      title: '模板库',
      description: '管理交底书、说明书、权利要求等各类模板',
      icon: '📄',
      items: []
    },
    specification: {
      title: '规范库',
      description: '维护交底、撰写、审核等业务规范',
      icon: '📋',
      items: []
    },
    drawing: {
      title: '图纸库',
      description: '管理机械图、流程图、电路图等图纸资源',
      icon: '🎨',
      items: []
    },
    formula: {
      title: '公式库',
      description: '维护数学、物理、化学等领域公式',
      icon: '∑',
      items: []
    },
    ipc: {
      title: 'IPC分类库',
      description: '维护国际专利分类数据',
      icon: '🏷️',
      items: []
    },
    citation: {
      title: '引用规范库',
      description: '维护专利、非专利、标准等引用格式',
      icon: '📑',
      items: []
    },
    rules: {
      title: '质量规则库',
      description: '配置M06-M09使用的质量规则',
      icon: '⚙️',
      items: []
    },
    claims: {
      title: '权利要求句式库',
      description: '维护独权、从权、替代方案等句式',
      icon: '✍️',
      items: []
    },
    samples: {
      title: 'AI训练样本库',
      description: '管理授权、退回、废案等样本',
      icon: '📊',
      items: []
    }
  }

  const config = libraryConfig[libraryType]
  const [resources] = useState(config.items)

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      published: { label: '已发布', className: 'bg-green-100 text-green-800' },
      draft: { label: '草稿', className: 'bg-gray-100 text-gray-800' },
      pending: { label: '待审核', className: 'bg-orange-100 text-orange-800' },
      review: { label: '审核中', className: 'bg-blue-100 text-blue-800' }
    }
    const map = statusMap[status] || statusMap.draft
    return <Badge className={map.className}>{map.label}</Badge>
  }

  const getSeverityColor = (severity: string) => {
    return severity === 'blocking' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
  }

  return (
    <div className="flex-1 bg-background p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 标题区域 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{config.icon} {config.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              导出
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-1" />
              导入
            </Button>
            <Button size="sm" onClick={() => onNavigate?.(`m10-add-${libraryType}`)}>
              <Plus className="w-4 h-4 mr-1" />
              新增
            </Button>
          </div>
        </div>

        {/* 筛选区 */}
        <Card className="bg-muted/30 border-0">
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">搜索</label>
                <Input 
                  placeholder="搜索资源..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">状态</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="pending">待审核</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">适用模块</label>
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="m06">M06</SelectItem>
                    <SelectItem value="m07">M07</SelectItem>
                    <SelectItem value="m08">M08</SelectItem>
                    <SelectItem value="m09">M09</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" className="flex-1">重置</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 资源列表 */}
        <Card>
          <CardHeader>
            <CardTitle>资源列表 ({resources.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resources.map((resource) => (
                <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{resource.name || resource.code}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {resource.type || resource.module || resource.domain} 
                          {resource.calls > 0 && ` • ${resource.calls} 次调用`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {resource.severity && <Badge className={getSeverityColor(resource.severity)}>{resource.severity}</Badge>}
                    {getStatusBadge(resource.status)}
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onNavigate?.(`m10-detail-${resource.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
