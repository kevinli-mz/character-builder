# Vercel 部署问题排查

## 网站空白问题

### 问题 1: 环境变量未配置

**症状**: 页面空白，控制台可能有错误

**解决**:
1. 进入 Vercel 项目设置
2. 点击 "Environment Variables"
3. 添加以下变量：
   ```
   VITE_SUPABASE_URL=https://spb-bp1ud8u47k09283b.supabase.opentrust.net
   VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi1icDF1ZDh1NDdrMDkyODNiIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Njc0NDQ2NjUsImV4cCI6MjA4MzAyMDY2NX0.dgzflsFmz9hASNrfBXDmcNrM9uz70InNusjTxAt8Qws
   ```
4. 确保选择 "Production", "Preview", "Development" 所有环境
5. 重新部署

### 问题 2: 构建配置错误

**检查**:
1. 进入 Vercel 项目设置 > General
2. 确认：
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 问题 3: 路由问题（SPA）

**解决**: `vercel.json` 应该已经配置了重写规则。如果没有，确保文件存在且内容正确。

### 问题 4: JavaScript 错误

**排查步骤**:
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签页的错误
3. 查看 Network 标签页，确认资源是否加载成功
4. 检查是否有 CORS 错误

### 问题 5: 检查部署日志

1. 在 Vercel Dashboard 中查看部署日志
2. 检查是否有构建错误
3. 查看 Runtime Logs

## 快速修复步骤

### 步骤 1: 检查环境变量

在 Vercel Dashboard:
- Settings > Environment Variables
- 确保 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 已设置

### 步骤 2: 重新部署

1. 在 Vercel Dashboard 中
2. 进入 Deployments
3. 点击最新部署的 "..." 菜单
4. 选择 "Redeploy"

### 步骤 3: 检查浏览器控制台

打开网站，按 F12，查看 Console 中的错误信息。

常见错误：
- `VITE_SUPABASE_URL is not defined` - 环境变量未配置
- `Failed to fetch` - Supabase 连接问题
- `Cannot read property` - 代码错误

### 步骤 4: 验证构建

本地测试构建：
```bash
npm run build
npm run preview
```

访问 `http://localhost:4173` 查看是否正常。

## 调试技巧

### 添加调试信息

在 `App.tsx` 开头添加：
```typescript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Environment:', import.meta.env.MODE);
```

### 检查网络请求

在浏览器 Network 标签页中：
1. 刷新页面
2. 查看是否有失败的请求
3. 检查 Supabase API 请求是否成功

## 常见错误和解决方案

### 错误: "Failed to load resource"
- 检查环境变量是否正确
- 检查 Supabase URL 是否可访问

### 错误: "CORS policy"
- 在 Supabase Dashboard 中配置允许的域名
- Settings > API > CORS

### 错误: "Module not found"
- 检查 `package.json` 依赖是否完整
- 运行 `npm install` 重新安装

## 联系支持

如果问题仍然存在：
1. 查看 Vercel 部署日志
2. 查看浏览器控制台错误
3. 检查 Supabase Dashboard 的日志

