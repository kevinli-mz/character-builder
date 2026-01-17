# GitHub Actions 部署配置指南

## 问题
GitHub Actions workflow 需要以下 secrets 才能部署到 Vercel：
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 获取 Vercel 凭证

### 1. 获取 Vercel Token
1. 访问 [Vercel Account Settings](https://vercel.com/account/tokens)
2. 点击 "Create Token"
3. 输入名称（如 "GitHub Actions"）
4. 选择过期时间（建议选择 "No Expiration" 或较长时间）
5. 复制生成的 token

### 2. 获取 Vercel Org ID 和 Project ID

#### 方法 A：通过 Vercel CLI
```bash
# 安装 Vercel CLI（如果还没有）
npm i -g vercel

# 登录
vercel login

# 链接项目（如果还没有）
vercel link

# 查看项目信息
vercel inspect
```

#### 方法 B：通过 Vercel Dashboard
1. 访问你的 Vercel 项目页面
2. 打开项目设置（Settings）
3. 在 "General" 标签页中，你可以找到：
   - **Project ID**：在项目名称下方
   - **Team ID**（即 Org ID）：在团队名称下方

#### 方法 C：通过 API
```bash
# 获取所有项目（需要 VERCEL_TOKEN）
curl -H "Authorization: Bearer YOUR_VERCEL_TOKEN" \
  https://api.vercel.com/v9/projects

# 返回的 JSON 中会包含 orgId 和 id（project ID）
```

### 3. 获取 Supabase 凭证
这些值你已经有了：
- `VITE_SUPABASE_URL`: `https://spb-bp1ud8u47k09283b.supabase.opentrust.net`
- `VITE_SUPABASE_ANON_KEY`: `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi1icDF1ZDh1NDdrMDkyODNiIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Njc0NDQ2NjUsImV4cCI6MjA4MzAyMDY2NX0.dgzflsFmz9hASNrfBXDmcNrM9uz70InNusjTxAt8Qws`

## 在 GitHub 中设置 Secrets

1. 访问你的 GitHub 仓库
2. 点击 **Settings** > **Secrets and variables** > **Actions**
3. 点击 **New repository secret**
4. 为每个 secret 添加：
   - Name: `VERCEL_TOKEN`，Value: （你复制的 token）
   - Name: `VERCEL_ORG_ID`，Value: （你的组织/团队 ID）
   - Name: `VERCEL_PROJECT_ID`，Value: （你的项目 ID）
   - Name: `VITE_SUPABASE_URL`，Value: `https://spb-bp1ud8u47k09283b.supabase.opentrust.net`
   - Name: `VITE_SUPABASE_ANON_KEY`，Value: `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi1icDF1ZDh1NDdrMDkyODNiIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Njc0NDQ2NjUsImV4cCI6MjA4MzAyMDY2NX0.dgzflsFmz9hASNrfBXDmcNrM9uz70InNusjTxAt8Qws`

## 验证配置

设置完所有 secrets 后：
1. 推送一个新的 commit 到 `main` 分支
2. 在 GitHub 仓库的 **Actions** 标签页中查看 workflow 运行状态
3. 如果配置正确，部署应该会成功

## 替代方案：使用 Vercel 的 GitHub 集成

如果你已经在 Vercel Dashboard 中通过 GitHub 集成连接了仓库，**不需要**使用 GitHub Actions workflow。Vercel 会自动检测推送并部署。

在这种情况下，你可以：
1. 删除或禁用 `.github/workflows/deploy.yml` 文件
2. 确保在 Vercel Dashboard 中设置了环境变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

