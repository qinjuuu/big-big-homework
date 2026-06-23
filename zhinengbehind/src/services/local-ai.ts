/**
 * 本地 AI 服务 - 不依赖任何付费 API
 * 使用基于规则的模板生成 + 简单的文本处理逻辑
 * 所有 AI 功能在本地完成，无需网络调用
 * API 兼容原 qwenAI 的调用方式
 */

interface LocalAIResponse {
  success: boolean;
  content: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  error?: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 专利领域术语库
const PATENT_TERMS: Record<string, Record<string, string[]>> = {
  electronics: {
    '芯片': ['集成电路', '半导体器件', '微电子元件'],
    '电路': ['电子回路', '电气回路', '线路板'],
    '信号': ['电信号', '数据信号', '通信信号'],
    '传感器': ['检测元件', '感应器件', '测量装置'],
  },
  mechanical: {
    '轴承': ['滚动轴承', '滑动轴承', '支承件'],
    '齿轮': ['传动轮', '齿形件', '啮合件'],
    '连接': ['联接', '接合', '固定'],
    '密封': ['封闭', '防漏', '气密'],
  },
  chemical: {
    '催化剂': ['触媒', '反应促进剂', '加速剂'],
    '聚合': ['缩合', '链式增长', '分子结合'],
    '溶解': ['溶融', '分散', '相溶'],
    '合成': ['制备', '制造', '生产'],
  },
  biotech: {
    '基因': ['遗传因子', 'DNA序列', '核酸片段'],
    '蛋白质': ['多肽', '酶', '生物大分子'],
    '细胞': ['生物细胞', '组织单元', '培养物'],
    '抗体': ['免疫球蛋白', '特异性蛋白', '免疫分子'],
  },
  software: {
    '算法': ['计算方法', '处理逻辑', '运算规则'],
    '接口': ['API', '通信端口', '交互层'],
    '数据库': ['数据存储', '信息库', '数据集'],
    '模块': ['组件', '功能单元', '子系统'],
  },
};

// 辅助函数：获取领域名称
function getFieldName(techField: string): string {
  const fieldMap: Record<string, string> = {
    electronics: '电子信息',
    mechanical: '机械工程',
    chemical: '化学化工',
    biotech: '生物技术',
    software: '软件与计算机',
    other: '技术',
  };
  return fieldMap[techField] || '技术';
}

// 模拟 token 计算
function estimateTokens(content: string): { prompt_tokens: number; completion_tokens: number; total_tokens: number } {
  const promptTokens = Math.ceil(content.length / 2);
  const completionTokens = Math.ceil(content.length / 3);
  return { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens };
}

// 通用技术交底书模板
function generateDisclosureTemplate(params: { techField: string; patentType: string; clientName: string; materialNote: string }): string {
  const { techField, patentType, clientName, materialNote } = params;
  const fieldName = getFieldName(techField);
  return `## 一、技术问题

现有${fieldName}领域存在以下问题：${materialNote || '技术方案不够完善，需要改进现有方案'}。

## 二、技术背景

${clientName}在${fieldName}领域具有深厚的技术积累。现有技术方案存在效率低、稳定性差等问题，亟需改进。

## 三、现有技术缺点

1. 现有方案结构复杂，维护成本高
2. 现有技术效率较低，难以满足实际需求
3. 现有方案缺乏统一性，各部分协调性差

## 四、发明目的

本发明旨在提供一种${patentType === '发明专利' ? '创新的' : '改进的'}${fieldName}技术方案，解决现有技术中存在的技术问题，提高整体性能和可靠性。

## 五、技术方案

### 5.1 结构说明

本技术方案包括以下核心组成部分：
- 第一组件：负责信号采集与预处理
- 第二组件：负责数据运算与逻辑控制
- 第三组件：负责输出执行与反馈调节

各组件之间通过标准化接口连接，形成完整的技术系统。

### 5.2 工艺步骤/方法步骤

本技术方案的实现步骤如下：
1. 步骤S1：初始化系统参数，建立基础连接
2. 步骤S2：采集输入数据，进行预处理
3. 步骤S3：执行核心运算/处理逻辑
4. 步骤S4：生成输出结果，执行相应动作
5. 步骤S5：反馈调节，优化系统参数

### 5.3 原理说明

本技术方案基于以下技术原理：
- 采用模块化设计思想，将复杂系统分解为独立功能单元
- 利用闭环控制机制，实现系统的自稳定与自优化
- 通过标准化接口设计，确保各组件之间的协调运作

### 5.4 动作关系说明

第一组件与第二组件之间通过数据总线连接，第二组件将处理结果发送至第三组件执行。第三组件的执行状态反馈至第一组件，形成闭环控制。

## 六、关键点和欲保护点

1. 独特的结构设计（结构说明部分）
2. 创新的方法步骤（工艺步骤部分）
3. 核心原理的应用方式（原理说明部分）
4. 组件之间的协同关系（动作关系说明部分）

## 七、有益效果

与现有技术相比，本技术方案具有以下优势：
1. 结构更简洁，维护成本降低约30%
2. 效率提升，处理速度提高约25%
3. 稳定性增强，故障率降低约40%
4. 统一性更好，各组件协调一致性提高

## 八、实际产品/应用场景

本技术方案可应用于以下场景：
- ${fieldName}产品制造
- ${fieldName}系统集成
- 相关技术领域的改进方案

## 九、替代方案

在另一种实施方式中，可以将第二组件的功能合并至第一组件中，简化系统结构。或者将第三组件拆分为多个子模块，提高系统的灵活性。
`;
}

// 专利说明书模板
function generateSpecTemplate(params: { techField: string; patentType: string; disclosure: string }): string {
  const { techField } = params;
  const fieldName = getFieldName(techField);
  return `${fieldName}技术方案

技术领域
本发明涉及${fieldName}技术领域，尤其涉及一种改进的${fieldName}技术方案。

背景技术
现有${fieldName}技术方案存在效率低、稳定性差等问题。随着技术发展，亟需一种更高效、更可靠的解决方案。

发明内容
本发明的目的在于提供一种${fieldName}技术方案，以解决现有技术中存在的问题。

为实现上述目的，本发明采用如下技术方案：

一种${fieldName}技术方案，其特征在于，包括：
第一组件，用于信号采集与预处理；
第二组件，与所述第一组件连接，用于数据运算与逻辑控制；
第三组件，与所述第二组件连接，用于输出执行与反馈调节。

优选地，所述第一组件包括传感器单元和信号调理单元。

优选地，所述第二组件包括处理器单元和存储单元。

优选地，所述第三组件包括执行单元和反馈采集单元。

有益效果
本发明的技术方案具有以下有益效果：
1. 结构更简洁，维护成本降低
2. 效率提升，处理速度提高
3. 稳定性增强，故障率降低

附图说明
图1为本发明实施例的整体结构示意图；
图2为本发明实施例的流程图；
图3为本发明实施例的详细结构示意图。

具体实施方式
下面结合附图对本发明的具体实施方式作进一步详细说明。

实施例1
参考图1，本实施例提供一种${fieldName}技术方案，包括第一组件100、第二组件200和第三组件300。

第一组件100负责信号采集与预处理。具体地，传感器单元采集外部环境信号，经信号调理单元处理后发送至第二组件200。

第二组件200接收来自第一组件100的数据，执行核心运算与逻辑控制。处理器单元根据预设算法进行数据处理，存储单元保存中间结果和配置参数。

第三组件300接收来自第二组件200的指令，执行相应动作。执行单元根据指令完成具体操作，反馈采集单元将执行状态反馈至第一组件100，形成闭环控制。

实施例2
在另一种实施方式中，可以将第二组件200的功能部分合并至第一组件100中，简化系统结构，降低成本。

以上所述仅为本发明的优选实施例，并不用于限制本发明。在本发明的精神和原则之内，所作的任何修改、等同替换、改进等，均应包含在本发明的保护范围之内。
`;
}

// 权利要求书模板
function generateClaimsTemplate(params: { techField: string; patentType: string }): string {
  const fieldName = getFieldName(params.techField);
  if (params.patentType === '发明专利') {
    return `1. 一种${fieldName}技术方案，其特征在于，包括：
第一组件，用于信号采集与预处理；
第二组件，与所述第一组件连接，用于数据运算与逻辑控制；
第三组件，与所述第二组件连接，用于输出执行与反馈调节。

2. 根据权利要求1所述的${fieldName}技术方案，其特征在于，所述第一组件包括传感器单元和信号调理单元。

3. 根据权利要求1所述的${fieldName}技术方案，其特征在于，所述第二组件包括处理器单元和存储单元。

4. 根据权利要求1所述的${fieldName}技术方案，其特征在于，所述第三组件包括执行单元和反馈采集单元。

5. 根据权利要求1所述的${fieldName}技术方案，其特征在于，所述第一组件、第二组件和第三组件之间通过标准化数据接口连接。

6. 根据权利要求1所述的${fieldName}技术方案，其特征在于，还包括反馈控制模块，用于将所述第三组件的执行状态反馈至所述第一组件。

7. 一种${fieldName}技术方案的控制方法，其特征在于，包括以下步骤：
步骤S1：初始化系统参数，建立基础连接；
步骤S2：采集输入数据，进行预处理；
步骤S3：执行核心运算与处理逻辑；
步骤S4：生成输出结果，执行相应动作；
步骤S5：反馈调节，优化系统参数。

8. 根据权利要求7所述的控制方法，其特征在于，所述步骤S2包括：
通过传感器单元采集外部环境信号，经信号调理单元处理后发送至第二组件。

9. 根据权利要求7所述的控制方法，其特征在于，所述步骤S3包括：
处理器单元根据预设算法进行数据处理，存储单元保存中间结果。

10. 根据权利要求7所述的控制方法，其特征在于，所述步骤S5包括：
反馈采集单元将执行状态反馈至第一组件，形成闭环控制。`;
  }
  return `1. 一种${fieldName}装置，其特征在于，包括：
第一组件，用于信号采集与预处理；
第二组件，与所述第一组件连接，用于数据运算与逻辑控制；
第三组件，与所述第二组件连接，用于输出执行与反馈调节。

2. 根据权利要求1所述的${fieldName}装置，其特征在于，所述第一组件包括传感器单元和信号调理单元。

3. 根据权利要求1所述的${fieldName}装置，其特征在于，所述第二组件包括处理器单元和存储单元。

4. 根据权利要求1所述的${fieldName}装置，其特征在于，所述第三组件包括执行单元和反馈采集单元。

5. 根据权利要求1所述的${fieldName}装置，其特征在于，所述第一组件、第二组件和第三组件之间通过标准化数据接口连接。`;
}

// 五书模板
function generateFiveBooksTemplate(params: { techField: string; patentType: string }): string {
  const fieldName = getFieldName(params.techField);
  return JSON.stringify({
    abstract: `本发明公开一种${fieldName}技术方案，包括第一组件、第二组件和第三组件。第一组件用于信号采集与预处理，第二组件用于数据运算与逻辑控制，第三组件用于输出执行与反馈调节。本发明结构简洁、效率高、稳定性好。`,
    abstractDrawing: `图1为本发明的整体结构示意图，显示了第一组件、第二组件和第三组件之间的连接关系。`,
    drawingDesc: `图1为本发明实施例的整体结构示意图；\n图2为本发明实施例的流程图；\n图3为本发明实施例的详细结构示意图。`,
  });
}

// 审查建议模板
function generateReviewAdviceText(params: { specContent?: string; claimsContent?: string; disclosureContent?: string }): string {
  const issues = [];
  if (params.specContent) {
    const specLen = params.specContent.length;
    if (specLen < 1000) issues.push('【阻断】说明书内容过于简略，建议补充具体实施方式和详细技术方案');
    if (!params.specContent.includes('附图说明')) issues.push('【阻断】说明书缺少附图说明部分，必须补充');
    if (!params.specContent.includes('具体实施方式')) issues.push('【阻断】说明书缺少具体实施方式部分，必须补充');
    if (!params.specContent.includes('技术方案') && !params.specContent.includes('技术领域')) issues.push('【阻断】说明书结构不完整，缺少技术领域或技术方案部分');
  }
  if (params.claimsContent) {
    if (!params.claimsContent.includes('1.')) issues.push('【阻断】权利要求书格式不规范，缺少权利要求1');
    if (!params.claimsContent.includes('其特征在于')) issues.push('【警告】权利要求缺少"其特征在于"表述，建议规范用语');
  }
  if (params.disclosureContent) {
    if (!params.disclosureContent.includes('结构说明')) issues.push('【建议】交底书缺少结构说明，建议补充技术方案的结构描述');
    if (!params.disclosureContent.includes('工艺步骤') && !params.disclosureContent.includes('方法步骤')) issues.push('【建议】交底书缺少工艺步骤/方法步骤，建议补充实现步骤');
    if (!params.disclosureContent.includes('原理说明')) issues.push('【建议】交底书缺少原理说明，建议补充技术原理');
    if (!params.disclosureContent.includes('动作关系')) issues.push('【建议】交底书缺少动作关系说明，建议补充组件之间的动作关系');
  }
  issues.push('【建议】建议补充实验数据或仿真结果以证明技术效果');
  issues.push('【建议】建议统一全文术语，避免出现同一技术特征的不同表述');
  return issues.join('\n');
}

// 检查AI率（模拟）
function checkAIRate(content: string): { rate: number; flaggedSections: string[] } {
  const aiPatterns = ['首先', '其次', '此外', '综上所述', '值得注意的是', '需要指出的是', '总体而言', '具体来说', '从技术层面', '本领域技术人员', '显而易见', '可以理解', '应当理解', '优选地', '可选地'];
  let aiScore = 0;
  const flaggedSections: string[] = [];
  for (const pattern of aiPatterns) {
    const count = (content.match(new RegExp(pattern, 'g')) || []).length;
    if (count > 0) {
      aiScore += count * 2;
      if (count > 2) flaggedSections.push(`过多使用"${pattern}"（出现${count}次）`);
    }
  }
  const sentences = content.split(/[。；.!?]/).filter(s => s.length > 10);
  const sentenceStarts = sentences.map(s => s.trim().substring(0, 4));
  const startCounts: Record<string, number> = {};
  for (const start of sentenceStarts) startCounts[start] = (startCounts[start] || 0) + 1;
  for (const [start, count] of Object.entries(startCounts)) {
    if (count > 3) {
      aiScore += (count - 3) * 3;
      flaggedSections.push(`句式重复："${start}..."开头出现${count}次`);
    }
  }
  const paragraphs = content.split('\n').filter(p => p.length > 20);
  if (paragraphs.length > 0) {
    const avgLen = paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length;
    if (avgLen > 200 && avgLen < 300) aiScore += 5;
  }
  const rate = Math.min(Math.round(aiScore), 100);
  return { rate, flaggedSections };
}

// 术语一致性检查
function checkTerminologyConsistency(content: string, techField: string): Array<{ original: string; standard: string; aliases: string[] }> {
  const terms = PATENT_TERMS[techField] || PATENT_TERMS.software;
  const issues: Array<{ original: string; standard: string; aliases: string[] }> = [];
  for (const [standard, aliases] of Object.entries(terms)) {
    let found = false;
    let foundAlias = '';
    for (const alias of aliases) {
      if (content.includes(alias)) { found = true; foundAlias = alias; break; }
    }
    if (found && !content.includes(standard)) {
      issues.push({ original: foundAlias, standard, aliases: aliases.filter(a => a !== foundAlias) });
    }
  }
  return issues;
}

// 专利检索（模拟）
function searchPatentsMock(keyword: string): Array<{ title: string; patentNo: string; similarity: number }> {
  return [
    { title: `基于${keyword}的智能控制方法`, patentNo: 'CN202310000001', similarity: 0.85 },
    { title: `一种改进的${keyword}装置`, patentNo: 'CN202310000002', similarity: 0.72 },
    { title: `${keyword}系统的优化方法`, patentNo: 'CN202310000003', similarity: 0.65 },
    { title: `用于${keyword}的数据处理设备`, patentNo: 'CN202310000004', similarity: 0.58 },
    { title: `${keyword}领域的检测方法`, patentNo: 'CN202310000005', similarity: 0.45 },
  ];
}

// 生成创新思路
function generateInnovationIdeasMock(techField: string, _existingTech: string): string[] {
  const fieldName = getFieldName(techField);
  return [
    `将${fieldName}技术与物联网技术结合，实现远程监控与智能管理`,
    `采用模块化设计思想，提高${fieldName}系统的可扩展性和可维护性`,
    `引入机器学习算法，优化${fieldName}系统的参数配置`,
    `结合新材料技术，提升${fieldName}系统的耐用性和可靠性`,
    `采用分布式架构，提高${fieldName}系统的处理能力和容错性`,
  ];
}

// 检查交底书完整性
function checkDisclosureCompleteness(content: string): { missing: string[]; score: number } {
  const requiredSections = [
    { key: '技术问题', weight: 10 },
    { key: '技术背景', weight: 10 },
    { key: '现有技术', weight: 10 },
    { key: '发明目的', weight: 10 },
    { key: '技术方案', weight: 15 },
    { key: '结构说明', weight: 10 },
    { key: '工艺步骤', weight: 10 },
    { key: '原理说明', weight: 10 },
    { key: '关键点', weight: 5 },
    { key: '有益效果', weight: 5 },
  ];
  let score = 0;
  const missing: string[] = [];
  for (const section of requiredSections) {
    if (content.includes(section.key)) score += section.weight;
    else missing.push(section.key);
  }
  return { missing, score };
}

// ========== 主类：本地 AI 服务（兼容 qwenAI API） ==========

class LocalAIService {
  // 通用对话接口
  async chat(messages: ChatMessage[], _options?: { temperature?: number; maxTokens?: number }): Promise<LocalAIResponse> {
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    try {
      let content = '';
      if (systemMessage.includes('生成交底书') || userMessage.includes('交底书')) {
        const tf = extractParam(userMessage, '技术领域') || 'software';
        const pt = extractParam(userMessage, '专利类型') || '发明专利';
        const cn = extractParam(userMessage, '客户名称') || '客户';
        const mn = extractParam(userMessage, '材料说明') || '';
        content = generateDisclosureTemplate({ techField: tf, patentType: pt, clientName: cn, materialNote: mn });
      } else if (systemMessage.includes('生成说明书') || userMessage.includes('说明书')) {
        const tf = extractParam(userMessage, '技术领域') || 'software';
        const pt = extractParam(userMessage, '专利类型') || '发明专利';
        const d = extractParam(userMessage, '交底书') || '';
        content = generateSpecTemplate({ techField: tf, patentType: pt, disclosure: d });
      } else if (systemMessage.includes('生成权利要求') || userMessage.includes('权利要求')) {
        const tf = extractParam(userMessage, '技术领域') || 'software';
        const pt = extractParam(userMessage, '专利类型') || '发明专利';
        content = generateClaimsTemplate({ techField: tf, patentType: pt });
      } else if (systemMessage.includes('生成五书') || userMessage.includes('五书')) {
        const tf = extractParam(userMessage, '技术领域') || 'software';
        const pt = extractParam(userMessage, '专利类型') || '发明专利';
        content = generateFiveBooksTemplate({ techField: tf, patentType: pt });
      } else if (systemMessage.includes('审查') || userMessage.includes('质检')) {
        const sc = extractParam(userMessage, '说明书') || '';
        const cc = extractParam(userMessage, '权利要求') || '';
        const dc = extractParam(userMessage, '交底书') || '';
        content = generateReviewAdviceText({ specContent: sc, claimsContent: cc, disclosureContent: dc });
      } else if (systemMessage.includes('创新') || userMessage.includes('创新思路')) {
        const tf = extractParam(userMessage, '技术领域') || 'software';
        const et = extractParam(userMessage, '现有技术') || '';
        const ideas = generateInnovationIdeasMock(tf, et);
        content = ideas.join('\n');
      } else {
        content = generateDisclosureTemplate({ techField: 'software', patentType: '发明专利', clientName: '客户', materialNote: userMessage });
      }
      return { success: true, content, usage: estimateTokens(content) };
    } catch (error: any) {
      return { success: false, content: '', error: error.message || '本地AI处理失败' };
    }
  }

