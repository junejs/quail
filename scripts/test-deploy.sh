#!/bin/bash

# 配置
RELEASE_FILE="dist.zip"
TEST_DIR="$HOME/tmp/quail-test"
APP_DIR="$TEST_DIR/dist"

echo "🧪 开始部署测试流程..."

# 1. 检查 dist.zip 是否存在
echo "🔍 检查 $RELEASE_FILE 是否存在..."
if [ ! -f "$RELEASE_FILE" ]; then
    echo "❌ 错误: 找不到 $RELEASE_FILE，请先运行 ./scripts/package.sh"
    exit 1
fi
echo "✅ 找到 $RELEASE_FILE"

# 2. 清理并创建测试目录
echo ""
echo "🧹 准备测试目录..."
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"
echo "✅ 测试目录已创建: $TEST_DIR"

# 3. 拷贝压缩包
echo ""
echo "📦 拷贝 $RELEASE_FILE 到测试目录..."
cp "$RELEASE_FILE" "$TEST_DIR/"
echo "✅ 拷贝完成"

# 4. 解压
echo ""
echo "📂 解压压缩包..."
cd "$TEST_DIR"
unzip -q "$RELEASE_FILE"
echo "✅ 解压完成"

# 5. 检查启动脚本
echo ""
echo "🔍 检查启动脚本..."
if [ ! -f "$APP_DIR/start.sh" ]; then
    echo "❌ 错误: 找不到 start.sh"
    exit 1
fi
chmod +x "$APP_DIR/start.sh"
echo "✅ 启动脚本已就绪"

# 6. 检查环境配置
echo ""
echo "🔍 检查环境配置..."
if [ ! -f "$APP_DIR/.env" ]; then
    echo "❌ 错误: 找不到 .env 文件"
    exit 1
fi
echo "✅ .env 文件已找到"

# 7. 显示环境变量（脱敏）
echo ""
echo "📄 环境变量预览："
echo "----------------------------------------"
grep -v "SECRET\|PASSWORD\|TOKEN" "$APP_DIR/.env" 2>/dev/null | head -10
echo "----------------------------------------"

# 8. 启动应用
echo ""
echo "🚀 启动应用..."
echo "提示: 按 Ctrl+C 停止应用"
echo "----------------------------------------"
cd "$APP_DIR"
./start.sh

# 注意: 脚本会在这里等待，直到用户按 Ctrl+C 停止应用
