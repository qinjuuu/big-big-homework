// zhinengbehind/src/services/qwen-ai.ts
import axios from 'axios';

interface QwenConfig {
  apiUrl: string;
  modelName: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface QwenResponse {
  success: boolean;
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: string;
}

class QwenAIService {
  private config: QwenConfig;

  constructor(config?: Partial<QwenConfig>) {
    this.config = {
      apiUrl: process.env.QWEN_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      modelName: process.env.QWEN_MODEL || 'qwen-max',
      apiKey: process.env.QWEN_API_KEY || '',
      temperature: 0.7,
      maxTokens: 4096,
      ...config,
    };

    if (!this.config.apiKey) {
      console.warn('⚠️  QWEN_API_KEY 未配置，AI 功能将无法正常工作');
      console.warn('请在 .env 文件中配置您的 DashScope API Key');
    }
  }

  /**
   * 通用对话接口 - 适配 DashScope OpenAI 兼容格式
   */
  async chat(messages: ChatMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
  }): Promise<QwenResponse> {
    try {
      if (!this.config.apiKey) {
        throw new Error('API Key 未配置');
      }

      const response = await axios.post(
        this.config.apiUrl,
        {
          model: this.config.modelName,
          messages,
          temperature: options?.temperature ?? this.config.temperature,
          max_tokens: options?.maxTokens ?? this.config.maxTokens,
          stream: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          timeout: 60000, // 60秒超时
        }
      );

      return {
        success: true,
        content: response.data.choices[0]?.message?.content || '',
        usage: {
          prompt_tokens: response.data.usage?.prompt_tokens || 0,
          completion_tokens: response.data.usage?.completion_tokens || 0,
          total_tokens: response.data.usage?.total_tokens || 0,
        },
      };
    } catch (error: any) {
      console.error('DashScope API Error:', error.response?.data || error.message);
      
      let errorMessage = error.message;
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error.message || JSON.stringify(error.response.data.error);
      }

      return {
        success: false,
        content: '',
        error: errorMessage,
      };
    }
  }

  /**
   * 生成交底书结构化内容
   */
  async generateDisclosure(input: {
    techField: string;
    rawContent: string;
    images?: string[];
  }): Promise<QwenResponse> {
    const systemPrompt = `你是一位专业的专利工程师，擅长将不完整的技术描述转换为结构化的技术交底书。
请按照以下结构输出：

## 技术问题
（描述该技术要解决的具体问题）

## 技术方案
### 1. 系统/装置结构
（详细描述各组成部分及其连接关系）

### 2. 工艺步骤/工作流程
（按顺序说明操作步骤）

### 3. 原理说明
（解释技术原理和工作机制）

### 4. 动作关系说明
（说明各部件之间的配合关系）

## 有益效果
（列出该技术相比现有技术的优势）

## 附图说明
（描述应该包含哪些附图）

要求：
- 使用专业、准确的术语
- 避免功能性描述，必须有具体结构
- 保持逻辑清晰、层次分明
- 字数控制在 2000-5000 字`;

    const userPrompt = `技术领域：${input.techField}

原始技术描述：
${input.rawContent}

请根据上述信息生成完整的技术交底书。`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    return await this.chat(messages, { temperature: 0.7, maxTokens: 4096 });
  }

  /**
   * 生成创新思路推荐
   */
  async generateInnovationIdeas(input: {
    techField: string;
    currentSolution: string;
    priorArts?: string[];
  }): Promise<QwenResponse> {
    const systemPrompt = `你是一位资深的专利创新顾问，擅长基于现有技术提出创新改进思路。
请提供 3-5 个具体的创新方向，每个方向包含：
1. 创新点标题
2. 具体实施方案
3. 预期技术效果
4. 可专利性分析

要求创新点具有：
- 新颖性（与现有技术不同）
- 创造性（非显而易见）
- 实用性（可工业化实施）

请用清晰的编号列表格式输出。`;

    let userPrompt = `技术领域：${input.techField}

当前技术方案：
${input.currentSolution}`;

    if (input.priorArts && input.priorArts.length > 0) {
      userPrompt += `\n\n现有技术参考：\n${input.priorArts.join('\n\n')}`;
    }

    userPrompt += '\n\n请基于以上信息，提供创新改进思路。';

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    return await this.chat(messages, { temperature: 0.8, maxTokens: 3072 });
  }

  /**
   * 检测文本 AI 生成率
   */
  async detectAIRate(content: string): Promise<QwenResponse> {
    const systemPrompt = `你是一位专业的文本分析专家，擅长识别文本是否由 AI 生成。
请分析给定文本的 AI 生成概率，并给出详细分析。

输出格式：
AI生成率：XX%

分析依据：
1. 语言特征：...
2. 逻辑结构：...
3. 表达方式：...
4. 专业程度：...

修改建议：
（如果 AI 率高于 30%，给出具体的修改建议，指出需要人工优化的段落）

评判标准：
- AI 文本特征：过于流畅、模板化、缺乏细节、通用表述多
- 人工文本特征：有具体案例、个性化表达、行业术语准确、有独特见解

请严格分析，给出客观的 AI 生成率评估。`;

    const userPrompt = `请分析以下专利文本的 AI 生成率：

${content.substring(0, 8000)}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    return await this.chat(messages, { temperature: 0.3, maxTokens: 2048 });
  }

  /**
   * 生成专利说明书
   */
  async generatePatentSpec(disclosure: {
    title: string;
    techField: string;
    problem: string;
    solution: string;
    effects: string;
  }): Promise<QwenResponse> {
    const systemPrompt = `你是一位经验丰富的专利代理人，擅长将技术交底书转换为符合专利法要求的说明书。

请按照以下结构生成说明书：

【技术领域】
【背景技术】
【发明内容】
  - 要解决的技术问题
  - 技术方案
  - 有益效果
【附图说明】
【具体实施方式】

要求：
- 语言严谨、专业
- 符合专利审查指南要求
- 充分公开技术方案
- 避免广告性用语
- 保持术语一致性
- 字数在 3000-8000 字`;

    const userPrompt = `专利名称：${disclosure.title}
技术领域：${disclosure.techField}

技术问题：
${disclosure.problem}

技术方案：
${disclosure.solution}

有益效果：
${disclosure.effects}

请基于以上交底书内容，生成完整的专利说明书。`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    return await this.chat(messages, { temperature: 0.6, maxTokens: 6144 });
  }

  /**
   * 生成权利要求书
   */
  async generateClaims(specContent: string): Promise<QwenResponse> {
    const systemPrompt = `你是一位专利权利要求书撰写专家。
请基于说明书内容，撰写符合专利法要求的权利要求书。

要求：
1. 独立权利要求：包含全部必要技术特征，清楚限定保护范围
2. 从属权利要求：对独立权利要求进行进一步限定
3. 权利要求之间要有引用关系
4. 语言简洁、准确，避免模糊用语
5. 符合单一性要求

输出格式：
1. 一种XXX，其特征在于，包括：...
2. 根据权利要求1所述的XXX，其特征在于：...
3. ...

请确保权利要求书的完整性和专业性。`;

    const userPrompt = `说明书内容：
${specContent.substring(0, 10000)}

请基于以上说明书，撰写权利要求书。`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    return await this.chat(messages, { temperature: 0.5, maxTokens: 4096 });
  }

  /**
   * 质检审核建议
   */
  async generateReviewAdvice(docs: {
    specContent: string;
    claimsContent: string;
    disclosureContent: string;
  }): Promise<QwenResponse> {
    const systemPrompt = `你是一位专利质量审核专家，负责对专利申请文件进行全面审查。

审查维度：
1. 完整性：五书是否齐全，内容是否完整
2. 一致性：术语是否统一，前后是否矛盾
3. 新颖性：是否有明显的现有技术
4. 创造性：技术方案是否显而易见
5. 实用性：是否能够工业化实施
6. 清楚性：权利要求是否清楚限定
7. 支持性：权利要求是否得到说明书支持

输出格式：
## 审核结果：通过 / 需要修改

## 问题清单
1. 【严重/一般/轻微】问题描述 + 修改建议
2. ...

## AI 审核建议
（具体的优化建议）

请严格按照上述格式输出审核结果。`;

    const userPrompt = `说明书内容：
${docs.specContent.substring(0, 6000)}

权利要求书：
${docs.claimsContent.substring(0, 4000)}

交底书原文：
${docs.disclosureContent.substring(0, 4000)}

请对上述专利申请文件进行质量审核。`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    return await this.chat(messages, { temperature: 0.4, maxTokens: 4096 });
  }

  /**
   * 生成摘要
   */
  async generateAbstract(specContent: string, claimsContent: string): Promise<QwenResponse> {
    const systemPrompt = `你是一位专利代理人，擅长撰写简洁、准确的专利摘要。
摘要要求：
- 200-500字
- 清楚概述技术问题、技术方案要点和主要用途
- 不得使用商业性宣传用语
- 与说明书和权利要求书内容一致`;

    const userPrompt = `说明书：
${specContent.substring(0, 5000)}

权利要求书：
${claimsContent.substring(0, 3000)}

请根据以上内容撰写专利摘要。`;

    return await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.4, maxTokens: 1024 });
  }

  /**
   * 生成附图说明
   */
  async generateDrawingDesc(specContent: string): Promise<QwenResponse> {
    const systemPrompt = `你是一位专利代理人，擅长撰写附图说明。
请根据说明书内容，生成清晰的附图说明列表。
格式示例：
图1：XXX系统结构框图
图2：XXX模块内部结构示意图
...
要求每张图标注其展示的内容和对应关系。`;

    const userPrompt = `说明书：
${specContent.substring(0, 6000)}

请根据说明书描述，生成附图说明。`;

    return await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.4, maxTokens: 1024 });
  }

  /**
   * 基于知识库检索术语，用于补充交底书时的术语约束
   */
  async searchTerminology(techField: string, context: string, terminologyList: string[]): Promise<QwenResponse> {
    const systemPrompt = `你是一位专利术语专家。
根据给定的术语库和技术上下文，输出应使用的标准术语建议。

输出格式：
## 推荐术语
1. 标准术语：XXX（替代俗语：YYY）
2. ...

## 术语一致性建议
（1-2句话总结术语使用注意事项）

如果没有相关术语，回复"无相关术语建议"。`;

    const userPrompt = `技术领域：${techField}

术语库中的术语：
${terminologyList.join('\n')}

技术上下文：
${context.substring(0, 2000)}

请分析并给出术语建议。`;

    return await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.3, maxTokens: 1024 });
  }

  /**
   * 专利检索 — AI 模拟检索已发表论文和专利，提供创新思路
   */
  async searchPatents(input: {
    techField: string;
    keywords: string[];
    disclosureContent: string;
  }): Promise<QwenResponse> {
    const systemPrompt = `你是一位资深专利检索分析师，拥有海量专利数据库的访问权限。
请根据提供的技术信息和关键词，模拟专利检索，给出结构化的检索结果。

注意：
- 输出必须看起来像真实的检索结果
- 专利号使用有效的格式（CN+8位数字/字母，US+数字，EP+数字等）
- 申请人应是合理的公司或机构名称
- 相似度和风险等级要有区分度
- 创新思路要基于现有技术的空白点

输出格式：
## 检索统计
总检索文献数：XXXX
相关专利数：XX
高相关度：X
综合风险等级：高/中/低

## 现有技术列表
| 专利号 | 名称 | 申请人 | 日期 | 相似度 | 风险等级 | 风险特征 | 风险位置 |
|--------|------|--------|------|--------|----------|----------|----------|
| CN20XXXXXXXXX.X | XXX | XXX公司 | 20XX-XX-XX | XX% | 高/中/低 | XXX | 权利要求X |

## 新创性风险分析
1. 【高/中/低风险】技术特征：XXX
   相关专利：XXX
   原因：XXX
   建议：XXX

## 创新思路推荐
1. 创新点标题：XXX
   实施方案：XXX
   预期效果：XXX
   可专利性分析：XXX`;

    const userPrompt = `技术领域：${input.techField}

检索关键词：${input.keywords.join('、')}

技术描述：
${input.disclosureContent.substring(0, 3000)}

请检索相关专利和论文，给出结构化的检索报告。`;

    return await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.6, maxTokens: 4096 });
  }

  /**
   * 术语统一检查
   */
  async checkTerminologyConsistency(content: string): Promise<QwenResponse> {
    const systemPrompt = `你是一位专利术语标准化专家。
请检查文本中的术语使用是否一致，找出同一概念使用不同表述的情况。

输出格式：
## 术语不一致问题
1. "术语A" 和 "术语B" 指代同一概念，建议统一为 "XXX"
2. ...

## 建议的标准术语表
- 术语1：定义
- 术语2：定义

请仔细检查并给出详细的术语一致性报告。`;

    const userPrompt = `请检查以下专利文本的术语一致性：

${content.substring(0, 8000)}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    return await this.chat(messages, { temperature: 0.3, maxTokens: 2048 });
  }

  /**
   * 图像理解（多模态输入）
   */
  async analyzeImage(imageBase64: string, prompt: string): Promise<QwenResponse> {
    try {
      if (!this.config.apiKey) {
        throw new Error('API Key 未配置');
      }

      // DashScope 多模态 API 调用
      const response = await axios.post(
        'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        {
          model: 'qwen-vl-max', // 使用视觉模型
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imageBase64 } },
              ],
            },
          ],
          max_tokens: 2048,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          timeout: 60000,
        }
      );

      return {
        success: true,
        content: response.data.choices[0]?.message?.content || '',
        usage: response.data.usage,
      };
    } catch (error: any) {
      console.error('Image Analysis Error:', error.response?.data || error.message);
      return {
        success: false,
        content: '',
        error: error.message,
      };
    }
  }
}

export default new QwenAIService();
