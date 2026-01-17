# 部署指南 - Character Builder

本指南将帮助你从零开始部署角色构建器应用，包括本地测试和生产环境部署。

## 📋 目录

1. [本地测试](#本地测试)
2. [生产环境部署](#生产环境部署)
3. [域名配置](#域名配置)
4. [常见问题](#常见问题)

---

## 🧪 本地测试

### 第一步：安装依赖

#### 前端依赖
```bash
cd /Users/kevin/Github/character-builder
npm install
```

#### 后端依赖
```bash
cd server
npm install
```

### 第二步：设置本地数据库

你需要安装 PostgreSQL 数据库。有几种方式：

#### 方式1：使用 Homebrew（推荐，macOS）
```bash
# 安装 PostgreSQL
brew install postgresql@14

# 启动 PostgreSQL 服务
brew services start postgresql@14

# 创建数据库
createdb character_builder

# 创建用户（可选）
psql postgres
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE character_builder TO your_username;
\q
```

#### 方式2：使用 Docker（更简单）
```bash
# 运行 PostgreSQL 容器
docker run --name character-builder-db \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=character_builder \
  -p 5432:5432 \
  -d postgres:14
```

### 第三步：配置环境变量

#### 后端环境变量
```bash
cd server
cp env.example .env
```

编辑 `server/.env` 文件：
```env
# 数据库配置（根据你的设置修改）
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/character_builder

# 服务器配置
PORT=3001
NODE_ENV=development

# 管理员密码
ADMIN_PASSWORD=admin

# 前端URL
FRONTEND_URL=http://localhost:3000
```

#### 前端环境变量（可选）
创建 `.env.local` 文件：
```env
VITE_API_URL=http://localhost:3001/api
VITE_ADMIN_PASSWORD=admin
```

### 第四步：初始化数据库

```bash
cd server
npm run migrate
```

你应该看到：`✅ 数据库迁移完成！`

### 第五步：启动服务

#### 启动后端（终端1）
```bash
cd server
npm run dev
```

你应该看到：`🚀 服务器运行在 http://localhost:3001`

#### 启动前端（终端2）
```bash
npm run dev
```

你应该看到前端运行在 `http://localhost:3000`

### 第六步：测试功能

1. 打开浏览器访问 `http://localhost:3000`
2. 点击 "Admin Access" 进入管理面板
3. 输入密码 `admin` 登录
4. 尝试上传一些图片资产
5. 检查资产是否显示在资产库中
6. 返回主页面，检查资产是否可用

---

## 🚀 生产环境部署

我们推荐使用 **Railway** 或 **Render**，它们都提供简单的部署流程和免费的 PostgreSQL 数据库。

### 方案A：使用 Railway（推荐，$5/月）

Railway 提供：
- 免费 PostgreSQL 数据库
- 自动 HTTPS
- 简单部署流程
- 适合初学者

#### 步骤1：准备代码

确保你的代码已经推送到 GitHub：
```bash
git add .
git commit -m "Add backend API"
git push origin main
```

#### 步骤2：注册 Railway

1. 访问 [railway.app](https://railway.app)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 选择 "Deploy from GitHub repo"
5. 选择你的 `character-builder` 仓库

#### 步骤3：添加 PostgreSQL 数据库

1. 在 Railway 项目中，点击 "+ New"
2. 选择 "Database" → "Add PostgreSQL"
3. Railway 会自动创建数据库并设置 `DATABASE_URL` 环境变量

#### 步骤4：配置后端服务

1. 在 Railway 项目中，点击 "+ New" → "GitHub Repo"
2. 再次选择你的仓库
3. Railway 会自动检测到项目

**配置设置：**
- **Root Directory**: `server`
- **Start Command**: `npm start`
- **Watch Paths**: `server/**`

**环境变量设置：**
点击服务 → "Variables" → 添加以下变量：

```env
NODE_ENV=production
PORT=3001
ADMIN_PASSWORD=你的安全密码（不要用admin）
FRONTEND_URL=https://你的域名.com
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

（`DATABASE_URL` 会自动从 PostgreSQL 服务获取）

#### 步骤5：部署前端

**选项1：使用 Vercel（推荐，免费）**

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 登录
3. 点击 "New Project"
4. 导入你的仓库
5. 配置：
   - **Framework Preset**: Vite
   - **Root Directory**: `./`（根目录）
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. 添加环境变量：
   ```
   VITE_API_URL=https://你的railway后端地址.railway.app/api
   VITE_ADMIN_PASSWORD=你的管理员密码
   ```

7. 点击 "Deploy"

**选项2：使用 Railway（与后端一起）**

1. 在同一个 Railway 项目中，添加新服务
2. Root Directory: `./`（根目录）
3. Start Command: `npm run preview`（或使用 nginx）
4. 配置环境变量同上

#### 步骤6：获取后端URL

1. 在 Railway 后端服务页面
2. 点击 "Settings" → "Generate Domain"
3. 复制生成的 URL（例如：`your-app.up.railway.app`）
4. 更新前端环境变量中的 `VITE_API_URL`

---

### 方案B：使用 Render（备选）

Render 也提供类似的免费层和简单部署。

#### 步骤1：注册 Render

1. 访问 [render.com](https://render.com)
2. 使用 GitHub 登录

#### 步骤2：创建 PostgreSQL 数据库

1. 点击 "New" → "PostgreSQL"
2. 设置名称：`character-builder-db`
3. 选择免费计划
4. 复制 "Internal Database URL"

#### 步骤3：部署后端

1. 点击 "New" → "Web Service"
2. 连接你的 GitHub 仓库
3. 配置：
   - **Name**: `character-builder-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. 环境变量：
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=你的PostgreSQL内部URL
   ADMIN_PASSWORD=你的安全密码
   FRONTEND_URL=https://你的域名.com
   ```

5. 点击 "Create Web Service"

#### 步骤4：初始化数据库

1. 在 Render 后端服务中，打开 "Shell"
2. 运行：
   ```bash
   cd server
   npm run migrate
   ```

#### 步骤5：部署前端

使用 Vercel（同方案A的步骤5）

---

## 🌐 域名配置

### 在 Railway 配置自定义域名

1. 在 Railway 后端服务 → "Settings" → "Domains"
2. 点击 "Custom Domain"
3. 输入你的域名（例如：`api.yourdomain.com`）
4. Railway 会提供 DNS 记录，添加到你的域名服务商

### 在阿里云配置DNS

1. 登录阿里云控制台
2. 进入 "域名" → "解析设置"
3. 添加记录：

**后端API子域名：**
- **记录类型**: CNAME
- **主机记录**: `api`（或你想要的子域名）
- **记录值**: `你的railway地址.up.railway.app`
- **TTL**: 600

**前端主域名：**
- **记录类型**: CNAME（如果使用Vercel）
- **主机记录**: `@`（表示主域名）
- **记录值**: `cname.vercel-dns.com`（Vercel会提供具体值）

### 更新环境变量

部署后，更新环境变量：
- 后端 `FRONTEND_URL`: `https://yourdomain.com`
- 前端 `VITE_API_URL`: `https://api.yourdomain.com/api`

---

## 🔧 常见问题

### Q1: 数据库连接失败

**检查：**
1. `DATABASE_URL` 格式是否正确
2. 数据库是否正在运行
3. 防火墙是否允许连接

**解决：**
```bash
# 测试数据库连接
psql $DATABASE_URL
```

### Q2: 上传文件失败

**检查：**
1. `ADMIN_PASSWORD` 是否正确
2. 文件大小是否超过 5MB
3. 文件格式是否为图片（PNG, JPG, SVG, GIF）

### Q3: CORS 错误

**解决：**
确保后端 `.env` 中的 `FRONTEND_URL` 设置正确，包括协议（http/https）

### Q4: 前端无法连接后端

**检查：**
1. 后端服务是否正在运行
2. `VITE_API_URL` 环境变量是否正确
3. 重新构建前端（环境变量变更需要重新构建）

### Q5: 数据库迁移失败

**解决：**
```bash
# 手动执行SQL
psql $DATABASE_URL -f server/db/schema.sql
```

---

## 📝 维护建议

### 定期备份数据库

Railway 和 Render 都提供自动备份，但建议：
1. 定期导出数据：`pg_dump $DATABASE_URL > backup.sql`
2. 存储到云存储（如阿里云OSS）

### 监控日志

- Railway: 在服务页面查看 "Logs"
- Render: 在服务页面查看 "Logs"

### 更新代码

1. 本地测试更改
2. 推送到 GitHub
3. Railway/Render 会自动重新部署

---

## 🎉 完成！

部署完成后，你的应用应该：
- ✅ 前端可以通过域名访问
- ✅ 后端API正常工作
- ✅ 管理员可以上传资产
- ✅ 用户可以创建角色

如有问题，请检查日志或联系我！





