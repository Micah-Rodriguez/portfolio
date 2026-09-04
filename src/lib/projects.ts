import type { ImageMetadata, MarkdownInstance } from 'astro';

export interface ProjectData {
  title: string;
  year: number;
  disciplines: string[];
  company: string;
  tools?: string[];
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
  DescriptionContent: MarkdownInstance<Record<string, unknown>>['Content'];
  renderMarkdownDescription: boolean;
}

interface ProjectModule extends MarkdownInstance<Record<string, unknown>> {}

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

function descriptionFieldFromBody(body: string) {
  const match = body.match(/^description:\s*(.+)$/m);
  if (!match) return '';

  const value = match[1].trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'string' ? parsed : '';
    } catch {
      return value.slice(1, -1);
    }
  }

  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
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
    const body = module.rawContent().trim();
    const frontmatterDescription =
      typeof frontmatter.description === 'string' ? frontmatter.description : '';
    const bodyDescription = descriptionFieldFromBody(body);
    const description = frontmatterDescription || bodyDescription || body;
    const renderMarkdownDescription =
      frontmatterDescription === '' && bodyDescription === '' && body !== '';
    let tools: string[] | undefined;
    if (frontmatter.tools !== undefined) {
      if (!Array.isArray(frontmatter.tools)) {
        throw new Error(`${filePath}: frontmatter field "tools" must be a list.`);
      }

      tools = frontmatter.tools.map((tool) => requiredString(tool, 'tools', filePath));
    }
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
        tools,
        hidden: frontmatter.hidden === true,
        description,
        imageAlts,
      },
      images,
      DescriptionContent: module.Content,
      renderMarkdownDescription,
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