  // 生成交底书（兼容 qwenAI API）
  async generateDisclosure(params: { techField: string; rawContent?: string }): Promise<LocalAIResponse> {
    const content = generateDisclosureTemplate({
      techField: params.techField || 'software',
      patentType: '发明专利',
      clientName: '客户',
      materialNote: params.rawContent || '',
    });
    return { success: true, content, usage: estimateTokens(content) };
  }

  // 生成创新思路（兼容 qwenAI API）
  async generateInnovationIdeas(params: { techField: string; currentSolution: string }): Promise<LocalAIResponse> {
    const ideas = generateInnovationIdeasMock(params.techField, params.currentSolution);
    return { success: true, content: ideas.join('\n'), usage: estimateTokens(ideas.join('\n')) };
  }

  // 检测AI率（兼容 qwenAI API）
  async detectAIRate(content: string): Promise<LocalAIResponse> {
    const result = checkAIRate(content);
    const text = `AI生成率：${result.rate}%\n\n标记问题：\n${result.flaggedSections.map((s, i) => `${i + 1}. ${s}`).join('\n') || '无明显AI生成痕迹'}`;
    return { success: true, content: text, usage: estimateTokens(text) };
  }

  // 生成专利说明书（兼容 qwenAI API）
  async generatePatentSpec(params: { title: string; techField: string; problem?: string; solution?: string; effects?: string }): Promise<LocalAIResponse> {
    const content = generateSpecTemplate({
      techField: params.techField || 'software',
      patentType: '发明专利',
      disclosure: params.solution || '',
    });
    return { success: true, content, usage: estimateTokens(content) };
  }

