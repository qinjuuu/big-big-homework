--首页统计
SELECT COUNT(*) FROM sys_case WHERE case_status='待交底';
SELECT COUNT(*) FROM sys_case WHERE case_status='撰写中';
SELECT COUNT(*) FROM sys_case WHERE case_status='待质检';
SELECT COUNT(*) FROM sys_case WHERE case_status='已归档';
--案件列表
SELECT * FROM sys_case ORDER BY create_time DESC;
--详情联查
SELECT a.*,b.ai_generate_content,c.spec_content,d.audit_result
FROM sys_case a
LEFT JOIN sys_disclosure b ON a.case_id=b.case_id
LEFT JOIN sys_writing c ON a.case_id=c.case_id
LEFT JOIN sys_quality_check d ON a.case_id=d.case_id
WHERE a.case_id='CASE001';