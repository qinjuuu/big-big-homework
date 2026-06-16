import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function initDatabase() {
  // 首先连接到 MySQL 服务器（不指定数据库）
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    multipleStatements: true,
  });

  try {
    // 创建数据库（如果不存在）
    const dbName = process.env.DB_NAME || 'vast_patent_system';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Database '${dbName}' created or already exists.`);
    
    // 切换到目标数据库
    await connection.query(`USE \`${dbName}\``);
    
    // 读取并执行 SQL 脚本
    const sql = fs.readFileSync(
      path.resolve(__dirname, '../../sql/01_extended_schema.sql'),
      'utf-8'
    );

    await connection.query(sql);
    console.log('Database tables and data initialized successfully.');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

initDatabase().catch((err) => {
  console.error('Database init failed:', err);
  process.exit(1);
});
