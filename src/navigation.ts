import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Home',
      href: getPermalink('/'),
    },
    {
      text: 'Blog',
      href: getBlogPermalink(),
    },
    {
      text: 'Projects',
      href: getPermalink('/projects'),
    },
    {
      text: 'About',
      href: getPermalink('/about'),
    },
  ],
  actions: [],
};

export const footerData = {
  links: [
    {
      title: 'Topics',
      links: [
        { text: 'DevOps', href: getPermalink('devops', 'category') },
        { text: 'HashiCorp', href: getPermalink('hashicorp', 'category') },
        { text: 'VMware', href: getPermalink('vmware', 'category') },
        { text: 'Security', href: getPermalink('security', 'tag') },
        { text: 'Automation', href: getPermalink('automation', 'tag') },
      ],
    },
    {
      title: 'Site',
      links: [
        { text: 'Home', href: getPermalink('/') },
        { text: 'Blog', href: getBlogPermalink() },
        { text: 'About', href: getPermalink('/about') },
        { text: 'RSS Feed', href: getAsset('/rss.xml') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'X / Twitter', icon: 'tabler:brand-x', href: 'https://twitter.com/greenreedtech' },
    { ariaLabel: 'LinkedIn', icon: 'tabler:brand-linkedin', href: 'https://www.linkedin.com/in/martezreed/' },
    { ariaLabel: 'GitHub', icon: 'tabler:brand-github', href: 'https://github.com/martezr' },
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
  ],
  footNote: `
    &copy; Green Reed Technology · All rights reserved.
  `,
};
