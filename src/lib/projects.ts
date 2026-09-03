import type { ImageMetadata } from 'astro';

export interface ProjectData {
  title: string;
  year: number;
  disciplines: string[];
  company: string;
  hidden: boolean;
  description: string;
  imageAlts: Record<string, string>;
}

export interface ProjectImage {
  src: ImageMetadata;
  filename: string;
  alt: string;
}

export interface Project {
  slug: string;
  data: ProjectData;
  images: ProjectImage[];
}

interface ProjectModule {
  frontmatter: Record<string, unknown>;
}

const projectFiles = import.meta.glob<ProjectModule>(
  '/src/content/projects/*/project.md',
  { eager: true },
);

const imageFiles = import.meta.glob<ImageMetadata>(
  '/src/content/projects/*/*.{jpg,jpeg,png,webp,avif,gif,svg}',
  { eager: true, import: 'default' },
);

function requiredString(value: unknown, field: string, source: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${source}: frontmatter field "${field}" must be a non-empty string.`);
  }
  return value;
}

function loadProjects(): Project[] {
  return Object.entries(projectFiles).map(([filePath, module]) => {
    const slug = filePath.split('/').at(-2);
    if (!slug) throw new Error(`Could not determine the project folder for ${filePath}.`);

    const frontmatter = module.frontmatter;
    const title = requiredString(frontmatter.title, 'title', filePath);
    const company = requiredString(frontmatter.company, 'company', filePath);
    const year = Number(frontmatter.year);
    if (!Number.isFinite(year)) {
      throw new Error(`${filePath}: frontmatter field "year" must be a number.`);
    }

    if (!Array.isArray(frontmatter.disciplines) || frontmatter.disciplines.length === 0) {
      throw new Error(`${filePath}: frontmatter field "disciplines" must be a list.`);
    }

    const disciplines = frontmatter.disciplines.map((discipline) =>
      requiredString(discipline, 'disciplines', filePath),
    );
    const imageAlts =
      typeof frontmatter.imageAlts === 'object' && frontmatter.imageAlts !== null
        ? (frontmatter.imageAlts as Record<string, string>)
        : {};

    const images = Object.entries(imageFiles)
      .filter(([imagePath]) => imagePath.split('/').at(-2) === slug)
      .map(([imagePath, src]) => {
        const filename = imagePath.split('/').at(-1) ?? imagePath;
        return {
          src,
          filename,
          alt: imageAlts[filename] || `${title} — image ${filename}`,
        };
      })
      .sort((a, b) =>
        a.filename.localeCompare(b.filename, undefined, {
          numeric: true,
          sensitivity: 'base',
        }),
      );

    return {
      slug,
      data: {
        title,
        year,
        disciplines,
        company,
        hidden: frontmatter.hidden === true,
        description:
          typeof frontmatter.description === 'string' ? frontmatter.description : '',
        imageAlts,
      },
      images,
    };
  });
}

export function getVisibleProjects() {
  return loadProjects()
    .filter((project) => !project.data.hidden)
    .sort(
      (a, b) =>
        b.data.year - a.data.year ||
        a.data.title.localeCompare(b.data.title) ||
        a.slug.localeCompare(b.slug),
    );
}
