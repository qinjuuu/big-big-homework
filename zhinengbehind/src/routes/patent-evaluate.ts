import { Router, Request, Response } from 'express';

export const patentEvaluateRouter = Router();

const mockRecords: any[] = [];

function generateMockEvaluateResult(body: any): any {
  const totalScore = Math.floor(Math.random() * 30) + 70; // 70-100
  const techScore = Math.floor(Math.random() * 20) + 75;
  const lawScore = Math.floor(Math.random() * 20) + 75;
  const marketScore = Math.floor(Math.random() * 20) + 75;
  const economyScore = Math.floor(Math.random() * 20) + 75;
  return {
    techScore,
    lawScore,
    marketScore,
    economyScore,
    totalScore,
    techComment: '该专利在技术维度表现良好，核心技术具备一定创新性，技术方案较为完整。',
    lawComment: '专利法律状态稳定，权利要求保护范围合理，未发现明显法律风险。',
    marketComment: '目标市场具备一定潜力，竞品分析显示该领域尚有发展空间。',
    economyComment: '预计具备一定的商业化价值，建议结合具体应用场景进一步评估。',
    generalConclusion: '综合评估，该专利整体价值较高，建议在技术完善和市场拓展方面持续投入。',
    riskList: [
      { riskType: '技术迭代', level: '中', desc: '相关技术领域更新较快', suggest: '持续关注技术发展趋势，适时优化技术方案' },
      { riskType: '市场竞争', level: '低', desc: '市场竞品数量可控', suggest: '加强差异化优势，巩固技术壁垒' },
    ],
  };
}

// POST /api/patent-evaluate/create - 创建专利评估
patentEvaluateRouter.post('/create', async (req: Request, res: Response) => {
  const id = String(Date.now());
  const evaluateResult = generateMockEvaluateResult(req.body);
  const record = {
    id,
    ...req.body,
    ...evaluateResult,
    status: 'completed',
    create_time: new Date().toISOString(),
  };
  mockRecords.push(record);
  res.json({ code: 0, data: evaluateResult });
});

// GET /api/patent-evaluate/list - 评估列表
patentEvaluateRouter.get('/list', async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  const start = (page - 1) * pageSize;
  const list = mockRecords.slice(start, start + pageSize).map((r) => ({
    id: r.id,
    patentNo: r.patentNo,
    patentName: r.patentName,
    totalScore: r.totalScore,
    createTime: r.create_time,
    submitUser: r.submitUser || 'system',
  }));
  res.json({ code: 0, data: { list, total: mockRecords.length, page, pageSize } });
});

// GET /api/patent-evaluate/:id - 评估详情
patentEvaluateRouter.get('/:id', async (req: Request, res: Response) => {
  const record = mockRecords.find(r => r.id === req.params.id);
  if (!record) {
    return res.status(404).json({ code: -1, message: '记录不存在' });
  }
  res.json({ code: 0, data: record });
});
