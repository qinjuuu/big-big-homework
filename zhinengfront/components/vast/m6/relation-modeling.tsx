"use client"

import { useState, useEffect } from "react"
import { getDisclosureById } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft,
  Save,
  ChevronRight,
  Plus,
  Trash2,
  ArrowRight,
  Link2,
  Tag,
  Image,
  Network,
  Sparkles
} from "lucide-react"

interface RelationModelingProps {
  onBack?: () => void
  onNext?: () => void
  disclosureId?: string | number
}

interface FeatureItem {
  id: string
  name: string
  type: string
  isCore: boolean
  drawingRef: string
}

interface RelationItem {
  id: string
  subject: string
  object: string
  action: string
  stateChange: string
  result: string
}

interface EffectBindingItem {
  id: string
  effectName: string
  effectDesc: string
  supportFeatures: string[]
  supportRelations: string[]
}

interface AlternativeItem {
  id: string
  originalFeature: string
  alternative: string
  equivalentEffect: string
  suggestClaim: boolean
}

interface TermMappingItem {
  id: string
  original: string
  standard: string
  writing: string
  confirmed: boolean
}

interface DrawingLabelItem {
  id: string
  figNo: string
  figName: string
  label: string
  partName: string
  featureRef: string
}

export function RelationModeling({ onBack, onNext, disclosureId }: RelationModelingProps) {
  const [activeTab, setActiveTab] = useState("features")
  const [saving, setSaving] = useState(false)

  // 节点/边数据均保持空数组，直到从接口加载真实数据
  const [features, setFeatures] = useState<FeatureItem[]>([])
  const [relations, setRelations] = useState<RelationItem[]>([])
  const [effectBindings, setEffectBindings] = useState<EffectBindingItem[]>([])
  const [alternatives, setAlternatives] = useState<AlternativeItem[]>([])
  const [termMappings, setTermMappings] = useState<TermMappingItem[]>([])
  const [drawingLabels, setDrawingLabels] = useState<DrawingLabelItem[]>([])

  useEffect(() => {
    if (!disclosureId) {
      setFeatures([])
      setRelations([])
      setEffectBindings([])
      setAlternatives([])
      setTermMappings([])
      setDrawingLabels([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        await getDisclosureById(disclosureId)
        if (cancelled) return
        // 后端暂未提供关系建模结构，先保持空数组
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [disclosureId])

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 1500)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">技术方案关系建模</h1>
            <p className="text-sm text-muted-foreground">建立技术特征、作用关系、效果、替代方案之间的关系</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "保存中..." : "保存"}
          </Button>
          <Button onClick={onNext}>
            下一步：完整性校验
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Step Nav */}
        <div className="w-48 border-r flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <h2 className="font-medium text-sm">关系建模步骤</h2>
          </div>
          <div className="p-2 space-y-1">
            {[
              { id: "features", label: "技术特征管理", icon: Network, count: features.length },
              { id: "relations", label: "作用关系管理", icon: ArrowRight, count: relations.length },
              { id: "effects", label: "技术效果绑定", icon: Link2, count: effectBindings.length },
              { id: "alternatives", label: "替代方案管理", icon: Sparkles, count: alternatives.length },
              { id: "terms", label: "术语映射", icon: Tag, count: termMappings.length },
              { id: "drawings", label: "附图标号", icon: Image, count: drawingLabels.length }
            ].map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveTab(step.id)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${
                  activeTab === step.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <step.icon className="h-4 w-4" />
                <span className="flex-1 truncate">{step.label}</span>
                <Badge variant={activeTab === step.id ? "secondary" : "outline"} className="text-xs">
                  {step.count}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Center - Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
              <TabsList className="bg-transparent p-0 h-auto">
                <TabsTrigger value="features" className="data-[state=active]:bg-background">技术特征</TabsTrigger>
                <TabsTrigger value="relations" className="data-[state=active]:bg-background">作用关系</TabsTrigger>
                <TabsTrigger value="effects" className="data-[state=active]:bg-background">效果绑定</TabsTrigger>
                <TabsTrigger value="alternatives" className="data-[state=active]:bg-background">替代方案</TabsTrigger>
                <TabsTrigger value="terms" className="data-[state=active]:bg-background">术语映射</TabsTrigger>
                <TabsTrigger value="drawings" className="data-[state=active]:bg-background">附图标号</TabsTrigger>
              </TabsList>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                新增
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4">
                {/* 技术特征管理 */}
                <TabsContent value="features" className="mt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>特征名称</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>是否核心</TableHead>
                        <TableHead>关联附图</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {features.map((feature) => (
                        <TableRow key={feature.id}>
                          <TableCell className="font-medium">{feature.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{feature.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Checkbox checked={feature.isCore} />
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{feature.drawingRef}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">编辑</Button>
                              <Button variant="ghost" size="sm" className="text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                {/* 作用关系管理 */}
                <TabsContent value="relations" className="mt-0 space-y-4">
                  {relations.map((relation) => (
                    <Card key={relation.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-blue-100 text-blue-700">{relation.subject}</Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge className="bg-purple-100 text-purple-700">{relation.object}</Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge className="bg-green-100 text-green-700">{relation.action}</Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge className="bg-orange-100 text-orange-700">{relation.stateChange}</Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge className="bg-cyan-100 text-cyan-700">{relation.result}</Badge>
                          <div className="ml-auto flex gap-1">
                            <Button variant="ghost" size="sm">编辑</Button>
                            <Button variant="ghost" size="sm" className="text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                {/* 技术效果绑定 */}
                <TabsContent value="effects" className="mt-0 space-y-4">
                  {effectBindings.map((effect) => (
                    <Card key={effect.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>{effect.effectName}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">编辑</Button>
                            <Button variant="ghost" size="sm" className="text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">{effect.effectDesc}</p>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-muted-foreground">支撑特征：</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {effect.supportFeatures.map((f, i) => (
                                <Badge key={i} variant="outline">{f}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">支撑关系：</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {effect.supportRelations.map((r, i) => (
                                <Badge key={i} variant="secondary">{r}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                {/* 替代方案管理 */}
                <TabsContent value="alternatives" className="mt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>原技术特征</TableHead>
                        <TableHead>替代方案</TableHead>
                        <TableHead>等同效果</TableHead>
                        <TableHead>建议进入从权</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alternatives.map((alt) => (
                        <TableRow key={alt.id}>
                          <TableCell className="font-medium">{alt.originalFeature}</TableCell>
                          <TableCell>{alt.alternative}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{alt.equivalentEffect}</TableCell>
                          <TableCell>
                            <Checkbox checked={alt.suggestClaim} />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">编辑</Button>
                              <Button variant="ghost" size="sm" className="text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                {/* 术语映射 */}
                <TabsContent value="terms" className="mt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>原始术语</TableHead>
                        <TableHead>标准术语</TableHead>
                        <TableHead>撰写术语</TableHead>
                        <TableHead>确认状态</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {termMappings.map((term) => (
                        <TableRow key={term.id}>
                          <TableCell>{term.original}</TableCell>
                          <TableCell>{term.standard}</TableCell>
                          <TableCell className="font-medium">{term.writing}</TableCell>
                          <TableCell>
                            <Badge className={term.confirmed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                              {term.confirmed ? "已确认" : "待确认"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                {term.confirmed ? "取消确认" : "确认"}
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                {/* 附图标号 */}
                <TabsContent value="drawings" className="mt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>图号</TableHead>
                        <TableHead>图名</TableHead>
                        <TableHead>标号</TableHead>
                        <TableHead>部件名称</TableHead>
                        <TableHead>关联特征</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drawingLabels.map((label) => (
                        <TableRow key={label.id}>
                          <TableCell>
                            <Badge variant="outline">{label.figNo}</Badge>
                          </TableCell>
                          <TableCell>{label.figName}</TableCell>
                          <TableCell className="font-mono font-medium">{label.label}</TableCell>
                          <TableCell>{label.partName}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{features.find(f => f.id === label.featureRef)?.name || "-"}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">编辑</Button>
                              <Button variant="ghost" size="sm" className="text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Right - Relation Graph & Tips */}
        <div className="w-72 border-l flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <h2 className="font-medium text-sm">关系图 / 校验提示</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Relation Graph Preview */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">关系图预览</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-40 bg-muted/50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Network className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">关系图可视化</p>
                      <Button variant="link" size="sm" className="mt-2">
                        查看完整关系图
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Validation Tips */}
              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">校验提示</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs text-muted-foreground py-2 text-center">暂无校验提示</div>
                </CardContent>
              </Card>

              {/* M10 Resource */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    M10资源建议
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground py-2 text-center">暂无资源建议</div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
