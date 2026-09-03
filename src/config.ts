export const siteConfig = {
  name: 'Your Name',
  title: "Your Name's Portfolio",
  email: 'email@example.com',
  linkedinLabel: 'LinkedIn',
  linkedinUrl: 'https://www.linkedin.com/in/your-name',
};

export function withBase(path = '/') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
