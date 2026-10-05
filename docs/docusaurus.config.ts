import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'CritiPlay Docs',
  tagline: 'Dokumentasi resmi CritiPlay — Platform Review Game',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  // Ganti sesuai domain/hosting kamu nanti
  url: 'https://docs.critiplay.com',
  baseUrl: '/',

  // Ganti sesuai username/org GitHub kamu
  organizationName: 'critiplay',
  projectName: 'critiplay-docs',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'id',
    locales: ['id'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/critiplay/critiplay-docs/tree/main/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/critiplay/critiplay-docs/tree/main/',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/critiplay-social-card.png',
    navbar: {
      title: 'CritiPlay',
      logo: {
        alt: 'CritiPlay Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        { to: '/blog', label: 'Changelog', position: 'left' },
        {
          href: 'http://127.0.0.1:8000/scalar',
          label: 'API Reference',
          position: 'left',
        },
        {
          href: 'https://github.com/SaktiArifDwiPutra',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Getting Started', to: '/docs/getting-started' },
            { label: 'API Reference', href: 'http://127.0.0.1:8000/scalar' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'GitHub', href: 'https://github.com/SaktiArifDwiPutra' },
            { label: 'Changelog', to: '/blog' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} CritiPlay. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;