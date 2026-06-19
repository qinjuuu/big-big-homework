// lib/types/patentEvaluate.ts
export interface PatentEvaluateParams {
    patentNo: string; // 专利号
    techField: string; // 技术领域
    claimCount: number; // 权利要求数量
    marketUsage: string; // 市场应用场景
    legalStatus: string; // 法律状态
}
// AI返回多维度打分
export interface PatentScoreResult {
    techScore: number; // 技术分0-100
    lawScore: number;  // 法律分
    marketScore: number; // 市场分
    economyScore: number; // 经济分
    totalScore: number; // 总分
    aiComment: string; // AI评估评语
}