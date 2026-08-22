// @ts-check
import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Physical AI & Humanoid Robotics',
  tagline: 'Bridging the gap between digital intelligence and physical embodiment',
  favicon: 'img/docusaurus.png',

  future: {
    v4: true,
  },
  
  customFields: {
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  },

  url: 'https://your-docusaurus-site.example.com',
  baseUrl: '/',

  organizationName: 'panaversity',
  projectName: 'physical-ai-textbook',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ur'],
    localeConfigs: {
      en: {
        htmlLang: 'en-US',
      },
      ur: {
        htmlLang: 'ur-PK',
        direction: 'rtl',
      },
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/panaversity/physical-ai-textbook/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/social-card.jpg',
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },
      navbar: {
        title: 'Physical AI',
        logo: {
          alt: 'Physical AI Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            html: '<div style="display:flex;align-items:center;gap:6px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> Textbook</div>',
          },
          {
            to: '/dashboard',
            position: 'left',
            html: '<div style="display:flex;align-items:center;gap:6px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> Dashboard</div>',
          },
          {
            type: 'html',
            position: 'right',
            value: '<button id="nav-personalize-btn" class="button button--secondary button--sm" style="display:flex; align-items:center; gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> Personalize</button>',
          },
          {
            type: 'html',
            position: 'right',
            value: '<button id="nav-translate-btn" class="button button--secondary button--sm nav-translate-btn" style="display:flex; align-items:center; gap:6px; margin-left: 12px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg> Translate</button>',
          },
          {
            type: 'html',
            position: 'right',
            value: '<button id="nav-login-btn" class="button button--primary button--sm nav-login-btn" style="margin-left:12px;">Login</button>',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Course Modules',
            items: [
              { label: 'Introduction', to: '/docs/intro' },
              { label: 'Module 1: ROS 2', to: '/docs/module-1-ros2/intro-physical-ai' },
              { label: 'Module 2: Simulation', to: '/docs/module-2-simulation/gazebo-setup' },
              { label: 'Module 3: NVIDIA Isaac', to: '/docs/module-3-nvidia-isaac/isaac-sdk-sim' },
              { label: 'Module 4: VLA & Capstone', to: '/docs/module-4-vla/humanoid-kinematics' },
            ],
          },
          {
            title: 'Resources',
            items: [
              { label: 'Hardware Requirements', to: '/docs/hardware/workstation-requirements' },
              { label: 'Assessments', to: '/docs/assessments' },
              { label: 'Portfolio', href: 'https://portfoliosarim.vercel.app/' },
            ],
          },
          {
            title: 'Community',
            items: [
              { label: 'GitHub', href: 'https://github.com/SarimArain99' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Physical AI & Humanoid Robotics Textbook. By Sarim Arain.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['python', 'bash', 'yaml'],
      },
    }),
};

export default config;
