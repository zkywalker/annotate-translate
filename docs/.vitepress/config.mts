import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Annotate Translate',
  description: '网页文本标注与翻译 Chrome 扩展 - 开发者文档',
  lang: 'zh-CN',
  base: '/annotate-translate/',
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', href: '/annotate-translate/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'keywords', content: 'Chrome Extension, Translation, Annotation, AI Translation, Provider Pattern' }]
  ],

  themeConfig: {
    logo: '/images/logo.svg',

    nav: [
      { text: '指南', link: '/guide/' },
      { text: '开发文档', link: '/development/' },
      { text: 'API 参考', link: '/api/' },
      { text: '示例', link: '/recipes/' },
      { text: '贡献', link: '/contributing' },
      {
        text: '相关链接',
        items: [
          { text: 'GitHub 仓库', link: 'https://github.com/zkywalker/annotate-translate' },
          { text: '问题反馈', link: 'https://github.com/zkywalker/annotate-translate/issues' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '用户指南',
          items: [
            { text: '简介', link: '/guide/' },
            { text: '快速开始', link: '/guide/quick-start' }
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
            { text: '翻译服务', link: '/development/translation-service' },
            { text: '提供商系统', link: '/development/providers' },
            { text: 'AI 翻译', link: '/development/ai-translation' },
            { text: '词库系统', link: '/development/vocabulary-system' }
          ]
        }
      ],

      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '概览', link: '/api/' },
            { text: 'TranslationService', link: '/api/translation-service' }
          ]
        }
      ],

      '/recipes/': [
        {
          text: '实战示例',
          items: [
            { text: '概览', link: '/recipes/' },
            { text: '添加新翻译提供商', link: '/recipes/add-new-provider' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/zkywalker/annotate-translate' }
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
      pattern: 'https://github.com/zkywalker/annotate-translate/edit/main/docs/:path',
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
