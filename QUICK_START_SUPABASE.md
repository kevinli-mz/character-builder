# Supabase 快速开始指南

## 步骤 1: 在 Supabase Dashboard 中设置

### 1.1 运行数据库 Schema

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目（或创建新项目）
3. 进入 **SQL Editor**
4. 复制 `supabase/schema.sql` 文件的内容
5. 粘贴到 SQL Editor 并点击 **Run**

这将创建所有必需的表和 RLS 策略。

### 1.2 创建 Storage Bucket

1. 在 Supabase Dashboard 中，进入 **Storage**
2. 点击 **New bucket**
3. 名称输入：`character-assets`
4. 设置为 **Public**（如果希望图片公开访问）
5. 点击 **Create bucket**

### 1.3 配置 Storage 策略（如果使用 Private bucket）

如果 bucket 是 Private，需要在 **Storage** > **Policies** 中添加策略：

```sql
-- 允许用户上传自己的文件
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'character-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 允许用户查看自己的文件
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'character-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 允许用户删除自己的文件
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'character-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## 步骤 2: 配置环境变量

### 2.1 获取 Supabase 凭证

在 Supabase Dashboard 中：
1. 进入 **Settings** > **API**
2. 复制 **Project URL** 和 **anon public** key

### 2.2 创建 .env 文件

在项目根目录创建 `.env` 文件：

```env
VITE_SUPABASE_URL=https://spb-bp1ud8u47k09283b.supabase.opentrust.net
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi1icDF1ZDh1NDdrMDkyODNiIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Njc0NDQ2NjUsImV4cCI6MjA4MzAyMDY2NX0.dgzflsFmz9hASNrfBXDmcNrM9uz70InNusjTxAt8Qws
```

**注意：** 如果使用不同的 Supabase 项目，请替换为你的实际值。

## 步骤 3: 安装依赖并启动

```bash
# 安装依赖（如果还没有）
npm install

# 启动开发服务器
npm run dev
```

## 步骤 4: 测试应用

1. 打开浏览器访问 `http://localhost:3000`
2. 你应该看到登录/注册页面
3. 创建一个新账户
4. 登录后，你可以：
   - 使用角色配置器创建角色
   - 访问管理面板（点击 "Admin Access" 或访问 `#admin`）
   - 上传和管理自己的资产
   - 所有数据都是私有的，只有你能看到

## 验证配置是否正确

### 检查清单

- [ ] 数据库表已创建（categories, assets, characters, user_profiles）
- [ ] Storage bucket `character-assets` 已创建
- [ ] `.env` 文件已创建并包含正确的凭证
- [ ] 应用可以启动且没有错误
- [ ] 可以注册新用户
- [ ] 可以登录
- [ ] 可以上传图片
- [ ] 可以管理资产

## 常见问题

### Q: 看到 "无法从后端获取数据"
**A:** 检查：
- 用户是否已登录
- Supabase URL 和 Key 是否正确
- 数据库表是否已创建
- RLS 策略是否正确设置

### Q: 无法上传图片
**A:** 检查：
- Storage bucket 是否已创建
- Bucket 名称是否为 `character-assets`
- Storage 策略是否正确（如果使用 Private bucket）

### Q: 看到认证错误
**A:** 检查：
- Supabase 项目的认证设置
- 邮箱验证是否已启用（可能需要禁用或配置）
- 浏览器控制台的错误信息

## 下一步

- 查看 `SUPABASE_SETUP.md` 了解详细配置
- 自定义认证流程
- 配置生产环境

## 重要提示

⚠️ **安全提醒：**
- 永远不要在客户端代码中使用 Service Role Key
- 不要将 `.env` 文件提交到 Git
- Anon Key 是安全的，可以在客户端使用
- 定期检查 RLS 策略确保数据安全

