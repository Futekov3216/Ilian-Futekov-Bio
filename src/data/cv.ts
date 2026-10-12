import type { ContactLink, Education, Profile, Role, SkillGroup, ZoneKey, ZoneMeta } from '../types';

/**
 * All CV content lives here. Edit this file to update the site —
 * components only read from it.
 */

export const profile: Profile = {
  name: 'Ilian Futekov',
  role: 'JavaScript Developer · React & TypeScript',
  site: 'https://futekov3216.github.io',
  email: 'ilianfutekov3216@gmail.com',
  location: 'Sofia, Bulgaria',
  intro: 'JavaScript developer with 10+ years on the web, specialized in building modern applications with React and TypeScript.',
  bio: 'Passionate about clean code, innovative solutions, and leveraging AI-assisted development to improve productivity, explore new ideas, and build better software.',
  facts: [
    { k: 'DISCIPLINE', v: 'JavaScript / Front-End' },
    { k: 'BASED IN', v: 'Sofia, Bulgaria' },
    { k: 'FRONT-END SINCE', v: '2016 · 10+ years' },
    { k: 'EDUCATION', v: 'BSc Information Technology' },
  ],
  linkedin: 'https://www.linkedin.com/in/ilian-futekov-12375912b/',
  github: 'https://github.com/Futekov3216',
};

export const roles: Role[] = [
  {
    role: 'JavaScript Developer',
    company: 'EGT Digital',
    dates: 'NOV 2021 — SEP 2026',
    points: [
      'Created various gambling games using ReactJS with TypeScript',
      'Built a Lottery Management System (LMS) with React, Refine, TypeScript and MUI',
      'Implemented designs from Adobe XD and Figma, tracked in Jira',
      'Git (Bitbucket) for version control; CI/CD with Docker and Jenkins',
      'Automated various tasks with Bash scripting',
    ],
    tags: ['ReactJS', 'Redux', 'Styled-components', 'TypeScript', 'Refine', 'MUI', 'Docker', 'Jenkins', 'Bash', 'Figma', 'Jira'],
  },
  {
    role: 'Front-end developer',
    company: 'Hostopia',
    dates: 'MAY 2019 — NOV 2021',
    points: [
      'Maintained and developed a drag-and-drop site builder',
      'Worked with MooTools, ReactJS and JavaScript',
      'Developed on macOS with GitLab and Docker',
    ],
    tags: ['ReactJS', 'JavaScript', 'MooTools', 'Docker', 'GitLab', 'macOS'],
  },
  {
    role: 'JavaScript Developer',
    company: 'EGT Interactive',
    dates: 'MAY 2018 — MAY 2019',
    points: [
      'Contributed to the development of a full-stack virtual casino platform using React.js, Node.js/Express, and MongoDB.',
      'Designed and developed interactive gambling games using Vue.js, ES6, WebSockets, and SASS.',
    ],
    tags: ['Node.js', 'MongoDB', 'React.js', 'Vue.js', 'Web Sockets', 'SASS'],
  },
  {
    role: 'Front End Developer',
    company: 'Economedia',
    dates: 'JAN 2016 — NOV 2017',
    points: [
      'Converted pages from PSD to HTML with HTML, CSS, JavaScript and jQuery',
      'Worked closely with back-end developers on debugging and new pages',
      'Maintained the client side of dnevnik.bg, capital.bg and bacchus.bg',
      'Delivered projects including capital.bg/k100-2017',
      'Built rich media ad formats running through DFP',
    ],
    tags: ['HTML', 'CSS', 'JavaScript', 'jQuery', 'Linux / Ubuntu', 'SVN', 'Redmine'],
  },
  {
    role: 'Support',
    company: 'Website.bg',
    dates: 'JAN 2015 — OCT 2015',
    points: [
      'Helped customers with website issues by phone and e-mail',
      'Modified websites with HTML and CSS',
      'Created and managed Google AdWords campaigns',
    ],
    tags: ['HTML', 'CSS', 'Google AdWords'],
  },
];

