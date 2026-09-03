export const siteConfig = {
  name: 'Micah Rodriguez',
  title: "Micah Rodriguez's Portfolio",
  email: 'micahrodriguezbiz@gmail.com',
  linkedinLabel: 'LinkedIn',
  linkedinUrl: 'https://www.linkedin.com/in/micah-rodriguez-business',
};

export function withBase(path = '/') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
