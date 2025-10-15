#!/bin/bash

echo "🔍 检查 AI 翻译图标和标签"
echo "=========================="
echo ""

# 1. 检查图标文件是否存在
echo "1️⃣  检查 AI 图标文件..."
if [ -f "icons/icon_logo_ai.svg" ]; then
    echo "  ✅ icons/icon_logo_ai.svg 存在"
    file_size=$(ls -lh icons/icon_logo_ai.svg | awk '{print $5}')
    echo "     文件大小: $file_size"
else
    echo "  ❌ icons/icon_logo_ai.svg 不存在"
    exit 1
fi
echo ""

# 2. 检查 popup.js 中的图标配置
echo "2️⃣  检查 Popup 图标配置..."
if grep -q "logo: 'icons/icon_logo_ai.svg'" popup.js; then
    echo "  ✅ popup.js: AI 翻译图标已配置"
else
    echo "  ❌ popup.js: AI 翻译图标未配置"
    exit 1
fi
echo ""

# 3. 检查所有提供商的图标配置
echo "3️⃣  检查所有提供商图标..."
echo "  Google:  $(grep -A 1 "value: 'google'" popup.js | grep logo | cut -d"'" -f2)"
echo "  Youdao:  $(grep -A 1 "value: 'youdao'" popup.js | grep logo | cut -d"'" -f2)"
echo "  DeepL:   $(grep -A 1 "value: 'deepl'" popup.js | grep logo | cut -d"'" -f2)"
echo "  OpenAI:  $(grep -A 1 "value: 'openai'" popup.js | grep logo | cut -d"'" -f2)"
echo ""

# 4. 检查是否还有 NEW 标签
echo "4️⃣  检查 NEW 标签..."
new_badge_count=$(grep -c 'badge-new.*badgeNew' options.html || echo "0")
if [ "$new_badge_count" -eq "0" ]; then
    echo "  ✅ options.html: NEW 标签已移除"
else
    echo "  ⚠️  options.html: 仍有 $new_badge_count 个 NEW 标签"
    echo "     位置:"
    grep -n 'badge-new.*badgeNew' options.html
fi
echo ""

# 5. 检查 OpenAI 选项的 HTML
echo "5️⃣  检查 OpenAI 选项 HTML..."
if grep -A 2 'value="openai"' options.html | grep -q 'badge-new'; then
    echo "  ⚠️  OpenAI 选项仍有 NEW 标签"
else
    echo "  ✅ OpenAI 选项已移除 NEW 标签"
fi
echo ""

# 6. 列出所有图标文件
echo "6️⃣  可用的图标文件..."
ls -lh icons/icon_logo_*.svg | awk '{print "  - " $9 " (" $5 ")"}'
echo ""

echo "=========================="
echo "✅ 检查完成！"
echo ""
echo "📌 修改内容:"
echo "1. ✅ popup.js: AI 翻译图标从空字符串改为 'icons/icon_logo_ai.svg'"
echo "2. ✅ options.html: 移除了 OpenAI 选项的 NEW 标签"
echo ""
echo "📌 下一步:"
echo "1. 重新加载扩展: chrome://extensions/"
echo "2. 打开 Popup，查看 AI 翻译旁边是否显示图标"
echo "3. 打开 Options 页面，确认 AI 翻译选项没有 NEW 标签"
