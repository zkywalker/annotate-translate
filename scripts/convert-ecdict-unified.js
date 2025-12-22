#!/usr/bin/env node

/**
 * ECDICT Data Converter - Unified Format (方案3: 分层存储)
 *
 * 生成分层词库：
 * 1. vocabulary-core.json - 核心词库 (CET/考研/常用词)
 * 2. vocabulary-advanced.json - 高级词库 (GRE/罕见词)
 * 3. vocabulary-frequency.json - 词频词库 (可选)
 *
 * 数据格式：每个词保留完整标签信息
 * {
 *   "abandon": {
 *     "tags": ["cet4", "cet6", "ky", "toefl", "ielts", "gre"],
 *     "frequency": 5234,
 *     "collins": 4
 *   }
 * }
 *
 * Data Source: ECDICT (https://github.com/skywind3000/ECDICT)
 * Copyright (c) skywind3000
 * Licensed under MIT License
 *
 * Usage:
 *   node convert-ecdict-unified.js <input-csv> <output-dir>
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 配置
const CONFIG = {
  // 核心词库标签（出现这些标签之一就进入核心词库）
  coreTags: ['cet4', 'cet6', 'ky', 'gk', 'zk'],

  // 高级词库标签
  advancedTags: ['gre'],

  // 词频分级阈值
  frequencyTiers: {
    1000: 'top1000',
    3000: 'top3000',
    5000: 'top5000',
    10000: 'top10000',
    20000: 'top20000'
  },

  // 文件大小限制（避免过大）
  maxWords: {
    core: 10000,      // 核心词库最多1万词
    advanced: 8000,   // 高级词库最多8千词
    frequency: 20000  // 词频词库最多2万词
  },

  // 柯林斯星级过滤（可选）
  minCollins: 0  // 最小柯林斯星级（0 = 不限制）
};

// 统计信息
const stats = {
  totalLines: 0,
  processedWords: 0,
  skippedWords: 0,
  core: 0,
  advanced: 0,
  frequency: 0,
  multiTag: 0,
  tagDistribution: {},
  errors: []
};

/**
 * 解析 CSV 行
 */
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());

  return fields;
}

/**
 * 解析 ECDICT 行数据
 */
function parseECDICTEntry(fields) {
  if (fields.length < 11) {
    return null;
  }

  const [word, phonetic, definition, translation, pos, collins, oxford, tag, bnc, frq, exchange] = fields;

  return {
    word: word.toLowerCase().trim(),
    phonetic: phonetic.trim(),
    definition: definition.trim(),
    translation: translation.trim(),
    pos: pos.trim(),
    collins: parseInt(collins) || 0,
    oxford: parseInt(oxford) || 0,
    tag: tag.trim(),
    bnc: parseInt(bnc) || 0,
    frq: parseInt(frq) || 0,
    exchange: exchange.trim()
  };
}

/**
 * 解析标签字符串为数组
 */
function parseTags(tagString) {
  if (!tagString) return [];
  return tagString.toLowerCase().split(/\s+/).filter(t => t.length > 0);
}

/**
 * 判断词是否属于核心词库
 */
function isCoreWord(tags) {
  return tags.some(tag => CONFIG.coreTags.includes(tag));
}

/**
 * 判断词是否属于高级词库
 */
function isAdvancedWord(tags) {
  return tags.some(tag => CONFIG.advancedTags.includes(tag));
}

/**
 * 获取词频级别
 */
function getFrequencyTier(frequency) {
  const tiers = Object.keys(CONFIG.frequencyTiers)
    .map(Number)
    .sort((a, b) => a - b);

  for (const tier of tiers) {
    if (frequency <= tier) {
      return CONFIG.frequencyTiers[tier];
    }
  }

  return null;
}

/**
 * 统计标签分布
 */
function updateTagStats(tags) {
  tags.forEach(tag => {
    stats.tagDistribution[tag] = (stats.tagDistribution[tag] || 0) + 1;
  });
}

/**
 * 创建词条数据
 */
function createWordEntry(entry, tags) {
  const wordData = {
    tags: tags,
    frequency: entry.bnc || entry.frq || 0
  };

  // 添加柯林斯星级（如果有）
  if (entry.collins > 0) {
    wordData.collins = entry.collins;
  }

  // 添加牛津标记（如果有）
  if (entry.oxford > 0) {
    wordData.oxford = entry.oxford;
  }

  return wordData;
}

