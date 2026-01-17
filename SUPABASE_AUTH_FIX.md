# Supabase 认证访问问题修复指南

## 问题描述
只有从特定 WiFi IP 地址可以注册/登录，其他用户无法访问。这通常是 Supabase 认证配置问题。

## 需要检查的 Supabase 设置

### 1. 检查 Site URL 配置 ⚠️ 最重要

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Authentication** > **URL Configuration**
4. 检查以下设置：

#### Site URL
- **应该设置为**：你的生产环境 URL（例如：`https://your-domain.vercel.app`）
- **如果设置为**：`http://localhost:5173` 或特定 IP，会导致其他用户无法访问

#### Redirect URLs
必须包含所有可能的回调 URL：

```
https://your-domain.vercel.app/**
http://localhost:5173/**
https://your-custom-domain.com/**
```

**重要**：
- 使用 `**` 通配符允许所有子路径
- 确保包含生产环境 URL
- 确保包含本地开发 URL（如果需要）
- 每个 URL 占一行

### 2. 检查 RLS 策略（Row Level Security）

虽然 RLS 通常不会阻止注册/登录，但值得检查：

1. 进入 **Authentication** > **Policies**
2. 确保 `auth.users` 表没有限制性的策略
3. 检查 `user_profiles` 表的策略是否正确

### 3. 检查 API 设置

1. 进入 **Settings** > **API**
2. 确保 **Enable email confirmations** 设置符合你的需求：
   - 如果启用了，用户需要验证邮箱才能登录
   - 如果禁用，用户注册后可以立即登录
3. 检查 **Enable email signups** 应该为 `ON`

### 4. 检查项目限制（如果是免费计划）

1. 进入 **Settings** > **General**
2. 检查项目状态和限制
3. 某些免费计划可能有地域或使用限制

### 5. 检查网络/IP 限制（如果有企业计划）

1. 进入 **Settings** > **Network**
2. 检查是否有 IP 白名单设置
3. 如果有，确保允许所有用户访问，或移除限制

## 常见问题和解决方案

### 问题 1: Site URL 设置错误

**症状**：只有特定 IP/URL 可以访问

**解决方案**：
1. 在 **Authentication** > **URL Configuration** 中
2. 将 **Site URL** 设置为生产环境 URL（例如：`https://your-app.vercel.app`）
3. 在 **Redirect URLs** 中添加：
   ```
   https://your-app.vercel.app/**
   http://localhost:5173/**
   ```

### 问题 2: 重定向 URL 不匹配

**症状**：用户尝试登录后重定向失败

**解决方案**：
- 在 **Redirect URLs** 中添加所有可能的 URL，包括：
  - 生产环境 URL
  - 本地开发 URL
  - 任何自定义域名

### 问题 3: 邮箱验证启用但用户未验证

**症状**：用户注册后无法登录

**解决方案**：
1. 进入 **Authentication** > **Settings**
2. 检查 **Enable email confirmations**
3. 如果启用但不想要求验证，可以暂时禁用
4. 或者确保邮箱发送功能正常工作

### 问题 4: CORS 问题

虽然代码中应该已正确处理，但如果仍有问题：

1. 进入 **Settings** > **API**
2. 检查是否有 CORS 配置
3. Supabase 通常自动处理 CORS，但可以检查

## 推荐的配置（标准设置）

### URL Configuration
```
Site URL: https://your-production-domain.com

Redirect URLs:
https://your-production-domain.com/**
http://localhost:5173/**
```

### Authentication Settings
- **Enable email signups**: ON
- **Enable email confirmations**: OFF（除非需要邮箱验证）
- **Enable phone signups**: 根据需要
- **Enable email change**: ON
- **Secure email change**: ON

## 验证修复

1. 从不同的网络/IP 测试注册
2. 从不同的设备测试登录
3. 检查浏览器控制台是否有错误
4. 检查 Supabase Dashboard 的 **Logs** > **Auth Logs** 查看失败的认证尝试

## 如果问题仍然存在

1. **检查 Supabase 状态**：访问 [Supabase Status](https://status.supabase.com)
2. **查看日志**：
   - Supabase Dashboard > **Logs** > **Auth Logs**
   - 查看失败请求的错误信息
3. **联系支持**：如果以上步骤都无法解决，可能需要联系 Supabase 支持

## 临时测试方案

如果需要在修复配置前测试：

1. 在 Supabase Dashboard 中临时添加测试 IP 到允许列表（如果支持）
2. 或者使用 VPN 连接到你的网络进行测试
3. 或者暂时将 Site URL 设置为通配符（不推荐用于生产环境）

