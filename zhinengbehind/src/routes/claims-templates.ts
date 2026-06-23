import { Router } from 'express';
import pool from '../db/connection';

export const claimsTemplateRouter = Router();

// 获取权利要求书模板列表
claimsTemplateRouter.get('/', async (req, res) => {
  try {
    const { patent_type, tech_field, template_type } = req.query;
    let sql = 'SELECT id, template_name, patent_type, tech_field, template_type, create_time, update_time FROM sys_claims_template WHERE 1=1';
    const params: any[] = [];
    
    if (patent_type) {
      sql += ' AND patent_type = ?';
      params.push(patent_type);
    }
    if (tech_field) {
      sql += ' AND tech_field = ?';
      params.push(tech_field);
    }
    if (template_type) {
      sql += ' AND template_type = ?';
      params.push(template_type);
    }
    
    sql += ' ORDER BY update_time DESC';
    
    const [rows] = await pool.query(sql, params);
    res.json({ code: 0, data: rows });
  } catch (err: any) {
    console.error('Get claims templates error:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// 获取单个模板详情
claimsTemplateRouter.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM sys_claims_template WHERE id = ?',
      [req.params.id]
    );
    const template = (rows as any[])[0];
    if (!template) {
      return res.status(404).json({ code: -1, message: '模板不存在' });
    }
    // 解析JSON字段
    if (template.dependent_claim_templates) {
      template.dependent_claim_templates = JSON.parse(template.dependent_claim_templates);
    }
    res.json({ code: 0, data: template });
  } catch (err: any) {
    console.error('Get claims template detail error:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// 创建模板
claimsTemplateRouter.post('/', async (req, res) => {
  try {
    const {
      template_name, patent_type, tech_field, template_type,
      independent_claim_template, dependent_claim_templates,
      preamble_template, character_part_template,
      example_claims, usage_guide
    } = req.body;
    
    const [result] = await pool.query(
      `INSERT INTO sys_claims_template 
       (template_name, patent_type, tech_field, template_type, 
        independent_claim_template, dependent_claim_templates, 
        preamble_template, character_part_template, 
        example_claims, usage_guide, create_user) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        template_name, patent_type, tech_field, template_type,
        independent_claim_template, 
        dependent_claim_templates ? JSON.stringify(dependent_claim_templates) : null,
        preamble_template, character_part_template,
        example_claims, usage_guide, req.body.create_user || 'system'
      ]
    );
    
    res.json({ code: 0, data: { id: (result as any).insertId } });
  } catch (err: any) {
    console.error('Create claims template error:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// 更新模板
claimsTemplateRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (updates.dependent_claim_templates) {
      updates.dependent_claim_templates = JSON.stringify(updates.dependent_claim_templates);
    }
    
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'create_time');
    const values = fields.map(f => updates[f]);
    
    if (fields.length === 0) {
      return res.json({ code: 0, message: '无更新内容' });
    }
    
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    await pool.query(
      `UPDATE sys_claims_template SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    
    res.json({ code: 0, message: '更新成功' });
  } catch (err: any) {
    console.error('Update claims template error:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// 删除模板
claimsTemplateRouter.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM sys_claims_template WHERE id = ?', [req.params.id]);
    res.json({ code: 0, message: '删除成功' });
  } catch (err: any) {
    console.error('Delete claims template error:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// 应用模板生成权利要求书
claimsTemplateRouter.post('/apply', async (req, res) => {
  try {
    const { template_id, params } = req.body;
    
    const [rows] = await pool.query(
      'SELECT * FROM sys_claims_template WHERE id = ?',
      [template_id]
    );
    const template = (rows as any[])[0];
    if (!template) {
      return res.status(404).json({ code: -1, message: '模板不存在' });
    }
    
    // 解析模板参数
    let independent = template.independent_claim_template;
    let dependents = template.dependent_claim_templates ? JSON.parse(template.dependent_claim_templates) : [];
    
    // 替换参数
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        const regex = new RegExp(`\\[${key}\\]`, 'g');
        independent = independent.replace(regex, String(value));
        dependents = dependents.map((d: string) => d.replace(regex, String(value)));
      });
    }
    
    res.json({
      code: 0,
      data: {
        independent_claim: independent,
        dependent_claims: dependents,
        template_id: template.id,
        template_name: template.template_name
      }
    });
  } catch (err: any) {
    console.error('Apply claims template error:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});
