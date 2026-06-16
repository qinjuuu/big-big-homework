// VAST 8.0 API 服务层
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
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

export async function updateCaseStatus(id: string, case_status?: string, m05_status?: string, opt_user?: string): Promise<void> {
  return request(`/cases/${id}/status`, { method: 'PUT', body: JSON.stringify({ case_status, m05_status, opt_user }) });
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

export async function getDisclosureDetail(id: number): Promise<DisclosureItem> {
  return request<DisclosureItem>(`/disclosures/${id}`);
}

export async function createDisclosure(data: { case_id: string; source_content?: string }): Promise<void> {
  return request('/disclosures', { method: 'POST', body: JSON.stringify(data) });
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

export async function getWritingDetail(id: number): Promise<WritingItem> {
  return request<WritingItem>(`/writings/${id}`);
}

export async function updateWriting(id: number, data: Partial<WritingItem>): Promise<void> {
  return request(`/writings/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

// ========== 审核 API ==========
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

export async function getReviewDetail(id: number): Promise<ReviewItem> {
  return request<ReviewItem>(`/reviews/${id}`);
}

export async function updateReview(id: number, data: Partial<ReviewItem>): Promise<void> {
  return request(`/reviews/${id}`, { method: 'PUT', body: JSON.stringify(data) });
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
  return json.data;
}