/**
 * 主处理函数
 */
async function processECDICT(inputFile, outputDir) {
  console.log('🚀 Starting ECDICT conversion (Unified Format)...');
  console.log(`📂 Input: ${inputFile}`);
  console.log(`📂 Output: ${outputDir}`);
  console.log('');

  // 初始化词库数据结构
  const coreVocab = {
    meta: {
      name: 'Core Vocabulary',
      version: '1.0.0',
      type: 'unified',
      description: 'Core vocabulary including CET-4/6, Kaoyan, and common TOEFL/IELTS words',
      source: 'ECDICT',
      sourceUrl: 'https://github.com/skywind3000/ECDICT',
      license: 'MIT License',
      copyright: 'Copyright (c) skywind3000',
      generatedAt: new Date().toISOString(),
      tags: CONFIG.coreTags,
      wordCount: 0
    },
    words: {}
  };

  const advancedVocab = {
    meta: {
      name: 'Advanced Vocabulary',
      version: '1.0.0',
      type: 'unified',
      description: 'Advanced vocabulary including GRE and rare words',
      source: 'ECDICT',
      sourceUrl: 'https://github.com/skywind3000/ECDICT',
      license: 'MIT License',
      copyright: 'Copyright (c) skywind3000',
      generatedAt: new Date().toISOString(),
      tags: CONFIG.advancedTags,
      wordCount: 0
    },
    words: {}
  };

  const frequencyVocab = {
    meta: {
      name: 'Frequency Vocabulary',
      version: '1.0.0',
      type: 'frequency',
      description: 'Top 20,000 most frequent English words (BNC corpus)',
      source: 'ECDICT',
      sourceUrl: 'https://github.com/skywind3000/ECDICT',
      license: 'MIT License',
      copyright: 'Copyright (c) skywind3000',
      generatedAt: new Date().toISOString(),
      wordCount: 0
    },
    words: {}
  };

  // 创建读取流
  const fileStream = fs.createReadStream(inputFile, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isFirstLine = true;

  for await (const line of rl) {
    stats.totalLines++;

    // 跳过表头
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }

    // 进度显示
    if (stats.totalLines % 10000 === 0) {
      process.stdout.write(`\r⏳ Processing: ${stats.totalLines.toLocaleString()} lines, ${stats.processedWords.toLocaleString()} words extracted`);
    }

    try {
      // 解析行
      const fields = parseCSVLine(line);
      const entry = parseECDICTEntry(fields);

      if (!entry || !entry.word) {
        stats.skippedWords++;
        continue;
      }

      // 解析标签
      const tags = parseTags(entry.tag);

      // 如果没有标签且词频很低，跳过
      if (tags.length === 0 && entry.bnc === 0 && entry.frq === 0) {
        stats.skippedWords++;
        continue;
      }

      // 柯林斯星级过滤
      if (tags.length > 0 && CONFIG.minCollins > 0 && entry.collins < CONFIG.minCollins) {
        stats.skippedWords++;
        continue;
      }

      // 创建词条数据
      const wordData = createWordEntry(entry, tags);

      // 统计
      if (tags.length > 1) {
        stats.multiTag++;
      }
      updateTagStats(tags);

      // 分配到不同词库
      let added = false;

      // 1. 核心词库
      if (tags.length > 0 && isCoreWord(tags)) {
        if (stats.core < CONFIG.maxWords.core) {
          coreVocab.words[entry.word] = wordData;
          stats.core++;
          added = true;
        }
      }
      // 2. 高级词库（如果不在核心词库中）
      else if (tags.length > 0 && isAdvancedWord(tags)) {
        if (stats.advanced < CONFIG.maxWords.advanced) {
          advancedVocab.words[entry.word] = wordData;
          stats.advanced++;
          added = true;
        }
      }
      // 3. 有标签但不在核心/高级的，也加入核心词库（TOEFL/IELTS等）
      else if (tags.length > 0) {
        if (stats.core < CONFIG.maxWords.core) {
          coreVocab.words[entry.word] = wordData;
          stats.core++;
          added = true;
        }
      }

      // 4. 词频词库（高频词）
      const frequency = entry.bnc || entry.frq || 0;
      if (frequency > 0 && frequency <= 20000) {
        if (stats.frequency < CONFIG.maxWords.frequency) {
          const tier = getFrequencyTier(frequency);
          if (tier) {
            frequencyVocab.words[entry.word] = {
              rank: frequency,
              tier: tier,
              tags: tags,
              collins: entry.collins || 0
            };
            stats.frequency++;
          }
        }
      }

      if (added) {
        stats.processedWords++;
      } else if (frequency === 0) {
        stats.skippedWords++;
      }

    } catch (error) {
      stats.errors.push(`Line ${stats.totalLines}: ${error.message}`);
    }
  }

  console.log('\n');
  console.log('✅ Processing complete!');
  console.log('');

  // 更新元数据
  coreVocab.meta.wordCount = Object.keys(coreVocab.words).length;
  advancedVocab.meta.wordCount = Object.keys(advancedVocab.words).length;
  frequencyVocab.meta.wordCount = Object.keys(frequencyVocab.words).length;

  // 保存词库文件
  console.log('💾 Saving vocabulary files...');

  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 保存核心词库
  const coreFile = path.join(outputDir, 'vocabulary-core.json');
  fs.writeFileSync(coreFile, JSON.stringify(coreVocab, null, 2), 'utf8');
  const coreSize = (fs.statSync(coreFile).size / 1024).toFixed(0);
  console.log(`  ✓ vocabulary-core.json (${coreVocab.meta.wordCount.toLocaleString()} words, ${coreSize}KB)`);

  // 保存高级词库
  const advancedFile = path.join(outputDir, 'vocabulary-advanced.json');
  fs.writeFileSync(advancedFile, JSON.stringify(advancedVocab, null, 2), 'utf8');
  const advancedSize = (fs.statSync(advancedFile).size / 1024).toFixed(0);
  console.log(`  ✓ vocabulary-advanced.json (${advancedVocab.meta.wordCount.toLocaleString()} words, ${advancedSize}KB)`);

  // 保存词频词库
  const frequencyFile = path.join(outputDir, 'vocabulary-frequency.json');
  fs.writeFileSync(frequencyFile, JSON.stringify(frequencyVocab, null, 2), 'utf8');
  const frequencySize = (fs.statSync(frequencyFile).size / 1024).toFixed(0);
  console.log(`  ✓ vocabulary-frequency.json (${frequencyVocab.meta.wordCount.toLocaleString()} words, ${frequencySize}KB)`);

  console.log('');
  console.log('📊 Statistics:');
  console.log(`  Total lines processed: ${stats.totalLines.toLocaleString()}`);
  console.log(`  Words extracted: ${stats.processedWords.toLocaleString()}`);
  console.log(`  Words skipped: ${stats.skippedWords.toLocaleString()}`);
  console.log(`  Multi-tag words: ${stats.multiTag.toLocaleString()}`);
  console.log('');
  console.log('  Distribution:');
  console.log(`    Core vocabulary: ${stats.core.toLocaleString()} words`);
  console.log(`    Advanced vocabulary: ${stats.advanced.toLocaleString()} words`);
  console.log(`    Frequency vocabulary: ${stats.frequency.toLocaleString()} words`);

  console.log('');
  console.log('  Tag distribution:');
  const sortedTags = Object.entries(stats.tagDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  sortedTags.forEach(([tag, count]) => {
    console.log(`    ${tag.padEnd(10)}: ${count.toLocaleString()} words`);
  });

  if (stats.errors.length > 0) {
    console.log('');
    console.log(`⚠️  ${stats.errors.length} errors occurred:`);
    stats.errors.slice(0, 10).forEach(err => console.log(`  ${err}`));
    if (stats.errors.length > 10) {
      console.log(`  ... and ${stats.errors.length - 10} more`);
    }
  }

  console.log('');
  console.log('🎉 Conversion complete!');
  console.log('');
  console.log('📝 Data Format:');
  console.log('  {');
  console.log('    "abandon": {');
  console.log('      "tags": ["cet4", "cet6", "ky", "toefl", "ielts", "gre"],');
  console.log('      "frequency": 5234,');
  console.log('      "collins": 4');
  console.log('    }');
  console.log('  }');
}

// 主程序
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node convert-ecdict-unified.js <input-csv> <output-dir>');
    console.error('');
    console.error('Example:');
    console.error('  node convert-ecdict-unified.js ecdict.csv ../src/data/vocabularies');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputDir = args[1];

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }

  processECDICT(inputFile, outputDir).catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = { processECDICT };