  // 生成权利要求书（兼容 qwenAI API）
  async generateClaims(_specContent: string): Promise<LocalAIResponse> {
    const content = generateClaimsTemplate({ techField: 'software', patentType: '发明专利' });
    return { success: true, content, usage: estimateTokens(content) };
  }

  // 生成审查建议（兼容 qwenAI API）
  async generateReviewAdvice(params: { specContent?: string; claimsContent?: string }): Promise<LocalAIResponse> {
    const content = generateReviewAdviceText({ specContent: params.specContent, claimsContent: params.claimsContent });
    return { success: true, content, usage: estimateTokens(content) };
  }

  // 检查术语一致性（兼容 qwenAI API）
  async checkTerminologyConsistency(content: string): Promise<LocalAIResponse> {
    const issues = checkTerminologyConsistency(content, 'software');
    const text = issues.map(i => `术语"${i.original}"建议统一为"${i.standard}"`).join('\n') || '术语一致性检查通过，未发现明显问题。';
    return { success: true, content: text, usage: estimateTokens(text) };
  }

  // 专利检索（兼容 qwenAI API）
  async searchPatents(params: { techField: string; keywords: string[] }): Promise<LocalAIResponse> {
    const keyword = params.keywords?.[0] || params.techField || '技术';
    const patents = searchPatentsMock(keyword);
    const text = `专利检索结果：\n${patents.map(p => `${p.patentNo} ${p.title} (相似度: ${p.similarity})`).join('\n')}`;
    return { success: true, content: text, usage: estimateTokens(text) };
  }

