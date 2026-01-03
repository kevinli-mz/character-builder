# Supabase 设置指南

本应用使用 Supabase 进行用户认证、数据存储和图片资源管理。

## 1. 在 Supabase 中创建项目

1. 访问 [Supabase](https://supabase.com) 并登录
2. 创建新项目或使用现有项目
3. 记录你的项目 URL 和 Anon Key

## 2. 设置数据库 Schema

在 Supabase Dashboard 的 SQL Editor 中运行 `supabase/schema.sql` 文件中的 SQL 语句。这将创建：

- `user_profiles` - 用户资料表
- `categories` - 分类表
- `assets` - 资产表
- `characters` - 保存的角色配置表

所有表都启用了 Row Level Security (RLS)，确保用户只能访问自己的数据。

## 3. 创建 Storage Bucket

1. 在 Supabase Dashboard 中，进入 **Storage**
2. 创建新的 bucket，命名为 `character-assets`
3. 设置 bucket 为 **Public**（如果需要公开访问图片）
4. 或者设置为 **Private** 并配置适当的策略

### Storage 策略（如果使用 Private bucket）

在 Storage 的 Policies 中，添加以下策略：

```sql
-- 允许用户上传自己的文件
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'character-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 允许用户查看自己的文件
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
USING (bucket_id = 'character-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 允许用户删除自己的文件
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'character-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 4. 配置环境变量

创建 `.env` 文件（基于 `.env.example`）：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**重要提示：**
- 不要将 `.env` 文件提交到 Git
- Anon Key 是安全的，可以在客户端使用
- Service Role Key 应该只在服务器端使用，永远不要暴露在客户端

## 5. 验证配置

1. 启动开发服务器：`npm run dev`
2. 访问应用，你应该看到登录/注册页面
3. 创建一个账户并测试功能

## 6. 功能说明

### 用户认证
- 用户需要登录才能使用应用
- 支持邮箱/密码注册和登录
- 支持密码重置

### 数据隐私
- 所有数据都通过 Row Level Security (RLS) 保护
- 用户只能看到和修改自己的数据
- 每个用户的数据完全隔离

### 图片存储
- 图片上传到 Supabase Storage
- 每个用户的图片存储在独立的文件夹中
- 支持 PNG 和 SVG 格式

### 数据管理
- 用户可以通过管理面板管理自己的分类和资产
- 所有更改自动保存到 Supabase
- 支持本地存储作为后备

## 故障排除

### 问题：无法登录/注册
- 检查 Supabase URL 和 Anon Key 是否正确
- 检查 Supabase 项目的认证设置
- 查看浏览器控制台的错误信息

### 问题：无法上传图片
- 检查 Storage bucket 是否已创建
- 检查 Storage 策略是否正确配置
- 确保 bucket 名称是 `character-assets`

### 问题：无法访问数据
- 检查 RLS 策略是否正确设置
- 确保用户已登录
- 检查数据库表是否已创建

## 安全建议

1. **永远不要**在客户端代码中使用 Service Role Key
2. 定期检查 RLS 策略，确保数据安全
3. 在生产环境中启用 Supabase 的额外安全功能
4. 定期备份数据库

## 支持

如果遇到问题，请检查：
- Supabase Dashboard 中的日志
- 浏览器控制台的错误信息
- 网络请求是否成功

