# 修复 Vercel 空白页面

## 最可能的原因：环境变量未配置

### 立即修复步骤

1. **进入 Vercel Dashboard**
   - 访问 https://vercel.com
   - 登录并选择你的项目

2. **配置环境变量**
   - 点击项目设置（Settings）
   - 点击左侧菜单的 "Environment Variables"
   - 添加以下两个变量：

   **变量 1:**
   ```
   Name: VITE_SUPABASE_URL
   Value: https://spb-bp1ud8u47k09283b.supabase.opentrust.net
   Environment: Production, Preview, Development (全选)
   ```

   **变量 2:**
   ```
   Name: VITE_SUPABASE_ANON_KEY
   Value: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi1icDF1ZDh1NDdrMDkyODNiIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Njc0NDQ2NjUsImV4cCI6MjA4MzAyMDY2NX0.dgzflsFmz9hASNrfBXDmcNrM9uz70InNusjTxAt8Qws
   Environment: Production, Preview, Development (全选)
   ```

3. **重新部署**
   - 进入 "Deployments" 标签页
   - 点击最新部署右侧的 "..." 菜单
   - 选择 "Redeploy"
   - 或推送新的代码到 GitHub 触发自动部署

## 验证步骤

### 1. 检查环境变量是否生效

部署后，在浏览器中：
1. 打开你的网站
2. 按 F12 打开开发者工具
3. 在 Console 中输入：
   ```javascript
   console.log(import.meta.env.VITE_SUPABASE_URL)
   ```
4. 应该显示你的 Supabase URL，而不是 `undefined`

### 2. 检查控制台错误

在浏览器 Console 中查看是否有错误：
- 红色错误信息
- 网络请求失败
- Supabase 连接错误

### 3. 检查网络请求

在 Network 标签页中：
1. 刷新页面
2. 查看是否有失败的请求（红色）
3. 检查 JavaScript 文件是否成功加载

## 其他可能的问题

### 问题 2: 构建配置

在 Vercel 项目设置 > General 中确认：
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 问题 3: vercel.json 配置

确保项目根目录有 `vercel.json` 文件，内容应该包含路由重写规则。

### 问题 4: 检查部署日志

1. 在 Vercel Dashboard 中
2. 进入 "Deployments"
3. 点击最新的部署
4. 查看 "Build Logs" 和 "Function Logs"
5. 检查是否有错误信息

## 快速测试

### 本地测试构建

```bash
# 设置环境变量
export VITE_SUPABASE_URL=https://spb-bp1ud8u47k09283b.supabase.opentrust.net
export VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi1icDF1ZDh1NDdrMDkyODNiIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Njc0NDQ2NjUsImV4cCI6MjA4MzAyMDY2NX0.dgzflsFmz9hASNrfBXDmcNrM9uz70InNusjTxAt8Qws

# 构建
npm run build

# 预览
npm run preview
```

访问 `http://localhost:4173` 查看是否正常。

## 如果仍然空白

### 添加调试代码

在 `App.tsx` 文件开头添加：

```typescript
console.log('=== Debug Info ===');
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Has URL:', !!import.meta.env.VITE_SUPABASE_URL);
console.log('Environment:', import.meta.env.MODE);
```

然后重新部署，在浏览器控制台查看输出。

### 检查 Supabase 连接

在浏览器控制台运行：
```javascript
// 检查 Supabase 是否可访问
fetch('https://spb-bp1ud8u47k09283b.supabase.opentrust.net/rest/v1/', {
  headers: {
    'apikey': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi1icDF1ZDh1NDdrMDkyODNiIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Njc0NDQ2NjUsImV4cCI6MjA4MzAyMDY2NX0.dgzflsFmz9hASNrfBXDmcNrM9uz70InNusjTxAt8Qws'
  }
}).then(r => console.log('Supabase accessible:', r.ok))
```

## 联系支持

如果以上步骤都无法解决：
1. 截图浏览器控制台的错误信息
2. 截图 Vercel 部署日志
3. 告诉我具体的错误信息

