# 第一阶段：安装依赖
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 安装 pnpm
RUN corepack enable pnpm

# 复制包管理文件并安装依赖
COPY package.json pnpm-lock.yaml* ./
RUN pnpm i --frozen-lockfile

# 第二阶段：构建应用
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 禁用 Next.js 遥测数据收集
ENV NEXT_TELEMETRY_DISABLED=1

# 执行 Next.js 构建 (生成 standalone 产物)
RUN corepack enable pnpm && pnpm run build

# 编译自定义 Server (server.ts -> server.js)
# 使用与 scripts/package.sh 相同的 esbuild 参数
RUN npx esbuild server.ts \
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
  --outfile=server_dist.js \
  --allow-overwrite

# 第三阶段：运行环境
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 创建 PGlite 数据目录并设置权限
RUN mkdir -p /app/quail-db && chown -R node:node /app/quail-db

# 复制构建产物
# 1. 拷贝 Standalone 核心 (包含 node_modules)
COPY --from=builder /app/.next/standalone ./
# 2. 拷贝静态资源 (Standalone 模式下必须手动拷贝)
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# 3. 覆盖生成的 server.js 为我们自定义编译的版本
COPY --from=builder /app/server_dist.js ./server.js
# 4. 拷贝数据库迁移文件
COPY --from=builder /app/lib/db/migrations ./migrations

# 切换到非 root 用户
USER node

EXPOSE 3000

# 启动应用
CMD ["node", "server.js"]
