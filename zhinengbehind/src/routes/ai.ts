import { Router, Request, Response } from 'express';
import pool from '../db/connection';
import { qwenAI } from '../services/qwen-ai';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

const UPLOAD_DIR = path.join(os.tmpdir(), 'vast-uploads');

export const aiRouter = Router();

// AI 日志记录（容错处理，表不存在时静默忽略）
async function logAIAction(
  caseId: string,
  moduleType: string,
  action: string,
  inputData: string,
  outputData: string,
  humanFeedback?: string
) {
  try {
    if (humanFeedback !== undefined) {
      await pool.query(
        'INSERT INTO sys_ai_log (case_id, module_type, ai_action, input_data, output_data, human_feedback) VALUES (?, ?, ?, ?, ?, ?)',
        [caseId, moduleType, action, inputData, outputData, humanFeedback]
      );
    } else {
      await pool.query(
        'INSERT INTO sys_ai_log (case_id, module_type, ai_action, input_data, output_data) VALUES (?, ?, ?, ?, ?)',
        [caseId, moduleType, action, inputData, outputData]
      );
    }
  } catch (err: any) {
    console.warn('AI 日志记录失败（表可能不存在）:', err.message);
  }
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// POST /api/ai/generate-disclosure - AI 辅助生成交底书
aiRouter.post('/generate-disclosure', async (req: Request, res: Response) => {
  try {
    const { case_id, tech_field, source_content, innovation_context } = req.body;
    
    if (!source_content) {
      return res.status(400).json({ code: -1, message: '缺少技术描述内容' });
    }

    console.log('开始生成交底书...', { case_id, tech_field });

    // 调用 Qwen 生成交底书
    const result = await qwenAI.generateDisclosure({
      techField: tech_field || '未知领域',
      rawContent: source_content,
    });

    if (!result.success) {
      return res.status(500).json({ 
        code: -1, 
        message: 'AI 生成失败',
        error: result.error 
      });
    }

    // 如果有上下文，生成创新思路
    let innovationIdeas: string[] = [];
    if (innovation_context) {
      const ideasResult = await qwenAI.generateInnovationIdeas({
        techField: tech_field || '未知领域',
        currentSolution: source_content,
      });
      
      if (ideasResult.success) {
        innovationIdeas = ideasResult.content.split(/\d+\./).filter(Boolean).slice(1, 6);
      }
    }

    // 保存 AI 生成结果到数据库
    if (case_id) {
      await pool.query(
        'UPDATE sys_disclosure SET ai_generate_content = ?, ai_suggest = ?, m06_stage = ? WHERE case_id = ?',
        [result.content, JSON.stringify(innovationIdeas), 'AI_GENERATED', case_id]
      );

      // 记录 AI 日志
      await logAIAction(
        case_id, 'M06', 'generate_disclosure',
        JSON.stringify({ tech_field, source_length: source_content.length }),
        JSON.stringify({ output_length: result.content.length })
      );
    }

    res.json({ 
      code: 0, 
      data: { 
        structure: result.content,
        ideas: innovationIdeas,
        usage: result.usage
      } 
    });
  } catch (err: any) {
    console.error('AI 生成错误:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// POST /api/ai/check-ai-rate - 检查文本 AI 率
aiRouter.post('/check-ai-rate', async (req: Request, res: Response) => {
  try {
    const { case_id, content, doc_type } = req.body;
    
    if (!content) {
      return res.status(400).json({ code: -1, message: '缺少文本内容' });
    }

    console.log('开始检测 AI 率...', { case_id, doc_type, content_length: content.length });

    // 调用 Qwen 检测 AI 率
    const result = await qwenAI.detectAIRate(content);

    if (!result.success) {
      return res.status(500).json({ 
        code: -1, 
        message: 'AI 检测失败',
        error: result.error 
      });
    }

    // 解析 AI 率（从返回文本中提取百分比）
    const aiRateMatch = result.content.match(/AI生成率[：:]\s*(\d+)%/);
    const aiRate = aiRateMatch ? parseFloat(aiRateMatch[1]) : 50;

    // 提取修改建议
    const suggestionsMatch = result.content.match(/修改建议[：:]([\s\S]*)/);
    const suggestions = suggestionsMatch ? suggestionsMatch[1].trim().split(/\n+/).filter(Boolean) : [];

    // 保存到数据库
    if (case_id && doc_type === 'spec') {
      await pool.query(
        'UPDATE sys_writing SET ai_check_rate = ? WHERE case_id = ?',
        [aiRate, case_id]
      );
    }

    // 记录 AI 日志
    if (case_id) {
      await logAIAction(
        case_id, 'M07', 'check_ai_rate',
        JSON.stringify({ content_length: content.length }),
        JSON.stringify({ ai_rate: aiRate }),
        JSON.stringify(suggestions)
      );
    }

    res.json({ 
      code: 0, 
      data: { 
        aiRate,
        analysis: result.content,
        suggestions,
        usage: result.usage
      } 
    });
  } catch (err: any) {
    console.error('AI 率检测错误:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// POST /api/ai/generate-spec - 生成专利说明书
aiRouter.post('/generate-spec', async (req: Request, res: Response) => {
  try {
    const { case_id, disclosure } = req.body;
    
    if (!disclosure) {
      return res.status(400).json({ code: -1, message: '缺少交底书内容' });
    }

    console.log('开始生成说明书...', { case_id });

    const result = await qwenAI.generatePatentSpec({
      title: disclosure.title || '未命名专利',
      techField: disclosure.tech_field || '',
      problem: disclosure.problem || '',
      solution: disclosure.solution || '',
      effects: disclosure.effects || '',
    });

    if (!result.success) {
      return res.status(500).json({ 
        code: -1, 
        message: '说明书生成失败',
        error: result.error 
      });
    }

    // 保存说明书
    if (case_id) {
      await pool.query(
        'INSERT INTO sys_writing (case_id, spec_content, m07_status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE spec_content = VALUES(spec_content)',
        [case_id, result.content, 'drafting']
      );

      await logAIAction(
        case_id, 'M07', 'generate_spec',
        JSON.stringify({ disclosure }),
        JSON.stringify({ spec_length: result.content.length })
      );
    }

    res.json({ 
      code: 0, 
      data: { 
        specContent: result.content,
        usage: result.usage
      } 
    });
  } catch (err: any) {
    console.error('说明书生成错误:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// POST /api/ai/generate-claims - 生成权利要求书
aiRouter.post('/generate-claims', async (req: Request, res: Response) => {
  try {
    const { case_id, spec_content } = req.body;
    
    if (!spec_content) {
      return res.status(400).json({ code: -1, message: '缺少说明书内容' });
    }

    console.log('开始生成权利要求书...', { case_id });

    const result = await qwenAI.generateClaims(spec_content);

    if (!result.success) {
      return res.status(500).json({ 
        code: -1, 
        message: '权利要求书生成失败',
        error: result.error 
      });
    }

    // 保存权利要求书
    if (case_id) {
      await pool.query(
        'UPDATE sys_writing SET claim_content = ? WHERE case_id = ?',
        [result.content, case_id]
      );

      await logAIAction(
        case_id, 'M07', 'generate_claims',
        JSON.stringify({ spec_length: spec_content.length }),
        JSON.stringify({ claims_length: result.content.length })
      );
    }

    res.json({ 
      code: 0, 
      data: { 
        claimsContent: result.content,
        usage: result.usage
      } 
    });
  } catch (err: any) {
    console.error('权利要求书生成错误:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// POST /api/ai/review - AI 质检审核
aiRouter.post('/review', async (req: Request, res: Response) => {
  try {
    const { case_id, spec_content, claims_content, disclosure_content } = req.body;
    
    if (!spec_content || !claims_content) {
      return res.status(400).json({ code: -1, message: '缺少审核内容' });
    }

    console.log('开始 AI 质检审核...', { case_id });

    const result = await qwenAI.generateReviewAdvice({
      specContent: spec_content,
      claimsContent: claims_content,
      disclosureContent: disclosure_content || '',
    });

    if (!result.success) {
      return res.status(500).json({ 
        code: -1, 
        message: 'AI 审核失败',
        error: result.error 
      });
    }

    // 保存审核结果
    if (case_id) {
      await pool.query(
        'INSERT INTO sys_quality_check (case_id, ai_advice, m08_status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ai_advice = VALUES(ai_advice)',
        [case_id, result.content, 'ai_reviewed']
      );

      await logAIAction(
        case_id, 'M08', 'quality_review',
        JSON.stringify({ doc_types: ['spec', 'claims'] }),
        JSON.stringify({ advice_length: result.content.length })
      );
    }

    res.json({ 
      code: 0, 
      data: { 
        reviewAdvice: result.content,
        usage: result.usage
      } 
    });
  } catch (err: any) {
    console.error('AI 审核错误:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// POST /api/ai/check-terminology - 术语一致性检查
aiRouter.post('/check-terminology', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ code: -1, message: '缺少检查内容' });
    }

    const result = await qwenAI.checkTerminologyConsistency(content);

    if (!result.success) {
      return res.status(500).json({ 
        code: -1, 
        message: '术语检查失败',
        error: result.error 
      });
    }

    res.json({ 
      code: 0, 
      data: { 
        report: result.content,
        usage: result.usage
      } 
    });
  } catch (err: any) {
    console.error('术语检查错误:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// POST /api/ai/innovate - 生成创新思路
aiRouter.post('/innovate', async (req: Request, res: Response) => {
  try {
    const { tech_field, current_solution, prior_arts } = req.body;
    
    if (!tech_field || !current_solution) {
      return res.status(400).json({ code: -1, message: '缺少必要参数' });
    }

    const result = await qwenAI.generateInnovationIdeas({
      techField: tech_field,
      currentSolution: current_solution,
      priorArts: prior_arts,
    });

    if (!result.success) {
      return res.status(500).json({ 
        code: -1, 
        message: '创新思路生成失败',
        error: result.error 
      });
    }

    res.json({ 
      code: 0, 
      data: { 
        ideas: result.content,
        usage: result.usage
      } 
    });
  } catch (err: any) {
    console.error('创新思路生成错误:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// POST /api/ai/generate-five-books - 生成五书中的摘要和附图说明
aiRouter.post('/generate-five-books', async (req: Request, res: Response) => {
  try {
    const { case_id, spec_content, claims_content } = req.body;

    if (!spec_content || !claims_content) {
      return res.status(400).json({ code: -1, message: '缺少说明书或权利要求书内容' });
    }

    console.log('开始生成五书（摘要 + 附图说明）...', { case_id });

    const [abstractResult, drawingResult] = await Promise.all([
      qwenAI.generateAbstract(spec_content, claims_content),
      qwenAI.generateDrawingDesc(spec_content),
    ]);

    if (!abstractResult.success || !drawingResult.success) {
      return res.status(500).json({
        code: -1,
        message: '五书生成失败',
        error: abstractResult.error || drawingResult.error,
      });
    }

    // 存入数据库
    if (case_id) {
      const fiveBooks = JSON.stringify({
        abstract: abstractResult.content,
        drawing_desc: drawingResult.content,
      });
      await pool.query(
        'UPDATE sys_writing SET five_books_content = ? WHERE case_id = ?',
        [fiveBooks, case_id]
      );
      await logAIAction(
        case_id, 'M07', 'generate_five_books',
        JSON.stringify({ spec_length: spec_content.length }),
        JSON.stringify({ abstract_length: abstractResult.content.length, drawing_desc_length: drawingResult.content.length })
      );
    }

    res.json({
      code: 0,
      data: {
        abstract: abstractResult.content,
        drawing_desc: drawingResult.content,
        usage: { abstract: abstractResult.usage, drawing_desc: drawingResult.usage },
      },
    });
  } catch (err: any) {
    console.error('五书生成错误:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// POST /api/ai/search-terminology - AI 语义检索术语库
aiRouter.post('/search-terminology', async (req: Request, res: Response) => {
  try {
    const { tech_field, context } = req.body;

    if (!tech_field || !context) {
      return res.status(400).json({ code: -1, message: '缺少 tech_field 或 context' });
    }

    // 从术语库查询相关领域的术语
    const [rows] = await pool.query(
      'SELECT term, definition, aliases FROM sys_terminology WHERE domain LIKE ? LIMIT 100',
      [`%${tech_field}%`]
    ) as any;

    const terminologyList = rows.map((r: any) => `${r.term}：${r.definition}（别名：${r.aliases || '无'}）`);

    if (terminologyList.length === 0) {
      return res.json({ code: 0, data: { suggestions: '', terminology: [] } });
    }

    const result = await qwenAI.searchTerminology(tech_field, context, terminologyList);

    res.json({
      code: 0,
      data: {
        suggestions: result.success ? result.content : '',
        terminology: rows,
        usage: result.usage,
      },
    });
  } catch (err: any) {
    console.error('术语检索错误:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// POST /api/ai/search-patents - AI 专利检索
aiRouter.post('/search-patents', async (req: Request, res: Response) => {
  try {
    const { case_id, tech_field, keywords, disclosure_content } = req.body;

    if (!tech_field || !keywords || !disclosure_content) {
      return res.status(400).json({ code: -1, message: '缺少必要参数' });
    }

    console.log('开始 AI 专利检索...', { case_id, tech_field, keywords });

    const result = await qwenAI.searchPatents({
      techField: tech_field,
      keywords,
      disclosureContent: disclosure_content,
    });

    if (!result.success) {
      return res.status(500).json({
        code: -1,
        message: '专利检索失败',
        error: result.error,
      });
    }

    // 保存检索结果到 AI 日志
    if (case_id) {
      await logAIAction(
        case_id, 'M06', 'patent_search',
        JSON.stringify({ tech_field, keywords }),
        JSON.stringify({ output_length: result.content.length })
      );
    }

    res.json({
      code: 0,
      data: {
        search_result: result.content,
        usage: result.usage,
      },
    });
  } catch (err: any) {
    console.error('专利检索错误:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// POST /api/ai/evaluate-value - 专利价值评估
aiRouter.post('/evaluate-value', async (req: Request, res: Response) => {
  try {
    const { case_id, title, tech_field, problem, solution, effects, claims } = req.body;

    if (!title || !tech_field || !problem || !solution) {
      return res.status(400).json({ code: -1, message: '缺少必要参数' });
    }

    console.log('开始专利价值评估...', { case_id, title });

    const result = await qwenAI.evaluatePatentValue({
      title,
      techField: tech_field,
      problem,
      solution,
      effects: effects || '',
      claims,
    });

    if (!result.success) {
      return res.status(500).json({ code: -1, message: '价值评估失败', error: result.error });
    }

    if (case_id) {
      await logAIAction(
        case_id, 'M06', 'evaluate_value',
        JSON.stringify({ title, tech_field }),
        JSON.stringify({ output_length: result.content.length })
      );
    }

    res.json({ code: 0, data: { evaluation: result.content, usage: result.usage } });
  } catch (err: any) {
    console.error('价值评估错误:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// POST /api/ai/upload - 文件上传处理
aiRouter.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: -1, message: '没有上传文件' });
    }

    const originalname = (req.body?.originalname as string) || (req.file.originalname as string);

    res.json({ 
      code: 0, 
      data: { 
        filename: req.file.filename,
        originalname: originalname,
        path: req.file.path,
        size: req.file.size
      } 
    });
  } catch (err: any) {
    console.error('文件上传错误:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// POST /api/ai/pre-submit-check - 交案前检查
aiRouter.post('/pre-submit-check', async (req: Request, res: Response) => {
  try {
    const { caseId, disclosureContent, specContent, claimsContent, fiveBooksContent } = req.body;

    console.log('开始交案前检查...', { caseId });

    const result = await qwenAI.preSubmitCheck({
      disclosureContent,
      specContent,
      claimsContent,
      fiveBooksContent,
    });

    if (!result.success) {
      return res.status(500).json({ 
        code: -1, 
        message: '交案前检查失败',
        error: result.error 
      });
    }

    // 尝试解析 AI 返回的 JSON
    let parsedResult: any;
    try {
      // 尝试从 AI 返回中提取 JSON
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        parsedResult = JSON.parse(result.content);
      }
    } catch (parseErr) {
      console.warn('AI 返回格式非标准 JSON，使用默认结构:', parseErr);
      // 构建默认结构
      parsedResult = {
        overallStatus: 'fail',
        totalScore: 50,
        formalCheck: { status: 'fail', score: 50, items: [{ name: '格式检查', status: 'warning', detail: 'AI 返回格式异常，请人工复核' }] },
        completenessCheck: { status: 'fail', score: 50, items: [{ name: '完整性检查', status: 'warning', detail: 'AI 返回格式异常，请人工复核' }] },
        consistencyCheck: { status: 'fail', score: 50, items: [{ name: '一致性检查', status: 'warning', detail: 'AI 返回格式异常，请人工复核' }] },
        summary: result.content.substring(0, 500) || 'AI 检查完成，但返回格式异常',
      };
    }

    // 记录 AI 日志
    if (caseId) {
      await logAIAction(
        caseId, 'M09', 'pre_submit_check',
        JSON.stringify({ caseId }),
        JSON.stringify({ result: parsedResult.overallStatus, score: parsedResult.totalScore })
      );
    }

    res.json({ 
      code: 0, 
      data: parsedResult
    });
  } catch (err: any) {
    console.error('交案前检查错误:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// POST /api/ai/generate-drawing - AI 生成附图建议
aiRouter.post('/generate-drawing', async (req: Request, res: Response) => {
  try {
    const { caseId, specContent } = req.body;
    
    if (!specContent) {
      return res.status(400).json({ code: -1, message: '缺少说明书内容' });
    }

    console.log('开始生成附图建议...', { caseId });

    const result = await qwenAI.generateMainDrawing({ specContent });

    if (!result.success) {
      return res.status(500).json({ 
        code: -1, 
        message: '附图生成失败',
        error: result.error 
      });
    }

    // 尝试解析 AI 返回的 JSON
    let parsedResult: any;
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        parsedResult = JSON.parse(result.content);
      }
    } catch (parseErr) {
      console.warn('AI 返回格式非标准 JSON，使用默认结构:', parseErr);
      parsedResult = {
        drawingSuggestion: result.content.substring(0, 500) || '请根据说明书内容设计附图',
        figureNumber: '图1',
        keyElements: ['主要结构', '关键部件'],
      };
    }

    // 记录 AI 日志
    if (caseId) {
      await logAIAction(
        caseId, 'M07', 'generate_drawing',
        JSON.stringify({ spec_length: specContent.length }),
        JSON.stringify({ suggestion: parsedResult.drawingSuggestion })
      );
    }

    res.json({ 
      code: 0, 
      data: parsedResult
    });
  } catch (err: any) {
    console.error('附图生成错误:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});
