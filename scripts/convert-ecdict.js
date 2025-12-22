#!/usr/bin/env node

/**
 * ECDICT Data Converter
 *
 * Converts ECDICT CSV data to our vocabulary JSON format
 *
 * Data Source: ECDICT (https://github.com/skywind3000/ECDICT)
 * Copyright (c) skywind3000
 * Licensed under MIT License
 *
 * Usage:
 *   node convert-ecdict.js <input-csv> <output-dir>
 *
 * Example:
 *   node convert-ecdict.js ecdict.csv ../src/data/vocabularies
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 配置
const CONFIG = {
  // 要提取的词库类型
  vocabularies: {
    'cet4': { name: 'CET-4', priority: 1, tag: 'cet4' },
    'cet6': { name: 'CET-6', priority: 2, tag: 'cet6' },
    'gre': { name: 'GRE', priority: 4, tag: 'gre' },
    'toefl': { name: 'TOEFL', priority: 3, tag: 'toefl' },
    'ielts': { name: 'IELTS', priority: 3, tag: 'ielts' },
    'kaoyan': { name: '考研', priority: 2, tag: '考研' },
  },

  // 柯林斯星级词库
  collins: {
    1: 'Collins 1-star',
    2: 'Collins 2-star',
    3: 'Collins 3-star',
    4: 'Collins 4-star',
    5: 'Collins 5-star'
  },

  // 词频分级（基于 BNC）
  frequency: {
    1000: 'Top 1000',
    3000: 'Top 3000',
    5000: 'Top 5000',
    10000: 'Top 10000',
    20000: 'Top 20000'
  },

  // 最大词条数限制（避免文件过大）
  maxWords: {
    cet4: 5000,
    cet6: 7000,
    gre: 8000,
    toefl: 8000,
    ielts: 8000,
    kaoyan: 6000,
    collins: 10000,
    frequency: 20000
  }
};

// 统计信息
const stats = {
  totalLines: 0,
  processedWords: 0,
  skippedWords: 0,
  vocabularies: {},
  errors: []
};

/**
 * 解析 CSV 行
 */
function parseCSVLine(line) {
  // ECDICT CSV 格式: word,phonetic,definition,translation,pos,collins,oxford,tag,bnc,frq,exchange,etc.
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);

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
    word: word.trim().toLowerCase(),
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
 * 检查词是否属于某个词库
 */
