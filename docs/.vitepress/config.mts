import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Annotate Translate',
  description: '网页文本标注与翻译 Chrome 扩展 - 开发者文档',
  lang: 'zh-CN',
  base: '/annotate-translate/',
  ignoreDeadLinks: true, // 暂时忽略死链接，后续创建所有页面后移除

  head: [
    ['link', { rel: 'icon', href: '/annotate-translate/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'keywords', content: 'Chrome Extension, Translation, Annotation, AI Translation, Provider Pattern' }]
  ],

  themeConfig: {
    logo: '/images/logo.png',

    nav: [
      { text: '指南', link: '/guide/' },
      { text: '开发文档', link: '/development/' },
      { text: 'API 参考', link: '/api/' },
      { text: '示例', link: '/recipes/' },
      { text: '设计文档', link: '/design/' },
      {
        text: '相关链接',
        items: [
          { text: 'GitHub 仓库', link: 'https://github.com/your-username/annotate-translate' },
          { text: '问题反馈', link: 'https://github.com/your-username/annotate-translate/issues' },
          { text: 'Chrome Web Store', link: '#' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '用户指南',
          items: [
            { text: '简介', link: '/guide/' },
            { text: '安装指南', link: '/guide/installation' },
            { text: '快速开始', link: '/guide/quick-start' },
            { text: '翻译功能', link: '/guide/translation' },
            { text: '标注功能', link: '/guide/annotation' },
            { text: '词汇模式', link: '/guide/vocabulary-mode' },
            { text: '配置说明', link: '/guide/settings' },
            { text: '常见问题', link: '/guide/faq' }
          ]
        }
      ],

      '/development/': [
        {
          text: '开发指南',
          items: [
            { text: '概览', link: '/development/' },
            { text: '架构概览', link: '/development/architecture' },
            { text: '快速开始', link: '/development/getting-started' },
            { text: '项目结构', link: '/development/project-structure' },
            { text: '核心概念', link: '/development/core-concepts' }
          ]
        },
        {
          text: '核心系统',
          items: [
            { text: '扩展架构', link: '/development/extension-architecture' },
            { text: '翻译服务', link: '/development/translation-service' },
            { text: '提供商系统', link: '/development/providers' },
            { text: 'AI 翻译', link: '/development/ai-translation' },
            { text: '词库系统', link: '/development/vocabulary-system' }
          ]
        },
        {
          text: '专题',
          items: [
            { text: 'UI 组件', link: '/development/ui-components' },
            { text: '设置管理', link: '/development/settings-management' },
            { text: '缓存策略', link: '/development/caching-strategy' },
            { text: '国际化', link: '/development/i18n' },
            { text: '调试指南', link: '/development/debugging' }
          ]
        }
      ],

      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '概览', link: '/api/' },
            { text: 'TranslationService', link: '/api/translation-service' },
            { text: 'VocabularyService', link: '/api/vocabulary-service' },
            { text: 'AnnotationScanner', link: '/api/annotation-scanner' },
            { text: 'CacheManager', link: '/api/cache-manager' },
            { text: '工具函数', link: '/api/utils' }
          ]
        },
        {
          text: '提供商',
          items: [
            { text: 'BaseProvider', link: '/api/providers/base-provider' },
            { text: 'Google Translate', link: '/api/providers/google' },
            { text: 'Youdao', link: '/api/providers/youdao' },
            { text: 'DeepL', link: '/api/providers/deepl' },
            { text: 'OpenAI', link: '/api/providers/openai' },
            { text: 'FreeDictionary', link: '/api/providers/freedictionary' }
          ]
        }
      ],

      '/recipes/': [
        {
          text: '实战示例',
          items: [
            { text: '概览', link: '/recipes/' },
            { text: '添加新翻译提供商', link: '/recipes/add-new-provider' },
            { text: '自定义 UI 主题', link: '/recipes/custom-ui-theme' },
            { text: '自定义词库', link: '/recipes/custom-vocabulary' },
            { text: '自定义 AI 提示词', link: '/recipes/ai-prompt-template' },
            { text: 'CORS 代理实现', link: '/recipes/cors-proxy' }
          ]
        }
      ],

      '/design/': [
        {
          text: '设计文档',
          items: [
            { text: '概览', link: '/design/' },
            { text: 'UI 设计规范', link: '/design/ui-guidelines' },
            { text: '单词本设计', link: '/design/wordbook-design' },
            { text: '数据结构设计', link: '/design/data-structures' }
          ]
        }
      ],

      '/resources/': [
        {
          text: '资源',
          items: [
            { text: '概览', link: '/resources/' },
            { text: 'ECDICT 词库', link: '/resources/ecdict' },
            { text: '术语表', link: '/resources/glossary' },
            { text: '相关链接', link: '/resources/links' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-username/annotate-translate' }
    ],

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
          }
        }
      }
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present'
    },

    editLink: {
      pattern: 'https://github.com/your-username/annotate-translate/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    outline: {
      label: '页面导航',
      level: [2, 3]
    },

    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  },

  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  }
})
