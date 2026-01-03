#!/bin/bash

# 阿里云 OSS 部署脚本
# 使用前请配置以下变量

# 阿里云 OSS 配置
OSS_ENDPOINT="oss-cn-hangzhou.aliyuncs.com"  # 根据你的区域修改
OSS_BUCKET="your-bucket-name"  # 你的 OSS Bucket 名称
OSS_ACCESS_KEY_ID="your-access-key-id"
OSS_ACCESS_KEY_SECRET="your-access-key-secret"

# 构建项目
echo "Building project..."
npm run build

# 检查是否安装了 ossutil
if ! command -v ossutil &> /dev/null
then
    echo "ossutil not found. Installing..."
    # 下载 ossutil (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        wget http://gosspublic.alicdn.com/ossutil/1.7.14/ossutilmac64
        chmod 755 ossutilmac64
        mv ossutilmac64 /usr/local/bin/ossutil
    else
        echo "Please install ossutil manually"
        exit 1
    fi
fi

# 配置 ossutil
ossutil config -e $OSS_ENDPOINT -i $OSS_ACCESS_KEY_ID -k $OSS_ACCESS_KEY_SECRET

# 上传文件到 OSS
echo "Uploading files to OSS..."
ossutil cp -r dist/ oss://$OSS_BUCKET/ --update

echo "Deployment complete!"
echo "Please configure your CDN to point to this OSS bucket"