function belongsToVocabulary(entry, vocabKey) {
  const vocab = CONFIG.vocabularies[vocabKey];
  if (!vocab) return false;

  // 检查 tag 字段
  if (entry.tag) {
    const tags = entry.tag.toLowerCase().split(/\s+/);
    if (tags.includes(vocab.tag.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * 获取柯林斯级别
 */
function getCollinsLevel(entry) {
  if (entry.collins >= 1 && entry.collins <= 5) {
    return entry.collins;
  }
  return 0;
}

/**
 * 获取词频级别
 */
function getFrequencyLevel(entry) {
  const freq = entry.bnc || entry.frq || 0;

  if (freq > 0 && freq <= 1000) return 1000;
  if (freq > 1000 && freq <= 3000) return 3000;
  if (freq > 3000 && freq <= 5000) return 5000;
  if (freq > 5000 && freq <= 10000) return 10000;
  if (freq > 10000 && freq <= 20000) return 20000;

  return 0;
}

/**
 * 主处理函数
 */
async function processECDICT(inputFile, outputDir) {
  console.log('🚀 Starting ECDICT conversion...');
  console.log(`📂 Input: ${inputFile}`);
  console.log(`📂 Output: ${outputDir}`);
  console.log('');

  // 初始化词库数据结构
  const vocabularies = {};

  for (const key in CONFIG.vocabularies) {
    vocabularies[key] = {
      meta: {
        name: CONFIG.vocabularies[key].name,
        version: '1.0.0',
        type: 'level',
        source: 'ECDICT',
        sourceUrl: 'https://github.com/skywind3000/ECDICT',
        license: 'MIT License',
        copyright: 'Copyright (c) skywind3000',
        generatedAt: new Date().toISOString(),
        description: `${CONFIG.vocabularies[key].name} vocabulary from ECDICT`
      },
      words: {}
    };
    stats.vocabularies[key] = 0;
  }

  // 柯林斯词库
  const collinsVocab = {
    meta: {
      name: 'Collins Star Ratings',
      version: '1.0.0',
      type: 'level',
      source: 'ECDICT',
      sourceUrl: 'https://github.com/skywind3000/ECDICT',
      license: 'MIT License',
      copyright: 'Copyright (c) skywind3000',
      generatedAt: new Date().toISOString(),
      description: 'Collins star rating vocabulary (1-5 stars)'
    },
    words: {}
  };

  // 词频词库
  const frequencyVocab = {
    meta: {
      name: 'Word Frequency (BNC)',
      version: '1.0.0',
      type: 'frequency',
      source: 'ECDICT',
      sourceUrl: 'https://github.com/skywind3000/ECDICT',
      license: 'MIT License',
      copyright: 'Copyright (c) skywind3000',
      generatedAt: new Date().toISOString(),
      description: 'Word frequency based on BNC corpus'
    },
    words: {}
  };

  stats.vocabularies['collins'] = 0;
  stats.vocabularies['frequency'] = 0;

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
      process.stdout.write(`\r⏳ Processing: ${stats.totalLines} lines, ${stats.processedWords} words extracted`);
    }

    try {
      // 解析行
      const fields = parseCSVLine(line);
      const entry = parseECDICTEntry(fields);

      if (!entry || !entry.word) {
        stats.skippedWords++;
        continue;
      }

      // 检查是否属于各个词库
      let addedToAny = false;

      for (const key in CONFIG.vocabularies) {
        if (belongsToVocabulary(entry, key)) {
          const vocab = vocabularies[key];

          // 检查是否超过最大数量
          if (stats.vocabularies[key] >= CONFIG.maxWords[key]) {
            continue;
          }

          vocab.words[entry.word] = {
            level: key,
            frequency: entry.bnc || entry.frq || 0,
            collins: entry.collins || 0
          };

          stats.vocabularies[key]++;
          addedToAny = true;
        }
      }

      // 添加到柯林斯词库
      const collinsLevel = getCollinsLevel(entry);
      if (collinsLevel > 0 && stats.vocabularies['collins'] < CONFIG.maxWords['collins']) {
        collinsVocab.words[entry.word] = {
          level: `collins${collinsLevel}`,
          stars: collinsLevel,
          frequency: entry.bnc || entry.frq || 0
        };
        stats.vocabularies['collins']++;
        addedToAny = true;
      }

      // 添加到词频词库
      const freqLevel = getFrequencyLevel(entry);
      if (freqLevel > 0 && stats.vocabularies['frequency'] < CONFIG.maxWords['frequency']) {
        frequencyVocab.words[entry.word] = {
          rank: entry.bnc || entry.frq || 0,
          level: `top${freqLevel}`,
          collins: entry.collins || 0
        };
        stats.vocabularies['frequency']++;
        addedToAny = true;
      }

      if (addedToAny) {
        stats.processedWords++;
      } else {
        stats.skippedWords++;
      }

    } catch (error) {
      stats.errors.push(`Line ${stats.totalLines}: ${error.message}`);
    }
  }

  console.log('\n');
  console.log('✅ Processing complete!');
  console.log('');

  // 保存词库文件
  console.log('💾 Saving vocabulary files...');

  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 保存各个词库
  for (const key in vocabularies) {
    const vocab = vocabularies[key];
    const outputFile = path.join(outputDir, `${key}.json`);
    vocab.meta.wordCount = Object.keys(vocab.words).length;

    fs.writeFileSync(outputFile, JSON.stringify(vocab, null, 2), 'utf8');
    console.log(`  ✓ ${key}.json (${vocab.meta.wordCount} words)`);
  }

  // 保存柯林斯词库
  const collinsFile = path.join(outputDir, 'collins.json');
  collinsVocab.meta.wordCount = Object.keys(collinsVocab.words).length;
  fs.writeFileSync(collinsFile, JSON.stringify(collinsVocab, null, 2), 'utf8');
  console.log(`  ✓ collins.json (${collinsVocab.meta.wordCount} words)`);

  // 保存词频词库
  const frequencyFile = path.join(outputDir, 'frequency-bnc.json');
  frequencyVocab.meta.wordCount = Object.keys(frequencyVocab.words).length;
  fs.writeFileSync(frequencyFile, JSON.stringify(frequencyVocab, null, 2), 'utf8');
  console.log(`  ✓ frequency-bnc.json (${frequencyVocab.meta.wordCount} words)`);

  console.log('');
  console.log('📊 Statistics:');
  console.log(`  Total lines processed: ${stats.totalLines}`);
  console.log(`  Words extracted: ${stats.processedWords}`);
  console.log(`  Words skipped: ${stats.skippedWords}`);
  console.log('');
  console.log('  Vocabulary breakdown:');
  for (const key in stats.vocabularies) {
    console.log(`    ${key}: ${stats.vocabularies[key]} words`);
  }

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
}

// 主程序
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node convert-ecdict.js <input-csv> <output-dir>');
    console.error('');
    console.error('Example:');
    console.error('  node convert-ecdict.js ecdict.csv ../src/data/vocabularies');
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
