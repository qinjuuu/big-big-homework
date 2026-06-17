-- VAST 8.0 扩展数据库 schema
-- 在原 5 表基础上扩展字段以支撑 M05-M10 全流程
-- 注意：此脚本假设数据库 vast_patent_system 已经存在
-- 注意：此脚本已调整为兼容 Db2SqlService 的标准 SQL 语法
-- 注意：执行前请确保相关表不存在，或手动删除现有表

-- ========== 案件主表 (扩展 M05 字段) ==========

CREATE TABLE sys_case (
    case_id VARCHAR(32) PRIMARY KEY,
    case_name VARCHAR(200) NOT NULL,
    patent_type VARCHAR(30) NOT NULL,
    tech_field VARCHAR(100),
    creator_name VARCHAR(50) NOT NULL,
    case_status VARCHAR(30) NOT NULL DEFAULT '待交底',
    client_name VARCHAR(100),
    contact_person VARCHAR(50),
    sales_person VARCHAR(50),
    service_rep VARCHAR(50),
    engineer VARCHAR(50),
    priority VARCHAR(10) DEFAULT 'normal',
    m05_status VARCHAR(30) DEFAULT 'assigning',
    source_type VARCHAR(20) DEFAULT 'filed',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== 交底信息表 (扩展 M06 字段) ==========
CREATE TABLE sys_disclosure (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(32) NOT NULL,
    source_content TEXT,
    ai_generate_content TEXT,
    ai_suggest TEXT,
    m06_stage VARCHAR(30) DEFAULT 'DECOMPOSITION',
    m06_status VARCHAR(20) DEFAULT 'IN_PROGRESS',
    risk_level VARCHAR(10) DEFAULT 'LOW',
    quality_score DECIMAL(5,2),
    innovation_ideas TEXT,
    source_files JSON,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finish_time TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES sys_case(case_id) ON DELETE CASCADE
);

-- ========== 撰写内容表 ==========
CREATE TABLE sys_writing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(32) NOT NULL,
    spec_content LONGTEXT,
    claim_content LONGTEXT,
    five_books_content LONGTEXT,
    repeat_check_info TEXT,
    ai_check_rate DECIMAL(5,2),
    m07_status VARCHAR(30) DEFAULT 'drafting',
    write_user VARCHAR(50),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    write_finish TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES sys_case(case_id) ON DELETE CASCADE
);

-- ========== 质检记录表 ==========
CREATE TABLE sys_quality_check (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(32) NOT NULL,
    audit_result VARCHAR(50),
    audit_remark TEXT,
    ai_advice TEXT,
    audit_user VARCHAR(50),
    m08_status VARCHAR(30) DEFAULT 'pending',
    audit_time TIMESTAMP,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES sys_case(case_id) ON DELETE CASCADE
);

-- ========== 操作日志表 ==========
CREATE TABLE sys_operation_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(32) NOT NULL,
    opt_type VARCHAR(30) NOT NULL,
    opt_user VARCHAR(50) NOT NULL,
    opt_content TEXT,
    opt_module VARCHAR(10),
    opt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES sys_case(case_id) ON DELETE CASCADE
);

-- ========== 撰写版本记录表 (M07 协同编辑支持) ==========
CREATE TABLE sys_writing_version (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(32) NOT NULL,
    version_no INT NOT NULL,
    content_snapshot LONGTEXT,
    editor_name VARCHAR(50),
    edit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES sys_case(case_id) ON DELETE CASCADE
);

-- ========== AI 检测与学习日志表 ==========
CREATE TABLE sys_ai_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(32) NOT NULL,
    module_type VARCHAR(20),
    ai_action VARCHAR(50),
    input_data TEXT,
    output_data TEXT,
    human_feedback TEXT,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES sys_case(case_id) ON DELETE CASCADE
);

-- ========== 演示数据 ==========
INSERT INTO sys_case (case_id, case_name, patent_type, tech_field, creator_name, case_status, client_name, contact_person, sales_person, service_rep, engineer, priority, m05_status, source_type) VALUES
('CASE001', '智能温控变频控制系统', '实用新型', '智能家居', '张明', '待交底', '华为技术有限公司', '张经理', '刘销售', '陈客服', '张工', 'high', 'assigning', 'presale');

INSERT INTO sys_case (case_id, case_name, patent_type, tech_field, creator_name, case_status, client_name, contact_person, sales_person, service_rep, engineer, priority, m05_status, source_type) VALUES
('CASE002', '工业缺陷AI视觉检测算法', '发明专利', '人工智能', '李四', '撰写中', '腾讯科技', '李总监', '王销售', '李客服', '李工', 'high', 'completed', 'filed');

INSERT INTO sys_case (case_id, case_name, patent_type, tech_field, creator_name, case_status, client_name, contact_person, sales_person, service_rep, engineer, priority, m05_status, source_type) VALUES
('CASE003', '新型环保塑料模具', '实用新型', '机械加工', '王五', '待质检', '阿里巴巴', '王主管', '张销售', '赵客服', '王工', 'normal', 'completed', 'filed');

INSERT INTO sys_case (case_id, case_name, patent_type, tech_field, creator_name, case_status, client_name, contact_person, sales_person, service_rep, engineer, priority, m05_status, source_type) VALUES
('CASE004', '推荐算法优化方案', '发明专利', '人工智能', '张明', '待交底', '字节跳动', '赵经理', '陈销售', '刘客服', NULL, 'normal', 'searching', 'presale');

