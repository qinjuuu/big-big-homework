// VAST 8.0 API 服务层
const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const BASE_URL = RAW_BASE_URL.endsWith('/api')
  ? RAW_BASE_URL
  : `${RAW_BASE_URL.replace(/\/$/, '')}/api`;

interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('vast_token') || localStorage.getItem('token')
    : null;

  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }
  const json: ApiResponse<T> = await res.json();
  if (json.code !== 0) {
    throw new Error(json.message || 'API Error');
  }
  return json.data;
}

// ========== 案件 API ==========
export interface CaseItem {
  case_id: string;
  case_name: string;
  patent_type: string;
  tech_field: string;
  creator_name: string;
  case_status: string;
  client_name: string;
  contact_person: string;
  sales_person: string;
  service_rep: string;
  engineer: string | null;
  priority: string;
  m05_status: string;
  source_type: string;
  create_time: string;
  update_time: string;
}

export interface CaseDetail extends CaseItem {
  disclosure: any;
  writing: any;
  review: any;
  logs: any[];
}

export async function getCases(params?: {
  status?: string;
  m05_status?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedData<CaseItem>> {
  const search = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) search.set(k, String(v));
    });
  }
  return request<PaginatedData<CaseItem>>(`/cases?${search}`);
}

export async function getCaseDetail(id: string): Promise<CaseDetail> {
  return request<CaseDetail>(`/cases/${id}`);
}