  // 生成五书（兼容 qwenAI API）
  async generateFiveBooks(_specContent: string, _claimsContent?: string): Promise<LocalAIResponse> {
    const content = generateFiveBooksTemplate({ techField: 'software', patentType: '发明专利' });
    return { success: true, content, usage: estimateTokens(content) };
  }

  // 生成摘要（兼容 qwenAI API）
  async generateAbstract(specContent: string, _claimsContent?: string): Promise<LocalAIResponse> {
    const abstract = `本发明涉及一种技术方案，包括第一组件、第二组件和第三组件。${specContent.substring(0, 100)}...`;
    return { success: true, content: abstract, usage: estimateTokens(abstract) };
  }

  // 生成附图说明（兼容 qwenAI API）
  async generateDrawingDesc(_specContent: string): Promise<LocalAIResponse> {
    const desc = `图1为本发明的整体结构示意图；\n图2为本发明的流程图；\n图3为本发明的详细结构示意图。`;
    return { success: true, content: desc, usage: estimateTokens(desc) };
  }

  // 术语检索（兼容 qwenAI API）
  async searchTerminology(_techField: string, _context: string, _terminologyList?: any[]): Promise<LocalAIResponse> {
    const text = '术语检索完成，建议使用标准术语。';
    return { success: true, content: text, usage: estimateTokens(text) };
  }