export const education: Education = {
  institution: 'University of Library Studies and Information Technologies',
  degree: "Bachelor's degree",
  field: 'Information Technology',
  period: 'Sep 2009 — May 2013',
  shortPeriod: 'SEP 2009 — MAY 2013',
  courses: [
    'Computer Architectures',
    'C++',
    'C#',
    'Operating Systems',
    'Computer Networks and Communications',
    'Database design',
    'MySQL',
    'Artificial intelligence and expert systems',
    'Application software',
    'Information Management',
  ],
  facts: [
    { k: 'DEGREE', v: "Bachelor's degree" },
    { k: 'FIELD', v: 'Information Technology' },
    { k: 'PERIOD', v: 'Sep 2009 — May 2013' },
    { k: 'INSTITUTION', v: 'ULSIT, Sofia' },
  ],
};

export const skillGroups: SkillGroup[] = [
  { name: 'Frontend', items: ['JavaScript', 'ReactJS', 'TypeScript', 'Refine', 'MUI', 'Vue.js', 'HTML', 'CSS', 'SASS', 'jQuery'] },
  { name: 'Backend', items: ['Node.js', 'Express', 'MongoDB'] },
  { name: 'AI & LLMs', items: ['MCP', 'Agents', 'Agent Orchestration'] },
  { name: 'Tools & Technologies', items: ['Git', 'Docker', 'Jenkins', 'Jira', 'Figma', 'Adobe XD', 'Bash scripting', 'Linux'] },
  { name: 'Interests', items: ['Linux', 'Python', 'Firebase', 'CTFs'] },
];

export const contactLinks: ContactLink[] = [
  { k: 'GITHUB', v: '/Futekov3216', href: profile.github },
  { k: 'LINKEDIN', v: '/ilian-futekov', href: profile.linkedin },
];

/** Zones on the 900 × 600 blueprint plane, in navigation order. */
export const zones: ZoneMeta[] = [
  {
    key: 'about',
    title: 'About',
    short: 'ABOUT',
    abbr: 'ABOUT',
    label: 'ABOUT',
    tipTitle: 'About',
    tipSub: 'Bio, location, education',
    rect: { x: 60, y: 132, w: 480, h: 176 },
    height: 'c',
    introDelay: 0.2,
  },
  {
    key: 'experience',
    title: 'Experience',
    short: 'EXPERIENCE',
    abbr: 'EXP.',
    label: 'EXPERIENCE',
    tipTitle: 'Experience',
    tipSub: '5 roles · 2015 — 2026',
    rect: { x: 556, y: 132, w: 284, h: 176 },
    height: 'a',
    introDelay: 0.45,
  },
  {
    key: 'education',
    title: 'Education',
    short: 'EDUCATION',
    abbr: 'EDU.',
    label: 'EDUCATION',
    tipTitle: 'Education',
    tipSub: 'BSc Information Technology',
    rect: { x: 60, y: 324, w: 382, h: 120 },
    height: 'b',
    introDelay: 0.7,
  },
  {
    key: 'skills',
    title: 'Skills',
    short: 'SKILLS',
    abbr: 'SKILLS',
    label: 'SKILLS',
    tipTitle: 'Skills',
    tipSub: 'Frontend, backend, AI, tools',
    rect: { x: 458, y: 324, w: 382, h: 120 },
    height: 'c',
    introDelay: 0.9,
  },
  {
    key: 'contact',
    title: 'Contact',
    short: 'CONTACT',
    abbr: 'CONTACT',
    label: 'CONTACT',
    tipTitle: 'Contact',
    tipSub: 'Email, GitHub, LinkedIn',
    rect: { x: 60, y: 460, w: 780, h: 84 },
    height: 'b',
    introDelay: 1.1,
  },
];

export const zoneByKey = Object.fromEntries(zones.map((z) => [z.key, z])) as Record<ZoneKey, ZoneMeta>;