INSERT INTO sys_case (case_id, case_name, patent_type, tech_field, creator_name, case_status, client_name, contact_person, sales_person, service_rep, engineer, priority, m05_status, source_type) VALUES
('CASE005', '智能家居产品外观', '外观设计', '工业设计', '李四', '待交底', '小米科技', '陈总', '李销售', '陈客服', NULL, 'high', 'assigning', 'presale');

INSERT INTO sys_case (case_id, case_name, patent_type, tech_field, creator_name, case_status, client_name, contact_person, sales_person, service_rep, engineer, priority, m05_status, source_type) VALUES
('CASE006', '无人配送技术方案', '发明专利', '无人驾驶', '王五', '已归档', '京东集团', '刘经理', '赵销售', '王客服', '刘工', 'low', 'rejected', 'presale');

INSERT INTO sys_disclosure (case_id, source_content, ai_generate_content, ai_suggest, m06_stage, m06_status, risk_level, quality_score, innovation_ideas, source_files) VALUES
('CASE001', '原始硬件原理图、温控参数文档', '1.硬件构成：温度传感器+主控芯片；2.温控逻辑：分段变频控温；3.散热结构', '1.优化传感器排布减少测温误差；2.增加低温自锁保护', 'AI_PRE_CHECK', 'IN_PROGRESS', 'HIGH', 72.50, NULL, NULL);

INSERT INTO sys_disclosure (case_id, source_content, ai_generate_content, ai_suggest, m06_stage, m06_status, risk_level, quality_score, innovation_ideas, source_files) VALUES
('CASE002', '机器视觉原始需求文档', '1.图像采集模块；2.缺陷识别算法；3.自动标记输出', '可接入工业相机实时数据流优化识别速度', 'SECOND_SEARCH', 'BLOCKED', 'HIGH', NULL, NULL, NULL);

INSERT INTO sys_disclosure (case_id, source_content, ai_generate_content, ai_suggest, m06_stage, m06_status, risk_level, quality_score, innovation_ideas, source_files) VALUES
('CASE003', '模具设计原始方案文档', '模具型腔采用新型耐高温改性塑料一体注塑成型...', NULL, 'VALIDATE', 'IN_PROGRESS', 'LOW', 88.00, NULL, NULL);

INSERT INTO sys_writing (case_id, spec_content, claim_content, repeat_check_info, ai_check_rate, m07_status, write_user) VALUES
('CASE002', '本发明涉及工业视觉检测技术，通过卷积神经网络识别工件表面缺陷...', '1.一种AI视觉缺陷检测装置，其特征在于...', '全网重复率12.3%，符合申报标准', 65.50, 'drafting', '李四');

INSERT INTO sys_writing (case_id, spec_content, claim_content, repeat_check_info, ai_check_rate, m07_status, write_user) VALUES
('CASE003', '模具型腔采用新型耐高温改性塑料一体注塑成型...', '1.一种环保塑料模具，包括模体与冷却流道...', '重复率8.7%', 42.00, 'reviewing', '王五');

INSERT INTO sys_quality_check (case_id, audit_result, audit_remark, ai_advice, audit_user, m08_status, audit_time) VALUES
('CASE003', '驳回修改', '权利要求书范围描述模糊，需要精简优化', '权利要求1的保护范围过宽，建议增加限定特征', '赵质检', 'reviewed', '2025-12-15 14:22:10');

INSERT INTO sys_operation_log (case_id, opt_type, opt_user, opt_content, opt_module) VALUES
('CASE001', '立案', '张明', '新建智能温控系统案件，录入基础信息', 'M05');

INSERT INTO sys_operation_log (case_id, opt_type, opt_user, opt_content, opt_module) VALUES
('CASE001', '交底', '系统', 'AI自动生成交底书结构化内容', 'M06');

INSERT INTO sys_operation_log (case_id, opt_type, opt_user, opt_content, opt_module) VALUES
('CASE002', '立案', '李四', '创建AI视觉检测发明专利项目', 'M05');

INSERT INTO sys_operation_log (case_id, opt_type, opt_user, opt_content, opt_module) VALUES
('CASE002', '交底', '李四', '完成交底书撰写并提交M07创作', 'M06');

INSERT INTO sys_operation_log (case_id, opt_type, opt_user, opt_content, opt_module) VALUES
('CASE002', '撰写', '李四', '开始撰写说明书和权利要求书', 'M07');

INSERT INTO sys_operation_log (case_id, opt_type, opt_user, opt_content, opt_module) VALUES
('CASE003', '立案', '王五', '新建环保模具案件，完成初稿撰写提交质检', 'M05');

INSERT INTO sys_operation_log (case_id, opt_type, opt_user, opt_content, opt_module) VALUES
('CASE003', '交底', '王五', '完成交底书引擎全部流程', 'M06');

INSERT INTO sys_operation_log (case_id, opt_type, opt_user, opt_content, opt_module) VALUES
('CASE003', '撰写', '王五', '完成说明书和权利要求书撰写', 'M07');

INSERT INTO sys_operation_log (case_id, opt_type, opt_user, opt_content, opt_module) VALUES
('CASE003', '质检', '赵质检', '审核不通过，权利要求书需修改', 'M08');