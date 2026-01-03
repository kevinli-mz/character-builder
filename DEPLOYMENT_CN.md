# 部署指南 - 中国大陆访问优化

本指南将帮助你部署应用并配置阿里云域名，确保中国大陆用户可以顺利访问。

## 部署选项

### 方案 1: Vercel（推荐，全球 CDN）

**优点**：
- 免费且快速
- 全球 CDN 加速
- 自动 HTTPS
- 简单易用

**步骤**：

1. **准备项目**
   ```bash
   npm run build
   ```

2. **部署到 Vercel**
   - 访问 [Vercel](https://vercel.com)
   - 使用 GitHub 登录
   - 点击 "New Project"
   - 导入你的 GitHub 仓库
   - 配置：
     - Framework Preset: `Vite`
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - 添加环境变量：
     ```
     VITE_SUPABASE_URL=你的Supabase URL
     VITE_SUPABASE_ANON_KEY=你的Anon Key
     ```
   - 点击 Deploy

3. **配置自定义域名（阿里云）**
   - 在 Vercel 项目设置中找到 "Domains"
   - 添加你的阿里云域名（如：`app.yourdomain.com`）
   - 按照提示配置 DNS

### 方案 2: 阿里云 OSS + CDN（最佳中国大陆访问）

**优点**：
- 中国大陆访问速度快
- 使用阿里云 CDN 加速
- 成本可控

**步骤**：

1. **构建项目**
   ```bash
   npm run build
   ```

2. **上传到阿里云 OSS**
   - 登录 [阿里云控制台](https://oss.console.aliyun.com)
   - 创建 OSS Bucket
   - 设置 Bucket 为静态网站托管
   - 上传 `dist` 文件夹中的所有文件

3. **配置 CDN**
   - 在阿里云 CDN 控制台创建加速域名
   - 源站设置为你的 OSS Bucket
   - 配置 HTTPS 证书

### 方案 3: Netlify（备选）

类似 Vercel，但对中国大陆访问可能较慢。

## 阿里云域名配置详细步骤

### 步骤 1: 在阿里云准备域名

1. 登录 [阿里云域名控制台](https://dc.console.aliyun.com)
2. 确保域名已实名认证
3. 记录你的域名（如：`yourdomain.com`）

### 步骤 2: 配置 DNS 解析

#### 如果使用 Vercel：

1. 在 Vercel 项目设置中添加域名
2. Vercel 会显示需要添加的 DNS 记录，例如：
   ```
   Type: CNAME
   Name: app (或 @ 表示根域名)
   Value: cname.vercel-dns.com
   ```

3. 在阿里云 DNS 解析中添加记录：
   - 登录 [DNS 解析控制台](https://dns.console.aliyun.com)
   - 选择你的域名
   - 添加记录：
     - **记录类型**: CNAME
     - **主机记录**: `app` (或留空表示根域名)
     - **解析线路**: 默认
     - **记录值**: Vercel 提供的 CNAME 值
     - **TTL**: 600

#### 如果使用阿里云 OSS + CDN：

1. 在阿里云 CDN 控制台创建加速域名
2. 添加 DNS 记录：
   - **记录类型**: CNAME
   - **主机记录**: `app`
   - **记录值**: CDN 提供的 CNAME 地址（如：`yourdomain.com.w.kunlunea.com`）

### 步骤 3: 配置 HTTPS（重要）

1. **在 Vercel**：
   - Vercel 自动提供免费 SSL 证书
   - 在项目设置中启用 "Force HTTPS"

2. **在阿里云 CDN**：
   - 在 CDN 控制台配置 SSL 证书
   - 可以使用阿里云免费证书或上传自己的证书

### 步骤 4: 等待 DNS 生效

- DNS 记录通常需要 10 分钟到 24 小时生效
- 可以使用 `nslookup` 或在线工具检查 DNS 解析

## 针对中国大陆访问的优化

### 问题：Supabase 在中国大陆访问可能较慢

**解决方案**：

#### 方案 A: 使用 Supabase 代理（推荐）

1. **使用 Cloudflare Workers 代理**：
   - 创建一个 Cloudflare Worker
   - 代理 Supabase API 请求
   - 配置自定义域名

2. **使用阿里云 API 网关**：
   - 创建 API 网关服务
   - 配置 Supabase API 代理
   - 使用阿里云 CDN 加速

#### 方案 B: 使用国内替代方案

考虑使用：
- **阿里云 RDS** + **OSS** 替代 Supabase
- **腾讯云开发** (CloudBase)
- **LeanCloud**

但这需要修改代码，工作量较大。

#### 方案 C: 优化 Supabase 连接（简单方案）

在代码中添加连接优化：

```typescript
// services/supabase.ts
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  // 添加超时设置
  global: {
    headers: {
      'x-client-info': 'character-builder'
    }
  }
});
```

## 部署检查清单

- [ ] 项目已构建 (`npm run build`)
- [ ] 环境变量已配置
- [ ] 域名 DNS 已配置
- [ ] HTTPS 证书已配置
- [ ] 测试访问正常
- [ ] 测试上传功能
- [ ] 测试登录/注册功能

## 环境变量配置

在部署平台设置以下环境变量：

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 故障排除

### DNS 解析不生效
- 检查 DNS 记录是否正确
- 等待更长时间（最多 24 小时）
- 清除本地 DNS 缓存

### HTTPS 证书问题
- 确保域名已正确解析
- 检查证书是否已颁发
- 等待证书生效（可能需要几分钟）

### 中国大陆访问慢
- 考虑使用阿里云 CDN
- 使用国内 Supabase 代理
- 优化图片大小和加载

## 推荐配置（最佳实践）

对于中国大陆用户：

1. **前端部署**: 阿里云 OSS + CDN
2. **域名**: 阿里云域名 + 备案
3. **数据库**: Supabase（如果访问慢，考虑代理）
4. **CDN**: 阿里云 CDN（加速静态资源）

## 备案说明

如果使用阿里云服务器/CDN 且域名需要备案：
1. 在阿里云提交备案申请
2. 准备相关材料
3. 等待审核（通常 7-20 个工作日）

如果使用 Vercel 等海外服务，通常不需要备案。

