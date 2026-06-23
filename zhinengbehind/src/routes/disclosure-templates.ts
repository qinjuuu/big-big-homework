import { Router } from 'express';
import pool from '../db/connection';

export const disclosureTemplateRouter = Router();

// 获取交底书模板列表
disclosureTemplateRouter.get('/', async (req, res) => {
  try {
    const { template_type, patent_type, tech_field } = req.query;
    let sql = 'SELECT id, template_name, template_type, patent_type, tech_field, create_time FROM sys_disclosure_template WHERE 1=1';
    const params: any[] = [];
    
    if (template_type) {
      sql += ' AND template_type = ?';
      params.push(template_type);
    }
    if (patent_type) {
      sql += ' AND patent_type = ?';
      params.push(patent_type);
    }
    if (tech_field) {
      sql += ' AND tech_field = ?';
      params.push(tech_field);
    }
    
    sql += ' ORDER BY template_type, create_time DESC';
    
    const [rows] = await pool.query(sql, params);
    res.json({ code: 0, data: rows });
  } catch (err: any) {
    console.error('Get disclosure templates error:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// 获取单个模板详情
disclosureTemplateRouter.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM sys_disclosure_template WHERE id = ?',
      [req.params.id]
    );
    const template = (rows as any[])[0];
    if (!template) {
      return res.status(404).json({ code: -1, message: '模板不存在' });
    }
    if (template.required_sections) {
      template.required_sections = JSON.parse(template.required_sections);
    }
    res.json({ code: 0, data: template });
  } catch (err: any) {
    console.error('Get disclosure template detail error:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// 创建模板
disclosureTemplateRouter.post('/', async (req, res) => {
  try {
    const {
      template_name, template_type, patent_type, tech_field,
      template_content, required_sections, example_content
    } = req.body;
    
    const [result] = await pool.query(
      `INSERT INTO sys_disclosure_template 
       (template_name, template_type, patent_type, tech_field, 
        template_content, required_sections, example_content, create_user) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        template_name, template_type, patent_type, tech_field,
        template_content,
        required_sections ? JSON.stringify(required_sections) : null,
        example_content, req.body.create_user || 'system'
      ]
    );
    
    res.json({ code: 0, data: { id: (result as any).insertId } });
  } catch (err: any) {
    console.error('Create disclosure template error:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// 更新模板
disclosureTemplateRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (updates.required_sections) {
      updates.required_sections = JSON.stringify(updates.required_sections);
    }
    
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'create_time');
    const values = fields.map(f => updates[f]);
    
    if (fields.length === 0) {
      return res.json({ code: 0, message: '无更新内容' });
    }
    
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    await pool.query(
      `UPDATE sys_disclosure_template SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    
    res.json({ code: 0, message: '更新成功' });
  } catch (err: any) {
    console.error('Update disclosure template error:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// 删除模板
disclosureTemplateRouter.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM sys_disclosure_template WHERE id = ?', [req.params.id]);
    res.json({ code: 0, message: '删除成功' });
  } catch (err: any) {
    console.error('Delete disclosure template error:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});

// 应用模板生成交底书内容
disclosureTemplateRouter.post('/apply', async (req, res) => {
  try {
    const { template_id, params } = req.body;
    
    const [rows] = await pool.query(
      'SELECT * FROM sys_disclosure_template WHERE id = ?',
      [template_id]
    );
    const template = (rows as any[])[0];
    if (!template) {
      return res.status(404).json({ code: -1, message: '模板不存在' });
    }
    
    let content = template.template_content;
    
    // 替换参数
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        const regex = new RegExp(`\\[${key}\\]`, 'g');
        content = content.replace(regex, String(value));
      });
    }
    
    res.json({
      code: 0,
      data: {
        content,
        template_id: template.id,
        template_name: template.template_name,
        required_sections: template.required_sections ? JSON.parse(template.required_sections) : []
      }
    });
  } catch (err: any) {
    console.error('Apply disclosure template error:', err);
    res.status(500).json({ code: -1, message: err.message });
  }
});
