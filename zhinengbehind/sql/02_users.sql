-- 用户表 (auth)
CREATE TABLE IF NOT EXISTS sys_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(200) NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    role VARCHAR(30) DEFAULT 'engineer',
    status TINYINT DEFAULT 1,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

-- 默认管理员 (密码: admin123)
INSERT INTO sys_user (username, password_hash, display_name, role) VALUES
('admin', '$2a$10$xVqYLGEMC1JmKqiYKeMqEOLfXwGjqGq.4Z0ZG6XuWkPqLJgGmQr5m', '管理员', 'admin'),
('engineer1', '$2a$10$xVqYLGEMC1JmKqiYKeMqEOLfXwGjqGq.4Z0ZG6XuWkPqLJgGmQr5m', '张明', 'engineer'),
('reviewer1', '$2a$10$xVqYLGEMC1JmKqiYKeMqEOLfXwGjqGq.4Z0ZG6XuWkPqLJgGmQr5m', '李质检', 'reviewer');
