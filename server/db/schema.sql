-- 创建数据库表结构

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  z_index INTEGER NOT NULL,
  default_asset_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 资产表
CREATE TABLE IF NOT EXISTS assets (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id VARCHAR(255) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  src TEXT NOT NULL, -- 存储图片的base64数据URL或URL
  file_path VARCHAR(500), -- 存储文件路径（如果使用文件系统）
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户创建的角色表（为未来扩展准备）
CREATE TABLE IF NOT EXISTS characters (
  id VARCHAR(255) PRIMARY KEY,
  character_state JSONB NOT NULL, -- 存储角色的状态 {categoryId: assetId}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_z_index ON categories(z_index);





