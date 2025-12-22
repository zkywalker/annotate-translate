# ECDICT Data Processing Scripts

这个目录包含用于下载和转换 ECDICT 词库数据的脚本。

## 数据来源

- **ECDICT**: Free English to Chinese Dictionary Database
- **仓库**: https://github.com/skywind3000/ECDICT
- **许可证**: MIT License
- **版权**: Copyright (c) skywind3000

## 使用步骤

### 第一步：下载 ECDICT 数据

#### 方法 A：手动下载（推荐）

1. 访问 ECDICT Releases 页面：
   https://github.com/skywind3000/ECDICT/releases

2. 下载最新版本的 CSV 文件：
   - 查找 `ecdict-sqlite-XX.zip`（包含 CSV 格式）
   - 或直接下载仓库中的 `ecdict.csv`

3. 解压并放置到此目录：
   ```bash
   # 解压后应该有
   scripts/ecdict.csv
   ```

#### 方法 B：使用 Git（完整版）

```bash
# 克隆 ECDICT 仓库（警告：仓库很大，约 100MB+）
git clone https://github.com/skywind3000/ECDICT.git temp-ecdict

# 复制 CSV 文件
cp temp-ecdict/ecdict.csv ./

# 删除临时仓库
rm -rf temp-ecdict
```

#### 方法 C：直接下载（快速）

```bash
# 使用 curl 或 wget 下载
curl -L -o ecdict.csv "https://github.com/skywind3000/ECDICT/raw/master/ecdict.csv"

# 或使用 wget
wget -O ecdict.csv "https://github.com/skywind3000/ECDICT/raw/master/ecdict.csv"
```

**注意**: 由于 GitHub 的文件大小限制，完整的 ECDICT CSV 可能被压缩在 releases 中，请优先从 releases 页面下载。

### 第二步：运行转换脚本

```bash
# 确保在 scripts 目录中
cd scripts

# 运行转换脚本
node convert-ecdict.js ecdict.csv ../src/data/vocabularies
```

脚本会：
1. 读取 ECDICT CSV 数据
2. 提取并分类词汇（CET-4/6, TOEFL, IELTS, GRE, 考研, 柯林斯, 词频）
3. 生成 JSON 格式的词库文件到 `src/data/vocabularies/`

### 第三步：验证输出

转换完成后，应该生成以下文件：

```
src/data/vocabularies/
├── cet4.json           # CET-4 词汇（约 4000-5000 词）
├── cet6.json           # CET-6 词汇（约 5000-7000 词）
├── toefl.json          # TOEFL 词汇（约 8000 词）
├── ielts.json          # IELTS 词汇（约 8000 词）
├── gre.json            # GRE 词汇（约 8000 词）
├── kaoyan.json         # 考研词汇（约 5000-6000 词）
├── collins.json        # 柯林斯星级词汇（约 10000 词）
└── frequency-bnc.json  # BNC 词频词汇（Top 20000）
```

每个文件格式：
```json
{
  "meta": {
    "name": "CET-4",
    "version": "1.0.0",
    "type": "level",
    "source": "ECDICT",
    "sourceUrl": "https://github.com/skywind3000/ECDICT",
    "license": "MIT License",
    "copyright": "Copyright (c) skywind3000",
    "generatedAt": "2025-12-22T...",
    "description": "CET-4 vocabulary from ECDICT",
    "wordCount": 4523
  },
  "words": {
    "abandon": {
      "level": "cet4",
      "frequency": 5234,
      "collins": 4
    },
    "abstract": {
      "level": "cet6",
      "frequency": 7890,
      "collins": 3
    }
  }
}
```

## 脚本说明

### convert-ecdict.js

**功能**：
- 解析 ECDICT CSV 数据
- 按 tag 字段提取不同级别的词汇
- 生成标准化的 JSON 格式

**配置**：
可以在脚本中修改 `CONFIG` 对象来调整：
- 词库类型
- 每个词库的最大词数
- 词频分级标准

**输出格式**：
每个词条包含：
- `level`: 词汇级别（cet4, cet6, toefl, 等）
- `frequency`: 词频（基于 BNC 语料库）
- `collins`: 柯林斯星级（1-5）

## 故障排查

### 问题：文件过大

**现象**：生成的 JSON 文件太大，影响扩展加载速度

**解决方案**：
1. 修改脚本中的 `maxWords` 限制
2. 只提取高频词汇
3. 按首字母分文件存储

```javascript
// 在 convert-ecdict.js 中修改
maxWords: {
  cet4: 3000,  // 减少到 3000 词
  cet6: 5000,  // 减少到 5000 词
  // ...
}
```

### 问题：CSV 格式错误

**现象**：脚本报错 "Cannot parse CSV line"

**解决方案**：
1. 确保下载的是最新版本的 ECDICT 数据
2. 检查文件编码是否为 UTF-8
3. 尝试使用不同的下载源

### 问题：词库为空或词数很少

**现象**：生成的词库文件中词数为 0 或很少

**可能原因**：
1. ECDICT 的 tag 字段格式可能有变化
2. 下载的是基础版本（76万词条）而非完整版本

**解决方案**：
1. 检查 ECDICT 数据中的 tag 字段格式
2. 从 releases 下载完整版本
3. 查看脚本输出的错误信息

## 许可证合规

转换后的词库文件会自动包含以下版权声明：

```json
{
  "meta": {
    "source": "ECDICT",
    "sourceUrl": "https://github.com/skywind3000/ECDICT",
    "license": "MIT License",
    "copyright": "Copyright (c) skywind3000"
  }
}
```

请确保在使用这些数据时遵守 MIT License 的条款：
- ✅ 可以自由使用、修改、分发
- ⚠️ 必须保留版权声明和许可证文本

## 后续步骤

数据转换完成后：

1. **创建新的 Provider**
   - 为 TOEFL, IELTS, GRE 等创建对应的 Provider
   - 参考 `src/providers/vocabulary/cet-provider.js`

2. **更新 manifest.json**
   - 添加新的词库文件到 `web_accessible_resources`

3. **更新设置页面**
   - 添加新词库的选择选项
   - 更新 UI 和 i18n 文本

4. **测试**
   - 测试每个词库的加载和查询
   - 验证性能（大文件加载时间）
   - 测试不同配置组合

## 参考资料

- [ECDICT 官方文档](https://github.com/skywind3000/ECDICT/wiki)
- [ECDICT 数据格式说明](https://github.com/skywind3000/ECDICT#%E6%95%B0%E6%8D%AE%E6%A0%BC%E5%BC%8F)
- [MIT License 详解](https://opensource.org/license/mit)
