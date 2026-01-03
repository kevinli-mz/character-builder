# 🚀 快速开始指南

这是最简单的开始方式，适合第一次使用。

## 第一步：安装 PostgreSQL（如果还没有）

### macOS（使用 Homebrew）
```bash
brew install postgresql@14
brew services start postgresql@14
createdb character_builder
```

### 或使用 Docker（更简单）
```bash
docker run --name character-builder-db \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_DB=character_builder \
  -p 5432:5432 \
  -d postgres:14
```

## 第二步：安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

## 第三步：配置环境变量

### 后端配置
```bash
cd server
cp env.example .env
```

编辑 `server/.env`，修改数据库连接：
```env
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/character_builder
ADMIN_PASSWORD=admin
FRONTEND_URL=http://localhost:3000
```

### 前端配置（可选）
在项目根目录创建 `.env.local`：
```env
VITE_API_URL=http://localhost:3001/api
VITE_ADMIN_PASSWORD=admin
```

## 第四步：初始化数据库

```bash
cd server
npm run migrate
```

应该看到：`✅ 数据库迁移完成！`

## 第五步：启动服务

打开两个终端窗口：

**终端1 - 后端：**
```bash
cd server
npm run dev
```

**终端2 - 前端：**
```bash
npm run dev
```

## 第六步：测试

1. 打开浏览器访问 `http://localhost:3000`
2. 点击右上角 "Admin Access"
3. 输入密码：`admin`
4. 尝试上传一张图片
5. 检查是否成功！

## 🎉 完成！

如果一切正常，你现在可以：
- ✅ 上传资产到数据库
- ✅ 在前端使用这些资产
- ✅ 保存用户创建的角色

## 下一步

查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 了解如何部署到生产环境。




