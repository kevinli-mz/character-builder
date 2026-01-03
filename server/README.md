# Character Builder - 后端API

这是角色构建器应用的后端服务，使用 Node.js + Express + PostgreSQL 构建。

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp env.example .env
# 编辑 .env 文件，设置数据库连接等信息
```

### 3. 初始化数据库
```bash
npm run migrate
```

### 4. 启动服务
```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

## 📡 API 端点

### 获取数据
```
GET /api/data
```
返回所有分类和资产

### 保存数据（管理员）
```
POST /api/data
Headers: X-Admin-Password: <管理员密码>
Body: { categories: [...], assets: [...] }
```

### 上传资产（管理员）
```
POST /api/assets/upload
Headers: X-Admin-Password: <管理员密码>
Body: FormData { files: File[], categoryId: string }
```

### 保存角色
```
POST /api/characters
Body: { characterState: {...} }
```

### 获取角色
```
GET /api/characters/:id
```

## 🔒 安全说明

- 管理员操作需要 `X-Admin-Password` 请求头
- 生产环境请务必修改默认密码
- 建议使用 HTTPS

## 📁 项目结构

```
server/
├── db/
│   ├── config.js      # 数据库配置
│   └── schema.sql     # 数据库表结构
├── routes/
│   └── api.js         # API路由
├── scripts/
│   └── migrate.js     # 数据库迁移脚本
├── uploads/           # 上传文件存储目录（自动创建）
├── server.js          # 服务器入口
└── package.json
```

## 🛠️ 技术栈

- **Express**: Web框架
- **PostgreSQL**: 数据库
- **Multer**: 文件上传处理
- **CORS**: 跨域支持