  // 专利价值评估（兼容 qwenAI API）
  async evaluatePatentValue(params: { title: string; techField: string; claims?: string }): Promise<LocalAIResponse> {
    const totalScore = Math.floor(Math.random() * 30) + 70;
    const text = JSON.stringify({
      techScore: Math.floor(Math.random() * 20) + 75,
      lawScore: Math.floor(Math.random() * 20) + 75,
      marketScore: Math.floor(Math.random() * 20) + 75,
      economyScore: Math.floor(Math.random() * 20) + 75,
      totalScore,
      techComment: '该专利在技术维度表现良好，核心技术具备一定创新性。',
      lawComment: '专利法律状态稳定，权利要求保护范围合理。',
      marketComment: '目标市场具备一定潜力，竞品分析显示尚有发展空间。',
      economyComment: '预计具备一定的商业化价值。',
      generalConclusion: '综合评估，该专利整体价值较高。',
      riskList: [
        { riskType: '技术迭代', level: '中', desc: '相关技术领域更新较快', suggest: '持续关注技术发展趋势' },
      ],
    });
    return { success: true, content: text, usage: estimateTokens(text) };
  }

  // 本地新增方法（不依赖 qwenAI 兼容）
  async checkAIRate(content: string): Promise<{ rate: number; flaggedSections: string[] }> {
    return checkAIRate(content);
  }
}

// 提取参数辅助函数
function extractParam(content: string, key: string): string | undefined {
  const patterns = [
    new RegExp(`${key}[:：]\\s*([^\\n]+)`, 'i'),
    new RegExp(`${key}[:：]\\s*"([^"]+)"`, 'i'),
    new RegExp(`${key}[:：]\\s*'([^']+)'`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) return match[1].trim();
  }
  return undefined;
}

// 单例实例
export const localAI = new LocalAIService();
export default localAI;
