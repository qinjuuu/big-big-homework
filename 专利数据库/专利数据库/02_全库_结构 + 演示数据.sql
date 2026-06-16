CREATE DATABASE IF NOT EXISTS vast_patent_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vast_patent_system;

DROP TABLE IF EXISTS sys_case;
CREATE TABLE sys_case(
    case_id VARCHAR(32) PRIMARY KEY COMMENT '案件编号，主键',
    case_name VARCHAR(200) NOT NULL COMMENT '专利名称',
    patent_type VARCHAR(30) NOT NULL COMMENT '专利类型：发明专利/实用新型/外观',
    tech_field VARCHAR(100) COMMENT '所属技术领域',
    creator_name VARCHAR(50) NOT NULL COMMENT '创建人',
    case_status VARCHAR(30) NOT NULL COMMENT '案件状态：待交底/撰写中/待质检/已归档',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='案件主信息表';

DROP TABLE IF EXISTS sys_disclosure;
CREATE TABLE sys_disclosure(
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键',
    case_id VARCHAR(32) NOT NULL COMMENT '关联案件ID',
    source_content TEXT COMMENT '原始交底文档',
    ai_generate_content TEXT COMMENT 'AI生成结构化交底内容',
    ai_suggest TEXT COMMENT 'AI优化建议',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(case_id) REFERENCES sys_case(case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='案件交底信息表';


DROP TABLE IF EXISTS sys_writing;
CREATE TABLE sys_writing(
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(32) NOT NULL,
    spec_content TEXT COMMENT '说明书全文',
    claim_content TEXT COMMENT '权利要求书',
    repeat_check_info TEXT COMMENT '查重结果',
    write_user VARCHAR(50) COMMENT '撰写人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(case_id) REFERENCES sys_case(case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='专利撰写内容表';

DROP TABLE IF EXISTS sys_quality_check;
CREATE TABLE sys_quality_check(
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(32) NOT NULL,
    audit_result VARCHAR(50) COMMENT '审核结果：通过/驳回修改',
    audit_remark TEXT COMMENT '质检备注',
    audit_user VARCHAR(50) COMMENT '质检人员',
    audit_time DATETIME DEFAULT NULL,
    FOREIGN KEY(case_id) REFERENCES sys_case(case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='案件质检记录表';

DROP TABLE IF EXISTS sys_operation_log;
CREATE TABLE sys_operation_log(
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(32) NOT NULL,
    opt_type VARCHAR(30) NOT NULL COMMENT '操作类型：立案/交底/撰写/质检/归档',
    opt_user VARCHAR(50) NOT NULL COMMENT '操作人',
    opt_content TEXT COMMENT '操作详情',
    opt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(case_id) REFERENCES sys_case(case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统操作日志表';

-- ========== 插入测试演示数据 ==========

INSERT INTO sys_case(case_id,case_name,patent_type,tech_field,creator_name,case_status) VALUES
('CASE001','智能温控变频控制系统','实用新型','智能家居','张明','待交底'),
('CASE002','工业缺陷AI视觉检测算法','发明专利','人工智能','李四','撰写中'),
('CASE003','新型环保塑料模具','实用新型','机械加工','王五','待质检');

INSERT INTO sys_disclosure(case_id,source_content,ai_generate_content,ai_suggest) VALUES
('CASE001','原始硬件原理图、温控参数文档','1.硬件构成：温度传感器+主控芯片；2.温控逻辑：分段变频控温；3.散热结构','1.优化传感器排布减少测温误差；2.增加低温自锁保护'),
('CASE002','机器视觉原始需求文档','1.图像采集模块；2.缺陷识别算法；3.自动标记输出','可接入工业相机实时数据流优化识别速度');

INSERT INTO sys_writing(case_id,spec_content,claim_content,repeat_check_info,write_user) VALUES
('CASE002','本发明涉及工业视觉检测技术，通过卷积神经网络识别工件表面缺陷...','1.一种AI视觉缺陷检测装置，其特征在于...','全网重复率12.3%，符合申报标准','李四'),
('CASE003','模具型腔采用新型耐高温改性塑料一体注塑成型...','1.一种环保塑料模具，包括模体与冷却流道...','重复率8.7%','王五');

INSERT INTO sys_quality_check(case_id,audit_result,audit_remark,audit_user,audit_time) VALUES
('CASE003','驳回修改','权利要求书范围描述模糊，需要精简优化','赵质检','2025-12-15 14:22:10');

INSERT INTO sys_operation_log(case_id,opt_type,opt_user,opt_content) VALUES
('CASE001','立案','张明','新建智能温控系统案件，录入基础信息'),
('CASE002','立案','李四','创建AI视觉检测发明专利项目'),
('CASE003','立案','王五','新建环保模具案件，完成初稿撰写提交质检');