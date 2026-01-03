# 快速部署指南

## 最简单的方法：Vercel（5 分钟）

### 步骤 1: 准备代码

确保代码已推送到 GitHub。

### 步骤 2: 部署到 Vercel

1. 访问 https://vercel.com
2. 使用 GitHub 账号登录
3. 点击 "Add New Project"
4. 选择你的仓库
5. 配置：
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (默认)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. 添加环境变量：
   - `VITE_SUPABASE_URL` = 你的 Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = 你的 Anon Key
7. 点击 "Deploy"

### 步骤 3: 配置阿里云域名

1. **在 Vercel 中添加域名**：
   - 进入项目设置 > Domains
   - 添加你的域名（如：`app.yourdomain.com`）
   - Vercel 会显示 DNS 配置信息

2. **在阿里云配置 DNS**：
   - 登录 [阿里云 DNS 控制台](https://dns.console.aliyun.com)
   - 选择你的域名
   - 添加 CNAME 记录：
     ```
     记录类型: CNAME
     主机记录: app (或 @ 表示根域名)
     记录值: cname.vercel-dns.com (Vercel 提供的值)
     ```

3. **等待生效**：
   - 通常 10-30 分钟生效
   - 可以使用 `nslookup app.yourdomain.com` 检查

### 完成！

访问 `https://app.yourdomain.com` 即可使用。

## 使用阿里云 OSS + CDN（中国大陆访问更快）

### 步骤 1: 构建项目

```bash
npm run build
```

### 步骤 2: 创建 OSS Bucket

1. 登录 [阿里云 OSS 控制台](https://oss.console.aliyun.com)
2. 创建 Bucket：
   - 名称：`your-app-name`
   - 区域：选择离你最近的区域
   - 读写权限：公共读
3. 开启静态网站托管：
   - Bucket 设置 > 静态网站托管 > 开启
   - 默认首页：`index.html`
   - 默认 404 页：`index.html` (用于 SPA)

### 步骤 3: 上传文件

**方法 A: 使用控制台上传**
1. 进入 Bucket
2. 上传 `dist` 文件夹中的所有文件
3. 确保文件权限为"公共读"

**方法 B: 使用命令行**
```bash
# 安装 ossutil
# macOS
wget http://gosspublic.alicdn.com/ossutil/1.7.14/ossutilmac64
chmod 755 ossutilmac64
sudo mv ossutilmac64 /usr/local/bin/ossutil

# 配置
ossutil config

# 上传
ossutil cp -r dist/ oss://your-bucket-name/ --update
```

### 步骤 4: 配置 CDN

1. 登录 [阿里云 CDN 控制台](https://cdn.console.aliyun.com)
2. 添加加速域名：
   - 加速域名：`app.yourdomain.com`
   - 业务类型：全站加速
   - 源站信息：选择你的 OSS Bucket
3. 配置 HTTPS：
   - 在 CDN 控制台配置 SSL 证书
   - 可以使用阿里云免费证书

### 步骤 5: 配置 DNS

在阿里云 DNS 解析中添加 CNAME 记录：
```
记录类型: CNAME
主机记录: app
记录值: CDN 提供的 CNAME 地址
```

## 环境变量配置

无论使用哪种部署方式，都需要配置环境变量：

**Vercel**:
- 项目设置 > Environment Variables

**阿里云 OSS**:
- 需要在构建时设置环境变量
- 或者在代码中使用 `.env.production` 文件

创建 `.env.production`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 常见问题

### Q: DNS 解析不生效？
A: 等待 10-30 分钟，清除浏览器缓存，或使用其他 DNS 服务器测试。

### Q: HTTPS 证书问题？
A: Vercel 自动提供证书。阿里云 CDN 需要手动配置证书。

### Q: 中国大陆访问慢？
A: 使用阿里云 OSS + CDN，或配置 Supabase 代理。

### Q: 如何更新部署？
A: 
- Vercel: 推送代码到 GitHub 自动部署
- 阿里云: 重新运行构建和上传脚本

## 推荐方案对比

| 方案 | 速度 | 成本 | 难度 | 推荐度 |
|------|------|------|------|--------|
| Vercel | ⭐⭐⭐⭐ | 免费 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 阿里云 OSS+CDN | ⭐⭐⭐⭐⭐ | 低 | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Netlify | ⭐⭐⭐ | 免费 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**对于中国大陆用户**：推荐阿里云 OSS + CDN
**对于全球用户**：推荐 Vercel

