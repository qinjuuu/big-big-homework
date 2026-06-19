'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  Plus, Upload, FileText, Database, BookOpen, Grid3x3,
  Link2, Zap, Brain, TrendingUp, AlertCircle, CheckCircle2,
  Package, Clock, ArchiveX, Eye, Edit, Trash2
} from 'lucide-react'
import { getActivities, type ActivityItem } from '@/lib/api'

interface ResourceDashboardProps {
  onNavigate?: (page: string) => void
}

export function ResourceDashboard({ onNavigate }: ResourceDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [activities, setActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    getActivities(4).then(setActivities).catch(console.error)
  }, [])

  const resourceStats = [
    { label: '术语总量', value: '0', color: '#1E5EFF', icon: FileText, badge: '' },
    { label: '模板总数', value: '0', color: '#2F80ED', icon: BookOpen, badge: '' },
    { label: '规范库', value: '0', color: '#27AE60', icon: Grid3x3, badge: '' },
    { label: 'IPC分类', value: '0', color: '#E74C3C', icon: Database, badge: '' },
    { label: '图纸资源', value: '0', color: '#F39C12', icon: Package, badge: '' },
    { label: '样本总数', value: '0', color: '#9B59B6', icon: Brain, badge: '' },
  ]

  const pendingTasks: Array<{ id: number; type: string; count: number; color: string; badge: string }> = []

  const frequentResources: Array<{ name: string; calls: number; status: string }> = []

  const resourceTrend: Array<{ month: string; 术语: number; 模板: number; 规则: number; 样本: number }> = []


  const quickActions = [
    { label: '新增术语', icon: Plus, action: () => onNavigate?.('m10-terminology') },
    { label: '新增模板', icon: Plus, action: () => onNavigate?.('m10-template') },
    { label: '新增规则', icon: Plus, action: () => onNavigate?.('m10-quality-rules') },
    { label: '导入样本', icon: Upload, action: () => onNavigate?.('m10-sample') },
  ]

  return (
    <div className="flex-1 bg-background p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 标题区域 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">M10 资源库工作台</h1>
            <p className="text-sm text-muted-foreground mt-1">统一管理术语、模板、规范、规则和AI训练样本</p>
          </div>
          <div className="flex gap-2">
            {quickActions.map((action, idx) => (
              <Button
                key={idx}
                variant={idx === 0 ? 'default' : 'outline'}
                size="sm"
                onClick={action.action}
              >
                <action.icon className="w-4 h-4 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white border border-border">
            <TabsTrigger value="overview">数据概览</TabsTrigger>
            <TabsTrigger value="pending">待处理事项</TabsTrigger>
            <TabsTrigger value="frequent">高频资源</TabsTrigger>
            <TabsTrigger value="activity">最近动态</TabsTrigger>
          </TabsList>

          {/* 数据概览 */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {resourceStats.map((stat, idx) => {
                const IconComponent = stat.icon
                return (
                  <Card key={idx} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate?.(`m10-${stat.label}`)}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                          <p className="text-xs text-green-600 mt-2">{stat.badge}</p>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: `${stat.color}20` }}>
                          <IconComponent className="w-6 h-6" style={{ color: stat.color }} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* 资源增长趋势 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  资源增长趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={resourceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="术语" stroke="#1E5EFF" strokeWidth={2} />
                    <Line type="monotone" dataKey="模板" stroke="#2F80ED" strokeWidth={2} />
                    <Line type="monotone" dataKey="规则" stroke="#27AE60" strokeWidth={2} />
                    <Line type="monotone" dataKey="样本" stroke="#9B59B6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 待处理事项 */}
          <TabsContent value="pending" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {pendingTasks.map((task) => (
                <Card key={task.id} className={`${task.color} border-0`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{task.type}</p>
                        <p className="text-2xl font-bold mt-2">{task.count}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onNavigate?.(`m10-${task.type}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 高频资源 */}
          <TabsContent value="frequent">
            <Card>
              <CardHeader>
                <CardTitle>高频调用资源排行</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {frequentResources.map((resource, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold text-primary">{idx + 1}</div>
                        <div>
                          <p className="font-medium">{resource.name}</p>
                          <p className="text-xs text-muted-foreground">{resource.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{resource.calls.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">次调用</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 最近动态 */}
          <TabsContent value="activity">
            <Card>
              <CardHeader><CardTitle>最近动态</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map(act => (
                    <div key={act.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium"><span className="text-primary">{act.opt_type}</span> - {act.case_name || act.case_id}</p>
                            <p className="text-sm text-muted-foreground mt-1">{act.opt_user} • {act.opt_time}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
