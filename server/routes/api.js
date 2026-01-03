import express from 'express';
import multer from 'multer';
import { pool } from '../db/config.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置文件上传（存储到 uploads 目录）
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB限制
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|svg|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件 (JPEG, PNG, SVG, GIF)'));
    }
  }
});

// 将文件转换为base64数据URL
function fileToDataURL(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = fileBuffer.toString('base64');
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
  return `data:${mimeType};base64,${base64}`;
}

// 获取所有数据（分类和资产）
router.get('/data', async (req, res) => {
  try {
    // 获取所有分类
    const categoriesResult = await pool.query(
      'SELECT id, name, z_index as "zIndex", default_asset_id as "defaultAssetId" FROM categories ORDER BY z_index'
    );
    
    // 获取所有资产
    const assetsResult = await pool.query(
      'SELECT id, name, category_id as "categoryId", src FROM assets ORDER BY created_at'
    );
    
    res.json({
      categories: categoriesResult.rows,
      assets: assetsResult.rows
    });
  } catch (error) {
    console.error('获取数据错误:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
});

// 更新数据（管理员功能）
router.post('/data', async (req, res) => {
  try {
    const { categories, assets } = req.body;
    
    // 验证管理员密码
    const adminPassword = req.headers['x-admin-password'];
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: '未授权访问' });
    }
    
    // 开始事务
    await pool.query('BEGIN');
    
    try {
      // 清空现有数据
      await pool.query('DELETE FROM assets');
      await pool.query('DELETE FROM categories');
      
      // 插入分类
      if (categories && categories.length > 0) {
        for (const cat of categories) {
          await pool.query(
            'INSERT INTO categories (id, name, z_index, default_asset_id) VALUES ($1, $2, $3, $4)',
            [cat.id, cat.name, cat.zIndex, cat.defaultAssetId || null]
          );
        }
      }
      
      // 插入资产
      if (assets && assets.length > 0) {
        for (const asset of assets) {
          await pool.query(
            'INSERT INTO assets (id, name, category_id, src) VALUES ($1, $2, $3, $4)',
            [asset.id, asset.name, asset.categoryId, asset.src]
          );
        }
      }
      
      await pool.query('COMMIT');
      res.json({ success: true, message: '数据更新成功' });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('更新数据错误:', error);
    res.status(500).json({ error: '更新数据失败' });
  }
});

// 上传资产（管理员功能）
router.post('/assets/upload', upload.array('files', 10), async (req, res) => {
  try {
    // 验证管理员密码
    const adminPassword = req.headers['x-admin-password'];
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: '未授权访问' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    const { categoryId } = req.body;
    if (!categoryId) {
      return res.status(400).json({ error: '缺少分类ID' });
    }
    
    const uploadedAssets = [];
    
    for (const file of req.files) {
      // 转换为base64数据URL
      const dataURL = fileToDataURL(file.path);
      
      // 生成唯一ID
      const assetId = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const assetName = path.parse(file.originalname).name;
      
      // 保存到数据库
      const result = await pool.query(
        'INSERT INTO assets (id, name, category_id, src, file_path) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, category_id as "categoryId", src',
        [assetId, assetName, categoryId, dataURL, file.path]
      );
      
      uploadedAssets.push(result.rows[0]);
    }
    
    res.json({ 
      success: true, 
      message: `成功上传 ${uploadedAssets.length} 个资产`,
      assets: uploadedAssets 
    });
  } catch (error) {
    console.error('上传资产错误:', error);
    res.status(500).json({ error: '上传失败: ' + error.message });
  }
});

// 保存用户创建的角色
router.post('/characters', async (req, res) => {
  try {
    const { characterState } = req.body;
    
    if (!characterState || typeof characterState !== 'object') {
      return res.status(400).json({ error: '无效的角色状态' });
    }
    
    const characterId = `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await pool.query(
      'INSERT INTO characters (id, character_state) VALUES ($1, $2)',
      [characterId, JSON.stringify(characterState)]
    );
    
    res.json({ 
      success: true, 
      characterId,
      message: '角色保存成功' 
    });
  } catch (error) {
    console.error('保存角色错误:', error);
    res.status(500).json({ error: '保存角色失败' });
  }
});

// 获取保存的角色
router.get('/characters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT character_state FROM characters WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '角色不存在' });
    }
    
    res.json({ 
      characterState: result.rows[0].character_state 
    });
  } catch (error) {
    console.error('获取角色错误:', error);
    res.status(500).json({ error: '获取角色失败' });
  }
});

export default router;