export async function createCase(data: Partial<CaseItem>): Promise<{ case_id: string }> {
  return request('/cases', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateCase(id: string, data: Partial<CaseItem>): Promise<void> {
  return request(`/cases/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function updateCaseStatus(
  id: string,
  data: {
    case_status?: string;
    m05_status?: string;
    opt_user?: string;
    opt_content?: string;
    engineer?: string;
  } | string,
  m05_status?: string,
  opt_user?: string
): Promise<void> {
  // 兼容旧调用：updateCaseStatus(id, case_status, m05_status, opt_user)
  const body =
    typeof data === 'string'
      ? { case_status: data, m05_status, opt_user }
      : data;
  return request(`/cases/${id}/status`, { method: 'PUT', body: JSON.stringify(body) });
}

export interface CaseStats {
  total: number;
  pendingDisclosure: number;
  writing: number;
  pendingReview: number;
  archived: number;
  m05Stats: Array<{ m05_status: string; count: number }>;
}

export async function getCaseStats(): Promise<CaseStats> {
  return request<CaseStats>('/cases/stats');
}

// ========== 交底书 API ==========
export interface DisclosureItem {
  id: number;
  case_id: string;
  source_content: string;
  ai_generate_content: string;
  ai_suggest: string;
  m06_stage: string;
  m06_status: string;
  risk_level: string;
  quality_score: number | null;
  case_name: string;
  patent_type: string;
  tech_field: string;
  engineer: string;
  sales_person: string;
  service_rep: string;
  source_type: string;
  create_time: string;
  finish_time: string | null;
  // 可选的章节字段（后端可能扩展返回）
  problem?: string;
  tech_problem?: string;
  background?: string;
  background_tech?: string;
  defects?: string;
  purpose?: string;
  solution?: string;
  keypoints?: string;
  effect?: string;
  drawings?: string;
  alternatives?: string;
  innovation_ideas?: string;
  source_files?: any;
  attachments?: Array<{
    id?: number | string;
    name: string;
    type?: string;
    size?: string | number;
    isCore?: boolean;
    parseStatus?: string;
    sourceContent?: string;
  }>;
  [key: string]: any;
}

export async function getDisclosures(params?: {
  stage?: string;
  status?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedData<DisclosureItem>> {
  const search = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) search.set(k, String(v));
    });
  }
  return request<PaginatedData<DisclosureItem>>(`/disclosures?${search}`);
}

export async function getDisclosureDetail(id: number | string): Promise<DisclosureItem> {
  return request<DisclosureItem>(`/disclosures/${id}`);
}

// 兼容别名
export async function getDisclosureById(id: number | string): Promise<DisclosureItem> {
  return getDisclosureDetail(id);
}

export async function createDisclosure(data: { case_id: string; source_content?: string; source_files?: any }): Promise<void> {
  return request('/disclosures', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateDisclosure(id: number, data: Partial<DisclosureItem>): Promise<void> {
  return request(`/disclosures/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export interface DisclosureStats {
  total: number;
  byStage: Array<{ m06_stage: string; count: number }>;
  byStatus: Array<{ m06_status: string; count: number }>;
  byRisk: Array<{ risk_level: string; count: number }>;
}

export async function getDisclosureStats(): Promise<DisclosureStats> {
  return request<DisclosureStats>('/disclosures/stats');
}

// ========== 撰写 API ==========
export interface WritingItem {
  id: number;
  case_id: string;
  spec_content: string;
  claim_content: string;
  five_books_content: string;
  repeat_check_info: string;
  ai_check_rate: number;
  m07_status: string;
  write_user: string;
  case_name: string;
  patent_type: string;
  tech_field: string;
  create_time: string;
  write_finish: string | null;
}

export async function getWritings(params?: {
  status?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedData<WritingItem>> {
  const search = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) search.set(k, String(v));
    });
  }
  return request<PaginatedData<WritingItem>>(`/writings?${search}`);
}

export async function getWritingDetail(id: number | string): Promise<WritingItem> {
  return request<WritingItem>(`/writings/${id}`);
}

// 兼容别名
export async function getWritingById(id: number | string): Promise<WritingItem> {
  return getWritingDetail(id);
}

export async function updateWriting(id: number, data: Partial<WritingItem>): Promise<void> {
  return request(`/writings/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function createWriting(data: { case_id: string; write_user?: string }): Promise<void> {
  return request('/writings', { method: 'POST', body: JSON.stringify(data) });
}

export interface WritingStats {
  total: number;
  byStatus: Array<{ m07_status: string; count: number }>;
}

export async function getWritingStats(): Promise<WritingStats> {
  return request<WritingStats>('/writings/stats');
}

// ========== 审核 API ==========
export interface ReviewIssueItem {
  type?: string;
  title: string;
  module?: string;
  status?: string;
}

export interface ReviewItem {
  id: number;
  case_id: string;
  audit_result: string;
  audit_remark: string;
  ai_advice: string;
  audit_user: string;
  m08_status: string;
  audit_time: string;
  case_name: string;
  patent_type: string;
  tech_field: string;
  create_time: string;
  // 可选扩展字段（接口可能不返回）
  engineer?: string;
  risk_assessment?: string;
  issues?: ReviewIssueItem[];
}

export async function getReviews(params?: {
  status?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedData<ReviewItem>> {
  const search = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) search.set(k, String(v));
    });
  }
  return request<PaginatedData<ReviewItem>>(`/reviews?${search}`);
}

export async function getReviewDetail(id: number | string): Promise<ReviewItem> {
  return request<ReviewItem>(`/reviews/${id}`);
}

export async function updateReview(id: number, data: Partial<ReviewItem>): Promise<void> {
  return request(`/reviews/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function createReview(data: { case_id: string }): Promise<void> {
  return request('/reviews', { method: 'POST', body: JSON.stringify(data) });
}

export interface ReviewStats {
  total: number;
  byResult: Array<{ audit_result: string; count: number }>;
  byStatus: Array<{ m08_status: string; count: number }>;
}

export async function getReviewStats(): Promise<ReviewStats> {
  return request<ReviewStats>('/reviews/stats');
}

// ========== 仪表盘 & 统计 ==========
export interface DashboardData {
  moduleStats: Array<{
    id: string;
    name: string;
    total: number;
    pending: number;
    completed?: number;
    trend?: string;
  }>;
  todoItems: Array<{
    id: number;
    title: string;
    count: number;
    type: string;
    module: string;
  }>;
  statusDistribution: Array<{ name: string; value: number }>;
  teamPerformance: Array<{ name: string; completed: number; quality: number }>;
}

export async function getDashboard(): Promise<DashboardData> {
  return request<DashboardData>('/dashboard');
}

export interface ActivityItem {
  id: number;
  case_id: string;
  opt_type: string;
  opt_user: string;
  opt_content: string;
  opt_module: string;
  opt_time: string;
  case_name: string;
}

export async function getActivities(limit?: number): Promise<ActivityItem[]> {
  return request<ActivityItem[]>(`/activities?limit=${limit || 10}`);
}

export async function getHomeStats(): Promise<any> {
  return request('/home-stats');
}

// ========== 用户 / 角色 API ==========
export interface UserItem {
  id: number;
  username: string;
  display_name: string;
  role: string;
  status: number;
  create_time: string;
}

export async function getUsers(params?: {
  role?: string;
  status?: number | string;
  keyword?: string;
}): Promise<UserItem[]> {
  const search = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') search.set(k, String(v));
    });
  }
  return request<UserItem[]>(`/users?${search}`);
}

export async function getUserDetail(id: number): Promise<UserItem> {
  return request<UserItem>(`/users/${id}`);
}

export async function createUser(data: { username: string; password?: string; display_name: string; role?: string }): Promise<void> {
  return request('/users', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateUser(id: number, data: Partial<UserItem>): Promise<void> {
  return request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteUser(id: number): Promise<void> {
  return request(`/users/${id}`, { method: 'DELETE' });
}

export interface RoleItem {
  id: string;
  name: string;
  user_count: number;
}

export async function getRoles(): Promise<RoleItem[]> {
  return request<RoleItem[]>('/roles');
}

// ========== 认证 API ==========
export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  user: {
    id: number
    username: string
    display_name: string
    role: string
  }
}

export async function login(params: LoginParams): Promise<LoginResult> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Login failed');
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message || 'Login failed');
  const result: LoginResult = json.data;
  if (typeof window !== 'undefined' && result?.user) {
    try {
      localStorage.setItem('loginUser', JSON.stringify(result.user));
      if (result.token) {
        localStorage.setItem('vast_token', result.token);
        localStorage.setItem('token', result.token);
      }
    } catch {
      /* ignore storage errors */
    }
  }
  return result;
}

// ========== AI API ==========
export async function generateDisclosure(data: {
  case_id?: string;
  tech_field?: string;
  source_content: string;
  innovation_context?: string;
}): Promise<{ structure: string; ideas: string[]; usage?: any }> {
  return request('/ai/generate-disclosure', { method: 'POST', body: JSON.stringify(data) });
}

export async function checkAIRate(data: {
  case_id?: string;
  content: string;
  doc_type?: string;
}): Promise<{ aiRate: number; analysis: string; suggestions: string[]; usage?: any }> {
  return request('/ai/check-ai-rate', { method: 'POST', body: JSON.stringify(data) });
}

export async function generateSpec(data: {
  case_id?: string;
  disclosure: Record<string, any>;
}): Promise<{ specContent: string; usage?: any }> {
  return request('/ai/generate-spec', { method: 'POST', body: JSON.stringify(data) });
}

export async function generateClaims(data: {
  case_id?: string;
  spec_content: string;
}): Promise<{ claimsContent: string; usage?: any }> {
  return request('/ai/generate-claims', { method: 'POST', body: JSON.stringify(data) });
}

export async function aiReview(data: {
  case_id?: string;
  spec_content: string;
  claims_content: string;
  disclosure_content?: string;
}): Promise<{ reviewAdvice: string; usage?: any }> {
  return request('/ai/review', { method: 'POST', body: JSON.stringify(data) });
}

export async function checkTerminology(content: string): Promise<{ report: string; usage?: any }> {
  return request('/ai/check-terminology', { method: 'POST', body: JSON.stringify({ content }) });
}

export async function generateInnovationIdeas(data: {
  tech_field: string;
  current_solution: string;
  prior_arts?: string;
}): Promise<{ ideas: string; usage?: any }> {
  return request('/ai/innovate', { method: 'POST', body: JSON.stringify(data) });
}

export async function uploadAIFile(file: File): Promise<{
  filename: string;
  originalname: string;
  path: string;
  size: number;
}> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('vast_token') || localStorage.getItem('token')
    : null;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('originalname', file.name);

  const res = await fetch(`${BASE_URL}/ai/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data.data;
}

export interface PatentEvaluateSubmitParams {
  // 基础专利信息
  patentNo: string;          // 专利号
  patentName: string;        // 专利名称
  patentType: string;        // 专利类型：发明/实用新型/外观
  techField: string;         // 所属技术领域
  claimCount: number;        // 权利要求数量
  disclosureContent: string; // 交底书/技术方案详情

  // 市场维度信息
  marketScale: string;       // 目标市场规模
  applyScene: string;        // 实际应用场景
  competitorCount: number;   // 同类竞品专利数量
  commercialStage: string;   // 商业化阶段：研发/小试/量产/已落地

  // 法律维度信息
  legalStatus: string;       // 法律状态：有效/实质审查/失效
  remainYear: number;        // 剩余保护年限
  litigationHistory: string; // 有无诉讼/无效纠纷
  licensePlan: string;       // 许可/转让计划
}

/**
 * AI 返回的分项打分 + 评估报告
 */
export interface PatentEvaluateResult {
  // 四大维度单项分 0-100
  techScore: number;     // 技术价值分
  lawScore: number;      // 法律稳定分
  marketScore: number;   // 市场潜力分
  economyScore: number;  // 经济收益分
  totalScore: number;   // 综合总分

  // AI 文字分析
  techComment: string;    // 技术维度点评
  lawComment: string;     // 法律风险点评
  marketComment: string;  // 市场前景点评
  economyComment: string;// 经济价值点评
  generalConclusion: string; // 综合评估总结

  // 风险点清单
  riskList: Array<{
    riskType: string;
    level: "低" | "中" | "高";
    desc: string;
    suggest: string;
  }>;
}

/**
 * 提交专利信息，调用AI生成价值评估
 * POST /patent-evaluate/create
 */
export async function submitPatentEvaluate(
    data: PatentEvaluateSubmitParams
): Promise<PatentEvaluateResult> {
  return request<PatentEvaluateResult>("/patent-evaluate/create", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * 可选：查询历史评估记录列表（分页）
 * GET /patent-evaluate/list
 */
export interface PatentEvaluateRecordItem {
  id: number;
  patentNo: string;
  patentName: string;
  totalScore: number;
  createTime: string;
  submitUser: string;
}

export async function getPatentEvaluateRecords(params?: {
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedData<PatentEvaluateRecordItem>> {
  const search = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) search.set(k, String(v));
    });
  }
  return request<PaginatedData<PatentEvaluateRecordItem>>(`/patent-evaluate/list?${search}`);
}

/**
 * 可选：单条评估详情回查
 * GET /patent-evaluate/:id
 */
export async function getPatentEvaluateDetail(id: number): Promise<PatentEvaluateResult> {
  return request<PatentEvaluateResult>(`/patent-evaluate/${id}`);
}

// ========== 权利要求书模板 API ==========
export interface ClaimsTemplateItem {
  id: number;
  name: string;
  type: string;
  description: string;
  independent_claim: string;
  dependent_claims: string;
  create_time: string;
  update_time: string;
}

export async function getClaimsTemplates(): Promise<ClaimsTemplateItem[]> {
  return request<ClaimsTemplateItem[]>('/claims-templates');
}

export async function getClaimsTemplateDetail(id: number): Promise<ClaimsTemplateItem> {
  return request<ClaimsTemplateItem>(`/claims-templates/${id}`);
}

// ========== 交底书模板 API ==========
export interface DisclosureTemplateItem {
  id: number;
  name: string;
  type: string;
  description: string;
  sections: Array<{ name: string; required: boolean; description: string; example: string }>;
  create_time: string;
  update_time: string;
}

export async function getDisclosureTemplates(): Promise<DisclosureTemplateItem[]> {
  return request<DisclosureTemplateItem[]>('/disclosure-templates');
}

export async function getDisclosureTemplateDetail(id: number): Promise<DisclosureTemplateItem> {
  return request<DisclosureTemplateItem>(`/disclosure-templates/${id}`);
}

// ========== 交案前检查 API ==========
export interface PreSubmitCheckSection {
  status: string;
  score: number;
  items: Array<{ name: string; status: string; detail: string }>;
}

export interface PreSubmitCheckResult {
  overallStatus: 'pass' | 'fail';
  totalScore: number;
  formalCheck: PreSubmitCheckSection;
  completenessCheck: PreSubmitCheckSection;
  consistencyCheck: PreSubmitCheckSection;
  summary: string;
}

export async function aiPreSubmitCheck(data: {
  caseId?: string;
  disclosureContent?: string;
  specContent?: string;
  claimsContent?: string;
  fiveBooksContent?: string;
}): Promise<PreSubmitCheckResult> {
  return request<PreSubmitCheckResult>('/ai/pre-submit-check', { method: 'POST', body: JSON.stringify(data) });
}

// ========== AI生成附图 API ==========
export interface DrawingGenerationResult {
  drawingSuggestion: string;
  figureNumber: string;
  keyElements: string[];
}

export async function aiGenerateDrawing(data: {
  caseId?: string;
  specContent: string;
}): Promise<DrawingGenerationResult> {
  return request<DrawingGenerationResult>('/ai/generate-drawing', { method: 'POST', body: JSON.stringify(data) });
}
