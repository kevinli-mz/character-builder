# 部署说明

## 快速开始

### 方法 1: Vercel（最简单，推荐）

1. 访问 https://vercel.com 并登录
2. 导入 GitHub 仓库
3. 配置环境变量
4. 部署完成！

详细步骤见：`DEPLOY_QUICK_START.md`

### 方法 2: 阿里云 OSS + CDN（中国大陆访问快）

1. 构建项目：`npm run build`
2. 上传到阿里云 OSS
3. 配置 CDN
4. 配置域名 DNS

详细步骤见：`DEPLOYMENT_CN.md`

## 阿里云域名配置步骤

### 1. 在 Vercel 配置域名

1. 进入 Vercel 项目设置
2. 点击 "Domains"
3. 添加你的域名（如：`app.yourdomain.com`）
4. 复制 Vercel 提供的 DNS 配置信息

### 2. 在阿里云配置 DNS

1. 登录 [阿里云 DNS 解析控制台](https://dns.console.aliyun.com)
2. 选择你的域名
3. 添加 CNAME 记录：
   ```
   记录类型: CNAME
   主机记录: app (子域名，或 @ 表示根域名)
   解析线路: 默认
   记录值: cname.vercel-dns.com (Vercel 提供的值)
   TTL: 600
   ```
4. 保存

### 3. 等待生效

- DNS 解析通常 10-30 分钟生效
- 可以使用命令检查：`nslookup app.yourdomain.com`
- 或使用在线工具：https://dnschecker.org

### 4. 验证

访问 `https://app.yourdomain.com` 应该能看到你的应用。

## 环境变量

确保在部署平台配置了以下环境变量：

```
VITE_SUPABASE_URL=你的Supabase URL
VITE_SUPABASE_ANON_KEY=你的Anon Key
```

## 文件说明

- `DEPLOY_QUICK_START.md` - 快速部署指南
- `DEPLOYMENT_CN.md` - 详细的中国大陆部署指南
- `vercel.json` - Vercel 配置文件
- `aliyun-deploy.sh` - 阿里云部署脚本
- `.github/workflows/deploy.yml` - GitHub Actions 自动部署配置

## 常见问题

### DNS 解析不生效？
- 等待 10-30 分钟
- 清除本地 DNS 缓存：`sudo dscacheutil -flushcache` (macOS)
- 检查 DNS 记录是否正确

### HTTPS 证书问题？
- Vercel 自动提供免费 SSL 证书
- 阿里云 CDN 需要手动配置证书

### 中国大陆访问慢？
- 使用阿里云 OSS + CDN
- 或配置 Supabase 代理（见 DEPLOYMENT_CN.md）

## 需要帮助？

查看详细文档：
- `DEPLOY_QUICK_START.md` - 快速开始
- `DEPLOYMENT_CN.md` - 完整指南

