CREATE DATABASE `vast_patent_system` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
SELECT * FROM vast_patent_system.sys_case;CREATE TABLE `sys_case` (
  `case_id` varchar(32) NOT NULL COMMENT '案件唯一编号',
  `case_name` varchar(200) NOT NULL COMMENT '专利名称',
  `patent_type` enum('发明专利','实用新型','外观设计') NOT NULL COMMENT '专利类型',
  `tech_field` varchar(200) NOT NULL COMMENT '技术领域',
  `creator_name` varchar(50) NOT NULL COMMENT '创建人',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '立案时间',
  `case_status` enum('待交底','撰写中','待质检','已归档') DEFAULT '待交底' COMMENT '案件流程节点',
  `remark` text COMMENT '备注',
  PRIMARY KEY (`case_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='专利案件主表';
CREATE TABLE `sys_disclosure` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `case_id` varchar(32) NOT NULL COMMENT '关联案件编号',
  `source_content` text COMMENT '用户原始素材',
  `ai_generate_content` longtext COMMENT 'AI生成交底内容',
  `ai_suggest` text COMMENT 'AI创新思路',
  `finish_time` datetime DEFAULT NULL COMMENT '交底完成时间',
  PRIMARY KEY (`id`),
  KEY `case_id` (`case_id`),
  CONSTRAINT `sys_disclosure_ibfk_1` FOREIGN KEY (`case_id`) REFERENCES `sys_case` (`case_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='交底书信息表';
CREATE TABLE `sys_operation_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `case_id` varchar(32) NOT NULL,
  `opt_type` varchar(30) DEFAULT NULL COMMENT '操作：立案/交底/撰写/审核',
  `opt_user` varchar(50) DEFAULT NULL,
  `opt_content` text,
  `opt_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `case_id` (`case_id`),
  CONSTRAINT `sys_operation_log_ibfk_1` FOREIGN KEY (`case_id`) REFERENCES `sys_case` (`case_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='全流程操作日志';
CREATE TABLE `sys_quality_check` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `case_id` varchar(32) NOT NULL,
  `ai_advice` text COMMENT 'AI自动审核意见',
  `audit_content` text COMMENT '人工修改内容',
  `audit_result` enum('通过','驳回') DEFAULT '通过',
  `audit_user` varchar(50) DEFAULT NULL,
  `audit_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `case_id` (`case_id`),
  CONSTRAINT `sys_quality_check_ibfk_1` FOREIGN KEY (`case_id`) REFERENCES `sys_case` (`case_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='案件质检记录表';
CREATE TABLE `sys_writing` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `case_id` varchar(32) NOT NULL,
  `spec_content` longtext COMMENT '说明书正文',
  `claim_content` longtext COMMENT '权利要求书正文',
  `ai_check_rate` decimal(5,2) DEFAULT NULL COMMENT 'AI生成占比%',
  `ai_error_list` text COMMENT '查重异常点位',
  `write_finish` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `case_id` (`case_id`),
  CONSTRAINT `sys_writing_ibfk_1` FOREIGN KEY (`case_id`) REFERENCES `sys_case` (`case_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='专利撰写内容表';
