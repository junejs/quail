#!/bin/bash

# 配置
APP_NAME="quail-prod"
DIST_DIR="dist"
RELEASE_FILE="dist.zip"

echo "🚀 开始打包流程..."

# 1. 清理旧产物
echo "🧹 清理旧目录..."
rm -rf $DIST_DIR $RELEASE_FILE .next

# 2. 安装依赖并构建 Next.js
echo "📦 安装依赖并执行 Next.js 构建..."
npm install
npm run build

# 3. 创建输出目录
echo "📂 准备分发目录..."
mkdir -p $DIST_DIR

# 4. 拷贝 Standalone 产物 (这是 Next.js 独立运行的核心)
echo "🚚 拷贝 Standalone 产物..."
cp -r .next/standalone/. $DIST_DIR/

# 5. 拷贝静态资源 (Standalone 模式下必须手动拷贝)
echo "🖼️ 拷贝静态资源 (static & public)..."
mkdir -p $DIST_DIR/.next/static
cp -r .next/static/. $DIST_DIR/.next/static/
cp -r public/. $DIST_DIR/public/

# 6. 编译自定义 Server
echo "⚡ 编译自定义 server.ts -> server.js..."
npx esbuild server.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --external:next \
  --external:socket.io \
  --external:dotenv \
  --external:cookie \
  --external:jsonwebtoken \
  --external:ldapjs \
  --external:@electric-sql/pglite \
  --outfile=$DIST_DIR/server.js \
  --allow-overwrite

# 7. 拷贝数据库迁移文件和创建数据目录
echo "🗄️ 拷贝数据库迁移文件..."
mkdir -p $DIST_DIR/migrations
cp -r lib/db/migrations/. $DIST_DIR/migrations/
mkdir -p $DIST_DIR/quail-db

# 8. 拷贝必要配置文件
echo "📄 拷贝配置文件..."
cp .env.example $DIST_DIR/.env
echo "PORT=3000" >> $DIST_DIR/.env
echo "NODE_ENV=production" >> $DIST_DIR/.env
# 设置默认的 PGlite 存储目录为当前目录
echo "DATABASE_URL=" >> $DIST_DIR/.env

# 9. 生成启动脚本
echo "📜 生成启动脚本..."
cat <<EOF > $DIST_DIR/start.sh
#!/bin/bash
# 确保在当前目录运行
cd "\$(dirname "\$0")"
export NODE_ENV=production
echo "🚀 Starting Quail in production mode..."
node server.js
EOF
chmod +x $DIST_DIR/start.sh

# 9. 移除多余的源码标识
rm -rf $DIST_DIR/package.json

# 10. 压缩
echo "📦 正在生成最终压缩包 $RELEASE_FILE..."
zip -q -r $RELEASE_FILE $DIST_DIR

echo "✅ 打包完成！"
echo "------------------------------------------------"
echo "生产环境部署说明："
echo "1. 将 $RELEASE_FILE 上传到服务器。"
echo "2. 解压并进入目录。"
echo "3. 修改 .env 文件中的数据库和 LDAP 配置。"
echo "4. 运行 ./start.sh 启动，或使用 pm2:"
echo "   pm2 start start.sh --name $APP_NAME"
echo "------------------------------------------------"
