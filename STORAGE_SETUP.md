# Supabase Storage 设置完整指南

## 步骤 1: 创建 Storage Bucket

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 在左侧菜单中，点击 **Storage**
4. 点击 **New bucket** 按钮
5. 填写以下信息：
   - **Name**: `character-assets` (必须完全匹配)
   - **Public bucket**: 选择 **Yes** (如果希望图片公开访问) 或 **No** (如果只希望管理员访问)
   - **File size limit**: 建议设置为 10MB 或更大
   - **Allowed MIME types**: 可以留空（允许所有类型）或设置为 `image/png,image/svg+xml,image/jpeg`
6. 点击 **Create bucket**

## 步骤 2: 配置 Storage 策略

### 方法 A: 使用 SQL Editor（推荐）

1. 在 Supabase Dashboard 中，点击左侧菜单的 **SQL Editor**
2. 点击 **New query**
3. 复制并粘贴 `supabase/storage_policies.sql` 文件中的内容
4. 点击 **Run** 执行

### 方法 B: 使用 Dashboard UI

1. 进入 **Storage** > **Policies**
2. 选择 `character-assets` bucket
3. 点击 **New Policy**
4. 为每个操作创建策略：

#### 上传策略 (INSERT)
- **Policy name**: `Admins can upload files`
- **Allowed operation**: `INSERT`
- **Policy definition**: 使用以下 SQL：
```sql
(bucket_id = 'character-assets' AND
EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE user_id = auth.uid() AND is_admin = TRUE
))
```

#### 查看策略 (SELECT)
- **Policy name**: `Everyone can view files` (如果 bucket 是 public)
- **Allowed operation**: `SELECT`
- **Policy definition**: 使用以下 SQL：
```sql
bucket_id = 'character-assets'
```

或者如果是 private bucket：
- **Policy name**: `Admins can view files`
- **Policy definition**: 
```sql
(bucket_id = 'character-assets' AND
EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE user_id = auth.uid() AND is_admin = TRUE
))
```

#### 更新策略 (UPDATE)
- **Policy name**: `Admins can update files`
- **Allowed operation**: `UPDATE`
- **Policy definition**: 使用以下 SQL：
```sql
(bucket_id = 'character-assets' AND
EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE user_id = auth.uid() AND is_admin = TRUE
))
```

#### 删除策略 (DELETE)
- **Policy name**: `Admins can delete files`
- **Allowed operation**: `DELETE`
- **Policy definition**: 使用以下 SQL：
```sql
(bucket_id = 'character-assets' AND
EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE user_id = auth.uid() AND is_admin = TRUE
))
```

## 步骤 3: 验证设置

### 检查 Bucket 是否存在
在 SQL Editor 中运行：
```sql
SELECT * FROM storage.buckets WHERE name = 'character-assets';
```

应该返回一条记录。

### 检查策略是否正确
在 SQL Editor 中运行：
```sql
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%character-assets%' 
  OR qual::text LIKE '%character-assets%';
```

应该看到 4 条策略（INSERT, SELECT, UPDATE, DELETE）。

### 检查你的管理员状态
在 SQL Editor 中运行：
```sql
SELECT user_id, email, is_admin 
FROM user_profiles 
WHERE email = 'your-email@example.com';
```

确保 `is_admin` 为 `true`。

## 步骤 4: 测试上传

1. 在应用中登录为管理员
2. 进入管理面板
3. 尝试上传一张图片
4. 如果成功，图片应该出现在资产库中

## 常见问题排查

### 问题 1: "没有上传权限"
**解决方案**:
1. 确认 bucket 名称是 `character-assets`（完全匹配，包括大小写）
2. 确认已创建 INSERT 策略
3. 确认你的用户是管理员（`is_admin = TRUE`）
4. 检查策略的 SQL 是否正确

### 问题 2: "Bucket not found"
**解决方案**:
1. 确认 bucket 已创建
2. 确认 bucket 名称拼写正确
3. 检查 bucket 是否被意外删除

### 问题 3: "Policy violation"
**解决方案**:
1. 检查所有策略是否都已创建
2. 确认策略的 SQL 语法正确
3. 确认策略中的 bucket_id 匹配

### 问题 4: 可以上传但无法查看
**解决方案**:
1. 如果 bucket 是 public，确保有 SELECT 策略允许所有人查看
2. 如果 bucket 是 private，确保有 SELECT 策略允许管理员查看
3. 检查图片 URL 是否正确生成

## 快速修复脚本

如果遇到问题，可以运行这个脚本来重置所有策略：

```sql
-- 删除现有策略
DROP POLICY IF EXISTS "Admins can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Everyone can view files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete files" ON storage.objects;

-- 然后重新运行 storage_policies.sql 中的策略
```

## 安全建议

1. **Public vs Private Bucket**:
   - 如果图片需要公开访问（如头像、公共资产），使用 **Public bucket**
   - 如果图片是私有的，使用 **Private bucket** 并只允许管理员查看

2. **文件大小限制**:
   - 建议设置合理的文件大小限制（如 5-10MB）
   - 防止上传过大的文件导致存储成本增加

3. **MIME 类型限制**:
   - 如果只接受图片，限制为 `image/png,image/svg+xml,image/jpeg,image/webp`
   - 防止上传恶意文件

## 下一步

设置完成后：
1. 刷新应用页面
2. 尝试上传图片
3. 如果仍有问题，检查浏览器控制台的错误信息
4. 查看 Supabase Dashboard 的 Storage 日志

