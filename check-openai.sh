#!/bin/bash

# OpenAI Provider 快速检查脚本

echo "🔍 OpenAI Provider 快速检查"
echo "=========================="
echo ""

# 1. 检查文件存在
echo "📁 检查文件..."
if [ -f "ai-providers/openai-provider.js" ]; then
    echo "  ✅ ai-providers/openai-provider.js 存在"
else
    echo "  ❌ ai-providers/openai-provider.js 不存在"
    exit 1
fi

if [ -f "ai-providers/base-ai-provider.js" ]; then
    echo "  ✅ ai-providers/base-ai-provider.js 存在"
else
    echo "  ❌ ai-providers/base-ai-provider.js 不存在"
    exit 1
fi

if [ -f "ai-providers/prompt-templates.js" ]; then
    echo "  ✅ ai-providers/prompt-templates.js 存在"
else
    echo "  ❌ ai-providers/prompt-templates.js 不存在"
    exit 1
fi

echo ""

# 2. 检查语法
echo "🔧 检查语法..."
if node --check ai-providers/openai-provider.js 2>/dev/null; then
    echo "  ✅ openai-provider.js 语法正确"
else
    echo "  ❌ openai-provider.js 语法错误"
    node --check ai-providers/openai-provider.js
    exit 1
fi

if node --check translation-service.js 2>/dev/null; then
    echo "  ✅ translation-service.js 语法正确"
else
    echo "  ❌ translation-service.js 语法错误"
    node --check translation-service.js
    exit 1
fi

echo ""

# 3. 检查类定义
echo "🏗️  检查类定义..."
if grep -q "class OpenAITranslateProvider extends TranslationProvider" translation-service.js; then
    echo "  ✅ OpenAITranslateProvider 类已定义"
else
    echo "  ❌ OpenAITranslateProvider 类未找到"
    exit 1
fi

if grep -q "class OpenAIProvider extends BaseAIProvider" ai-providers/openai-provider.js; then
    echo "  ✅ OpenAIProvider 类已定义"
else
    echo "  ❌ OpenAIProvider 类未找到"
    exit 1
fi

echo ""

# 4. 检查注册代码
echo "📝 检查注册代码..."
if grep -q "registerProvider('openai'" translation-service.js; then
    echo "  ✅ OpenAI provider 注册代码存在"
    grep -n "registerProvider('openai'" translation-service.js | head -1
else
    echo "  ❌ OpenAI provider 注册代码未找到"
    exit 1
fi

echo ""

# 5. 检查 manifest.json
echo "📄 检查 manifest.json..."
if grep -q "ai-providers/openai-provider.js" manifest.json; then
    echo "  ✅ manifest.json 包含 openai-provider.js"
else
    echo "  ❌ manifest.json 未包含 openai-provider.js"
    exit 1
fi

if grep -q "ai-providers/base-ai-provider.js" manifest.json; then
    echo "  ✅ manifest.json 包含 base-ai-provider.js"
else
    echo "  ❌ manifest.json 未包含 base-ai-provider.js"
    exit 1
fi

if grep -q "ai-providers/prompt-templates.js" manifest.json; then
    echo "  ✅ manifest.json 包含 prompt-templates.js"
else
    echo "  ❌ manifest.json 未包含 prompt-templates.js"
    exit 1
fi

echo ""

# 6. 检查文件加载顺序
echo "📑 检查加载顺序..."
prompt_line=$(grep -n "prompt-templates.js" manifest.json | cut -d: -f1)
base_line=$(grep -n "base-ai-provider.js" manifest.json | cut -d: -f1)
openai_line=$(grep -n "openai-provider.js" manifest.json | cut -d: -f1)
service_line=$(grep -n "translation-service.js" manifest.json | cut -d: -f1)

if [ "$prompt_line" -lt "$base_line" ] && [ "$base_line" -lt "$openai_line" ] && [ "$openai_line" -lt "$service_line" ]; then
    echo "  ✅ 文件加载顺序正确"
    echo "     prompt-templates.js (line $prompt_line)"
    echo "     base-ai-provider.js (line $base_line)"
    echo "     openai-provider.js (line $openai_line)"
    echo "     translation-service.js (line $service_line)"
else
    echo "  ⚠️  文件加载顺序可能有问题"
    echo "     prompt-templates.js (line $prompt_line)"
    echo "     base-ai-provider.js (line $base_line)"
    echo "     openai-provider.js (line $openai_line)"
    echo "     translation-service.js (line $service_line)"
fi

echo ""

# 7. 检查 content.js 配置
echo "⚙️  检查 content.js..."
if grep -q "translationProvider === 'openai'" content.js; then
    echo "  ✅ content.js 包含 OpenAI 配置逻辑"
else
    echo "  ❌ content.js 未包含 OpenAI 配置逻辑"
    exit 1
fi

echo ""

# 8. 检查 options.js 默认设置
echo "🎛️  检查 options.js..."
if grep -q "openaiApiKey" options.js; then
    echo "  ✅ options.js 包含 OpenAI 设置"
else
    echo "  ❌ options.js 未包含 OpenAI 设置"
    exit 1
fi

echo ""
echo "=========================="
echo "✅ 所有检查通过！"
echo ""
echo "📌 下一步："
echo "1. 在浏览器中重新加载扩展: chrome://extensions/"
echo "2. 打开任意网页，按 F12 查看控制台"
echo "3. 在控制台输入: translationService.providers.has('openai')"
echo "4. 期望输出: true"
echo ""
echo "📖 详细调试指南: OPENAI_REGISTRATION_DEBUG.md"
echo "🧪 测试页面: test-openai-registration.html"
