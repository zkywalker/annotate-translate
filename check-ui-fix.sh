#!/bin/bash

echo "🔍 检查 OpenAI Provider UI 修复"
echo "================================"
echo ""

# 1. 检查 translation-service.js 中的名称
echo "1️⃣  检查 Provider 名称..."
if grep -q "super('AI翻译', config)" translation-service.js; then
    echo "  ✅ translation-service.js: Provider 名称已改为 'AI翻译'"
else
    echo "  ❌ translation-service.js: Provider 名称未更新"
    exit 1
fi
echo ""

# 2. 检查 popup.js 中是否添加了 openai
echo "2️⃣  检查 Popup 提供商列表..."
if grep -q "{ value: 'openai'" popup.js; then
    echo "  ✅ popup.js: OpenAI 已添加到提供商列表"
else
    echo "  ❌ popup.js: OpenAI 未添加到提供商列表"
    exit 1
fi
echo ""

# 3. 检查中文 i18n
echo "3️⃣  检查中文翻译..."
if grep -q '"openaiTranslate"' _locales/zh_CN/messages.json; then
    echo "  ✅ zh_CN/messages.json: openaiTranslate 已添加"
    translation=$(grep -A 2 '"openaiTranslate"' _locales/zh_CN/messages.json | grep '"message"' | cut -d'"' -f4)
    echo "     翻译: \"$translation\""
else
    echo "  ❌ zh_CN/messages.json: openaiTranslate 未添加"
    exit 1
fi
echo ""

# 4. 检查英文 i18n
echo "4️⃣  检查英文翻译..."
if grep -q '"openaiTranslate"' _locales/en/messages.json; then
    echo "  ✅ en/messages.json: openaiTranslate 已添加"
    translation=$(grep -A 2 '"openaiTranslate"' _locales/en/messages.json | grep '"message"' | cut -d'"' -f4)
    echo "     Translation: \"$translation\""
else
    echo "  ❌ en/messages.json: openaiTranslate 未添加"
    exit 1
fi
echo ""

# 5. 对比两个设置页面的提供商列表
echo "5️⃣  检查提供商列表一致性..."
echo ""
echo "  Options 页面 (options.html):"
echo "  $(grep -o 'value="[^"]*"' options.html | grep -E '(google|youdao|deepl|openai|debug)' | cut -d'"' -f2 | tr '\n' ', ' | sed 's/,$//')"
echo ""
echo "  Popup 页面 (popup.js):"
popup_providers=$(grep -A 5 "const providers = \[" popup.js | grep "value:" | cut -d"'" -f2 | tr '\n' ', ' | sed 's/,$//')
echo "  $popup_providers"
echo ""

# 检查 popup 是否包含 openai
if echo "$popup_providers" | grep -q "openai"; then
    echo "  ✅ Popup 包含 openai 提供商"
else
    echo "  ❌ Popup 不包含 openai 提供商"
    exit 1
fi
echo ""

# 6. 检查 provider 注册
echo "6️⃣  检查 Provider 注册..."
if grep -q "registerProvider('openai'" translation-service.js; then
    echo "  ✅ OpenAI Provider 已注册"
else
    echo "  ❌ OpenAI Provider 未注册"
    exit 1
fi
echo ""

echo "================================"
echo "✅ 所有检查通过！"
echo ""
echo "📌 下一步："
echo "1. 重新加载扩展: chrome://extensions/"
echo "2. 打开 Options 页面，检查是否显示 'AI翻译'"
echo "3. 点击扩展图标，检查 Popup 下拉菜单是否包含 'AI翻译'"
echo "4. 选择 AI翻译并测试功能"
echo ""
echo "📖 详细说明: OPENAI_UI_FIX.md"
